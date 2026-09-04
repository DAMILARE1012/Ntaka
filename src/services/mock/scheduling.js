import { rng } from '@/lib/prng';
import {
  generateSlots,
  availabilityGridFromSlots,
  hasConflict,
  priceFor,
  LESSON_TYPES,
  BOOKING_STATUS,
  isFreeCancellation,
  LEAD_TIME_MIN,
} from '@/lib/booking';
import { calendarDays, viewerTimezone } from '@/lib/timezone';

/**
 * Availability and bookings.
 *
 * Stands in for four tables: availability_rules, availability_exceptions, bookings and
 * (later) meeting_sessions. Everything here is in-memory and resets on reload; the shapes
 * match the schema so moving to Postgres is a query change, not a redesign.
 *
 * The important property: a teacher's weekly rules are the ONLY source of availability.
 * The grid on their profile and the slots in the booking picker are both derived from
 * them, so the two can never contradict each other.
 */

/* -------------------------------------------------------------- weekly rules */

/** Wall-clock windows, in the teacher's own timezone, per availability shape. */
const SHAPE_WINDOWS = {
  morning: [
    [7 * 60, 12 * 60],
    [12 * 60, 14 * 60],
  ],
  evening: [
    [16 * 60, 21 * 60],
    [21 * 60, 23 * 60],
  ],
  mixed: [
    [9 * 60, 13 * 60],
    [15 * 60, 20 * 60],
  ],
  overnight: [
    [20 * 60, 24 * 60],
    [5 * 60, 9 * 60],
  ],
};

/**
 * A believable working week: most teachers work 4–6 days, with a main window and
 * sometimes a second. Deterministic, so a teacher's week never changes between reloads.
 */
export function buildRules(teacherId, shape) {
  const r = rng(`rules:${teacherId}`);
  const [primary, secondary] = SHAPE_WINDOWS[shape] ?? SHAPE_WINDOWS.mixed;
  const rules = [];

  for (let weekday = 0; weekday < 7; weekday += 1) {
    const isWeekend = weekday === 0 || weekday === 6;
    if (r.next() > (isWeekend ? 0.55 : 0.82)) continue;

    // Trim the edges a little so not every day is identical.
    const start = primary[0] + r.pick([0, 0, 30, 60]);
    const end = primary[1] - r.pick([0, 0, 30]);
    if (end - start >= 60) {
      rules.push({ id: `${teacherId}-w${weekday}-a`, teacherId, weekday, startMinute: start, endMinute: end });
    }

    if (secondary && r.chance(0.35)) {
      rules.push({
        id: `${teacherId}-w${weekday}-b`,
        teacherId,
        weekday,
        startMinute: secondary[0],
        endMinute: secondary[1],
      });
    }
  }

  return rules;
}

/* ------------------------------------------------------------------- storage */

/** teacherId -> exception rows */
const exceptionsByTeacher = new Map();
/** all bookings, newest last */
const bookings = [];
let bookingCounter = 0;

/** Derived grids are recomputed only when a teacher's calendar actually changes. */
const gridCache = new Map();
const invalidate = (teacherId) => {
  [...gridCache.keys()]
    .filter((key) => key.startsWith(`${teacherId}|`))
    .forEach((key) => gridCache.delete(key));
};

export const listRules = (teacher) => teacher.availabilityRules ?? [];
export const listExceptions = (teacherId) => exceptionsByTeacher.get(teacherId) ?? [];

export function saveRules(teacher, rules) {
  // eslint-disable-next-line no-param-reassign
  teacher.availabilityRules = rules.map((rule, i) => ({
    id: rule.id ?? `${teacher.id}-r${i}`,
    teacherId: teacher.id,
    weekday: rule.weekday,
    startMinute: rule.startMinute,
    endMinute: rule.endMinute,
  }));
  invalidate(teacher.id);
  return teacher.availabilityRules;
}

export function addException(teacherId, exception) {
  const list = exceptionsByTeacher.get(teacherId) ?? [];
  const row = { id: `exc-${teacherId}-${list.length}-${Date.now()}`, teacherId, ...exception };
  exceptionsByTeacher.set(teacherId, [...list, row]);
  invalidate(teacherId);
  return row;
}

export function removeException(teacherId, exceptionId) {
  exceptionsByTeacher.set(
    teacherId,
    listExceptions(teacherId).filter((e) => e.id !== exceptionId),
  );
  invalidate(teacherId);
}

/* --------------------------------------------------------------- derivations */

const teacherBookings = (teacherId) => bookings.filter((b) => b.teacherId === teacherId);

/** Bookable start times for a teacher, already filtered against their calendar. */
export function slotsFor(teacher, { durationMin = 60, days = 14, from = new Date() } = {}) {
  return generateSlots({
    rules: listRules(teacher),
    exceptions: listExceptions(teacher.id),
    bookings: teacherBookings(teacher.id),
    timezone: teacher.timezone,
    durationMin,
    days,
    from,
    leadTimeMin: LEAD_TIME_MIN,
  });
}

/**
 * The coarse grid on cards and profiles, in the viewer's timezone.
 * Same rules, same bookings, same answer as the picker.
 */
export function availabilityGridFor(teacher, viewerTz = viewerTimezone(), days = 7) {
  const cacheKey = `${teacher.id}|${viewerTz}|${days}`;
  if (gridCache.has(cacheKey)) return gridCache.get(cacheKey);

  const slots = slotsFor(teacher, { durationMin: 60, days });
  const grid = availabilityGridFromSlots(slots, viewerTz, calendarDays(viewerTz, days));
  const result = { grid, slots };
  gridCache.set(cacheKey, result);
  return result;
}

/* ------------------------------------------------------------------ bookings */

export function listBookings({ learnerId, teacherId, statuses, from, to } = {}) {
  return bookings
    .filter((b) => {
      if (learnerId && b.learnerId !== learnerId) return false;
      if (teacherId && b.teacherId !== teacherId) return false;
      if (statuses?.length && !statuses.includes(b.status)) return false;
      if (from && new Date(b.startsAt) < new Date(from)) return false;
      if (to && new Date(b.startsAt) > new Date(to)) return false;
      return true;
    })
    .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
}

export const readBooking = (id) => bookings.find((b) => b.id === id) ?? null;

/**
 * Create a booking.
 *
 * The conflict check is repeated here even though the picker already filtered the slot
 * out: between rendering and clicking, someone else may have taken it. In production
 * this check belongs in a transaction with a uniqueness constraint on
 * (teacher_id, starts_at) — the client-side filter is a convenience, this is the rule.
 */
export function createBooking({ learner, teacher, startsAt, lessonType = 'standard' }) {
  const type = LESSON_TYPES[lessonType] ?? LESSON_TYPES.standard;
  const startMs = new Date(startsAt).getTime();

  if (Number.isNaN(startMs)) return { error: 'That start time is not valid.' };
  if (startMs < Date.now() + LEAD_TIME_MIN * 60000) {
    return { error: 'Lessons must be booked at least two hours ahead.' };
  }
  if (hasConflict(startMs, type.durationMin, teacherBookings(teacher.id))) {
    return { error: 'Someone just took that slot. Pick another time.' };
  }
  if (
    type.once &&
    bookings.some(
      (b) =>
        b.learnerId === learner.id &&
        b.teacherId === teacher.id &&
        b.lessonType === 'trial' &&
        b.status !== BOOKING_STATUS.CANCELLED,
    )
  ) {
    return { error: 'You have already had a trial lesson with this teacher.' };
  }

  bookingCounter += 1;
  const booking = {
    id: `bk-${bookingCounter}-${Date.now().toString(36)}`,
    learnerId: learner.id,
    learnerName: learner.displayName,
    teacherId: teacher.id,
    teacherName: teacher.name,
    languageId: teacher.languageId,
    languageName: teacher.languageName,
    iso: teacher.iso,
    startsAt: new Date(startMs).toISOString(),
    endsAt: new Date(startMs + type.durationMin * 60000).toISOString(),
    durationMin: type.durationMin,
    lessonType: type.id,
    lessonLabel: type.label,
    price: priceFor(teacher, type.id),
    currency: 'USD',
    teacherTimezone: teacher.timezone,
    // Payment slots in here: authorise on create, capture after the lesson completes.
    paymentStatus: 'not_collected',
    status: BOOKING_STATUS.CONFIRMED,
    createdAt: new Date().toISOString(),
  };

  bookings.push(booking);
  invalidate(teacher.id);
  return { data: booking };
}

export function cancelBooking({ bookingId, userId }) {
  const booking = readBooking(bookingId);
  if (!booking) return { error: 'That booking no longer exists.' };
  if (booking.learnerId !== userId && booking.teacherId !== userId) {
    return { error: 'That booking is not yours to cancel.' };
  }
  if (booking.status === BOOKING_STATUS.CANCELLED) {
    return { error: 'That booking is already cancelled.' };
  }

  booking.status = BOOKING_STATUS.CANCELLED;
  booking.cancelledAt = new Date().toISOString();
  booking.refundable = isFreeCancellation(booking.startsAt);
  invalidate(booking.teacherId);
  return { data: booking };
}

/** A few lessons already on the books, so the dashboards are not empty on first load. */
export function seedBookings({ learner, teachers }) {
  if (bookings.length) return;

  teachers.slice(0, 3).forEach((teacher, i) => {
    const [slot] = slotsFor(teacher, { durationMin: i === 0 ? 30 : 60, days: 12 }).slice(i * 2, i * 2 + 1);
    if (!slot) return;
    createBooking({
      learner,
      teacher,
      startsAt: slot.startsAt,
      lessonType: i === 0 ? 'trial' : 'standard',
    });
  });
}

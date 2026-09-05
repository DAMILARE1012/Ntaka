import { oneToOnePrice } from '@/lib/pricing';
import {
  calendarDays,
  zonedTimeToUtc,
  zonedDateKey,
  zonedMinuteOfDay,
  minutesToClock,
} from '@/lib/timezone';

/**
 * Turning availability into bookable slots.
 *
 * Availability is stored as weekly *rules* plus dated *exceptions* — never as generated
 * slot rows. "Tuesdays 18:00–21:00, except 3 June" stays two small records forever;
 * materialising every slot would mean an unbounded table and a migration every time a
 * teacher changes their week.
 *
 * Slots are derived on read, here, by one pure function. The teacher's profile grid and
 * the learner's booking picker both call it, so they cannot disagree.
 */

/** The four-hour bands the availability grid is drawn in. */
export const TIME_BLOCKS = [
  { id: 0, label: '00 - 04' },
  { id: 1, label: '04 - 08' },
  { id: 2, label: '08 - 12' },
  { id: 3, label: '12 - 16' },
  { id: 4, label: '16 - 20' },
  { id: 5, label: '20 - 24' },
];

export const LESSON_TYPES = {
  trial: { id: 'trial', label: 'Trial lesson', durationMin: 30, once: true },
  standard: { id: 'standard', label: 'Single lesson', durationMin: 60 },
  long: { id: 'long', label: 'Extended lesson', durationMin: 90 },
};

export const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

/** Slots start on the half hour. */
export const SLOT_GRANULARITY_MIN = 30;

/** How soon a lesson may start. Nobody wants a booking landing four minutes from now. */
export const LEAD_TIME_MIN = 120;

/** A learner may cancel free of charge until this long before the start. */
export const FREE_CANCELLATION_MIN = 24 * 60;

const overlaps = (aStart, aEnd, bStart, bEnd) => aStart < bEnd && bStart < aEnd;

const BLOCKING_STATUSES = [BOOKING_STATUS.PENDING, BOOKING_STATUS.CONFIRMED];

/** Does this candidate collide with something already on the teacher's calendar? */
export function hasConflict(startMs, durationMin, bookings = []) {
  const endMs = startMs + durationMin * 60000;
  return bookings.some((booking) => {
    if (!BLOCKING_STATUSES.includes(booking.status)) return false;
    const bookedStart = new Date(booking.startsAt).getTime();
    return overlaps(startMs, endMs, bookedStart, bookedStart + booking.durationMin * 60000);
  });
}

/**
 * Merge a day's rules and exceptions into windows of open wall-clock minutes.
 * An exception with `isAvailable: false` cuts a hole; `true` adds a window.
 */
function windowsForDay({ rules, exceptions, dateKey, weekday }) {
  const dayExceptions = exceptions.filter((e) => e.date === dateKey);

  const base = [
    ...rules
      .filter((rule) => rule.weekday === weekday)
      .map((rule) => ({ start: rule.startMinute, end: rule.endMinute })),
    ...dayExceptions
      .filter((e) => e.isAvailable)
      .map((e) => ({ start: e.startMinute, end: e.endMinute })),
  ].sort((a, b) => a.start - b.start);

  const blackouts = dayExceptions.filter((e) => !e.isAvailable);

  // Subtract each blackout from every window it touches, splitting where it lands inside.
  return blackouts.reduce((windows, blackout) => {
    const next = [];
    windows.forEach((w) => {
      if (!overlaps(w.start, w.end, blackout.startMinute, blackout.endMinute)) {
        next.push(w);
        return;
      }
      if (blackout.startMinute > w.start) next.push({ start: w.start, end: blackout.startMinute });
      if (blackout.endMinute < w.end) next.push({ start: blackout.endMinute, end: w.end });
    });
    return next;
  }, base);
}

/**
 * Every bookable start time for a teacher over the next `days` days.
 *
 * Returns UTC instants. Rendering them in the viewer's zone is the UI's job — this
 * function never touches the browser's timezone.
 */
export function generateSlots({
  rules = [],
  exceptions = [],
  bookings = [],
  timezone,
  days = 14,
  durationMin = 60,
  from = new Date(),
  leadTimeMin = LEAD_TIME_MIN,
  granularityMin = SLOT_GRANULARITY_MIN,
} = {}) {
  const earliest = from.getTime() + leadTimeMin * 60000;
  const slots = [];

  calendarDays(timezone, days, from).forEach((day) => {
    const windows = windowsForDay({
      rules,
      exceptions,
      dateKey: day.key,
      weekday: day.weekday,
    });

    windows.forEach((window) => {
      for (
        let minute = Math.ceil(window.start / granularityMin) * granularityMin;
        minute + durationMin <= window.end;
        minute += granularityMin
      ) {
        const startsAt = zonedTimeToUtc(
          {
            year: day.year,
            month: day.month,
            day: day.day,
            hour: Math.floor(minute / 60),
            minute: minute % 60,
          },
          timezone,
        );

        const startMs = startsAt.getTime();
        if (startMs < earliest) continue;
        if (hasConflict(startMs, durationMin, bookings)) continue;

        slots.push({
          startsAt: startsAt.toISOString(),
          endsAt: new Date(startMs + durationMin * 60000).toISOString(),
          durationMin,
          teacherLocalTime: minutesToClock(minute),
          teacherDateKey: day.key,
        });
      }
    });
  });

  return slots.sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
}

/** Group slots by calendar day *in the viewer's zone*, which is how the picker reads. */
export function groupSlotsByViewerDay(slots, viewerTz) {
  const map = new Map();
  slots.forEach((slot) => {
    const key = zonedDateKey(new Date(slot.startsAt), viewerTz);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(slot);
  });
  return [...map.entries()].map(([key, items]) => ({ key, slots: items }));
}

/**
 * The coarse 7×6 grid shown on teacher cards and profiles.
 * Derived from the same rules as the bookable slots, so the two can never disagree.
 */
export function availabilityGridFromSlots(slots, viewerTz, days) {
  const map = {};
  days.forEach((day) => {
    map[day.key] = [];
  });
  slots.forEach((slot) => {
    const date = new Date(slot.startsAt);
    const key = zonedDateKey(date, viewerTz);
    if (!(key in map)) return;
    const block = Math.floor(zonedMinuteOfDay(date, viewerTz) / 240);
    if (!map[key].includes(block)) map[key].push(block);
  });
  return map;
}

export const isFreeCancellation = (startsAt, now = new Date()) =>
  new Date(startsAt).getTime() - now.getTime() > FREE_CANCELLATION_MIN * 60000;

export function priceFor(teacher, lessonTypeId) {
  const type = LESSON_TYPES[lessonTypeId] ?? LESSON_TYPES.standard;
  // A trial is a taster price, deliberately outside the hierarchy - see lib/pricing.js.
  if (type.id === 'trial') return teacher.trialPrice;
  return oneToOnePrice(teacher.hourlyRate, type.durationMin);
}

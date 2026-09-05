import { LANGUAGES_FULL, COUNTRIES, getLanguage, languagesByCountry } from '@/services/mock/catalog';
import { TEACHERS, TEACHERS_BY_ID } from '@/services/mock/teachers';
import { GROUP_CLASSES, CLASSES_BY_ID } from '@/services/mock/classes';
import { VIDEO_COURSES, VIDEOS_BY_ID } from '@/services/mock/videos';
import { buildTest, scoreTest } from '@/services/mock/placement';
import { levelIndex, LEVEL_CODES } from '@/lib/cefr';
import * as scheduling from '@/services/mock/scheduling';
import * as meetings from '@/services/mock/meetings';
import { LESSON_TYPES, BOOKING_STATUS, priceFor, isFreeCancellation } from '@/lib/booking';
import { viewerTimezone, formatInZone, zonedDateKey } from '@/lib/timezone';
import { calendarDays } from '@/lib/timezone';
import { recommendCourses, courseComparator } from '@/features/learning/recommend';

/**
 * In-memory query layer standing in for the Ntaka backend.
 * Every function here maps 1:1 to an endpoint in services/api.js, so swapping in a real
 * `fetchBaseQuery` later is a change to services/api.js only.
 */

const matches = (haystack, needle) =>
  !needle || haystack.toLowerCase().includes(needle.trim().toLowerCase());

const paginate = (items, page = 1, pageSize = 12) => {
  const total = items.length;
  const start = (page - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    hasMore: start + pageSize < total,
  };
};

/* ---------------------------------------------------------------- languages */

export function listLanguages({ q = '', countryId = '', region = '', featuredOnly = false } = {}) {
  return LANGUAGES_FULL.filter(
    (l) =>
      (!featuredOnly || l.featured) &&
      (!countryId || l.countryId === countryId) &&
      (!region || l.region === region) &&
      (matches(l.name, q) || matches(l.nativeName, q) || matches(l.country ?? '', q)),
  ).map((l) => ({ ...l, teacherCount: TEACHERS.filter((t) => t.languageId === l.id).length }));
}

export function readLanguage(id) {
  const language = LANGUAGES_FULL.find((l) => l.id === id);
  if (!language) return null;
  return {
    ...language,
    teacherCount: TEACHERS.filter((t) => t.languageId === id).length,
    classCount: GROUP_CLASSES.filter((c) => c.languageId === id).length,
    courseCount: VIDEO_COURSES.filter((v) => v.languageId === id).length,
    siblings: LANGUAGES_FULL.filter((l) => l.countryId === language.countryId && l.id !== id),
  };
}

export const listCountries = () => COUNTRIES;
export const listLanguagesByCountry = () => languagesByCountry();

/* ----------------------------------------------------------------- teachers */

/**
 * Teachers store weekly rules; cards and profiles want a 7-day grid and a "next open"
 * line. Both are derived here from the same rules, minus anything already booked, so
 * the preview on a card and the slots in the picker always agree.
 */
function withAvailability(teacher, viewerTz = viewerTimezone()) {
  const { grid, slots } = scheduling.availabilityGridFor(teacher, viewerTz, 7);
  const next = slots[0];
  const todayKey = zonedDateKey(new Date(), viewerTz);

  let nextAvailable = 'Message to request a time';
  if (next) {
    const when = new Date(next.startsAt);
    const time = formatInZone(when, viewerTz, { hour: '2-digit', minute: '2-digit', hour12: false });
    const dayKey = zonedDateKey(when, viewerTz);
    const tomorrowKey = calendarDays(viewerTz, 2)[1]?.key;
    if (dayKey === todayKey) nextAvailable = `Available ${time} today`;
    else if (dayKey === tomorrowKey) nextAvailable = `Available ${time} tomorrow`;
    else {
      nextAvailable = `Available ${time} ${formatInZone(when, viewerTz, { weekday: 'long' })}`;
    }
  }

  const horizon = Date.now() + 72 * 3600 * 1000;
  return {
    ...teacher,
    availability: grid,
    nextAvailable,
    slotsIn72h: slots.filter((s) => new Date(s.startsAt).getTime() <= horizon).length,
  };
}


const TEACHER_SORTS = {
  recommended: (a, b) =>
    (b.rating ?? 4.4) * Math.log10(b.lessons + 10) - (a.rating ?? 4.4) * Math.log10(a.lessons + 10),
  rating: (a, b) => (b.rating ?? 0) - (a.rating ?? 0),
  'price-asc': (a, b) => a.hourlyRate - b.hourlyRate,
  'price-desc': (a, b) => b.hourlyRate - a.hourlyRate,
  lessons: (a, b) => b.lessons - a.lessons,
  newest: (a, b) => a.lessons - b.lessons,
};

export function listTeachers({
  q = '',
  languageId = '',
  countryId = '',
  level = '',
  type = '',
  tags = [],
  maxPrice = null,
  minRating = 0,
  availableWithin72h = false,
  instantLesson = false,
  sort = 'recommended',
  page = 1,
  pageSize = 8,
} = {}) {
  const filtered = TEACHERS.filter((t) => {
    if (languageId && t.languageId !== languageId) return false;
    if (countryId && t.countryId !== countryId) return false;
    if (level && !t.levels.includes(level)) return false;
    if (type && t.type !== type) return false;
    if (tags.length && !tags.every((tag) => t.tags.includes(tag))) return false;
    if (maxPrice != null && t.hourlyRate > maxPrice) return false;
    if (minRating && (t.rating ?? 0) < minRating) return false;
    if (availableWithin72h && withAvailability(t).slotsIn72h === 0) return false;
    if (instantLesson && !t.instantLesson) return false;
    if (q && !(matches(t.name, q) || matches(t.headline, q) || matches(t.languageName, q))) {
      return false;
    }
    return true;
  }).sort(TEACHER_SORTS[sort] ?? TEACHER_SORTS.recommended);

  const pageResult = paginate(filtered, page, pageSize);
  // Only the visible page gets a derived grid - it is the expensive part.
  return { ...pageResult, items: pageResult.items.map((t) => withAvailability(t)) };
}

export function readTeacher(id) {
  const teacher = TEACHERS_BY_ID[id];
  if (!teacher) return null;
  return {
    ...withAvailability(teacher),
    language: getLanguage(teacher.languageId),
    classes: GROUP_CLASSES.filter((c) => c.teacherId === id).slice(0, 4),
    courses: VIDEO_COURSES.filter((v) => v.teacherId === id).slice(0, 3),
    similar: TEACHERS.filter((t) => t.languageId === teacher.languageId && t.id !== id).slice(0, 3),
  };
}

/* ------------------------------------------------------------ group classes */

const CLASS_SORTS = {
  soonest: (a, b) => new Date(a.startsAt) - new Date(b.startsAt),
  'price-asc': (a, b) => a.pricePerSeat - b.pricePerSeat,
  'price-desc': (a, b) => b.pricePerSeat - a.pricePerSeat,
  'seats-left': (a, b) => a.seatsLeft - b.seatsLeft,
  level: (a, b) => levelIndex(a.level) - levelIndex(b.level),
};

export function listClasses({
  q = '',
  languageId = '',
  level = '',
  topic = '',
  maxPrice = null,
  onlyAvailable = false,
  sort = 'soonest',
  page = 1,
  pageSize = 9,
} = {}) {
  const filtered = GROUP_CLASSES.filter((c) => {
    if (languageId && c.languageId !== languageId) return false;
    if (level && c.level !== level) return false;
    if (topic && c.topic !== topic) return false;
    if (maxPrice != null && c.pricePerSeat > maxPrice) return false;
    if (onlyAvailable && c.seatsLeft <= 0) return false;
    if (q && !(matches(c.title, q) || matches(c.languageName, q) || matches(c.description, q))) {
      return false;
    }
    return true;
  })
    .map((c) => ({ ...c, teacher: TEACHERS_BY_ID[c.teacherId] }))
    .sort(CLASS_SORTS[sort] ?? CLASS_SORTS.soonest);

  return paginate(filtered, page, pageSize);
}

export function readClass(id) {
  const item = CLASSES_BY_ID[id];
  if (!item) return null;
  return {
    ...item,
    teacher: TEACHERS_BY_ID[item.teacherId],
    related: GROUP_CLASSES.filter((c) => c.languageId === item.languageId && c.id !== id).slice(0, 3),
  };
}

/* ------------------------------------------------------------ interactive courses */

const VIDEO_SORTS = {
  // The default. Signed out there is no placement to work with, so this collapses to
  // popularity and rating - but it is the SAME comparator the dashboard uses, so the
  // order a visitor sees on the marketing page is the order they keep after signing in,
  // reshuffled only by evidence the test actually produced.
  recommended: courseComparator(),
  popular: (a, b) => b.enrolled - a.enrolled,
  rating: (a, b) => b.rating - a.rating,
  'price-asc': (a, b) => a.price - b.price,
  newest: (a, b) => b.updatedAt.localeCompare(a.updatedAt),
  shortest: (a, b) => a.totalMinutes - b.totalMinutes,
};

export function listVideos({
  q = '',
  languageId = '',
  level = '',
  track = '',
  openOnly = false,
  sort = 'recommended',
  page = 1,
  pageSize = 9,
} = {}) {
  const filtered = VIDEO_COURSES.filter((v) => {
    if (languageId && v.languageId !== languageId) return false;
    if (level && v.level !== level) return false;
    if (track && v.trackKey !== track) return false;
    if (openOnly && !v.isOpen) return false;
    if (q && !(matches(v.title, q) || matches(v.languageName, q) || matches(v.promise, q))) {
      return false;
    }
    return true;
  })
    .map((v) => ({ ...v, teacher: TEACHERS_BY_ID[v.teacherId] }))
    .sort(VIDEO_SORTS[sort] ?? VIDEO_SORTS.recommended);

  return paginate(filtered, page, pageSize);
}

export function readVideo(id) {
  const item = VIDEOS_BY_ID[id];
  if (!item) return null;
  return {
    ...item,
    teacher: TEACHERS_BY_ID[item.teacherId],
    related: VIDEO_COURSES.filter((v) => v.languageId === item.languageId && v.id !== id).slice(0, 3),
  };
}

/* ------------------------------------------------- availability & bookings */

const requireTeacher = (id) => TEACHERS_BY_ID[id] ?? null;

/** Bookable start times for one teacher and one lesson length. */
export function listSlots({ teacherId, lessonType = 'standard', days = 14 } = {}) {
  const teacher = requireTeacher(teacherId);
  if (!teacher) return null;
  const type = LESSON_TYPES[lessonType] ?? LESSON_TYPES.standard;
  return {
    teacherId,
    lessonType: type.id,
    durationMin: type.durationMin,
    teacherTimezone: teacher.timezone,
    price: priceFor(teacher, type.id),
    currency: teacher.currency,
    slots: scheduling.slotsFor(teacher, { durationMin: type.durationMin, days }),
  };
}

/** A teacher's own weekly rules and dated exceptions, for the availability editor. */
export function readAvailability(teacherId) {
  const teacher = requireTeacher(teacherId);
  if (!teacher) return null;
  return {
    teacherId,
    timezone: teacher.timezone,
    rules: scheduling.listRules(teacher),
    exceptions: scheduling.listExceptions(teacherId),
  };
}

export function writeAvailabilityRules({ teacherId, rules }) {
  const teacher = requireTeacher(teacherId);
  if (!teacher) return null;
  scheduling.saveRules(teacher, rules);
  return readAvailability(teacherId);
}

export function writeException({ teacherId, exception }) {
  if (!requireTeacher(teacherId)) return null;
  scheduling.addException(teacherId, exception);
  return readAvailability(teacherId);
}

export function dropException({ teacherId, exceptionId }) {
  if (!requireTeacher(teacherId)) return null;
  scheduling.removeException(teacherId, exceptionId);
  return readAvailability(teacherId);
}

/**
 * Decorate a booking for display. In the real backend this is a join; here it keeps the
 * stored row small and lets teacher detail change without rewriting history.
 */
const decorateBooking = (booking) => {
  const teacher = TEACHERS_BY_ID[booking.teacherId];
  return {
    ...booking,
    teacher: teacher
      ? {
          id: teacher.id,
          name: teacher.name,
          iso: teacher.iso,
          country: teacher.country,
          languageName: teacher.languageName,
          typeLabel: teacher.typeLabel,
          rating: teacher.rating,
        }
      : null,
    isPast: new Date(booking.endsAt) < new Date(),
    freeCancellation: isFreeCancellation(booking.startsAt),
  };
};

export function listBookings({ learnerId, teacherId, scope = 'upcoming' } = {}) {
  const now = new Date();
  const all = scheduling
    .listBookings({ learnerId, teacherId })
    .filter((b) => {
      if (scope === 'upcoming') {
        return b.status !== BOOKING_STATUS.CANCELLED && new Date(b.endsAt) >= now;
      }
      if (scope === 'past') {
        return b.status === BOOKING_STATUS.CANCELLED || new Date(b.endsAt) < now;
      }
      return true;
    })
    .map(decorateBooking);

  return scope === 'past' ? all.reverse() : all;
}

export function bookLesson({ learner, teacherId, startsAt, lessonType }) {
  const teacher = requireTeacher(teacherId);
  if (!teacher) return { error: 'That teacher is no longer available.' };
  const result = scheduling.createBooking({ learner, teacher, startsAt, lessonType });
  return result.error ? result : { data: decorateBooking(result.data) };
}

export function dropBooking({ bookingId, userId }) {
  const result = scheduling.cancelBooking({ bookingId, userId });
  return result.error ? result : { data: decorateBooking(result.data) };
}

/** Populate a learner's calendar the first time they open the dashboard. */
export function ensureSeedBookings(learner) {
  scheduling.seedBookings({ learner, teachers: TEACHERS.filter((t) => t.languageId === 'yoruba') });
  return listBookings({ learnerId: learner.id, scope: 'upcoming' });
}

/* ------------------------------------------------------------ lesson rooms */

/**
 * Ask for a seat in a lesson room.
 *
 * Today this resolves against services/mock/meetings.js. To go live, point it at the
 * deployed function in server/join-lesson.js:
 *
 *   const response = await fetch(`${import.meta.env.VITE_API_URL}/join-lesson`, {
 *     method: 'POST',
 *     headers: { Authorization: `Bearer ${session.accessToken}` },
 *     body: JSON.stringify({ bookingId }),
 *   });
 *
 * The response shape is identical, so nothing above this line changes.
 */
export const joinLesson = (payload) => meetings.joinLesson(payload);
export const leaveLesson = (payload) => meetings.leaveLesson(payload);
export const readBookingForJoin = (bookingId) => {
  const booking = scheduling.readBooking(bookingId);
  return booking ? decorateBooking(booking) : null;
};
export const listMeetingParticipants = (bookingId) => meetings.listParticipants(bookingId);

/* --------------------------------------------------------------- placement */

export const readPlacementTest = (languageId) => buildTest(languageId);

/**
 * Look for content at the learner's exact level, then widen outwards.
 * Nothing is authored above C1 yet, so a C2 placement would otherwise see an empty page.
 */
function nearestLevelMatch(level, fetch) {
  const start = levelIndex(level);
  const order = [start];
  for (let step = 1; step < LEVEL_CODES.length; step += 1) {
    order.push(start - step, start + step);
  }
  for (const idx of order) {
    if (idx < 0 || idx >= LEVEL_CODES.length) continue;
    const items = fetch(LEVEL_CODES[idx]);
    if (items.length) return items;
  }
  return [];
}

export function submitPlacement(payload) {
  const result = scoreTest(payload);
  const recommendedTeachers = listTeachers({
    languageId: payload.languageId,
    level: result.level,
    pageSize: 3,
  }).items;
  const recommendedClasses = nearestLevelMatch(
    result.level,
    (level) => listClasses({ languageId: payload.languageId, level, pageSize: 2 }).items,
  );
  // Courses come from the shared recommender rather than a second level filter, so the
  // list on the result screen is the same list the dashboard shows afterwards. Passing
  // the just-scored level as a one-language profile is what makes them agree.
  const recommendedCourses = recommendCourses({
    courses: VIDEO_COURSES.filter((c) => c.languageId === payload.languageId),
    levels: { [payload.languageId]: { level: result.level } },
    languageId: payload.languageId,
    limit: 4,
  }).map(({ course, reason }) => ({ ...course, recommendationReason: reason }));

  return {
    ...result,
    languageName: getLanguage(payload.languageId)?.name,
    recommendedTeachers,
    recommendedClasses,
    recommendedCourses,
  };
}

/* ------------------------------------------------------------------- stats */

export const readPlatformStats = () => ({
  languages: LANGUAGES_FULL.length,
  countries: COUNTRIES.length,
  teachers: TEACHERS.length,
  classes: GROUP_CLASSES.length,
  courses: VIDEO_COURSES.length,
  lessonsDelivered: TEACHERS.reduce((n, t) => n + t.lessons, 0),
});

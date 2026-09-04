/**
 * Timezone arithmetic, no dependency.
 *
 * A teacher publishes "Tuesdays 18:00–21:00" as wall-clock time in *their* zone. A learner
 * sees it in *theirs*. Turning one into the other correctly is the single easiest thing to
 * get wrong in a booking system, and the failure is invisible until a real lesson is missed.
 *
 * The trap: a Lagos teacher (Africa/Lagos, no DST, always UTC+1) and a London learner
 * (Europe/London, UTC+0 or +1 depending on the date) drift by an hour twice a year. Naive
 * `new Date(...)` arithmetic uses the *browser's* zone and silently produces the wrong
 * instant. Everything below goes through the IANA database via Intl instead.
 */

/** IANA zone for each country in the catalogue. */
export const COUNTRY_TIMEZONES = {
  nigeria: 'Africa/Lagos',
  ghana: 'Africa/Accra',
  senegal: 'Africa/Dakar',
  kenya: 'Africa/Nairobi',
  tanzania: 'Africa/Dar_es_Salaam',
  uganda: 'Africa/Kampala',
  rwanda: 'Africa/Kigali',
  ethiopia: 'Africa/Addis_Ababa',
  somalia: 'Africa/Mogadishu',
  'south-africa': 'Africa/Johannesburg',
  zimbabwe: 'Africa/Harare',
  morocco: 'Africa/Casablanca',
  egypt: 'Africa/Cairo',
  'dr-congo': 'Africa/Kinshasa',
};

export const timezoneForCountry = (countryId) => COUNTRY_TIMEZONES[countryId] ?? 'UTC';

export function viewerTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

const partsFormatter = new Map();

function formatterFor(timeZone) {
  if (!partsFormatter.has(timeZone)) {
    partsFormatter.set(
      timeZone,
      new Intl.DateTimeFormat('en-US', {
        timeZone,
        hour12: false,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        weekday: 'short',
      }),
    );
  }
  return partsFormatter.get(timeZone);
}

const WEEKDAY_INDEX = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

/** Wall-clock fields for an instant, as seen in `timeZone`. */
export function zonedParts(date, timeZone) {
  const parts = formatterFor(timeZone)
    .formatToParts(date)
    .reduce((acc, part) => {
      acc[part.type] = part.value;
      return acc;
    }, {});

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    // Intl renders midnight as hour 24 in some engines; normalise it.
    hour: Number(parts.hour) % 24,
    minute: Number(parts.minute),
    second: Number(parts.second),
    weekday: WEEKDAY_INDEX[parts.weekday] ?? 0,
  };
}

/** How many minutes `timeZone` is ahead of UTC at that instant. */
export function zoneOffsetMinutes(date, timeZone) {
  const p = zonedParts(date, timeZone);
  const asIfUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return (asIfUtc - date.getTime()) / 60000;
}

/**
 * Turn a wall-clock time in `timeZone` into a real UTC instant.
 *
 * Two passes: guess using the offset at the naive instant, then re-read the offset at the
 * corrected instant and redo it if they disagree. That second pass is what makes the
 * hour either side of a DST transition come out right.
 */
export function zonedTimeToUtc({ year, month, day, hour = 0, minute = 0 }, timeZone) {
  const naive = Date.UTC(year, month - 1, day, hour, minute, 0);
  const firstGuess = naive - zoneOffsetMinutes(new Date(naive), timeZone) * 60000;
  const secondOffset = zoneOffsetMinutes(new Date(firstGuess), timeZone);
  const corrected = naive - secondOffset * 60000;
  return new Date(corrected);
}

/** YYYY-MM-DD as seen in `timeZone`. */
export function zonedDateKey(date, timeZone) {
  const p = zonedParts(date, timeZone);
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
}

/** Minutes past midnight as seen in `timeZone`. */
export const zonedMinuteOfDay = (date, timeZone) => {
  const p = zonedParts(date, timeZone);
  return p.hour * 60 + p.minute;
};

export function formatInZone(date, timeZone, options = {}) {
  return new Intl.DateTimeFormat(undefined, { timeZone, ...options }).format(new Date(date));
}

/** "GMT+1" style label, for showing a learner whose clock they are looking at. */
export function zoneAbbreviation(timeZone, date = new Date()) {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'shortOffset',
    }).formatToParts(date);
    return parts.find((p) => p.type === 'timeZoneName')?.value ?? timeZone;
  } catch {
    return timeZone;
  }
}

/** "18:00" from minutes past midnight. */
export const minutesToClock = (minutes) =>
  `${String(Math.floor(minutes / 60) % 24).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

export const clockToMinutes = (clock) => {
  const [h, m] = String(clock).split(':').map(Number);
  return h * 60 + (m || 0);
};

/** The `count` calendar dates starting today in `timeZone`, as {key, year, month, day}. */
export function calendarDays(timeZone, count = 14, from = new Date()) {
  const start = zonedParts(from, timeZone);
  const days = [];
  for (let i = 0; i < count; i += 1) {
    // Anchor at local noon on the target date, not UTC noon: UTC noon lands on the
    // following day in anything past UTC+12, and on the previous one past UTC-12.
    // Date.UTC inside zonedTimeToUtc normalises day overflow across month ends.
    const cursor = zonedTimeToUtc(
      { year: start.year, month: start.month, day: start.day + i, hour: 12 },
      timeZone,
    );
    const p = zonedParts(cursor, timeZone);
    days.push({
      key: `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`,
      year: p.year,
      month: p.month,
      day: p.day,
      weekday: p.weekday,
    });
  }
  return days;
}

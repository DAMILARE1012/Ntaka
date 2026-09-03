import { rng } from '@/lib/prng';

/** The availability grid mirrors the four-hour bands teachers publish. */
export const TIME_BLOCKS = [
  { id: 0, label: '00 – 04' },
  { id: 1, label: '04 – 08' },
  { id: 2, label: '08 – 12' },
  { id: 3, label: '12 – 16' },
  { id: 4, label: '16 – 20' },
  { id: 5, label: '20 – 24' },
];

export const DAYS_SHOWN = 7;

export const toDateKey = (date) => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};

/** The next `count` days starting today, ready to use as grid column headers. */
export function upcomingDays(from = new Date(), count = DAYS_SHOWN) {
  const start = new Date(from);
  start.setHours(0, 0, 0, 0);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return {
      key: toDateKey(d),
      date: d,
      weekday: d.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 2),
      dayOfMonth: d.getDate(),
      isWeekend: [0, 6].includes(d.getDay()),
      isToday: i === 0,
    };
  });
}

/**
 * Build a stable two-week availability map for a teacher.
 * Each teacher keeps a "shape" (mornings, evenings, overnight) so the grids look human
 * rather than randomly speckled.
 */
export function generateAvailability(seed, { density = 1, shape = 'mixed' } = {}) {
  const r = rng(`availability:${seed}`);
  const weights =
    {
      morning: [0.05, 0.45, 0.8, 0.5, 0.15, 0.05],
      evening: [0.1, 0.05, 0.15, 0.45, 0.85, 0.6],
      mixed: [0.15, 0.3, 0.55, 0.55, 0.6, 0.35],
      overnight: [0.7, 0.55, 0.15, 0.1, 0.2, 0.5],
    }[shape] ?? [0.3, 0.3, 0.3, 0.3, 0.3, 0.3];

  const days = upcomingDays(new Date(), 14);
  const map = {};

  days.forEach((day, dayIdx) => {
    const weekendBoost = day.isWeekend ? 1.3 : 1;
    map[day.key] = TIME_BLOCKS.filter(
      (block) => r.next() < weights[block.id] * density * weekendBoost,
    ).map((block) => block.id);

    // Guarantee most teachers have something bookable in the first few days.
    if (dayIdx < 4 && map[day.key].length === 0 && r.chance(0.55)) {
      map[day.key] = [r.int(2, 5)];
    }
  });

  return map;
}

/** Human label for the soonest open slot, e.g. "Available 16:00 today". */
export function nextAvailableLabel(availability) {
  const days = upcomingDays(new Date(), 14);
  for (let i = 0; i < days.length; i += 1) {
    const blocks = availability[days[i].key] ?? [];
    if (!blocks.length) continue;
    const hour = String(Math.min(...blocks) * 4).padStart(2, '0');
    if (i === 0) return `Available ${hour}:00 today`;
    if (i === 1) return `Available ${hour}:00 tomorrow`;
    return `Available ${hour}:00 ${days[i].date.toLocaleDateString(undefined, {
      weekday: 'long',
    })}`;
  }
  return 'Message to request a time';
}

/** Count of open blocks inside the next `days` days — powers the "Within 72 hours" filter. */
export function slotsWithin(availability, days = 3) {
  return upcomingDays(new Date(), days).reduce(
    (total, day) => total + (availability[day.key]?.length ?? 0),
    0,
  );
}

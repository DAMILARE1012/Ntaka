/* eslint-disable no-console */
import { zonedTimeToUtc, zoneOffsetMinutes, zonedParts, calendarDays } from '@/lib/timezone';
import { generateSlots, hasConflict, BOOKING_STATUS } from '@/lib/booking';

let fails = 0;
const check = (label, ok, extra = '') => {
  console.log((ok ? 'ok   ' : 'FAIL ') + label + (extra ? '   ' + extra : ''));
  if (!ok) fails += 1;
};
const iso = (d) => new Date(d).toISOString();
const utcAt = (y, m, d, h, min, tz) => iso(zonedTimeToUtc({ year: y, month: m, day: d, hour: h, minute: min }, tz));

console.log('--- zone offsets ---');
check('Lagos is UTC+1 in January', zoneOffsetMinutes(new Date('2026-01-15T12:00:00Z'), 'Africa/Lagos') === 60);
check('Lagos is UTC+1 in July (no DST)', zoneOffsetMinutes(new Date('2026-07-15T12:00:00Z'), 'Africa/Lagos') === 60);
check('London is UTC+0 in January', zoneOffsetMinutes(new Date('2026-01-15T12:00:00Z'), 'Europe/London') === 0);
check('London is UTC+1 in July (DST)', zoneOffsetMinutes(new Date('2026-07-15T12:00:00Z'), 'Europe/London') === 60);

console.log('');
console.log('--- wall clock to UTC ---');
check('Lagos 18:00 Jan is 17:00Z', utcAt(2026, 1, 20, 18, 0, 'Africa/Lagos') === '2026-01-20T17:00:00.000Z', utcAt(2026, 1, 20, 18, 0, 'Africa/Lagos'));
check('Lagos 18:00 Jul is 17:00Z', utcAt(2026, 7, 20, 18, 0, 'Africa/Lagos') === '2026-07-20T17:00:00.000Z');
check('London 18:00 Jan is 18:00Z', utcAt(2026, 1, 20, 18, 0, 'Europe/London') === '2026-01-20T18:00:00.000Z');
check('London 18:00 Jul is 17:00Z', utcAt(2026, 7, 20, 18, 0, 'Europe/London') === '2026-07-20T17:00:00.000Z');

console.log('--- the DST transition weekend (BST begins 29 Mar 2026, 01:00Z) ---');
check('London 00:30 on 29 Mar is 00:30Z, still GMT', utcAt(2026, 3, 29, 0, 30, 'Europe/London') === '2026-03-29T00:30:00.000Z', utcAt(2026, 3, 29, 0, 30, 'Europe/London'));
check('London 09:00 on 29 Mar is 08:00Z, now BST', utcAt(2026, 3, 29, 9, 0, 'Europe/London') === '2026-03-29T08:00:00.000Z', utcAt(2026, 3, 29, 9, 0, 'Europe/London'));

const back = zonedParts(zonedTimeToUtc({ year: 2026, month: 11, day: 3, hour: 7, minute: 45 }, 'Africa/Nairobi'), 'Africa/Nairobi');
check('round trip preserves the wall clock', back.hour === 7 && back.minute === 45 && back.day === 3);

console.log('');
console.log('--- slot generation ---');
const from = new Date('2026-06-01T06:00:00Z');
const rules = [
  { weekday: 1, startMinute: 540, endMinute: 720 },
  { weekday: 3, startMinute: 1080, endMinute: 1200 },
];
const slots = generateSlots({ rules, timezone: 'Africa/Lagos', days: 7, durationMin: 60, from, leadTimeMin: 0 });
check('slots generated', slots.length > 0, slots.length + ' slots');
check('Monday 09:00 Lagos equals 08:00Z', slots[0].startsAt === '2026-06-01T08:00:00.000Z', slots[0].startsAt);

const monday = slots.filter((s) => s.teacherDateKey === '2026-06-01');
check('09:00-12:00 yields 5 hourly starts', monday.length === 5, monday.map((s) => s.teacherLocalTime).join(' '));
check('no lesson runs past the window', monday.every((s) => new Date(s.endsAt) <= new Date('2026-06-01T11:00:00Z')));
check('only the two rule weekdays appear', new Set(slots.map((s) => new Date(s.startsAt).getUTCDay())).size === 2);

console.log('');
console.log('--- lead time, blackouts, conflicts ---');
const lead = generateSlots({ rules, timezone: 'Africa/Lagos', days: 7, durationMin: 60, from, leadTimeMin: 240 });
check('lead time removes imminent slots', lead.length < slots.length && lead[0].startsAt >= '2026-06-01T10:00:00.000Z', lead[0].startsAt);

const blackedOut = generateSlots({
  rules, timezone: 'Africa/Lagos', days: 7, durationMin: 60, from, leadTimeMin: 0,
  exceptions: [{ date: '2026-06-01', startMinute: 600, endMinute: 660, isAvailable: false }],
});
const after = blackedOut.filter((s) => s.teacherDateKey === '2026-06-01').map((s) => s.teacherLocalTime);
check('blackout splits the window', !after.includes('09:30') && !after.includes('10:00') && after.includes('09:00') && after.includes('11:00'), after.join(' '));

const added = generateSlots({
  rules: [], timezone: 'Africa/Lagos', days: 7, durationMin: 60, from, leadTimeMin: 0,
  exceptions: [{ date: '2026-06-02', startMinute: 840, endMinute: 960, isAvailable: true }],
});
check('one-off availability adds slots', added.length === 3 && added[0].teacherDateKey === '2026-06-02', added.map((s) => s.teacherLocalTime).join(' '));

const booked = [{ startsAt: '2026-06-01T08:00:00.000Z', durationMin: 60, status: BOOKING_STATUS.CONFIRMED }];
const free = generateSlots({ rules, timezone: 'Africa/Lagos', days: 7, durationMin: 60, from, leadTimeMin: 0, bookings: booked });
check('a booked slot disappears', !free.some((s) => s.startsAt === '2026-06-01T08:00:00.000Z'));
check('the adjacent slot survives', free.some((s) => s.startsAt === '2026-06-01T09:00:00.000Z'));
check('partial overlap is a conflict', hasConflict(new Date('2026-06-01T08:30:00Z').getTime(), 60, booked));
check('a cancelled booking does not block', !hasConflict(new Date('2026-06-01T08:00:00Z').getTime(), 60, [{ startsAt: '2026-06-01T08:00:00.000Z', durationMin: 60, status: BOOKING_STATUS.CANCELLED }]));

console.log('');
console.log('--- the same instant, seen from three places ---');
check('Lagos teacher sees 09:00', zonedParts(new Date(slots[0].startsAt), 'Africa/Lagos').hour === 9);
check('London learner sees 09:00 in June', zonedParts(new Date(slots[0].startsAt), 'Europe/London').hour === 9);
check('New York learner sees 04:00', zonedParts(new Date(slots[0].startsAt), 'America/New_York').hour === 4);
const december = zonedTimeToUtc({ year: 2026, month: 12, day: 2, hour: 9 }, 'Africa/Lagos');
check('in December that London learner sees 08:00', zonedParts(december, 'Europe/London').hour === 8, 'the hour naive date maths loses');

console.log('');
console.log('--- calendar days use the target zone ---');
const days = calendarDays('Pacific/Kiritimati', 3, new Date('2026-06-01T12:00:00Z'));
check('day keys follow the zone, not the host', days[0].key === '2026-06-02', days.map((d) => d.key).join(' '));
check('weekday index matches the key', days.every((d) => new Date(d.key + 'T12:00:00Z').getUTCDay() === d.weekday));

console.log('');
console.log(fails ? fails + ' CHECK(S) FAILED' : 'SCHEDULE CHECKS OK');
if (fails) process.exitCode = 1;

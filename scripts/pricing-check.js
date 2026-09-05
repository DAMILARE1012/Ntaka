/**
 * The pricing hierarchy.
 *
 * 1-on-1 anchors, a group seat is 30% below it, interactive is 20% below that. The test
 * that matters is not that the constants are right — it is that every generated class and
 * course in the catalogue actually lands on them, per teacher, because the previous bug
 * was not a wrong percentage but three price ranges drawn independently of each other.
 *
 * Everything is compared per HOUR. Comparing headline prices would fail for a correct
 * catalogue: a 90-minute group seat costs more than a 60-minute private lesson while still
 * being 30% cheaper per hour, which is the whole reason the model works in hours.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { TEACHERS, TEACHERS_BY_ID } from '../src/services/mock/teachers.js';
import { GROUP_CLASSES } from '../src/services/mock/classes.js';
import { VIDEO_COURSES } from '../src/services/mock/videos.js';
import {
  GROUP_DISCOUNT,
  INTERACTIVE_DISCOUNT,
  MODE_MULTIPLIER,
  LEARNING_MODES,
  GROUP_FACTOR_BY_SIZE,
  groupFactorFor,
  groupHourlyFor,
  hourlyFor,
  groupSeatPrice,
  oneToOnePrice,
  effectiveHourly,
  priceLadder,
  verifyHierarchy,
  PLATFORM_REFERENCE_HOURLY,
  SUBSCRIPTION_MONTHLY,
  SUBSCRIPTION_ANNUAL,
  SUBSCRIPTION_PLANS,
  SUBSCRIPTION_INCLUDES,
  subscriptionBreakEven,
  subscriptionHourly,
} from '../src/lib/pricing.js';
import { priceFor, LESSON_TYPES } from '../src/lib/booking.js';

let failed = 0;
const ok = (label, cond, note = '') => {
  console.log(`${cond ? 'ok  ' : 'FAIL'} ${label}${note ? `   ${note}` : ''}`);
  if (!cond) failed += 1;
};

/* ------------------------------------------------------------- the constants */

console.log('\n--- the hierarchy is what was asked for ---');
ok('group is 30% below 1-on-1', GROUP_DISCOUNT === 0.3);
ok('interactive is 20% below group', INTERACTIVE_DISCOUNT === 0.2);
ok('1-on-1 is the anchor', MODE_MULTIPLIER[LEARNING_MODES.ONE_TO_ONE] === 1);
ok(
  'group multiplier is 0.70',
  Math.abs(MODE_MULTIPLIER[LEARNING_MODES.GROUP] - 0.7) < 1e-9,
);
ok(
  'interactive multiplier is 0.56 of 1-on-1',
  Math.abs(MODE_MULTIPLIER[LEARNING_MODES.INTERACTIVE] - 0.56) < 1e-9,
  '0.70 × 0.80',
);
ok(
  'the ratios verify',
  verifyHierarchy({ oneToOne: 100, group: 70, interactive: 56 }).ok,
);
ok(
  'a broken ladder is rejected',
  !verifyHierarchy({ oneToOne: 100, group: 90, interactive: 56 }).ok,
);

/* -------------------------------------------------- every class in the catalogue */

console.log('\n--- group seats vary by class size, and always undercut 1-on-1 ---');
ok(
  'every size factor is below 1',
  Object.values(GROUP_FACTOR_BY_SIZE).every((f) => f > 0 && f < 1),
  Object.entries(GROUP_FACTOR_BY_SIZE).map(([k, v]) => `${k}:${v}`).join(' '),
);
ok(
  'the ceiling is the original 30% discount',
  Math.max(...Object.values(GROUP_FACTOR_BY_SIZE)) === 1 - GROUP_DISCOUNT,
);
ok(
  'a bigger class is cheaper per seat',
  (() => {
    const sizes = Object.keys(GROUP_FACTOR_BY_SIZE).map(Number).sort((a, b) => a - b);
    return sizes.every((size, i) => i === 0 || GROUP_FACTOR_BY_SIZE[size] < GROUP_FACTOR_BY_SIZE[sizes[i - 1]]);
  })(),
);
ok('an unusual size falls back to the nearest', groupFactorFor(7) === GROUP_FACTOR_BY_SIZE[6] || groupFactorFor(7) === GROUP_FACTOR_BY_SIZE[8]);
ok('a huge class is capped at the cheapest tier', groupFactorFor(50) === GROUP_FACTOR_BY_SIZE[10]);

let classFailures = [];
let dearerThanPrivate = [];
for (const item of GROUP_CLASSES) {
  const teacher = TEACHERS_BY_ID[item.teacherId];
  if (!teacher) continue;
  const perHour = effectiveHourly(item.pricePerSeat, item.durationMins);
  const want = groupHourlyFor(teacher.hourlyRate, item.seatsTotal);
  // Whole-dollar rounding moves a cheap seat by a little; $1 of slack covers it.
  if (Math.abs(perHour - want) > 1.01) {
    classFailures.push(`${item.id}: $${perHour.toFixed(2)}/hr vs $${want.toFixed(2)}`);
  }
  if (perHour >= teacher.hourlyRate) {
    dearerThanPrivate.push(`${item.id}: $${perHour.toFixed(2)} vs private $${teacher.hourlyRate}`);
  }
}
ok(
  'every seat price derives from its teacher and class size',
  classFailures.length === 0,
  classFailures.length ? classFailures.slice(0, 3).join(' | ') : `${GROUP_CLASSES.length} classes`,
);
ok(
  'NO group class ever costs more per hour than that teacher privately',
  dearerThanPrivate.length === 0,
  dearerThanPrivate.length ? dearerThanPrivate.slice(0, 3).join(' | ') : 'the rule that matters',
);
ok(
  'seat prices genuinely vary rather than sitting on one number',
  new Set(GROUP_CLASSES.map((c) => effectiveHourly(c.pricePerSeat, c.durationMins).toFixed(2))).size > 20,
);
ok(
  'the price is set by seats offered, not seats sold',
  !readFileSync('src/services/mock/classes.js', 'utf8').match(/groupSeatPrice\([^)]*seatsTaken/),
);

/* ------------------------------------------ interactive is now a subscription */

console.log('\n--- interactive learning is a subscription to the platform ---');
ok('no course carries a purchase price', VIDEO_COURSES.every((c) => c.price === 0));
ok('every course declares how it is accessed', VIDEO_COURSES.every((c) => ['open', 'subscription'].includes(c.access)));
ok(
  'most are included in the plan, a few stay open',
  VIDEO_COURSES.some((c) => c.access === 'subscription') && VIDEO_COURSES.some((c) => c.access === 'open'),
  `${VIDEO_COURSES.filter((c) => c.access === 'open').length} open of ${VIDEO_COURSES.length}`,
);
ok(
  'the plan covers every language, not one',
  new Set(VIDEO_COURSES.filter((c) => c.access === 'subscription').map((c) => c.languageId)).size > 10,
);

ok('there is a monthly and an annual plan', SUBSCRIPTION_PLANS.length === 2);
ok('annual is cheaper per month than monthly', SUBSCRIPTION_PLANS[1].perMonth < SUBSCRIPTION_MONTHLY);
ok('annual saves real money', SUBSCRIPTION_PLANS[1].saving === SUBSCRIPTION_MONTHLY * 12 - SUBSCRIPTION_ANNUAL);
ok('what a plan includes is stated once', SUBSCRIPTION_INCLUDES.length >= 4);

console.log('\n--- and it is still the cheapest way to learn, honestly stated ---');
const be = subscriptionBreakEven();
ok('the monthly plan is pegged at $50', SUBSCRIPTION_MONTHLY === 50);
ok('the annual plan follows the peg', SUBSCRIPTION_ANNUAL === 50 * 10, `$${SUBSCRIPTION_ANNUAL}`);
ok(
  'a month no longer undercuts a single private lesson, and the code knows it',
  be.beatsOneLesson === false,
  `$${SUBSCRIPTION_MONTHLY} vs $${be.oneToOneHourly} an hour`,
);
ok(
  'it beats a group seat within about an hour a week of study',
  be.vsGroupHours > 0 && be.perWeek <= 1.5,
  `${be.vsGroupHours} hours a month (~${be.perWeek}/week)`,
);
ok(
  'a committed learner gets a genuinely low hourly rate',
  subscriptionHourly(20) < be.groupHourly / 2,
  `$${subscriptionHourly(20)}/hr at 20 hours a month`,
);
ok(
  'at that usage the hourly cost is below a group seat',
  subscriptionHourly(be.vsGroupHours + 0.5) < be.groupHourly,
);
ok('studying nothing is honestly infinite, not zero', subscriptionHourly(0) === Infinity);

const median = [...TEACHERS.map((t) => t.hourlyRate)].sort((a, b) => a - b)[Math.floor(TEACHERS.length / 2)];
ok(
  'the reference rate, which every CLAIM is still derived from, tracks the median teacher',
  Math.abs(median - PLATFORM_REFERENCE_HOURLY) <= 3,
  `median $${median} vs reference $${PLATFORM_REFERENCE_HOURLY}`,
);

/* ------------------------------------------- the ordering holds, per teacher */

console.log('\n--- per hour, the order never inverts ---');
let inversions = [];
for (const teacher of TEACHERS) {
  const one = hourlyFor(LEARNING_MODES.ONE_TO_ONE, teacher.hourlyRate);
  // The dearest group tier, which is the strictest case for the rule.
  const group = groupHourlyFor(teacher.hourlyRate, 4);
  if (!(one > group)) inversions.push(teacher.id);
}
ok('1-on-1 beats even the dearest group tier, for every teacher', inversions.length === 0, `${TEACHERS.length} teachers`);

const ladder = priceLadder(25);
ok('the ladder renders three rungs', ladder.length === 3);
ok('a $25 rate gives $25 / $17.50 / $14', ladder.map((r) => r.exactHourly).join() === '25,17.5,14');
ok('each rung explains its discount', ladder.slice(1).every((r) => /% less/.test(r.note)));

/* ---------------------------------------------------------- the exceptions */

console.log('\n--- the two deliberate exceptions ---');
const teacher = TEACHERS.find((t) => t.hourlyRate > 20);
ok(
  'a trial sits below the full 1-on-1 rate',
  priceFor(teacher, 'trial') < priceFor(teacher, 'standard'),
  `$${priceFor(teacher, 'trial')} vs $${priceFor(teacher, 'standard')}`,
);
ok(
  'open courses exist and need no subscription',
  VIDEO_COURSES.some((c) => c.isOpen && c.access === 'open'),
);
ok(
  'and nothing is quietly half-open',
  VIDEO_COURSES.every((c) => c.isOpen === (c.access === 'open')),
);

/* --------------------------------------------------------------- the maths */

console.log('\n--- the arithmetic ---');
ok('a 60-min lesson at $30/hr is $30', oneToOnePrice(30, 60) === 30);
ok('a 90-min lesson at $30/hr is $45', oneToOnePrice(30, 90) === 45);
ok('a 60-min seat in a class of 4 at $30/hr is $21', groupSeatPrice(30, 60, 4) === 21, '30 × 0.70');
ok('the same seat in a class of 10 is $14', groupSeatPrice(30, 60, 10) === 14, '30 × 0.45');
ok('without a size it uses the ceiling', groupSeatPrice(30, 60) === 21);
ok('a 90-min seat in a class of 6 at $30/hr is $27', groupSeatPrice(30, 90, 6) === 27, '30 × 0.60 × 1.5');
ok('nothing paid rounds to zero', groupSeatPrice(1, 15) >= 1);
ok('a zero rate does not throw', Number.isFinite(groupSeatPrice(0, 60, 6)));
ok('a missing duration does not throw', effectiveHourly(20, 0) === 0);

/* ---------------------------------------------- one source of truth */

console.log('\n--- nothing else invents a price ---');
const classSrc = readFileSync('src/services/mock/classes.js', 'utf8');
const courseSrc = readFileSync('src/services/mock/videos.js', 'utf8');
ok('classes no longer draw a random seat price', !/pricePerSeat:\s*r\.int/.test(classSrc));
ok('courses no longer carry a price at all', !/price:\s*isFree/.test(courseSrc));
ok('classes import the pricing model', classSrc.includes("from '@/lib/pricing'"));
ok('courses declare access instead of price', courseSrc.includes("access: isOpen"));
ok(
  'booking prices route through it too',
  readFileSync('src/lib/booking.js', 'utf8').includes('oneToOnePrice('),
);

/* ------------------------------------------- the copy matches the billing model */

console.log('\n--- no page still promises what a subscription cannot ---');
const walk = (dir, out = []) => {
  for (const entry of readdirSync(dir)) {
    const full = `${dir}/${entry}`;
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.jsx?$/.test(full)) out.push(full);
  }
  return out;
};

// Comments are stripped: this file and pricing.js both EXPLAIN that lifetime access is
// no longer promised, and scanning the prose would flag the documentation itself.
const BLOCK = new RegExp('/\\*[\\s\\S]*?\\*/', 'g');
const LINE = new RegExp('(^|\\s)//.*$', 'gm');
const codeOnly = (text) => text.replace(BLOCK, '').replace(LINE, '$1');

const appFiles = walk('src');
const promises = [
  [/lifetime access/i, 'lifetime access - access ends with the subscription'],
  [/one payment/i, 'one payment - it is a recurring plan'],
  [/keep forever/i, 'keep forever - it is a recurring plan'],
];
const stale = [];
for (const file of appFiles) {
  const text = codeOnly(readFileSync(file, 'utf8'));
  for (const [pattern, why] of promises) {
    if (pattern.test(text)) stale.push(`${file}: ${why}`);
  }
}
ok(
  'nothing claims lifetime or one-off access',
  stale.length === 0,
  stale.length ? stale.slice(0, 3).join(' | ') : `${appFiles.length} files scanned`,
);

// The price appears on several pages; none of them may hard-code it.
const hardcoded = appFiles.filter(
  (f) => !f.endsWith('lib/pricing.js') && /\\$50 a month/.test(readFileSync(f, 'utf8')),
);
ok(
  'no page hard-codes the price instead of reading the constant',
  hardcoded.length === 0,
  hardcoded.length ? hardcoded.join(', ') : 'all read SUBSCRIPTION_MONTHLY',
);

console.log(failed ? `\nPRICING CHECKS FAILED (${failed})` : '\nPRICING CHECKS OK');
process.exit(failed ? 1 : 0);

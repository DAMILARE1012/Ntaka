/**
 * The pricing hierarchy.
 *
 * One rule: 1-on-1 is the anchor, a group seat costs 30% less, and interactive learning
 * costs 20% less again. Everything below derives from that, and nothing else in the
 * codebase is allowed to invent a price.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  WHY EVERYTHING IS PER HOUR
 * ─────────────────────────────────────────────────────────────────────────────
 *  The three modes are sold in different units, and this matters more than it first
 *  appears. A 1-on-1 lesson is priced per 60 minutes of private live time. A group class
 *  is priced per seat for a session of 45, 60 or 90 minutes. Interactive learning is a
 *  monthly subscription to the whole platform, with no fixed number of hours in it at all.
 *
 *  "30% less" is therefore meaningless until the three are expressed in the same unit, and
 *  the only unit they share is an hour of instruction. So the hierarchy is applied to the
 *  HOURLY rate, and each mode's headline price is that hourly rate multiplied by however
 *  many hours the thing actually contains.
 *
 *  Applying the percentages to the headline numbers instead would have produced nonsense:
 *  a 90-minute group class "30% cheaper" than a 30-minute trial lesson tells a learner
 *  nothing, and the previous code had exactly that problem - group seats and course prices
 *  were drawn from independent ranges, so a $16 group seat could sit above a $6/hour
 *  teacher's private lesson.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  THE THREE MODES ARE SOLD DIFFERENTLY
 * ─────────────────────────────────────────────────────────────────────────────
 *  1-on-1     per lesson, at the teacher's own rate. The anchor.
 *  Group      per seat, per session. The seat price VARIES with how many seats the class
 *             holds - see GROUP_FACTOR_BY_SIZE - but is always below the private rate.
 *  Interactive  a subscription to the platform, not a per-course purchase. One price, every
 *             language, every course.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  TWO DELIBERATE EXCEPTIONS
 * ─────────────────────────────────────────────────────────────────────────────
 *  1. Trial lessons. A taster is a marketing price, not a tier. It sits below its own
 *     hourly rate on purpose and is excluded from the hierarchy.
 *  2. Open courses. A handful are readable without a subscription, as a way in. A rule
 *     that forbids giving something away is a bad rule.
 *
 *  Both exceptions are named here rather than left implicit, because an unexplained
 *  exception is indistinguishable from a bug.
 */

/** Discount applied at each step down the hierarchy. Change these and everything moves. */
export const GROUP_DISCOUNT = 0.3; // 30% below 1-on-1
export const INTERACTIVE_DISCOUNT = 0.2; // 20% below a group seat

export const LEARNING_MODES = {
  ONE_TO_ONE: 'one-to-one',
  GROUP: 'group',
  INTERACTIVE: 'interactive',
};

/**
 * Hourly multiplier per mode, derived rather than hard-coded so the two constants above
 * remain the single place a rate changes.
 */
export const MODE_MULTIPLIER = {
  [LEARNING_MODES.ONE_TO_ONE]: 1,
  [LEARNING_MODES.GROUP]: 1 - GROUP_DISCOUNT,
  [LEARNING_MODES.INTERACTIVE]: (1 - GROUP_DISCOUNT) * (1 - INTERACTIVE_DISCOUNT),
};

export const MODE_LABEL = {
  [LEARNING_MODES.ONE_TO_ONE]: '1-on-1 lessons',
  [LEARNING_MODES.GROUP]: 'Group classes',
  [LEARNING_MODES.INTERACTIVE]: 'Interactive learning',
};

/**
 * The hourly rate for a mode, given the teacher's 1-on-1 rate.
 *
 * Rounded to cents rather than left raw: 25 * 0.56 is 14.000000000000002 in binary
 * floating point, and that value reaches both the comparison UI and the ratio checks.
 * Cents is the smallest unit any of this is ever expressed in, so nothing is lost.
 */
export const hourlyFor = (mode, baseHourly) =>
  Math.round((Number(baseHourly) || 0) * (MODE_MULTIPLIER[mode] ?? 1) * 100) / 100;

/**
 * Prices are whole units of currency. A minimum of 1 stops a very cheap community teacher
 * and a short session from rounding a paid product down to free, which would be a
 * different offer rather than a cheap one.
 */
const money = (value) => Math.max(1, Math.round(value));

/** Price for `minutes` of instruction in a given mode. */
export const priceForMinutes = (mode, baseHourly, minutes) =>
  money((hourlyFor(mode, baseHourly) * (Number(minutes) || 0)) / 60);

export const oneToOnePrice = (baseHourly, minutes) =>
  priceForMinutes(LEARNING_MODES.ONE_TO_ONE, baseHourly, minutes);

/**
 * How far below the private rate a group seat sits, by how many seats the class holds.
 *
 * A smaller class is worth more per person - four learners get a share of the teacher's
 * attention that ten do not - so a small class sits nearer the private rate and a large one
 * further below it. 0.70 is the ceiling, so a group seat is never more than 70% of the
 * private hourly rate and always meaningfully cheaper than 1-on-1.
 *
 * Crucially this keys off CAPACITY, not attendance. A ten-seat class is advertised at the
 * ten-seat price whether two people book or ten, so nobody pays more because a class sold
 * badly and nobody's price moves after they have booked. Pricing on `seatsTaken` would do
 * both, which is why it is capacity here and always should be.
 */
export const GROUP_FACTOR_BY_SIZE = {
  4: 0.7,
  5: 0.65,
  6: 0.6,
  8: 0.52,
  10: 0.45,
};

/** Nearest defined capacity, so an unusual class size still prices sensibly. */
export function groupFactorFor(seatsTotal) {
  const sizes = Object.keys(GROUP_FACTOR_BY_SIZE).map(Number);
  const nearest = sizes.reduce((best, size) =>
    Math.abs(size - seatsTotal) < Math.abs(best - seatsTotal) ? size : best,
  );
  return GROUP_FACTOR_BY_SIZE[nearest];
}

/**
 * A group seat, for one session.
 *
 * `seatsTotal` is optional: without it the ceiling factor applies, which keeps every
 * caller safely on the cheaper side of 1-on-1.
 */
export const groupSeatPrice = (baseHourly, durationMins, seatsTotal = null) =>
  money(
    ((Number(baseHourly) || 0) *
      (seatsTotal ? groupFactorFor(seatsTotal) : MODE_MULTIPLIER[LEARNING_MODES.GROUP]) *
      (Number(durationMins) || 0)) /
      60,
  );

/** The hourly rate a seat in this class works out at. */
export const groupHourlyFor = (baseHourly, seatsTotal) =>
  Math.round((Number(baseHourly) || 0) * groupFactorFor(seatsTotal) * 100) / 100;

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  INTERACTIVE LEARNING: A SUBSCRIPTION, NOT A PURCHASE
 * ─────────────────────────────────────────────────────────────────────────────
 *  One price for the whole platform - every language, every course, for as long as the
 *  subscription runs. That changes what "cheaper than a group class" can mean, because a
 *  monthly fee has no fixed number of hours in it.
 *
 *  The monthly price is a SET PRODUCT DECISION, not a derived number. It used to be
 *  calculated from the platform's reference hourly rate; it is now pegged, which means it
 *  no longer moves when the teacher mix moves. That is a deliberate trade: a headline price
 *  a learner can remember is worth more than one that tracks a median.
 *
 *  What is still derived, and must stay derived, is every CLAIM made about it.
 *  `subscriptionBreakEven` computes how much study it takes for the subscription to beat
 *  paying per hour, and the pricing page and FAQ read that number rather than repeating a
 *  sentence somebody wrote once. At this price the subscription is aimed at a learner
 *  studying regularly - roughly an hour a week or more - and the copy says so instead of
 *  implying it is cheapest for everyone.
 */

/**
 * The median 1-on-1 hourly rate across the platform, which anchors anything that cannot
 * belong to one teacher. Checked against the real median by scripts/pricing-check.js, so
 * it fails loudly rather than drifting if the teacher mix changes.
 */
export const PLATFORM_REFERENCE_HOURLY = 17;

/**
 * The monthly plan price. Pegged, not derived - change it here and every page, badge and
 * FAQ answer that mentions it follows, because none of them hold their own copy of it.
 */
export const SUBSCRIPTION_MONTHLY = 50;

/** Twelve months for the price of ten. Commitment is the discount, nothing else changes. */
export const ANNUAL_MONTHS_CHARGED = 10;
export const SUBSCRIPTION_ANNUAL = SUBSCRIPTION_MONTHLY * ANNUAL_MONTHS_CHARGED;

export const SUBSCRIPTION_PLANS = [
  {
    id: 'monthly',
    label: 'Monthly',
    price: SUBSCRIPTION_MONTHLY,
    months: 1,
    per: 'month',
    note: 'Cancel any time.',
  },
  {
    id: 'annual',
    label: 'Annual',
    price: SUBSCRIPTION_ANNUAL,
    months: 12,
    per: 'year',
    note: `Twelve months for the price of ${ANNUAL_MONTHS_CHARGED}.`,
    perMonth: Math.round((SUBSCRIPTION_ANNUAL / 12) * 100) / 100,
    saving: SUBSCRIPTION_MONTHLY * 12 - SUBSCRIPTION_ANNUAL,
  },
];

/** Everything a subscription includes. Stated once so no page invents its own list. */
export const SUBSCRIPTION_INCLUDES = [
  'Every interactive course, in every language we teach',
  'Video and audio lessons, with two-speaker conversations',
  'Quizzes that make you read, write and speak back',
  'Assessments at any point, and certificates when you finish',
  'New courses as they are added, at no extra cost',
];

/**
 * How many hours of study a month it takes for the subscription to beat paying per hour.
 *
 * Returned rather than hard-coded, so the marketing line and the pricing check read the
 * same number and neither can quietly become a lie. This matters more now that the price
 * is pegged: a number that no longer moves with the catalogue is exactly the kind that
 * quietly stops being true.
 *
 * `worthItFrom` is the sentence the pricing page needs - the study level above which a
 * subscription is the cheaper choice, rounded to something a person can picture.
 */
export function subscriptionBreakEven(referenceHourly = PLATFORM_REFERENCE_HOURLY) {
  const groupHourly = hourlyFor(LEARNING_MODES.GROUP, referenceHourly);
  const oneToOneHourly = hourlyFor(LEARNING_MODES.ONE_TO_ONE, referenceHourly);
  const vsGroupHours = Math.round((SUBSCRIPTION_MONTHLY / groupHourly) * 10) / 10;

  return {
    monthly: SUBSCRIPTION_MONTHLY,
    vsGroupHours,
    vsOneToOneHours: Math.round((SUBSCRIPTION_MONTHLY / oneToOneHourly) * 10) / 10,
    groupHourly,
    oneToOneHourly,
    /** Roughly how often that is, in plain words. */
    perWeek: Math.round((vsGroupHours / 4) * 10) / 10,
    /** Whether a month still undercuts a single private lesson. It no longer does. */
    beatsOneLesson: SUBSCRIPTION_MONTHLY < oneToOneHourly,
  };
}

/**
 * What one hour of subscribed study costs, given how much someone studies in a month.
 * The number that makes the subscription comparable to the other two modes at all.
 */
export const subscriptionHourly = (hoursPerMonth) =>
  !hoursPerMonth ? Infinity : Math.round((SUBSCRIPTION_MONTHLY / hoursPerMonth) * 100) / 100;

/**
 * What an hour of this actually costs, which is the only number that compares across
 * modes. Used for the comparison shown to learners and for verifying the hierarchy.
 */
export const effectiveHourly = (price, minutes) =>
  !minutes ? 0 : (Number(price) || 0) * (60 / minutes);

/**
 * The hierarchy as a learner sees it, for one teacher's rate.
 *
 * Returned as data so the same three numbers appear on the pricing explainer, the FAQ and
 * anywhere else the comparison is drawn, without a second calculation existing.
 */
export function priceLadder(baseHourly) {
  const rows = [
    { mode: LEARNING_MODES.ONE_TO_ONE, note: 'Private, live, entirely your pace' },
    { mode: LEARNING_MODES.GROUP, note: `${Math.round(GROUP_DISCOUNT * 100)}% less than 1-on-1` },
    {
      mode: LEARNING_MODES.INTERACTIVE,
      note: `${Math.round(INTERACTIVE_DISCOUNT * 100)}% less than a group class`,
    },
  ];

  return rows.map((row) => ({
    ...row,
    label: MODE_LABEL[row.mode],
    hourly: money(hourlyFor(row.mode, baseHourly)),
    exactHourly: hourlyFor(row.mode, baseHourly),
  }));
}

/**
 * Does a set of rates honour the hierarchy? Used by the pricing check.
 *
 * Compares unrounded hourly rates, because rounding whole-dollar prices can move a ratio
 * by a few percent on cheap teachers and that is a rounding artefact rather than a pricing
 * error. `tolerance` covers exactly that.
 */
export function verifyHierarchy({ oneToOne, group, interactive }, tolerance = 0.02) {
  if (!oneToOne) return { ok: false, reason: 'no 1-on-1 rate to anchor to' };

  const groupRatio = group / oneToOne;
  const interactiveRatio = interactive / group;

  const wantGroup = 1 - GROUP_DISCOUNT;
  const wantInteractive = 1 - INTERACTIVE_DISCOUNT;

  if (Math.abs(groupRatio - wantGroup) > tolerance) {
    return { ok: false, reason: `group is ${(groupRatio * 100).toFixed(1)}% of 1-on-1` };
  }
  if (Math.abs(interactiveRatio - wantInteractive) > tolerance) {
    return {
      ok: false,
      reason: `interactive is ${(interactiveRatio * 100).toFixed(1)}% of group`,
    };
  }
  return { ok: true, groupRatio, interactiveRatio };
}

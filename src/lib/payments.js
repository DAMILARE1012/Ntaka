import { SUBSCRIPTION_PLANS, SUBSCRIPTION_MONTHLY } from '@/lib/pricing';

/**
 * Money, as Paystack needs it.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  THE TWO THINGS THAT GO WRONG WITH PAYMENTS, BOTH HANDLED HERE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  1. SUBUNITS. Paystack takes amounts in the smallest unit of the currency —
 *     kobo for NGN, cents for USD, pesewas for GHS. Send 50 meaning "fifty naira"
 *     and you have charged fifty kobo, which is about three pence. Send 5000
 *     meaning "fifty naira in kobo" to an endpoint expecting naira and you have
 *     charged fifty thousand. Both directions are a real incident, so every amount
 *     that leaves this file is already in subunits and is named as such.
 *
 *  2. CURRENCY. The catalogue is priced in USD, and Paystack settles Nigerian
 *     merchants in NGN. So a price has to be converted at checkout, and the rate
 *     is the part nobody maintains. `USD_TO_NGN` below is a configured peg, NOT a
 *     live rate: a live rate would mean the displayed price changed between the
 *     course page and the payment sheet, which is the kind of thing that gets a
 *     merchant account reviewed. Update it deliberately, and the pricing check
 *     will tell you if it has drifted implausibly far.
 *
 *  USD is the unit of record throughout. NGN exists only at the moment of payment.
 */

/**
 * Configured USD→NGN peg. Deliberately a constant rather than a live lookup.
 *
 * When this moves, it should move because someone decided to move it — with the
 * customer-facing prices reviewed at the same time — not because a rate API had a
 * bad afternoon.
 */
export const USD_TO_NGN = Number(import.meta.env?.VITE_USD_TO_NGN ?? 1600);

/** Currencies Paystack settles, with how many subunits make one unit. */
export const CURRENCIES = {
  NGN: { code: 'NGN', symbol: '₦', subunits: 100, label: 'Nigerian naira' },
  GHS: { code: 'GHS', symbol: '₵', subunits: 100, label: 'Ghanaian cedi' },
  ZAR: { code: 'ZAR', symbol: 'R', subunits: 100, label: 'South African rand' },
  KES: { code: 'KES', symbol: 'KSh', subunits: 100, label: 'Kenyan shilling' },
  USD: { code: 'USD', symbol: '$', subunits: 100, label: 'US dollar' },
};

export const CHARGE_CURRENCY = 'NGN';

/** USD price → whole units of the charge currency. Rounded to a clean amount. */
export function toChargeCurrency(usd, { rate = USD_TO_NGN, currency = CHARGE_CURRENCY } = {}) {
  if (currency === 'USD') return Math.round(Number(usd) || 0);
  const converted = (Number(usd) || 0) * rate;
  // Round to the nearest 50 naira. A price of ₦79,847 reads like a bug; ₦79,850 reads
  // like a price, and the difference is immaterial next to the peg's own precision.
  return Math.round(converted / 50) * 50;
}

/**
 * The only function allowed to produce an amount for the Paystack API.
 *
 * Returns subunits, and says so in the name. Nothing else in the codebase should
 * multiply a price by 100.
 */
export function toSubunits(amount, currency = CHARGE_CURRENCY) {
  const meta = CURRENCIES[currency];
  if (!meta) throw new Error(`Unsupported currency: ${currency}`);
  const units = Number(amount);
  if (!Number.isFinite(units) || units < 0) throw new Error(`Invalid amount: ${amount}`);
  return Math.round(units * meta.subunits);
}

/** The inverse, for reading a Paystack response back into something displayable. */
export const fromSubunits = (subunits, currency = CHARGE_CURRENCY) =>
  (Number(subunits) || 0) / (CURRENCIES[currency]?.subunits ?? 100);

export function formatCharge(amount, currency = CHARGE_CURRENCY) {
  const meta = CURRENCIES[currency] ?? CURRENCIES.NGN;
  return `${meta.symbol}${new Intl.NumberFormat('en-NG').format(Math.round(amount))}`;
}

/* ------------------------------------------------------------------ products */

export const PAYMENT_KINDS = {
  SUBSCRIPTION: 'subscription',
  LESSON: 'lesson',
  CLASS_SEAT: 'class-seat',
};

/**
 * What is being paid for, priced in both currencies.
 *
 * One shape for all three products so the checkout screen, the server handler and the
 * webhook all read the same fields. `usd` is the unit of record; `amount` and
 * `amountSubunits` are what actually goes to Paystack.
 */
export function describePayment({ kind, planId = null, item = null }) {
  let usd;
  let label;
  let interval = null;

  if (kind === PAYMENT_KINDS.SUBSCRIPTION) {
    const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId) ?? SUBSCRIPTION_PLANS[0];
    usd = plan.price;
    label = `Ntaka ${plan.label.toLowerCase()} subscription`;
    interval = plan.months === 12 ? 'annually' : 'monthly';
  } else if (kind === PAYMENT_KINDS.LESSON) {
    usd = item?.price ?? 0;
    label = `${item?.lessonTypeLabel ?? 'Lesson'} with ${item?.teacherName ?? 'your teacher'}`;
  } else if (kind === PAYMENT_KINDS.CLASS_SEAT) {
    usd = item?.pricePerSeat ?? 0;
    label = `Seat: ${item?.title ?? 'group class'}`;
  } else {
    throw new Error(`Unknown payment kind: ${kind}`);
  }

  const amount = toChargeCurrency(usd);

  return {
    kind,
    planId,
    label,
    interval,
    usd,
    currency: CHARGE_CURRENCY,
    amount,
    amountSubunits: toSubunits(amount),
    display: formatCharge(amount),
  };
}

/* ---------------------------------------------------------------- references */

/**
 * A payment reference.
 *
 * Must be unique per attempt, not per booking: a learner whose card is declined and who
 * tries again needs a new reference, or Paystack rejects the second attempt as a
 * duplicate and they cannot pay at all.
 */
export function paymentReference(kind, id = '') {
  const random = Math.random().toString(36).slice(2, 10);
  const stamp = Date.now().toString(36);
  return ['ntaka', kind, id, stamp, random].filter(Boolean).join('_').slice(0, 100);
}

/* -------------------------------------------------------------------- status */

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  SUCCESS: 'success',
  FAILED: 'failed',
  ABANDONED: 'abandoned',
};

export const SUBSCRIPTION_STATUS = {
  NONE: 'none',
  ACTIVE: 'active',
  /** Paid up but cancelled: access continues to the end of the period already bought. */
  CANCELLING: 'cancelling',
  PAST_DUE: 'past_due',
  EXPIRED: 'expired',
};

/**
 * Does this subscription grant access right now?
 *
 * `cancelling` counts as access. Someone who cancels on day 2 of a month they paid for
 * keeps it until day 30 — taking it away immediately would be taking money for nothing.
 *
 * `past_due` also counts, for a grace window. A failed renewal is usually an expired card,
 * not a decision to leave, and locking someone out mid-lesson over a retryable charge
 * loses a customer who wanted to stay.
 */
export const GRACE_DAYS = 3;

export function hasAccess(subscription, now = new Date()) {
  if (!subscription) return false;
  const { status, currentPeriodEnd } = subscription;

  if (status === SUBSCRIPTION_STATUS.ACTIVE || status === SUBSCRIPTION_STATUS.CANCELLING) {
    return !currentPeriodEnd || new Date(currentPeriodEnd) > now;
  }

  if (status === SUBSCRIPTION_STATUS.PAST_DUE) {
    if (!currentPeriodEnd) return false;
    const graceEnds = new Date(currentPeriodEnd);
    graceEnds.setDate(graceEnds.getDate() + GRACE_DAYS);
    return graceEnds > now;
  }

  return false;
}

/** Days left, for the banner that tells someone their card needs updating. */
export function daysRemaining(subscription, now = new Date()) {
  if (!subscription?.currentPeriodEnd) return null;
  const ms = new Date(subscription.currentPeriodEnd) - now;
  return Math.ceil(ms / 86400000);
}

/* ----------------------------------------------------------------- test mode */

/**
 * Test mode is inferred from the key, never configured separately.
 *
 * A separate `VITE_PAYSTACK_TEST=true` flag would eventually disagree with the key in use,
 * and the failure mode is the worst one available: a live key with a test banner, or real
 * cards charged on a page that says no money moves.
 */
export const isTestKey = (key) => String(key ?? '').startsWith('pk_test_');

export const PAYSTACK_PUBLIC_KEY = import.meta.env?.VITE_PAYSTACK_PUBLIC_KEY ?? '';

export const paymentsConfigured = () => Boolean(PAYSTACK_PUBLIC_KEY);

export const inTestMode = () => isTestKey(PAYSTACK_PUBLIC_KEY);

/**
 * Cards Paystack provides for test mode. Shown in the UI when a test key is in use, so
 * whoever is testing does not have to go and find them.
 */
export const TEST_CARDS = [
  { number: '4084 0840 8408 4081', outcome: 'Succeeds', note: 'CVV 408, any future expiry, PIN 0000, OTP 123456' },
  { number: '5060 6666 6666 6666 666', outcome: 'Succeeds (Verve)', note: 'CVV 123, any future expiry' },
  { number: '5061 0201 0000 0009 4', outcome: 'Declined', note: 'For testing the failure path' },
  { number: '5060 6666 6666 6666 666', outcome: 'Insufficient funds', note: 'Use amount 300000 or above' },
];

export { SUBSCRIPTION_MONTHLY };

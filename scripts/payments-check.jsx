/**
 * Payments.
 *
 * The assertions worth having here are not "does it charge" — that is Paystack's job and
 * their test mode proves it. They are the three things that go wrong in every payment
 * integration, all of which fail silently:
 *
 *   1. Subunits. Fifty naira sent as `50` charges fifty kobo. Sent as `5000` to the wrong
 *      endpoint it charges fifty thousand. Both directions are a real incident.
 *   2. Trusting the client. The browser callback says "paid" and access is granted, so
 *      anyone with a console subscribes for free.
 *   3. The secret key reaching the bundle, which hands out refunds and transfers.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { createHmac } from 'node:crypto';
import { renderToString } from 'react-dom/server';
import { Provider } from 'react-redux';
import { StaticRouter } from 'react-router-dom/server';
import { makeStore } from '../src/app/store.js';
import { sessionStarted } from '../src/dashboard/auth/authSlice.js';
import {
  subscriptionLoaded,
  selectHasSubscription,
} from '../src/features/payments/subscriptionSlice.js';
import {
  toSubunits,
  fromSubunits,
  toChargeCurrency,
  describePayment,
  paymentReference,
  hasAccess,
  daysRemaining,
  isTestKey,
  SUBSCRIPTION_STATUS,
  PAYMENT_KINDS,
  GRACE_DAYS,
  USD_TO_NGN,
  CHARGE_CURRENCY,
} from '../src/lib/payments.js';
import { verifySignature, grantSubscription } from '../server/paystack.js';
import { SUBSCRIPTION_MONTHLY, SUBSCRIPTION_PLANS } from '../src/lib/pricing.js';
import SubscriptionGate from '../src/features/payments/components/SubscriptionGate.jsx';

let failed = 0;
const ok = (label, cond, note = '') => {
  console.log(`${cond ? 'ok  ' : 'FAIL'} ${label}${note ? `   ${note}` : ''}`);
  if (!cond) failed += 1;
};

const store = {};
globalThis.localStorage = {
  getItem: (k) => (k in store ? store[k] : null),
  setItem: (k, v) => {
    store[k] = String(v);
  },
  removeItem: (k) => {
    delete store[k];
  },
};

/* ------------------------------------------------------------------ subunits */

console.log('\n--- amounts reach Paystack in the right unit ---');
ok('one naira is a hundred kobo', toSubunits(1, 'NGN') === 100);
ok('fifty naira is five thousand kobo', toSubunits(50, 'NGN') === 5000);
ok('subunits round-trip', fromSubunits(toSubunits(1234, 'NGN'), 'NGN') === 1234);
ok('a fractional amount does not lose kobo', toSubunits(41.67, 'NGN') === 4167);
ok('zero is allowed', toSubunits(0, 'NGN') === 0);

let threw = false;
try {
  toSubunits(-5, 'NGN');
} catch {
  threw = true;
}
ok('a negative amount throws rather than refunding by accident', threw);

threw = false;
try {
  toSubunits(10, 'XYZ');
} catch {
  threw = true;
}
ok('an unknown currency throws rather than guessing', threw);

/* ------------------------------------------------------------------ currency */

console.log('\n--- USD prices convert to a charge amount ---');
const monthly = describePayment({ kind: PAYMENT_KINDS.SUBSCRIPTION, planId: 'monthly' });
ok('the plan price is the one in the pricing model', monthly.usd === SUBSCRIPTION_MONTHLY);
ok('it charges in naira', monthly.currency === 'NGN' && CHARGE_CURRENCY === 'NGN');
ok(
  'the naira amount matches the peg',
  Math.abs(monthly.amount - SUBSCRIPTION_MONTHLY * USD_TO_NGN) <= 50,
  `${monthly.display} at ₦${USD_TO_NGN}/$`,
);
ok('the amount sent is in subunits', monthly.amountSubunits === monthly.amount * 100);
ok('amounts round to something that reads like a price', monthly.amount % 50 === 0);

const annual = describePayment({ kind: PAYMENT_KINDS.SUBSCRIPTION, planId: 'annual' });
ok('the annual plan costs more in total', annual.amount > monthly.amount);
ok('both plans are described', SUBSCRIPTION_PLANS.length === 2 && Boolean(annual.interval));

ok(
  'a lesson is priced from the item, not from the request',
  describePayment({ kind: PAYMENT_KINDS.LESSON, item: { price: 20, teacherName: 'Ada' } }).usd === 20,
);
threw = false;
try {
  describePayment({ kind: 'free-money' });
} catch {
  threw = true;
}
ok('an unknown product throws rather than charging zero', threw);

/* ---------------------------------------------------------------- references */

console.log('\n--- references ---');
const a = paymentReference('subscription', 'monthly');
const b = paymentReference('subscription', 'monthly');
ok('a reference is unique per attempt, so a retry can pay', a !== b);
ok('it is within Paystack’s length limit', a.length <= 100);
ok('it says what it was for', a.includes('subscription'));

/* -------------------------------------------------------------- entitlement */

console.log('\n--- who has access ---');
const future = new Date(Date.now() + 30 * 86400000).toISOString();
const past = new Date(Date.now() - 2 * 86400000).toISOString();

ok('no subscription, no access', hasAccess(null) === false);
ok(
  'an active subscription has access',
  hasAccess({ status: SUBSCRIPTION_STATUS.ACTIVE, currentPeriodEnd: future }),
);
ok(
  'an expired one does not',
  !hasAccess({ status: SUBSCRIPTION_STATUS.ACTIVE, currentPeriodEnd: past }),
);
ok(
  'cancelling keeps access to the end of the paid period',
  hasAccess({ status: SUBSCRIPTION_STATUS.CANCELLING, currentPeriodEnd: future }),
  'they paid for it',
);
ok(
  'a failed renewal keeps access through the grace window',
  hasAccess({ status: SUBSCRIPTION_STATUS.PAST_DUE, currentPeriodEnd: past }),
  `${GRACE_DAYS} days — an expired card is not a decision to leave`,
);
ok(
  'but not forever',
  !hasAccess({
    status: SUBSCRIPTION_STATUS.PAST_DUE,
    currentPeriodEnd: new Date(Date.now() - (GRACE_DAYS + 2) * 86400000).toISOString(),
  }),
);
ok('days remaining is reported', daysRemaining({ currentPeriodEnd: future }) >= 29);

async function main() {
  /* ------------------------------------------------------ renewal arithmetic */

  console.log('\n--- renewing does not lose the days already paid for ---');
  const saved = [];
  const existing = { currentPeriodEnd: future };
  const renewed = await grantSubscription({
    userId: 'u1',
    planId: 'monthly',
    existing,
    saveSubscription: (s) => saved.push(s),
  });
  ok(
    'a month is added to the existing end, not to today',
    new Date(renewed.currentPeriodEnd) > new Date(future),
  );
  ok('the subscription is persisted', saved.length === 1);

  const fresh = await grantSubscription({ userId: 'u2', planId: 'annual', saveSubscription: () => {} });
  const months =
    (new Date(fresh.currentPeriodEnd).getFullYear() - new Date(fresh.currentPeriodStart).getFullYear()) * 12 +
    (new Date(fresh.currentPeriodEnd).getMonth() - new Date(fresh.currentPeriodStart).getMonth());
  ok('an annual plan runs twelve months', months === 12);

  /* ------------------------------------------------------------- webhook auth */

  console.log('\n--- webhooks are verified, not trusted ---');
  const secret = 'sk_test_pretend';
  const body = Buffer.from(JSON.stringify({ event: 'charge.success', data: { reference: 'r1' } }));
  const goodSig = createHmac('sha512', secret).update(body).digest('hex');

  ok('a correctly signed body passes', verifySignature(body, goodSig, secret));
  ok('a wrong signature fails', !verifySignature(body, 'deadbeef', secret));
  ok('a signature from another key fails', !verifySignature(body, createHmac('sha512', 'other').update(body).digest('hex'), secret));
  ok('a tampered body fails', !verifySignature(Buffer.from(body.toString().replace('r1', 'r2')), goodSig, secret));
  ok('a missing signature fails', !verifySignature(body, null, secret));
  ok('a missing secret fails closed', !verifySignature(body, goodSig, null));
  ok(
    'a wrong-length signature fails instead of throwing',
    verifySignature(body, 'short', secret) === false,
  );

  /* ---------------------------------------------------------------- test mode */

  console.log('\n--- test mode is inferred from the key ---');
  ok('a test key is test mode', isTestKey('pk_test_abc'));
  ok('a live key is not', !isTestKey('pk_live_abc'));
  ok('no key is not test mode', !isTestKey(''));

  /* ------------------------------------------------------------ the hard rules */

  console.log('\n--- the secret never reaches the browser ---');
  const walk = (dir, out = []) => {
    for (const entry of readdirSync(dir)) {
      const full = `${dir}/${entry}`;
      if (statSync(full).isDirectory()) walk(full, out);
      else if (/\.jsx?$/.test(full)) out.push(full);
    }
    return out;
  };
  const clientFiles = walk('src');
  /*
   * Naming the variable in setup instructions is fine and useful. What must never appear
   * in client code is key MATERIAL, or a VITE_ name that Vite would inline into the
   * bundle. The billing page tells a developer to set PAYSTACK_SECRET_KEY on the server,
   * which is documentation, not a leak.
   */
  const LEAKS = [
    new RegExp('sk_(test|live)_[A-Za-z0-9]{8,}'),
    new RegExp('VITE_PAYSTACK_SECRET'),
    new RegExp('env\\.PAYSTACK_SECRET'),
  ];
  const leaking = clientFiles.filter((f) => {
    const text = readFileSync(f, 'utf8');
    return LEAKS.some((pattern) => pattern.test(text));
  });
  ok(
    'no client file carries secret key material',
    leaking.length === 0,
    leaking.length ? leaking.join(", ") : `${clientFiles.length} files scanned`,
  );

  // An uncommented VITE_PAYSTACK_SECRET assignment would be the real mistake. The
  // template's warning ABOUT that mistake is exactly what we want to keep.
  const envText = readFileSync('.env.example', 'utf8');
  const envAssignments = envText
    .split(new RegExp('\\r?\\n'))
    .filter((line) => !line.trimStart().startsWith('#'));
  ok(
    'no VITE_ secret is ever assigned in the env template',
    !envAssignments.some((line) => line.trimStart().startsWith('VITE_PAYSTACK_SECRET')),
  );
  ok(
    'and the template explains why not',
    envText.includes('DOES NOT BELONG IN A VITE_ VARIABLE'),
  );

  const serverSrc = readFileSync('server/paystack.js', 'utf8');
  ok('the server verifies against Paystack itself', serverSrc.includes('/transaction/verify/'));
  ok(
    'the amount is derived server-side, never read from the request',
    serverSrc.includes('describePayment(') && !/amount:\s*(req|body|payload)\./.test(serverSrc),
  );
  ok('a reference cannot be verified by another user', serverSrc.includes('reference_not_yours'));
  ok('the webhook returns 200 for unknown events', serverSrc.includes("default:"));
  ok('it fails closed with no key', serverSrc.includes("if (!secretKey) return { error: 'payments_unconfigured' }"));

  /* ------------------------------------------------------------------ the gate */

  console.log('\n--- the paywall ---');
  const app = makeStore();
  app.dispatch(sessionStarted({ expiresAt: Date.now() + 3.6e6, user: { id: 'p1', role: 'learner', displayName: 'Ada' } }));
  ok('a new learner has no subscription', selectHasSubscription(app.getState()) === false);

  app.dispatch(
    subscriptionLoaded({ status: SUBSCRIPTION_STATUS.ACTIVE, currentPeriodEnd: future, planId: 'monthly' }),
  );
  ok('after paying, they do', selectHasSubscription(app.getState()) === true);

  const html = renderToString(
    <Provider store={app}>
      <StaticRouter location="/dashboard">
        <SubscriptionGate courseName="Yorùbá for beginners" />
      </StaticRouter>
    </Provider>,
  ).replaceAll('<!-- -->', '');
  ok('the gate names the course rather than going blank', html.includes('Yorùbá for beginners'));
  ok('it says the plan covers every language', html.includes('every interactive course'));
  ok('it links to the plans', html.includes('/dashboard/billing'));
  ok('it points live learners elsewhere', html.includes('paid as you go'));

  const player = readFileSync('src/dashboard/learning/CoursePlayer.jsx', 'utf8');
  ok('the player checks the subscription', player.includes('selectHasSubscription'));
  ok('open courses stay open', player.includes('!course.isOpen'));
  ok(
    'placement is checked before the paywall, so nobody pays before they have a level',
    player.indexOf('if (gate.required)') < player.indexOf('if (needsPlan)') &&
      player.includes('if (needsPlan)'),
  );

  console.log(failed ? `\nPAYMENT CHECKS FAILED (${failed})` : '\nPAYMENT CHECKS OK');
  process.exit(failed ? 1 : 0);
}

main();

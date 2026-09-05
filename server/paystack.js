/**
 * POST /pay/initialize   { kind, planId?, itemId? }  -> { authorizationUrl, reference }
 * GET  /pay/verify       ?reference=...              -> { status, paid, subscription? }
 * POST /pay/webhook      (Paystack event)            -> 200, always
 *
 * Paystack, server-side. Test mode and live mode run the same code — only the key differs.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  PAYSTACK_SECRET_KEY IS SERVER-ONLY
 * ─────────────────────────────────────────────────────────────────────────────
 *  Same rule as DAILY_API_KEY and GROQ_API_KEY. Vite inlines every VITE_-prefixed
 *  variable into public JavaScript, so VITE_PAYSTACK_SECRET_KEY would hand every
 *  visitor the ability to refund, transfer out, and read every customer record.
 *  The PUBLIC key (pk_test_… / pk_live_…) is safe in the browser. The secret is not.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  THE RULE THAT MATTERS: NEVER TRUST THE CLIENT ABOUT PAYMENT
 * ─────────────────────────────────────────────────────────────────────────────
 *  Paystack's inline checkout calls a JavaScript callback on success. That callback is
 *  a hint, not proof — anyone can call it from the console. Access is granted in
 *  exactly two places, both here:
 *
 *    1. `verify`, which asks Paystack directly what happened to a reference.
 *    2. `webhook`, which Paystack calls server-to-server and signs.
 *
 *  And the amount is re-derived from our own catalogue on both paths, never read from
 *  the request. Otherwise a learner posts { amount: 100 } and subscribes for a naira.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  WEBHOOK SIGNATURES
 * ─────────────────────────────────────────────────────────────────────────────
 *  Paystack signs each webhook with HMAC SHA512 of the RAW body using the secret key,
 *  in the `x-paystack-signature` header. It must be verified against the raw bytes —
 *  JSON.parse then re-stringify changes key order and whitespace and the signature will
 *  never match. Mount this before any body-parsing middleware, or keep the raw body.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  TESTING
 * ─────────────────────────────────────────────────────────────────────────────
 *      PAYSTACK_SECRET_KEY=sk_test_...            (server environment)
 *      VITE_PAYSTACK_PUBLIC_KEY=pk_test_...       (safe in .env)
 *
 *  Test cards are listed in src/lib/payments.js and shown in the UI while a test key
 *  is in use. Webhooks need a public URL in development:
 *      npx localtunnel --port 5173
 *  then set that URL in the Paystack dashboard under Settings → API Keys & Webhooks.
 *
 *  `loadUser`, `saveSubscription`, `savePayment` and `loadItem` are injected, so this
 *  file has no database dependency and can be tested with fakes.
 */

import { createHmac, timingSafeEqual } from 'node:crypto';
import {
  describePayment,
  paymentReference,
  PAYMENT_KINDS,
  PAYMENT_STATUS,
  SUBSCRIPTION_STATUS,
  CHARGE_CURRENCY,
  fromSubunits,
} from '../src/lib/payments.js';

const PAYSTACK_API = 'https://api.paystack.co';

async function paystack(path, { secretKey, method = 'GET', body } = {}) {
  const response = await fetch(`${PAYSTACK_API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.status) {
    const message = data?.message ?? `Paystack ${response.status}`;
    throw Object.assign(new Error(message), { status: response.status, data });
  }
  return data.data;
}

/* --------------------------------------------------------------- initialize */

/**
 * Start a payment. Returns a URL to send the learner to.
 *
 * The amount is derived here from `kind` and `planId`, never accepted from the caller.
 * That single decision is what stops someone subscribing for one naira.
 */
export function createInitializeHandler({ secretKey, loadItem = null, callbackUrl }) {
  return async function initialize({ user, kind, planId = null, itemId = null }) {
    if (!secretKey) return { error: 'payments_unconfigured' };
    if (!user?.email) return { error: 'not_signed_in' };

    const item = itemId && loadItem ? await loadItem(kind, itemId) : null;
    if (itemId && !item) return { error: 'item_not_found' };

    const payment = describePayment({ kind, planId, item });
    if (payment.amount <= 0) return { error: 'nothing_to_pay' };

    const reference = paymentReference(kind, itemId ?? planId ?? '');

    const data = await paystack('/transaction/initialize', {
      secretKey,
      method: 'POST',
      body: {
        email: user.email,
        amount: payment.amountSubunits,
        currency: payment.currency,
        reference,
        callback_url: callbackUrl,
        /*
         * Metadata comes back on verify and on the webhook, which is how a payment is
         * matched to what it was for. It is a convenience for us, not a source of truth:
         * the amount is still re-derived on the way back.
         */
        metadata: {
          userId: user.id,
          kind,
          planId,
          itemId,
          usd: payment.usd,
          label: payment.label,
        },
      },
    });

    return {
      reference,
      authorizationUrl: data.authorization_url,
      accessCode: data.access_code,
      amount: payment.amount,
      display: payment.display,
    };
  };
}

/* ------------------------------------------------------------------- verify */

/**
 * Ask Paystack what actually happened, and grant access only on its answer.
 *
 * Called when the learner returns from checkout. The webhook is the reliable path — a
 * learner who closes the tab still gets access — but this one gives immediate feedback
 * rather than making them wait for a webhook to land.
 */
export function createVerifyHandler({ secretKey, savePayment, saveSubscription }) {
  return async function verify({ reference, user }) {
    if (!secretKey) return { error: 'payments_unconfigured' };
    if (!reference) return { error: 'no_reference' };

    let data;
    try {
      data = await paystack(`/transaction/verify/${encodeURIComponent(reference)}`, { secretKey });
    } catch {
      // A verify failure is not a payment failure. Say "still checking" rather than
      // telling someone their successful payment failed.
      return { status: PAYMENT_STATUS.PENDING, paid: false, pending: true };
    }

    // The reference belongs to whoever started it. Without this check, one learner can
    // verify another's reference and be granted their subscription.
    if (user?.id && data.metadata?.userId && data.metadata.userId !== user.id) {
      return { error: 'reference_not_yours' };
    }

    const paid = data.status === 'success';
    const record = {
      reference,
      status: paid ? PAYMENT_STATUS.SUCCESS : PAYMENT_STATUS.FAILED,
      amount: fromSubunits(data.amount, data.currency ?? CHARGE_CURRENCY),
      currency: data.currency ?? CHARGE_CURRENCY,
      paidAt: data.paid_at ?? null,
      channel: data.channel ?? null,
      kind: data.metadata?.kind ?? null,
      itemId: data.metadata?.itemId ?? null,
      userId: data.metadata?.userId ?? user?.id ?? null,
    };

    await savePayment?.(record);

    let subscription = null;
    if (paid && record.kind === PAYMENT_KINDS.SUBSCRIPTION) {
      subscription = await grantSubscription({
        userId: record.userId,
        planId: data.metadata?.planId,
        paidAt: data.paid_at,
        authorizationCode: data.authorization?.authorization_code ?? null,
        saveSubscription,
      });
    }

    return { status: record.status, paid, payment: record, subscription };
  };
}

/**
 * Extend a subscription to the end of the period just paid for.
 *
 * Extending from the CURRENT period end rather than from today matters for anyone paying
 * early or renewing before expiry — otherwise they silently lose the days they had left.
 */
export async function grantSubscription({
  userId,
  planId = 'monthly',
  paidAt = null,
  authorizationCode = null,
  existing = null,
  saveSubscription,
}) {
  const months = planId === 'annual' ? 12 : 1;
  const now = paidAt ? new Date(paidAt) : new Date();

  const startFrom =
    existing?.currentPeriodEnd && new Date(existing.currentPeriodEnd) > now
      ? new Date(existing.currentPeriodEnd)
      : now;

  const currentPeriodEnd = new Date(startFrom);
  currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + months);

  const subscription = {
    userId,
    planId,
    status: SUBSCRIPTION_STATUS.ACTIVE,
    currentPeriodStart: now.toISOString(),
    currentPeriodEnd: currentPeriodEnd.toISOString(),
    authorizationCode,
  };

  await saveSubscription?.(subscription);
  return subscription;
}

/* ------------------------------------------------------------------ webhook */

/**
 * Verify a Paystack webhook signature.
 *
 * `rawBody` must be the exact bytes received. Re-serialising parsed JSON changes key
 * order and whitespace, and the HMAC will never match.
 */
export function verifySignature(rawBody, signature, secretKey) {
  if (!rawBody || !signature || !secretKey) return false;
  const expected = createHmac('sha512', secretKey).update(rawBody).digest('hex');
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(String(signature), 'utf8');
  // Length check first: timingSafeEqual throws on a mismatch rather than returning false.
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * Handle a Paystack event.
 *
 * Always returns 200 once the signature checks out, even when we do nothing with the
 * event. Paystack retries non-2xx responses, and a handler that 500s on an event type it
 * does not recognise turns one unknown event into a retry storm.
 */
export function createWebhookHandler({ secretKey, loadSubscription, saveSubscription, savePayment }) {
  return async function webhook({ rawBody, signature }) {
    if (!verifySignature(rawBody, signature, secretKey)) {
      return { status: 401, body: 'invalid signature' };
    }

    let event;
    try {
      event = JSON.parse(rawBody.toString('utf8'));
    } catch {
      return { status: 400, body: 'unparseable' };
    }

    const data = event?.data ?? {};
    const userId = data.metadata?.userId ?? null;

    switch (event?.event) {
      case 'charge.success': {
        await savePayment?.({
          reference: data.reference,
          status: PAYMENT_STATUS.SUCCESS,
          amount: fromSubunits(data.amount, data.currency ?? CHARGE_CURRENCY),
          currency: data.currency ?? CHARGE_CURRENCY,
          paidAt: data.paid_at ?? null,
          channel: data.channel ?? null,
          kind: data.metadata?.kind ?? null,
          itemId: data.metadata?.itemId ?? null,
          userId,
        });

        if (data.metadata?.kind === PAYMENT_KINDS.SUBSCRIPTION && userId) {
          const existing = await loadSubscription?.(userId);
          await grantSubscription({
            userId,
            planId: data.metadata?.planId,
            paidAt: data.paid_at,
            authorizationCode: data.authorization?.authorization_code ?? null,
            existing,
            saveSubscription,
          });
        }
        break;
      }

      case 'invoice.payment_failed':
      case 'subscription.not_renew': {
        // Not an eviction. `hasAccess` keeps them in through the grace window, because a
        // failed renewal is usually an expired card rather than a decision to leave.
        if (userId) {
          const existing = await loadSubscription?.(userId);
          if (existing) {
            await saveSubscription?.({ ...existing, status: SUBSCRIPTION_STATUS.PAST_DUE });
          }
        }
        break;
      }

      case 'subscription.disable': {
        if (userId) {
          const existing = await loadSubscription?.(userId);
          if (existing) {
            // Cancelled, but paid up: access runs to the end of the period already bought.
            await saveSubscription?.({ ...existing, status: SUBSCRIPTION_STATUS.CANCELLING });
          }
        }
        break;
      }

      default:
        // Unknown event: acknowledged and ignored, deliberately.
        break;
    }

    return { status: 200, body: 'ok' };
  };
}

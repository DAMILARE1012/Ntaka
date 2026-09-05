import { useState } from 'react';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import Badge from '@/components/ui/Badge';
import { cx, formatPrice, formatDay } from '@/lib/format';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { selectUser } from '@/dashboard/auth/authSlice';
import {
  selectSubscription,
  selectPayments,
  selectHasSubscription,
  selectDaysRemaining,
  subscriptionLoaded,
  paymentRecorded,
  subscriptionCancelled,
} from '@/features/payments/subscriptionSlice';
import {
  SUBSCRIPTION_STATUS,
  PAYMENT_STATUS,
  describePayment,
  paymentReference,
  paymentsConfigured,
  inTestMode,
  PAYSTACK_PUBLIC_KEY,
  TEST_CARDS,
  PAYMENT_KINDS,
  USD_TO_NGN,
} from '@/lib/payments';
import { SUBSCRIPTION_PLANS, SUBSCRIPTION_INCLUDES } from '@/lib/pricing';
import { PageTitle, Panel } from '@/dashboard/components/Panel';

/**
 * Subscription and billing.
 *
 * The checkout here is a SIMULATION while there is no server. `server/paystack.js` holds
 * the real implementation — initialize, verify, webhook — and this page is written so that
 * swapping the simulated call for a fetch to it changes one function, `startCheckout`.
 *
 * The simulation is explicit on screen rather than hidden. A payment page that quietly
 * pretends to work is how a team ends up shipping one, and the banner is the difference
 * between a demo and a lie.
 */

const STATUS_LABEL = {
  [SUBSCRIPTION_STATUS.ACTIVE]: 'Active',
  [SUBSCRIPTION_STATUS.CANCELLING]: 'Cancelling',
  [SUBSCRIPTION_STATUS.PAST_DUE]: 'Payment failed',
  [SUBSCRIPTION_STATUS.EXPIRED]: 'Expired',
};

export default function BillingPage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const subscription = useAppSelector(selectSubscription);
  const payments = useAppSelector(selectPayments);
  const active = useAppSelector(selectHasSubscription);
  const daysLeft = useAppSelector(selectDaysRemaining);

  const [busy, setBusy] = useState(null);

  /**
   * The one function that changes when the server lands.
   *
   * Real version:
   *   const res = await fetch('/pay/initialize', { method: 'POST', body: ... });
   *   window.location.href = (await res.json()).authorizationUrl;
   * ...and access is granted by /pay/verify or the webhook, never here.
   */
  const startCheckout = async (planId) => {
    setBusy(planId);
    const payment = describePayment({ kind: PAYMENT_KINDS.SUBSCRIPTION, planId });
    const reference = paymentReference(PAYMENT_KINDS.SUBSCRIPTION, planId);

    await new Promise((resolve) => setTimeout(resolve, 600));

    const months = planId === 'annual' ? 12 : 1;
    const start = new Date();
    const end = new Date(start);
    end.setMonth(end.getMonth() + months);

    dispatch(
      subscriptionLoaded({
        userId: user?.id,
        planId,
        status: SUBSCRIPTION_STATUS.ACTIVE,
        currentPeriodStart: start.toISOString(),
        currentPeriodEnd: end.toISOString(),
      }),
    );
    dispatch(
      paymentRecorded({
        reference,
        status: PAYMENT_STATUS.SUCCESS,
        amount: payment.amount,
        currency: payment.currency,
        paidAt: start.toISOString(),
        channel: 'card',
        kind: PAYMENT_KINDS.SUBSCRIPTION,
        label: payment.label,
      }),
    );
    setBusy(null);
  };

  return (
    <>
      <PageTitle
        title="Subscription"
        description="Interactive learning runs on one plan covering every language. Live lessons and group classes are paid as you go."
      />

      {/* ------------------------------------------------------ what mode this is */}
      <div
        className={cx(
          'mb-6 flex flex-wrap items-start gap-3 rounded-xl border p-4',
          paymentsConfigured() && !inTestMode()
            ? 'border-danger-border bg-danger-soft'
            : 'border-line bg-subtle',
        )}
      >
        <Icon name="shield" className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
        <div className="min-w-0 text-sm">
          {!paymentsConfigured() ? (
            <>
              <p className="font-semibold text-fg">Payments are not connected yet.</p>
              <p className="mt-1 leading-relaxed text-muted">
                Checkout below is simulated so the rest of the flow can be used and tested. Set{' '}
                <code className="rounded bg-surface px-1.5 py-0.5 text-xs">
                  VITE_PAYSTACK_PUBLIC_KEY
                </code>{' '}
                and the server&rsquo;s{' '}
                <code className="rounded bg-surface px-1.5 py-0.5 text-xs">
                  PAYSTACK_SECRET_KEY
                </code>{' '}
                to use Paystack test mode. No money moves either way.
              </p>
            </>
          ) : inTestMode() ? (
            <>
              <p className="font-semibold text-fg">Paystack test mode.</p>
              <p className="mt-1 leading-relaxed text-muted">
                Real Paystack checkout, no real money. Use a test card below.
              </p>
            </>
          ) : (
            <>
              <p className="font-semibold text-fg">Live mode — real cards will be charged.</p>
              <p className="mt-1 leading-relaxed text-muted">
                This key starts with <code>pk_live_</code>. Anything you do here moves money.
              </p>
            </>
          )}
        </div>
      </div>

      {/* --------------------------------------------------------- current state */}
      <Panel title="Your plan">
        {active ? (
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="flex flex-wrap items-center gap-2">
                <span className="font-display text-lg font-semibold text-fg">
                  {subscription.planId === 'annual' ? 'Annual' : 'Monthly'} subscription
                </span>
                <Badge tone={subscription.status === SUBSCRIPTION_STATUS.ACTIVE ? 'palm' : 'neutral'}>
                  {STATUS_LABEL[subscription.status] ?? subscription.status}
                </Badge>
              </p>
              <p className="mt-1.5 text-sm text-muted">
                {subscription.status === SUBSCRIPTION_STATUS.CANCELLING
                  ? `Cancelled — you keep access until ${formatDay(subscription.currentPeriodEnd)}.`
                  : `Renews ${formatDay(subscription.currentPeriodEnd)}${
                      daysLeft != null ? ` · ${daysLeft} days away` : ''
                    }`}
              </p>
              <p className="mt-3 text-sm text-brand">
                Every interactive course in every language is open to you.
              </p>
            </div>

            {subscription.status === SUBSCRIPTION_STATUS.ACTIVE && (
              <Button variant="outline" size="sm" onClick={() => dispatch(subscriptionCancelled())}>
                Cancel subscription
              </Button>
            )}
          </div>
        ) : (
          <>
            <p className="text-sm text-muted">
              No subscription. Live lessons and group classes still work — those are paid per
              lesson and per seat.
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {SUBSCRIPTION_PLANS.map((plan, i) => (
                <div
                  key={plan.id}
                  className={cx(
                    'rounded-2xl border p-5',
                    i === 1 ? 'border-brand-border bg-brand-soft/50' : 'border-line',
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-display font-semibold text-fg">{plan.label}</h3>
                    {plan.saving > 0 && <Badge tone="palm">Save {formatPrice(plan.saving)}</Badge>}
                  </div>
                  <p className="mt-2">
                    <span className="font-display text-2xl font-semibold text-fg">
                      {formatPrice(plan.price)}
                    </span>
                    <span className="text-sm text-muted"> a {plan.per}</span>
                  </p>
                  <p className="nums mt-1 text-xs text-faint">
                    Charged as{' '}
                    {describePayment({ kind: PAYMENT_KINDS.SUBSCRIPTION, planId: plan.id }).display}
                  </p>

                  <Button
                    className="mt-4"
                    fullWidth
                    disabled={busy !== null}
                    onClick={() => startCheckout(plan.id)}
                  >
                    {busy === plan.id ? 'Opening checkout…' : `Pay ${plan.per}ly`}
                  </Button>
                </div>
              ))}
            </div>

            <ul className="mt-5 grid gap-2 border-t border-line pt-5 sm:grid-cols-2">
              {SUBSCRIPTION_INCLUDES.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-muted">
                  <Icon name="check" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" strokeWidth={3} />
                  {item}
                </li>
              ))}
            </ul>
          </>
        )}
      </Panel>

      {/* ------------------------------------------------------------- currency */}
      <Panel title="How you are charged" className="mt-6">
        <p className="text-sm leading-relaxed text-muted">
          Prices are set in US dollars and charged in Nigerian naira through Paystack, at a
          fixed rate of <span className="nums font-semibold text-fg">₦{USD_TO_NGN}</span> to the
          dollar. The rate is a configured peg rather than a live market rate, so the amount you
          are quoted is the amount you are charged — it does not move between the page and the
          payment sheet.
        </p>
      </Panel>

      {/* ---------------------------------------------------------- test cards */}
      {(inTestMode() || !paymentsConfigured()) && (
        <Panel title="Test cards" className="mt-6">
          <p className="text-sm text-muted">
            Paystack&rsquo;s test cards, so nobody has to go looking for them.
          </p>
          <ul className="mt-4 divide-y divide-line">
            {TEST_CARDS.map((card, i) => (
              <li key={`${card.number}-${i}`} className="py-3 first:pt-0">
                <p className="flex flex-wrap items-center gap-3">
                  <code className="nums rounded bg-subtle px-2 py-1 text-sm text-fg">
                    {card.number}
                  </code>
                  <Badge tone={card.outcome.startsWith('Succeeds') ? 'palm' : 'neutral'}>
                    {card.outcome}
                  </Badge>
                </p>
                <p className="mt-1.5 text-xs text-muted">{card.note}</p>
              </li>
            ))}
          </ul>
          {PAYSTACK_PUBLIC_KEY && (
            <p className="mt-4 text-xs text-faint">
              Key in use: <code>{PAYSTACK_PUBLIC_KEY.slice(0, 12)}…</code>
            </p>
          )}
        </Panel>
      )}

      {/* -------------------------------------------------------------- history */}
      <Panel title="Payments" className="mt-6">
        {payments.length ? (
          <ul className="divide-y divide-line">
            {payments.map((payment) => (
              <li key={payment.reference} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-fg">{payment.label ?? payment.kind}</p>
                  <p className="mt-0.5 text-2xs text-faint">
                    {formatDay(payment.paidAt)} · <code>{payment.reference}</code>
                  </p>
                </div>
                <span className="flex items-center gap-3">
                  <span className="nums text-sm font-semibold text-fg">
                    ₦{new Intl.NumberFormat('en-NG').format(payment.amount)}
                  </span>
                  <Badge tone={payment.status === PAYMENT_STATUS.SUCCESS ? 'palm' : 'neutral'}>
                    {payment.status}
                  </Badge>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">Nothing yet.</p>
        )}
      </Panel>
    </>
  );
}

import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import Badge from '@/components/ui/Badge';
import Seo from '@/components/common/Seo';
import { PageHeader } from '@/components/layout/PageLayout';
import { STATIC_SEO } from '@/lib/seo';
import { graph, collectionPage, breadcrumbs } from '@/lib/structuredData';
import { formatPrice, cx } from '@/lib/format';
import {
  SUBSCRIPTION_PLANS,
  SUBSCRIPTION_INCLUDES,
  SUBSCRIPTION_MONTHLY,
  PLATFORM_REFERENCE_HOURLY,
  GROUP_FACTOR_BY_SIZE,
  subscriptionBreakEven,
  subscriptionHourly,
  hourlyFor,
  LEARNING_MODES,
} from '@/lib/pricing';

/**
 * How the three modes are paid for.
 *
 * They are sold in three different units — per lesson, per seat, per month — so the page
 * says so plainly and then gives the one number that compares them: what an hour works out
 * at. Hiding that a subscription only beats a group class above a certain amount of study
 * would make the page more persuasive and less true.
 */
export default function PricingPage() {
  const breakEven = subscriptionBreakEven();
  const oneToOne = hourlyFor(LEARNING_MODES.ONE_TO_ONE, PLATFORM_REFERENCE_HOURLY);

  const sizes = Object.entries(GROUP_FACTOR_BY_SIZE)
    .map(([seats, factor]) => ({
      seats: Number(seats),
      hourly: Math.round(PLATFORM_REFERENCE_HOURLY * factor),
      off: Math.round((1 - factor) * 100),
    }))
    .sort((a, b) => a.seats - b.seats);

  return (
    <>
      <Seo
        {...STATIC_SEO.pricing}
        jsonLd={graph(
          collectionPage({ ...STATIC_SEO.pricing, itemType: 'Pricing' }),
          breadcrumbs([
            { name: 'Home', path: '/' },
            { name: 'Pricing', path: '/pricing' },
          ]),
        )}
      />

      <PageHeader
        eyebrow="Pricing"
        title="Three ways to learn, three ways to pay"
        description="Private lessons by the hour, group classes by the seat, and everything self-paced on one subscription."
      />

      {/* ------------------------------------------------------ subscription */}
      <section className="container py-12">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold sm:text-2xl">Interactive learning</h2>
            <p className="mt-2 max-w-2xl text-sm text-muted">
              One subscription, every language we teach, no limit on how much you use it. Not
              one course at a time — start Yorùbá, add Igbo, come back to Swahili, all on the
              same plan, for as long as you subscribe.
            </p>
          </div>
          <Badge tone="palm">
            <Icon name="globe" className="h-3.5 w-3.5" />
            All languages included
          </Badge>
        </div>

        <div className="mt-7 grid gap-5 lg:grid-cols-[repeat(2,minmax(0,22rem))]">
          {SUBSCRIPTION_PLANS.map((plan, index) => (
            <div
              key={plan.id}
              className={cx(
                'surface-card flex flex-col p-6',
                index === 1 && 'border-brand-border ring-1 ring-brand-border',
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-display text-lg font-semibold text-fg">{plan.label}</h3>
                {plan.saving > 0 && <Badge tone="palm">Save {formatPrice(plan.saving)}</Badge>}
              </div>

              <p className="mt-3">
                <span className="font-display text-3xl font-semibold text-fg">
                  {formatPrice(plan.price)}
                </span>
                <span className="text-md text-muted"> a {plan.per}</span>
              </p>
              {plan.perMonth && (
                <p className="nums mt-1 text-sm text-muted">
                  {formatPrice(plan.perMonth)} a month, billed yearly
                </p>
              )}
              <p className="mt-1 text-xs text-faint">{plan.note}</p>

              <Button className="mt-5" fullWidth to="/signup">
                Start learning
              </Button>
            </div>
          ))}

          <ul className="space-y-2.5 lg:col-span-2">
            {SUBSCRIPTION_INCLUDES.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-fg">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand text-brand-fg">
                  <Icon name="check" className="h-3 w-3" strokeWidth={3} />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ------------------------------------------------------------- live */}
      <section className="border-t border-line bg-surface py-12">
        <div className="container">
          <h2 className="text-xl font-semibold sm:text-2xl">Live teaching</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Paid per lesson or per seat, at each teacher&rsquo;s own rate — so the figures
            below are for a typical {formatPrice(PLATFORM_REFERENCE_HOURLY)} an hour teacher.
            Cheaper and dearer teachers scale from there.
          </p>

          <div className="mt-7 grid gap-5 lg:grid-cols-2">
            <div className="surface-card p-6">
              <h3 className="font-display text-lg font-semibold text-fg">1-on-1 lessons</h3>
              <p className="mt-3">
                <span className="font-display text-3xl font-semibold text-fg">
                  {formatPrice(oneToOne)}
                </span>
                <span className="text-md text-muted"> an hour</span>
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Private and live, entirely at your pace. The dearest per hour, and the
                fastest way to improve — nobody else is using the time.
              </p>
              <p className="mt-3 text-xs text-faint">
                Most teachers offer a shorter trial lesson at a reduced rate.
              </p>
            </div>

            <div className="surface-card p-6">
              <h3 className="font-display text-lg font-semibold text-fg">Group classes</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Priced per person, and always below the private rate. A smaller class costs
                more per seat because you get more of the teacher — the price is set by the
                seats offered, so it never changes based on how many people book.
              </p>
              <ul className="mt-4 divide-y divide-line">
                {sizes.map((row) => (
                  <li key={row.seats} className="flex items-center justify-between gap-3 py-2 text-sm">
                    <span className="text-muted">Up to {row.seats} learners</span>
                    <span className="flex items-center gap-2">
                      <span className="nums font-semibold text-fg">
                        {formatPrice(row.hourly)} an hour
                      </span>
                      <Badge tone="neutral">{row.off}% off</Badge>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------- honesty */}
      <section className="container py-12">
        <div className="surface-card p-6 sm:p-8">
          <h2 className="text-lg font-semibold">Which works out cheapest?</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            It depends entirely on how much you study, and it would be easy to imply
            otherwise. The subscription is a flat {formatPrice(SUBSCRIPTION_MONTHLY)} a month
            however much you use it, so the more you learn the less each hour costs. Against a
            typical {formatPrice(PLATFORM_REFERENCE_HOURLY)} an hour teacher, it beats paying
            per seat once you pass about{' '}
            <span className="font-semibold text-fg">
              {breakEven.vsGroupHours} hours a month
            </span>{' '}
            — roughly {breakEven.perWeek} hours a week.
          </p>

          <ul className="mt-5 divide-y divide-line border-y border-line">
            {[2, 4, 8, 20].map((hours) => {
              const rate = subscriptionHourly(hours);
              const beatsGroup = rate < breakEven.groupHourly;
              return (
                <li key={hours} className="flex flex-wrap items-center justify-between gap-3 py-2.5 text-sm">
                  <span className="text-muted">
                    {hours} hours a month
                    <span className="text-faint"> · about {Math.round((hours / 4) * 10) / 10} a week</span>
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="nums font-semibold text-fg">
                      {formatPrice(Math.round(rate * 100) / 100)} an hour
                    </span>
                    <Badge tone={beatsGroup ? 'palm' : 'neutral'}>
                      {beatsGroup ? 'Beats a group seat' : 'Pay per seat instead'}
                    </Badge>
                  </span>
                </li>
              );
            })}
          </ul>

          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted">
            So this plan is built for someone learning regularly rather than dipping in. If you
            study less than an hour a week, book a group class seat and keep your money — we
            would rather tell you that than take {formatPrice(SUBSCRIPTION_MONTHLY)} a month for
            something you open twice.
          </p>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
            Most people mix all three: the subscription for the daily half hour across whichever
            languages they are learning, a group class for speaking practice, and a private
            lesson when something specific is stuck.
          </p>
        </div>
      </section>

    </>
  );
}

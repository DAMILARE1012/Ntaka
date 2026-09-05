import { Link } from 'react-router-dom';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import Badge from '@/components/ui/Badge';
import { formatPrice } from '@/lib/format';
import { SUBSCRIPTION_MONTHLY, SUBSCRIPTION_INCLUDES } from '@/lib/pricing';

/**
 * Shown where interactive learning needs a subscription and there is not one.
 *
 * Two things it deliberately does NOT do.
 *
 * It does not pretend to be a security control. This is a UI state; the content itself is
 * withheld server-side. A paywall a determined person can bypass in devtools is fine as
 * long as nobody mistook it for the lock — and the way people make that mistake is by
 * writing the check only in the component.
 *
 * And it does not hide what the course is. The title, the lessons and the syllabus stay
 * visible above this. Someone deciding whether $50 a month is worth it needs to see what
 * they would get; a blank page with a price on it sells nothing.
 */
export default function SubscriptionGate({ courseName, compact = false, className }) {
  if (compact) {
    return (
      <div className={className}>
        <div className="rounded-xl border border-brand-border bg-brand-soft p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-fg">
            <Icon name="sparkles" className="h-4 w-4 text-brand" />
            Included with a subscription
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-muted">
            {formatPrice(SUBSCRIPTION_MONTHLY)} a month for every course in every language.
          </p>
          <Button to="/dashboard/billing" size="sm" className="mt-3" fullWidth>
            See plans
          </Button>
        </div>
      </div>
    );
  }

  return (
    <section className={className}>
      <div className="overflow-hidden rounded-3xl border border-brand-border bg-brand-soft">
        <div className="brand-rule" />
        <div className="p-7 sm:p-9">
          <Badge tone="palm">
            <Icon name="globe" className="h-3.5 w-3.5" />
            All languages, one plan
          </Badge>

          <h2 className="mt-4 text-balance font-display text-xl font-semibold text-fg sm:text-2xl">
            {courseName
              ? `${courseName} is part of the Ntaka subscription`
              : 'Interactive learning runs on a subscription'}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
            One price covers every interactive course we make, in all the languages we teach —
            not this course alone. Start one language, add another, come back to a third.
          </p>

          <ul className="mt-5 grid gap-2 sm:grid-cols-2">
            {SUBSCRIPTION_INCLUDES.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-fg">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand text-brand-fg">
                  <Icon name="check" className="h-3 w-3" strokeWidth={3} />
                </span>
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Button to="/dashboard/billing" size="lg">
              Subscribe for {formatPrice(SUBSCRIPTION_MONTHLY)} a month
              <Icon name="arrowRight" className="h-4 w-4" />
            </Button>
            <Link to="/pricing" className="link-arrow">
              Compare all three ways to learn
              <Icon name="arrowRight" className="h-4 w-4" />
            </Link>
          </div>

          <p className="mt-4 text-xs text-faint">
            Prefer live teaching? 1-on-1 lessons and group classes are paid as you go, with no
            subscription.
          </p>
        </div>
      </div>
    </section>
  );
}

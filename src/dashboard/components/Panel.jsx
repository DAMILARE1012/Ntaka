import { Link } from 'react-router-dom';
import Icon from '@/components/ui/Icon';
import { cx } from '@/lib/format';

/** Page title for a dashboard screen. */
export function PageTitle({ title, description, action }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        {description && <p className="mt-1.5 text-sm text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

/** A bordered section with an optional header link. */
export function Panel({ title, action, children, className }) {
  return (
    <section className={cx('rounded-xl border border-line bg-surface', className)}>
      {(title || action) && (
        <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
          <h2 className="text-sm font-semibold text-fg">{title}</h2>
          {action}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

/** Compact figure tile. `tone` marks a number that needs attention. */
export function StatTile({ label, value, sub, icon, tone = 'default' }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <div className="flex items-center justify-between">
        <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-faint">{label}</p>
        {icon && (
          <Icon
            name={icon}
            className={cx('h-4 w-4', tone === 'brand' ? 'text-brand' : 'text-faint')}
          />
        )}
      </div>
      <p
        className={cx(
          'nums mt-2 font-display text-2xl font-semibold',
          tone === 'brand' ? 'text-brand' : 'text-fg',
        )}
      >
        {value}
      </p>
      {sub && <p className="mt-0.5 text-xs text-muted">{sub}</p>}
    </div>
  );
}

/** Placeholder for a screen that exists in the plan but not yet in the build. */
export function ComingSoon({ title, body, cta }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-line-strong bg-subtle/50 px-6 py-12 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface text-faint ring-1 ring-line">
        <Icon name="compass" className="h-5 w-5" />
      </span>
      <h3 className="mt-4 text-sm font-semibold text-fg">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-muted">{body}</p>
      {cta && (
        <Link
          to={cta.to}
          className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:text-brand-hover"
        >
          {cta.label}
          <Icon name="arrowRight" className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

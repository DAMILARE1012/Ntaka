import Icon from '@/components/ui/Icon';
import Button from '@/components/ui/Button';
import { cx } from '@/lib/format';

export function EmptyState({
  icon = 'compass',
  title = 'Nothing here yet',
  description,
  actionLabel,
  onAction,
  className,
}) {
  return (
    <div className={cx('surface-card flex flex-col items-center px-6 py-14 text-center', className)}>
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-subtle text-muted">
        <Icon name={icon} className="h-6 w-6" />
      </span>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      {description && <p className="mt-1.5 max-w-md text-sm text-muted">{description}</p>}
      {actionLabel && (
        <Button variant="outline" size="sm" className="mt-5" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export function ErrorState({ onRetry, className }) {
  return (
    <EmptyState
      icon="shield"
      title="We could not load that"
      description="Something went wrong on our side. Try again in a moment."
      actionLabel={onRetry ? 'Try again' : undefined}
      onAction={onRetry}
      className={className}
    />
  );
}

/** Section heading used across the marketing pages. */
export function SectionHeading({ eyebrow, title, description, action, align = 'left', className }) {
  return (
    <div
      className={cx(
        'flex flex-col gap-4 md:flex-row md:items-end md:justify-between',
        align === 'center' && 'items-center text-center md:flex-col md:items-center',
        className,
      )}
    >
      <div className={cx('max-w-2xl', align === 'center' && 'mx-auto')}>
        {eyebrow && <p className="eyebrow mb-2.5">{eyebrow}</p>}
        <h2 className="text-balance text-xl font-semibold sm:text-2xl">{title}</h2>
        {description && <p className="mt-2.5 text-sm text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

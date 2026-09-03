import { StarIcon } from '@/components/ui/Icon';
import { cx, formatCount } from '@/lib/format';

/** Star rating with an optional review count. Renders a "New" chip when unrated. */
export default function Rating({ value, reviews, size = 'sm', showCount = true, className }) {
  if (value == null) {
    return (
      <span
        className={cx(
          'inline-flex items-center rounded-full bg-brand-soft px-2 py-0.5 text-xs font-semibold text-brand',
          className,
        )}
      >
        New teacher
      </span>
    );
  }

  const text = size === 'lg' ? 'text-base' : 'text-sm';
  const star = size === 'lg' ? 'h-5 w-5' : 'h-4 w-4';

  return (
    <span className={cx('inline-flex items-center gap-1', text, className)}>
      <StarIcon className={cx(star, 'text-accent')} />
      <span className="font-semibold text-fg">{value.toFixed(1)}</span>
      {showCount && reviews != null && (
        <span className="text-muted">({formatCount(reviews)})</span>
      )}
    </span>
  );
}

/** Five-star strip for detail pages. */
export function StarStrip({ value = 0, className }) {
  return (
    <span className={cx('inline-flex items-center gap-0.5', className)} aria-hidden="true">
      {[1, 2, 3, 4, 5].map((i) => (
        <StarIcon
          key={i}
          className={cx('h-4 w-4', value >= i - 0.25 ? 'text-accent' : 'text-line-strong')}
        />
      ))}
    </span>
  );
}

import { Link } from 'react-router-dom';
import { cx } from '@/lib/format';

/**
 * Ntaka wordmark. The mark is a speech bubble cut from a leaf - conversation and
 * growth, which is what the product sells.
 */
export default function Logo({ variant = 'dark', className }) {
  const text = variant === 'light' ? 'text-white' : 'text-fg';

  return (
    <Link
      to="/"
      className={cx('group inline-flex items-center gap-2.5', className)}
      aria-label="Ntaka home"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand transition-transform duration-200 group-hover:-rotate-6">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
          <path
            d="M5 19c0-7.2 4.4-12 13-12 0 8.4-5 12-13 12Z"
            fill="rgb(var(--brand-fg))"
            fillOpacity="0.95"
          />
          <path
            d="M5.5 19.5C7 15 9.8 12 14 10"
            stroke="rgb(var(--brand))"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span className={cx('font-display text-xl font-semibold tracking-[-0.02em]', text)}>
        Ntaka
      </span>
    </Link>
  );
}

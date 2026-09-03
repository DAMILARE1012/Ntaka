import { Link } from 'react-router-dom';
import { cx } from '@/lib/format';

const MARK_SIZES = {
  sm: 'h-8 w-8',
  md: 'h-9 w-9',
  lg: 'h-11 w-11',
};

/**
 * Ntaka wordmark: the emblem in a circular badge, with the name set in Fraunces beside it.
 *
 * The badge keeps a white plate in both themes. The emblem is transparent, but its greens
 * and terracottas were drawn for a white ground and lose contrast on a dark one - the
 * plate is what keeps it legible in night mode.
 *
 * Only the emblem is used, never the full lockup: the supplied artwork carries the NTAKA
 * wordmark and a tagline that are unreadable below about 200px.
 */
export default function Logo({ variant = 'dark', size = 'md', className }) {
  const text = variant === 'light' ? 'text-white' : 'text-fg';

  return (
    <Link
      to="/"
      className={cx('group inline-flex items-center gap-2.5', className)}
      aria-label="Ntaka home"
    >
      <span
        className={cx(
          'flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-white p-1 ring-1 ring-line transition-transform duration-200 group-hover:scale-105',
          MARK_SIZES[size],
        )}
      >
        <img
          src="/ntaka-mark.webp"
          alt=""
          aria-hidden="true"
          width={512}
          height={512}
          className="h-full w-full object-contain"
        />
      </span>
      <span className={cx('font-display text-xl font-semibold tracking-[-0.02em]', text)}>
        Ntaka
      </span>
    </Link>
  );
}

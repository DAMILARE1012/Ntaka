import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { selectThemeMode, toggleMode } from '@/features/theme/themeSlice';
import { cx } from '@/lib/format';

/** Day / night switch. The knob slides; the icons stay put. */
export default function ThemeToggle({ className }) {
  const dispatch = useAppDispatch();
  const mode = useAppSelector(selectThemeMode);
  const isDark = mode === 'dark';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? 'Switch to day mode' : 'Switch to night mode'}
      title={isDark ? 'Day mode' : 'Night mode'}
      onClick={() => dispatch(toggleMode())}
      className={cx(
        'relative inline-flex h-9 w-[4.25rem] shrink-0 items-center rounded-full border border-line bg-subtle p-1 transition-colors hover:border-line-strong',
        className,
      )}
    >
      {/* sliding knob */}
      <span
        className={cx(
          'absolute h-7 w-7 rounded-full bg-surface shadow-card transition-transform duration-300 ease-out',
          isDark ? 'translate-x-[2.125rem]' : 'translate-x-0',
        )}
        aria-hidden="true"
      />

      <span
        className={cx(
          'relative z-10 flex h-7 w-7 items-center justify-center transition-colors',
          isDark ? 'text-faint' : 'text-accent',
        )}
        aria-hidden="true"
      >
        {/* sun */}
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4M18.8 5.2l-1.4 1.4M6.6 17.4l-1.4 1.4" />
        </svg>
      </span>

      <span
        className={cx(
          'relative z-10 flex h-7 w-7 items-center justify-center transition-colors',
          isDark ? 'text-brand' : 'text-faint',
        )}
        aria-hidden="true"
      >
        {/* moon */}
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round">
          <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />
        </svg>
      </span>
    </button>
  );
}

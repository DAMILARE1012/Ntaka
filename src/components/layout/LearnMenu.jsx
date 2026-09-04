import { useEffect, useId, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Icon from '@/components/ui/Icon';
import { cx } from '@/lib/format';

export const LEARN_MODES = [
  {
    to: '/teachers',
    label: '1-on-1 Lessons',
    icon: 'user',
    blurb: 'A private lesson with a native teacher, at a time you choose.',
  },
  {
    to: '/classes',
    label: 'Group Class',
    icon: 'users',
    blurb: 'Four to ten learners, one level, one topic, live.',
  },
  {
    to: '/interactive-learning',
    label: 'Interactive Learning',
    icon: 'video',
    blurb: 'Video, audio, quizzes and games you work through at your own pace.',
  },
];

/**
 * The three ways to learn, under one nav item.
 *
 * Keyboard behaviour is the whole job here: opens on click, closes on Escape and on any
 * click outside, and the trigger keeps focus so a keyboard user is never stranded.
 * A hover-only menu is unusable on touch and invisible to a screen reader.
 */
export default function LearnMenu({ className }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const menuId = useId();
  const { pathname } = useLocation();

  const isActive = LEARN_MODES.some((mode) => pathname.startsWith(mode.to));

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className={cx('relative', className)}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls={menuId}
        className={cx(
          'relative flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
          isActive ? 'text-brand' : 'text-muted hover:text-fg',
        )}
      >
        Learn
        <Icon
          name="chevronDown"
          className={cx('h-3.5 w-3.5 transition-transform', open && 'rotate-180')}
        />
        {isActive && (
          <span className="absolute inset-x-3 -bottom-[13px] h-0.5 rounded-full bg-brand" />
        )}
      </button>

      {open && (
        <div
          id={menuId}
          className="animate-scale-in absolute left-0 top-full z-50 mt-3 w-80 origin-top-left rounded-xl border border-line bg-surface p-1.5 shadow-lift"
        >
          {LEARN_MODES.map((mode) => (
            <Link
              key={mode.to}
              to={mode.to}
              className={cx(
                'flex gap-3 rounded-lg p-3 transition-colors',
                pathname.startsWith(mode.to) ? 'bg-brand-soft' : 'hover:bg-subtle',
              )}
            >
              <span
                className={cx(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                  pathname.startsWith(mode.to)
                    ? 'bg-brand text-brand-fg'
                    : 'bg-subtle text-muted',
                )}
              >
                <Icon name={mode.icon} className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-fg">{mode.label}</span>
                <span className="mt-0.5 block text-xs leading-snug text-muted">
                  {mode.blurb}
                </span>
              </span>
            </Link>
          ))}

          <Link
            to="/placement-test"
            className="mt-1 flex items-center gap-2 rounded-lg border-t border-line px-3 py-2.5 text-xs font-semibold text-brand hover:bg-subtle"
          >
            <Icon name="target" className="h-3.5 w-3.5" />
            Not sure which? Take the free placement test
          </Link>
        </div>
      )}
    </div>
  );
}

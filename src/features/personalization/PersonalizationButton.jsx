import { useEffect, useRef, useState } from 'react';
import Icon from '@/components/ui/Icon';
import { cx } from '@/lib/format';
import { useAppSelector } from '@/app/hooks';
import { selectPreferences } from '@/features/personalization/preferencesSlice';
import { changedCount } from '@/features/personalization/preferences';
import PersonalizationPanel from '@/features/personalization/PersonalizationPanel';

/**
 * The launcher, bottom-right.
 *
 * Three details that decide whether this helps or gets in the way.
 *
 * It is a real <button> in the document flow with a label, not an icon in a div — so it
 * is reachable by keyboard and announced properly. The panel closes on Escape and on a
 * click outside, and focus returns to this button afterwards rather than being dropped at
 * the top of the page.
 *
 * It sits below the sticky header in stacking order but above page content, and it moves
 * out of the way on small screens where a floating circle over a paragraph is worse than
 * no button at all.
 */
export default function PersonalizationButton({ className }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const prefs = useAppSelector(selectPreferences);
  const changed = changedCount(prefs);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  const close = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <div
      ref={containerRef}
      className={cx('fixed bottom-4 right-4 z-40 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6', className)}
    >
      {open && <PersonalizationPanel onClose={close} />}

      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={
          changed
            ? `Reading preferences, ${changed} changed`
            : 'Reading preferences'
        }
        className={cx(
          'relative flex h-12 w-12 items-center justify-center rounded-full shadow-lift transition-all',
          // Solid brand disc with the symbol knocked out in white, which is how this
          // control is drawn everywhere it appears. Recognisability is the whole point.
          open
            ? 'bg-ink-900 text-white'
            : 'bg-brand text-brand-fg hover:-translate-y-0.5 hover:bg-brand-hover',
        )}
      >
        <Icon name={open ? 'close' : 'accessibility'} className="h-6 w-6" />
        {!open && changed > 0 && (
          <span
            className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand text-[10px] font-semibold text-brand-fg"
            aria-hidden="true"
          >
            {changed}
          </span>
        )}
      </button>
    </div>
  );
}

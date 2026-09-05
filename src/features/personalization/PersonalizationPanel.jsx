import { useEffect, useRef } from 'react';
import Icon from '@/components/ui/Icon';
import Button from '@/components/ui/Button';
import { cx } from '@/lib/format';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { selectThemeMode, setMode } from '@/features/theme/themeSlice';
import {
  selectPreferences,
  preferenceSet,
  presetApplied,
  preferencesReset,
} from '@/features/personalization/preferencesSlice';
import {
  PREFERENCES,
  GROUPS,
  PRESETS,
  changedCount,
  matchingPreset,
} from '@/features/personalization/preferences';

/**
 * The reading preferences panel.
 *
 * Presets come first on purpose. Twelve independent switches quietly asks the reader to
 * already know which combination helps them, which is backwards — somebody with low
 * vision should not have to work out for themselves that they want 150% text AND higher
 * contrast AND a larger cursor. The preset applies the combination; every switch below
 * stays adjustable afterwards, and adjusting one simply deselects the preset.
 *
 * Dark mode is shown here but delegates to the existing theme slice rather than
 * duplicating it, so the navbar toggle and this panel can never disagree.
 */

function Choice({ spec, value, onChange }) {
  return (
    <div>
      <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-faint">
        {spec.label}
      </p>
      <div
        role="radiogroup"
        aria-label={spec.label}
        className="mt-2 flex gap-1.5 rounded-xl bg-subtle p-1"
      >
        {spec.options.map((option) => {
          const active = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={active}
              title={option.title}
              onClick={() => onChange(option.value)}
              className={cx(
                'flex-1 rounded-lg px-2 py-2 text-xs font-semibold transition-colors',
                active
                  ? 'bg-surface text-brand shadow-sm ring-1 ring-brand-border'
                  : 'text-muted hover:text-fg',
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      {spec.note && <p className="mt-1.5 text-2xs leading-relaxed text-faint">{spec.note}</p>}
    </div>
  );
}

function Toggle({ spec, value, onChange }) {
  return (
    <div>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={cx(
          'flex w-full items-center justify-between gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors',
          value
            ? 'border-brand-border bg-brand-soft text-brand'
            : 'border-line bg-surface text-fg hover:border-line-strong',
        )}
      >
        <span className="text-sm font-medium">{spec.label}</span>
        <span
          className={cx(
            'relative h-5 w-9 shrink-0 rounded-full transition-colors',
            value ? 'bg-brand' : 'bg-line-strong',
          )}
        >
          <span
            className={cx(
              'absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform',
              value ? 'translate-x-4' : 'translate-x-0.5',
            )}
          />
        </span>
      </button>
      {spec.note && <p className="mt-1.5 text-2xs leading-relaxed text-faint">{spec.note}</p>}
    </div>
  );
}

export default function PersonalizationPanel({ onClose }) {
  const dispatch = useAppDispatch();
  const prefs = useAppSelector(selectPreferences);
  const theme = useAppSelector(selectThemeMode);
  const panelRef = useRef(null);
  const changed = changedCount(prefs);
  const activePreset = matchingPreset(prefs);

  // Escape closes, and focus moves into the panel so a keyboard user is not left behind
  // on the trigger button with a dialog open in front of them.
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    panelRef.current?.querySelector('button')?.focus();
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  // The ruler follows the pointer through a custom property rather than React state:
  // re-rendering the whole tree on mousemove would be the one preference that makes the
  // site slower to use.
  useEffect(() => {
    if (!prefs.readingRuler) return undefined;
    const onMove = (event) => {
      document.documentElement.style.setProperty('--ruler-y', `${event.clientY}px`);
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, [prefs.readingRuler]);

  const set = (key, value) => dispatch(preferenceSet({ key, value }));

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="false"
      aria-label="Reading preferences"
      className="animate-scale-in flex max-h-[min(80vh,44rem)] w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-lift"
    >
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <p className="flex items-center gap-2 text-sm font-semibold text-fg">
          <Icon name="accessibility" className="h-4 w-4 text-brand" />
          Reading preferences
        </p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close reading preferences"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-subtle hover:text-fg"
        >
          <Icon name="close" className="h-4 w-4" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {/* ------------------------------------------------------------ presets */}
        <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-faint">
          Start with
        </p>
        <div className="mt-2 grid gap-2">
          {PRESETS.map((preset) => {
            const active = activePreset?.id === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => dispatch(presetApplied(preset.id))}
                aria-pressed={active}
                className={cx(
                  'flex items-start gap-3 rounded-xl border p-3 text-left transition-colors',
                  active
                    ? 'border-brand-border bg-brand-soft'
                    : 'border-line bg-surface hover:border-line-strong',
                )}
              >
                <span
                  className={cx(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                    active ? 'bg-brand text-brand-fg' : 'bg-subtle text-muted',
                  )}
                >
                  <Icon name={preset.icon} className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-fg">{preset.label}</span>
                  <span className="mt-0.5 block text-2xs leading-relaxed text-muted">
                    {preset.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {/* ------------------------------------------------------------- theme */}
        <div className="mt-6">
          <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-faint">
            Appearance
          </p>
          <div className="mt-2 flex gap-1.5 rounded-xl bg-subtle p-1" role="radiogroup" aria-label="Appearance">
            {[
              { value: 'light', label: 'Day', icon: 'sparkles' },
              { value: 'dark', label: 'Night', icon: 'compass' },
            ].map((option) => {
              const active = theme === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => dispatch(setMode(option.value))}
                  className={cx(
                    'flex-1 rounded-lg px-2 py-2 text-xs font-semibold transition-colors',
                    active
                      ? 'bg-surface text-brand shadow-sm ring-1 ring-brand-border'
                      : 'text-muted hover:text-fg',
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ------------------------------------------------------------ groups */}
        {GROUPS.map((group) => {
          const entries = Object.entries(PREFERENCES).filter(([, spec]) => spec.group === group.id);
          if (!entries.length) return null;

          return (
            <section key={group.id} className="mt-6">
              <p className="flex items-center gap-2 text-2xs font-semibold uppercase tracking-[0.14em] text-faint">
                <Icon name={group.icon} className="h-3.5 w-3.5 text-brand" />
                {group.label}
              </p>
              <div className="mt-3 space-y-3.5">
                {entries.map(([key, spec]) =>
                  spec.kind === 'toggle' ? (
                    <Toggle key={key} spec={spec} value={prefs[key]} onChange={(v) => set(key, v)} />
                  ) : (
                    <Choice key={key} spec={spec} value={prefs[key]} onChange={(v) => set(key, v)} />
                  ),
                )}
              </div>
            </section>
          );
        })}

        {/*
          Said plainly, because the alternative is letting a widget imply the site is
          accessible because it exists. It is not, and no panel can make it so.
        */}
        <p className="mt-7 border-t border-line pt-4 text-2xs leading-relaxed text-faint">
          These settings change how Ntaka looks for you on this device. They work alongside
          your browser and system settings rather than replacing them — if you use a screen
          reader or your own zoom, those stay in charge.
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-3">
        <p className="nums text-2xs text-faint">
          {changed === 0 ? 'Nothing changed yet' : `${changed} changed`}
        </p>
        <Button
          variant="ghost"
          size="sm"
          disabled={changed === 0}
          onClick={() => dispatch(preferencesReset())}
        >
          Reset all
        </Button>
      </div>
    </div>
  );
}

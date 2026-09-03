import { CEFR_LEVELS, levelIndex } from '@/lib/cefr';
import { cx } from '@/lib/format';
import Icon from '@/components/ui/Icon';

/**
 * The six CEFR levels as a ladder. Pass `current` to mark where a learner has been placed;
 * everything below it renders as already covered.
 */
export default function LevelLadder({ current, onSelect, className, compact = false }) {
  const currentIdx = current ? levelIndex(current) : -1;

  return (
    <ol className={cx('grid gap-3', compact ? 'sm:grid-cols-3' : 'sm:grid-cols-2 lg:grid-cols-3', className)}>
      {CEFR_LEVELS.map((level, idx) => {
        const isCurrent = idx === currentIdx;
        const isBelow = currentIdx > -1 && idx < currentIdx;
        const Wrapper = onSelect ? 'button' : 'div';

        return (
          <li key={level.code}>
            <Wrapper
              {...(onSelect ? { type: 'button', onClick: () => onSelect(level.code) } : {})}
              className={cx(
                'flex h-full w-full flex-col rounded-2xl border p-4 text-left transition-all',
                isCurrent
                  ? 'border-brand bg-brand-soft shadow-card ring-1 ring-brand-border'
                  : isBelow
                    ? 'border-brand-border bg-brand-soft/60'
                    : 'border-line bg-surface',
                onSelect && 'hover:border-brand-border hover:shadow-card',
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={cx(
                    'font-display text-lg font-semibold',
                    isCurrent ? 'text-brand-hover' : 'text-fg',
                  )}
                >
                  {level.code}
                </span>
                {isCurrent ? (
                  <span className="rounded-full bg-brand px-2.5 py-0.5 text-2xs font-semibold text-brand-fg">
                    You are here
                  </span>
                ) : isBelow ? (
                  <Icon name="check" className="h-4 w-4 text-brand" strokeWidth={2.5} />
                ) : (
                  <span className="text-2xs font-semibold text-faint">{level.band}</span>
                )}
              </div>

              <p className="mt-1 font-semibold text-fg">{level.name}</p>
              {!compact && (
                <>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{level.tagline}</p>
                  <p className="mt-3 text-2xs font-semibold uppercase tracking-wide text-faint">
                    {level.hours}
                  </p>
                </>
              )}
            </Wrapper>
          </li>
        );
      })}
    </ol>
  );
}

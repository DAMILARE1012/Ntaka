import Icon from '@/components/ui/Icon';
import { cx } from '@/lib/format';

/**
 * Where you are, and how much is left.
 *
 * A test that only says "Question 4" feels open-ended, and people abandon open-ended
 * things. This shows a percentage, the named stages, and which ones are already behind
 * you — so the remaining work always looks finite.
 */
export const PLACEMENT_STAGES = [
  { id: 'language', label: 'Language', short: 'Language' },
  { id: 'background', label: 'About you', short: 'About' },
  { id: 'quiz', label: 'Vocabulary', short: 'Words' },
  { id: 'writing', label: 'Writing', short: 'Writing' },
  { id: 'speaking', label: 'Speaking', short: 'Speaking' },
  { id: 'self', label: 'Final check', short: 'Check' },
];

/** Fraction complete, counting progress within the current stage. */
export function completionOf(stage, cursor = 0, totalInStage = 1) {
  const index = PLACEMENT_STAGES.findIndex((s) => s.id === stage);
  if (index < 0) return stage === 'result' ? 1 : 0;
  const within = totalInStage > 0 ? Math.min(cursor / totalInStage, 1) : 0;
  return (index + within) / PLACEMENT_STAGES.length;
}

export default function PlacementProgress({ stage, cursor = 0, totalInStage = 1, skipped = [] }) {
  const fraction = completionOf(stage, cursor, totalInStage);
  const percent = Math.round(fraction * 100);
  const currentIndex = PLACEMENT_STAGES.findIndex((s) => s.id === stage);

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-faint">
          {PLACEMENT_STAGES[currentIndex]?.label ?? 'Done'}
          {totalInStage > 1 && (
            <span className="ml-1.5 normal-case tracking-normal text-muted">
              {cursor + 1} of {totalInStage}
            </span>
          )}
        </p>
        <p className="nums text-2xs font-semibold text-brand">{percent}% complete</p>
      </div>

      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-line"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Placement test progress"
      >
        <div
          className="h-full rounded-full bg-brand transition-[width] duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Named stages: the remaining work is always visible and finite. */}
      <ol className="mt-3 flex flex-wrap gap-x-1 gap-y-1.5">
        {PLACEMENT_STAGES.map((item, index) => {
          const done = index < currentIndex;
          const current = index === currentIndex;
          const wasSkipped = skipped.includes(item.id);

          return (
            <li key={item.id} className="flex items-center gap-1">
              <span
                className={cx(
                  'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-2xs font-medium transition-colors',
                  current && 'bg-brand-soft font-semibold text-brand',
                  done && !wasSkipped && 'text-muted',
                  done && wasSkipped && 'text-faint line-through',
                  !done && !current && 'text-faint',
                )}
              >
                {done && !wasSkipped && (
                  <Icon name="check" className="h-2.5 w-2.5" strokeWidth={3} />
                )}
                {item.short}
              </span>
              {index < PLACEMENT_STAGES.length - 1 && (
                <span className="text-faint" aria-hidden="true">
                  ·
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

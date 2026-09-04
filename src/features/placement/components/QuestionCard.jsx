import LevelBadge from '@/components/common/LevelBadge';
import { cx } from '@/lib/format';

/** One question, four options. Used for both background and graded questions. */
export default function QuestionCard({
  question,
  value,
  onAnswer,
  index,
  total,
  showLevel = false,
}) {
  return (
    <div className="animate-fade-up">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-faint">
          Question {index + 1} of {total}
        </p>
        {showLevel && question.level && <LevelBadge code={question.level} showName={false} />}
      </div>

      <h2 className="mt-3 text-balance text-lg font-semibold sm:text-2xl">{question.prompt}</h2>

      <div className="mt-6 grid gap-3">
        {question.options.map((option) => {
          const selected = value === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onAnswer(option.id)}
              aria-pressed={selected}
              className={cx(
                'rounded-xl border px-4 py-3.5 text-left transition-all',
                selected
                  ? 'border-brand bg-brand-soft font-semibold ring-1 ring-brand-border'
                  : 'border-line bg-surface hover:border-line-strong hover:bg-subtle',
              )}
            >
              <span className="text-md font-medium text-fg">{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

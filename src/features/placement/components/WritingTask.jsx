import Badge from '@/components/ui/Badge';
import Icon from '@/components/ui/Icon';
import { cx } from '@/lib/format';

/**
 * Free-text writing sample.
 *
 * What we can measure automatically is limited — length, sentence count, whether the
 * language's diacritics appear, overlap with expected vocabulary — and the live counter
 * below shows the learner exactly that, rather than implying a hidden grade. Grammar and
 * meaning need a human or a language model, and the result says so.
 */
export default function WritingTask({ prompt, value, onChange, onSkip }) {
  const text = value ?? '';
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const sentences = text.split(/[.!?。]+/).filter((s) => s.trim()).length;

  return (
    <div className="animate-fade-up">
      <div className="flex items-center gap-2">
        <Badge tone="clay">
          <Icon name="book" className="h-3 w-3" />
          Writing
        </Badge>
        {prompt.script && <Badge tone="neutral">{prompt.script}</Badge>}
      </div>

      <h2 className="mt-3 text-balance text-xl font-semibold sm:text-2xl">{prompt.title}</h2>
      <p className="mt-2 text-muted">{prompt.instruction}</p>

      <label htmlFor="placement-writing" className="sr-only">
        Your written answer
      </label>
      <textarea
        id="placement-writing"
        value={text}
        onChange={(e) => onChange(e.target.value)}
        placeholder={prompt.placeholder}
        rows={6}
        className="mt-5 w-full rounded-xl border border-line-strong bg-surface p-4 text-md leading-relaxed text-fg placeholder:text-faint focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
      />

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-2xs text-muted">
          <Signal label="words" value={words} target={12} />
          <Signal label="sentences" value={sentences} target={2} />
        </div>

        <button
          type="button"
          onClick={onSkip}
          className="text-2xs font-semibold text-muted underline underline-offset-2 hover:text-fg"
        >
          Skip writing
        </button>
      </div>

      {prompt.tonal && (
        <p className="mt-3 flex items-start gap-1.5 rounded-lg bg-subtle px-3 py-2 text-2xs text-muted">
          <Icon name="sparkles" className="mt-0.5 h-3 w-3 shrink-0" />
          This language uses tone marks. Include them if you can — if your keyboard cannot,
          write without and tell your teacher.
        </p>
      )}

      <p className="mt-3 flex items-start gap-1.5 text-2xs text-muted">
        <Icon name="shield" className="mt-0.5 h-3 w-3 shrink-0" />
        We check length, structure and the words we would expect at each level, and a
        language model gives a second opinion. Your first teacher confirms it — no
        placement is decided by a machine alone.
      </p>
    </div>
  );
}

function Signal({ label, value, target }) {
  const met = value >= target;
  return (
    <span className={cx('nums inline-flex items-center gap-1', met && 'text-brand')}>
      {met && <Icon name="check" className="h-3 w-3" strokeWidth={3} />}
      {value} {label}
    </span>
  );
}

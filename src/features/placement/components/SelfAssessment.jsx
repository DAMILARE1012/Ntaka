import { Checkbox } from '@/components/ui/Field';
import LevelBadge from '@/components/common/LevelBadge';
import { SELF_ASSESSMENT } from '@/services/mock/placement';
import { cx } from '@/lib/format';

/**
 * CEFR can-do self-check. Ticking a statement means "yes, I can already do this".
 * Used as the whole test for languages without a graded bank, and as a refinement elsewhere.
 */
export default function SelfAssessment({ checked = [], onToggle, title, description }) {
  return (
    <div className="animate-fade-up">
      <h2 className="text-balance text-lg font-semibold sm:text-2xl">
        {title ?? 'Which of these can you already do?'}
      </h2>
      <p className="mt-2 text-muted">
        {description ??
          'Tick every statement that is comfortably true today. Be honest — it only helps us start you in the right place.'}
      </p>

      <ul className="mt-6 space-y-3">
        {SELF_ASSESSMENT.map((item) => {
          const isChecked = checked.includes(item.level);
          return (
            <li key={item.level}>
              <div
                className={cx(
                  'flex items-start gap-4 rounded-2xl border p-4 transition-colors',
                  isChecked ? 'border-brand-border bg-brand-soft/60' : 'border-line bg-surface',
                )}
              >
                <LevelBadge code={item.level} showName={false} className="mt-0.5 shrink-0" />
                <Checkbox
                  checked={isChecked}
                  onChange={() => onToggle(item.level)}
                  label={item.statement}
                  className="flex-1"
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

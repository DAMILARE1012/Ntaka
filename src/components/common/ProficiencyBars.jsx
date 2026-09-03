import { cx } from '@/lib/format';

/**
 * The six-bar proficiency meter next to each language a teacher speaks.
 * 6 bars = native, fewer bars = lower proficiency.
 */
export default function ProficiencyBars({ level = 6, tone = 'palm', className }) {
  const filled = 'bg-brand';
  const filledAlt = 'bg-leaf-400/70';
  return (
    <span className={cx('inline-flex items-end gap-[2px] align-middle', className)} aria-hidden="true">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <span
          key={i}
          className={cx(
            'w-[3px] rounded-[1px]',
            i <= level ? (tone === 'palm' ? filled : filledAlt) : 'bg-line-strong',
            i <= 2 ? 'h-2' : i <= 4 ? 'h-2.5' : 'h-3',
          )}
        />
      ))}
    </span>
  );
}

/** "Yorùbá ▮▮▮▮▮▮ Native · English ▮▮▮▮ C1" line used on teacher cards. */
export function SpokenLanguages({ speaks = [], max = 3, className }) {
  const shown = speaks.slice(0, max);
  const extra = speaks.length - shown.length;

  return (
    <div className={cx('flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm', className)}>
      <span className="text-xs font-semibold uppercase tracking-wide text-faint">Speaks</span>
      {shown.map((s) => (
        <span key={s.name} className="inline-flex items-center gap-1.5">
          <span className="font-semibold text-fg">{s.name}</span>
          <ProficiencyBars level={s.proficiency} tone={s.proficiency === 6 ? 'palm' : 'adire'} />
          {s.proficiency === 6 && (
            <span className="rounded bg-brand-soft px-1.5 py-0.5 text-2xs font-semibold text-brand">
              Native
            </span>
          )}
        </span>
      ))}
      {extra > 0 && (
        <span className="rounded-full bg-subtle px-2 py-0.5 text-xs font-semibold text-muted">
          +{extra}
        </span>
      )}
    </div>
  );
}

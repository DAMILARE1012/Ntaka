import { getLevel, LEVEL_STYLES } from '@/lib/cefr';
import { cx } from '@/lib/format';

/** The one place a CEFR code turns into a chip, so levels look identical everywhere. */
export default function LevelBadge({ code, showName = true, size = 'sm', className }) {
  const level = getLevel(code);
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-full font-semibold ring-1 ring-inset',
        LEVEL_STYLES[code] ?? LEVEL_STYLES.A1,
        size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm',
        className,
      )}
    >
      <span className="font-display">{level.code}</span>
      {showName && <span className="font-semibold opacity-80">{level.name}</span>}
    </span>
  );
}

/** Level range shown on teacher cards: "A1 – C1". */
export function LevelRange({ levels = [], className }) {
  if (!levels.length) return null;
  return (
    <span className={cx('text-xs font-semibold text-muted', className)}>
      Teaches {levels[0]} – {levels[levels.length - 1]}
    </span>
  );
}

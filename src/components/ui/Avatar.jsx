import { cx, initialsOf } from '@/lib/format';
import { hashString } from '@/lib/prng';
import Flag from '@/components/common/Flag';

/**
 * Deterministic avatar per person - the same teacher always gets the same tile.
 * Kept inside the green family so a grid of teachers reads as one set, not confetti.
 */
const PALETTES = [
  'from-leaf-500 to-leaf-700',
  'from-leaf-600 to-ink-800',
  'from-leaf-400 to-leaf-600',
  'from-ink-600 to-leaf-800',
  'from-leaf-700 to-leaf-900',
  'from-leaf-300 to-leaf-600',
  'from-leaf-800 to-ink-900',
];

const SIZES = {
  xs: 'h-7 w-7 text-2xs',
  sm: 'h-9 w-9 text-2xs',
  md: 'h-12 w-12 text-sm',
  lg: 'h-16 w-16 text-lg',
  xl: 'h-24 w-24 text-2xl',
};

export default function Avatar({ name, iso, size = 'md', className, ringed = true }) {
  const palette = PALETTES[hashString(name) % PALETTES.length];

  return (
    <span className={cx('relative inline-flex shrink-0', className)}>
      <span
        className={cx(
          'flex items-center justify-center rounded-xl bg-gradient-to-br font-display font-semibold tracking-tight text-white',
          palette,
          SIZES[size],
          ringed && 'ring-1 ring-inset ring-white/15',
        )}
        aria-hidden="true"
      >
        {initialsOf(name)}
      </span>
      {iso && (
        <span className="absolute -bottom-1 -right-1 rounded-[3px] bg-surface p-[1px] ring-1 ring-line">
          <Flag iso={iso} size={size === 'xs' || size === 'sm' ? 'xs' : 'sm'} />
        </span>
      )}
      <span className="sr-only">{name}</span>
    </span>
  );
}

import Icon from '@/components/ui/Icon';
import { cx } from '@/lib/format';
import { hashString } from '@/lib/prng';
import Flag from '@/components/common/Flag';

/** Deterministic cover art, all drawn from the same green range. */
const GRADIENTS = [
  'from-leaf-700 via-leaf-800 to-ink-950',
  'from-leaf-600 via-leaf-700 to-leaf-900',
  'from-ink-800 via-leaf-800 to-leaf-600',
  'from-leaf-800 via-ink-800 to-leaf-700',
  'from-leaf-500 via-leaf-700 to-ink-900',
];

/**
 * Stand-in for teacher intro videos and course covers: a gradient panel carrying the
 * language name, a woven texture and a play affordance.
 */
export default function VideoThumb({
  seed = 'ntaka',
  label,
  caption,
  iso,
  ratio = 'aspect-video',
  className,
  children,
}) {
  const gradient = GRADIENTS[hashString(seed) % GRADIENTS.length];

  return (
    <div
      className={cx(
        'group relative overflow-hidden rounded-xl bg-gradient-to-br',
        gradient,
        ratio,
        className,
      )}
    >
      {/* woven-cloth texture */}
      <div
        className="absolute inset-0 opacity-[0.10]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, #fff 0 1px, transparent 1px 10px), repeating-linear-gradient(-45deg, #fff 0 1px, transparent 1px 16px)',
        }}
        aria-hidden="true"
      />

      {label && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/45 to-transparent p-4 pt-10">
          <p className="font-display text-lg font-semibold leading-tight tracking-tight text-white sm:text-xl">
            {label}
          </p>
          {caption && <p className="mt-0.5 text-xs font-medium text-white/70">{caption}</p>}
        </div>
      )}

      {iso && <Flag iso={iso} size="md" className="absolute right-3 top-3 shadow" />}

      <span className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 text-ink-900 shadow-sm transition-transform duration-200 group-hover:scale-105">
        <Icon name="play" className="ml-0.5 h-3.5 w-3.5" />
      </span>

      {children}
    </div>
  );
}

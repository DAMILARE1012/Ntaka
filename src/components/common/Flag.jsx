import { cx } from '@/lib/format';

/**
 * Country flag.
 *
 * Flag emoji are not an option: Windows ships no regional-indicator glyphs, so an emoji
 * flag degrades to bare ISO letters ("NG"). These are real SVGs from lipis/flag-icons
 * (MIT), vendored into public/flags - fourteen files, ~55KB total, no runtime dependency.
 *
 * They are decorative wherever a country or language name sits beside them, which is
 * everywhere in this app, so the img is hidden from assistive tech by default.
 */
const SIZES = {
  xs: 'h-3 w-4',
  sm: 'h-[0.875rem] w-[1.1875rem]',
  md: 'h-[1.125rem] w-6',
  lg: 'h-6 w-8',
};

export default function Flag({ iso, size = 'md', title, className }) {
  if (!iso) return null;

  return (
    <img
      src={`/flags/${iso}.svg`}
      alt={title ? `Flag of ${title}` : ''}
      aria-hidden={title ? undefined : 'true'}
      width={24}
      height={18}
      loading="lazy"
      decoding="async"
      className={cx(
        'shrink-0 rounded-[3px] object-cover ring-1 ring-inset ring-black/10',
        SIZES[size],
        className,
      )}
    />
  );
}

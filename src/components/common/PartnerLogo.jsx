import { cx } from '@/lib/format';

/**
 * A partner mark.
 *
 * scripts/build-partner-logos.sh normalises every mark to a square white tile, so the
 * plate here is a rounded square rather than a circle: several of these logos are
 * landscape with a caption underneath, and a circular crop would cut the words off.
 *
 * The plate stays white in both themes because the marks are drawn for a light ground —
 * a Nigerian coat of arms in black line work disappears on a dark one.
 */
const SIZES = {
  sm: 'h-12 w-12 p-1',
  md: 'h-16 w-16 p-1.5',
  lg: 'h-20 w-20 p-2',
};

export default function PartnerLogo({ partner, size = 'md', className }) {
  return (
    <span
      className={cx(
        'flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white ring-1 ring-line',
        SIZES[size],
        className,
      )}
    >
      <img
        src={partner.logo}
        alt={`${partner.name} logo`}
        width={320}
        height={320}
        loading="lazy"
        decoding="async"
        className="h-full w-full object-contain"
      />
    </span>
  );
}

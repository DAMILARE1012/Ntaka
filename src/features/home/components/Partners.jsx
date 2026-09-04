import { Link } from 'react-router-dom';
import Icon from '@/components/ui/Icon';
import PartnerLogo from '@/components/common/PartnerLogo';
import { SectionHeading } from '@/components/ui/States';
import { PARTNERS, partnerCountries } from '@/services/mock/partners';

/**
 * The partner slider.
 *
 * Uses the same seamless marquee as the language rail: the track holds two identical
 * groups and slides by exactly half its own width, so the loop point never shows. It runs
 * in reverse here, because two bands sliding the same way on one page reads as a glitch.
 *
 * Slides are a logo over its name, with no card around them — the mark plus a short name
 * is enough, and a bordered box at this size reads as heavier than the content inside it.
 * The name stays, though: an anonymous logo wall is filler, where a named ministry,
 * association or museum is endorsement.
 */

/**
 * Fixed card width keeps the seam maths simple - no measuring required.
 *
 * The geometry that has to hold: each group is exactly n * (CARD_WIDTH + GAP) wide, with
 * the gap carried as a trailing margin rather than a gap on the track. The track is then
 * exactly two groups, and translateX(-50%) lands precisely on the seam. Put a gap on the
 * track instead and the loop drifts by half of it on every pass.
 */
/* Sized to the content, not padded out to a tile. The widest short name is a six-letter
   acronym, so anything more than this is empty space read as a gap. */
const CARD_WIDTH = 112;
const GAP = 12;
const SPEED = 40; // pixels per second, slower than the language rail so names can be read

/**
 * A group must be at least this wide, or a short partner list would leave a visible gap
 * on a wide screen. Repeating the list until it clears the widest container we support
 * costs nothing and removes the edge case entirely.
 */
const MIN_GROUP_WIDTH = 1600;

export default function Partners() {
  if (!PARTNERS.length) return null;

  const unit = CARD_WIDTH + GAP;
  const repeats = Math.max(1, Math.ceil(MIN_GROUP_WIDTH / (PARTNERS.length * unit)));
  const group = Array.from({ length: repeats }, () => PARTNERS).flat();
  const duration = (group.length * unit) / SPEED;

  return (
    <section id="partners" className="scroll-mt-16 bg-surface py-14 md:py-16">
      <div className="container">
        <SectionHeading
          eyebrow="Working with"
          title="Backed by the people who keep these languages alive"
          description={`Culture ministries, language associations and museums across ${partnerCountries().length} countries.`}
          action={
            <Link to="/partners" className="link-arrow">
              See all partners
              <Icon name="arrowRight" className="h-4 w-4" />
            </Link>
          }
        />
      </div>

      {/* Full bleed: the slider should run off both edges, not stop at the container. */}
      <div className="marquee-viewport mt-10 overflow-hidden">
        <div
          className="marquee-track marquee-track--reverse"
          style={{ '--marquee-duration': `${duration.toFixed(1)}s` }}
        >
          {[false, true].map((duplicate) => (
            <ul
              key={String(duplicate)}
              className="flex shrink-0"
              style={{ gap: `${GAP}px`, marginRight: `${GAP}px` }}
              aria-hidden={duplicate || undefined}
            >
              {group.map((partner, index) => (
                <li
                  key={`${partner.id}-${index}`}
                  className="shrink-0"
                  style={{ width: CARD_WIDTH }}
                >
                  <Link
                    to="/partners"
                    tabIndex={duplicate ? -1 : undefined}
                    title={partner.name}
                    className="group flex flex-col items-center gap-2 text-center"
                  >
                    <PartnerLogo
                      partner={partner}
                      size="sm"
                      className="transition-transform duration-200 group-hover:-translate-y-0.5"
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-semibold text-fg transition-colors group-hover:text-brand">
                        {partner.shortName ?? partner.name}
                      </span>
                      <span className="block truncate text-2xs text-faint">
                        {partner.city ?? partner.country}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </section>
  );
}

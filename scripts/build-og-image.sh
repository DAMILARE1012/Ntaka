#!/usr/bin/env bash
# Builds the 1200x630 social card used by every page's og:image / twitter:image.
#
#   in : public/hero-greeting-poster.webp  (transparent cutout)
#   out: public/og-default.jpg
#
# JPEG, not WebP: Facebook and X handle WebP, but LinkedIn, Slack and several
# WhatsApp versions still do not, and a broken preview is worse than a bigger file.
set -euo pipefail

SRC=${1:-public/hero-greeting-poster.webp}
OUT=${2:-public/og-default.jpg}
W=$(mktemp -d)
trap 'rm -rf "$W"' EXIT

INK="#0B120E"        # ink-950
LEAF="#16794C"       # brand
LEAF_DARK="#062317"  # leaf-950

# Brand ground with a soft radial lift behind the subject.
magick -size 1200x630 "gradient:${LEAF_DARK}-${INK}" "$W/bg.png"
magick "$W/bg.png" \
  \( -size 1200x630 radial-gradient:"rgba(34,147,95,0.45)"-none -resize 140% -gravity east -crop 1200x630+0+0 +repage \) \
  -compose over -composite "$W/ground.png"

# Woven texture, the same motif the site uses on dark panels.
magick "$W/ground.png" \
  \( -size 1200x630 pattern:crosshatch30 -alpha set -channel A -evaluate multiply 0.06 +channel \) \
  -compose over -composite "$W/textured.png"

# The subject, sized to sit on the right and bleed off the bottom edge.
magick "$SRC" -resize 500x -background none -gravity south -extent 500x380 "$W/subject.png"
magick "$W/textured.png" "$W/subject.png" -gravity southeast -geometry +0+0 -compose over -composite "$W/composed.png"

# Wordmark, headline, and the one line that earns the click.
magick "$W/composed.png" \
  -font Arial-Bold -pointsize 34 -fill white \
  -annotate +72+118 'Ntaka' \
  -font Arial-Bold -pointsize 62 -fill white \
  -annotate +72+236 'Learn the' \
  -annotate +72+304 'languages of Africa' \
  -font Arial -pointsize 28 -fill "#A9DFC3" \
  -annotate +72+372 'Live lessons, group classes' \
  -annotate +72+410 'and video courses.' \
  -font Arial-Bold -pointsize 26 -fill "#F2C752" \
  -annotate +72+490 'Free placement test  ·  25 languages' \
  "$W/titled.png"

# Brand rule along the top edge.
magick "$W/titled.png" \
  -fill "$LEAF" -draw "rectangle 0,0 400,6" \
  -fill "#43AE7C" -draw "rectangle 400,0 760,6" \
  -fill "#F2C752" -draw "rectangle 760,0 1000,6" \
  -fill "#134D34" -draw "rectangle 1000,0 1200,6" \
  -quality 88 -strip -interlace Plane "$OUT"

printf 'built %s (%s bytes, %s)\n' "$OUT" "$(stat -c%s "$OUT")" "$(magick identify -format '%wx%h' "$OUT")"

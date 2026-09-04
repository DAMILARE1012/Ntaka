#!/usr/bin/env bash
# Normalises supplied partner logos into one consistent, web-ready set.
#
#   in : art/partners/*          the originals, exactly as supplied
#   out: public/partners/*.webp  square, white-grounded, 320px, ~10-20KB each
#
# Why any processing at all — the originals arrive in four different states:
#
#   * Igbo_Association     a transparent PNG saved as JPEG, so the editor's transparency
#                          CHECKERBOARD is baked into the pixels. Unusable as-is.
#   * Cameroon             a black-ground social avatar crop, which would sit as a dark
#                          tile among six light ones.
#   * Ethiopia             a real transparent PNG, which shows as a black box anywhere
#                          that does not composite it.
#   * Uganda               landscape with a caption, so a square crop would cut the words.
#
# The fix in each case is the same: flood fill the outer ground to white from the corners
# (never a global colour key, which would punch holes through the artwork), trim, then pad
# back to a square. Flood filling stops at the logo's own outline, so the marks are not
# altered — only what surrounds them.
#
# Requires ImageMagick 7.
set -euo pipefail

SRC_DIR=${1:-art/partners}
OUT_DIR=${2:-public/partners}
W=$(mktemp -d)
trap 'rm -rf "$W"' EXIT
mkdir -p "$OUT_DIR"

# name|fuzz — the fuzz is how far from the corner colour a pixel can be and still count
# as background. The checkerboard needs enough to span its light grey and its white.
JOBS=(
  "Nigeria_Ministry_of_Art_Culture|10"
  "Yoruba_Icon|10"
  "Cameroon_Ministry_of_Art_Culture|8"
  "Ghana_Lang_Association_Icon|10"
  "Igbo_Association_Icon|26"
  "Uganda_Ministry_of_Art_Culture|10"
  "Ethiopia_Ministry_of_Culture_and_Tourism|10"
)

for job in "${JOBS[@]}"; do
  name=${job%%|*}
  fuzz=${job##*|}

  src=$(ls "$SRC_DIR/$name".* 2>/dev/null | head -1)
  if [ -z "$src" ]; then
    printf 'skipped %-46s (no source)\n' "$name"
    continue
  fi

  # 1. Anything already transparent gets a white ground, so later steps see real pixels.
  magick "$src" -background white -alpha remove -alpha off "$W/flat.png"

  # 2. Ground -> white, flood filled from all four corners. A 2px border gives the fill a
  #    guaranteed starting colour even when the artwork runs to the edge.
  magick "$W/flat.png" -bordercolor "$(magick "$W/flat.png" -format '%[pixel:p{2,2}]' info:)" -border 2 \
    -fill white -fuzz "${fuzz}%" \
    -draw "color 0,0 floodfill" \
    -draw "color $(( $(magick identify -format '%w' "$W/flat.png") + 3 )),0 floodfill" \
    -draw "color 0,$(( $(magick identify -format '%h' "$W/flat.png") + 3 )) floodfill" \
    -draw "color $(( $(magick identify -format '%w' "$W/flat.png") + 3 )),$(( $(magick identify -format '%h' "$W/flat.png") + 3 )) floodfill" \
    -shave 2x2 "$W/clean.png"

  # 3. Trim the slack, then pad back to a square so every tile matches. 88% leaves the
  #    mark breathing room inside its plate rather than touching the edges.
  magick "$W/clean.png" -fuzz 2% -trim +repage \
    -resize 282x282 \
    -background white -gravity center -extent 320x320 \
    -quality 90 -define webp:method=6 "$OUT_DIR/$name.webp"

  printf '%-46s %6s bytes  %s\n' "$name.webp" "$(stat -c%s "$OUT_DIR/$name.webp")" \
    "$(magick identify -format '%wx%h' "$OUT_DIR/$name.webp")"
done

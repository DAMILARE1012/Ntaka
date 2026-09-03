#!/usr/bin/env bash
# Turns the supplied hero artwork into a theme-ready, transparent WebP.
#
#   in :  art/hero-greeting-poster-source.jpg   (black ground, red bubble, baked-in labels)
#   out:  public/hero-greeting-poster.webp      (transparent, green bubble, no text)
#
# Why each stage exists:
#   1. The black ground cannot stay - it fights a green/white theme in light mode.
#   2. The baked greeting labels cannot stay either: they are light-on-dark, so they
#      disappear the moment the panel behind them is light. They are re-rendered as
#      themed DOM text in Hero.jsx instead, where they work in both themes.
#   3. The red bubble is recoloured to leaf-500, the palette's brand green.
#
# Requires ImageMagick 7 with a WebP delegate.
set -euo pipefail

SRC=${1:-art/hero-greeting-poster-source.jpg}
OUT=${2:-public/hero-greeting-poster.webp}
W=$(mktemp -d)
trap 'rm -rf "$W"' EXIT

BUBBLE_GREEN="#22935F"   # leaf-500

# 1. Black ground -> transparent. Flood fill from the edges (not a global colour key)
#    so dark hair and the dark objects she is holding survive.
magick "$SRC" -alpha set -fuzz 12% -fill none \
  -draw "alpha 1,1 floodfill"       -draw "alpha 1285,1 floodfill" \
  -draw "alpha 1,830 floodfill"     -draw "alpha 1285,830 floodfill" \
  -draw "alpha 643,3 floodfill"     -draw "alpha 643,829 floodfill" \
  -draw "alpha 3,415 floodfill"     -draw "alpha 1284,415 floodfill" \
  "$W/cut.png"

# 2. Drop the four labels that sat on the ground. They are now small opaque islands,
#    so anything under 3000px that is not attached to the subject goes.
magick "$W/cut.png" -alpha extract -threshold 50% \
  -define connected-components:area-threshold=3000 \
  -define connected-components:mean-color=true -connected-components 8 "$W/alpha.png"
magick "$W/cut.png" "$W/alpha.png" -alpha off -compose CopyOpacity -composite "$W/nolabels.png"

# 3. Mask the saturated red family: the bubble plus the salmon text printed on it.
#    The saturation floor keeps lips and skin out of the mask.
magick "$W/nolabels.png" -alpha off -colorspace HSL \
  -fx "(( u.r<0.055 || u.r>0.945 ) && u.g>0.55 && u.b>0.25) ? 1 : 0" \
  -colorspace Gray "$W/mask.png"

# 4. Clean the mask: drop speckle, then fill the letter-shaped holes so that flat-filling
#    the mask erases the three labels printed on the bubble.
magick "$W/mask.png" -threshold 50% \
  -define connected-components:area-threshold=1500 \
  -define connected-components:mean-color=true -connected-components 8 \
  -negate -threshold 50% \
  -define connected-components:area-threshold=6000 \
  -define connected-components:mean-color=true -connected-components 8 \
  -negate "$W/maskclean.png"

# 5. Flat-fill it green. Dilate and feather the mask first so no red fringe is left
#    along the anti-aliased boundary with her arm.
magick "$W/maskclean.png" -morphology Dilate Disk:2 -blur 0x1.2 "$W/masksoft.png"
magick "$W/nolabels.png" -alpha off -fill "$BUBBLE_GREEN" -colorize 100 "$W/flat.png"
magick "$W/nolabels.png" -alpha off "$W/flat.png" "$W/masksoft.png" -composite "$W/rgb.png"
magick "$W/rgb.png" \( "$W/nolabels.png" -alpha extract \) \
  -alpha off -compose CopyOpacity -composite "$W/poster.png"

# 6. Ship it.
magick "$W/poster.png" -strip -define webp:method=6 -define webp:alpha-quality=90 -quality 80 "$OUT"

printf 'built %s  (%s bytes, was %s)\n' "$OUT" "$(stat -c%s "$OUT")" "$(stat -c%s "$SRC")"

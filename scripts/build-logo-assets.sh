#!/usr/bin/env bash
# Derives every icon the site needs from the supplied logo lockup.
#
#   in : art/Ntaka_Logo.jpg          (emblem + NTAKA wordmark + tagline, on white)
#   out: public/ntaka-mark.webp      transparent emblem, for the circular badge in the UI
#        public/ntaka-mark-512.png   emblem on white, for schema.org / PWA
#        public/apple-touch-icon.png 180x180 opaque - iOS renders alpha as black
#        public/favicon-32.png       modern browsers
#        public/favicon.ico          16/32/48, for old browsers and Windows shortcuts
#
# Only the emblem is used. The wordmark and tagline are unreadable below ~200px, and
# the UI sets "Ntaka" in Fraunces beside the badge anyway.
#
# Requires ImageMagick 7.
set -euo pipefail

SRC=${1:-art/Ntaka_Logo.jpg}
W=$(mktemp -d)
trap 'rm -rf "$W"' EXIT

# 1. Isolate the emblem: everything above the wordmark, trimmed to its own bounds.
magick "$SRC" -crop x555+0+0 +repage -fuzz 8% -trim +repage "$W/emblem.png"

# 2. White ground -> transparent. Flood filled from the corners, not colour-keyed, so the
#    white book pages, the writing hand and the speech mark inside the artwork survive.
magick "$W/emblem.png" -alpha set -bordercolor white -border 2 -fuzz 12% -fill none \
  -draw "alpha 1,1 floodfill" \
  -draw "alpha $(($(magick identify -format '%w' "$W/emblem.png") + 2)),1 floodfill" \
  -draw "alpha 1,$(($(magick identify -format '%h' "$W/emblem.png") + 2)) floodfill" \
  -shave 2x2 "$W/cut.png"

# 3. Centre it on a square canvas at 78% width. The mark sits inside a circle in the UI,
#    and the wing tips are its widest point - any larger and they get clipped.
magick "$W/cut.png" -resize 400x400 -background none -gravity center -extent 512x512 \
  "$W/mark.png"

# 4. Ship it.
magick "$W/mark.png" -define webp:method=6 -define webp:alpha-quality=100 -quality 92 \
  public/ntaka-mark.webp

magick "$W/mark.png" -background white -alpha remove -alpha off \
  public/ntaka-mark-512.png

# iOS ignores alpha and composites on black, so this one is flattened onto white.
magick "$W/mark.png" -resize 150x150 -background white -gravity center -extent 180x180 \
  -alpha remove -alpha off public/apple-touch-icon.png

# Favicons keep the alpha, but on a white disc so the mark stays legible on a dark tab bar.
# -colorspace sRGB is load-bearing: a canvas holding only white on transparent is
# detected as greyscale, and compositing the mark onto it would quantise the artwork
# to grey. Ask for colour explicitly.
magick -size 512x512 xc:none -colorspace sRGB -type TrueColorAlpha   -fill white -draw "circle 256,256 256,8" "$W/disc.png"
magick "$W/disc.png" "$W/mark.png" -colorspace sRGB -type TrueColorAlpha   -compose over -composite "$W/badge.png"

magick "$W/badge.png" -resize 32x32 public/favicon-32.png
magick "$W/badge.png" -define icon:auto-resize=48,32,16 public/favicon.ico

printf 'logo assets built:\n'
for f in public/ntaka-mark.webp public/ntaka-mark-512.png public/apple-touch-icon.png \
         public/favicon-32.png public/favicon.ico; do
  printf '  %-32s %8s bytes  %s\n' "$f" "$(stat -c%s "$f")" "$(magick identify -format '%wx%h' "$f[0]")"
done

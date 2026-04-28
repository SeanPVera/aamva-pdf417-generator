#!/usr/bin/env bash
# Regenerates the desktop installer icons under build/ from the master SVG
# at public/icons/icon-512.svg.
#
# Required tools (all available via apt on Ubuntu/Debian):
#   librsvg2-bin   provides rsvg-convert
#   icnsutils      provides png2icns (macOS .icns)
#   imagemagick    provides convert (Windows .ico)
#
# The build/ directory is committed so contributors who change the icon must
# also re-run this script and commit the regenerated raster files.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/public/icons/icon-512.svg"
OUT="$ROOT/build"
ICONS="$OUT/icons"

mkdir -p "$ICONS"

rsvg-convert -w 1024 -h 1024 "$SRC" -o "$OUT/icon.png"
for size in 16 32 48 64 128 256 512; do
  rsvg-convert -w "$size" -h "$size" "$SRC" -o "$ICONS/${size}x${size}.png"
done

png2icns "$OUT/icon.icns" \
  "$ICONS/16x16.png" \
  "$ICONS/32x32.png" \
  "$ICONS/48x48.png" \
  "$ICONS/128x128.png" \
  "$ICONS/256x256.png" \
  "$ICONS/512x512.png"

convert \
  "$ICONS/16x16.png" \
  "$ICONS/32x32.png" \
  "$ICONS/48x48.png" \
  "$ICONS/64x64.png" \
  "$ICONS/128x128.png" \
  "$ICONS/256x256.png" \
  "$OUT/icon.ico"

echo "Wrote:"
ls -la "$OUT"/icon.{png,icns,ico} "$ICONS"/

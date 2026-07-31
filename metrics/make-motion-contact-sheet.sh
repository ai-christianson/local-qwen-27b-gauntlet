#!/usr/bin/env bash
set -euo pipefail

video_path="${1:?usage: make-motion-contact-sheet.sh VIDEO OUTPUT START_SECONDS}"
output_path="${2:?usage: make-motion-contact-sheet.sh VIDEO OUTPUT START_SECONDS}"
start_seconds="${3:-3}"

if [[ ! -r "$video_path" ||
      ! "$start_seconds" =~ ^[0-9]+([.][0-9]+)?$ ]]; then
  echo "invalid input" >&2
  exit 2
fi

mkdir -p "$(dirname "$output_path")"

# Sixteen ordered quarter-second samples from a four-second window. The crop
# keeps the lower-center vehicle and nearby track large enough for wheel,
# steering, contact, and clipping review. It is a review derivative; the full
# 1080p60 source remains authoritative.
ffmpeg \
  -hide_banner \
  -loglevel error \
  -y \
  -ss "$start_seconds" \
  -i "$video_path" \
  -t 4 \
  -vf \
  "fps=4,crop=960:540:480:480,scale=480:270:flags=lanczos,tile=4x4:padding=0:margin=0" \
  -frames:v 1 \
  "$output_path"

echo "$output_path"

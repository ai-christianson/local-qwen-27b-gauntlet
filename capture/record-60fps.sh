#!/usr/bin/env bash
set -euo pipefail

url="${1:?usage: record-60fps.sh URL OUTPUT_DIR [DURATION_SECONDS] [BASENAME]}"
output_dir="${2:?usage: record-60fps.sh URL OUTPUT_DIR [DURATION_SECONDS] [BASENAME]}"
duration="${3:-30}"
basename="${4:-gameplay-1080p60}"

if [[ "$output_dir" != /home/qg/evidence/* ||
      ! "$duration" =~ ^[0-9]+$ ||
      ! "$basename" =~ ^[a-z0-9][a-z0-9-]{1,63}$ ]]; then
  echo "invalid output directory, duration, or basename" >&2
  exit 2
fi

browser_bin="$(
  find /home/qg/.cache/ms-playwright \
    -type f \
    -path '*/chrome-linux64/chrome' \
    -print |
    sort |
    tail -n 1
)"

if [[ -z "$browser_bin" || ! -x "$browser_bin" ]]; then
  echo "Playwright Chromium binary not found" >&2
  exit 1
fi

command -v Xvfb >/dev/null
command -v ffmpeg >/dev/null
command -v ffprobe >/dev/null

mkdir -p "$output_dir"
display_number=97
display=":$display_number"
profile_dir="$(mktemp -d)"
xvfb_pid=""
browser_pid=""
driver_pid=""

cleanup() {
  if [[ -n "$driver_pid" ]] && kill -0 "$driver_pid" 2>/dev/null; then
    kill -TERM "$driver_pid" || true
  fi
  if [[ -n "$browser_pid" ]] && kill -0 "$browser_pid" 2>/dev/null; then
    kill -TERM "$browser_pid" || true
  fi
  if [[ -n "$xvfb_pid" ]] && kill -0 "$xvfb_pid" 2>/dev/null; then
    kill -TERM "$xvfb_pid" || true
  fi
  rm -rf "$profile_dir" || true
}
trap cleanup EXIT

Xvfb "$display" \
  -screen 0 1920x1080x24 \
  -nolisten tcp \
  -noreset \
  > "$output_dir/xvfb.log" \
  2>&1 &
xvfb_pid=$!
sleep 1

DISPLAY="$display" "$browser_bin" \
  --user-data-dir="$profile_dir" \
  --no-sandbox \
  --disable-setuid-sandbox \
  --no-first-run \
  --disable-background-networking \
  --disable-default-apps \
  --disable-features=Translate \
  --disable-infobars \
  --disable-sync \
  --autoplay-policy=no-user-gesture-required \
  --remote-debugging-address=127.0.0.1 \
  --remote-debugging-port=9222 \
  --use-gl=angle \
  --use-angle=swiftshader \
  --enable-webgl \
  --window-position=0,0 \
  --window-size=1920,1080 \
  --kiosk \
  "$url" \
  > "$output_dir/$basename.chromium.log" \
  2>&1 &
browser_pid=$!
sleep 5

node /home/qg/bin/drive-gameplay.cjs \
  http://127.0.0.1:9222 \
  "$duration" \
  "$output_dir/$basename.driver.json" \
  > "$output_dir/$basename.driver.stdout.log" \
  2> "$output_dir/$basename.driver.stderr.log" &
driver_pid=$!

ready_path="$output_dir/$basename.driver.ready.json"
for attempt in $(seq 1 240); do
  if [[ -s "$ready_path" ]]; then
    break
  fi
  if ! kill -0 "$driver_pid" 2>/dev/null; then
    wait "$driver_pid" || true
    echo "gameplay driver exited before the race became ready" >&2
    exit 1
  fi
  if (( attempt == 240 )); then
    echo "gameplay driver did not report race readiness within 60 seconds" >&2
    exit 1
  fi
  sleep 0.25
done

# Keep live encoding deliberately cheap so the encoder does not starve the
# software-rendered game and manufacture a nominal-60fps/actual-10fps clip.
# A slower archival transcode can happen after Chromium exits.
ffmpeg \
  -hide_banner \
  -loglevel info \
  -y \
  -f x11grab \
  -draw_mouse 0 \
  -framerate 60 \
  -video_size 1920x1080 \
  -i "${display}.0" \
  -t "$duration" \
  -an \
  -c:v libx264 \
  -preset ultrafast \
  -crf 12 \
  -pix_fmt yuv420p \
  -r 60 \
  -fps_mode cfr \
  -movflags +faststart \
  "$output_dir/$basename.mp4" \
  > "$output_dir/$basename.ffmpeg.stdout.log" \
  2> "$output_dir/$basename.ffmpeg.stderr.log"

ffprobe \
  -v error \
  -count_frames \
  -select_streams v:0 \
  -show_entries \
  stream=codec_name,width,height,pix_fmt,r_frame_rate,avg_frame_rate,duration,nb_frames,nb_read_frames \
  -of json \
  "$output_dir/$basename.mp4" \
  > "$output_dir/$basename.ffprobe.json"

ffmpeg \
  -hide_banner \
  -i "$output_dir/$basename.mp4" \
  -vf mpdecimate \
  -an \
  -fps_mode vfr \
  -f null \
  - \
  > /dev/null \
  2> "$output_dir/$basename.mpdecimate.log"

if [[ -n "$driver_pid" ]]; then
  wait "$driver_pid" || true
fi

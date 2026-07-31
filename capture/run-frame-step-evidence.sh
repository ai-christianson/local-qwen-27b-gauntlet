#!/usr/bin/env bash
set -euo pipefail

run_name="${1:?usage: run-frame-step-evidence.sh RUN_NAME [DURATION_SECONDS]}"
duration="${2:-12}"
if [[ ! "$run_name" =~ ^[a-z0-9][a-z0-9-]{1,63}$ ||
      ! "$duration" =~ ^[0-9]+$ ||
      "$duration" -lt 4 ||
      "$duration" -gt 30 ]]; then
  echo "invalid run name or duration" >&2
  exit 2
fi

output_dir="/home/qg/evidence/$run_name"
url="http://127.0.0.1:4174/?demo=1&seed=1337"
server_pid=""

cleanup() {
  if [[ -n "$server_pid" ]] && kill -0 "$server_pid" 2>/dev/null; then
    kill -TERM "$server_pid" || true
  fi
}
trap cleanup EXIT

mkdir -p "$output_dir"
/home/qg/bin/serve-workspace.sh \
  /home/qg/workspace \
  4174 \
  "$output_dir/frame-step-server.log" \
  > "$output_dir/frame-step-server.stdout.log" \
  2> "$output_dir/frame-step-server.stderr.log" &
server_pid=$!

for attempt in $(seq 1 60); do
  if curl --fail --silent --show-error --max-time 2 "$url" > /dev/null; then
    break
  fi
  if ! kill -0 "$server_pid" 2>/dev/null; then
    wait "$server_pid"
  fi
  if (( attempt == 60 )); then
    echo "game server did not become ready" >&2
    exit 1
  fi
  sleep 1
done

node /home/qg/bin/frame-step-capture.cjs \
  "$url" \
  "$output_dir" \
  "$duration" \
  60

ffmpeg \
  -hide_banner \
  -loglevel info \
  -y \
  -framerate 60 \
  -start_number 0 \
  -i "$output_dir/frame-step-frames/frame-%06d.png" \
  -an \
  -c:v libx264 \
  -preset medium \
  -crf 12 \
  -pix_fmt yuv420p \
  -r 60 \
  -fps_mode cfr \
  -movflags +faststart \
  "$output_dir/gameplay-fixed-step-1080p60.mp4" \
  > "$output_dir/gameplay-fixed-step-1080p60.ffmpeg.stdout.log" \
  2> "$output_dir/gameplay-fixed-step-1080p60.ffmpeg.stderr.log"

ffprobe \
  -v error \
  -count_frames \
  -select_streams v:0 \
  -show_entries \
  stream=codec_name,width,height,pix_fmt,r_frame_rate,avg_frame_rate,duration,nb_frames,nb_read_frames \
  -of json \
  "$output_dir/gameplay-fixed-step-1080p60.mp4" \
  > "$output_dir/gameplay-fixed-step-1080p60.ffprobe.json"

ffmpeg \
  -hide_banner \
  -i "$output_dir/gameplay-fixed-step-1080p60.mp4" \
  -vf mpdecimate \
  -an \
  -fps_mode vfr \
  -f null \
  - \
  > /dev/null \
  2> "$output_dir/gameplay-fixed-step-1080p60.mpdecimate.log"

date -Is > "$output_dir/frame-step-captured-at.txt"

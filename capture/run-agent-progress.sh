#!/usr/bin/env bash
set -euo pipefail

run_name="${1:?usage: run-agent-progress.sh RUN_NAME [DURATION_SECONDS]}"
duration="${2:-30}"

if [[ ! "$run_name" =~ ^[a-z0-9][a-z0-9-]{1,63}$ ||
      ! "$duration" =~ ^[0-9]+$ ||
      "$duration" -lt 10 ||
      "$duration" -gt 120 ]]; then
  echo "invalid run or duration" >&2
  exit 2
fi

session_root="/home/qg/runs/$run_name/sessions"
output_dir="/home/qg/evidence/$run_name/agent-progress"
viewer_pid=""

if [[ ! -d "$session_root" ]]; then
  echo "session directory is missing" >&2
  exit 1
fi

cleanup() {
  if [[ -n "$viewer_pid" ]] && kill -0 "$viewer_pid" 2>/dev/null; then
    kill -TERM "$viewer_pid" || true
  fi
}
trap cleanup EXIT

mkdir -p "$output_dir"
node /home/qg/bin/pi-live-viewer.cjs "$session_root" "$run_name" 4180 \
  > "$output_dir/viewer.stdout.log" \
  2> "$output_dir/viewer.stderr.log" &
viewer_pid=$!

for attempt in $(seq 1 30); do
  if curl --fail --silent --show-error --max-time 2 http://127.0.0.1:4180/events > /dev/null; then
    break
  fi
  if ! kill -0 "$viewer_pid" 2>/dev/null; then
    wait "$viewer_pid"
  fi
  sleep 1
done

/home/qg/bin/record-60fps.sh \
  http://127.0.0.1:4180/ \
  "$output_dir" \
  "$duration" \
  agent-progress-1080p60

date -Is > "$output_dir/captured-live-at.txt"

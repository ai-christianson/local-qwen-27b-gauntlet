#!/usr/bin/env bash
set -euo pipefail

run_name="${1:?usage: run-evidence.sh RUN_NAME}"

if [[ ! "$run_name" =~ ^[a-z0-9][a-z0-9-]{1,63}$ ]]; then
  echo "invalid run name" >&2
  exit 2
fi

output_dir="/home/qg/evidence/$run_name"
url="http://127.0.0.1:4173/?demo=1&seed=1337"
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
  4173 \
  "$output_dir/server.log" \
  > "$output_dir/server.stdout.log" \
  2> "$output_dir/server.stderr.log" &
server_pid=$!

for attempt in $(seq 1 60); do
  if curl \
    --fail \
    --silent \
    --show-error \
    --max-time 2 \
    "$url" \
    > /dev/null
  then
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

node /home/qg/bin/objective-browser-test.cjs "$url" "$output_dir"
/home/qg/bin/record-60fps.sh "$url" "$output_dir" 30
date -Is > "$output_dir/captured-at.txt"

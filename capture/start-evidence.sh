#!/usr/bin/env bash
set -euo pipefail

run_name="${1:?usage: start-evidence.sh RUN_NAME}"
if [[ ! "$run_name" =~ ^[a-z0-9][a-z0-9-]{1,63}$ ]]; then
  echo "invalid run name" >&2
  exit 2
fi

output_dir="/home/qg/evidence/$run_name"
mkdir -p "$output_dir"
nohup \
  /home/qg/bin/run-evidence.sh "$run_name" \
  > "$output_dir/launcher.stdout.log" \
  2> "$output_dir/launcher.stderr.log" \
  < /dev/null &
printf '%s\n' "$!" > "$output_dir/evidence.pid"
echo "started pid=$!"

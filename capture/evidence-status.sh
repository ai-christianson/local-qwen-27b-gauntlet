#!/usr/bin/env bash
set -euo pipefail

run_name="${1:?usage: evidence-status.sh RUN_NAME}"
if [[ ! "$run_name" =~ ^[a-z0-9][a-z0-9-]{1,63}$ ]]; then
  echo "invalid run name" >&2
  exit 2
fi

output_dir="/home/qg/evidence/$run_name"
if [[ ! -d "$output_dir" ]]; then
  echo "status=missing"
  exit 0
fi

status="running"
if [[ -f "$output_dir/captured-at.txt" ]]; then
  status="finished"
elif [[ -f "$output_dir/evidence.pid" ]]; then
  evidence_pid="$(< "$output_dir/evidence.pid")"
  if ! kill -0 "$evidence_pid" 2>/dev/null; then
    status="failed"
  fi
fi

printf 'status=%s files=%s bytes=%s\n' \
  "$status" \
  "$(find "$output_dir" -type f | wc -l)" \
  "$(du -sk "$output_dir" | awk '{print $1 * 1024}')"

if [[ -f "$output_dir/launcher.stderr.log" ]]; then
  tail -n 12 "$output_dir/launcher.stderr.log"
fi

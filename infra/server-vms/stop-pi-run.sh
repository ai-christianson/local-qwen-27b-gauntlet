#!/usr/bin/env bash
set -euo pipefail

run_name="${1:?usage: stop-pi-run.sh RUN_NAME}"
if [[ ! "$run_name" =~ ^[a-z0-9][a-z0-9-]{1,63}$ ]]; then
  echo "invalid run name" >&2
  exit 2
fi

run_dir="/home/qg/runs/$run_name"
if [[ ! -d "$run_dir" || ! -r "$run_dir/pi.pid" ]]; then
  echo "run not found" >&2
  exit 1
fi
if [[ -f "$run_dir/finished-at.txt" ]]; then
  echo "already finished"
  exit 0
fi

parent_pid="$(< "$run_dir/pi.pid")"
if [[ ! "$parent_pid" =~ ^[0-9]+$ ]]; then
  echo "invalid recorded pid" >&2
  exit 1
fi

mapfile -t direct_children < <(pgrep -P "$parent_pid" || true)
for child_pid in "${direct_children[@]}"; do
  kill -TERM "$child_pid" 2>/dev/null || true
done

for _ in {1..30}; do
  if [[ -f "$run_dir/finished-at.txt" ]]; then
    printf 'stopped run=%s code=%s finished=%s\n' \
      "$run_name" \
      "$(< "$run_dir/exit-code.txt")" \
      "$(< "$run_dir/finished-at.txt")"
    exit 0
  fi
  sleep 1
done

mapfile -t remaining < <(pgrep -P "$parent_pid" || true)
for child_pid in "${remaining[@]}"; do
  kill -KILL "$child_pid" 2>/dev/null || true
done
kill -TERM "$parent_pid" 2>/dev/null || true

printf '%s\n' "controller-hard-stop" > "$run_dir/exit-code.txt"
date -Is > "$run_dir/finished-at.txt"
echo "forced stop recorded"

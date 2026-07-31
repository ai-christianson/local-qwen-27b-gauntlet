#!/usr/bin/env bash
set -euo pipefail

run_dir="$(find /home/qg/runs -mindepth 1 -maxdepth 1 -type d -print -quit)"
if [[ -z "$run_dir" ]]; then
  echo "status=missing"
  exit 1
fi

run_name="${run_dir##*/}"
if [[ -f "$run_dir/finished-at.txt" ]]; then
  status="finished"
  exit_code="$(< "$run_dir/exit-code.txt")"
else
  status="running"
  exit_code="na"
fi

session_kb="$(du -sk "$run_dir/sessions" | awk '{print $1}')"
started_at="$(< "$run_dir/started-at.txt")"
finished_at="-"
if [[ -f "$run_dir/finished-at.txt" ]]; then
  finished_at="$(< "$run_dir/finished-at.txt")"
fi

printf 'run=%s status=%s code=%s session_kb=%s started=%s finished=%s\n' \
  "$run_name" \
  "$status" \
  "$exit_code" \
  "$session_kb" \
  "$started_at" \
  "$finished_at"

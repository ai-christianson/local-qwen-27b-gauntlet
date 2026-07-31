#!/usr/bin/env bash
set -euo pipefail

run_name="${1:?usage: run-status.sh RUN_NAME}"
if [[ ! "$run_name" =~ ^[a-z0-9][a-z0-9-]{1,63}$ ]]; then
  echo "invalid run name" >&2
  exit 2
fi

run_dir="/home/qg/runs/$run_name"
if [[ ! -d "$run_dir" ]]; then
  echo "status=missing"
  exit 0
fi

status="running"
exit_code="na"
if [[ -f "$run_dir/finished-at.txt" ]]; then
  status="finished"
  exit_code="$(< "$run_dir/exit-code.txt")"
elif [[ -r "$run_dir/launcher.pid" ]]; then
  launcher_pid="$(< "$run_dir/launcher.pid")"
  if ! kill -0 "$launcher_pid" 2>/dev/null; then
    status="failed"
  fi
fi

session_kb=0
if [[ -d "$run_dir/sessions" ]]; then
  session_kb="$(du -sk "$run_dir/sessions" | awk '{print $1}')"
fi

started="-"
finished="-"
if [[ -r "$run_dir/started-at.txt" ]]; then
  started="$(< "$run_dir/started-at.txt")"
fi
if [[ -r "$run_dir/finished-at.txt" ]]; then
  finished="$(< "$run_dir/finished-at.txt")"
fi

printf 'run=%s status=%s code=%s session_kb=%s started=%s finished=%s\n' \
  "$run_name" \
  "$status" \
  "$exit_code" \
  "$session_kb" \
  "$started" \
  "$finished"

if [[ -f "$run_dir/launcher.log" ]]; then
  tail -n 8 "$run_dir/launcher.log"
fi

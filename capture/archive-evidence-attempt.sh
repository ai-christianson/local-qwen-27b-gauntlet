#!/usr/bin/env bash
set -euo pipefail

run_name="${1:?usage: archive-evidence-attempt.sh RUN_NAME ATTEMPT_LABEL}"
attempt_label="${2:?usage: archive-evidence-attempt.sh RUN_NAME ATTEMPT_LABEL}"
if [[ ! "$run_name" =~ ^[a-z0-9][a-z0-9-]{1,63}$ ||
      ! "$attempt_label" =~ ^[a-z0-9][a-z0-9-]{1,31}$ ]]; then
  echo "invalid run or attempt label" >&2
  exit 2
fi

source_dir="/home/qg/evidence/$run_name"
archive_dir="/home/qg/evidence/$run_name-$attempt_label"
if [[ ! -d "$source_dir" ]]; then
  echo "no evidence attempt to archive"
  exit 0
fi
if [[ -e "$archive_dir" ]]; then
  echo "archive target already exists" >&2
  exit 1
fi

if [[ -r "$source_dir/evidence.pid" ]]; then
  evidence_pid="$(< "$source_dir/evidence.pid")"
  if [[ "$evidence_pid" =~ ^[0-9]+$ ]]; then
    mapfile -t children < <(pgrep -P "$evidence_pid" || true)
    for child_pid in "${children[@]}"; do
      kill -TERM "$child_pid" 2>/dev/null || true
    done
    kill -TERM "$evidence_pid" 2>/dev/null || true
  fi
fi

mv "$source_dir" "$archive_dir"
printf 'archived=%s\n' "$archive_dir"

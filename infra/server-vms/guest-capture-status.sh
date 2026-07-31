#!/usr/bin/env bash
set -euo pipefail

evidence_root="/home/qg/evidence"
if [[ ! -d "$evidence_root" ]]; then
  echo "capture=missing"
  exit 0
fi

find "$evidence_root" -maxdepth 4 -type f \
  \( -name '*.ffprobe.json' -o -name '*.mp4' -o -name '*launcher*.log' -o -name '*chromium*.log' \) \
  -printf '%P\t%s\n' \
  | sort

for log_path in \
  /home/qg/agent-progress-launcher.log \
  /home/qg/agent-progress-launcher-2.log
do
  if [[ -f "$log_path" ]]; then
    printf 'LOG %s\n' "${log_path##*/}"
    tail -n 12 "$log_path"
  fi
done

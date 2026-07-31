#!/usr/bin/env bash
set -euo pipefail

run_name="${1:?usage: continue-pi.sh RUN_NAME PARENT_RUN PROMPT_PATH [MODEL] [THINKING]}"
parent_run="${2:?usage: continue-pi.sh RUN_NAME PARENT_RUN PROMPT_PATH [MODEL] [THINKING]}"
prompt_path="${3:?usage: continue-pi.sh RUN_NAME PARENT_RUN PROMPT_PATH [MODEL] [THINKING]}"
model_id="${4:-qwen36-27b}"
thinking="${5:-high}"
wall_seconds="${QG_PI_WALL_SECONDS:-2400}"

if [[ ! "$run_name" =~ ^[a-z0-9][a-z0-9-]{1,63}$ ||
      ! "$parent_run" =~ ^[a-z0-9][a-z0-9-]{1,63}$ ||
      "$prompt_path" != /home/qg/prompts/*.txt ||
      ! -r "$prompt_path" ||
      ! "$wall_seconds" =~ ^[0-9]+$ ||
      "$wall_seconds" -lt 60 ||
      "$wall_seconds" -gt 7200 ]]; then
  echo "invalid continue-run argument" >&2
  exit 2
fi

parent_sessions="/home/qg/runs/$parent_run/sessions"
if [[ ! -d "$parent_sessions" ||
      ! -f "/home/qg/runs/$parent_run/finished-at.txt" ||
      ! -r /home/qg/.qg-runtime-env ]]; then
  echo "parent run or runtime environment is missing" >&2
  exit 1
fi

run_dir="/home/qg/runs/$run_name"
mkdir -p "$run_dir/sessions"
printf '%s\n' "$$" > "$run_dir/pi.pid"
printf '%s\n' "$parent_run" > "$run_dir/parent-run.txt"
date -Is > "$run_dir/started-at.txt"

set -a
# shellcheck disable=SC1091
source /home/qg/.qg-runtime-env
set +a

cd /home/qg/workspace
set +e
timeout \
  --signal=TERM \
  --kill-after=30s \
  "$wall_seconds" \
  pi \
    --provider routerd \
    --model "$model_id" \
    --thinking "$thinking" \
    --session-dir "$parent_sessions" \
    --continue \
    -p "$(< "$prompt_path")" \
    > "$run_dir/stdout.log" \
    2> "$run_dir/stderr.log"
exit_code=$?
set -e

cp -a "$parent_sessions/." "$run_dir/sessions/"
printf '%s\n' "$exit_code" > "$run_dir/exit-code.txt"
date -Is > "$run_dir/finished-at.txt"
exit "$exit_code"

#!/usr/bin/env bash
set -euo pipefail

run_name="${1:?usage: run-pi.sh RUN_NAME PROMPT_PATH [MODEL] [THINKING]}"
prompt_path="${2:?usage: run-pi.sh RUN_NAME PROMPT_PATH [MODEL] [THINKING]}"
model_id="${3:-qwen36-27b}"
thinking="${4:-high}"
wall_seconds="${QG_PI_WALL_SECONDS:-2400}"
append_system_prompt="${QG_PI_APPEND_SYSTEM_PROMPT:-}"

if [[ ! "$run_name" =~ ^[a-z0-9][a-z0-9-]{1,63}$ ]]; then
  echo "invalid run name" >&2
  exit 2
fi

if [[ "$prompt_path" != /home/qg/prompts/*.txt || ! -r "$prompt_path" ]]; then
  echo "prompt must be a readable file under /home/qg/prompts" >&2
  exit 2
fi

if [[ ! "$wall_seconds" =~ ^[0-9]+$ ]] ||
   (( wall_seconds < 60 || wall_seconds > 7200 )); then
  echo "QG_PI_WALL_SECONDS must be 60..7200" >&2
  exit 2
fi

if [[ ! -r /home/qg/.qg-runtime-env ]]; then
  echo "runtime environment is missing" >&2
  exit 1
fi

if [[ -n "$append_system_prompt" &&
      ( "$append_system_prompt" != /home/qg/prompts/*.txt ||
        ! -r "$append_system_prompt" ) ]]; then
  echo "QG_PI_APPEND_SYSTEM_PROMPT must be a readable prompt file" >&2
  exit 2
fi

run_dir="/home/qg/runs/$run_name"
mkdir -p "$run_dir/sessions"
printf '%s\n' "$$" > "$run_dir/pi.pid"
date -Is > "$run_dir/started-at.txt"

set -a
# shellcheck disable=SC1091
source /home/qg/.qg-runtime-env
set +a

cd /home/qg/workspace
pi_args=(
  --provider routerd
  --model "$model_id"
  --thinking "$thinking"
  --session-dir "$run_dir/sessions"
  --name "$run_name"
)
if [[ -n "$append_system_prompt" ]]; then
  pi_args+=(--append-system-prompt "$append_system_prompt")
fi

set +e
timeout \
  --signal=TERM \
  --kill-after=30s \
  "$wall_seconds" \
  pi \
  "${pi_args[@]}" \
  -p "$(< "$prompt_path")" \
  > "$run_dir/stdout.log" \
  2> "$run_dir/stderr.log"
exit_code=$?
set -e

printf '%s\n' "$exit_code" > "$run_dir/exit-code.txt"
date -Is > "$run_dir/finished-at.txt"
exit "$exit_code"

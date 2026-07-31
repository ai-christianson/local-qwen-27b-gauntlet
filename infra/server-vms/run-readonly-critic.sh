#!/usr/bin/env bash
set -euo pipefail

run_name="${1:?usage: run-readonly-critic.sh RUN_NAME PROMPT_PATH [MODEL] [THINKING]}"
prompt_path="${2:?usage: run-readonly-critic.sh RUN_NAME PROMPT_PATH [MODEL] [THINKING]}"
model_id="${3:-qwen36-27b}"
thinking="${4:-high}"
wall_seconds="${QG_PI_WALL_SECONDS:-1800}"

if [[ ! "$run_name" =~ ^[a-z0-9][a-z0-9-]{1,63}$ ||
      "$prompt_path" != /home/qg/prompts/*.txt ||
      ! -r "$prompt_path" ||
      ! -d /home/qg/review ||
      ! -r /home/qg/.qg-runtime-env ||
      ! "$wall_seconds" =~ ^[0-9]+$ ||
      "$wall_seconds" -lt 60 ||
      "$wall_seconds" -gt 3600 ]]; then
  echo "invalid critic argument" >&2
  exit 2
fi

mapfile -t images < <(
  find /home/qg/review \
    -maxdepth 1 \
    -type f \
    -name '*.png' \
    -print |
    sort
)

run_dir="/home/qg/runs/$run_name"
mkdir -p "$run_dir/sessions"
printf '%s\n' "$$" > "$run_dir/pi.pid"
date -Is > "$run_dir/started-at.txt"

set -a
# shellcheck disable=SC1091
source /home/qg/.qg-runtime-env
set +a

image_args=()
for image in "${images[@]}"; do
  image_args+=("@$image")
done

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
    --tools read,grep,find,ls \
    --session-dir "$run_dir/sessions" \
    --name "$run_name" \
    -p \
    "${image_args[@]}" \
    "$(< "$prompt_path")" \
    > "$run_dir/stdout.log" \
    2> "$run_dir/stderr.log"
exit_code=$?
set -e

printf '%s\n' "$exit_code" > "$run_dir/exit-code.txt"
date -Is > "$run_dir/finished-at.txt"
exit "$exit_code"

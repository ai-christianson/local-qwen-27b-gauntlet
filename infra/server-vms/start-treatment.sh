#!/usr/bin/env bash
set -euo pipefail

mode="${1:?usage: start-treatment.sh new|continue|critic RUN PROMPT_PATH WALL_SECONDS [PARENT_RUN] [SYSTEM_PROMPT|-] [MODEL_ID] [THINKING]}"
run_name="${2:?usage: start-treatment.sh new|continue|critic RUN PROMPT_PATH WALL_SECONDS [PARENT_RUN] [SYSTEM_PROMPT|-] [MODEL_ID] [THINKING]}"
prompt_path="${3:?usage: start-treatment.sh new|continue|critic RUN PROMPT_PATH WALL_SECONDS [PARENT_RUN] [SYSTEM_PROMPT|-] [MODEL_ID] [THINKING]}"
wall_seconds="${4:?usage: start-treatment.sh new|continue|critic RUN PROMPT_PATH WALL_SECONDS [PARENT_RUN] [SYSTEM_PROMPT|-] [MODEL_ID] [THINKING]}"
parent_run="${5:--}"
system_prompt="${6:--}"
model_id="${7:-qwen36-27b}"
thinking="${8:-high}"

if [[ ( "$mode" != "new" && "$mode" != "continue" && "$mode" != "critic" ) ||
      ! "$run_name" =~ ^[a-z0-9][a-z0-9-]{1,63}$ ||
      "$prompt_path" != /home/qg/prompts/*.txt ||
      ! -r "$prompt_path" ||
      ! "$wall_seconds" =~ ^[0-9]+$ ||
      "$wall_seconds" -lt 60 ||
      "$wall_seconds" -gt 7200 ||
      ! "$model_id" =~ ^[A-Za-z0-9._-]+$ ||
      ( "$thinking" != "off" &&
        "$thinking" != "low" &&
        "$thinking" != "medium" &&
        "$thinking" != "high" ) ]]; then
  echo "invalid treatment launch argument" >&2
  exit 2
fi

if [[ "$mode" == "continue" &&
      ! "$parent_run" =~ ^[a-z0-9][a-z0-9-]{1,63}$ ]]; then
  echo "continue mode requires a valid parent run" >&2
  exit 2
fi
if [[ "$system_prompt" != "-" &&
      ( "$system_prompt" != /home/qg/prompts/*.txt ||
        ! -r "$system_prompt" ) ]]; then
  echo "invalid system prompt path" >&2
  exit 2
fi

run_dir="/home/qg/runs/$run_name"
mkdir -p "$run_dir"
launcher_log="$run_dir/launcher.log"

if [[ "$mode" == "continue" ]]; then
  nohup \
    env QG_PI_WALL_SECONDS="$wall_seconds" \
    /home/qg/bin/continue-pi.sh \
      "$run_name" \
      "$parent_run" \
      "$prompt_path" \
      "$model_id" \
      "$thinking" \
    > "$launcher_log" \
    2>&1 \
    < /dev/null &
elif [[ "$mode" == "critic" ]]; then
  nohup \
    env QG_PI_WALL_SECONDS="$wall_seconds" \
    /home/qg/bin/run-readonly-critic.sh \
      "$run_name" \
      "$prompt_path" \
      "$model_id" \
      "$thinking" \
    > "$launcher_log" \
    2>&1 \
    < /dev/null &
else
  env_args=(QG_PI_WALL_SECONDS="$wall_seconds")
  if [[ "$system_prompt" != "-" ]]; then
    env_args+=(QG_PI_APPEND_SYSTEM_PROMPT="$system_prompt")
  fi
  nohup \
    env "${env_args[@]}" \
    /home/qg/bin/run-pi.sh \
      "$run_name" \
      "$prompt_path" \
      "$model_id" \
      "$thinking" \
    > "$launcher_log" \
    2>&1 \
    < /dev/null &
fi

printf '%s\n' "$!" > "$run_dir/launcher.pid"
printf 'started run=%s pid=%s mode=%s wall_seconds=%s model=%s thinking=%s\n' \
  "$run_name" "$!" "$mode" "$wall_seconds" "$model_id" "$thinking"

#!/usr/bin/env bash
set -euo pipefail

run_name="${1:?usage: collect-provenance.sh RUN_NAME PROMPT_PATH SITE MODEL PRECISION}"
prompt_path="${2:?usage: collect-provenance.sh RUN_NAME PROMPT_PATH SITE MODEL PRECISION}"
site="${3:?usage: collect-provenance.sh RUN_NAME PROMPT_PATH SITE MODEL PRECISION}"
model="${4:?usage: collect-provenance.sh RUN_NAME PROMPT_PATH SITE MODEL PRECISION}"
precision="${5:?usage: collect-provenance.sh RUN_NAME PROMPT_PATH SITE MODEL PRECISION}"

if [[ ! "$run_name" =~ ^[a-z0-9][a-z0-9-]{1,63}$ ||
      "$prompt_path" != /home/qg/prompts/*.txt ||
      ! -r "$prompt_path" ||
      ! "$site" =~ ^[a-z0-9-]+$ ||
      ! "$model" =~ ^[a-zA-Z0-9._-]+$ ||
      ! "$precision" =~ ^[a-zA-Z0-9._-]+$ ]]; then
  echo "invalid provenance argument" >&2
  exit 2
fi

run_dir="/home/qg/runs/$run_name"
output_dir="$run_dir/provenance"
mkdir -p "$output_dir"

node_version="$(node --version)"
pi_version="$(pi --version)"
started_at="$(< "$run_dir/started-at.txt")"
finished_at="$(< "$run_dir/finished-at.txt")"
exit_code="$(< "$run_dir/exit-code.txt")"
prompt_sha256="$(sha256sum "$prompt_path" | cut -d' ' -f1)"

jq -n \
  --arg schema "qwen-gauntlet-provenance-v1" \
  --arg run "$run_name" \
  --arg site "$site" \
  --arg model "$model" \
  --arg precision "$precision" \
  --arg node "$node_version" \
  --arg pi "$pi_version" \
  --arg prompt_sha256 "$prompt_sha256" \
  --arg started_at "$started_at" \
  --arg finished_at "$finished_at" \
  --arg exit_code "$exit_code" \
  '{
    schema: $schema,
    run: $run,
    site: $site,
    model: $model,
    precision: $precision,
    node: $node,
    pi: $pi,
    prompt_sha256: $prompt_sha256,
    started_at: $started_at,
    finished_at: $finished_at,
    exit_code: (
      if ($exit_code | test("^-?[0-9]+$"))
      then ($exit_code | tonumber)
      else $exit_code
      end
    ),
    operator_game_source_interventions: []
  }' > "$output_dir/run.json"

(
  cd /home/qg/workspace
  find . -type f -print0 |
    sort -z |
    xargs -0 -r sha256sum
) > "$output_dir/source-sha256.txt"

(
  cd "$run_dir/sessions"
  find . -type f -print0 |
    sort -z |
    xargs -0 -r sha256sum
) > "$output_dir/session-sha256.txt"

sha256sum \
  /home/qg/pi-agent/package-lock.json \
  > "$output_dir/pi-install-sha256.txt"

cp "$prompt_path" "$output_dir/exact-prompt.txt"

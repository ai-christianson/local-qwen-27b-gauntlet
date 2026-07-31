#!/usr/bin/env bash
set -euo pipefail

arm="${1:?usage: export-critic-arm.sh ARM LOOPBACK_SSH_PORT RUN_NAME PROMPT_NAME}"
ssh_port="${2:?usage: export-critic-arm.sh ARM LOOPBACK_SSH_PORT RUN_NAME PROMPT_NAME}"
run_name="${3:?usage: export-critic-arm.sh ARM LOOPBACK_SSH_PORT RUN_NAME PROMPT_NAME}"
prompt_name="${4:?usage: export-critic-arm.sh ARM LOOPBACK_SSH_PORT RUN_NAME PROMPT_NAME}"
vm_root="${QG_VM_ROOT:-/srv/qwen-gauntlet-vms}"
registry="$vm_root/registry.tsv"

if [[ ! "$arm" =~ ^[a-z0-9][a-z0-9-]{1,47}$ ||
      ! "$run_name" =~ ^[a-z0-9][a-z0-9-]{1,63}$ ||
      ! "$prompt_name" =~ ^[a-z0-9][a-z0-9-]{1,63}\.txt$ ||
      "$ssh_port" -lt 22000 ||
      "$ssh_port" -gt 22999 ]]; then
  echo "invalid critic export argument" >&2
  exit 2
fi

matches="$(
  awk -F '\t' -v wanted_arm="$arm" -v wanted_port="$ssh_port" \
    '$3 == wanted_arm && $5 == wanted_port { count += 1 } END { print count + 0 }' \
    "$registry"
)"
if [[ "$matches" != 1 ]]; then
  echo "registry does not uniquely resolve critic arm and port" >&2
  exit 1
fi

export_dir="$vm_root/exports/$arm"
archive="$export_dir/$run_name.raw.tar.gz"
known_hosts="$vm_root/arms/$arm/known_hosts"
mkdir -p "$export_dir"

guest_ssh=(
  ssh
  -i "$vm_root/controller_ed25519"
  -p "$ssh_port"
  -o BatchMode=yes
  -o StrictHostKeyChecking=accept-new
  -o "UserKnownHostsFile=$known_hosts"
  qg@127.0.0.1
)

"${guest_ssh[@]}" \
  "test -f '/home/qg/runs/$run_name/finished-at.txt' &&
   test -f '/home/qg/runs/$run_name/provenance/run.json' &&
   test -f '/home/qg/runs/$run_name/provenance/verbatim-critic-verdict.txt' &&
   test -d '/home/qg/review' &&
   test -f '/home/qg/review-bundle.sha256' &&
   test -f '/home/qg/prompts/$prompt_name'"

"${guest_ssh[@]}" \
  "tar -C /home/qg -czf - \
    workspace \
    review \
    review-bundle.sha256 \
    'runs/$run_name' \
    'prompts/$prompt_name'" \
  > "$archive"

tar -tzf "$archive" > "$export_dir/$run_name.contents.txt"
sha256sum "$archive" > "$export_dir/$run_name.raw.tar.gz.sha256"
date -Is > "$export_dir/$run_name.exported-at.txt"
echo "$archive"

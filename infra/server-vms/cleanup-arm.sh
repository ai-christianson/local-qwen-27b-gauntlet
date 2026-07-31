#!/usr/bin/env bash
set -euo pipefail

arm="${1:?usage: cleanup-arm.sh ARM LOOPBACK_SSH_PORT [--apply]}"
ssh_port="${2:?usage: cleanup-arm.sh ARM LOOPBACK_SSH_PORT [--apply]}"
mode="${3:-dry-run}"
vm_root="${QG_VM_ROOT:-/srv/qwen-gauntlet-vms}"
registry="$vm_root/registry.tsv"

if [[ ! "$arm" =~ ^[a-z0-9][a-z0-9-]{1,47}$ ||
      ! "$ssh_port" =~ ^[0-9]+$ ||
      "$ssh_port" -lt 22000 ||
      "$ssh_port" -gt 22999 ||
      ( "$mode" != "dry-run" && "$mode" != "--apply" ) ]]; then
  echo "invalid cleanup target or mode" >&2
  exit 2
fi

record="$(
  awk -F '\t' -v wanted_arm="$arm" -v wanted_port="$ssh_port" \
    '$3 == wanted_arm && $5 == wanted_port { print }' \
    "$registry"
)"
matches="$(printf '%s\n' "$record" | awk 'NF { count += 1 } END { print count + 0 }')"
if [[ "$matches" != 1 ]]; then
  echo "registry does not uniquely resolve cleanup target" >&2
  exit 1
fi

IFS=$'\t' read -r launched site recorded_arm pid recorded_port vcpus memory_mib \
  <<< "$record"
arm_dir="$vm_root/arms/$arm"
if [[ ! -d "$arm_dir" ||
      "$(realpath "$arm_dir")" != "$vm_root/arms/$arm" ||
      "$recorded_arm" != "$arm" ||
      "$recorded_port" != "$ssh_port" ||
      ! "$pid" =~ ^[0-9]+$ ]]; then
  echo "resolved cleanup target failed validation" >&2
  exit 1
fi

shopt -s nullglob
checksums=("$vm_root/exports/$arm/"*.raw.tar.gz.sha256)
shopt -u nullglob
if (( ${#checksums[@]} == 0 )); then
  echo "refusing cleanup before a checksummed raw export exists" >&2
  exit 1
fi

printf '%s site=%s arm=%s pid=%s port=%s dir=%s\n' \
  "$mode" "$site" "$arm" "$pid" "$ssh_port" "$arm_dir"
if [[ "$mode" != "--apply" ]]; then
  exit 0
fi

if kill -0 "$pid" 2>/dev/null; then
  command_line="$(tr '\0' ' ' < "/proc/$pid/cmdline")"
  if [[ "$command_line" != *"-name $arm "* ]]; then
    echo "refusing PID $pid: command does not identify arm" >&2
    exit 1
  fi
  kill -TERM "$pid"
  for _ in {1..30}; do
    kill -0 "$pid" 2>/dev/null || break
    sleep 1
  done
  if kill -0 "$pid" 2>/dev/null; then
    kill -KILL "$pid"
  fi
fi

rm -f \
  "$arm_dir/disk.qcow2" \
  "$arm_dir/seed.img" \
  "$arm_dir/user-data" \
  "$arm_dir/meta-data" \
  "$arm_dir/known_hosts" \
  "$arm_dir/qemu.pid" \
  "$arm_dir/ssh-port" \
  "$arm_dir/console.log" \
  "$vm_root/arms/guest-known-hosts-$ssh_port"
rmdir "$arm_dir"

printf '%s\tretired=%s\n' "$record" "$(date -Is)" \
  >> "$vm_root/registry.retired.tsv"
new_registry="$(mktemp "$vm_root/registry.tsv.next.XXXXXX")"
awk -F '\t' -v wanted_arm="$arm" -v wanted_port="$ssh_port" \
  '!($3 == wanted_arm && $5 == wanted_port)' \
  "$registry" > "$new_registry"
mv "$new_registry" "$registry"
echo "cleanup complete"

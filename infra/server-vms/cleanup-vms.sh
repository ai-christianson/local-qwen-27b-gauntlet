#!/usr/bin/env bash
set -euo pipefail

mode="${1:-dry-run}"
vm_root="${QG_VM_ROOT:-/srv/qwen-gauntlet-vms}"
registry="$vm_root/registry.tsv"

if [[ "$mode" != "dry-run" && "$mode" != "--apply" ]]; then
  echo "usage: cleanup-vms.sh [--apply]" >&2
  exit 2
fi

if [[ ! -f "$registry" ]]; then
  echo "no registry found: $registry"
  exit 0
fi

while IFS=$'\t' read -r launched site arm pid ssh_port vcpus memory_mib; do
  [[ "$arm" =~ ^[a-z0-9][a-z0-9-]{1,47}$ ]] || {
    echo "refusing malformed registry arm: $arm" >&2
    exit 1
  }
  [[ "$pid" =~ ^[0-9]+$ && "$ssh_port" =~ ^[0-9]+$ ]] || {
    echo "refusing malformed registry PID or port for arm: $arm" >&2
    exit 1
  }
  arm_dir="$vm_root/arms/$arm"
  if [[ ! -d "$arm_dir" ]]; then
    if kill -0 "$pid" 2>/dev/null; then
      echo "refusing missing arm directory with a live PID: $arm ($pid)" >&2
      exit 1
    fi
    echo "$mode stale-retired site=$site arm=$arm pid=$pid dir=absent"
    continue
  fi
  if [[ "$(realpath "$arm_dir")" != "$vm_root/arms/$arm" ]]; then
    echo "refusing unresolved arm directory: $arm_dir" >&2
    exit 1
  fi

  echo "$mode site=$site arm=$arm pid=$pid port=$ssh_port dir=$arm_dir"
  if [[ "$mode" != "--apply" ]]; then
    continue
  fi

  if kill -0 "$pid" 2>/dev/null; then
    command_line="$(tr '\0' ' ' < "/proc/$pid/cmdline")"
    if [[ "$command_line" != *"-name $arm "* ]]; then
      echo "refusing PID $pid: command does not identify $arm" >&2
      exit 1
    fi
    kill -TERM "$pid"
    for attempt in $(seq 1 30); do
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
done < "$registry"

if [[ "$mode" == "--apply" ]]; then
  archive="$vm_root/registry.cleaned.$(date -u +%Y%m%dT%H%M%SZ).tsv"
  mv "$registry" "$archive"
  echo "cleanup complete; registry archived at $archive"
fi

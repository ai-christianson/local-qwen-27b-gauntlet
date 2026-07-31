#!/usr/bin/env bash
set -euo pipefail

ssh_port="${1:?usage: guest-put.sh LOOPBACK_SSH_PORT TARGET MODE}"
target="${2:?usage: guest-put.sh LOOPBACK_SSH_PORT TARGET MODE}"
mode="${3:?usage: guest-put.sh LOOPBACK_SSH_PORT TARGET MODE}"
vm_root="${QG_VM_ROOT:-/srv/qwen-gauntlet-vms}"
known_hosts="$vm_root/arms/guest-known-hosts-$ssh_port"

if (( ssh_port < 22000 || ssh_port > 22999 )); then
  echo "SSH port must be in 22000..22999" >&2
  exit 2
fi

case "$target" in
  .pi/agent/models.json|.qg-runtime-env|prompts/*.txt|bin/*.sh|bin/*.cjs|bin/*.py|inputs/*.tar.gz|inputs/*.sha256)
    ;;
  *)
    echo "refusing target outside guest experiment allowlist" >&2
    exit 2
    ;;
esac

if [[ "$target" == *".."* || ! "$mode" =~ ^0(600|700|644|755)$ ]]; then
  echo "invalid target or mode" >&2
  exit 2
fi

guest_path="/home/qg/$target"
guest_dir="${guest_path%/*}"

ssh \
  -i "$vm_root/controller_ed25519" \
  -p "$ssh_port" \
  -o BatchMode=yes \
  -o StrictHostKeyChecking=accept-new \
  -o "UserKnownHostsFile=$known_hosts" \
  qg@127.0.0.1 \
  "umask 077; mkdir -p '$guest_dir'; tee '$guest_path' >/dev/null; chmod '$mode' '$guest_path'"

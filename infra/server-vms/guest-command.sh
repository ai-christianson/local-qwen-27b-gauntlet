#!/usr/bin/env bash
set -euo pipefail

ssh_port="${1:?usage: guest-command.sh LOOPBACK_SSH_PORT COMMAND [ARG...]}"
shift
vm_root="${QG_VM_ROOT:-/srv/qwen-gauntlet-vms}"
known_hosts="$vm_root/arms/guest-known-hosts-$ssh_port"

if (( ssh_port < 22000 || ssh_port > 22999 )); then
  echo "SSH port must be in 22000..22999" >&2
  exit 2
fi

ssh \
  -i "$vm_root/controller_ed25519" \
  -p "$ssh_port" \
  -o BatchMode=yes \
  -o StrictHostKeyChecking=accept-new \
  -o "UserKnownHostsFile=$known_hosts" \
  qg@127.0.0.1 \
  "$@"

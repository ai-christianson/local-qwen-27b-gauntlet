#!/usr/bin/env bash
set -euo pipefail

arm="${1:?usage: wait-ready.sh ARM LOOPBACK_SSH_PORT}"
ssh_port="${2:?usage: wait-ready.sh ARM LOOPBACK_SSH_PORT}"
vm_root="${QG_VM_ROOT:-/srv/qwen-gauntlet-vms}"
known_hosts="$vm_root/arms/$arm/known_hosts"

for attempt in $(seq 1 180); do
  if ssh \
    -i "$vm_root/controller_ed25519" \
    -p "$ssh_port" \
    -o BatchMode=yes \
    -o ConnectTimeout=3 \
    -o StrictHostKeyChecking=accept-new \
    -o "UserKnownHostsFile=$known_hosts" \
    qg@127.0.0.1 \
    'test -r /var/lib/qg-ready && node --version && pi --version && printf "QG_VM_READY\n"'
  then
    exit 0
  fi
  sleep 5
done

echo "timed out waiting for $arm" >&2
exit 1


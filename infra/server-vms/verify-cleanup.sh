#!/usr/bin/env bash
set -euo pipefail

port="${1:-18443}"
vm_root="${QG_VM_ROOT:-/srv/qwen-gauntlet-vms}"
if [[ ! "$port" =~ ^[0-9]+$ ]]; then
  echo "invalid listener port" >&2
  exit 2
fi

test ! -f "$vm_root/registry.tsv"
test -z "$(
  find "$vm_root/arms" \
    -mindepth 1 \
    -maxdepth 1 \
    -type d \
    -name "qg-*" \
    -print \
    -quit 2>/dev/null
)"
! pgrep -f "qemu-system.*-name qg-" > /dev/null
test ! -e "$vm_root/tcp-forward-$port.pid"
test ! -e "$vm_root/tcp-forward-$port.log"
! ss -ltn | grep -Eq "[:.]${port}[[:space:]]"

archive_count="$(
  find "$vm_root" \
    -maxdepth 1 \
    -type f \
    -name "registry.cleaned.*.tsv" |
    wc -l
)"
test "$archive_count" -ge 1
echo "verified archived_registries=$archive_count"

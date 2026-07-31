#!/usr/bin/env bash
set -euo pipefail

port="${1:-18443}"
vm_root="${QG_VM_ROOT:-/srv/qwen-gauntlet-vms}"
if [[ ! "$port" =~ ^[0-9]+$ || "$port" -lt 1024 || "$port" -gt 65535 ]]; then
  echo "invalid listener port" >&2
  exit 2
fi

pid_file="$vm_root/tcp-forward-$port.pid"
log_file="$vm_root/tcp-forward-$port.log"
forwarder="$vm_root/infra/tcp-forward.py"

if [[ ! -f "$pid_file" ]]; then
  echo "no bridge PID file"
  exit 0
fi

pid="$(cat "$pid_file")"
if [[ ! "$pid" =~ ^[0-9]+$ || ! -r "/proc/$pid/cmdline" ]]; then
  echo "refusing missing or malformed bridge PID" >&2
  exit 1
fi

command_line="$(tr '\0' ' ' < "/proc/$pid/cmdline")"
expected="$forwarder --listen-host 127.0.0.1 --listen-port $port "
if [[ "$command_line" != *"$expected"* ]]; then
  echo "refusing unexpected bridge command" >&2
  exit 1
fi

kill -TERM "$pid"
for attempt in $(seq 1 50); do
  kill -0 "$pid" 2>/dev/null || break
  sleep 0.1
done
if kill -0 "$pid" 2>/dev/null; then
  echo "bridge did not stop" >&2
  exit 1
fi

rm -f "$pid_file" "$log_file"
if ss -ltn | awk -v suffix=":$port" '
  $4 ~ suffix "$" { found = 1 }
  END { exit(found ? 0 : 1) }
'; then
  echo "listener remains" >&2
  exit 1
fi

echo "bridge-clean"

#!/usr/bin/env bash
set -euo pipefail

arm="${1:?usage: launch-vm.sh ARM LOOPBACK_SSH_PORT [VCPUS] [MEMORY_MIB] [SITE]}"
ssh_port="${2:?usage: launch-vm.sh ARM LOOPBACK_SSH_PORT [VCPUS] [MEMORY_MIB] [SITE]}"
vcpus="${3:-8}"
memory_mib="${4:-12288}"
site="${5:-unspecified}"
vm_root="${QG_VM_ROOT:-/srv/qwen-gauntlet-vms}"
bridge_hostname="${QG_GUEST_BRIDGE_HOSTNAME:-}"
bridge_port="${QG_GUEST_BRIDGE_PORT:-}"

if [[ ! "$arm" =~ ^[a-z0-9][a-z0-9-]{1,47}$ ]]; then
  echo "invalid arm name" >&2
  exit 2
fi

if (( ssh_port < 22000 || ssh_port > 22999 )); then
  echo "SSH port must be in 22000..22999" >&2
  exit 2
fi

if (( vcpus < 2 || vcpus > 16 || memory_mib < 4096 || memory_mib > 24576 )); then
  echo "resource request outside experiment bounds" >&2
  exit 2
fi

bridge_hosts_line="# no host-gateway inference bridge"
bridge_nft_line="# no host-gateway inference bridge"
if [[ -n "$bridge_hostname" || -n "$bridge_port" ]]; then
  if [[ ! "$bridge_hostname" =~ ^[a-zA-Z0-9.-]+$ ||
        ! "$bridge_port" =~ ^[0-9]+$ ||
        "$bridge_port" -lt 1024 ||
        "$bridge_port" -gt 65535 ]]; then
    echo "invalid host-gateway bridge configuration" >&2
    exit 2
  fi
  bridge_hosts_line="10.0.2.2 $bridge_hostname"
  bridge_nft_line="ip daddr 10.0.2.2 tcp dport $bridge_port accept"
fi

base_image="$vm_root/base/noble-server-cloudimg-amd64.img"
infra_dir="$vm_root/infra"
arm_dir="$vm_root/arms/$arm"
disk="$arm_dir/disk.qcow2"
seed="$arm_dir/seed.img"
pid_file="$arm_dir/qemu.pid"

if [[ ! -f "$base_image" ]]; then
  echo "missing verified base image: $base_image" >&2
  exit 1
fi

if [[ ! -f "$vm_root/controller_ed25519.pub" ]]; then
  echo "missing controller public key" >&2
  exit 1
fi

if [[ -e "$arm_dir" ]]; then
  echo "arm directory already exists: $arm_dir" >&2
  exit 1
fi

mkdir -p "$arm_dir"
qemu-img create -q -f qcow2 -F qcow2 -b "$base_image" "$disk" 40G

pubkey="$(< "$vm_root/controller_ed25519.pub")"
sed \
  -e "s/__HOSTNAME__/$arm/g" \
  -e "s|__SSH_PUBLIC_KEY__|$pubkey|g" \
  -e "s|__BRIDGE_HOSTS_LINE__|$bridge_hosts_line|g" \
  -e "s|__BRIDGE_NFT_LINE__|$bridge_nft_line|g" \
  "$infra_dir/cloud-init.yaml.tpl" > "$arm_dir/user-data"
sed -e "s/__HOSTNAME__/$arm/g" \
  "$infra_dir/meta-data.yaml.tpl" > "$arm_dir/meta-data"
cloud-localds "$seed" "$arm_dir/user-data" "$arm_dir/meta-data"

qemu-system-x86_64 \
  -name "$arm" \
  -enable-kvm \
  -machine q35,accel=kvm \
  -cpu host \
  -smp "$vcpus" \
  -m "$memory_mib" \
  -drive "file=$disk,if=virtio,format=qcow2,cache=none,discard=unmap" \
  -drive "file=$seed,if=virtio,format=raw,readonly=on" \
  -device virtio-rng-pci \
  -netdev "user,id=net0,hostfwd=tcp:127.0.0.1:${ssh_port}-:22" \
  -device virtio-net-pci,netdev=net0 \
  -display none \
  -serial "file:$arm_dir/console.log" \
  -monitor none \
  -daemonize \
  -pidfile "$pid_file"

printf '%s\n' "$ssh_port" > "$arm_dir/ssh-port"
printf '%s\t%s\t%s\t%s\t%s\t%s\t%s\n' \
  "$(date -Is)" "$site" "$arm" "$(< "$pid_file")" "$ssh_port" "$vcpus" "$memory_mib" \
  >> "$vm_root/registry.tsv"
echo "launched $arm pid=$(< "$pid_file") ssh=127.0.0.1:$ssh_port"

# Disposable distributed server VMs

These scripts run on selected private KVM servers. They contain no server
address, SSH key, model endpoint, or inference credential.

Each experiment arm gets an independent Ubuntu cloud-image overlay, cloud-init
seed, QEMU process, localhost-only SSH forward, and guest workspace. Nothing is
mounted from the VM host.

The guest is provisioned with Node 22.23.1, exact Pi 0.83.0, current Playwright
and Chromium, FFmpeg, Git, jq, and build tools. The temporary `qg` account loses
sudo after provisioning. An nftables output policy blocks private/link-local
address ranges while preserving DNS and public Internet access.

Runtime secrets are injected after boot and are excluded from this repository.
`registry.tsv` records every launched arm so monitoring and cleanup use exact
targets.

Usage on each VM host:

```text
./launch-vm.sh int4-baseline-s1 22221 8 12288 site-a
./wait-ready.sh int4-baseline-s1 22221
./cleanup-vms.sh
./cleanup-vms.sh --apply
```

`cleanup-vms.sh` is a dry run unless passed `--apply`. Extraction and checksum
verification happen before applying cleanup. `QG_VM_ROOT` may override the
default `/srv/qwen-gauntlet-vms`.

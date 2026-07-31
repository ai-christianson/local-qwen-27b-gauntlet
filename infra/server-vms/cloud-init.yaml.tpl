#cloud-config
hostname: __HOSTNAME__
manage_etc_hosts: true
ssh_pwauth: false
disable_root: true

users:
  - name: qg
    gecos: Qwen Gauntlet Experiment
    shell: /bin/bash
    lock_passwd: true
    sudo: ALL=(ALL) NOPASSWD:ALL
    ssh_authorized_keys:
      - __SSH_PUBLIC_KEY__

package_update: true
packages:
  - build-essential
  - ca-certificates
  - curl
  - ffmpeg
  - git
  - jq
  - nftables
  - python3
  - unzip
  - xz-utils

write_files:
  - path: /usr/local/sbin/qg-provision
    owner: root:root
    permissions: "0755"
    content: |
      #!/usr/bin/env bash
      set -euo pipefail

      node_version="22.23.1"
      node_archive="node-v${node_version}-linux-x64.tar.xz"
      node_url="https://nodejs.org/dist/v${node_version}"
      scratch_dir="$(mktemp -d)"
      cd "$scratch_dir"
      curl -fsSLO "${node_url}/${node_archive}"
      curl -fsSLO "${node_url}/SHASUMS256.txt"
      grep "  ${node_archive}$" SHASUMS256.txt | sha256sum -c -
      tar -xJf "$node_archive" -C /opt
      ln -sfn "/opt/node-v${node_version}-linux-x64/bin/node" /usr/local/bin/node
      ln -sfn "/opt/node-v${node_version}-linux-x64/bin/npm" /usr/local/bin/npm
      ln -sfn "/opt/node-v${node_version}-linux-x64/bin/npx" /usr/local/bin/npx
      ln -sfn "/opt/node-v${node_version}-linux-x64/bin/corepack" /usr/local/bin/corepack

      install -d -o qg -g qg /home/qg/pi-agent
      install -d -o qg -g qg /home/qg/runtime
      install -d -o qg -g qg /home/qg/workspace
      install -d -o qg -g qg /home/qg/.pi/agent
      install -d -o qg -g qg /home/qg/runs

      sudo -u qg -H bash -lc \
        'cd /home/qg/pi-agent && npm init -y && npm install --save-exact @earendil-works/pi-coding-agent@0.83.0'
      ln -sfn /home/qg/pi-agent/node_modules/.bin/pi /usr/local/bin/pi

      sudo -u qg -H bash -lc \
        'cd /home/qg/runtime && npm init -y && npm install --save-exact @playwright/test@latest three@latest vite@latest ws@latest'
      /home/qg/runtime/node_modules/.bin/playwright install-deps chromium
      sudo -u qg -H /home/qg/runtime/node_modules/.bin/playwright install chromium

      nft -f - <<'NFT'
      table inet qg_egress {
        chain output {
          type filter hook output priority 0; policy accept;
          ct state established,related accept
          ip daddr 10.0.2.0/24 udp dport { 53, 67, 68 } accept
          ip daddr 10.0.2.0/24 tcp dport 53 accept
          __BRIDGE_NFT_LINE__
          ip daddr 10.0.0.0/8 reject
          ip daddr 172.16.0.0/12 reject
          ip daddr 192.168.0.0/16 reject
          ip daddr 169.254.0.0/16 reject
          ip6 daddr fc00::/7 reject
          ip6 daddr fe80::/10 reject
        }
      }
      NFT
      nft list ruleset > /etc/nftables.conf
      systemctl enable nftables
      printf '%s\n' '__BRIDGE_HOSTS_LINE__' >> /etc/hosts

      gpasswd -d qg sudo || true
      rm -f /etc/sudoers.d/90-cloud-init-users
      touch /var/lib/qg-ready
      chmod 0444 /var/lib/qg-ready
      rm -rf "$scratch_dir"

runcmd:
  - /usr/local/sbin/qg-provision

#!/usr/bin/env bash
set -euo pipefail

archive="${1:?usage: install-gamedev-skill-pack.sh /home/qg/inputs/SKILLS.tar.gz EXPECTED_SHA256}"
expected_sha256="${2:?usage: install-gamedev-skill-pack.sh /home/qg/inputs/SKILLS.tar.gz EXPECTED_SHA256}"
skills_root="/home/qg/.pi/agent/skills"

if [[ "$archive" != /home/qg/inputs/*.tar.gz ||
      ! "$expected_sha256" =~ ^[0-9a-f]{64}$ ||
      ! -r "$archive" ]]; then
  echo "invalid skill archive or hash" >&2
  exit 2
fi

actual_sha256="$(sha256sum "$archive" | cut -d' ' -f1)"
if [[ "$actual_sha256" != "$expected_sha256" ]]; then
  echo "skill archive checksum mismatch" >&2
  exit 1
fi

while IFS= read -r member; do
  case "$member" in
    threejs-scene-setup|threejs-scene-setup/*|threejs-materials-lighting|threejs-materials-lighting/*|physics-tuning|physics-tuning/*|camera-systems|camera-systems/*|game-feel|game-feel/*)
      ;;
    *)
      echo "refusing unexpected skill archive member: $member" >&2
      exit 1
      ;;
  esac
  if [[ "$member" == /* || "$member" == *".."* ]]; then
    echo "refusing unsafe skill archive member" >&2
    exit 1
  fi
done < <(tar -tzf "$archive")

mkdir -p "$skills_root"
tar \
  --no-same-owner \
  --no-same-permissions \
  -xzf "$archive" \
  -C "$skills_root"

printf '%s  %s\n' "$actual_sha256" "${archive##*/}" \
  > /home/qg/skill-pack.sha256
find "$skills_root" -type f -print0 |
  sort -z |
  xargs -0 -r sha256sum \
  > /home/qg/skill-files.sha256

echo "game-dev skill pack installed"

#!/usr/bin/env bash
set -euo pipefail

archive="${1:?usage: import-parent.sh /home/qg/inputs/ARCHIVE.tar.gz EXPECTED_SHA256}"
expected_sha256="${2:?usage: import-parent.sh /home/qg/inputs/ARCHIVE.tar.gz EXPECTED_SHA256}"

if [[ "$archive" != /home/qg/inputs/*.tar.gz ||
      ! "$expected_sha256" =~ ^[0-9a-f]{64}$ ||
      ! -r "$archive" ]]; then
  echo "invalid parent archive or hash" >&2
  exit 2
fi

actual_sha256="$(sha256sum "$archive" | cut -d' ' -f1)"
if [[ "$actual_sha256" != "$expected_sha256" ]]; then
  echo "parent archive checksum mismatch" >&2
  exit 1
fi

if find /home/qg/workspace -mindepth 1 -print -quit | grep -q .; then
  echo "workspace is not empty" >&2
  exit 1
fi

while IFS= read -r member; do
  case "$member" in
    workspace|workspace/*)
      ;;
    *)
      echo "refusing unexpected archive member: $member" >&2
      exit 1
      ;;
  esac
  if [[ "$member" == /* || "$member" == *".."* ]]; then
    echo "refusing unsafe archive member" >&2
    exit 1
  fi
done < <(tar -tzf "$archive")

tar \
  --no-same-owner \
  --no-same-permissions \
  -xzf "$archive" \
  -C /home/qg

printf '%s  %s\n' "$actual_sha256" "${archive##*/}" \
  > /home/qg/parent-archive.sha256
(
  cd /home/qg/workspace
  find . -type f -print0 |
    sort -z |
    xargs -0 -r sha256sum
) > /home/qg/parent-source-sha256.txt

echo "parent imported"

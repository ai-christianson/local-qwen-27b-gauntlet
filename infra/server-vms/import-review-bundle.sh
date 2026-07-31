#!/usr/bin/env bash
set -euo pipefail

archive="${1:?usage: import-review-bundle.sh /home/qg/inputs/REVIEW.tar.gz EXPECTED_SHA256}"
expected_sha256="${2:?usage: import-review-bundle.sh /home/qg/inputs/REVIEW.tar.gz EXPECTED_SHA256}"

if [[ "$archive" != /home/qg/inputs/*.tar.gz ||
      ! "$expected_sha256" =~ ^[0-9a-f]{64}$ ||
      ! -r "$archive" ]]; then
  echo "invalid review archive or hash" >&2
  exit 2
fi

actual_sha256="$(sha256sum "$archive" | cut -d' ' -f1)"
if [[ "$actual_sha256" != "$expected_sha256" ]]; then
  echo "review archive checksum mismatch" >&2
  exit 1
fi
if [[ -e /home/qg/review ]]; then
  echo "review directory already exists" >&2
  exit 1
fi

while IFS= read -r member; do
  case "$member" in
    review|review/*)
      ;;
    *)
      echo "refusing unexpected review archive member: $member" >&2
      exit 1
      ;;
  esac
  if [[ "$member" == /* || "$member" == *".."* ]]; then
    echo "refusing unsafe review archive member" >&2
    exit 1
  fi
done < <(tar -tzf "$archive")

tar \
  --no-same-owner \
  --no-same-permissions \
  -xzf "$archive" \
  -C /home/qg

printf '%s  %s\n' "$actual_sha256" "${archive##*/}" \
  > /home/qg/review-bundle.sha256
echo "review bundle imported"

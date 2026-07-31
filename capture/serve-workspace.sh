#!/usr/bin/env bash
set -euo pipefail

workspace="${1:-/home/qg/workspace}"
port="${2:-4173}"
log_file="${3:-/home/qg/evidence/server.log}"

if [[ "$workspace" != /home/qg/workspace || ! "$port" =~ ^[0-9]+$ ]]; then
  echo "invalid workspace or port" >&2
  exit 2
fi

mkdir -p "$(dirname "$log_file")"
cd "$workspace"

mapfile -t index_files < <(
  find . \
    -mindepth 1 \
    -maxdepth 3 \
    -type f \
    -name index.html \
    ! -path '*/node_modules/*' \
    ! -path '*/dist/*' \
    -print |
    sort
)

if (( ${#index_files[@]} == 1 )); then
  cd "$(dirname "${index_files[0]}")"
elif (( ${#index_files[@]} > 1 )); then
  printf 'ambiguous workspace: found %d source index files\n' "${#index_files[@]}" >&2
  printf '%s\n' "${index_files[@]}" >&2
  exit 1
fi

if [[ -f package.json ]] && node -e '
  const p = require("./package.json");
  process.exit(p.scripts && p.scripts.build ? 0 : 1);
'; then
  npm run build >> "$log_file" 2>&1
fi

if [[ -f dist/index.html ]]; then
  cd dist
  exec python3 -m http.server "$port" --bind 127.0.0.1
fi

if [[ -f index.html ]]; then
  exec /home/qg/runtime/node_modules/.bin/vite \
    --host 127.0.0.1 \
    --port "$port" \
    --strictPort
fi

echo "no runnable index.html or dist/index.html" >&2
exit 1

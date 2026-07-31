#!/usr/bin/env bash
set -euo pipefail

package_root="/home/qg/pi-agent/node_modules/@earendil-works/pi-coding-agent"
example_root="$package_root/examples/extensions/subagent"
extension_dir="/home/qg/.pi/agent/extensions/subagent"
agent_dir="/home/qg/.pi/agent/agents"

for required in \
  "$example_root/index.ts" \
  "$example_root/agents.ts" \
  "$example_root/agents/worker.md" \
  "$example_root/agents/reviewer.md"
do
  if [[ ! -r "$required" ]]; then
    echo "missing Pi 0.83 subagent example file: $required" >&2
    exit 1
  fi
done

mkdir -p "$extension_dir" "$agent_dir"
ln -sfn "$example_root/index.ts" "$extension_dir/index.ts"
ln -sfn "$example_root/agents.ts" "$extension_dir/agents.ts"

for agent in worker reviewer; do
  sed \
    's/^model: .*/model: qwen36-27b/' \
    "$example_root/agents/$agent.md" \
    > "$agent_dir/$agent.md"
done

grep -q '^model: qwen36-27b$' "$agent_dir/worker.md"
grep -q '^model: qwen36-27b$' "$agent_dir/reviewer.md"
echo "configured official Pi 0.83 subagent extension with Qwen-only agents"

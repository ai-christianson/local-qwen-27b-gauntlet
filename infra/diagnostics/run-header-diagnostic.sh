#!/usr/bin/env bash
set -euo pipefail

rm -f /home/qg/header-capture.json /home/qg/header-server.log
node /home/qg/bin/header-capture.cjs > /home/qg/header-server.log 2>&1 &
server_pid=$!

for _ in $(seq 1 40); do
  grep -q '^ready$' /home/qg/header-server.log 2>/dev/null && break
  kill -0 "$server_pid" 2>/dev/null || {
    cat /home/qg/header-server.log >&2
    exit 1
  }
  sleep 0.1
done

mkdir -p /home/qg/header-diagnostic-sessions
set +e
timeout 15s pi \
  --provider header-test \
  --model header-test-model \
  --session-dir /home/qg/header-diagnostic-sessions \
  -p "Reply with OK." \
  > /home/qg/header-diagnostic.stdout.log \
  2> /home/qg/header-diagnostic.stderr.log
pi_exit=$?
set -e

wait "$server_pid" || true
test -s /home/qg/header-capture.json
jq -n \
  --argjson pi_exit "$pi_exit" \
  --slurpfile capture /home/qg/header-capture.json \
  '{
    schema: "qwen-gauntlet-pi-header-diagnostic-v1",
    pi_exit: $pi_exit,
    captured: {
      method: $capture[0].method,
      url: $capture[0].url,
      priority_class: $capture[0].headers["x-router-priority-class"],
      preemptable: $capture[0].headers["x-router-can-be-preempted"],
      user_agent: $capture[0].headers["user-agent"]
    }
  }' > /home/qg/header-diagnostic-result.json
cat /home/qg/header-diagnostic-result.json

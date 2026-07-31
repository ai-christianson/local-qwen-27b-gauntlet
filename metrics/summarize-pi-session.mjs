import fs from "node:fs";
import path from "node:path";

const [sessionRoot, outputPath] = process.argv.slice(2);
if (!sessionRoot || !outputPath) {
  throw new Error("usage: node summarize-pi-session.mjs SESSION_ROOT OUTPUT_JSON");
}

function walk(root) {
  const files = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else if (entry.isFile()) files.push(full);
  }
  return files.sort();
}

const summary = {
  schema: "qwen-gauntlet-pi-session-summary-v1",
  sessionFiles: [],
  messages: { assistant: 0, user: 0, toolResult: 0, other: 0 },
  providers: {},
  models: {},
  stopReasons: {},
  tools: {},
  sourceMutationCalls: [],
  usage: {
    input: 0,
    output: 0,
    cacheRead: 0,
    cacheWrite: 0,
    reasoning: 0,
    totalTokens: 0,
  },
  toolErrors: 0,
  firstTimestamp: null,
  lastTimestamp: null,
  malformedLines: 0,
};

for (const file of walk(sessionRoot)) {
  summary.sessionFiles.push(path.relative(sessionRoot, file));
  const lines = fs.readFileSync(file, "utf8").split("\n");
  for (const line of lines) {
    if (!line.trim()) continue;
    let event;
    try {
      event = JSON.parse(line);
    } catch {
      summary.malformedLines += 1;
      continue;
    }
    const message = event.message;
    const timestamp = message?.timestamp ?? event.timestamp;
    if (timestamp !== undefined && timestamp !== null) {
      const normalized = typeof timestamp === "number"
        ? new Date(timestamp).toISOString()
        : new Date(timestamp).toISOString();
      if (!summary.firstTimestamp || normalized < summary.firstTimestamp) summary.firstTimestamp = normalized;
      if (!summary.lastTimestamp || normalized > summary.lastTimestamp) summary.lastTimestamp = normalized;
    }
    if (!message?.role) continue;

    if (message.role === "assistant") {
      summary.messages.assistant += 1;
      if (message.provider) summary.providers[message.provider] = (summary.providers[message.provider] ?? 0) + 1;
      if (message.model) summary.models[message.model] = (summary.models[message.model] ?? 0) + 1;
      if (message.stopReason) summary.stopReasons[message.stopReason] = (summary.stopReasons[message.stopReason] ?? 0) + 1;
      for (const key of Object.keys(summary.usage)) {
        summary.usage[key] += Number(message.usage?.[key] ?? 0);
      }
      for (const part of message.content ?? []) {
        if (part.type !== "toolCall") continue;
        const name = part.name ?? "unknown";
        summary.tools[name] = (summary.tools[name] ?? 0) + 1;
        if (name === "write" || name === "edit") {
          const candidatePath = part.arguments?.path ?? part.arguments?.file_path ?? null;
          summary.sourceMutationCalls.push({
            timestamp: typeof timestamp === "number" ? new Date(timestamp).toISOString() : timestamp,
            tool: name,
            path: candidatePath,
          });
        }
      }
    } else if (message.role === "user") {
      summary.messages.user += 1;
    } else if (message.role === "toolResult") {
      summary.messages.toolResult += 1;
      if (message.isError) summary.toolErrors += 1;
    } else {
      summary.messages.other += 1;
    }
  }
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");

const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

const sessionRoot = process.argv[2];
const runLabel = process.argv[3];
const port = Number(process.argv[4] ?? 4180);

if (
  !sessionRoot?.startsWith("/home/qg/runs/") ||
  !/^[a-z0-9][a-z0-9-]{1,63}$/.test(runLabel ?? "") ||
  !Number.isInteger(port) ||
  port < 4000 ||
  port > 4999
) {
  throw new Error("usage: pi-live-viewer.cjs SESSION_ROOT RUN_LABEL [PORT]");
}

function sanitize(value) {
  return String(value ?? "")
    .replace(/\b(?:10|127|169\.254|172\.(?:1[6-9]|2\d|3[01])|192\.168)(?:\.\d{1,3}){2}\b/g, "[private-address]")
    .replace(/\b(?:sk|rk|pk)-[A-Za-z0-9_-]{16,}\b/g, "[credential-redacted]")
    .replace(/(authorization|api[_-]?key|token)(\s*[:=]\s*)([^\s,;"']+)/gi, "$1$2[redacted]")
    .replace(/\s+/g, " ")
    .trim();
}

function walk(root) {
  const files = [];
  if (!fs.existsSync(root)) return files;
  for (const entry of fs.readdirSync(root, {withFileTypes: true})) {
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else if (entry.isFile()) files.push(full);
  }
  return files.sort();
}

function formatTimestamp(value) {
  if (value === undefined || value === null) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(11, 23);
}

function readEvents() {
  const events = [];
  const stats = {assistantTurns: 0, toolCalls: 0, toolErrors: 0, model: "qwen36-27b"};

  for (const file of walk(sessionRoot)) {
    for (const line of fs.readFileSync(file, "utf8").split("\n")) {
      if (!line.trim()) continue;
      let item;
      try {
        item = JSON.parse(line);
      } catch {
        continue;
      }
      const message = item.message;
      if (!message?.role) continue;
      const at = formatTimestamp(message.timestamp ?? item.timestamp);

      if (message.role === "assistant") {
        stats.assistantTurns += 1;
        if (message.model) stats.model = sanitize(message.model);
        for (const part of message.content ?? []) {
          if (part.type === "thinking") {
            const text = sanitize(part.thinking).slice(0, 210);
            if (text) events.push({at, kind: "thinking", text});
          } else if (part.type === "text") {
            const text = sanitize(part.text).slice(0, 210);
            if (text) events.push({at, kind: "assistant", text});
          } else if (part.type === "toolCall") {
            stats.toolCalls += 1;
            const name = sanitize(part.name);
            const args = part.arguments ?? {};
            const detail = name === "bash"
              ? sanitize(args.command).slice(0, 180)
              : sanitize(args.path ?? args.file_path ?? "").slice(0, 180);
            events.push({at, kind: "tool", text: `${name.toUpperCase()} ${detail}`.trim()});
          }
        }
      } else if (message.role === "toolResult") {
        if (message.isError) stats.toolErrors += 1;
        events.push({
          at,
          kind: message.isError ? "error" : "result",
          text: `${message.isError ? "ERROR" : "OK"} ${sanitize(message.toolName ?? "tool")}`,
        });
      }
    }
  }

  return {events: events.slice(-80), stats};
}

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Pi live trajectory — ${runLabel}</title>
<style>
  *{box-sizing:border-box}
  html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#06090d;color:#d9fbe5}
  body{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
  body:after{content:"";position:fixed;inset:0;pointer-events:none;background:repeating-linear-gradient(0deg,rgba(255,255,255,.025),rgba(255,255,255,.025) 1px,transparent 1px,transparent 4px)}
  .shell{width:100%;height:100%;padding:38px 48px;display:grid;grid-template-rows:auto 1fr auto;gap:22px}
  .top{display:flex;align-items:flex-end;justify-content:space-between;border-bottom:1px solid #244031;padding-bottom:18px}
  .kicker{font-size:17px;letter-spacing:3px;color:#46e7a0;margin-bottom:10px}
  .title{font-size:34px;font-weight:800;color:#f3fff7}
  .live{display:flex;align-items:center;gap:12px;color:#ffcf4c;font-size:18px;letter-spacing:2px}
  .dot{width:12px;height:12px;background:#ff5a65;box-shadow:0 0 18px #ff5a65;border-radius:50%}
  #stream{overflow:hidden;display:flex;flex-direction:column;justify-content:flex-end;gap:8px}
  .row{display:grid;grid-template-columns:108px 118px 1fr;gap:14px;padding:7px 11px;border-left:3px solid #213126;background:#0b1110;font-size:19px;line-height:1.35}
  .time{color:#60796b}.kind{font-weight:800;letter-spacing:1px}.text{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#cde8d6}
  .thinking{border-color:#55d6ff}.thinking .kind{color:#55d6ff}
  .assistant{border-color:#46e7a0}.assistant .kind{color:#46e7a0}
  .tool{border-color:#ffcf4c}.tool .kind{color:#ffcf4c}
  .result{border-color:#6f8a79}.result .kind{color:#87a692}
  .error{border-color:#ff5a65}.error .kind{color:#ff5a65}
  .bottom{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;border-top:1px solid #244031;padding-top:18px}
  .metric{font-size:15px;color:#708579;letter-spacing:1px}.metric b{display:block;color:#f3fff7;font-size:24px;margin-top:6px}
</style>
</head>
<body>
<div class="shell">
  <div class="top">
    <div><div class="kicker">RAW PI TRAJECTORY · LIVE JSONL</div><div class="title">${runLabel}</div></div>
    <div class="live"><span class="dot"></span><span>CAPTURING LIVE</span></div>
  </div>
  <div id="stream"></div>
  <div class="bottom">
    <div class="metric">MODEL<b id="model">qwen36-27b</b></div>
    <div class="metric">ASSISTANT TURNS<b id="turns">0</b></div>
    <div class="metric">TOOL CALLS<b id="tools">0</b></div>
    <div class="metric">TOOL ERRORS<b id="errors">0</b></div>
  </div>
</div>
<script>
const escapeHtml=(s)=>String(s).replace(/[&<>"']/g,(c)=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
async function refresh(){
  const data=await fetch("/events",{cache:"no-store"}).then((r)=>r.json());
  document.querySelector("#stream").innerHTML=data.events.slice(-22).map((e)=>
    '<div class="row '+escapeHtml(e.kind)+'"><span class="time">'+escapeHtml(e.at)+'</span><span class="kind">'+escapeHtml(e.kind.toUpperCase())+'</span><span class="text">'+escapeHtml(e.text)+'</span></div>'
  ).join("");
  document.querySelector("#model").textContent=data.stats.model;
  document.querySelector("#turns").textContent=data.stats.assistantTurns;
  document.querySelector("#tools").textContent=data.stats.toolCalls;
  document.querySelector("#errors").textContent=data.stats.toolErrors;
}
refresh();setInterval(refresh,500);
</script>
</body>
</html>`;

http.createServer((request, response) => {
  if (request.url === "/events") {
    response.writeHead(200, {"content-type": "application/json", "cache-control": "no-store"});
    response.end(JSON.stringify(readEvents()));
    return;
  }
  response.writeHead(200, {"content-type": "text/html; charset=utf-8", "cache-control": "no-store"});
  response.end(html);
}).listen(port, "127.0.0.1", () => {
  console.log(`Pi live trajectory viewer listening on 127.0.0.1:${port}`);
});

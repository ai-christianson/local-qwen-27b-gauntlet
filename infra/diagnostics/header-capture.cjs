const fs = require("node:fs");
const http = require("node:http");

const outputPath = "/home/qg/header-capture.json";
const server = http.createServer((request, response) => {
  fs.writeFileSync(
    outputPath,
    `${JSON.stringify(
      {
        schema: "qwen-gauntlet-header-capture-v1",
        method: request.method,
        url: request.url,
        headers: request.headers,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
  response.writeHead(503, { "content-type": "application/json" });
  response.end(
    JSON.stringify({
      error: { message: "intentional local header-capture diagnostic" },
    }),
  );
  server.close();
});

server.listen(9999, "127.0.0.1", () => {
  process.stdout.write("ready\n");
});

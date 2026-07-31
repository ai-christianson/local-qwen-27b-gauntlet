const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("/home/qg/runtime/node_modules/@playwright/test");

const url = process.argv[2];
const outputDir = process.argv[3];

if (!url || !outputDir || !outputDir.startsWith("/home/qg/evidence/")) {
  throw new Error("usage: browser-evidence.cjs URL /home/qg/evidence/RUN");
}

fs.mkdirSync(outputDir, { recursive: true });
const consoleEvents = [];
const pageErrors = [];

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    colorScheme: "dark",
  });
  const page = await context.newPage();

  page.on("console", (message) => {
    consoleEvents.push({
      at: new Date().toISOString(),
      type: message.type(),
      text: message.text(),
    });
  });
  page.on("pageerror", (error) => {
    pageErrors.push({
      at: new Date().toISOString(),
      message: error.message,
      stack: error.stack,
    });
  });

  const response = await page.goto(url, {
    waitUntil: "networkidle",
    timeout: 30_000,
  });

  await page.waitForTimeout(2_000);
  await page.screenshot({
    path: path.join(outputDir, "frame-02s.png"),
    type: "png",
  });

  const cadence = await page.evaluate(async () => {
    const durationMs = 10_000;
    const timestamps = [];
    const started = performance.now();
    await new Promise((resolve) => {
      function onFrame(now) {
        timestamps.push(now);
        if (now - started >= durationMs) {
          resolve();
          return;
        }
        requestAnimationFrame(onFrame);
      }
      requestAnimationFrame(onFrame);
    });
    const intervals = timestamps.slice(1).map((value, index) => value - timestamps[index]);
    intervals.sort((a, b) => a - b);
    const percentile = (p) => intervals[Math.min(intervals.length - 1, Math.floor(intervals.length * p))] ?? null;
    return {
      durationMs,
      frames: timestamps.length,
      fps: timestamps.length / (durationMs / 1000),
      intervalMs: {
        p50: percentile(0.5),
        p95: percentile(0.95),
        p99: percentile(0.99),
        max: intervals.at(-1) ?? null,
      },
    };
  });

  await page.screenshot({
    path: path.join(outputDir, "frame-12s.png"),
    type: "png",
  });
  await page.waitForTimeout(8_000);
  await page.screenshot({
    path: path.join(outputDir, "frame-20s.png"),
    type: "png",
  });

  fs.writeFileSync(
    path.join(outputDir, "browser-evidence.json"),
    `${JSON.stringify({
      capturedAt: new Date().toISOString(),
      url,
      httpStatus: response ? response.status() : null,
      cadence,
      consoleEvents,
      pageErrors,
    }, null, 2)}\n`,
    "utf8",
  );

  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

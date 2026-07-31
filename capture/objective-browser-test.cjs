const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("/home/qg/runtime/node_modules/@playwright/test");

const url = process.argv[2];
const outputDir = process.argv[3];

if (!url || !outputDir || !outputDir.startsWith("/home/qg/evidence/")) {
  throw new Error("usage: objective-browser-test.cjs URL /home/qg/evidence/RUN");
}

const sha256 = (buffer) => crypto.createHash("sha256").update(buffer).digest("hex");
const compactText = (value) => value.replace(/\s+/g, " ").trim().slice(0, 4000);

async function screenshot(page, filename) {
  const buffer = await page.screenshot({
    path: path.join(outputDir, filename),
    type: "png",
  });
  return { filename, sha256: sha256(buffer), bytes: buffer.length };
}

async function main() {
  fs.mkdirSync(outputDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    colorScheme: "dark",
  });
  const page = await context.newPage();
  const consoleEvents = [];
  const pageErrors = [];
  const actions = [];
  const textTimeline = [];
  const screenshots = [];

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

  const startedAt = new Date().toISOString();
  const response = await page.goto(url, {
    waitUntil: "domcontentloaded",
    timeout: 30_000,
  });
  await page.waitForTimeout(2_000);

  const initialDom = await page.evaluate(() => ({
    title: document.title,
    text: document.body?.innerText ?? "",
    canvases: Array.from(document.querySelectorAll("canvas")).map((canvas) => ({
      width: canvas.width,
      height: canvas.height,
      clientWidth: canvas.clientWidth,
      clientHeight: canvas.clientHeight,
    })),
    buttons: Array.from(document.querySelectorAll("button")).map((button) => ({
      text: (button.innerText || button.textContent || "").trim(),
      disabled: button.disabled,
    })),
  }));
  initialDom.text = compactText(initialDom.text);
  screenshots.push(await screenshot(page, "objective-02s.png"));

  const candidates = [
    { label: "demo", pattern: /demo/i },
    { label: "start-play-race", pattern: /start|play|race/i },
  ];
  let clicked = false;
  let demoClickBlocked = false;
  for (const candidate of candidates) {
    const matches = page.getByRole("button", { name: candidate.pattern });
    const count = await matches.count();
    for (let index = 0; index < count; index += 1) {
      const button = matches.nth(index);
      if (await button.isVisible() && await button.isEnabled()) {
        const text = compactText(await button.innerText());
        try {
          await button.click({ timeout: 2_000 });
          actions.push({ at: new Date().toISOString(), action: "click", rule: candidate.label, text });
          clicked = true;
          break;
        } catch (error) {
          if (candidate.label === "demo") demoClickBlocked = true;
          actions.push({
            at: new Date().toISOString(),
            action: "click-error",
            rule: candidate.label,
            text,
            error: String(error.message || error).slice(0, 1_000),
          });
        }
      }
    }
    if (clicked) break;
  }
  if (clicked && demoClickBlocked) {
    await page.waitForTimeout(500);
    const demoMatches = page.getByRole("button", { name: /demo/i });
    const count = await demoMatches.count();
    for (let index = 0; index < count; index += 1) {
      const button = demoMatches.nth(index);
      if (await button.isVisible() && await button.isEnabled()) {
        const buttonText = compactText(await button.innerText());
        try {
          await button.click({ timeout: 2_000 });
          actions.push({
            at: new Date().toISOString(),
            action: "click",
            rule: "demo-after-menu-unblock",
            text: buttonText,
          });
          break;
        } catch (error) {
          actions.push({
            at: new Date().toISOString(),
            action: "click-error",
            rule: "demo-after-menu-unblock",
            text: buttonText,
            error: String(error.message || error).slice(0, 1_000),
          });
        }
      }
    }
  }
  if (!clicked) {
    await page.keyboard.press("Enter");
    actions.push({ at: new Date().toISOString(), action: "keypress", key: "Enter", rule: "no-visible-start-button" });
  }

  await page.keyboard.down("ArrowUp");
  await page.waitForTimeout(2_000);
  await page.keyboard.down("ArrowLeft");
  await page.waitForTimeout(800);
  await page.keyboard.up("ArrowLeft");
  await page.keyboard.down("ArrowRight");
  await page.waitForTimeout(800);
  await page.keyboard.up("ArrowRight");
  await page.keyboard.up("ArrowUp");
  actions.push({
    at: new Date().toISOString(),
    action: "fixed-keyboard-sequence",
    sequence: "ArrowUp 3.6s; ArrowLeft 0.8s; ArrowRight 0.8s",
  });
  screenshots.push(await screenshot(page, "objective-06s.png"));

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
        p50: percentile(0.50),
        p95: percentile(0.95),
        p99: percentile(0.99),
        max: intervals.at(-1) ?? null,
      },
    };
  });
  screenshots.push(await screenshot(page, "objective-16s.png"));

  const completionPattern =
    /\b(finish(?:ed)?|complete(?:d)?|victory|you win|race over|(?:arena|level|stage) cleared)\b/i;
  const lapPattern = /\blap\b/i;
  const pollStarted = Date.now();
  while (Date.now() - pollStarted < 29_000) {
    const text = compactText(await page.locator("body").innerText().catch(() => ""));
    textTimeline.push({
      elapsedMs: Date.now() - pollStarted,
      text,
      completionSignal: completionPattern.test(text),
      lapSignal: lapPattern.test(text),
    });
    await page.waitForTimeout(1_000);
  }
  screenshots.push(await screenshot(page, "objective-45s.png"));

  await page.keyboard.press("r");
  actions.push({ at: new Date().toISOString(), action: "keypress", key: "r", rule: "fixed-reset-probe" });
  await page.waitForTimeout(3_000);
  screenshots.push(await screenshot(page, "objective-after-reset.png"));

  const distinctScreenshotHashes = new Set(screenshots.map((item) => item.sha256)).size;
  const completionSignals = textTimeline.filter((item) => item.completionSignal).length;
  const finalDom = await page.evaluate(() => ({
    title: document.title,
    text: document.body?.innerText ?? "",
    canvases: Array.from(document.querySelectorAll("canvas")).map((canvas) => ({
      width: canvas.width,
      height: canvas.height,
      clientWidth: canvas.clientWidth,
      clientHeight: canvas.clientHeight,
    })),
  }));
  finalDom.text = compactText(finalDom.text);

  const evidence = {
    schema: "qwen-gauntlet-objective-browser-v3",
    startedAt,
    finishedAt: new Date().toISOString(),
    url,
    httpStatus: response ? response.status() : null,
    initialDom,
    finalDom,
    actions,
    screenshots,
    distinctScreenshotHashes,
    cadence,
    textTimeline,
    completionSignals,
    consoleEvents,
    pageErrors,
  };
  fs.writeFileSync(
    path.join(outputDir, "objective-browser.json"),
    `${JSON.stringify(evidence, null, 2)}\n`,
    "utf8",
  );

  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("/home/qg/runtime/node_modules/@playwright/test");

const url = process.argv[2];
const outputDir = process.argv[3];
const durationSeconds = Number(process.argv[4] ?? 12);
const fps = Number(process.argv[5] ?? 60);

if (
  !/^http:\/\/127\.0\.0\.1:[0-9]+\/.*$/.test(url ?? "") ||
  !outputDir?.startsWith("/home/qg/evidence/") ||
  !Number.isInteger(durationSeconds) ||
  durationSeconds < 4 ||
  durationSeconds > 30 ||
  fps !== 60
) {
  throw new Error(
    "usage: frame-step-capture.cjs URL /home/qg/evidence/RUN 4..30 60",
  );
}

const framesDir = path.join(outputDir, "frame-step-frames");
const metadataPath = path.join(outputDir, "frame-step.json");
const frameBudgetMs = 1000 / fps;
const maxFrames = durationSeconds * fps;
const completionPattern =
  /\b(finish(?:ed)?|complete(?:d)?|victory|you win|race over|(?:arena|level|stage) cleared)\b/i;

const sha256 = (buffer) =>
  crypto.createHash("sha256").update(buffer).digest("hex");
const compactText = (value) =>
  String(value ?? "").replace(/\s+/g, " ").trim().slice(0, 2_000);
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function visibleEnabledButton(page, pattern) {
  const matches = page.getByRole("button", { name: pattern });
  for (let index = 0; index < (await matches.count()); index += 1) {
    const button = matches.nth(index);
    if ((await button.isVisible()) && (await button.isEnabled())) return button;
  }
  return null;
}

async function advanceVirtualTime(cdp, budgetMs) {
  const expired = new Promise((resolve) => {
    cdp.once("Emulation.virtualTimeBudgetExpired", resolve);
  });
  await cdp.send("Emulation.setVirtualTimePolicy", {
    policy: "advance",
    budget: budgetMs,
    maxVirtualTimeTaskStarvationCount: 10_000,
  });
  await expired;
  await cdp.send("Emulation.setVirtualTimePolicy", { policy: "pause" });
}

async function main() {
  fs.mkdirSync(framesDir, { recursive: true });

  const consoleEvents = [];
  const pageErrors = [];
  const sampledDom = [];
  const frameHashes = [];
  const startedAt = new Date().toISOString();
  const wallStarted = Date.now();

  const browser = await chromium.launch({
    headless: true,
    args: [
      "--disable-background-networking",
      "--disable-default-apps",
      "--disable-features=Translate",
      "--disable-sync",
      "--use-gl=angle",
      "--use-angle=swiftshader",
      "--enable-webgl",
    ],
  });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    colorScheme: "dark",
  });
  const page = await context.newPage();
  page.on("console", (message) => {
    consoleEvents.push({
      frame: frameHashes.length,
      type: message.type(),
      text: message.text(),
    });
  });
  page.on("pageerror", (error) => {
    pageErrors.push({
      frame: frameHashes.length,
      message: error.message,
      stack: error.stack,
    });
  });

  const response = await page.goto(url, {
    waitUntil: "networkidle",
    timeout: 30_000,
  });
  await wait(1_000);

  const cdp = await context.newCDPSession(page);
  await cdp.send("Emulation.setVirtualTimePolicy", { policy: "pause" });
  await page.bringToFront();

  const actions = [];
  let demo = await visibleEnabledButton(page, /demo/i);
  let demoClicked = false;
  if (demo) {
    const buttonText = compactText(await demo.innerText());
    try {
      await demo.click({ timeout: 2_000 });
      actions.push({ kind: "click", rule: "demo", text: buttonText });
      demoClicked = true;
    } catch (error) {
      actions.push({
        kind: "click-error",
        rule: "demo",
        text: buttonText,
        error: String(error.message || error).slice(0, 1_000),
      });
    }
  }
  if (!demoClicked) {
    const start = await visibleEnabledButton(page, /start|play|race/i);
    if (start) {
      const buttonText = compactText(await start.innerText());
      await start.click({ timeout: 2_000 });
      actions.push({ kind: "click", rule: "menu-unblock", text: buttonText });
      demo = await visibleEnabledButton(page, /demo/i);
      if (demo) {
        const demoText = compactText(await demo.innerText());
        await demo.click({ timeout: 2_000 });
        actions.push({
          kind: "click",
          rule: "demo-after-menu-unblock",
          text: demoText,
        });
        demoClicked = true;
      }
    }
  }
  if (!demoClicked) {
    await page.keyboard.press("Enter");
    actions.push({ kind: "keypress", key: "Enter" });
  }

  let completionFrame = null;
  let stopAfterFrame = maxFrames;
  for (let frameIndex = 0; frameIndex < maxFrames; frameIndex += 1) {
    await advanceVirtualTime(cdp, frameBudgetMs);

    const screenshot = await cdp.send("Page.captureScreenshot", {
      format: "png",
      fromSurface: true,
      captureBeyondViewport: false,
    });
    const buffer = Buffer.from(screenshot.data, "base64");
    const filename = `frame-${String(frameIndex).padStart(6, "0")}.png`;
    fs.writeFileSync(path.join(framesDir, filename), buffer);
    frameHashes.push(sha256(buffer));

    if (frameIndex % fps === 0) {
      const text = compactText(
        await page.locator("body").innerText().catch(() => ""),
      );
      sampledDom.push({
        frame: frameIndex,
        virtualTimeMs: (frameIndex + 1) * frameBudgetMs,
        text,
        completionSignal: completionPattern.test(text),
      });
      if (completionFrame === null && completionPattern.test(text)) {
        completionFrame = frameIndex;
        stopAfterFrame = Math.min(maxFrames, frameIndex + fps);
      }
    }
    if (frameIndex + 1 >= stopAfterFrame) break;
  }

  const distinctFrameHashes = new Set(frameHashes).size;
  fs.writeFileSync(
    metadataPath,
    `${JSON.stringify(
      {
        schema: "qwen-gauntlet-fixed-step-capture-v3",
        disclosure:
          "Controller-side deterministic Chrome virtual-time capture; game source unchanged. This is not a real-time performance measurement.",
        startedAt,
        finishedAt: new Date().toISOString(),
        url,
        httpStatus: response ? response.status() : null,
        fps,
        frameBudgetMs,
        requestedDurationSeconds: durationSeconds,
        capturedFrames: frameHashes.length,
        encodedDurationSeconds: frameHashes.length / fps,
        distinctFrameHashes,
        completionFrame,
        actions,
        sampledDom,
        consoleEvents,
        pageErrors,
        wallCaptureSeconds: (Date.now() - wallStarted) / 1000,
        firstFrameSha256: frameHashes[0] ?? null,
        lastFrameSha256: frameHashes.at(-1) ?? null,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  await browser.close();
}

main().catch((error) => {
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(
    metadataPath,
    `${JSON.stringify(
      {
        schema: "qwen-gauntlet-fixed-step-capture-v1",
        error: String(error?.stack ?? error),
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
  console.error(error);
  process.exitCode = 1;
});

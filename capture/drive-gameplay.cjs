const fs = require("node:fs");
const { chromium } = require("/home/qg/runtime/node_modules/@playwright/test");

const endpoint = process.argv[2];
const durationSeconds = Number(process.argv[3] ?? 30);
const outputPath = process.argv[4];

if (
  !/^http:\/\/127\.0\.0\.1:[0-9]+$/.test(endpoint ?? "") ||
  !Number.isFinite(durationSeconds) ||
  durationSeconds < 10 ||
  durationSeconds > 120 ||
  !outputPath?.startsWith("/home/qg/evidence/")
) {
  throw new Error(
    "usage: drive-gameplay.cjs http://127.0.0.1:PORT DURATION_SECONDS /home/qg/evidence/RUN/driver.json",
  );
}

const actions = [];
const record = (action) =>
  actions.push({ elapsedMs: Date.now() - startedAt, ...action });
const startedAt = Date.now();
const readyPath = outputPath.replace(/\.json$/, ".ready.json");

async function wait(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function visibleEnabledButton(page, pattern) {
  const matches = page.getByRole("button", { name: pattern });
  for (let index = 0; index < (await matches.count()); index += 1) {
    const button = matches.nth(index);
    if ((await button.isVisible()) && (await button.isEnabled())) return button;
  }
  return null;
}

async function main() {
  let browser;
  for (let attempt = 1; attempt <= 30; attempt += 1) {
    try {
      browser = await chromium.connectOverCDP(endpoint);
      break;
    } catch (error) {
      if (attempt === 30) throw error;
      await wait(250);
    }
  }

  const context = browser.contexts()[0];
  const page = context.pages()[0];
  await page.waitForLoadState("domcontentloaded");
  await page.bringToFront();

  const demo =
    (await visibleEnabledButton(page, /demo/i)) ??
    (await visibleEnabledButton(page, /start|play|race/i));
  if (demo) {
    record({ action: "click", text: (await demo.innerText()).trim() });
    await demo.click();
  } else {
    record({ action: "keypress", key: "Enter", reason: "no-visible-button" });
    await page.keyboard.press("Enter");
  }

  // Do not start expensive screen encoding during the generated game's
  // countdown. Some artifacts advance countdowns per rendered frame, so their
  // wall time varies drastically under software rendering. Wait for the visible
  // HUD timer to advance, publish a readiness marker, then use the same
  // deterministic arcade-key sequence for every artifact.
  let raceReady = false;
  let timerText = "";
  for (let attempt = 0; attempt < 240; attempt += 1) {
    timerText = (
      await page.locator("#vt").textContent().catch(() => "")
    ).trim();
    if (timerText && !/^0:00(?:\.00)?$/.test(timerText)) {
      raceReady = true;
      break;
    }
    await wait(250);
  }
  if (!raceReady) {
    throw new Error(
      `race HUD timer did not advance within 60 seconds (last=${JSON.stringify(timerText)})`,
    );
  }
  record({ action: "race-ready", timerText });
  fs.writeFileSync(
    readyPath,
    `${JSON.stringify({
      schema: "qwen-gauntlet-gameplay-ready-v1",
      elapsedMs: Date.now() - startedAt,
      timerText,
    })}\n`,
    "utf8",
  );
  await wait(1_000);

  await page.keyboard.down("ArrowUp");
  record({ action: "keydown", key: "ArrowUp" });

  const sequence = [
    ["ArrowLeft", 1_800],
    ["ArrowRight", 1_800],
    ["ArrowLeft", 900],
    ["ArrowRight", 900],
    ["Space", 1_200],
    ["ArrowLeft", 1_400],
    ["ArrowRight", 1_400],
  ];
  const driveUntil = Date.now() + durationSeconds * 1_000 - 1_000;
  let step = 0;
  while (Date.now() < driveUntil) {
    const [key, plannedMs] = sequence[step % sequence.length];
    const remaining = driveUntil - Date.now();
    const heldMs = Math.max(0, Math.min(plannedMs, remaining));
    if (heldMs === 0) break;
    await page.keyboard.down(key);
    record({ action: "keydown", key, step });
    await wait(heldMs);
    await page.keyboard.up(key);
    record({ action: "keyup", key, step });
    step += 1;
  }

  for (const key of ["ArrowLeft", "ArrowRight", "Space", "ArrowUp"]) {
    await page.keyboard.up(key).catch(() => {});
  }
  record({ action: "finished" });
  fs.writeFileSync(
    outputPath,
    `${JSON.stringify(
      {
        schema: "qwen-gauntlet-deterministic-gameplay-input-v1",
        endpoint,
        durationSeconds,
        actions,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
  await browser.close();
}

main().catch((error) => {
  fs.writeFileSync(
    outputPath,
    `${JSON.stringify(
      {
        schema: "qwen-gauntlet-deterministic-gameplay-input-v1",
        endpoint,
        durationSeconds,
        actions,
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

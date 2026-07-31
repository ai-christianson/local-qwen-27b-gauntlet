const fs = require("node:fs");
const path = require("node:path");
const {chromium} = require("/home/qg/runtime/node_modules/@playwright/test");

const url = process.argv[2];
const outputPath = process.argv[3];
if (!url || !outputPath || !outputPath.startsWith("/home/qg/evidence/")) {
  throw new Error(
    "usage: completion-visibility-audit.cjs URL /home/qg/evidence/RUN/audit.json",
  );
}

const completionPattern =
  /\b(finish(?:ed)?|complete(?:d)?|victory|you win|race over|(?:arena|level|stage) cleared)\b/i;

async function snapshot(page, elapsedMs) {
  return page.evaluate(
    ({elapsedMs, completionPatternSource, completionPatternFlags}) => {
      const pattern = new RegExp(
        completionPatternSource,
        completionPatternFlags,
      );
      const onScreen = (element) => {
        let current = element;
        while (current && current.nodeType === Node.ELEMENT_NODE) {
          const style = getComputedStyle(current);
          if (
            style.display === "none" ||
            style.visibility === "hidden" ||
            Number(style.opacity) === 0
          ) {
            return false;
          }
          current = current.parentElement;
        }
        const rect = element.getBoundingClientRect();
        return (
          rect.width > 0 &&
          rect.height > 0 &&
          rect.bottom > 0 &&
          rect.right > 0 &&
          rect.top < innerHeight &&
          rect.left < innerWidth
        );
      };

      const visibleCompletionElements = Array.from(
        document.querySelectorAll("body *"),
      )
        .filter((element) => {
          const ownText = Array.from(element.childNodes)
            .filter((node) => node.nodeType === Node.TEXT_NODE)
            .map((node) => node.textContent || "")
            .join(" ")
            .replace(/\s+/g, " ")
            .trim();
          return ownText && pattern.test(ownText) && onScreen(element);
        })
        .map((element) => ({
          tag: element.tagName,
          id: element.id || null,
          className:
            typeof element.className === "string" ? element.className : null,
          text: (element.textContent || "").replace(/\s+/g, " ").trim(),
        }));

      const game = window.game ?? null;
      const kart = game?.kart ?? null;
      return {
        elapsedMs,
        visibleCompletionElements,
        commonState: {
          gameState: game?.state ?? null,
          kartFinished: kart?.finished ?? null,
          kartLap: kart?.lap ?? null,
          kartTotalLaps: kart?.totalLaps ?? null,
          elapsedTime: game?.elapsedTime ?? null,
          globalMode: window.GM ?? null,
        },
      };
    },
    {
      elapsedMs,
      completionPatternSource: completionPattern.source,
      completionPatternFlags: completionPattern.flags,
    },
  );
}

async function main() {
  fs.mkdirSync(path.dirname(outputPath), {recursive: true});
  const browser = await chromium.launch({headless: true});
  const context = await browser.newContext({
    viewport: {width: 1920, height: 1080},
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto(url, {waitUntil: "domcontentloaded", timeout: 30_000});
  await page.waitForTimeout(2_000);
  const initial = await snapshot(page, -1);

  const demo = page.getByRole("button", {name: /demo/i}).first();
  if (!(await demo.isVisible()) || !(await demo.isEnabled())) {
    throw new Error("no visible enabled Demo button");
  }
  await demo.click();
  const started = Date.now();

  await page.keyboard.down("ArrowUp");
  await page.waitForTimeout(2_000);
  await page.keyboard.down("ArrowLeft");
  await page.waitForTimeout(800);
  await page.keyboard.up("ArrowLeft");
  await page.keyboard.down("ArrowRight");
  await page.waitForTimeout(800);
  await page.keyboard.up("ArrowRight");
  await page.keyboard.up("ArrowUp");

  const timeline = [];
  while (Date.now() - started < 45_000) {
    const elapsedMs = Date.now() - started;
    timeline.push(await snapshot(page, elapsedMs));
    await page.waitForTimeout(500);
  }
  const final = await snapshot(page, Date.now() - started);
  await page.screenshot({
    path: outputPath.replace(/\.json$/, ".png"),
    type: "png",
  });

  const firstVisibleCompletion = timeline.find(
    (item) => item.visibleCompletionElements.length > 0,
  );
  const firstFinishedState = timeline.find(
    (item) =>
      item.commonState.kartFinished === true ||
      item.commonState.gameState === "finished",
  );
  const result = {
    schema: "qwen-gauntlet-completion-visibility-audit-v1",
    note:
      "Post-hoc diagnostic for evaluator validity; it does not replace the frozen primary evidence without an explicit correction record.",
    initial,
    timeline,
    final,
    firstVisibleCompletionElapsedMs:
      firstVisibleCompletion?.elapsedMs ?? null,
    firstFinishedStateElapsedMs: firstFinishedState?.elapsedMs ?? null,
    errors,
  };
  fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);
  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

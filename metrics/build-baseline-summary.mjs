import fs from "node:fs";
import path from "node:path";

const [extractedRoot, sessionSummaryRoot, outputPath] = process.argv.slice(2);
if (!extractedRoot || !sessionSummaryRoot || !outputPath) {
  throw new Error(
    "usage: node build-baseline-summary.mjs EXTRACTED_ROOT SESSION_SUMMARY_ROOT OUTPUT_JSON",
  );
}

const rows = [];
for (let seed = 1; seed <= 12; seed += 1) {
  const run = `int4-baseline-s${seed}`;
  const root = path.join(extractedRoot, run);
  const evidence = JSON.parse(
    fs.readFileSync(
      path.join(root, "evidence", run, "objective-browser.json"),
      "utf8",
    ),
  );
  const provenance = JSON.parse(
    fs.readFileSync(
      path.join(root, "runs", run, "provenance", "run.json"),
      "utf8",
    ),
  );
  const session = JSON.parse(
    fs.readFileSync(
      path.join(sessionSummaryRoot, `${run}.json`),
      "utf8",
    ),
  );

  const consoleErrors = evidence.consoleEvents.filter(
    (event) => event.type === "error",
  );
  const pageErrors = evidence.pageErrors;
  const canvasCount = evidence.initialDom?.canvases?.length ?? 0;
  const distinctScreenshots = evidence.distinctScreenshotHashes ?? 0;
  const bootClean =
    evidence.httpStatus === 200 &&
    canvasCount >= 1 &&
    consoleErrors.length === 0 &&
    pageErrors.length === 0 &&
    distinctScreenshots >= 2;

  rows.push({
    seed,
    run,
    site: provenance.site,
    precision: provenance.precision,
    model: provenance.model,
    pi: provenance.pi,
    prompt_sha256: provenance.prompt_sha256,
    exit_code: provenance.exit_code,
    started_at: provenance.started_at,
    finished_at: provenance.finished_at,
    browser: {
      http_status: evidence.httpStatus,
      canvas_count: canvasCount,
      distinct_screenshot_hashes: distinctScreenshots,
      cadence_fps: evidence.cadence?.fps ?? null,
      completion_signals: evidence.completionSignals ?? 0,
      console_error_count: consoleErrors.length,
      page_error_count: pageErrors.length,
      first_error:
        consoleErrors[0]?.text ??
        pageErrors[0]?.message ??
        null,
      boot_clean: bootClean,
    },
    pi_session: {
      assistant_turns: session.messages.assistant,
      tool_results: session.messages.toolResult,
      tool_errors: session.toolErrors,
      provider_reported_total_tokens: session.usage.totalTokens,
      provider_reported_output_tokens: session.usage.output,
      tools: session.tools,
    },
  });
}

const summary = {
  schema: "qwen-gauntlet-baseline-summary-v1",
  note:
    "boot_clean is a narrow executable boot/capture check, not the full Gate 0 or microgame gate",
  seeds: rows,
  aggregates: {
    total_seeds: rows.length,
    boot_clean_seeds: rows.filter((row) => row.browser.boot_clean).length,
    reached_completion_seeds: rows.filter(
      (row) => row.browser.completion_signals > 0,
    ).length,
    seeds_with_browser_error: rows.filter(
      (row) =>
        row.browser.console_error_count > 0 ||
        row.browser.page_error_count > 0,
    ).length,
    provider_reported_total_tokens: rows.reduce(
      (sum, row) => sum + row.pi_session.provider_reported_total_tokens,
      0,
    ),
    provider_reported_output_tokens: rows.reduce(
      (sum, row) => sum + row.pi_session.provider_reported_output_tokens,
      0,
    ),
    tool_errors: rows.reduce(
      (sum, row) => sum + row.pi_session.tool_errors,
      0,
    ),
  },
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");

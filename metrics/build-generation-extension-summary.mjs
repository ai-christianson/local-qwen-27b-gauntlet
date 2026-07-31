import fs from "node:fs";
import path from "node:path";

const [extractedRoot, sessionSummaryRoot, outputPath] = process.argv.slice(2);
if (!extractedRoot || !sessionSummaryRoot || !outputPath) {
  throw new Error(
    "usage: node build-generation-extension-summary.mjs EXTRACTED_ROOT SESSION_SUMMARY_ROOT OUTPUT_JSON",
  );
}

const completionPattern =
  /\b(finish(?:ed)?|complete(?:d)?|victory|you win|race over|(?:arena|level|stage) cleared)\b/i;

const readJson = (file) =>
  fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : null;

const walk = (root) => {
  if (!fs.existsSync(root)) return [];
  return fs.readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) return walk(full);
    return entry.isFile() ? [full] : [];
  });
};

const wilson95 = (successes, total) => {
  if (total === 0) return { low: null, high: null };
  const z = 1.959963984540054;
  const p = successes / total;
  const denominator = 1 + (z * z) / total;
  const center = (p + (z * z) / (2 * total)) / denominator;
  const margin =
    (z / denominator) *
    Math.sqrt((p * (1 - p)) / total + (z * z) / (4 * total * total));
  return { low: center - margin, high: center + margin };
};

const rows = [];
for (let seed = 1; seed <= 8; seed += 1) {
  const run = `int4-gen-text-r${seed}a`;
  const root = path.join(extractedRoot, run);
  const evidence = readJson(
    path.join(root, "evidence", run, "objective-browser.json"),
  );
  const provenance = readJson(
    path.join(root, "runs", run, "provenance", "run.json"),
  );
  const session = readJson(path.join(sessionSummaryRoot, `${run}.json`));
  if (!provenance || !session) {
    throw new Error(`missing provenance or session summary for ${run}`);
  }

  const consoleErrors =
    evidence?.consoleEvents?.filter((event) => event.type === "error") ?? [];
  const pageErrors = evidence?.pageErrors ?? [];
  const canvasCount = evidence?.initialDom?.canvases?.length ?? 0;
  const distinctScreenshots = evidence?.distinctScreenshotHashes ?? 0;
  const finalText = evidence?.finalDom?.text ?? "";
  const timelineCompletion =
    evidence?.textTimeline?.some((item) => item.completionSignal) ?? false;
  const completion =
    (evidence?.completionSignals ?? 0) > 0 ||
    timelineCompletion ||
    completionPattern.test(finalText);
  const parserWindowMiss =
    completion &&
    (evidence?.completionSignals ?? 0) === 0 &&
    !timelineCompletion &&
    completionPattern.test(finalText);
  const bootClean =
    evidence?.httpStatus === 200 &&
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
    wall_seconds:
      (Date.parse(provenance.finished_at) - Date.parse(provenance.started_at)) /
      1000,
    workspace_file_count: walk(path.join(root, "workspace")).filter(
      (file) => !file.includes(`${path.sep}node_modules${path.sep}`),
    ).length,
    browser: {
      evaluation_present: evidence !== null,
      http_status: evidence?.httpStatus ?? null,
      canvas_count: canvasCount,
      distinct_screenshot_hashes: distinctScreenshots,
      cadence_fps: evidence?.cadence?.fps ?? null,
      completion_signals: evidence?.completionSignals ?? 0,
      completion,
      parser_window_miss: parserWindowMiss,
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
      image_limit_errors: session.stopReasons.error ?? 0,
      tools: session.tools,
    },
  });
}

const completed = rows.filter((row) => row.browser.completion).length;
const bootClean = rows.filter((row) => row.browser.boot_clean).length;
const summary = {
  schema: "qwen-gauntlet-text-first-generation-extension-v1",
  note:
    "Follow-up historical comparison. The original empty-workspace baseline and this extension were not randomized concurrently.",
  arms: rows,
  aggregates: {
    total_arms: rows.length,
    externally_complete_arms: completed,
    externally_complete_rate: completed / rows.length,
    externally_complete_wilson95: wilson95(completed, rows.length),
    boot_clean_arms: bootClean,
    boot_clean_rate: bootClean / rows.length,
    boot_clean_wilson95: wilson95(bootClean, rows.length),
    parser_window_misses: rows.filter(
      (row) => row.browser.parser_window_miss,
    ).length,
    arms_with_browser_error: rows.filter(
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
    total_wall_seconds: rows.reduce((sum, row) => sum + row.wall_seconds, 0),
  },
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
console.log(outputPath);

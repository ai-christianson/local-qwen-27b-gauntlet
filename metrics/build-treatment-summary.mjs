import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const [extractedRoot, sessionSummaryRoot, outputPath, parentRun] =
  process.argv.slice(2);
if (!extractedRoot || !sessionSummaryRoot || !outputPath) {
  throw new Error(
    "usage: node build-treatment-summary.mjs EXTRACTED_ROOT SESSION_SUMMARY_ROOT OUTPUT_JSON [PARENT_RUN]",
  );
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function readIfExists(file) {
  return fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
}

function hashFile(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function sourceManifest(runRoot, run) {
  const manifestPath = path.join(
    runRoot,
    "runs",
    run,
    "provenance",
    "source-sha256.txt",
  );
  const entries = new Map();
  for (const line of readIfExists(manifestPath).split("\n")) {
    const match = line.match(/^([0-9a-f]{64})  (.+)$/);
    if (match) entries.set(match[2], match[1]);
  }
  return entries;
}

const parentManifest = parentRun
  ? sourceManifest(path.join(extractedRoot, parentRun), parentRun)
  : new Map();

function classify(run) {
  if (run.includes("same-context")) return "same-context";
  if (run.includes("fresh-plain")) return "fresh-plain";
  if (run.includes("grounded-critic")) return "grounded-critic";
  if (run.includes("critic-repair")) return "critic-repair";
  if (run.includes("image-budget")) return "image-budget";
  if (run.includes("text-first")) return "text-first";
  if (run.includes("subagent")) return "subagent";
  if (run.includes("skills")) return "skills";
  if (run.includes("system")) return "reliability-system";
  if (run.includes("web")) return "web-assisted";
  if (run.includes("baseline")) return "baseline-parent";
  return "other";
}

const rows = [];
for (const entry of fs
  .readdirSync(extractedRoot, { withFileTypes: true })
  .filter((candidate) => candidate.isDirectory())
  .sort((a, b) => a.name.localeCompare(b.name))) {
  const run = entry.name;
  const root = path.join(extractedRoot, run);
  const evidencePath = path.join(
    root,
    "evidence",
    run,
    "objective-browser.json",
  );
  const provenancePath = path.join(
    root,
    "runs",
    run,
    "provenance",
    "run.json",
  );
  const sessionPath = path.join(sessionSummaryRoot, `${run}.json`);
  if (
    !fs.existsSync(evidencePath) ||
    !fs.existsSync(provenancePath) ||
    !fs.existsSync(sessionPath)
  ) {
    continue;
  }

  const evidence = readJson(evidencePath);
  const provenance = readJson(provenancePath);
  const session = readJson(sessionPath);
  const stderr = readIfExists(path.join(root, "runs", run, "stderr.log"));
  const stdoutPath = path.join(root, "runs", run, "stdout.log");
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

  const manifest = sourceManifest(root, run);
  const changed = [];
  const allPaths = new Set([...parentManifest.keys(), ...manifest.keys()]);
  for (const sourcePath of [...allPaths].sort()) {
    if (parentManifest.get(sourcePath) !== manifest.get(sourcePath)) {
      changed.push(sourcePath);
    }
  }

  rows.push({
    run,
    treatment: classify(run),
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
        consoleErrors[0]?.text ?? pageErrors[0]?.message ?? null,
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
    termination: {
      image_limit_error: stderr.includes(
        "At most 12 image(s) may be provided in one prompt",
      ),
      stderr_tail: stderr.trim().split("\n").slice(-3),
    },
    source_delta: {
      changed_file_count: changed.length,
      changed_files: changed,
    },
    stdout_sha256: fs.existsSync(stdoutPath) ? hashFile(stdoutPath) : null,
  });
}

const grouped = {};
for (const row of rows) {
  grouped[row.treatment] ??= {
    runs: 0,
    clean_exit: 0,
    boot_clean: 0,
    completion: 0,
    image_limit_error: 0,
  };
  const group = grouped[row.treatment];
  group.runs += 1;
  group.clean_exit += Number(row.exit_code === 0);
  group.boot_clean += Number(row.browser.boot_clean);
  group.completion += Number(row.browser.completion_signals > 0);
  group.image_limit_error += Number(row.termination.image_limit_error);
}

const summary = {
  schema: "qwen-gauntlet-treatment-summary-v1",
  note:
    "boot_clean is a narrow executable boot/capture check, not the full microgame gate; same-model reports are not independent scores",
  parent_run: parentRun ?? null,
  treatments: rows,
  aggregates: grouped,
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");

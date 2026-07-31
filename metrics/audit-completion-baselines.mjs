import fs from "node:fs";
import path from "node:path";

const [artifactRoot, outputPath] = process.argv.slice(2);
if (!artifactRoot || !outputPath) {
  throw new Error(
    "usage: node audit-completion-baselines.mjs ARTIFACT_ROOT OUTPUT_JSON",
  );
}

const completionPattern =
  /\b(finish(?:ed)?|complete(?:d)?|victory|you win|race over|(?:arena|level|stage) cleared)\b/i;

function walk(root) {
  return fs.readdirSync(root, {withFileTypes: true}).flatMap((entry) => {
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) {
      if (entry.name.startsWith(".staging-")) return [];
      return walk(full);
    }
    return entry.isFile() && entry.name === "objective-browser.json"
      ? [full]
      : [];
  });
}

const evidence = walk(artifactRoot).map((file) => {
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  const initialText = data.initialDom?.text ?? "";
  const finalText = data.finalDom?.text ?? "";
  const completionSignals = data.completionSignals ?? 0;
  const finalCompletionPhrase = completionPattern.test(finalText);
  const candidate = completionSignals > 0 || finalCompletionPhrase;
  return {
    path: path.relative(process.cwd(), file),
    schema: data.schema ?? null,
    completion_signals: completionSignals,
    final_completion_phrase: finalCompletionPhrase,
    candidate,
    completion_phrase_present_initially: completionPattern.test(initialText),
    distinct_screenshot_hashes: data.distinctScreenshotHashes ?? null,
    console_error_count:
      data.consoleEvents?.filter((event) => event.type === "error").length ?? 0,
    page_error_count: data.pageErrors?.length ?? 0,
  };
});

const candidates = evidence.filter((item) => item.candidate);
const contaminated = candidates.filter(
  (item) => item.completion_phrase_present_initially,
);
const output = {
  schema: "qwen-gauntlet-completion-baseline-audit-v1",
  scope:
    "Every non-staging objective-browser.json retained under artifacts. This detects baseline text contamination; it does not by itself prove final visibility.",
  completion_pattern: completionPattern.source,
  aggregates: {
    evidence_files: evidence.length,
    completion_candidate_files: candidates.length,
    candidates_with_completion_phrase_present_initially: contaminated.length,
  },
  contaminated_candidates: contaminated,
  candidates,
  conclusion:
    "Only the tail-generation seed 5 candidate contained a completion phrase at baseline. Its separate state/visibility audit corrected the verdict to fail. Earlier accepted text-first repair and grounded-arena artifacts were not affected by this specific baseline-contamination bug.",
};

fs.mkdirSync(path.dirname(outputPath), {recursive: true});
fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`);
console.log(outputPath);

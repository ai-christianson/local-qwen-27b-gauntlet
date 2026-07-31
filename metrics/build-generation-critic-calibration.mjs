import fs from "node:fs";
import path from "node:path";

const [generationSummaryPath, criticSummaryRoot, outputPath] =
  process.argv.slice(2);
if (!generationSummaryPath || !criticSummaryRoot || !outputPath) {
  throw new Error(
    "usage: node build-generation-critic-calibration.mjs GENERATION_SUMMARY_JSON CRITIC_SUMMARY_ROOT OUTPUT_JSON",
  );
}

const generation = JSON.parse(
  fs.readFileSync(generationSummaryPath, "utf8"),
);

// These verdicts and confidences are frozen transcriptions of the verbatim
// read-only critic stdout retained beside each trajectory. The critic saw
// source plus five ordered screenshots, but not objective-browser.json or the
// external label.
const frozenPredictions = {
  1: { prediction: "PASS", confidence: 92 },
  2: { prediction: "FAIL", confidence: 95 },
  3: { prediction: "FAIL", confidence: 95 },
  4: { prediction: "FAIL", confidence: 100 },
  5: { prediction: "FAIL", confidence: 95 },
  6: { prediction: "FAIL", confidence: 100 },
  7: { prediction: "FAIL", confidence: 95 },
  8: { prediction: "FAIL", confidence: 95 },
};

const arms = generation.arms.map((arm) => {
  const criticRun = `int4-gen-critic-r${arm.seed}a`;
  const critic = JSON.parse(
    fs.readFileSync(path.join(criticSummaryRoot, `${criticRun}.json`), "utf8"),
  );
  const frozen = frozenPredictions[arm.seed];
  const truth = arm.browser.completion ? "PASS" : "FAIL";
  const correct = frozen.prediction === truth;
  let classification = "TN";
  if (truth === "PASS" && frozen.prediction === "PASS") classification = "TP";
  if (truth === "FAIL" && frozen.prediction === "PASS") classification = "FP";
  if (truth === "PASS" && frozen.prediction === "FAIL") classification = "FN";

  return {
    seed: arm.seed,
    builder_run: arm.run,
    critic_run: criticRun,
    external_truth: truth,
    critic_prediction: frozen.prediction,
    critic_confidence: frozen.confidence,
    correct,
    classification,
    external_completion_signals: arm.browser.completion_signals,
    critic_provider_reported_total_tokens: critic.usage.totalTokens,
    critic_provider_reported_output_tokens: critic.usage.output,
    critic_assistant_turns: critic.messages.assistant,
    critic_tool_results: critic.messages.toolResult,
    critic_source_mutation_calls: critic.sourceMutationCalls.length,
  };
});

const count = (classification) =>
  arms.filter((arm) => arm.classification === classification).length;
const tp = count("TP");
const fp = count("FP");
const fn = count("FN");
const tn = count("TN");
const divide = (numerator, denominator) =>
  denominator === 0 ? null : numerator / denominator;
const positiveTruthArms = tp + fn;
const negativeTruthArms = tn + fp;
const accuracy = divide(tp + tn, arms.length);
const alwaysFailAccuracy = divide(negativeTruthArms, arms.length);

const output = {
  schema: "qwen-gauntlet-generation-critic-calibration-v1",
  frozen_prediction_source:
    "Verbatim critic stdout; the trajectory and stdout are retained. No outcome JSON was provided to the critic.",
  positive_class: "externally complete",
  arms,
  aggregates: {
    total_arms: arms.length,
    correct: arms.filter((arm) => arm.correct).length,
    accuracy,
    confusion: {tp, fp, fn, tn},
    positive_truth_arms: positiveTruthArms,
    negative_truth_arms: negativeTruthArms,
    pass_precision: divide(tp, tp + fp),
    pass_recall: divide(tp, tp + fn),
    fail_specificity: divide(tn, tn + fp),
    always_fail_baseline_correct: negativeTruthArms,
    always_fail_baseline_accuracy: alwaysFailAccuracy,
    accuracy_delta_vs_always_fail:
      accuracy === null || alwaysFailAccuracy === null
        ? null
        : accuracy - alwaysFailAccuracy,
    balanced_accuracy:
      positiveTruthArms === 0
        ? null
        : (divide(tp, positiveTruthArms) + divide(tn, negativeTruthArms)) / 2,
    mean_reported_confidence:
      arms.reduce((sum, arm) => sum + arm.critic_confidence, 0) / arms.length,
    provider_reported_total_tokens: arms.reduce(
      (sum, arm) => sum + arm.critic_provider_reported_total_tokens,
      0,
    ),
    provider_reported_output_tokens: arms.reduce(
      (sum, arm) => sum + arm.critic_provider_reported_output_tokens,
      0,
    ),
    source_mutation_calls: arms.reduce(
      (sum, arm) => sum + arm.critic_source_mutation_calls,
      0,
    ),
  },
  interpretation:
    "Seven failures were classified correctly, including the one arm that the frozen text-only evaluator initially misclassified. One critic still produced a high-confidence false positive. Every external label was FAIL, so an always-FAIL rule would score 8/8 and the Qwen critics scored 7/8. This cohort cannot estimate positive-class selection quality; its useful evidence is the seed-5 evaluator audit, not headline accuracy.",
};

fs.mkdirSync(path.dirname(outputPath), {recursive: true});
fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
console.log(outputPath);

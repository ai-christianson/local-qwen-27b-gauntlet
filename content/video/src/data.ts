export type PrecisionResult = {
  int4: string;
  bf16: string;
  note: string;
};

export const experiment = {
  model: "Qwen3.6-27B",
  agent: "Pi 0.83.0",
  cards: 24,
  baseline: "0 / 12",
  baselineBoot: "1 / 12",
  boundedEarly: "1 / 2",
  boundedFinal: "5 / 10",
  generationExtension: "0 / 8",
  generationBoot: "6 / 8",
  criticCalibration: "7 / 8",
  grounded: "2 / 1 / 1",
  transfer: "kart ✓ · arena ✓ after critique · platformer partial",
  skillResult: "No visual-quality win",
  motionResult: "Reset fixed elsewhere · wheel axis repaired here",
  precision: {
    int4: "5 / 10",
    bf16: "0 / 2",
    note: "BF16 repair was also 0 / 2; samples are unbalanced",
  } satisfies PrecisionResult,
  verdictHeadline: "A SMALL MODEL CAN IMPROVE—IF THE EVIDENCE IS BETTER.",
  verdictBody:
    "More agents alone did not create AAA quality. Compact evidence and fresh critics produced real repairs—and one Qwen critic caught our evaluator's false positive. Self-tests, public skills, BF16, and greenfield generation still failed in important ways.",
  repo: "PUBLIC REPO + RAW EVIDENCE",
};

// Final telemetry: p90 active serving GPUs (utilization >= 70%) in each of 12
// equal wall-time buckets. This is measured load, not allocations.
export const gpuTimeline = [
  18, 20, 10, 14, 14, 14, 12, 14, 10, 10, 14, 4,
];

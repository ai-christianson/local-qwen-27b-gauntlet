# Preregistered blind critic calibration

Frozen: 2026-07-31 02:45 America/New_York, while all eight generation arms
were still running.

After each generation arm is externally evaluated and its evidence is frozen,
launch one fresh read-only Qwen critic in that arm's VM. The critic receives:

- the Qwen-authored source already in the workspace;
- the five ordered objective-browser screenshots;
- the same short critic prompt;
- read-only file tools, with no shell, write, or edit tool.

It does not receive the objective-browser JSON, completion count, external
verdict, other arms, or operator analysis. It may not run the game.

Primary calibration result: critic PASS/FAIL prediction versus the independent
external completion verdict. Secondary: confidence, false-positive and
false-negative pattern, and whether cited evidence distinguishes genuine state
progression from an attractive or self-reported overlay.

This is not an independent-model judge: all critics use the same Qwen weights
as the builders. It tests whether a fresh artifact-reading context can
recognize the success or failure of same-model output, not whether Qwen agrees
with itself.

## Post-outcome calibration limit

All eight corrected external labels were FAIL. Raw accuracy is therefore not a
useful selector metric: an always-FAIL rule scores 8/8, while the Qwen critics
score 7/8 because of one false pass. Pass recall and balanced accuracy are
undefined. The cohort can support the seed-5 evaluator-audit case study, but it
cannot measure whether Qwen recognizes a true success.

A future balanced calibration must freeze pass/fail membership before critic
launch and include externally verified positives. It was not added post hoc to
this time box because selecting a balanced set after inspecting outcomes would
answer a different, operator-conditioned question.

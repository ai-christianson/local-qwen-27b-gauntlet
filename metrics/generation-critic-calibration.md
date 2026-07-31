# Blind generation-critic calibration

The eight fresh read-only Qwen critics saw only their builder's source and five
ordered screenshots. They did not receive `objective-browser.json`, the
external completion label, any other arm, or an operator diagnosis. They could
read but could not run or change the game.

| Seed | External truth | Qwen prediction | Confidence | Classification |
| ---: | --- | --- | ---: | --- |
| 1 | fail | pass | 92 | false positive |
| 2 | fail | fail | 95 | true negative |
| 3 | fail | fail | 95 | true negative |
| 4 | fail | fail | 100 | true negative |
| 5 | fail | fail | 95 | true negative |
| 6 | fail | fail | 100 | true negative |
| 7 | fail | fail | 95 | true negative |
| 8 | fail | fail | 95 | true negative |

Raw accuracy was 7/8 (87.5%), with TP=0, FP=1, FN=0, and TN=7. But every
external label was FAIL: an always-FAIL rule would score 8/8 (100%). Qwen was
therefore 12.5 percentage points below that trivial baseline. Treating
externally verified completion as the positive class, pass precision was zero,
pass recall and balanced accuracy were undefined, and this cohort cannot
measure success selection. Mean stated confidence was 95.875.

The critic correctly recognized seven failures. Seed 5 is the important case:
the frozen evaluator initially counted it as a pass because hidden
`RACE COMPLETE!` text was present in the DOM from the menu onward. The critic
rejected it. A post-hoc read-only state/visibility audit then found the game
still racing at 45.16 seconds, `kartFinished=false`, lap 3/3, and no visible
completion element. The builder's own longer test reached finished state at
roughly 46.3 seconds. Qwen's negative verdict was therefore correct under the
fixed 45-second gate.

Seed 1 remains a high-confidence false positive. The critic mathematically
inferred that continuous throttle should finish despite the frozen browser
evidence showing no progress.

The useful critic result is the seed-5 case study, not 87.5% accuracy. It is
direct evidence that a fresh Qwen critic can audit a controller-authored
evaluator and catch a real false positive. The cohort as a whole is evidence
against using one confident same-model critic as the sole selector: it contains
no true-positive opportunity and Qwen added one false pass relative to the
always-FAIL baseline. The best arrangement is disagreement plus an independent
executable mechanism check—not automatic trust in either side.

The machine-readable source of truth is
[`generation-critic-calibration.json`](generation-critic-calibration.json), and
the build script records the frozen verdict transcription.

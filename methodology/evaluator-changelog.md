# Evaluator changelog

## Objective browser v3 — 2026-07-31 00:34 ET

The v2 completion regex did not recognize the ordinary victory phrase
`ARENA CLEARED`. An external replay visibly progressed from three drones and
score zero to zero drones, score 2500, and an `ARENA CLEARED` overlay, but v2
still reported `completionSignals: 0`.

Version 3 adds the generic phrases `arena cleared`, `level cleared`, and
`stage cleared`. It does not change input timing, screenshot timing, browser
configuration, or the game. Frozen v2 evidence is retained unchanged; reports
must describe that run as a visually and state-verified pass with a v2 parser
false negative rather than silently rewriting the old metric.

The same generic phrase addition is applied to fixed-step capture v3 so that a
verified clear can stop after one additional second of frames. It does not
alter virtual-time advancement or rendering.

## Completion visibility audit — 2026-07-31 03:16 ET

The frozen v3 text parser initially labeled generation extension seed 5 as a
completion because `document.body.innerText` included `RACE COMPLETE!`.
Inspection found that the phrase belonged to an opacity-zero results screen and
was already present in `initialDom` on the menu. All 29 sampled completion
signals were therefore non-causal.

The original JSON remains unchanged. A post-hoc read-only diagnostic reran the
same frozen source and input path while separately checking:

- whether a matching completion element and all of its ancestors were
  displayed, visible, nonzero-opacity, and on screen;
- `window.game.state`;
- `window.game.kart.finished`;
- lap and elapsed state.

At 45.16 seconds the game was still `racing`, `kart.finished` was false, the
HUD state was lap 3/3, and no visible completion element had appeared. The
builder's own longer test, retained in its original trajectory, reached
finished state at about 46.3 seconds. Under the frozen 45-second gate, the
corrected verdict is fail.

The extension summary exposes both `frozen_text_candidate: true` and
`audit_corrected_false_positive: true`. It does not rewrite the old evidence or
pretend the stronger diagnostic was preregistered. Future generic evaluators
must require visible completion or an independently declared state transition,
and must reject completion text already present at baseline.

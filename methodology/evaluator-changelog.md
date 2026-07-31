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

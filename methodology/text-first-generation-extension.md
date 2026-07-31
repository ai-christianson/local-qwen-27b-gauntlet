# Preregistered tail replication: text-first empty-workspace generation

Frozen: 2026-07-31 02:23 America/New_York, before any extension VM is launched.

## Question

The replicated text-first condition completed 5/10 repairs, while the original
empty-workspace baseline completed 0/12. Those are different tasks. Does the
same small observation-budget rule help when Qwen must generate the game from
an empty workspace?

## Arms

Run eight fresh, isolated server VMs on production INT4. Every arm receives the
same frozen baseline prompt plus this exact suffix:

> Before using screenshots, inspect text, files, and browser errors. Use
> screenshots only when they can answer a specific question.

No game-specific diagnosis, code, visual reference, evaluator output, or
operator implementation hint is supplied.

## Fixed conditions

- Pi coding agent 0.83.0.
- Declared `qwen36-27b` production INT4 model.
- Empty workspace.
- 20-minute agent wall-clock cap.
- The same reasonable system reliability addendum as the baseline.
- The same independent objective-browser v3 path and final frozen frame/DOM.
- All source changes must come from the Pi/Qwen trajectory.

## Outcomes

Primary: real externally observed completion under the fixed Demo input path.

Secondary: boot cleanliness, image-ceiling failure, provider-reported tokens,
wall time, browser/page errors, time to completion, and visual/motion notes.

A completion after the parser sampling window but present in the frozen final
DOM/frame is retained and labeled a parser-window miss, as in the earlier
replication.

## Interpretation

The original 0/12 baseline is historical rather than concurrent, so this is a
follow-up comparison, not a randomized paired effect estimate. Eight samples
are enough to test whether the observed repair scaffold shows any generation
signal inside the remaining time box; they are not enough for a universal
model-capability claim.

No further source-mutating arm will be added after these eight. Remaining time
is reserved for external evaluation, synthesis, publication, cleanup, and a
post-cleanup inference probe before 06:00.

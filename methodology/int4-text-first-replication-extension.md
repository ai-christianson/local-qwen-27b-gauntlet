# INT4 text-first replication extension

Frozen at 2026-07-31 01:01 ET, before any of the four new outcomes were
observed.

## Why this extension was added

The first matched INT4 text-first condition produced one accepted completion
and one failure. During the official-BF16 pair, telemetry showed that most
production INT4 lanes were idle while the BF16 four-card lane was saturated.
Four additional exact INT4 replications therefore have higher information
value than four new showcase prompts: they tighten the reliability estimate
for the condition being compared with BF16.

## Frozen treatment

- Runs: `int4-text-first-r4` through `int4-text-first-r7`
- Fresh disposable server VM per run
- Parent:
  `artifacts/parents/int4-baseline-s2-parent-portable.tar.gz`
- Parent SHA-256:
  `99575b3eb75f6ef0d4d4f0d299a37c9865abba63a3643d33150a3d9ae7aef226`
- Prompt: `prompts/19-text-first-improve.txt`
- Model route: production `qwen36-27b` INT4
- Pi: `@earendil-works/pi-coding-agent` `0.83.0`
- Thinking: high
- Wall limit: 1,200 seconds
- Independent scorer: objective-browser v3

No run-specific hint, wheel diagnosis, source patch, or outcome-conditioned
continuation is allowed. Each arm is retained even if it fails to boot, times
out, or damages the parent.

## Interpretation

These four arms extend the existing two-replication INT4 text-first estimate.
They do not retroactively balance the much larger 12-seed empty-workspace
baseline, and the two-run BF16 comparison remains too small for a general
precision claim. The useful question is narrower: under this frozen repair
condition, how often does ordinary Qwen + Pi preserve or recover externally
observed Demo completion?

## Capacity amendment — 2026-07-31 01:05 ET

Before any r4–r7 outcome was observed, telemetry showed 10 of 24 serving cards
at or above 70% utilization, four Routerd requests running, no waiting request,
and no admission rejection. Two more exact replications, r8 and r9, were added
under the same frozen treatment. This brings the extended INT4 text-first
condition to six new arms and eight total when the two earlier matched
replications are included. No other field changed.

At 01:08 ET, still before any new outcome was observed, telemetry showed 12 of
24 cards at or above 70%, seven Routerd requests running, no waiting request,
and no admission rejection. Batching had consolidated multiple requests onto
already-hot TP2 lanes. Two final exact arms, r10 and r11, were added; scaling of
this condition then stopped. The condition therefore has eight new arms and
ten total including the two earlier runs.

# How we know this is Qwen's capability

The experiment is designed to answer a narrow question: what can the declared
Qwen3.6-27B checkpoint do through Pi when given ordinary prompts and additional
test-time inference? It is not a demonstration of the Codex operator quietly
finishing the game.

## Chain of custody

Every scored run retains:

- the exact UTF-8 prompt and its SHA-256 digest;
- a fresh VM identity, site label, UTC start/end time, and run identifier;
- exact Pi, Node, browser, and model/provider labels;
- Pi's raw session trajectory, including assistant text, tool calls, tool
  outputs, token usage, and errors;
- the generated source tree and a SHA-256 manifest;
- process metadata showing Pi was the source-writing process;
- generic evaluator actions, logs, screenshots, and video;
- an operator-intervention ledger, including an explicit `none` when untouched.

The final public bundle removes credentials and private infrastructure details,
but it does not rewrite or summarize away the model trajectory.

## Allowed operator work

Codex may design and freeze the experiment, create empty contained workspaces,
launch Pi, collect neutral evidence, run the same evaluator across arms, score
pre-registered gates, redact secrets, and package the result.

Codex may not author, edit, paste, or repair game source in a scored run. It may
not turn a critic's observation into a superior implementation plan, add
failure-specific hints, select only attractive seeds, or hide failed output.
Any such intervention makes that run ineligible for the primary result.

Harness changes are allowed only when they are game-agnostic, timestamped, and
applied mechanically across every applicable arm. The generated app remains
untouched.

A deterministic frame-step recorder may pause browser virtual time, advance it
in fixed 1/60-second increments, deliver the frozen input sequence, and capture
the resulting pixels. It may not alter game source, physics, camera behavior,
art, or completion logic. Offline frame-stepped footage is labeled separately
from measured real-time browser cadence; it cannot be used to claim the game
ran at 60 fps live.

## Actor attribution

- **Qwen3.6-27B** authors every scored game-source edit, model-written test,
  critic verdict, and repair choice.
- **Pi** provides the coding-agent loop, tool calls, and session mechanics.
- **GPT-5.6 Sol / Codex** designs and operates the experiment, builds generic
  containment and measurement infrastructure, verifies model claims, and
  packages the public record. None of that work counts as game-generation
  capability.
- **Human steering** supplies the question, time box, aesthetic interests, and
  artifact feedback.

Better instrumentation can expose behavior that a coarse recorder missed. The
instrument is not evidence of Qwen intelligence; the untouched source and its
behavior under that instrument are.

## What raw trajectories establish—and do not

The trajectories establish that the code-producing messages and tool calls came
through Pi configured for the declared model alias. A sanitized server-side
model audit will additionally record the resolved checkpoint/precision and
request timestamps without publishing credentials or private endpoints.

This is strong practical provenance, not a cryptographic proof about a remote
provider's internals. That limitation will be stated plainly. Where possible,
request timing will be reconciled with GPU telemetry from the serving hosts.

## Avoiding evaluator leakage

The one-shot baseline sees only its ordinary product-owner prompt. It cannot see
the rubric, research notes, other runs, or evaluator implementation.

Later evidence-grounded arms see only the evidence explicitly declared for that
treatment. A fresh critic's verdict is archived verbatim; a fresh builder
receives that verdict without operator translation. Executable regression gates
decide whether the change survives.

Codex is not used as the sole aesthetic judge. Objective behavior and browser
health are primary. Visual ratings identify the judge, randomize presentation
order, report confidence, and preserve disagreement. Same-model Qwen judgments
are labeled correlated evidence.

## Honesty checks in the final content

The final article/video will show:

1. the frozen prompt before results;
2. prompt hashes and exact software/model versions;
3. raw Pi trajectory excerpts next to the files they created;
4. the full seed grid, including failures and ugly results;
5. an intervention ledger and invalidated pilots;
6. fixed capture actions and executable measurements;
7. Qwen inference timestamps reconciled with serving-GPU activity;
8. separate labels for Qwen output, evaluator evidence, and editorial work;
9. a reproducibility bundle and dedicated public repository.

The claim is therefore limited to the artifacts and measured behavior in this
protocol. It is not “Qwen made a complete AAA game,” and it is not “no stronger
model influenced the experimental design.”

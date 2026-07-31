# Frozen experiment brief

Frozen at: 2026-07-30 20:10 America/New_York  
Hard cutoff: 2026-07-31 06:00 America/New_York

## Question

Can a locally served dense Qwen3.6-27B, operating through vanilla Pi, turn
additional inference into verified improvement on a real interactive browser
game? Does official BF16 change the outcome enough to justify roughly four
times lower aggregate host throughput than the production INT4 deployment?

## Binding steering addendum

The artifact should have the spirit of a late-1990s console kart racer:
chunky low-poly geometry, bold color, readable track landmarks, playful arcade
handling, and original escalating announcer energy. If the small artifact
passes its gates, expand toward:

1. AI racers and race-state drama.
2. Original escalation calls such as `BOOST`, `DOUBLE BOOST`, `APEX RAMPAGE`,
   and `UNTOUCHABLE` using generated text/tones rather than copied audio.
3. A real 2–4 player browser lobby and authoritative WebSocket netcode with
   interpolation, ready state, countdown, reconnect handling, and measurable
   local-network behavior.
4. A compact server-browser/lobby presentation with the legibility and
   immediacy of classic arena-PC games.

These are gated expansions. They do not change the controlled baseline prompt,
and failure to reach them is a result rather than permission to hide an
unfinished core loop.

Fable output is not a comparator. We already expect frontier/specialized systems
to make prettier work. The isolated subject is Pi plus local Qwen3.6-27B in
production INT4 and, if safely available, official BF16.

## Frozen arms

### A — one-shot baseline

One fresh Pi session from the empty common repo, production INT4, fixed baseline
prompt, fixed 40-minute wall limit. No post-hoc rescue by a stronger model.

### B — ordinary self-improvement

Branch from A. The same Qwen context is told to inspect its work and make the
single highest-value improvement. It receives the same executable evidence
bundle and matched repair budget as C.

### C — grounded fresh critic

Branch from A. A fresh Qwen context sees only the artifact, deterministic
screenshots, gameplay/test report, and calibrated rubric—not builder reasoning
or identity. It returns machine-readable scores and one largest gap. A separate
fresh builder context receives only that verdict plus the repo. Regression gates
decide whether the patch survives.

### D — BF16 paired subset, conditional

Repeat the frozen baseline and one grounded repair with official BF16 only if:

- the preserved checkpoint can be brought up without disrupting a real client;
- thermal and fabric health are normal;
- at least 150 minutes remain before the final packaging window;
- the exact capture/test path is already working;
- production INT4 service can be restored and verified afterward.

This is a paired subset, not a complete workflow × precision factorial. We will
not imply otherwise.

### E — official Pi subagents, exploratory

Clone the same selected INT4 parent into a separate arm. Load the unmodified
subagent extension bundled with Pi 0.83.0 and give the parent a short ordinary
improvement prompt. Every parent and child model is the same Qwen3.6-27B
endpoint; no Claude or frontier-model agent is available inside the VM.

The standard worker and reviewer role prompts are copied from the installed Pi
example with only their model field changed to `qwen36-27b`. Raw parent and
child trajectories and usage are retained. This exploratory arm measures
whether hierarchy and isolated contexts help, and whether its concurrent child
requests use idle inference capacity. It is not silently pooled with the
vanilla self-improvement or grounded-critic comparison.

## Operator boundary

The primary result measures **Pi plus Qwen**, not the Codex operator's ability
to finish a game around it.

The operator may:

- freeze prompts, budgets, gates, and randomization before a run;
- create empty isolated workspaces and launch Pi;
- install declared dependencies exactly as requested by the generated project;
- collect process, browser, screenshot, video, performance, and network
  evidence using a generic harness;
- apply rubric rules and report uncertainty;
- repair the experiment harness itself when that repair does not change game
  source or selectively favor an arm.

The operator may not:

- write or hand-edit game, rendering, input, art, UI, lobby, server, or netcode
  source in a primary arm;
- give taste-driven hints after seeing an arm's output;
- translate a critic verdict into a better implementation plan;
- silently fix build errors, flaky behavior, or broken tests;
- choose flattering cameras or rerun only an unattractive arm;
- discard failed generations, regressions, or clips.

All game-source changes must be attributable to a raw Pi trajectory using the
declared Qwen model. A necessary operator intervention is timestamped and makes
that run ineligible for the primary comparison unless the identical intervention
is applied mechanically to every arm. Any later human-assisted rescue is a
separate, prominently labeled demonstration and never contributes to the Qwen
score.

The complete provenance standard—including prompt hashes, source manifests,
raw trajectories, model-resolution audit, GPU-timestamp reconciliation, and
limits of the evidence—is frozen in `brief/capability-provenance.md`.

The evaluator is also imperfect. Objective gates are primary; visual rubric
scores include judge identity, randomized presentation order, and confidence.
Same-model Qwen judgments are reported as correlated evidence, not ground truth.

## Containment boundary

This laptop is controller/orchestrator only. No scored Pi process, generated
code, server, browser, or experiment VM runs here.

Each concurrent arm receives a distinct disposable KVM/QEMU VM on one
high-capacity server:

- 8 vCPU, 12 GiB RAM, 40 GiB copy-on-write disk;
- no host filesystem mounts or shared arm disks;
- QEMU user-mode NAT, with SSH forwarded to server loopback only;
- root login/password login disabled;
- one temporary non-root experiment user;
- sudo removed after automated provisioning;
- outbound RFC1918, link-local, and ULA ranges blocked inside the guest;
- Node 22.23.1, Pi 0.83.0, Playwright/Chromium, FFmpeg, and test utilities
  installed before the scored prompt;
- model configuration and credentials injected at run time, never committed;
- source, session trajectories, screenshots, video, and metrics copied out
  after the run.

The server has abundant CPU/RAM/storage headroom. Its resident production GPUs
remain untouched by VM setup; Pi calls the existing inference fabric normally.
Separate VMs prevent one concurrent arm from reading, killing, or modifying
another. The VM launch/provision scripts are included under `infra/server-vms/`
without private addresses, keys, endpoints, or credentials.

## Prompt honesty

The operator may write prompts, but they must remain plausible messages a
technical product owner could give a coding agent:

- short, ordinary language;
- goal and obvious constraints, not a hidden implementation;
- no code snippets, algorithms, file maps, or answer-shaped test cases;
- no failure-specific hints discovered by the operator after viewing a run;
- no iterative prompt polishing to coax a preferred outcome;
- exact prompt text published with every run.

Evidence-grounded rounds may attach mechanically generated screenshots, logs,
and test output. That is the treatment being measured, not a prompt trick.
The final account must separate one-shot capability from improvement purchased
with additional Qwen inference and external evidence.

## Why “fresh critic” is not enough

Fresh context prevents conversational anchoring and rationale leakage, but the
critic still shares the builder's weights and likely blind spots. It becomes
useful only when grounded in external evidence:

- deterministic scripted input;
- executable unit/integration/network gates;
- screenshots and video from fixed cameras;
- browser console and server logs;
- performance and black-frame checks;
- a calibrated rubric with explicit non-visual criteria.

## Progression gates

### Gate 0 — boots

- clean install and production build pass;
- no uncaught browser exceptions;
- deterministic seed is reported;
- fixed capture route produces non-black frames.

### Gate 1 — microgame

- keyboard/demo controls move the kart;
- one complete circuit and finish trigger exist;
- reset works;
- at least three landmarks make progress visually legible;
- scripted play reaches a valid completion state twice from the same seed.

### Gate 2 — race

- at least two AI racers complete the circuit;
- lap/rank state remains valid;
- announcer events are rate-limited and derived from real game events;
- no regression to Gate 1.

### Gate 3 — multiplayer

- two clean browser contexts can create/join/ready/start;
- server is authoritative for race state;
- snapshots are interpolated rather than directly teleported;
- disconnect/reconnect has an explicit outcome;
- measured local impairment test records latency/jitter/loss behavior;
- no claim of “production netcode” from a localhost-only demo.

Expansion stops on failed regression, two low-value rounds, deadline gate, or
thermal/service risk.

## Scoring

Report both raw measurements and a calibrated 0–100 rubric:

- 25: basic loop and correctness
- 20: handling/readability/feedback
- 15: visual composition and original art direction
- 15: robustness, deterministic capture, console health
- 10: performance and frame pacing
- 10: multiplayer, only when actually exercised
- 5: finish/polish

The rubric anchors are:

- 0–40: programmer prototype
- 40–60: competent hobby game
- 60–75: good indie prototype
- 75–88: near-professional vertical slice
- 88–95: shipped AAA presentation

Scores above 75 require external evidence beyond a flattering screenshot.

## Deadline gates

- 20:10–21:00 — freeze protocol, clean repo, tool upgrade, capture harness
- 21:00–22:00 — INT4 one-shot baseline
- 22:00–00:15 — matched workflow arms and first expansion
- 00:15–02:15 — BF16 paired subset if eligible; otherwise more INT4 seeds
- 02:15–03:45 — multiplayer gate or strongest bounded expansion
- 03:45 — code/model experimentation stops
- 03:45–05:15 — scoring, comparisons, final-video edit
- 05:15–05:45 — render and playback QA
- 05:45–06:00 — redaction, public GitHub push, KG finalization, service proof,
  VM cleanup proof, handoff

## Capture and grid plan

Every valid arm gets:

- lossless 1920×1080 PNG screenshots from identical seed/camera checkpoints;
- a deterministic 1920×1080 constant-60-fps H.264 gameplay capture with
  identical route duration, recorded from headed Chromium inside that arm's VM;
- browser console and performance logs;
- a contact sheet and perceptual-diff summary;
- a manifest labeling site, seed, precision, workflow arm, Pi/model version,
  wall time, and score.

The final social video may show synchronized 2×2 or 3×3 gameplay feeds. This
grid is meant to expose variance and failure, not manufacture spectacle. Feeds
are not re-timed to make one arm look more responsive. Interesting differences
can be paused and enlarged with the underlying gate result on screen.

The capture container's 60 fps is not evidence that the game rendered 60 unique
frames per second. Each clip gets `ffprobe` codec/dimension/pixel-format/rate
verification, duplicate/drop analysis, and a separate browser
`requestAnimationFrame` cadence trace. Final content reports actual cadence
honestly.

Two content classes remain separate:

- **scored evidence** uses the frozen query, generic start rule, keyboard probe,
  camera, duration, and evaluator for every arm;
- **editorial hero footage** may use a published deterministic input macro or a
  short human-driven run after source is frozen. If any content-only camera or
  demo helper changes game source, that derivative is excluded from scoring and
  appears in the intervention ledger.

Agent-in-progress footage is a live or explicitly labeled exact replay of raw Pi
JSONL events. It may omit tool-result contents to prevent credential leakage,
but it may not invent events.

If the CPU-rendered containment VM cannot sustain real-time 60 Hz, the hero reel
may be rendered offline at deterministic 1/60-second simulation steps in a
dedicated capture VM. The resulting unique-frame 60-fps video is editorial
rendering, not evidence of real-time frame rate. Real browser cadence remains a
separate reported measurement.

## Cleanup gate

Each host maintains an exact VM registry. Before cleanup:

1. copy out source, raw sessions, screenshots, videos, logs, and run manifest;
2. verify file counts and SHA-256 checksums in the artifact repository;
3. record production inference health;
4. run cleanup in dry-run mode and inspect exact site/arm/PID/port/disk targets.

Only then apply cleanup. The cleanup script validates the QEMU command line
against the registered arm, stops only that PID, and permanently removes only
that arm's disposable overlay/seed/config files. Base images and installed host
packages are retained unless separately and explicitly removed.

## Publication requirement

The final sanitized artifact is published to a new dedicated public GitHub
repository. It includes exact prompts, protocol, source, trajectories, failed
and invalidated runs, metrics, screenshots, reproducible short clips, content
notes, and final video where GitHub's file limits permit. Large media uses an
appropriate release asset or clearly documented external artifact if needed.

Before publication, scan both tracked files and history for secrets, private
endpoints, private hostnames/IPs, credentials, and unnecessary private topology.
Public technical reporting may say “24× RTX 3090 production fabric” and describe
precision/parallelism, but must not publish operational access details.

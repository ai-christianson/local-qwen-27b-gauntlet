# Results

## Bottom line

Yes: a locally served 27B model can make real, externally verified game
repairs when extra inference is organized around compact context, fresh roles,
and causal evidence.

No: this experiment did not produce an AAA-like game. The best artifacts are
programmer-to-hobby prototypes with real state bugs, low measured browser
cadence, clipping, camera discontinuities, and visually wonky motion. The
multiplayer gate was never reached.

The useful result is not “loop longer.” It is:

> Generate diverse Qwen hypotheses, keep observations compact, and spend a
> cheap executable check on selection.

## Experiment snapshot

| Item | Frozen value |
| --- | --- |
| Model | Qwen3.6-27B |
| Production precision | optimized INT4, two-GPU tensor-parallel lanes |
| Comparison precision | official BF16, four-GPU tensor parallel |
| Coding agent | `@earendil-works/pi-coding-agent@0.83.0` |
| Hardware | 24 production RTX 3090s across the serving fabric |
| Isolation | one disposable server-side KVM/QEMU VM per concurrent arm |
| Controller | GPT-5.6 Sol/Codex for protocol, orchestration, capture, scoring, and packaging only |
| Primary source authorship | Qwen through Pi; zero operator game-source edits |
| Time box | 2026-07-30 20:10 to 2026-07-31 06:00 America/New_York |

The laptop ran no experiment VM, Pi agent, game server, browser, or scored
model. It was only the controller/editor.

## Numeric results

### One-shot and reliability scaffold

| Condition | Accepted completions | Boot-clean | Notes |
| --- | ---: | ---: | --- |
| INT4, fresh empty workspace | 0/12 | 1/12 | ordinary short product prompt |
| INT4, text-first repair | 5/10 | 10/10 parent already booted | same frozen weak parent and 20-minute prompt |
| BF16, fresh empty workspace | 0/2 | 1/2 | one false lap; one unresolved import |
| BF16, text-first repair | 0/2 | 2/2 parent already booted | about 2.88M tokens total |

INT4 text-first has a Wilson 95% interval of 23.7–76.3%; the empty-workspace
baseline has 0–24.3%. The conditions are not the same task, so 5/10 versus 0/12
is not a clean causal effect size. It answers a narrower question: the simple
reliability scaffold replicated across seeds and remained unreliable.

Two text-first successes completed after the evaluator's 30-second
text-sampling window but before its frozen 45-second final DOM/frame. Their raw
`completionSignals: 0` fields are preserved and labeled parser-window misses.

### Grounded critic → fresh builder

| Artifact | Qwen critic diagnosis | External outcome |
| --- | --- | --- |
| arena seed | Demo fires before updating aim | pass: enemies 3→2→0, score 0→100→300, `YOU WIN` |
| transfer arena | Vite cannot resolve bare `three` import | pass: enemies 3→1→0, score 0→1000→2500, `ARENA CLEARED` |
| transfer platformer 1 | missing Three dependency | partial: dead overlay became live course, checkpoint 0/3→1/3 |
| transfer platformer 2 | structurally truncated page | fail: one narrow repair did not recover the artifact |

The strongest arena critic needed about 42,000 provider-reported tokens to find
a causal ordering bug that million-token builders had missed.

### Parallelism

The same Qwen-authored three-task plan was run sequentially and with Pi's
Qwen-only subagents:

| Execution | Tasks landed | Wall time | Reliability |
| --- | ---: | ---: | --- |
| sequential | 2/3 | 13.25 min | clean agent exit; external completion |
| parallel Qwen subagents | 3/3 | 4.3 min | external completion; parent self-killed with an overbroad `pkill -f serve` |

Parallel hierarchy improved breadth per wall minute. It did not improve process
safety or turn the result into polished software.

### Transfer and visual quality

Changing only a short brief produced distinct kart, arena, and platformer
artifacts. Functional reliability did not transfer:

- kart: one of two empty-workspace seeds completed;
- arena: zero of two baselines; one passed only after a grounded handoff;
- platformer: zero of two baselines; best grounded handoff reached 1/3;
- multiplayer: not attempted because the lower gate did not pass reliably.

Two public-skill treatments did not establish a visual-quality improvement.
In the cleanest matched plain-versus-five-skill run, both arms retained
completion; the plain arm completed at 14.88 simulated seconds and 9.4 browser
callbacks/s, while the skill-available arm completed at 17.92 seconds and 8.3
callbacks/s. Human review found more overexposure and barrier clutter in the
skill arm.

### Precision

Official BF16 did not rescue either tested condition. The matched repair result
was INT4 5/10 versus BF16 0/2. Two BF16 samples are not enough for a universal
precision claim, but they are enough to reject “just use BF16” as the night's
observed fix. Four-GPU BF16 also bought fewer concurrent hypotheses per wall
hour than the two-GPU INT4 lanes.

## The temporal A-ha

Functional browser gates missed the wheel wobble. Ordered fixed-step frames and
source were then given to four fresh Qwen critics without any wheel or axis
hint:

| Critic | Primary verdict | Proposed repair | Executable verdict |
| --- | --- | --- | --- |
| plain r1 | axle/wheel mismatch | `rotation.x` | wrong |
| plain r2 | stale-heading camera mismatch | camera alignment | plausible different defect |
| skill-available r1 | axle/wheel mismatch | `rotation.y` | correct |
| skill-available r2 | axle/wheel mismatch | `rotation.y` | correct |

After the reports were frozen, the installed Three.js `XYZ` Euler math provided
a six-line mechanical selector. Only Y preserved the transformed axle while
moving a perpendicular tread reference. The current Z moved the axle and
predicted the visible wobble.

This does **not** prove that a public skill made Qwen smarter. Neither
skill-condition critic opened the full `SKILL.md`; 2/2 versus 0/2 is tiny and
descriptive. It does show that critic diversity plus an executable mechanism
check can uncover useful capability that one Qwen trajectory and static
screenshots failed to expose.

A fresh Qwen builder then received only the selected Qwen report. In 493,955
tokens and 4.49 minutes it made exactly one source edit: Z→Y plus the
critic-suggested radius-based rate 2.5→2.86. The external replay still reached
`RACE COMPLETE` at 17.98 simulated seconds with 25 completion samples and zero
page/console errors. The parent's post-finish reset-overlay defect remained, so
this is a narrow axis/mechanism pass—not complete motion polish or proof that
the wheel's visual spin sign is correct.

## Capture truth

The final gameplay clips are 1920×1080 H.264 at constant 60 fps with temporal
duplicate analysis. The strongest fixed-step captures contain 480/480 or
1,200/1,200 unique source frames.

They are **offline virtual-time renders**. One simulated frame is advanced and
captured at a time; the wall-clock render is much slower. They are valid for
frame-by-frame motion inspection and smooth editorial playback, not evidence
that the game ran live at 60 fps. Measured live browser cadence is reported
separately.

## Fabric result

The experiment reached 22 of 24 active serving cards at peak. Bursty coding
agents alternate generation with reading, editing, installs, browser work, and
tests, so VM count did not translate into sustained lane demand. There was no
persistent scheduler queue and no admission rejection. Holding below overload
was more useful than manufacturing a queue for a utilization screenshot.

The production INT4 configuration was restored byte-for-byte. Routerd returned
active with zero restarts, both INT4 lanes loaded, a healthy models endpoint,
and a successful end-to-end Qwen completion probe.

After evidence export and acceptance, the registry-scoped cleanup removed 51
live experiment VMs across three hosts and reconciled three already-retired
rows. Post-cleanup checks found no experiment registry, arm directory, or QEMU
process left on any host, and each registry was archived. A fresh Pi 0.83.0
request to `routerd/qwen36-27b` returned exactly `OK` after cleanup.

## Final video QA

The published cut is 84 seconds at 1920×1080 and 60 fps (5,040 frames).
Automated review counted 4,362 visually distinct encoded frames, or 51.93 per
second, and passed the temporal-change check. Human review of the final contact
sheet found no black or frozen scene. The cut explicitly labels fixed-step
gameplay as offline capture and retains the failed and wonky results.

## How we know this is Qwen, not GPT-5.6 Sol

- Every scored game-source `write` or `edit` is present in a Pi JSONL trajectory
  attributed to the declared Qwen model alias.
- The source trees, exact prompts, session files, and SHA-256 manifests are
  retained together.
- Every source-mutating Pi process ran in a contained server VM with the local
  Qwen endpoint as its only coding model.
- Codex built generic infrastructure, selected treatments before outcomes,
  captured evidence, ran external checks, and edited the final video. It never
  authored or repaired scored game source.
- Qwen critic reports are stored verbatim. Builders receive those reports
  without an operator-written implementation translation.
- The final public trajectories are exact copies, not summaries.

This is strong practical provenance, not cryptographic attestation of a
provider's internals. A stronger model absolutely influenced the experimental
design and presentation; it did not create the measured game patches.

## What failed

- 11 of 12 empty-workspace INT4 games were not even boot-clean.
- Same-context and fresh-context builders repeatedly hit a 12-image request
  limit.
- Qwen wrote false-positive tests: one checked only DOM existence, another
  duplicated game logic in a separate simulator.
- A Qwen subagent parent killed itself with an overbroad process command.
- Public skills caused no demonstrated visual win.
- BF16 caused no demonstrated functional win.
- The external evaluator itself missed the ordinary phrase `ARENA CLEARED` and
  needed a generic parser revision.
- Frame-step video fixed capture smoothness, not the game's physics, art, or
  live performance.

## Answering the original questions

**Does it work with a model this small?**  
For bounded diagnosis and repair, sometimes: 5/10 in the replicated text-first
repair condition and two strong cross-artifact grounded handoffs. For autonomous
AAA-like game creation, no evidence here supports that claim.

**Did we learn something reusable?**  
Yes. Observation budgeting was more valuable than raw continuation. Fresh
critics helped when they cited a mechanism that predicted external evidence.
Multiple cheap critics plus executable selection were stronger than trusting
one confident report. Precision and generic skill availability were not
substitutes for that structure.

**Was the Gauntlet idea hype?**  
The label is underspecified. Public examples combine many agents, repeated
rounds, custom harnesses, critics, selection, and substantial compute. This
experiment found real value in that family of techniques, but not in the
slogan “run a loop until it is AAA.”

## Limitations

- No frontier-model or Fable output was run as a controlled comparator.
- BF16 has only two seeds per tested condition.
- Repair and empty-workspace conditions are not the same task.
- Qwen critics share weights and correlated blind spots.
- Human visual review was not blinded to every treatment after operational
  debugging.
- Offline captures improve observability but cannot recover a wheel-spin sign
  that symmetric geometry makes visually unidentifiable.
- The experiment optimized learning inside one night, not benchmark power.

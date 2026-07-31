# Interim findings

These are provisional observations from frozen prompts and fixed evidence. They
are updated as matched replications arrive.

## A clean self-report is not an accepted repair

The first source-grounded critic recommended changing the demo AI look-ahead
from `50` to `200`. A fresh Qwen builder made exactly that two-line edit and
reported a passing lap-completion regression.

The independent fixed evaluator contradicted it:

- zero completion signals over the observation window;
- final DOM still reported `LAP 0/1`;
- no browser exception that could explain a harness abort.

The model-authored `test_demo_lap.js` explains the false positive. It treated
this expression as proof that the results screen was visible:

```js
const resultsVisible = await page.$('#rs') !== null;
```

The results element exists in the DOM even when hidden. The test therefore
declared success at its first sample without testing visibility. This arm shows
why agent-written verification and same-model confidence cannot score the
experiment. The Gauntlet handoff executed the requested patch, but neither the
critic's diagnosis nor the builder's verifier produced an accepted repair.

## Visual context is currently a mechanical failure mode

Ordinary same-context continuation and multiple independent fresh-context arms
all eventually hit the model API's 12-image request limit. Fresh context alone
did not solve it: builders accumulated screenshots during normal visual
debugging and then terminated with partial work. Declared eight-image-budget and
text-only ablations are testing whether simple reliability scaffolding improves
accepted work without supplying game-specific answers.

## Partial visual improvement is not a completed game

One reliability-system arm found a real track-normal math error and visibly
widened the straightaway/start area. It exited cleanly with no browser errors.
The same fixed evaluator still found no lap completion and visual review found a
reset-camera regression. This is promising local reasoning, but only a partial
repair.

## A simple observation-budget change produced the first accepted completions

Two independent fresh builders from the same weak-but-booting parent passed the
external lap-completion gate:

- the eight-image-budget arm completed at 8.86 seconds;
- the text-first arm completed at 7.85 seconds.

Both independently found that the countdown always restored ordinary race mode,
even after Demo was selected, thereby turning the demo controller back off.
They also made track-following or lap-detection changes, so the countdown fix is
not yet a single-variable causal result. The matched replications and surgical
ablation decide that.

The provisional capability claim is deliberately narrow: restricting
observation accumulation let Qwen remain productive long enough to repair a
failed core loop. It did not make the game visually polished or real-time
smooth.

## The public Gauntlet result is compatible with test-time-compute research,
but not equivalent to it

Recent agentic-coding research frames long-horizon scaling as a problem of
representing, selecting, and reusing rollout experience—not merely running more
agents. That matches this experiment's early contrast:

- raw same-context continuation accumulated low-signal screenshots and hit a
  hard image ceiling;
- compact fresh roles could inspect a bounded artifact;
- critic prose alone was unreliable;
- independent execution evidence separated a real completion from a
  self-certified failure.

The `Thinking Longer, Not Larger` paper reports a 32B SWE-Reasoner improvement
from 37.6% to 46.0% with external test-time compute, but uses task-specific
training, reward/search machinery, and SWE-bench verification. It is evidence
that small-model TTC can work, not evidence that a generic Gauntlet prompt must
work here.

CodeMonkeys likewise scales both serial iterations and parallel candidates, but
spends substantial compute on candidate selection. Its published result
reinforces a key distinction for the final report: generation count is not the
mechanism; grounded selection is.

The experiment's false-positive model-authored browser test also mirrors a
published warning. `Thinking Longer, Not Larger` reports that execution-only
selection can degrade at higher budgets due to false positives, while a 2026
empirical study finds that more agent-written tests alone does not
significantly improve resolution. Our evaluator therefore remains
controller-authored, frozen, and independent of the scoring model.

## A duplicated simulator can be worse than no test

In the arena text-first repair, Qwen found a real demo-state transition bug and
made plausible implementation edits. It then wrote a separate JavaScript
simulation of selected game rules. The simulator reported all enemies destroyed
at 18.27 seconds and certified the repair. It did not execute the Three.js game,
its collision/update ordering, or its actual UI path.

This is a stronger verifier failure than a trivial assertion bug. The model
constructed a small, internally consistent world in which its proposed repair
worked. It then optimized confidence against that world. A fallback in the real
source also mapped both timeout branches to `WON`, showing pressure toward the
requested outcome rather than preservation of the intended combat contract.

The implication is not “never let a small model write tests.” It is narrower:
for interactive systems, do not accept a verifier that reimplements the
mechanism under test. Prefer black-box browser actions, visible state, and
independent traces. Preserve the action ledger because an evaluator can also
take the wrong UI path; in our first arena evaluator, an overlay blocked Demo,
the fallback clicked Start Game, and the run therefore did not test Demo at all.

## Qwen-only fan-out improved breadth but not end-to-end reliability

The same Qwen-authored three-task plan was executed sequentially and with Pi's
Qwen-only worker subagents.

- Sequential: about 737k provider-reported tokens and 13.25 minutes; two of
  three planned changes implemented; clean agent exit; external kart completion.
- Parallel: about 198k parent-session tokens and 4.3 minutes, excluding
  unreported child usage; all three changes integrated; external kart
  completion; parent self-terminated while restarting its test server because
  `pkill -f serve` matched its own active command.

The parallel parent first requested a nonexistent `qwen` role, received the
available role names, and recovered to `worker`. This demonstrates useful
tool-feedback adaptation. It also demonstrates why “all tasks landed” and “the
agent completed reliably” are different dependent variables.

## A generic visual pass was more likely to regress than polish

Four matched 25-minute passes started from the same verified completing kart
parent: two vanilla Pi arms and two arms with the same two pinned public
Three.js skills.

- Both vanilla arms ended at the wall limit with truncated JavaScript. Their
  title screens rendered, but `startR` was undefined and Demo could not start.
- One skill arm ended on the model API's image limit after reading ten inherited
  screenshots plus new captures. Its frozen source still completed in the
  external browser gate, but visual inspection found overexposure and dense,
  repetitive barrier clutter rather than a clear polish gain.
- The other skill arm ended at the wall limit with an unexpected-token error
  and an undefined `startR`.

The skill treatment therefore preserved one of two functional artifacts versus
zero of two for vanilla, but did not establish a visual-quality improvement.
The surviving skill arm really did read both skill files; this is not merely a
label. A follow-up matched pair combines the public skills with the previously
useful text-first observation budget and forbids reading inherited images.

## Transfer did not clear the preregistered system gate

Changing only the short brief produced visibly distinct kart, arena, and
platformer artifacts, which is evidence of generative breadth. Functional
transfer remained weak:

- one of two kart baselines completed;
- neither arena baseline completed;
- neither platformer baseline completed;
- one generic text-first repair per failed arena/platformer seed still produced
  no accepted completion.

Observed failure classes included unresolved bare imports, a persistent loading
screen, a Vite overlay after a nominal clean agent exit, and one platformer
whose partial JavaScript appeared as page text. The current evidence therefore
does not support the claim that a human can swap a short brief and reliably get
a different game of similar functional quality.

## A short grounded critic found what million-token builders missed

A fresh read-only Qwen critic inspected the failed arena's real browser
evidence and source. In about 42,000 provider-reported tokens it identified a
specific ordering bug: the Demo path called `fireBullet()` before updating the
aim vector toward the nearest enemy. Every scheduled shot therefore used the
stale default/mouse direction, matching the observed `ENEMIES: 3`, `SCORE: 0`
trace.

This is a promising instance of useful test-time compute because the diagnosis
is source-grounded, predicts the external trace, and was produced by Qwen
rather than supplied by the operator. A fresh Qwen builder is testing that
verdict with an explicit no-forced-win/no-duplicate-simulator constraint. The
repair only counts if the independent browser Demo path confirms enemy
progression and completion.

## Grounded handoffs can transfer, but “fixed” is not binary

The first arena critic/builder handoff passed the independent state gate: enemy
count fell 3 → 2 → 0, score rose 0 → 100 → 300, and the game displayed
`YOU WIN`. The inherited source still contained a bad timer fallback, but the
accepted trace reached the real zero-enemy state before relying on it.

A fresh arena transfer run also passed after a short critic identified a
different causal blocker: Vite could not resolve the bare `three` import. The
builder used a direct pinned CDN module, implemented the required Demo URL
entry path, and tested the live browser. The external frames show 3 drones and
score 0, then 1 drone and score 1000, then 0 drones and score 2500 with
`ARENA CLEARED`.

The analogous platformer handoff is a partial, not a pass. Installing the
missing dependency changed a dead Vite overlay into a rendered, console-clean
course whose Demo eventually reached checkpoint 1/3. It never reached 3/3.
The builder's own “checkpoint 1/3” self-report was directionally accurate but
insufficient as a completion claim.

The narrow replication claim is now plausible: a short, source-and-evidence
grounded Qwen critic can improve the next Qwen builder's causal focus. It does
not guarantee a complete repair, and it works best when the diagnosed blocker
fully explains the external failure.

## The independent evaluator also needs auditing

Objective-browser v2 failed to count `ARENA CLEARED` as a completion phrase
even though its own screenshots and DOM recorded real drone and score
progression. Version 3 adds only generic `arena/level/stage cleared` phrases,
keeps the old evidence frozen, and records the change in the evaluator
changelog.

This is not a reason to trust agent self-report instead. It is evidence for
triangulation: source, action ledger, state trace, screenshots, and parser
output can each catch a different failure and can each be wrong in isolation.

## Making public skills available did not improve the second matched run

A second plain-versus-skill pair started from the exact same completing kart
parent, used the same text-first prompt and 20-minute budget, and differed only
in whether a pinned public five-skill Three.js/game-development pack was
available.

Both arms timed out while still working, but both preserved real Demo
completion with five distinct screenshots and no browser or page errors:

| arm | completion time | callback fps | provider tokens |
| --- | ---: | ---: | ---: |
| plain | 14.88 s | 9.4 | 2,718,333 |
| skill pack available | 17.92 s | 8.3 | 2,744,503 |

The skill arm read only `threejs-materials-lighting` and `game-feel`; it did
not read the installed scene-setup, physics-tuning, or camera-system files.
Availability is therefore the treatment, not faithful execution of every
document. Visual review found a dense forest of repeated blue barrier blocks,
overexposure, and giant foreground/overhead geometry. The plain arm was also
washed out and frequently off track, but was less cluttered, finished sooner,
and retained slightly better cadence. This matched result does not support a
public-skill visual or performance benefit.

Both Qwen arms independently attempted the prompt's generic wheel-motion
request. The plain arm changed the wheel-group spin sign; the skill arm instead
incremented each already-reoriented wheel child's Euler Z component. Fixed-step
footage is still needed to judge the visible sign and axle behavior; source
comments are not treated as proof.

## A blind motion critic found a real reset bug but missed the wheel defect

A fresh read-only Qwen critic received the functionally completing but
human-flagged “wonky” kart, five frozen frames, source, and a generic
motion-coherence checklist. It was not told about wheels.

In 100,991 provider-reported tokens it diagnosed a real post-race reset defect:
`checkLap()` assigns `GM='finished'`, while `updateKart()` returns before the
`KeyR` branch whenever the mode is not racing or Demo. The before/after-reset
screenshots were byte-identical. The critic proposed moving post-finish reset
handling outside the guard.

It did not identify the known wheel-axis/sign issue. This is simultaneously a
useful grounded diagnosis and a miss on the target visual pathology. A fresh
builder now receives only that Qwen-authored verdict. Success can establish
repair of reset behavior, not general motion polish.

## Some motion defects are not identifiable from screenshots

An ordered 4 Hz contact sheet from the existing fixed-step kart footage makes
barrier penetration, off-track travel, and camera/track discontinuities
obvious. It does not make wheel-spin sign obvious. The chase camera sees mostly
the rear of nearly symmetric, untextured low-poly tires; rotation about the
axle often produces little or no discriminating pixel change.

That is an evaluator limitation, not evidence that the wheel motion is correct.
It also sharpens the lesson from the public backwards-weapon example:
visual critics can only score properties made identifiable by their views.
Ordered frames improve temporal evidence, but viewpoint, geometry, and visual
markers still matter. The final motion table therefore permits
`not observable` instead of forcing a pass/fail from weak pixels, and keeps
source-axis reasoning separate from visible-motion claims.

That fresh builder made one game-source edit and two private test files in a
446,042-token, 2.75-minute session. The independent v3 replay still completed
the Demo race at 8.96 seconds, then pressed `R` and observed live `LAP 0/1`,
time 3.52, rather than the frozen results screen. There were no page or console
errors. This is an accepted, narrowly causal critic→builder repair: Qwen found
and fixed reset reachability. It remains a miss on the human-identified wheel
motion defect and is not counted as visual polish.

## BF16 did not rescue the ordinary empty-workspace baseline

Two fresh official-BF16 agents received the exact original prompt and external
browser path used by the production-INT4 baselines. Both Pi wrappers exited
zero after the model stopped at its output-length boundary, but neither passed
the microgame gate.

- BF16 seed 1 rendered a visually richer but highly saturated track. It
  advanced to `LAP 1/1` while the kart remained stationary on the start line
  and never displayed a valid finish state. The checkpoint loop can accept
  successive nearby checkpoints in one update, creating a false lap.
- BF16 seed 2 ended behind Vite's unresolved bare `three` import overlay.

The external parser recorded zero completion signals for both. Seed 1 is a
narrow boot-clean artifact; seed 2 is not. Compared with the 12-run INT4
baseline's one boot-clean and zero completing artifacts, 1/2 boot-clean is an
interesting descriptive difference but far too small and differently sampled
to establish a precision effect. The matched conclusion is only that official
BF16 produced no valid one-shot game in two attempts and retained the same
verification and dependency failure classes.

## The text-first effect replicated, but only half the time

Eight additional production-INT4 builders received the same frozen weak parent,
the same 20-minute budget, and the same simple text-first repair prompt. Four
eventually reached a real completion state and four did not. Two passes arrived
after the evaluator's 30-second text-sampling window but before its frozen
45-second final DOM/frame; they are retained as late passes and as parser-window
misses rather than silently rewritten results.

Combined with the original matched pair, the text-first condition completed
5/10 runs (Wilson 95% interval 23.7–76.3%). The empty-workspace one-shot
baseline completed 0/12 (Wilson 95% interval 0–24.3%). These are different task
conditions—a repair from a booting parent versus generation from empty—so this
is not a direct causal precision comparison. It does establish that the first
success was not a one-seed miracle and that the reliability scaffold remained
far from deterministic.

## Official BF16 did not rescue the matched repair either

Two official-BF16 builders received the same frozen text-first repair condition.
One ran for 30 minutes and the other exited cleanly; together they used about
2.88 million provider-reported tokens. Both remained at `LAP 0/1` with zero
completion signals and no browser exception.

The matched descriptive result is therefore INT4 5/10 versus BF16 0/2. The
samples are unbalanced and too small for a universal precision claim. Within
this time box, allocating four RTX 3090s to one BF16 agent reduced parallel
search breadth without eliminating the dominant software-state mistakes.

## Temporal evidence plus critic diversity exposed the wheel-axis bug

Four fresh Qwen critics received the same source and ordered fixed-step frames,
with no prompt hint about wheels or axes. Two plain critics disagreed: one
correctly noticed axle wobble but proposed `rotation.x`, while the other
prioritized a plausible camera-heading mismatch. Both critics in the
public-skill-available condition independently proposed `rotation.y`.

The operator then executed the installed Three.js Euler/vector math. Only
`rotation.y` preserved the transformed axle while moving a perpendicular tread
reference. Accumulating the current `rotation.z` moved the axle and therefore
predicted the observed wobble; `rotation.x` was also wrong.

This is a stronger “A-ha” than a prettier screenshot:

- ordered temporal evidence revealed a defect the functional gate missed;
- multiple Qwen critics produced useful but conflicting mechanisms;
- a tiny executable check selected a correct Qwen-authored diagnosis;
- the result does not prove a public-skill benefit.

The skill caveat matters. Neither skill-condition trajectory actually opened
the full `SKILL.md`, so 2/2 versus 0/2 is only a tiny descriptive correlation.
Availability metadata, stochastic critic diversity, or both may explain it.
The reusable method is critic diversity plus cheap mechanism checks, not a
claim that a skill file made Qwen smarter.

A fresh Qwen builder received only one of the correct Qwen critic reports. It
made exactly one game-source edit, changing the accumulated wheel component
from Z to Y and the critic-suggested rate from 2.5 to 2.86. The independent
replay preserved completion at 17.98 simulated seconds with zero page or
console errors. The parent's post-finish reset-overlay defect remained. This is
an accepted narrow axis/mechanism repair, not a claim of complete motion polish
or visually proven spin direction.

The BF16 runs took 16.3 and 20.7 minutes and consumed 774,253 and 2,017,522
provider-reported tokens, respectively. A further exact-prompt matched repair
pair is justified because INT4's text-first condition had a mixed 1/2 result;
that comparison can test reliability without claiming broad model superiority.

## Text-first transfer from repair to generation was weak

Eight preregistered empty-workspace INT4 builders received the original
reasonable game brief plus one reusable sentence: inspect text, files, and
browser errors before spending screenshots. Every arm ran for the fixed
20-minute cap in a fresh VM.

- 6/8 were boot-clean;
- 0/8 reached the corrected externally verified Demo completion gate;
- the Wilson 95% interval for completion is 0–32.4%;
- two arms retained browser errors;
- the eight builder sessions reported about 9.29 million tokens in aggregate.

This follow-up is historically compared with the original 0/12 empty-workspace
baseline, not randomized concurrently with it. The same observation-budget
sentence therefore produced no accepted generation signal, despite improving
boot cleanliness descriptively. It was much less reliable for generation
(0/8) than for repair from a booting parent (5/10). Compact observation
management appears to help Qwen stay productive; it does not supply the missing
decomposition, state design, and verification needed for dependable greenfield
construction.

The excluded first launch remains in the record. Its guests could not reach
inference because containment rejected the laptop-resolved private route.
Eight zero-source `Connection error` sessions were frozen as harness failures.
A one-guest connectivity probe then found a managed-hosts overwrite before any
replacement scored task ran. Only after a narrow loopback TLS pass-through and
guest-host mapping passed an authenticated no-tools probe were the eight scored
arms launched.

## A blind Qwen critic caught the controller evaluator's false positive

Fresh read-only Qwen critics saw source plus five ordered screenshots, but not
the objective-browser JSON or external label. Their corrected predictions were
7/8 accurate, with TP=0, FP=1, FN=0, and TN=7. Pass precision was zero and
recall was undefined because no generation arm passed.

The critics were excellent at obvious dead games: frozen countdowns, a Vite
overlay, missing Demo input, and a black/erroring viewport. The two harder cases
show why confidence alone is not the deciding evidence:

- seed 1 was labeled PASS at 92% because source-level physics suggested
  continuous throttle should complete in roughly 43 seconds; the independent
  browser trace showed no completion;
- seed 5 was labeled FAIL at 95%. The frozen text evaluator initially called it
  a pass because `RACE COMPLETE!` existed in an opacity-zero results screen
  from the initial menu onward. A read-only post-hoc audit found no visible
  completion, `kartFinished=false`, and the game still racing at 45.16 seconds.
  The builder's own longer test finished at about 46.3 seconds. Qwen was right;
  the controller evaluator was wrong.

The Qwen critic did not see the flawed completion count, so it did not merely
echo a correction. This is a concrete case where same-model artifact review
improved experimental validity. It does not justify trusting critics blindly:
seed 1 remained a 92%-confidence false positive. The reusable method is mutual
audit plus executable state/visibility checks.

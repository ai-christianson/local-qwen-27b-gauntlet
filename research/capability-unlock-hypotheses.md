# Qwen 27B capability-unlock hypotheses

These are preregistered observations to test, not retrospective explanations.
An item becomes a finding only if the matched artifacts and gates support it.

## H1 — action interface, not only model size

Early one-shot trajectories show Qwen detecting some of its own syntax errors
and attempting repairs, while also making very large single-file writes that can
hit tool/output limits. The bottleneck may partly be translating an adequate
plan through a brittle action interface.

Test signal:

- frequency and size of write/edit calls;
- tool-error rate;
- whether an ordinary “single highest-value improvement” round converges without
  implementation hints;
- whether the same source repair succeeds when expressed through smaller native
  edits chosen by Qwen itself.

The operator will not instruct Qwen to split a particular file after observing
the failure in a scored arm. That would turn the hypothesis into coaching.

## H2 — fresh context can be more valuable than longer context

Long coding trajectories accumulate source dumps, failed writes, command output,
and stale plans. A fresh artifact-grounded critic and fresh repair builder may
spend fewer tokens reconstructing state and avoid conversational anchoring.

Test signal:

- matched output quality and regression gates;
- prompt/input tokens per accepted improvement;
- wall time and tool errors;
- whether the fresh critic identifies a gap the original context missed;
- whether the repair builder can implement the verdict without access to critic
  rationale beyond the published JSON.

## H3 — external evidence creates the useful test-time-compute loop

Same-model reflection alone may simply repeat blind spots. Screenshots, browser
errors, deterministic inputs, and executable gates may turn more inference into
real correction.

Test signal:

- self-improvement versus grounded critic/repair under matched budgets;
- accepted changes after regression tests;
- gap between critic prose and verified behavior;
- visual improvements that do not conceal control/completion regressions.

## H4 — sequential specialization may beat parallel fan-out on coupled code

Multiple Qwen workers editing one small game concurrently may collide. Pi's
official subagent extension may work better as worker → reviewer → worker than
as several simultaneous implementers. Parallel read-only scouts/critics may
still use idle inference safely.

Test signal:

- parent/child token use and tool conflicts;
- merge or overwrite failures;
- verified score gain per token;
- GPU duty-cycle smoothness;
- sequential versus parallel child tasks when time allows.

## H5 — quantization may affect tool reliability more than taste

BF16 may not make the game dramatically prettier, but it may improve syntax,
tool-call validity, error recovery, state tracking, and adherence to bounded
instructions. The paired subset will therefore score process reliability as
well as the final frame.

Test signal:

- malformed/failed tool calls;
- first-pass boot rate;
- completion gate;
- repair acceptance rate;
- token and wall-time multiplier;
- blinded visual score with uncertainty.

## H6 — simple prompts plus a strong environment may be the sweet spot

The experiment intentionally avoids answer-shaped prompts. If Qwen performs
well, the useful recipe may be a compact product goal, a contained tool-rich
environment, deterministic evidence, fresh role boundaries, and regression
gates—not a giant meta-prompt.

Failure is informative too: if these conditions do not help, a 27B model may
need task decomposition or verifier capabilities that are not inherent to the
vanilla setup.

## H7 — a real unlock should transfer when the brief changes

A kart-only success can be luck, prompt overfit, or repair of one local bug. A
reusable harness/model capability should survive an ordinary change of product
brief.

Test signal:

- identical stack and prompt skeleton across kart, arena, and platformer
  microgames;
- two independent seeds per genre;
- clean boot and independent completion in at least two genres;
- similar functional and visual quality without game-specific operator fixes;
- the same visual-quality prompt producing coherent improvements across
  advancing genres;
- any public skill-pack gain reported separately from the no-skill baseline.

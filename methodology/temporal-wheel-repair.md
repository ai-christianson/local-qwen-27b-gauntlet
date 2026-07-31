# Temporal wheel repair

Frozen at 2026-07-31 01:42 ET, before the builder was launched.

## Question

Can a fresh Qwen builder turn a correct, independently selected Qwen critic
report into the intended narrow repair without regressing the deterministic
game path?

## Design

- Fresh disposable server VM and fresh Pi session.
- Production INT4 Qwen3.6-27B through Routerd.
- Exact Pi coding agent 0.83.0.
- Parent source is the unchanged kart artifact audited by all four temporal
  critics.
- The builder receives only the selected Qwen critic report and a neutral
  fixed-step manifest. It does not receive the operator's executable
  adjudication.
- Exact prompt: `prompts/41-grounded-motion-repair.txt`.
- Wall limit: 600 seconds.
- Maximum four new screenshots.
- External post-run scoring checks the source change, browser completion,
  reset path, console/runtime errors, and the frozen wheel-axis math.

Frozen input hashes:

- parent:
  `021e043c1a37de7dca0bc0e7cee45e4506f0e2d549c3d1cd58b415095b955386`
- Qwen-report review bundle:
  `f7b1dc53b77b5b37f1cc87a86e2654ab03dd183515ccff7c5e3681faa528ab33`

Selecting the report is part of the loop, but authorship remains separable:
Qwen authored the diagnosis and Qwen performs any source edit; the operator
only runs the previously frozen executable mechanism check and external
regression gates.

## Outcome

The first launcher attempt failed before any model response because the new VM
was missing the already-declared DNS preload file. It made no source mutation
and is excluded as a harness setup failure. The file was copied unchanged from
the matched VM image and the fresh Pi session was relaunched as r1a.

R1a exited cleanly after 4.49 minutes and 493,955 provider-reported tokens. Its
trajectory contains exactly one game-source mutation:

```diff
-var wheelRPM=KS.spd*dt*2.5;
-kw.forEach(function(wg){wg.children.forEach(function(c){c.rotation.z+=wheelRPM;});});
+var wheelRPM=KS.spd*dt*2.86;
+kw.forEach(function(wg){wg.children.forEach(function(c){c.rotation.y+=wheelRPM;});});
```

The fresh builder therefore implemented the selected Qwen report without an
operator translation. The independent browser replay preserved real
completion at 17.98 simulated seconds, recorded 25 completion samples, five
distinct screenshots, and zero page or console errors.

The post-finish reset overlay still remained visible. That defect was present
in the frozen parent and is not a regression from this one-bug treatment; a
separate earlier Qwen critic/builder arm repaired reset reachability on its own
parent. This arm is accepted only as a narrow wheel-axis/mechanism repair. The
untextured symmetric tire still makes spin sign difficult to judge visually,
so no claim of complete motion polish is made.

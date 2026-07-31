# Public source index

Captured 2026-07-30. This file stores links and observations, not redistributed
source videos.

## Gauntlet trend

- Matt Shumer, Gauntlet definition:
  https://x.com/mattshumer_/status/2081830214384886228
- Matt Shumer, short guide:
  https://somethingbig.ai/gauntlet-loop
- Original minimal game prompt:
  https://x.com/mattshumer_/status/2081100592689324502
- Claude of Duty repository:
  https://github.com/mshumer/Claude-of-Duty
- Kart Royale thread:
  https://x.com/Ryancampbell/status/2082885367720742915
- Kart Royale repository:
  https://github.com/ryancampbell/kart-royale
- 51-hour DeCarlo game:
  https://x.com/MrInReality1/status/2082288540201718179
- DeCarlo repository:
  https://github.com/scalabled/decarlo-boyz
- Browser FPS critic missed reversed weapon:
  https://x.com/rubenmarcus_dev/status/2082493626735591565
- First-pass visual critic approved broken UI:
  https://x.com/Harshvikram14/status/2082470021650072054
- Qwen3.8 Max Preview kart demo, hosted model:
  https://x.com/HaaaaaaydenH/status/2082481794503573973
- Local Qwen 27B BF16 voxel scene on 4×3090:
  https://x.com/gabu3d_pl/status/2082579851005862306

## Relevant research

- Self-Refine: https://arxiv.org/abs/2303.17651
- Reflexion: https://arxiv.org/abs/2303.11366
- Large Language Models Cannot Self-Correct Reasoning Yet:
  https://arxiv.org/abs/2310.01798
- Scaling Test-time Compute for LLM Agents:
  https://arxiv.org/abs/2506.12928
- Scaling Test-Time Compute for Agentic Coding:
  https://arxiv.org/abs/2604.16529
- Thinking Longer, Not Larger: Enhancing Software Engineering Agents via
  Scaling Test-Time Compute:
  https://arxiv.org/abs/2503.23803
- CodeMonkeys: Scaling Test-Time Compute for Software Engineering:
  https://arxiv.org/abs/2501.14723
- Rethinking the Value of Agent-Generated Tests for LLM-Based Software
  Engineering Agents:
  https://arxiv.org/abs/2602.07900
- Code Generation by Differential Test Time Scaling:
  https://arxiv.org/abs/2605.20473
- Small Language Models Need Strong Verifiers:
  https://arxiv.org/abs/2404.17140
- Small Language Model Can Self-correct:
  https://arxiv.org/abs/2401.07301
- Evaluators favor their own generations:
  https://arxiv.org/abs/2404.13076

## Pi implementation references

- Official Pi compaction and branch-summarization documentation:
  https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/compaction.md
- Public `pi-gauntlet` package metadata:
  https://www.npmjs.com/package/pi-gauntlet
- Public `pi-cohort` package metadata:
  https://www.npmjs.com/package/pi-cohort

## Public game-development guidance

- Pinned Apache-2.0 game-agent skill collection used for the second matched
  treatment:
  https://github.com/gamedev-skills/awesome-gamedev-agent-skills/tree/01b3eb41b359a6386e7d27c8a704baaa2a2fcfd9
- Pinned MIT Three.js skill collection used for the first matched treatment:
  https://github.com/majidmanzarpour/threejs-game-skills/tree/7221c1
- Official Three.js game-architecture guide:
  https://threejs.org/manual/en/game.html
- Official `CylinderGeometry` documentation:
  https://threejs.org/docs/pages/CylinderGeometry.html
- Official `Object3D` local-axis rotation documentation:
  https://threejs.org/docs/pages/Object3D.html

The official Three.js documentation reinforces the motion rubric rather than
providing a kart-specific recipe. `CylinderGeometry` has a local height/axle
axis established by its geometry, while `Object3D.rotateX/Y/Z` operates in
local space. A wheel whose geometry is first reoriented must therefore animate
about the resulting axle, not an unrelated world-looking Euler component. The
official game guide also clamps large frame deltas and updates animation from
elapsed time, supporting the experiment's frame-rate-independence checks.

A search index still exposes a deleted OpenAI `develop-web-game` skill page,
but the current repository `HEAD` was independently resolved to
`49f948faa9258a0c61caceaf225e179651397431` and the raw path returns HTTP 404.
It was not installed or represented as current.

## Research synthesis frozen before execution

The trend is real, but “AAA game” is a social shorthand. The strongest public
repositories honestly land closer to an ambitious indie prototype. Their most
important finding is methodological: screenshots and many parallel agents can
produce apparent progress while hiding broken controls, dead rendering paths,
frame stalls, black frames, and nonfunctional mobile/network behavior.

Claude of Duty improved most when one sequential owner repaired coupled systems;
parallel fan-out had made rendering defects worse. Kart Royale's screenshot
critics missed inverted steering, missing mobile behavior, black frames, a pause
deadlock, and a phone crash. Two of its instruments reported false reassurance.
DeCarlo demonstrates how enormous token/agent counts can buy breadth without
commensurate finish.

The research literature similarly supports extra test-time compute only when
selection is grounded. Intrinsic self-correction can stagnate or degrade, and a
same-model critic can share preferences and blind spots with its builder.
External execution, deterministic evidence, differential tests, compact fresh
contexts, and regression-aware selection are the plausible mechanism—not the
word “critic” by itself.

## Direct X audit

Re-read from the public X pages in the in-app browser on 2026-07-30 between
23:46 and 23:52 ET after the official archive-search API repeatedly returned a
transport error and the structured post snapshots remained pending.

- Shumer's definition says the *agent*, rather than the human, decomposes the
  goal, assigns specialist builders and fresh blind critics, and asks the critic
  to pass only when the artifact beats a real-world reference. The post was
  dated 2026-07-27 and displayed about 215,600 views at capture time.
- The original FPS post exposes a long, answer-shaped orchestration prompt. It
  asks for recent-Call-of-Duty quality, repeated `/loop` passes, fan-out,
  `ultracode`, harsh visual critics, and blind side-by-side comparison. It was
  not a casual one-line brief.
- Ryan Campbell's Kart Royale disclosure reports 127 agents across 11 rounds,
  60,500 TypeScript lines, no external art assets, 13 test harnesses, and a
  disclosed blind score of 62/100. The post itself says the remaining gap is
  hand-authored art and calls judging quality the hard part.
- A browser-FPS follow-on reports that its screenshot critic approved lighting,
  materials, and proportions while the weapon remained backwards because
  orientation was absent from the critic rubric. This directly motivates the
  generic motion-coherence checks in this experiment.
- Another follow-on reports that a GPT-5.6-Sol UI critic approved every design
  in its first pass even though the author judged the result poor. This is
  useful evidence that “critic” is not automatically a verifier, even with a
  stronger model.
- A hosted Qwen 3.8 Max Preview follow-on reports an uninterrupted six-hour
  Qoder run from one human prompt. It is adjacent evidence, not a local-27B or
  Pi result.
- A separate post shows a voxel island attributed to Qwen 27B BF16 on four RTX
  3090s through OMP. It is the closest public local-hardware analogue found, but
  does not publish a comparable prompt, trajectory, or executable gate.

Additional adjacent local-model context:

- https://x.com/0xSero/status/2039079119510552830 — a multi-GPU local-model
  compression effort mentioning eight RTX 3090s and a Qwen 27B target.
- https://x.com/drivelinekyle/status/2038673905368650194 — an independent
  report that Qwen3.5-27B tool calling was strong on an RTX-3090 inference
  machine after parameter tuning.

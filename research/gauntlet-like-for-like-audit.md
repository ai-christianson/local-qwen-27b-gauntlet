# Gauntlet-loop like-for-like audit

Last updated: 2026-07-30 22:50 ET.

This is an evidence audit, not a debunk. The viral result contains real and
technically interesting work; the headline is also much easier to misread than
the public repository.

## What the original public result actually used

Matt Shumer's published prompt is 941 bytes, but it is not an ordinary
one-sentence game brief. It explicitly asks for:

- a modern Call of Duty quality target and repeated “utterly perfect” language;
- fan-out to specialist subagents;
- a separate harsh visual critic per item;
- repeated `/loop` execution;
- blind side-by-side comparisons against the commercial reference;
- `ultracode`.

Source: [the exact public prompt](https://github.com/mshumer/Claude-of-Duty/blob/main/prompt.md).

Contemporaneous public replies identify the stack as Claude Code, Opus 5,
Ultracode, a fresh harness, and zero skills or MCPs. Shumer also says skills hurt
Opus 5's creativity and that he stopped the loop to avoid consuming more usage
limits. These replies are currently discoverable through an X mirror because
the unauthenticated X search page blocks result access:
[profile snapshot](https://site.twstalker.com/mattshumer_/).

“One-shot” therefore appears to mean one human prompt that launched a large
agentic workflow, not one model response or one implementation pass.

## The new `pi-gauntlet` package is a different, later system

There is now a package literally named `pi-gauntlet`, but it should not be
retrofitted into the viral result. npm reports version 4.6.0 published on
2026-07-30, after the public game posts under study. A no-script package audit
of tarball SHA-256
`a58336bacb065c214b1ae075fa41768236e643da2a8a8c5e5df4a1ef6f473a85`
found:

- 13 workflow skills and 7 reviewer/implementer/spec personas;
- three enforcement extensions;
- a required `pi-cohort` dispatch dependency;
- a gated brainstorm → plan → implement → verify → ship process;
- explicit human approval of the spec and final landing decision;
- a postinstall script that copies or links personas into Pi discovery paths.

Source: [`pi-gauntlet` repository](https://github.com/jjuraszek/pi-gauntlet)
and [npm package](https://www.npmjs.com/package/pi-gauntlet).

That is an interesting contemporary Pi-native workflow, not “the Gauntlet loop”
as a standardized benchmark. It also is not a drop-in autonomous overnight
mode: its own documentation requires two human gates and says its process
overhead is inappropriate for throwaway spikes or one-line fixes.

The primary no-skill arms therefore do not install it. A future separately
labeled treatment could test it after containment review and human
availability, but silently adding its 13 skills, personas, phase gates, and
review logic would destroy the like-for-like baseline.

## What is genuinely impressive

The public repository is substantial:

- about 55,000 lines across 11 code-owned subsystems;
- no external art assets; procedural meshes, textures, animation, and audio;
- a written architecture contract for subsystem ownership and events;
- fixed-step deterministic gameplay primitives;
- GPU-backed named-shot capture, isolated reproducible baselines, pixel-diff
  gates, scripted playtesting, and a frame-time profiler;
- candid documentation of false measurements, critic failures, and remaining
  defects.

Source: [Claude-of-Duty repository](https://github.com/mshumer/Claude-of-Duty).

This is real evidence that long-horizon orchestration can elicit a large,
coherent artifact from a frontier model. It is not evidence that the output
matches a commercial AAA game.

## What the hero clip/headline does not show

The repository's own honest assessment says:

- all blind critics chose real Call of Duty in every comparison;
- scores improved from 3.59 to 5.05 out of 10, with most frames still rated
  “AMATEUR”;
- real gameplay initially ran at 12–17 fps on the tested Apple laptop and
  reached 28–30 fps after a dedicated optimization pass;
- the shipped renderer still had a known lighting imbalance and compromised
  materials;
- only two Git commits exist: the code snapshot and a later README link update.

The repository preserves the final code and prompt, but not the raw model
trajectories, request count, token total, wall-clock chronology, intermediate
artifacts, operator messages, or rejected captures. Those quantities therefore
cannot be reconstructed from Git history alone.

Source: [README performance, process, and honest-assessment sections](https://github.com/mshumer/Claude-of-Duty#readme)
and [public commit history](https://github.com/mshumer/Claude-of-Duty/commits/main).

## The most useful disclosed negative result

The final repository says three parallel rounds of six directory-owning agents
improved the critic score by only 0.46 while coupled visual defects remained or
worsened. One sequential owner per coupled concern then improved the score by
1.00 and reduced defects from 66 to 26.

It also reports that repeated critics called the weapon “untextured,” while
measurement showed specular domination; following the critics had crushed
albedo and made the problem worse. The useful repair contradicted the critic.

This strongly motivates two preregistered treatments here:

1. parallel specialists;
2. sequential fresh owners with the same total budget.

It also supports executable/measurement gates over same-model aesthetic
self-approval.

## Replication caveats visible in public follow-ons

Public replications are heterogeneous:

- one 3D-platformer author reports three five-hour Opus windows, extra cleanup
  prompts, and manually halting an unfinished loop;
- a Three.js cab “replication” began from an existing Roblox game, a map
  generator, a procedural Blender tool, a Tripo GLB, and pre-existing Suno
  music, then switched from Opus to Sol when tokens ran out; multiplayer was
  ported but not tested;
- another platformer post exposed a short initial prompt but withheld model and
  engine details to DMs, making the visible clip non-reproducible.

Sources:

- [Claude Bandicoot disclosure and discussion](https://www.reddit.com/r/ClaudeAI/comments/1v9m76g/claude_bandicoot_shumers_gauntlet_loop_on_a_3d/)
- [Nutso CabO disclosure](https://www.reddit.com/r/aigamedev/comments/1vadv6u/ported_my_wip_roblox_cab_game_to_threejs_with_the/)
- [long-horizon platformer discussion](https://www.reddit.com/r/aigamedev/comments/1v9bqzx/ai_made_platformer_trying_long_horizon_prompting/)

These do not make the work fake. They mean “Gauntlet result” is not yet a
standardized treatment.

## Fair comparison policy for this experiment

We will not handicap Qwen by denying ordinary agentic techniques used by the
reference:

- fresh contexts;
- explicit task decomposition;
- specialist builders and blind critics;
- sequential passes;
- procedural assets;
- generic screenshot, profiler, and executable-test harnesses;
- long enough wall-clock time to use the available compute.

Every such technique is a named treatment. The one-shot baseline remains an
ordinary brief. We will not silently give Qwen game-specific fixes, select only
hero seeds, reuse external game code/assets, mix in stronger source-writing
models, or call offline 60-fps capture real-time performance.

The strongest system claim requires transfer: the same generic stack and prompt
skeleton must produce independently completing artifacts in at least two
different genres when a human changes only the short game brief.

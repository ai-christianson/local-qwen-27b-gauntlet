# Hierarchical transfer suite

Purpose: test whether the same Qwen/Pi system transfers across game briefs
instead of overfitting to one kart artifact or a prompt full of game-specific
fixes.

## Fixed elements

- Qwen3.6-27B INT4 through the same Routerd alias
- Pi coding agent 0.83.0
- fresh contained VM and empty workspace
- 30-minute wall-clock budget
- high thinking level
- built-in Pi tools only; no skills, web search, or external art
- procedural assets only
- at most eight screenshot results in the session
- visible deterministic Demo action that must reach a generic completion state
- identical boot/console/completion/cadence evidence harness

## Variable element

Only the short game brief changes:

1. one-lap kart circuit;
2. three-enemy arena combat;
3. three-checkpoint platforming course.

There are two independent seeds per brief at tier 1. A genre advances to an
improvement tier only when at least one artifact boots cleanly and reaches its
declared completion state under the generic evaluator. Transfer is considered
replicated only if at least two genres pass; one successful kart branch is not
enough.

The prompts are intentionally ordinary product briefs. Their common reliability
contract records a discovered interface constraint; it does not reveal
game-specific code or a known fix.

## Tier 2: matched visual-quality pass

Every advancing genre receives the exact same short visual-quality prompt. The
prompt asks for coherent retro art direction, lighting, atmosphere, materials
or simple shaders, particles, impact feedback, HUD polish, and correction of
obviously wrong motion. It does not specify implementation code.

Function and visuals remain separate gates:

- the original generic completion state must still be reached;
- browser errors and console errors must remain zero;
- reversed rotation, camera jumps, implausible steering, and animation
  discontinuities are recorded as motion-coherence defects;
- screenshots are scored for composition, lighting, materials, effects,
  readability, and stylistic coherence;
- real-time cadence is reported independently from deterministic offline
  frame-step footage.

A no-skill visual pass remains the control. A second, explicitly labeled
treatment may expose the already-audited public Three.js debugging/UI skill
pack to Pi under the same prompt and budget. Any benefit belongs to the
Qwen+Pi+public-skill system, not to bare Qwen, and does not replace the
no-skill result.

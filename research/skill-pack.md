# Declared public-skill treatment

This is a separate treatment arm. The vanilla baseline and ordinary
self-improvement arms do not see these files.

## Source

- Repository: <https://github.com/majidmanzarpour/threejs-game-skills>
- Frozen commit:
  `7221c1f4a6d2ae189a4d85d058d24f3228499d46`
- Commit date: 2026-07-16
- License: MIT; the upstream license is retained beside the vendored files.
- The controller read every included instruction/reference before use and
  scanned the selected files for network, credential, destructive, and
  shell-execution behavior.

## Included

- `threejs-debug-profiler`
- `threejs-game-ui-designer`

These are general debug, evidence, performance, interface, and responsive-layout
instructions. They do not contain a kart game, track implementation, networking
stack, generated assets, or a solution to this experiment.

## Deliberately excluded

- All generators, scaffolds, procedural-world recipes, gameplay-system
  templates, "AAA builder" material, audio/assets, and example game code.
- `threejs-qa-release`, because the experiment already supplies a matched
  external evidence harness and its packaged test hooks would blur that
  boundary.
- All `prompt-templates.md` files. The model gets the same frozen simple
  improvement prompt as the unassisted arm; it does not get an answer-shaped
  prompt from the skill repository.
- All provider-specific agent manifests. Pi discovers only the two ordinary
  `SKILL.md` packages.

## Matched comparison

The skill-assisted arm starts from the exact same frozen parent snapshot and
uses `prompts/10-self-improve.txt`, the same model, precision, thinking level,
wall-clock budget, browser evidence, and VM image as ordinary self-improvement.
The treatment difference is only the two installed public skills.

Skill use is not "vanilla Qwen intelligence." It is a legitimate
model-plus-tools condition and will be labeled that way in every table and
content claim. A win would show that a 27B model can productively use concise,
public, broadly reusable expert instructions—not that it invented those
instructions.


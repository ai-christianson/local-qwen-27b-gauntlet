# Temporal critic skill pair

Frozen at 2026-07-31 01:04 ET, before the ordered-frame captures or critic
outcomes were reviewed.

## Question

Does giving a fresh Qwen critic a pinned, public, generic Three.js debugging
skill improve its ability to identify motion-coherence defects from source plus
ordered gameplay frames?

## Design

- Two critics receive the plain Pi environment.
- Two critics receive the same environment plus the pinned
  `threejs-debug-profiler` skill from
  `majidmanzarpour/threejs-game-skills` commit `7221c1`.
- Every critic receives the same source, objective-browser trace,
  motion-coherence checklist, and the same ordered fixed-step frame subset.
- Every critic receives the exact text in
  `prompts/40-motion-evidence-audit.txt`.
- Critics are fresh-context, read-only, Qwen-only Pi sessions in separate
  disposable server VMs.
- Wall limit: 600 seconds.
- No prompt mentions wheels, rotation axes, barrier clipping, or a defect found
  by the operator.

The skill is an availability treatment. A critic may ignore it; actual skill
reads are measured from the Pi trajectory.

Frozen input hashes:

- source parent:
  `8d3c88c1cf9ccf65c6a3f80ebc612aee9fef8f5ed8e61521b3e9ced9ec3658cf`
- ordered-frame review bundle:
  `259dbd8a0e5513cc28ba8fbc2c70aeef40bdaf18262965e9c3c98bb97723bec1`
- debug-only public skill archive:
  `7a5b16b5b102dae35e8cb4eb7daf17e89bf2c8a22095bc50fabd3035ac16495b`

## Outcome

All four reports were frozen before adjudication:

| Arm | Tokens | Primary diagnosis | Proposed repair | Runtime verdict |
| --- | ---: | --- | --- | --- |
| plain r1 | 119,258 | wheel-axis mismatch | `rotation.x` | incorrect |
| plain r2 | — | camera uses a stale heading | align camera heading | plausible, different defect |
| skill-available r1 | — | wheel-axis mismatch | `rotation.y` | correct |
| skill-available r2 | — | wheel-axis mismatch | `rotation.y` | correct |

The operator then ran the installed Three.js Euler/vector math. Only
`rotation.y` preserved the transformed axle while moving a perpendicular
tread vector. Exact inputs and outputs are in
`metrics/wheel-axis-validation.json`.

This is diagnostic, not a new game-quality score. The descriptive result is
2/2 correct primary diagnoses in the skill-available condition versus 0/2 in
the plain condition. That tiny sample is not causal evidence for the skill:
neither skill-condition trajectory actually opened the full `SKILL.md`.
Availability metadata, stochastic critic diversity, or both may explain the
difference. The defensible finding is narrower: independent grounded critics
plus a cheap executable mechanism check exposed and resolved a real temporal
bug that single-frame browser gates had missed.

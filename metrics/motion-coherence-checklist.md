# Secondary motion-coherence audit

Frozen after the primary visual rubric. This is a diagnostic checklist, not a
retroactive replacement for the preregistered visual score.

For each selected gameplay clip, inspect at normal speed and frame by frame:

- wheel or prop angular velocity has the correct sign for vehicle motion;
- each wheel spins about its modeled axle, and left/right wheels agree on
  forward travel after accounting for mirrored geometry;
- front-wheel steer sign matches the change in travel direction;
- front-wheel steering changes heading without overwriting or compounding the
  wheel's rolling rotation;
- chassis forward vector, velocity vector, drift/yaw, and wheel pose agree;
- camera look direction and roll follow motion without jumps or inversion;
- track barriers do not visibly pass through the chassis or wheels;
- collisions and resets do not teleport or rotate the vehicle discontinuously;
- particles, skid marks, and impact effects originate at plausible contacts;
- deterministic Demo completion follows a visually plausible path rather than
  a hidden-state shortcut, stuck vehicle, or false-positive UI condition.

Record `pass`, `minor`, `major`, or `not observable` for each item. A functional
completion can coexist with major motion defects and must not be described as a
polished game.

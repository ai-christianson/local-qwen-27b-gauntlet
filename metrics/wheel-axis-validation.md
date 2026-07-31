# Wheel-axis runtime validation

The four frozen Qwen critic reports disagreed. Two critics in the
skill-available condition proposed `rotation.y`; one plain critic proposed
`rotation.x`; the other plain critic prioritized a camera-heading mismatch.

The operator resolved that disagreement by executing the actual installed
Three.js vector/Euler math, not by editing the game. For the existing
`rotation.x = Math.PI / 2` orientation and default `XYZ` Euler order:

| Accumulated component | Axle invariant? | Tread moves? | Verdict |
| --- | --- | --- | --- |
| `rotation.z` | No | Yes | Current wobble bug |
| `rotation.x` | No | No | Incorrect plain-critic repair |
| `rotation.y` | Yes | Yes | Correct axle spin |

The exact inputs and transformed vectors are frozen in
`wheel-axis-validation.json`.

This is a useful Gauntlet-loop result without pretending the loop is magic:
ordered temporal evidence let Qwen surface a hidden motion bug, independent
Qwen critics disagreed about the mechanism, and a tiny executable geometry
check selected a correct Qwen-authored diagnosis. The sample is only two
critics per condition, and neither skill-condition trajectory read the full
public `SKILL.md`, so it does **not** establish that the public skill caused the
better result.

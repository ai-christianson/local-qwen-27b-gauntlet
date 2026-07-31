# Public copy

Nothing in this file has been posted or staged. The final X video attachment is
`content/video/out/qwen-gauntlet-1080p60.mp4`.

## Recommended X standalone

Attach the final video.

```text
Qwen3.6-27B + Pi got a night on 24x3090s to try a "gauntlet loop."

0/12 one-shot. 5/10 text-first repair. the same trick went 0/8 greenfield—and Qwen caught a false positive in our evaluator.

it found + fixed real bugs. prompts, trajectories + video:
https://github.com/ai-christianson/local-qwen-27b-gauntlet
```

## X thread

Attach the final video to the first post and the temporal A-ha still to the
third post.

### Post 1

```text
we gave Qwen3.6-27B + Pi the night and 24x3090s to try the "gauntlet loop" thing.

the honest result: 0/12 one-shot games completed. a simple text-first repair condition got 5/10. the same trick went 0/8 from empty workspaces. BF16 went 0/2. no AAA game, no multiplayer.
```

### Post 2

```text
the repair scaffold was simple: inspect source and browser state first, then use a small image budget.

5/10 repair runs passed externally. that is not a matched causal estimate—and the same sentence went 0/8 on greenfield generation.
```

### Post 3

```text
the most surprising result: a blind Qwen critic caught a false positive in our evaluator.

hidden "RACE COMPLETE" text made our metric say 1/8. Qwen said FAIL at 95%. a visibility/state audit agreed: still racing at 45.16s. corrected result: 0/8.
```

### Post 4

```text
4 Qwen critics disagreed on wheel wobble. a six-line Three.js check selected the right axis; a fresh Qwen builder made one edit and kept completion.

prompts, failures, trajectories, source, metrics + 1080p60 offline video:
https://github.com/ai-christianson/local-qwen-27b-gauntlet
```

## Short-form caption

```text
Can a local 27B model survive the viral game-building "gauntlet"?

We gave Qwen3.6-27B, Pi 0.83 and a 24x3090 inference cluster the night. The one-shot result was 0/12. A simple text-first repair setup reached 5/10, but the same trick went 0/8 from empty workspaces. BF16 did not rescue it.

The game is not AAA. The interesting part is that several independent Qwen critics found different real bugs—and one correctly rejected a controller-evaluator false positive. A tiny executable check also let another Qwen agent make the right wheel-axis repair.

Full prompts, trajectories, failures, source and video are public.
```

## Suggested Hacker News title

```text
We tested Gauntlet-style game building with local Qwen 27B on 24 RTX 3090s
```

## Suggested repository description

```text
An honest one-night Qwen3.6-27B + Pi Gauntlet experiment: 0/12 one-shot, 5/10 text-first repairs, 0/8 greenfield transfer, BF16 comparison, raw trajectories, fixed-step 60 fps video, and every failure retained.
```

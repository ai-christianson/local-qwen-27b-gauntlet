# Fixed review bundle

This directory is mechanically copied evidence from `int4-baseline-s2`.

- `objective-browser.json`: fixed URL, start-button/Enter rule, fixed keyboard
  sequence, DOM timeline, console/page errors, screenshot hashes, and measured
  browser cadence.
- `objective-*.png`: lossless checkpoints at the registered times and after the
  reset probe.
- `gameplay-1080p60.ffprobe.json`: video container/frame metadata.
- `gameplay-1080p60.mpdecimate.log`: duplicate-frame analysis.
- `gameplay-1080p60.chromium.log`: headed capture browser output.
- `rubric.json`: frozen scoring dimensions and hard rules.

The 60-fps container is not evidence of 60 unique rendered frames. Treat
`objective-browser.json` cadence as the performance measurement. Screenshots do
not prove handling, completion, or multiplayer.

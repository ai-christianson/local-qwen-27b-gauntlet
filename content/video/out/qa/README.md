# Video QA versions

The current published film is the 91-second v1.3 cut:

- `qwen-gauntlet-v13-video-qa.json`
- `qwen-gauntlet-v13-full-contact.jpg`
- `qwen-gauntlet-v13-ffprobe.json`

The `80-ffprobe.json`, `80-video-qa.json`, and `80-contact-sheet.jpg` files
describe the superseded 84-second v1.0 cut. They are retained as versioned
provenance, not as current-film metadata.

The `qwen-gauntlet-v11-*` files describe the superseded v1.1 cut. Its only
editorial difference was the more causal headline “unlocked more reasoning.”
The v1.2 headline says the text-first condition helped repair but not
generation, matching the corrected 5/10 repair and 0/8 greenfield outcomes.

The `qwen-gauntlet-v12-*` files describe the superseded v1.2 cut. The v1.3
critic panel adds the missing prevalence baseline: every critic target was a
failure, so always predicting FAIL would score 8/8 while Qwen scored 7/8.
The seed-5 evaluator audit remains useful, but the cohort cannot measure
true-positive selection.

Unversioned `qwen-gauntlet-final-*` QA files are pre-version aliases retained
from v1.1 and are not current-film metadata.

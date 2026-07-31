# Assistance and research disclosure

The experiment reports assistance as explicit treatment variables:

| Arm | Simple task prompt | Added system addendum | Public skills | Web research | Pi subagents | Artifact-grounded evidence |
|---|---:|---:|---:|---:|---:|---:|
| INT4 baseline | yes | no | no | package/install egress only | no | model's own attempts only |
| ordinary self-improve | yes | no | no | no special enablement | no | fixed parent evidence |
| grounded critic → repair | yes | no | no | no special enablement | no | fixed screenshots, browser report, critic verdict |
| official Pi subagents | yes | no | no | no special enablement | yes, all Qwen | fixed parent evidence |
| public-skill treatment | same as ordinary self-improve | no | two pinned MIT skills | no special enablement | no | fixed parent evidence |
| reliability-system treatment | same as ordinary self-improve | exact published addendum | no | allowed only as stated | no | fixed parent evidence |
| eight-image-budget treatment | yes; names the API limit and cap | no | no | no special enablement | no | fixed parent evidence |
| text-first treatment | yes; prohibits image tools | no | no | no special enablement | no | fixed parent evidence |
| web-assisted treatment | yes; permits public docs and requires URL ledger | no | no | public documentation only | no | fixed parent evidence |
| adaptive reliability + image-budget treatment | same eight-image task | exact published addendum | no | no special enablement | no | fixed parent evidence |
| cross-genre transfer baseline | same prompt skeleton; only kart/arena/platformer brief changes | no | no | dependency egress only | no | empty workspace |
| matched visual-quality pass | same visual prompt for each advancing genre | no | no | no special enablement | no | passing genre artifact |
| matched visual-quality + public skills | same visual prompt | no | two pinned MIT Three.js skills | no special enablement | no | same passing artifact |
| Qwen-authored sequential decomposition | Qwen's verbatim three-task plan | no | no | no special enablement | no | verified kart parent |
| Qwen-authored parallel decomposition | same verbatim plan | no | no | no special enablement | Qwen workers/reviewer | same verified kart parent |
| text-first empty-workspace tail | baseline brief plus one reusable observation-budget sentence | same baseline reliability addendum | no | dependency egress only | no | empty workspace |
| blind generation critic | one fixed read-only prediction prompt | no | no | no | no | source plus five ordered screenshots; no outcome JSON |

"Web research allowed" never means permission to copy a finished kart game,
benchmark answer, proprietary asset, protected character/track/audio, or hidden
experiment rubric. Any URL consulted must appear in the arm's research ledger.
Ordinary dependency documentation is distinguished from solution search.

Codex/GPT-5.6 designs, orchestrates, captures, and evaluates the experiment but
does not edit scored game source. Every source-changing trajectory in a scored
arm must come from Qwen3.6-27B through Pi. Any operator-authored rescue is
separate and cannot improve the reported model result.

The installed coding agent is `@earendil-works/pi-coding-agent@0.83.0`,
published 2026-07-29 and still the npm latest at the 2026-07-30 experiment
start. A final npm metadata check at 2026-07-31 03:24 ET again returned 0.83.0,
matching the installed binary used for the post-cleanup probe. The newer
Pi-native `pi-gauntlet@4.6.0` package was inspected as public research, not
silently installed into the no-skill baseline. Its postinstall mutates agent
configuration, so any future arm using it must be separately labeled and
containment-audited.

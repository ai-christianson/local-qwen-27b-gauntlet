# Infrastructure observation log

This track is separate from game-quality scoring. It records what the experiment
teaches us about the existing inference fabric and Routerd.

Private endpoints, credentials, addresses, and hostnames are excluded from the
public artifact. Raw controller logs use sanitized site/host labels.

## Questions

- How many independent Pi sessions are needed to keep twelve TP2 lanes usefully
  occupied, given that coding agents alternate inference and tool execution?
- Does Routerd distribute this bursty load evenly enough across sites?
- At what concurrency do scheduler queueing, time-to-first-token, preemption,
  errors, or thermal pressure begin to rise?
- Does slower VM egress materially change total coding-agent wall time after
  controlling for model work?
- Are session-affinity decisions preserving useful KV reuse or creating
  hotspots?
- Does Pi's official subagent fan-out create a healthier continuous workload
  than many independent builders, and at what quality cost or benefit?
- Which knobs could improve useful throughput without harming foreground
  traffic: priority class, max in-flight, affinity override, placement weights,
  request batching, or agent fan-out?

## Initial observations

- Eight independent Pi sessions produced only about seven to eight simultaneous
  TP2 requests at steady points because each agent spends time reading, writing,
  and testing between generations. Agent count is therefore not lane demand.
- The ramp from four to eight sessions increased fabric mean utilization from
  roughly 30% to 58–67%, with 14–16 of 24 serving GPUs above 70%.
- Adding four holdout seeds raised Routerd's global running count to eleven with
  zero queued requests at the sampled instant. Admission rejections and upstream
  errors remained zero.
- GPU load was intentionally uneven during the ramp. This is not yet evidence
  of a placement bug: request phases, session affinity, and incomplete samples
  can produce temporary imbalance. We will evaluate time-weighted distributions.
- The first full monitoring interval peaked at 77 °C on the warmest serving
  card. There was no monotonic thermal climb or admission queue, but this is a
  reasonable caution threshold for further fan-out.
- Routerd exposes useful aggregate counters for running/queued work, queue wait,
  TTFT, end-to-end latency, failures, preemption, capacity, affinity, and vLLM
  state. A sanitized five-second monitor now records only aggregate counters.
- The current Pi provider config sends session-affinity headers but no priority
  class, so the first baseline plateau appeared as `normal`. Routerd's supported
  controlled-client header is `x-router-priority-class`; future experimental
  runs will use preemptable `background_agent`. This gives `human` and
  `foreground_agent` work explicit precedence.
- A representative full sample reached 20 of 24 serving GPUs above 70% with an
  83% mean while Routerd held 11–12 running requests and zero queued. That is
  the current hold point; more load is not warranted until the duty cycle falls.
- Pi 0.83's provider configuration now includes the documented
  `x-router-priority-class: background_agent` and explicit preemptability
  headers. Its installed source also merges configured provider headers into
  outgoing requests. Routerd nevertheless continues to report every observed
  experiment request as `normal` and zero as `background_agent`. Treat this as
  an unresolved integration issue; scored requests are not being changed while
  running to investigate it.
- A post-export, unscored loopback wire diagnostic isolated the Pi side. Pi
  0.83 sent both headers exactly as configured on
  `POST /v1/chat/completions`, including `background_agent` and `true`.
  Therefore the remaining classification bug is downstream of Pi: public
  ingress, proxy/header forwarding, listener selection, Routerd parsing, or
  metrics attribution. The diagnostic used a dummy credential and returned no
  model answer.
- Disposable-VM transport found two reusable harness bugs. macOS PAX/
  AppleDouble metadata was correctly rejected by the strict Linux archive
  importer; portable `ustar` inputs solved it. Reusing loopback SSH ports
  encountered stale host keys; an experiment-owned `known_hosts` file per port
  preserved verification and fixed reuse.
- A fresh VM downloads roughly 184 MB of Playwright browser assets. A
  checksummed golden image would save repeat egress and several minutes of
  provisioning without changing any model treatment.
- The official-BF16 config swap exposed an atomic-replace ownership bug. The
  replacement preserved mode bits but changed the file owner, so Routerd could
  no longer read its config. The swap/restore helper now preserves numeric UID,
  GID, and mode; the exact pre-experiment config hash was restored.
- A second portable-archive failure came from macOS AppleDouble `._workspace`
  sidecars. The strict guest importer correctly rejected the extra top-level
  member. Setting `COPYFILE_DISABLE=1` and creating a no-xattr archive fixed
  transport without weakening the importer.
- Across the observed night, bursty Pi tool phases made sustained saturation
  harder than agent-count arithmetic suggested. The experiment briefly reached
  22 of 24 cards above the active threshold, but did not keep all cards there.
  Zero persistent scheduler queue and zero admission rejections favored holding
  rather than adding uncontrolled load.

## Candidate optimizations to test, not conclusions

1. Validate that the `background_agent` header is accepted on the next plateau
   and that higher-priority work can preempt it cleanly.
2. Size concurrent parent agents to tool-duty-cycle-adjusted demand rather than
   one agent per TP2 lane; subagent bursts may reduce the number of parent VMs
   needed.
3. Compare affinity-hit/load-override deltas with per-lane utilization before
   changing placement weights.
4. Track delta TTFT and latency per completed request during each concurrency
   plateau rather than lifetime averages.
5. If one site remains cooler or faster under matched load, consider thermal or
   egress-aware weights—but only after a paired interval.
6. Add a controller-side saturation target (for example 80–90% active serving
   GPUs with zero persistent queue) and automatic ramp/hold/backoff rules.
7. Compare a direct controlled request at each ingress/listener boundary to find
   where Pi's now-confirmed priority headers are lost or ignored before changing
   production routing policy.

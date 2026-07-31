# Tail replication harness note

Frozen: 2026-07-31 02:47 America/New_York, while all scored arms were still
running and before any external outcome was inspected.

The first extension launch exposed a setup error before Qwen reached the task.
All eight guests used the laptop's normal model configuration, whose inference
hostname resolves to a private address. The guest containment policy correctly
rejected that route. Every Pi process exited with `Connection error`, all eight
workspaces contained zero files, and the failure sessions were checksummed
before their registered VMs were removed. They are excluded harness failures,
not model failures.

A replacement launch added a narrow host-gateway TCP bridge:

- the forwarder binds only to loopback on each VM host;
- it passes TLS bytes through without terminating or inspecting them;
- each guest maps one declared hostname to the virtual host gateway;
- the guest firewall permits only that gateway address and one declared port;
- the existing private-range rejections remain in force;
- runtime credential and endpoint material are injected after boot and are not
  stored in the public repository.

Cloud-init's managed-hosts phase overwrote the first attempted early hostname
mapping. A single no-tools connectivity probe caught that before task fan-out.
No scored prompt was launched and no source was created in that intermediate
batch. The mapping was moved to the final root provisioning step, the guests
were replaced, and a new single-guest probe then demonstrated:

1. the declared hostname resolved to the virtual host gateway;
2. an unauthenticated models request reached the bridge and returned the
   expected authorization failure;
3. an authenticated Pi/Qwen request completed successfully.

Only then were `int4-gen-text-r1a` through `r8a` launched. Those eight are the
complete scored extension set. No sample is added, removed, or renamed based
on its game outcome.

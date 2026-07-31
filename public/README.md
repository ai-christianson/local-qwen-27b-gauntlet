# Public evidence package

This directory contains exact copies of all 35 Pi JSONL trajectories that were
both extracted from the disposable VMs and retained in the working tree. They
cover the source-mutating builders and read-only critics used in the reported
comparisons. `trajectories.sha256` hashes every public copy.

Before publication, the trajectories and every other tracked candidate were
scanned for:

- private IPv4 ranges and the experiment's private host aliases;
- credentials and common API/token formats;
- private Routerd/Grafana endpoint patterns;
- environment assignments containing secret values.

No matching value was found in these trajectory files. They are copied
byte-for-byte rather than rewritten, so model messages, tool calls, errors,
usage, and source mutations remain inspectable.

Additional raw VM archives stay in the private working bundle because they
duplicate source, browser dependencies, and private operational metadata. Their
SHA-256 manifests remain in the public record. This distinction is operational
redaction, not result selection.

The trajectory proves that Pi attributed these assistant/tool events to the
declared Routerd model alias. Together with the independent server-side model
and GPU audit, that is strong practical provenance, not a cryptographic proof
of a provider's internals.

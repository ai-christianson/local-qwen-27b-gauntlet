#!/usr/bin/env python3
"""Add a model variant by copying an existing Pi provider model entry."""

from __future__ import annotations

import argparse
import copy
import json
import os
from pathlib import Path
import re
import tempfile


parser = argparse.ArgumentParser()
parser.add_argument("--config", type=Path, required=True)
parser.add_argument("--provider", required=True)
parser.add_argument("--source-id", required=True)
parser.add_argument("--new-id", required=True)
parser.add_argument("--name", required=True)
parser.add_argument("--context-window", type=int, required=True)
args = parser.parse_args()

identifier = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._-]{1,127}$")
if not identifier.fullmatch(args.provider):
    raise SystemExit("invalid provider")
if not identifier.fullmatch(args.source_id) or not identifier.fullmatch(args.new_id):
    raise SystemExit("invalid model id")
if not 1024 <= args.context_window <= 1_048_576:
    raise SystemExit("invalid context window")

config_path = args.config.resolve()
if config_path == Path("/") or not config_path.is_file():
    raise SystemExit("invalid config path")

data = json.loads(config_path.read_text(encoding="utf-8"))
provider = data.get("providers", {}).get(args.provider)
if not isinstance(provider, dict) or not isinstance(provider.get("models"), list):
    raise SystemExit("provider model list not found")

models = provider["models"]
if any(model.get("id") == args.new_id for model in models):
    raise SystemExit("new model id already exists")
source = next((model for model in models if model.get("id") == args.source_id), None)
if source is None:
    raise SystemExit("source model id not found")

variant = copy.deepcopy(source)
variant["id"] = args.new_id
variant["name"] = args.name
variant["contextWindow"] = args.context_window
models.append(variant)

payload = f"{json.dumps(data, indent=2)}\n".encode()
fd, temporary = tempfile.mkstemp(prefix=f".{config_path.name}.", dir=config_path.parent)
try:
    with os.fdopen(fd, "wb") as handle:
        handle.write(payload)
        handle.flush()
        os.fsync(handle.fileno())
    os.chmod(temporary, config_path.stat().st_mode & 0o777)
    os.replace(temporary, config_path)
finally:
    if os.path.exists(temporary):
        os.unlink(temporary)

print(args.new_id)

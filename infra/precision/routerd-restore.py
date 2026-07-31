#!/usr/bin/env python3
"""Atomically restore a checksummed Routerd configuration backup."""

import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import tempfile
import tomllib


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


parser = argparse.ArgumentParser()
parser.add_argument("--config", type=Path, required=True)
parser.add_argument("--expected-current-sha256", required=True)
parser.add_argument("--backup", type=Path, required=True)
args = parser.parse_args()

if not re.fullmatch(r"[0-9a-f]{64}", args.expected_current_sha256):
    raise SystemExit("invalid current SHA-256")

config_path = args.config.resolve()
backup = args.backup.resolve()
sidecar = backup.with_suffix(backup.suffix + ".sha256")
if config_path == Path("/") or backup == Path("/") or not sidecar.is_file():
    raise SystemExit("invalid restore target or missing checksum sidecar")

current = config_path.read_bytes()
current_sha = sha256(current)
current_stat = config_path.stat()
if current_sha != args.expected_current_sha256:
    raise SystemExit(
        f"current config checksum changed: expected={args.expected_current_sha256} actual={current_sha}"
    )
if 'name = "qg-qwen36-bf16"' not in current.decode("utf-8"):
    raise SystemExit("current config is not the expected BF16 experiment state")

expected_backup_sha = sidecar.read_text(encoding="utf-8").split()[0]
if not re.fullmatch(r"[0-9a-f]{64}", expected_backup_sha):
    raise SystemExit("invalid backup checksum sidecar")
backup_bytes = backup.read_bytes()
backup_sha = sha256(backup_bytes)
if backup_sha != expected_backup_sha:
    raise SystemExit(
        f"backup checksum mismatch: expected={expected_backup_sha} actual={backup_sha}"
    )
tomllib.loads(backup_bytes.decode("utf-8"))

fd, temp_name = tempfile.mkstemp(
    prefix=f".{config_path.name}.qg-restore.", dir=config_path.parent
)
try:
    with os.fdopen(fd, "wb") as handle:
        handle.write(backup_bytes)
        handle.flush()
        os.fsync(handle.fileno())
    os.chmod(temp_name, current_stat.st_mode & 0o777)
    os.chown(temp_name, current_stat.st_uid, current_stat.st_gid)
    os.replace(temp_name, config_path)
finally:
    if os.path.exists(temp_name):
        os.unlink(temp_name)

print(
    json.dumps(
        {
            "schema": "qwen-gauntlet-routerd-precision-restore-v1",
            "replaced_bf16_sha256": current_sha,
            "restored_sha256": backup_sha,
            "backup_file": backup.name,
        },
        indent=2,
    )
)

#!/usr/bin/env python3
"""Atomically replace two TP2 INT4 backend blocks with one TP4 BF16 block."""

import argparse
import datetime as dt
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


def quoted(value: str) -> str:
    return json.dumps(value)


parser = argparse.ArgumentParser()
parser.add_argument("--config", type=Path, required=True)
parser.add_argument("--expected-sha256", required=True)
parser.add_argument("--backup-dir", type=Path, required=True)
parser.add_argument("--backend-a", required=True)
parser.add_argument("--backend-b", required=True)
parser.add_argument("--launcher", required=True)
parser.add_argument("--working-dir", required=True)
parser.add_argument("--model-dir", required=True)
parser.add_argument("--runtime-path", required=True)
parser.add_argument("--port", type=int, default=8221)
parser.add_argument("--gpus", default="0,3,1,2")
parser.add_argument("--cpu-bind", default="0-127")
parser.add_argument("--mem-bind", default="0")
args = parser.parse_args()

if not re.fullmatch(r"[0-9a-f]{64}", args.expected_sha256):
    raise SystemExit("invalid expected SHA-256")
for value in (args.launcher, args.working_dir, args.model_dir):
    if not value.startswith("/"):
        raise SystemExit("launcher, working directory, and model directory must be absolute")
if not (1024 <= args.port <= 65535):
    raise SystemExit("invalid port")
if not re.fullmatch(r"[0-9]+(?:,[0-9]+){3}", args.gpus):
    raise SystemExit("expected exactly four comma-separated GPU indices")

config_path = args.config.resolve()
backup_dir = args.backup_dir.resolve()
if config_path == Path("/") or backup_dir == Path("/"):
    raise SystemExit("refusing broad path")

original = config_path.read_bytes()
original_sha = sha256(original)
original_stat = config_path.stat()
if original_sha != args.expected_sha256:
    raise SystemExit(
        f"config checksum changed: expected={args.expected_sha256} actual={original_sha}"
    )

text = original.decode("utf-8")
marker_a = f'[[backends]]\nname = {quoted(args.backend_a)}'
marker_b = f'[[backends]]\nname = {quoted(args.backend_b)}'
start = text.find(marker_a)
if start < 0 or marker_b not in text[start:]:
    raise SystemExit("expected paired backend blocks were not found")
suffix = text[start:]
if suffix.count("[[backends]]") != 2:
    raise SystemExit("refusing replacement: paired backends are not the final two blocks")

gpus = args.gpus.split(",")
gpu_list = ", ".join(quoted(gpu) for gpu in gpus)
block = f"""[[backends]]
name = "qg-qwen36-bf16"
base_url = "http://127.0.0.1:{args.port}"
kind = "vllm"
models = ["qwen36-27b-bf16"]
max_inflight = 4

[backends.resources]
gpus = [{gpu_list}]
group = "qg-qwen36-bf16-tp4"

[backends.capabilities]
supports_streaming = true
supports_tools = true
supports_multimodal = true
supports_reasoning = true
supports_json_schema = true

[backends.process]
command = [{quoted(args.launcher)}]
working_dir = {quoted(args.working_dir)}
health_path = "/v1/models"
startup_timeout = "15m"
shutdown_timeout = "90s"
idle_timeout = "30m"
start_on_boot = true
stop_on_idle = false

[backends.process.env]
HOME = "/var/lib/routerd"
PATH = {quoted(args.runtime_path)}
PYTHONUNBUFFERED = "1"
TMPDIR = "/var/lib/routerd/tmp"
XDG_CACHE_HOME = "/var/lib/routerd/.cache"
ROOT = {quoted(args.working_dir)}
MODEL_DIR = {quoted(args.model_dir)}
HOST = "127.0.0.1"
PORT = {quoted(str(args.port))}
GPUS = {quoted(args.gpus)}
MODEL_NAME = "qwen36-27b-bf16"
LOG_MODEL_TAG = "qwen36-27b-bf16-qg"
TENSOR_PARALLEL_SIZE = "4"
MAX_MODEL_LEN = "65536"
MAX_NUM_SEQS = "4"
MAX_NUM_BATCHED_TOKENS = "8192"
GPU_MEMORY_UTILIZATION = "0.92"
KV_CACHE_DTYPE = "bfloat16"
SPECULATIVE_CONFIG = "none"
DISABLE_CUSTOM_ALL_REDUCE = "1"
MM_LIMITS = '{{"image":12,"video":0}}'
REASONING_PARSER = "qwen3"
TOOL_CALL_PARSER = "qwen3_coder"
CHAT_TEMPLATE_CONTENT_FORMAT = "openai"
DEFAULT_CHAT_TEMPLATE_KWARGS = '{{"enable_thinking":true,"preserve_thinking":true}}'
GENERATION_CONFIG = "auto"
CPU_BIND = {quoted(args.cpu_bind)}
MEM_BIND = {quoted(args.mem_bind)}
"""

replacement = text[:start] + block
tomllib.loads(replacement)
replacement_bytes = replacement.encode("utf-8")
replacement_sha = sha256(replacement_bytes)

backup_dir.mkdir(parents=True, exist_ok=True)
stamp = dt.datetime.now(dt.timezone.utc).strftime("%Y%m%dT%H%M%SZ")
backup = backup_dir / f"routerd.toml.pre-qg-bf16.{stamp}"
if backup.exists():
    raise SystemExit("backup collision")
shutil.copy2(config_path, backup)
(backup.with_suffix(backup.suffix + ".sha256")).write_text(
    f"{original_sha}  {backup.name}\n",
    encoding="utf-8",
)

fd, temp_name = tempfile.mkstemp(
    prefix=f".{config_path.name}.qg-bf16.", dir=config_path.parent
)
try:
    with os.fdopen(fd, "wb") as handle:
        handle.write(replacement_bytes)
        handle.flush()
        os.fsync(handle.fileno())
    os.chmod(temp_name, original_stat.st_mode & 0o777)
    os.chown(temp_name, original_stat.st_uid, original_stat.st_gid)
    os.replace(temp_name, config_path)
finally:
    if os.path.exists(temp_name):
        os.unlink(temp_name)

print(
    json.dumps(
        {
            "schema": "qwen-gauntlet-routerd-precision-swap-v1",
            "original_sha256": original_sha,
            "bf16_sha256": replacement_sha,
            "backup_file": backup.name,
            "model": "qwen36-27b-bf16",
            "tensor_parallel_size": 4,
            "gpu_count": 4,
        },
        indent=2,
    )
)

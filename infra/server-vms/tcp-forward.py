#!/usr/bin/env python3
"""Small fail-closed TCP forwarder for a disposable VM host gateway."""

import argparse
import asyncio
import signal


async def copy_stream(reader: asyncio.StreamReader, writer: asyncio.StreamWriter) -> None:
    try:
        while chunk := await reader.read(64 * 1024):
            writer.write(chunk)
            await writer.drain()
    finally:
        writer.close()


async def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--listen-host", default="127.0.0.1")
    parser.add_argument("--listen-port", type=int, required=True)
    parser.add_argument("--target-host", required=True)
    parser.add_argument("--target-port", type=int, required=True)
    args = parser.parse_args()

    if not 1024 <= args.listen_port <= 65535:
        parser.error("listen port must be 1024..65535")
    if not 1 <= args.target_port <= 65535:
        parser.error("target port must be 1..65535")

    async def handle(
        client_reader: asyncio.StreamReader,
        client_writer: asyncio.StreamWriter,
    ) -> None:
        try:
            target_reader, target_writer = await asyncio.open_connection(
                args.target_host,
                args.target_port,
            )
            await asyncio.gather(
                copy_stream(client_reader, target_writer),
                copy_stream(target_reader, client_writer),
            )
        except Exception:
            client_writer.close()

    server = await asyncio.start_server(
        handle,
        args.listen_host,
        args.listen_port,
    )
    stop = asyncio.Event()
    loop = asyncio.get_running_loop()
    for sig in (signal.SIGINT, signal.SIGTERM):
        loop.add_signal_handler(sig, stop.set)

    async with server:
        await stop.wait()


if __name__ == "__main__":
    asyncio.run(main())

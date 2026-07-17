#!/usr/bin/env python3
from __future__ import annotations

import json
import os
import subprocess
import threading
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any

HOST = "0.0.0.0"
PORT = 8080
MAX_BODY_BYTES = 64_000
MAX_QUERY_CHARS = 500
MAX_RUNTIME_SECONDS = 900
LAST30DAYS_COMMIT = "249c7a4c040558a903d6838dee31012980d4946d"
SCRIPT = Path("/opt/last30days-skill/skills/last30days/scripts/last30days.py")
ALLOWED_SOURCES = {
    "reddit",
    "youtube",
    "web",
    "hackernews",
    "github",
    "polymarket",
    "digg",
    "arxiv",
    "techmeme",
}
RUN_LOCK = threading.Semaphore(1)


def compact_error(value: str, limit: int = 3000) -> str:
    return value.strip()[-limit:]


def json_bytes(payload: Any) -> bytes:
    return json.dumps(payload, ensure_ascii=False, separators=(",", ":")).encode("utf-8")


def parse_payload(raw: bytes) -> dict[str, Any]:
    value = json.loads(raw.decode("utf-8"))
    if not isinstance(value, dict):
        raise ValueError("JSON object required")
    return value


def build_command(payload: dict[str, Any]) -> list[str]:
    query = str(payload.get("query") or "").strip()
    if not query or len(query) > MAX_QUERY_CHARS:
        raise ValueError("query must contain between 1 and 500 characters")

    mode = str(payload.get("mode") or "research").strip().lower()
    if mode not in {"research", "discovery"}:
        raise ValueError("mode must be research or discovery")

    depth = str(payload.get("depth") or "quick").strip().lower()
    if depth not in {"quick", "default", "deep"}:
        raise ValueError("depth must be quick, default or deep")

    requested_sources = payload.get("sources")
    sources: list[str] = []
    if requested_sources is not None:
        if not isinstance(requested_sources, list):
            raise ValueError("sources must be an array")
        for raw_source in requested_sources:
            source = str(raw_source).strip().lower()
            if source not in ALLOWED_SOURCES:
                raise ValueError(f"unsupported source: {source}")
            if source not in sources:
                sources.append(source)

    command = ["python", str(SCRIPT)]
    if mode == "discovery":
        command.extend(["--discover", query])
        if payload.get("shallow", True) is True:
            command.append("--discover-shallow")
    else:
        command.append(query)

    command.extend(["--emit=json", "--json-profile=agent", "--no-browser-cookies"])
    if depth == "quick":
        command.append("--quick")
    elif depth == "deep":
        command.append("--deep")

    if sources:
        command.extend(["--search", ",".join(sources)])

    return command


def execute(payload: dict[str, Any]) -> tuple[int, dict[str, Any]]:
    try:
        command = build_command(payload)
    except ValueError as exc:
        return HTTPStatus.BAD_REQUEST, {"ok": False, "error": "invalid_request", "detail": str(exc)}

    if not RUN_LOCK.acquire(blocking=False):
        return HTTPStatus.TOO_MANY_REQUESTS, {"ok": False, "error": "runner_busy"}

    try:
        env = os.environ.copy()
        env.update(
            {
                "SETUP_COMPLETE": "1",
                "FROM_BROWSER": "none",
                "NO_COLOR": "1",
                "PYTHONUNBUFFERED": "1",
            }
        )
        proc = subprocess.run(
            command,
            cwd=str(SCRIPT.parent),
            env=env,
            capture_output=True,
            text=True,
            timeout=MAX_RUNTIME_SECONDS,
            check=False,
        )
    except subprocess.TimeoutExpired as exc:
        return HTTPStatus.GATEWAY_TIMEOUT, {
            "ok": False,
            "error": "last30days_timeout",
            "detail": compact_error((exc.stderr or "") if isinstance(exc.stderr, str) else ""),
        }
    finally:
        RUN_LOCK.release()

    if proc.returncode != 0:
        return HTTPStatus.BAD_GATEWAY, {
            "ok": False,
            "error": "last30days_failed",
            "exitCode": proc.returncode,
            "detail": compact_error(proc.stderr or proc.stdout),
        }

    try:
        result = json.loads(proc.stdout)
    except json.JSONDecodeError:
        return HTTPStatus.BAD_GATEWAY, {
            "ok": False,
            "error": "invalid_last30days_json",
            "detail": compact_error(proc.stdout),
            "stderr": compact_error(proc.stderr),
        }

    if not isinstance(result, dict):
        return HTTPStatus.BAD_GATEWAY, {"ok": False, "error": "unexpected_last30days_payload"}

    return HTTPStatus.OK, result


class Handler(BaseHTTPRequestHandler):
    server_version = "SenzaRoamingLast30Days/1.0"

    def log_message(self, fmt: str, *args: Any) -> None:
        print(f"[{self.log_date_time_string()}] {self.address_string()} {fmt % args}", flush=True)

    def send_json(self, status: int, payload: Any) -> None:
        body = json_bytes(payload)
        self.send_response(status)
        self.send_header("content-type", "application/json; charset=utf-8")
        self.send_header("cache-control", "no-store")
        self.send_header("content-length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:  # noqa: N802
        if self.path.rstrip("/") == "/health":
            self.send_json(
                HTTPStatus.OK,
                {
                    "ok": True,
                    "service": "last30days-runner",
                    "upstreamCommit": LAST30DAYS_COMMIT,
                    "python": os.sys.version.split()[0],
                },
            )
            return
        self.send_json(HTTPStatus.NOT_FOUND, {"ok": False, "error": "route_not_found"})

    def do_POST(self) -> None:  # noqa: N802
        if self.path.rstrip("/") != "/run":
            self.send_json(HTTPStatus.NOT_FOUND, {"ok": False, "error": "route_not_found"})
            return

        try:
            length = int(self.headers.get("content-length") or "0")
        except ValueError:
            length = 0
        if length <= 0 or length > MAX_BODY_BYTES:
            self.send_json(HTTPStatus.REQUEST_ENTITY_TOO_LARGE, {"ok": False, "error": "invalid_body_size"})
            return

        try:
            payload = parse_payload(self.rfile.read(length))
        except (UnicodeDecodeError, json.JSONDecodeError, ValueError) as exc:
            self.send_json(HTTPStatus.BAD_REQUEST, {"ok": False, "error": "invalid_json", "detail": str(exc)})
            return

        status, result = execute(payload)
        self.send_json(status, result)


if __name__ == "__main__":
    if not SCRIPT.is_file():
        raise SystemExit(f"last30days script not found: {SCRIPT}")
    print(f"Starting last30days runner on {HOST}:{PORT}", flush=True)
    ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()

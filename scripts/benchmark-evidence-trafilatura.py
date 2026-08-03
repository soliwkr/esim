#!/usr/bin/env python3
"""Offline benchmark only: compare a captured evidence artifact with Trafilatura extraction.

This script never fetches a URL and never creates or verifies claims. It requires an
already-captured raw.html + snapshot.json pair and an explicitly installed Trafilatura.
"""

from __future__ import annotations

import argparse
import json
from importlib.metadata import PackageNotFoundError, version
from pathlib import Path
from typing import Any


def repo_local_path(value: str) -> Path:
    root = Path.cwd().resolve()
    path = (root / value).resolve()
    if path == root or root not in path.parents:
        raise argparse.ArgumentTypeError("path must stay inside the repository")
    return path


def load_snapshot(path: Path) -> dict[str, Any]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    candidates = payload.get("candidates")
    if not isinstance(candidates, list) or not candidates:
        raise ValueError("snapshot.json must contain candidates")
    return payload


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Offline Trafilatura retention benchmark for an existing evidence artifact."
    )
    parser.add_argument("raw_html", type=repo_local_path)
    parser.add_argument("snapshot_json", type=repo_local_path)
    args = parser.parse_args()

    try:
        import trafilatura  # type: ignore
    except ImportError as exc:
        raise SystemExit(
            "Trafilatura is not installed. Install it only in an isolated local environment "
            "for this optional benchmark; it is not a repository dependency."
        ) from exc

    html = args.raw_html.read_text(encoding="utf-8")
    snapshot = load_snapshot(args.snapshot_json)
    extracted = trafilatura.extract(
        html,
        output_format="txt",
        include_comments=False,
        include_tables=True,
        favor_precision=True,
    )
    text = extracted or ""

    try:
        trafilatura_version = version("trafilatura")
    except PackageNotFoundError:
        trafilatura_version = "unknown"

    fields = []
    for candidate in snapshot["candidates"]:
        raw_value = str(candidate.get("rawValue", ""))
        fields.append(
            {
                "fieldName": candidate.get("fieldName"),
                "rawValue": raw_value,
                "retainedVerbatim": bool(raw_value) and raw_value in text,
            }
        )

    result = {
        "benchmark": "trafilatura-retention-only",
        "trafilaturaVersion": trafilatura_version,
        "snapshotId": snapshot.get("snapshotId"),
        "inputBytes": len(html.encode("utf-8")),
        "extractedCharacters": len(text),
        "fields": fields,
        "limitations": [
            "Retention does not prove extraction correctness or commercial truth.",
            "This benchmark does not create claim candidates or write D1.",
            "Field-specific repository extraction remains the canonical spike path.",
        ],
    }
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()

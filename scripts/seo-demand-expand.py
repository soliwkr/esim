#!/usr/bin/env python3
"""Reproducible SEO demand expansion for Senza Roaming.

Uses Serper.dev for:
- Google Autocomplete (`/autocomplete`)
- Google Search (`/search`) including People Also Ask and related searches

Secrets are read only from SERPER_API_KEY (or --api-key-env override) and are never
written to output. Raw response bodies are stored locally with SHA-256 hashes so a
normalized CSV row can be traced back to the exact captured payload.

This is a research collector, not a page generator. Suggestions/questions do not
change keyword ownership or create routes automatically.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import os
import re
import string
import sys
import time
import urllib.error
import urllib.request
from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable

SERPER_BASE = "https://google.serper.dev"
DEFAULT_SEEDS = Path("research/seo/m7-autocomplete-paa-seeds.txt")
DEFAULT_OUTPUT_ROOT = Path("research/local/m7-autocomplete-paa")
RETRYABLE_HTTP = {408, 425, 429, 500, 502, 503, 504}


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def slug(value: str) -> str:
    value = value.casefold().strip()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-")[:80] or "query"


def normalize_query(value: str) -> str:
    return " ".join(value.casefold().split())


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def read_seeds(path: Path) -> list[str]:
    seeds: list[str] = []
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        seeds.append(line)
    return list(dict.fromkeys(seeds))


def atomic_write(path: Path, data: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_bytes(data)
    tmp.replace(path)


def write_csv(path: Path, fields: list[str], rows: Iterable[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as fh:
        writer = csv.DictWriter(fh, fieldnames=fields, extrasaction="ignore")
        writer.writeheader()
        for row in rows:
            writer.writerow(row)


@dataclass
class ApiResult:
    payload: dict[str, Any]
    raw: bytes
    endpoint: str
    captured_at: str
    attempts: int


class SerperClient:
    def __init__(
        self,
        api_key: str,
        *,
        timeout: float = 30.0,
        delay: float = 0.15,
        max_attempts: int = 4,
    ) -> None:
        self._api_key = api_key
        self.timeout = timeout
        self.delay = max(0.0, delay)
        self.max_attempts = max(1, max_attempts)
        self.requests = 0

    def post(self, endpoint: str, body: dict[str, Any]) -> ApiResult:
        url = f"{SERPER_BASE}/{endpoint.lstrip('/')}"
        encoded = json.dumps(body, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
        last_error: Exception | None = None

        for attempt in range(1, self.max_attempts + 1):
            req = urllib.request.Request(
                url,
                data=encoded,
                method="POST",
                headers={
                    "X-API-KEY": self._api_key,
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "User-Agent": "SenzaRoaming-SEO-Research/1.0",
                },
            )
            try:
                self.requests += 1
                with urllib.request.urlopen(req, timeout=self.timeout) as response:
                    raw = response.read()
                payload = json.loads(raw.decode("utf-8"))
                if not isinstance(payload, dict):
                    raise ValueError(f"Unexpected {endpoint} payload type: {type(payload).__name__}")
                if self.delay:
                    time.sleep(self.delay)
                return ApiResult(payload, raw, endpoint, utc_now(), attempt)
            except urllib.error.HTTPError as exc:
                last_error = exc
                body_text = exc.read().decode("utf-8", errors="replace")[:500]
                if exc.code not in RETRYABLE_HTTP or attempt >= self.max_attempts:
                    raise RuntimeError(f"{endpoint}: HTTP {exc.code}: {body_text}") from exc
            except (urllib.error.URLError, TimeoutError, json.JSONDecodeError, ValueError) as exc:
                last_error = exc
                if attempt >= self.max_attempts:
                    raise RuntimeError(f"{endpoint}: {exc}") from exc

            time.sleep(min(8.0, 2 ** (attempt - 1)))

        raise RuntimeError(f"{endpoint}: {last_error}")


def autocomplete_values(payload: dict[str, Any]) -> list[str]:
    out: list[str] = []
    for item in payload.get("suggestions") or []:
        if isinstance(item, str):
            value = item
        elif isinstance(item, dict):
            value = item.get("value") or item.get("query") or ""
        else:
            continue
        value = str(value).strip()
        if value:
            out.append(value)
    return list(dict.fromkeys(out))


def paa_rows(payload: dict[str, Any]) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    for rank, item in enumerate(payload.get("peopleAlsoAsk") or [], 1):
        if not isinstance(item, dict):
            continue
        question = str(item.get("question") or "").strip()
        if not question:
            continue
        out.append(
            {
                "rank": rank,
                "question": question,
                "snippet": str(item.get("snippet") or "").strip(),
                "title": str(item.get("title") or "").strip(),
                "link": str(item.get("link") or "").strip(),
            }
        )
    return out


def related_rows(payload: dict[str, Any]) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    for rank, item in enumerate(payload.get("relatedSearches") or [], 1):
        if isinstance(item, str):
            query = item
        elif isinstance(item, dict):
            query = item.get("query") or item.get("value") or ""
        else:
            continue
        query = str(query).strip()
        if query:
            out.append({"rank": rank, "query": query})
    return out


def organic_rows(payload: dict[str, Any]) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    for fallback_rank, item in enumerate(payload.get("organic") or [], 1):
        if not isinstance(item, dict):
            continue
        link = str(item.get("link") or "").strip()
        title = str(item.get("title") or "").strip()
        if not link and not title:
            continue
        out.append(
            {
                "position": item.get("position") or fallback_rank,
                "title": title,
                "link": link,
                "snippet": str(item.get("snippet") or "").strip(),
            }
        )
    return out


def save_raw(root: Path, *, kind: str, seed: str, probe: str, result: ApiResult) -> tuple[str, str]:
    digest = sha256_bytes(result.raw)
    name = f"{slug(seed)}--{slug(probe)}--{digest[:12]}.json"
    rel = Path("raw") / kind / name
    atomic_write(root / rel, result.raw)
    return rel.as_posix(), digest


def probe_suffixes(include_digits: bool) -> list[str]:
    suffixes = list(string.ascii_lowercase)
    if include_digits:
        suffixes.extend(string.digits)
    return suffixes


def collect(ns: argparse.Namespace) -> Path:
    api_key = os.environ.get(ns.api_key_env)
    if not api_key:
        raise RuntimeError(
            f"Missing {ns.api_key_env}. Set it in the environment; never pass API keys in argv or commit them."
        )

    seeds = read_seeds(ns.seeds_file)
    if not seeds:
        raise RuntimeError(f"No seeds in {ns.seeds_file}")

    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    out = ns.output_dir or (DEFAULT_OUTPUT_ROOT / stamp)
    out.mkdir(parents=True, exist_ok=True)

    client = SerperClient(
        api_key,
        timeout=ns.timeout,
        delay=ns.request_delay,
        max_attempts=ns.max_attempts,
    )

    autocomplete: list[dict[str, Any]] = []
    paa: list[dict[str, Any]] = []
    related: list[dict[str, Any]] = []
    organic: list[dict[str, Any]] = []
    errors: list[dict[str, str]] = []
    query_sources: dict[str, dict[str, Any]] = defaultdict(
        lambda: {"display": "", "source_types": set(), "seeds": set()}
    )

    suffixes = probe_suffixes(ns.include_digits)

    for seed_index, seed in enumerate(seeds, 1):
        print(f"[{seed_index}/{len(seeds)}] {seed}", flush=True)

        probes: list[tuple[str, str]] = []
        if ns.include_base:
            probes.append(("base", seed))
        probes.extend((suffix, f"{seed} {suffix}") for suffix in suffixes)

        if not ns.skip_autocomplete:
            for suffix, probe in probes:
                try:
                    result = client.post(
                        "autocomplete",
                        {"q": probe, "gl": ns.gl, "hl": ns.hl, "autocorrect": False},
                    )
                    raw_ref, raw_sha = save_raw(
                        out, kind="autocomplete", seed=seed, probe=probe, result=result
                    )
                    for rank, suggestion in enumerate(autocomplete_values(result.payload), 1):
                        autocomplete.append(
                            {
                                "seed": seed,
                                "probe": probe,
                                "suffix": suffix,
                                "suggestion": suggestion,
                                "rank": rank,
                                "gl": ns.gl,
                                "hl": ns.hl,
                                "captured_at": result.captured_at,
                                "raw_ref": raw_ref,
                                "raw_sha256": raw_sha,
                            }
                        )
                        key = normalize_query(suggestion)
                        query_sources[key]["display"] = suggestion
                        query_sources[key]["source_types"].add("autocomplete")
                        query_sources[key]["seeds"].add(seed)
                except Exception as exc:  # research must continue across one failed probe
                    errors.append({"seed": seed, "kind": "autocomplete", "probe": probe, "error": str(exc)})
                    print(f"  autocomplete failed: {probe}: {exc}", file=sys.stderr)

        if not ns.skip_search:
            try:
                result = client.post(
                    "search",
                    {
                        "q": seed,
                        "gl": ns.gl,
                        "hl": ns.hl,
                        "location": ns.location,
                        "num": ns.search_num,
                        "autocorrect": False,
                    },
                )
                raw_ref, raw_sha = save_raw(out, kind="search", seed=seed, probe=seed, result=result)

                for item in paa_rows(result.payload):
                    row = {
                        "seed": seed,
                        **item,
                        "gl": ns.gl,
                        "hl": ns.hl,
                        "captured_at": result.captured_at,
                        "raw_ref": raw_ref,
                        "raw_sha256": raw_sha,
                    }
                    paa.append(row)
                    key = normalize_query(item["question"])
                    query_sources[key]["display"] = item["question"]
                    query_sources[key]["source_types"].add("paa")
                    query_sources[key]["seeds"].add(seed)

                for item in related_rows(result.payload):
                    row = {
                        "seed": seed,
                        **item,
                        "gl": ns.gl,
                        "hl": ns.hl,
                        "captured_at": result.captured_at,
                        "raw_ref": raw_ref,
                        "raw_sha256": raw_sha,
                    }
                    related.append(row)
                    key = normalize_query(item["query"])
                    query_sources[key]["display"] = item["query"]
                    query_sources[key]["source_types"].add("related")
                    query_sources[key]["seeds"].add(seed)

                for item in organic_rows(result.payload):
                    organic.append(
                        {
                            "seed": seed,
                            **item,
                            "gl": ns.gl,
                            "hl": ns.hl,
                            "captured_at": result.captured_at,
                            "raw_ref": raw_ref,
                            "raw_sha256": raw_sha,
                        }
                    )
            except Exception as exc:
                errors.append({"seed": seed, "kind": "search", "probe": seed, "error": str(exc)})
                print(f"  search failed: {seed}: {exc}", file=sys.stderr)

    write_csv(
        out / "autocomplete.csv",
        ["seed", "probe", "suffix", "suggestion", "rank", "gl", "hl", "captured_at", "raw_ref", "raw_sha256"],
        autocomplete,
    )
    write_csv(
        out / "people-also-ask.csv",
        ["seed", "rank", "question", "snippet", "title", "link", "gl", "hl", "captured_at", "raw_ref", "raw_sha256"],
        paa,
    )
    write_csv(
        out / "related-searches.csv",
        ["seed", "rank", "query", "gl", "hl", "captured_at", "raw_ref", "raw_sha256"],
        related,
    )
    write_csv(
        out / "organic-serp.csv",
        ["seed", "position", "title", "link", "snippet", "gl", "hl", "captured_at", "raw_ref", "raw_sha256"],
        organic,
    )

    universe_rows: list[dict[str, Any]] = []
    for normalized, data in sorted(query_sources.items()):
        universe_rows.append(
            {
                "query": data["display"],
                "normalized_query": normalized,
                "source_types": ";".join(sorted(data["source_types"])),
                "seeds": ";".join(sorted(data["seeds"])),
            }
        )
    write_csv(
        out / "expanded-query-universe.csv",
        ["query", "normalized_query", "source_types", "seeds"],
        universe_rows,
    )
    write_csv(out / "errors.csv", ["seed", "kind", "probe", "error"], errors)

    manifest = {
        "schema_version": 1,
        "generated_at": utc_now(),
        "collector": "scripts/seo-demand-expand.py",
        "provider": "serper.dev",
        "endpoints": ["/autocomplete", "/search"],
        "api_key_env": ns.api_key_env,
        "api_key_persisted": False,
        "seeds_file": str(ns.seeds_file),
        "seed_count": len(seeds),
        "gl": ns.gl,
        "hl": ns.hl,
        "location": ns.location,
        "include_base": ns.include_base,
        "include_digits": ns.include_digits,
        "autocomplete_suffixes": suffixes,
        "search_num": ns.search_num,
        "api_requests": client.requests,
        "row_counts": {
            "autocomplete": len(autocomplete),
            "people_also_ask": len(paa),
            "related_searches": len(related),
            "organic": len(organic),
            "expanded_query_universe": len(universe_rows),
            "errors": len(errors),
        },
        "notes": [
            "Suggestions/questions are demand evidence, not commercial truth.",
            "No suggestion automatically changes keyword ownership or creates a route.",
            "Raw response bodies are local capture artifacts referenced by SHA-256.",
        ],
    }
    (out / "manifest.json").write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )

    print(f"Output: {out}")
    print(json.dumps(manifest["row_counts"], ensure_ascii=False))
    return out


def self_test() -> int:
    autocomplete_fixture = {
        "suggestions": [
            {"value": "migliore esim europa"},
            {"value": "migliore esim iphone"},
            {"value": "migliore esim europa"},
        ]
    }
    search_fixture = {
        "peopleAlsoAsk": [
            {"question": "Qual è la migliore eSIM?", "snippet": "Dipende dal viaggio."},
        ],
        "relatedSearches": [{"query": "migliore esim per europa"}],
        "organic": [{"position": 1, "title": "Example", "link": "https://example.com"}],
    }
    assert autocomplete_values(autocomplete_fixture) == ["migliore esim europa", "migliore esim iphone"]
    assert paa_rows(search_fixture)[0]["question"] == "Qual è la migliore eSIM?"
    assert related_rows(search_fixture)[0]["query"] == "migliore esim per europa"
    assert organic_rows(search_fixture)[0]["position"] == 1
    assert normalize_query("  Migliore   eSIM ") == "migliore esim"
    assert len(probe_suffixes(False)) == 26
    assert len(probe_suffixes(True)) == 36
    print("seo-demand-expand self-test: ok")
    return 0


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Expand SEO demand via Serper autocomplete + PAA/related searches.")
    p.add_argument("--seeds-file", type=Path, default=DEFAULT_SEEDS)
    p.add_argument("--output-dir", type=Path)
    p.add_argument("--gl", default="it")
    p.add_argument("--hl", default="it")
    p.add_argument("--location", default="Italy")
    p.add_argument("--search-num", type=int, default=10)
    p.add_argument("--include-base", action=argparse.BooleanOptionalAction, default=True)
    p.add_argument("--include-digits", action="store_true")
    p.add_argument("--skip-autocomplete", action="store_true")
    p.add_argument("--skip-search", action="store_true")
    p.add_argument("--request-delay", type=float, default=0.15)
    p.add_argument("--timeout", type=float, default=30.0)
    p.add_argument("--max-attempts", type=int, default=4)
    p.add_argument("--api-key-env", default="SERPER_API_KEY")
    p.add_argument("--self-test", action="store_true")
    return p.parse_args()


def main() -> int:
    ns = parse_args()
    if ns.self_test:
        return self_test()
    try:
        collect(ns)
    except (OSError, RuntimeError, ValueError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

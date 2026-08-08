# Evidence remote `0021` result — 2026-08-08

## Scope

This checkpoint applied only:

```text
0021_evidence_upstream_storage.sql
```

to the target production D1 database and verified the resulting schema.

Explicitly excluded:

- evidence pack ingest;
- `claim_verifications` writes;
- plan writes;
- ranking or publication;
- canonical `/migliore-esim` cutover;
- affiliate activation;
- production deploy.

## Authorization and execution

Authorized `main` SHA:

```text
1bc46e4a49fd0d50c1b4648083ea08a086033918
```

Gate implementation:

```text
PR #125 — Add explicit remote 0021 migration gate
CI #657 — success
merge commit — 1bc46e4a49fd0d50c1b4648083ea08a086033918
```

Remote execution:

```text
workflow: Evidence Remote 0021
run:      31260773468
job:      93111114628
result:   success
```

Audit artifact:

```text
name:       evidence-remote-0021
artifact:   9022714128
zip sha256: 54cb743284ea4fe5286ae5644c34c682e9284317d4ee47e4c1a3643561757446
retention:  30 days
```

## Source registry precondition

Verified before migration at `2026-08-08T13:57:56.665Z`:

```text
registry rows inspected: 15
manifest identities:     9
resolved:                9
not registered:          0
ambiguous:               0
ready for importer:      true
```

## Migration preflight

Read-only preflight at `2026-08-08T13:57:57.868Z`:

```text
local migrations: 21
remote applied:   20
applied range:    0001–0020
sole pending:     0021_evidence_upstream_storage.sql
readyToApply:     true
```

Any additional, missing or reordered migration would have blocked the mutation.

## Apply result

Wrangler `4.112.0` applied exactly one remote migration:

```text
0021_evidence_upstream_storage.sql ✅
```

Wrangler reported 22 executed commands.

## Post-apply verification

Verified at `2026-08-08T13:58:00.900Z`:

```text
remote applied migrations: 21
latest migration:          0021_evidence_upstream_storage.sql
expected tables:           4/4
expected indexes:          7/7
expected triggers:         9/9
verified:                  true
```

Tables:

```text
evidence_capture_runs
evidence_snapshots
evidence_field_observations
evidence_claim_candidates
```

The expected immutability, eligibility and candidate-identity triggers are present.

## Result

Production D1 is now aligned through `0021` and ready for the next separately authorized gate:

```text
approved Italy + Europe evidence packs
→ controlled remote ingest
→ deterministic post-ingest audit
```

The upstream evidence tables were not populated in this checkpoint.

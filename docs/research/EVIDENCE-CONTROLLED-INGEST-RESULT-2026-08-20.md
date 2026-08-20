# Evidence Controlled Ingest — Production Result

Data: **20 agosto 2026**
Esito: **verde, bounded ingest completato e post-verificato**

## Scope autorizzato

Il gate ha autorizzato esclusivamente l'ingest della coppia replacement Italy/Europe già approvata e presente nel bucket R2 locked:

```text
capture run: 31623841563
artifact id: 9152309259
zip sha256: f539220dccb16ad5b66b67755f2447127e80b10a4e6697a4161b92b4f1af4d84
Italy pack:  pack:sha256:90f364863edc735072a7793278f02faa2600ccf441374e6209e4915abc9cf2bf
Europe pack: pack:sha256:fe81e66c376a318b3f3ee35da2f81c49a433d5c141726225dc98e297c09935ae
```

Authorization anchor:

```text
canonical final preflight run:      32391428886
canonical final preflight head:     704b50cf82588c6fcde6d288f54e9392c1f64865
canonical final preflight artifact: 9415005079
canonical artifact sha256:          b4c09892790c94af2dabf256e882b829cc816f318b7b1c124cad0e2fc6ba24b9
confirmation:                       APPLY_APPROVED_EVIDENCE_CONTROLLED_INGEST
```

## Change gate

```text
PR:               #136
PR head:          8e9f36a30cc28cb5bba40bbc27727afb7f6d579e
base:             678cf831e6bd5cbe98a5f3581f0c18a1b02d1374
CI run:           32395144376 / success
merge commit:     55f0228c03b6604ac6858b0a4d987e0cec3ebe7c
merge parents:    678cf831e6bd5cbe98a5f3581f0c18a1b02d1374
                  8e9f36a30cc28cb5bba40bbc27727afb7f6d579e
```

Il workflow è manual-only, controlla lo SHA esatto di `main` e accetta soltanto la confirmation versionata. Il SQL è insert-only e può indirizzare soltanto:

```text
evidence_capture_runs
evidence_snapshots
evidence_field_observations
evidence_claim_candidates
```

DDL, `UPDATE`, `DELETE`, `REPLACE`, source-registry write e target diversi vengono rifiutati prima dell'esecuzione. Il file SQL contiene esattamente 138 statement `INSERT` e viene applicato da D1 come batch transazionale.

## Run production

```text
workflow: Evidence Controlled Ingest
run:      32396193444
job:      96513471283
main:     55f0228c03b6604ac6858b0a4d987e0cec3ebe7c
result:   success
duration: 1m29s
```

Fresh read-only preflight, verificato alle `2026-08-20T17:11:59.410Z`:

```text
R2 objects:             13
source_registry rows:   15
source identities:      9/9
migrations:             21
latest migration:       0021_evidence_upstream_storage.sql
existing capture runs:  0
existing snapshots:     0
existing observations:  0
existing candidates:    0
planned inserts:        2 / 12 / 72 / 52
```

## Exact post-write verification

Il batch è terminato alle `2026-08-20T17:12:31.886Z`. Il controllo indipendente successivo, alle `2026-08-20T17:12:41.714Z`, ha ricostruito i modelli dagli stessi byte R2 e verificato:

```text
capture runs:  2
snapshots:    12
observations: 72
candidates:   52

Italy plan action:  existing_exact
Europe plan action: existing_exact
pending inserts:    0 / 0 / 0 / 0
```

Dettaglio per pack:

```text
Italy:  1 run / 6 snapshots / 33 observations / 25 pending candidates
Europe: 1 run / 6 snapshots / 39 observations / 27 pending candidates
```

## Audit artifact

```text
artifact id:   9416760749
name:          evidence-controlled-ingest-audit
size:          5738 bytes
sha256:        4886495527e4b6aeacf6f425c7227345e18ba1ece5f8887fdb6a0f00816b8daa
created:       2026-08-20T17:12:42Z
expires:       2026-11-18T17:11:12Z
```

L'artifact contiene il source-registry check, il fresh generic preflight, il preflight autorizzato, il result dell'esecuzione e il post-verify.

## Boundary finale

```text
source_registry write: false
plans write:           false
claims verified:       false
affiliate enabled:     false
published:             false
deployed:              false
```

I 52 candidate sono upstream evidence `pending`, non verified claims. Il prossimo gate è il verification provenance bridge; non è autorizzata alcuna verifica automatica, materializzazione money-page, attivazione affiliate, pubblicazione o deploy.

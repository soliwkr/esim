# Evidence controlled ingest read-only preflight result — 20 agosto 2026

## Scope

Questo documento registra il risultato remoto verificato del preflight production per il controlled ingest della coppia replacement Italy + Europe approvata e già materializzata nel bucket R2 locked.

Lo scope è esclusivamente read-only: verifica R2, letture D1, source reconciliation, piano deterministico e audit. Nessun D1 ingest, claim verification, affiliate activation, publication o deploy è incluso o autorizzato.

## Code checkpoint

```text
PR:                135
base main:         aca214699fdc828f66568442bcd09e311eeee190
head:              e636535684a31c409c456b0d1668e3e9bcd32ce9
tested merge ref:  10d9a0b428192fdb87b5d1b61bf4cdedf11fa06f
CI run:            32387491665 / #709 / success
```

Workflow:

```text
Evidence Controlled Ingest Read-only Preflight
run:        32387491600 / #5
conclusion: success
checked at: 2026-08-20T15:41:16.614Z
```

Il contract smoke e il remote read-only preflight sono entrambi conclusi con successo.

## Approved byte anchor

```text
capture run: 31623841563
artifact id: 9152309259
zip sha256: sha256:f539220dccb16ad5b66b67755f2447127e80b10a4e6697a4161b92b4f1af4d84
Italy pack:  pack:sha256:90f364863edc735072a7793278f02faa2600ccf441374e6209e4915abc9cf2bf
Europe pack: pack:sha256:fe81e66c376a318b3f3ee35da2f81c49a433d5c141726225dc98e297c09935ae
```

## R2 verification

Il preflight ha letto e verificato nuovamente gli exact approved bytes:

```text
bucket:                 senza-roaming-evidence-artifacts
jurisdiction:           default
storage class:          Standard
managed public access:  disabled
custom domains:         0
lock id:                evidence-v1-indefinite
lock prefix:            v1/
lock condition:         Indefinite
unique objects:         13
```

Inventory verificato:

```text
11 unique raw objects
 2 pack objects
13 total content-addressed objects
```

Ogni snapshot del modello production usa un `artifact_ref` canonico `r2://evidence-artifacts/...`; nessun path locale viene materializzato come provenance production.

## Source registry e D1 state

```text
database:                  senza-roaming
migration count:           21
latest migration:          0021_evidence_upstream_storage.sql
source_registry rows:      15
manifest identities:       9
identities resolved:       9
existing capture runs:     0
existing snapshots:        0
existing observations:     0
existing candidates:       0
```

Le query remote erano esclusivamente `SELECT`. Nessun approved evidence pack risultava già importato e non è stata rilevata collisione o drift su chiavi esistenti.

## Deterministic import plan

Italy:

```text
pack:         pack:sha256:90f364863edc735072a7793278f02faa2600ccf441374e6209e4915abc9cf2bf
run key:      run:sha256:a75c244419c27d0a4d5f0a334f5d121166e13dbcbcbf49026b11225df6699b4d
action:       insert
runs:         1
snapshots:    6
observations: 33
candidates:   25
```

Europe:

```text
pack:         pack:sha256:fe81e66c376a318b3f3ee35da2f81c49a433d5c141726225dc98e297c09935ae
run key:      run:sha256:c90222d4069133dd74dfe284da3bb759225a8a0e64a64fcd7c4c9ebc8af04ed6
action:       insert
runs:         1
snapshots:    6
observations: 39
candidates:   27
```

Totali pianificati:

```text
runs:          2
snapshots:    12
observations: 72
candidates:   52
```

Questi totali descrivono soltanto il piano read-only; non provano né implicano che le righe siano state scritte.

## Audit artifact

```text
workflow run:    32387491600
artifact id:     9413529042
name:            evidence-controlled-ingest-readonly-preflight
size:            2644 bytes
artifact digest: sha256:fb0d96291e4d8b09312744d8ce46130c375a496dde46120f88a3ce857dc2de94
retention:       through 2026-09-19
```

L'artifact contiene il controlled-ingest preflight JSON e il source-registry preflight JSON.

## Boundary finale

```text
ready:              true
D1 mutated:         false
claims verified:    false
affiliate enabled:  false
published:          false
deployed:           false
```

Il read-only preflight è quindi chiuso e verde.

Il prossimo gate resta separato:

```text
fresh read-only preflight
→ explicit bounded-ingest authorization
→ atomic D1 batch sulle sole quattro tabelle upstream
→ deterministic post-ingest audit
→ STOP
```

Nessuna autorizzazione al controlled D1 ingest è implicita in questo risultato.

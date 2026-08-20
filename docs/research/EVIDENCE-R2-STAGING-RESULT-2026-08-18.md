# Evidence R2 staging result — 18 agosto 2026

## Scope

Questo documento registra il risultato remoto verificato dello staging R2 della coppia replacement Italy + Europe approvata in `docs/research/EVIDENCE-REPLACEMENT-APPROVAL-2026-08-15.md`.

Lo scope è esclusivamente durable artifact staging. Nessuna mutation D1, claim verification, affiliate activation, publication o deploy è inclusa.

## Approved byte anchor

```text
base main:      9da108680e2b050b485151a0f211eee1e33fc347
capture run:    31623841563
artifact id:    9152309259
zip sha256:     f539220dccb16ad5b66b67755f2447127e80b10a4e6697a4161b92b4f1af4d84
Italy pack:     pack:sha256:90f364863edc735072a7793278f02faa2600ccf441374e6209e4915abc9cf2bf
Europe pack:    pack:sha256:fe81e66c376a318b3f3ee35da2f81c49a433d5c141726225dc98e297c09935ae
```

Prima di ogni tentativo di write l'artifact GitHub è stato nuovamente verificato per identità, availability, digest e conteggio file.

## Inventory canonico

```text
artifact files:              15
logical raw references:      12
unique raw R2 objects:       11
unique pack R2 objects:       2
total target R2 objects:     13
```

La deduplicazione deriva dal content addressing: una raw source identica è referenziata logicamente da entrambi i pack ma viene materializzata una sola volta.

## Primo tentativo — fail closed

Run:

```text
32154128831
```

Il preflight ha verificato:

- approved artifact esatto;
- ZIP SHA-256 esatto;
- bucket production esatto;
- native Bucket Lock esatta;
- 13 target objects;
- zero collisioni.

Il primo create remoto ha però fallito prima di poter completare lo staging:

```text
cloudflare_object_create_failed:10028
```

sul primo pack object.

Il workflow ha fallito chiuso. Nessun controlled ingest D1 o altra mutation downstream è stata eseguita.

## Post-failure read-only verification

Read-only recheck:

```text
run: 32154558001
result: success
```

Successivo probe di autenticazione R2 S3, sempre read-only:

```text
run: 32154868752
result: success
```

Le verifiche hanno confermato il boundary remoto e l'assenza dei 13 target object prima del retry autorizzato.

## Retry autorizzato — S3 conditional create-only

Authorization head:

```text
5d099010c703ea78622cd161f36705e45d3d91f2
```

Run:

```text
32156353642
```

Workflow:

```text
Evidence R2 S3 Create-only Retry
```

Trasporto:

```text
r2-s3-sigv4
```

Semantica di write:

```text
If-None-Match: *
```

Risultato verificato:

```text
preflight ready:       true
collisions:            0
created objects:       13
post-write verified:   true
verified objects:      13
```

Il retry ha creato esclusivamente gli object content-addressed assenti. Non esiste percorso di overwrite o delete nel gate operativo.

## Bucket state verificato durante staging

```text
bucket:                 senza-roaming-evidence-artifacts
jurisdiction:           default
storage class:          Standard
managed public access:  disabled
custom domains:         0
```

Native Bucket Lock:

```text
id:        evidence-v1-indefinite
prefix:    v1/
enabled:   true
condition: Indefinite
```

## Pack object verificati

Italy:

```text
object key:   v1/packs/sha256/47/474dc8ca79c84c69eca24ef100a0292ac6b29a5279935f8ce13482c0b0314759.json
artifact ref: r2://evidence-artifacts/v1/packs/sha256/47/474dc8ca79c84c69eca24ef100a0292ac6b29a5279935f8ce13482c0b0314759.json
sha256:       474dc8ca79c84c69eca24ef100a0292ac6b29a5279935f8ce13482c0b0314759
bytes:        55827
```

Europe:

```text
object key:   v1/packs/sha256/c8/c8f15dbdda68af0c333e8abc2be8badf4c9cb5104af9caffa7266a01cc56c769.json
artifact ref: r2://evidence-artifacts/v1/packs/sha256/c8/c8f15dbdda68af0c333e8abc2be8badf4c9cb5104af9caffa7266a01cc56c769.json
sha256:       c8f15dbdda68af0c333e8abc2be8badf4c9cb5104af9caffa7266a01cc56c769
bytes:        64088
```

Gli undici raw object content-addressed sono stati verificati allo stesso modo per key, bytes e digest nel post-write audit.

## Audit artifact

```text
workflow run: 32156353642
artifact id: 9331865182
name: evidence-r2-approved-s3-staging-audit
size: 7660 bytes
artifact digest: sha256:b91a432cdde585997b271f472a67fdfb16fa088adb11435657054d3e127fdd54
retention through: 2026-11-16
```

L'audit contiene metadata dell'artifact approvato, preflight, staging result e post-write verification.

## Boundary finale

```text
replacement approved:  true
R2 staged:              true
R2 verified:            true
D1 mutated:             false
claims verified:        false
affiliate enabled:      false
published:              false
deployed:               false
```

Lo staging R2 è quindi chiuso.

Il prossimo gate è separato:

```text
read-only D1 preflight
→ source resolution 9/9
→ idempotency/drift preflight
→ explicit controlled-ingest authorization
→ bounded atomic D1 ingest
→ deterministic post-ingest audit
```

Nessuna autorizzazione al controlled D1 ingest è implicita in questo risultato.
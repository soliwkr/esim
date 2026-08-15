# Evidence replacement approval — 15 agosto 2026

## Scope

Questo checkpoint registra esclusivamente l'approvazione esplicita della coppia Italy + Europe come replacement dei bundle raw storici #106/#107 non recuperabili.

Non autorizza e non esegue:

```text
R2 object upload / mutation
D1 mutation o controlled ingest
claim verification
publication o money-page materialization
affiliate activation
production deploy
```

## Anchor revisionato

La decisione è stata presa dopo la verifica integrale della PR #133 contro `main`:

```text
PR:          #133
state:       open
draft:       false
mergeable:   true
base branch: main
base SHA:    7ded3c2bdd4b61e8c09e490e485d5c5c091475bb
review head: 3964f0eb28f0ca12892f434fd1af998d3e8a0601
CI number:   693
CI run:      31625701537
CI result:   success
```

Il `review head` identifica esattamente il contenuto candidate-only revisionato prima del commit che registra questa approval.

## Availability e identità verificate

Il 15 agosto 2026 l'artifact è stato ricontrollato via GitHub Actions e scaricato nuovamente.

Metadata remoto:

```text
capture run: 31623841563
artifact id: 9152309259
name: evidence-replacement-capture-candidates
expired: false
expires: 2026-09-11T17:41:12Z
reported digest: sha256:f539220dccb16ad5b66b67755f2447127e80b10a4e6697a4161b92b4f1af4d84
```

Verifica sui byte scaricati:

```text
download: success
zip sha256: f539220dccb16ad5b66b67755f2447127e80b10a4e6697a4161b92b4f1af4d84
files: 15
raw HTML: 12
pack.json: 2
summary: 1
```

Identity lette dai due `pack.json` contenuti nella ZIP:

```text
Italy pack:  pack:sha256:90f364863edc735072a7793278f02faa2600ccf441374e6209e4915abc9cf2bf
Europe pack: pack:sha256:fe81e66c376a318b3f3ee35da2f81c49a433d5c141726225dc98e297c09935ae
```

Queste identità coincidono con la candidate review:

```text
docs/research/EVIDENCE-REPLACEMENT-CANDIDATE-REVIEW-2026-08-12.md
```

## Explicit replacement approval

È approvata come replacement esclusivamente la seguente coppia byte-identificata:

```text
capture run: 31623841563
artifact id: 9152309259
zip sha256: f539220dccb16ad5b66b67755f2447127e80b10a4e6697a4161b92b4f1af4d84
Italy pack:  pack:sha256:90f364863edc735072a7793278f02faa2600ccf441374e6209e4915abc9cf2bf
Europe pack: pack:sha256:fe81e66c376a318b3f3ee35da2f81c49a433d5c141726225dc98e297c09935ae
```

L'approvazione non si estende a una capture successiva, a byte ricostruiti dalla documentazione o a pack con identità differenti.

Stato registrato:

```text
replacementApproved: true
r2Uploaded: false
d1Mutated: false
claimsVerified: false
affiliateEnabled: false
published: false
deployed: false
```

## Gate separati preservati

Il gate successivo è una autorizzazione distinta per lo staging create-only in R2 locked:

```text
recheck artifact availability + exact ZIP digest
→ separately authorize R2 staging
→ stage exact pack + raw bytes create-only
→ verify object key / sha256 / byte length / artifact_ref
```

Solo dopo staging verificato possono essere valutati, sempre con gate separati, read-only D1 preflight e controlled ingest.

Se prima dello staging l'artifact non è più scaricabile o il digest non coincide:

```text
BLOCK
→ no reconstruction from documents
→ new complete capture
→ new raw/provenance review
→ new explicit replacement approval
```

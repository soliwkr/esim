# Evidence source registry — remote onboarding result

Data: **7 agosto 2026**.

## Scope

Questa fase ha eseguito esclusivamente l'onboarding remoto autorizzato delle source `source_registry` necessarie ai due evidence pack già approvati.

Non ha eseguito:

- migration remota `0021`;
- importer degli evidence pack;
- write su `claim_verifications`;
- ranking/provider winner;
- affiliate activation;
- deploy production.

## Stato iniziale certificato

PR #121 aveva verificato due volte il D1 target `senza-roaming`:

```text
source_registry rows:       7
manifest identities:        9
resolved:                   0
source_not_registered:      9
source_registry_ambiguous:  0
readyForImporter:           false
```

Le 9 identity di reconciliation deduplicano a **8 identity D1 uniche** da onboardare.

## Autorizzazione

La mutation remota è stata eseguita soltanto dopo autorizzazione esplicita del project owner nella sessione operativa del 7 agosto 2026.

Il marker operativo richiedeva esattamente:

```text
8 onboarding intents
9 manifest identities
7 registry rows prima
15 registry rows dopo
no remote migration
no importer
no deploy
```

## Primo tentativo — rifiutato senza write

Workflow:

```text
Evidence Source Registry Remote Onboarding #1
run: 31205333567
head: 17170a0a6540b1aeac34ea3e190264698c510ea2
result: failure
```

Il preflight era passato, ma Cloudflare D1 ha rifiutato la statement perché conteneva:

```text
BEGIN TRANSACTION
```

Errore Cloudflare:

```text
code: 7500
To execute a transaction, please use the state.storage.transaction() ...
```

La richiesta SQL è stata rifiutata. Non è stato assunto che il target fosse rimasto invariato: è stata eseguita una nuova verifica read-only dedicata.

### Recheck read-only dopo il failure

Workflow:

```text
Evidence Source Registry Remote Recheck #1
run: 31205451535
result: success
```

Stato ricertificato:

```text
registry rows:  7
resolved:       0/9
missing:        9
ambiguous:      0
```

Quindi il primo tentativo non aveva prodotto alcun onboarding parziale.

## Correzione prima del retry

La transaction SQL esplicita è stata sostituita da **una singola statement multi-row**:

```text
INSERT INTO source_registry (...) VALUES
  (...),
  (...),
  ...
  (...);
```

Guardrail del retry:

- una sola statement `INSERT`;
- esattamente 8 tuple;
- nessun `BEGIN`;
- nessun `TRANSACTION`;
- nessun `SAVEPOINT`;
- nessun `OR IGNORE`;
- preflight remoto invariato obbligatorio prima della mutation;
- metadata conflict o drift bloccano prima della write.

### Dry run/read-only prima del retry

Workflow:

```text
Evidence Source Registry Remote Recheck #2
run: 31205653115
head: fe4da35871889a6117f31eb4b6341317e5bd7068
result: success
```

Ha verificato:

```text
atomic SQL smoke: success
registry rows:     7
resolved:          0/9
missing:           9
ambiguous:         0
```

## Mutation remota riuscita

Workflow:

```text
Evidence Source Registry Remote Onboarding #2
run: 31205724615
head: a862b9d8e3fc152e65173cbe8cc19287dd016b59
result: success
```

Risultato dell'executor:

```text
Registry rows before:          7
Approved inserts executed:     8
Registry rows after:          15
Manifest identities resolved: 9/9
Missing after:                 0
Ambiguous after:               0
Ready for importer source gate: yes
```

## Verifica indipendente immediata

Dopo la mutation, lo stesso workflow ha rieseguito il verifier read-only separato.

Verificato a:

```text
2026-08-07T18:11:04.432Z
```

Esito:

```text
database:             senza-roaming
registry rows:        15
manifest identities:   9
resolved:              9
not registered:        0
ambiguous:             0
readyForImporter:     true
```

Tutte le 9 source audit identity risultano `resolved`, comprese le due identity Ubigi che convergono sulla stessa registry identity approvata.

## Evidence artifact

Artifact GitHub Actions sanitizzato:

```text
name:   evidence-source-registry-onboarding-remote
id:     9004629906
size:   1383 bytes
digest: sha256:4f14933993b678221b54619ade7fc277ebf71d16a41855dd86c5b4eef60f1996
run:    31205724615
head:   a862b9d8e3fc152e65173cbe8cc19287dd016b59
```

L'artifact non versiona secret né richiede ID numerici `source_registry` nel manifest repository.

## Gate chiuso

Il source gate production è chiuso:

```text
8 approved D1 source identities onboarded
→ 9/9 reconciliation identities exactly-one
→ source gate ready for importer
```

Questo **non** significa che l'importer sia già autorizzato a scrivere nel D1 remoto, né che `0021` sia applicata.

## Prossimo gate

Sequenza corretta:

```text
source gate 9/9 closed
→ importer idempotente local/fixture
→ explicit remote 0021 authorization
→ controlled evidence ingest
→ verification provenance bridge
→ bounded commercial facts
→ canonical /migliore-esim cutover
→ affiliate/measurement gate
→ explicit production deploy
```

D1 remoto resta a `0020` fino a un'autorizzazione separata della migration `0021`.

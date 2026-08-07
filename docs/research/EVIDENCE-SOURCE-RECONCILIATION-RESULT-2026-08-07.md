# Evidence source reconciliation — implementation result

Data: **7 agosto 2026**.

## Scope

Materializzare localmente il gate accettato in `EVIDENCE-SOURCE-RECONCILIATION.md` senza registrare fonti, modificare D1 remoto o importare evidence artifact.

## Artefatti

```text
research/evidence/source-reconciliation-map.json
scripts/evidence-source-reconciliation.mjs
scripts/smoke-evidence-source-reconciliation.mjs
```

Lo smoke è integrato in `smoke:runtime`.

## Contratto implementato

```text
sourceAuditKey
+ entity type/key
+ source kind
+ approved registry canonical URL
→ exactly one active source_registry row
```

Esiti:

```text
0 match  → source_not_registered
1 match  → resolved with environment-specific sourceRegistryId
>1 match → source_registry_ambiguous
```

L'ID numerico viene restituito soltanto durante la risoluzione contro un ambiente. Non è versionato nel manifest.

## Manifest iniziale

Il manifest copre le source uniche realmente usate dai pack Italia ed Europa:

- Airalo Italy catalog;
- Airalo unlimited fair-use policy;
- Holafly Italy product;
- Holafly unlimited FAQ;
- Ubigi commerce surface;
- Ubigi activation help;
- Airalo Europe store;
- Holafly Europe product;
- Ubigi Europe product mapped to the approved Ubigi commerce identity.

Le due source Ubigi product conservano requested/final product URL nello snapshot, ma risolvono verso la canonical commerce surface già approvata. Questo mapping è esplicito; non è un fallback automatico.

## Stato onboarding atteso

```text
registered_expected: 2 mapping entries
required:            7 mapping entries
```

`registered_expected` descrive l'aspettativa versionata. Il resolver continua comunque a fallire chiuso se la riga attiva non esiste nell'ambiente interrogato.

## Guardrail testati

Lo smoke verifica:

1. root Airalo non soddisfa la source Italy product/catalog;
2. Ubigi commerce exact identity risolve;
3. exact candidate onboarding risolve;
4. due righe equivalenti producono `source_registry_ambiguous`;
5. riga `blocked` non risolve;
6. historic/deep redirect URL non sostituisce la canonical identity approvata;
7. URL non HTTPS o con credenziali è rifiutato;
8. `sourceRegistryId` hardcoded nel manifest è rifiutato;
9. `sourceAuditKey` duplicato è rifiutato;
10. il resolver non muta né auto-registra righe del registry.

## Confini

Questa slice non autorizza:

- INSERT/UPDATE in `source_registry`;
- remote migration `0021`;
- importer pack;
- evidence table writes;
- `claim_verifications` writes;
- ranking;
- publication;
- affiliate activation;
- deploy.

## Prossimo gate

Dopo il merge, la fase successiva deve decidere e applicare separatamente l'onboarding delle sette source mancanti, prima nell'ambiente locale e soltanto con autorizzazione separata in remoto.

Solo quando ogni source dei pack risolve exactly-one può partire l'importer idempotente:

```text
pack + immutable artifacts
→ resolved source IDs
→ capture runs
→ snapshots
→ field observations
→ pending evidence candidates
```

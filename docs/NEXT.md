# Prossime azioni

Ultimo aggiornamento: **6 agosto 2026**.

Questa lista contiene soltanto lavoro immediatamente eseguibile e gate già definiti. Non è un changelog.

## Closeout design evidence D1 — chiuso

Stato verificato:

```text
PR #108 — Evidence → D1 schema mapping: merged
merge/main: 9689dd20e1a5b477a16a7cd938788a4200fe0baf
CI PR #586: success
CI main #587: success
ADR-039: accepted
D1 remote: ancora fino a 0020
runtime ingest: none
deploy: none
```

Il design accettato è:

```text
source_registry
→ evidence_capture_runs
→ evidence_snapshots
→ evidence_field_observations
→ evidence_claim_candidates
→ separate verification gate
→ claim_verifications
```

Boundary accettati:

1. mapping lossless delle forme osservate nei pack Italia/Europa;
2. preservation del capture-run context e della same capture window;
3. source reconciliation fail-closed prima di ogni snapshot import;
4. `source_registry` invariato come registry canonico;
5. `editorial_claim_candidates` separata dall'evidence candidate;
6. `plans` v1 escluso dall'ingest;
7. source-native price senza `price_eur` implicito;
8. `partial`, `unknown`, `not_applicable` first-class;
9. network regionali non appiattiti;
10. plan identity separata da URL, raw hash e prezzo;
11. local `plan_type` non inferito dal solo `destination_coverage.scope=local`;
12. `claim_verifications` mantenuta come current verified state downstream;
13. verification provenance bridge separato.

Documenti:

```text
docs/research/EVIDENCE-D1-SCHEMA-MAPPING.md
docs/research/EVIDENCE-SOURCE-RECONCILIATION.md
docs/research/evidence-d1-field-mapping.csv
```

## Gate corrente — schema upstream local-only

Aprire una **nuova branch** dal `main` aggiornato dopo PR #108.

Scope esclusivo:

```text
additive versioned migration
→ evidence_capture_runs
→ evidence_snapshots
→ evidence_field_observations
→ evidence_claim_candidates

+ CHECK constraints
+ foreign keys
+ indexes
+ JSON validity constraints
+ immutability trigger smoke
+ local migrated-fixture validation
```

Regola critica:

```text
schema-only
local-only validation
```

È ammesso versionare la migration successiva nel repository, ma **non applicarla al D1 remoto** in questo gate.

Non includere:

- importer;
- HTTP fetch;
- pack live;
- source onboarding;
- `source_registry` mutation;
- `claim_verifications` mutation;
- maintenance queue;
- scheduler;
- Worker/API;
- remote migration;
- deploy.

### Acceptance del gate schema

Prima del merge devono essere provati almeno:

1. tutte e quattro le tabelle create su D1 locale migrato;
2. FK coerenti con il design accettato;
3. `coverage_state` vincolato a `observed | partial | unknown | not_applicable`;
4. status candidate vincolati al dominio accettato;
5. JSON columns rifiutano JSON invalido dove previsto;
6. snapshot e field observations non possono essere mutate come scorciatoia per una nuova cattura;
7. unique identity e indici permettono idempotency futura senza introdurre importer;
8. fixture locale copre almeno local + regional, source-native EUR/USD e `partial/unknown/not_applicable`;
9. nessuna tabella `plans` modificata;
10. nessun `claim_verifications` write;
11. nessun accesso remoto D1 necessario ai test;
12. CI completa verde sul final head.

### Remote D1

Il D1 remoto resta a `0020` per tutta questa slice.

Il deploy production non applica migration remote.

Qualsiasi eventuale applicazione remota della nuova migration richiederà un gate separato ed esplicito dopo merge e verifica locale.

## Gate seguente — source reconciliation / onboarding

Solo dopo che lo schema upstream è stato provato localmente.

Obiettivo:

```text
pack sourceAuditKey + canonical URL + role/provider
→ exactly one source_registry row
```

Fail closed:

```text
0 match  → source_not_registered
>1 match → source_registry_ambiguous
```

L'importer non deve auto-creare source.

La decisione su quali `candidate_new` del Claims Coverage Audit registrare in D1 richiede uno scope esplicito e revisionabile.

## Gate seguente — idempotent pack importer

Soltanto dopo source reconciliation.

Target:

```text
pack.json + immutable artifacts
→ capture run
→ snapshots
→ field observations
→ pending evidence candidates
```

Requisiti:

- idempotency sulle content-addressed identities;
- artifact verificabile contro hash;
- candidate soltanto per evidence `observed` o per sotto-fatto `partial` realmente supportato;
- `unknown` e `not_applicable` non diventano factual candidate;
- nessun `claim_verifications` write;
- nessun ranking;
- nessun publication side effect.

Il primo importer deve essere provato su artifact/fixture controllati prima di qualsiasi ingest live o remoto.

## Gate seguente — verification provenance bridge

Non automatizzare il passaggio a `claim_verifications` finché non esiste una relazione auditabile fra decisione e candidate evidence.

Il target concettuale è:

```text
verification decision/revision
↔ evidence candidate(s)
↔ supports | contradicts
```

Il bridge deve preservare:

- decision history;
- source provenance;
- scope;
- freshness;
- conflict handling;
- completeness qualifiers.

`verification_status=verified` non può trasformare un sotto-fatto partial in completezza non provata.

## Commercial materialization / `plans`

Fuori dai primi tre gate.

Non riusare `plans` v1 come scorciatoia per evidence ingest.

Qualsiasi `plans-v2` o materialized commercial view richiede un design separato dopo che evidence storage + verification bridge sono provati.

## Evidence exploration — chiusa

Non aprire un terzo evidence pack esplorativo salvo un nuovo blocker strutturale emerso durante implementation.

Verificato:

```text
PR #106 Italy local: merged, two live captures, semantic changes=0
PR #107 Europe regional: merged, two live captures, semantic changes=0
```

Il prossimo valore viene dalla materializzazione corretta del modello, non dall'aggiungere breadth prima dello schema.

## M6 / measurement — osservazione, non nuova implementazione

Continuare a osservare senza cambiare il container sulla base di pochi dati:

- `page_view` in GA4;
- assenza eventi inattesi;
- nessun traffico preview/Control Room;
- Search Console quando il dataset diventa sostanziale.

Non aggiungere Ads, remarketing, affiliate tracking o nuovi eventi senza scope separato.

## Search Console

Regole invarianti:

- non ripetere sitemap submission senza motivo;
- non usare Indexing API;
- non cambiare keyword ownership su snapshot iniziali poveri;
- nuove decisioni SEO richiedono dati maturi e verifica live.

## Track M4 parallela

Restano possibili branch ristrette per mutation residue:

```text
brief conversion
→ claim operations
→ draft decisions
→ retry queue
```

La legacy privata resta fallback finché la parità operativa necessaria non è chiusa.

Non mischiare M4 con evidence schema work.

## Checkpoint infrastrutturali aperti

- ricontrollo definitivo redirect `www`;
- osservazione post-lancio measurement/Search Console;
- nessun deploy pubblico richiesto dal lavoro evidence corrente.

## Freeze immediato

- niente applicazione remota della migration schema nella slice corrente;
- niente runtime ingest;
- niente auto-registration di source;
- niente FX implicito;
- niente `unknown → false/0/[]`;
- niente regional network flattening;
- niente ranking/provider winner;
- niente pubblicazione automatica;
- niente provider affiliate activation;
- niente secret o UUID D1 nel repository;
- niente token operativo negli URL;
- niente rimozione legacy fuori da una fase dedicata.
# Prossime azioni

Ultimo aggiornamento: **6 agosto 2026**.

Questa lista contiene soltanto lavoro immediatamente eseguibile e gate già definiti. Non è un changelog.

## Gate corrente — PR #108 schema mapping / D1 design

Branch:

```text
design/evidence-d1-schema-mapping
```

Base:

```text
4480141d8debcff4ebe0538251ed1d1af9a81597
```

Scope esclusivo:

```text
Italy local evidence (#106)
+
Europe regional evidence (#107)
→ canonical evidence-to-D1 mapping
```

La PR resta design-only:

```text
no migration
no D1 write
no runtime ingest
no source registration
no Worker/API
no Workflow/scheduler
no ranking
no publication
no deploy
```

### Acceptance del design

Prima di rendere #108 ready devono essere verificati almeno:

1. mapping lossless di tutte le forme osservate nei pack Italia/Europa;
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
13. verification provenance bridge separato;
14. CI completa verde sul final head.

Documenti:

```text
docs/research/EVIDENCE-D1-SCHEMA-MAPPING.md
docs/research/EVIDENCE-SOURCE-RECONCILIATION.md
docs/research/evidence-d1-field-mapping.csv
```

ADR proposta:

```text
ADR-039 — Upstream evidence D1 separato da catalogo e workflow editoriale
```

## Gate successivo dopo merge #108 — schema upstream local-only

Aprire una **nuova branch**. Non implementarla dentro #108.

Scope raccomandato:

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
```

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

### Remote D1

Il D1 remoto resta a `0020` finché una migration successiva non viene autorizzata esplicitamente.

Il deploy production non applica migration remote.

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

- niente `0021` dentro PR #108;
- niente remote migration implicita;
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

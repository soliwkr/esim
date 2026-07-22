# Audit di parità con la Control Room legacy

Data di riferimento: **22 luglio 2026**.

Branch originaria dell'audit:

```text
chore/control-room-legacy-parity-audit
```

Branch di chiusura del linkage claim → task:

```text
fix/control-room-claim-task-linkage-readonly
```

Branch di chiusura del linkage audit → versione draft:

```text
fix/control-room-audit-draft-version-linkage-readonly
```

## Scopo

Questo audit confronta la Control Room legacy in `src/control-room-v3.ts` con la nuova Control Room Astro + React sotto `/control-room-foundation`.

Lo scope comprende esclusivamente:

- letture operative;
- sessione e perimetro privato;
- guardrail editoriali;
- loading, errori parziali, retry, empty state, tastiera e mobile;
- contratti runtime;
- dipendenze residue che impediscono la rimozione della legacy.

Non comprende l'introduzione di mutation, la modifica di Workflow, Container, AI Gateway, Vertex AI, gate editoriali o capacità di pubblicazione.

## Fonti confrontate

- `src/control-room-v3.ts` — shell, letture e azioni della legacy;
- `src/control-room.ts` — snapshot canonico condiviso;
- `apps/web/src/worker.ts` — Access guard e proxy read-only;
- `apps/web/src/lib/control-room-api.ts` — contratto runtime dello snapshot;
- `apps/web/src/lib/draft-detail-contract.ts` — contratto del dettaglio draft;
- `apps/web/src/components/control-room/*` — viste della React island;
- `scripts/smoke-control-room-*.mjs` — smoke runtime e browser esistenti;
- `tests/fixtures/control-room-*.json` — payload canonici di test.

## Criteri di classificazione

| Esito | Significato |
|---|---|
| Parità | La nuova Control Room conserva la lettura legacy. |
| Superata | La nuova Control Room espone la stessa informazione con più dettaglio o guardrail più forti. |
| Gap nuova UI | Il backend espone già il dato, ma il contratto o la vista nuova non lo conserva. |
| Gap condiviso | Il contratto backend non rende disponibile la lettura né alla legacy né alla nuova UI. Il client non deve inventarla. |
| Mutation differita | La capacità modifica stato ed è esclusa dall'audit read-only. |

## Inventario delle letture legacy

La legacy legge un solo snapshot da `GET /api/maintenance/control-room` e mostra:

1. dieci metriche overview;
2. brief con score, stato, bundle, readiness e draft collegato;
3. claim con soggetto, testo, stato, fonte, scadenza, stato task e ID task;
4. queue con tipo, entità, priorità, stato ed errore;
5. evidence bundle e inventario draft;
6. audit recente con dominio, azione, attore, entità e timestamp;
7. preview HTML del draft richiesta esplicitamente tramite endpoint GET.

La nuova Control Room usa lo stesso snapshot, lo valida a runtime e aggiunge una risorsa separata per il dettaglio draft completo.

## Matrice di parità

| Area legacy | Nuova Control Room | Esito | Evidenza |
|---|---|---|---|
| Token operativo inserito nel browser e conservato in `sessionStorage` | Cloudflare Access, validazione JWT nell'origine e maintenance token soltanto server-side | Superata | `apps/web/src/worker.ts`, `apps/web/src/lib/cloudflare-access.ts` |
| Refresh manuale dello snapshot | Refresh esplicito di health e snapshot come risorse indipendenti | Superata | `ControlRoomApp.tsx` |
| 10 metriche overview | Tutte le 19 metriche dello snapshot, capability, binding, timestamp e guardrail | Superata | `Overview.tsx`, `control-room-api.ts` |
| Brief: ID, titolo, slug, priority, stato, bundle, readiness, draft | Tutti i campi legacy più run, segnali, score distinti, quality flag, note e dettaglio filtrabile | Superata | `RadarBriefs.tsx` |
| Claim: ID, brief, soggetto, testo, stato, fonte, scadenza, ID task e stato task | Tutti i campi legacy più campo, domanda di verifica, evidence, note, trust, confidence, valore e stato temporale derivato | Superata | `control-room-api.ts`, `ClaimsSources.tsx` |
| Evidence bundle: ID, slug, versione, readiness e review status | Quattro gate distinti, conteggi, warning strutturati, revisore e timestamp | Superata | `ReadinessEvidence.tsx` |
| Draft: ID, slug, versione, stato e renderer | Inventario completo, bundle e brief canonici, claim usati/esclusi, autore, revisore, note, errori e timestamp | Superata | `DraftDecisions.tsx` |
| Preview HTML del renderer legacy | Dettaglio on demand con corpo strutturato, FAQ, fonti, provenance, regole, metadati e stato pagina | Superata per l'ispezione editoriale | `DraftDetailReadonly.tsx`, `draft-detail-contract.ts` |
| Queue: ID, tipo, entità, priorità, stato ed errore | Tutti i campi legacy più due date, tentativi, lock, payload e dettaglio | Superata | `QueueAudit.tsx` |
| Audit: data, dominio, azione, attore ed entità | Tutti i campi legacy più chiave stabile, linkage draft canonico, dettagli JSON opachi e filtri | Superata | `src/control-room.ts`, `control-room-api.ts`, `QueueAudit.tsx` |
| Messaggio `approved draft ≠ published page` | Stato draft, stato pagina materializzata e publication eligibility mostrati separatamente | Superata | `DraftDetailReadonly.tsx`, `Overview.tsx` |
| Layout desktop con tabelle scrollabili | Layout desktop, Sheet mobile, focus da tastiera, dialog e stati vuoti | Superata | smoke UI, claim, readiness, draft, dettaglio, queue e audit |
| Errore globale durante il caricamento | Health, snapshot e dettaglio draft falliscono in modo indipendente conservando dati validi precedenti | Superata | `ControlRoomApp.tsx`, `draft-detail-api.ts` |

## Gap chiuso: claim → task ID

La query canonica dello snapshot espone già:

```text
q.id AS task_id
q.status AS task_status
```

La legacy mostra entrambi. L'audit aveva rilevato che il contratto `ControlRoomClaim` conservava soltanto `task_status`.

La PR #50, mergiata nel commit `41a9beee`, chiude il gap senza modificare backend o D1:

- aggiunge `task_id: number | null` al contratto;
- accetta soltanto `null` o interi positivi nel parser runtime;
- collega la fixture canonica ai task persistiti;
- mostra ID e stato task nel dettaglio claim;
- rifiuta payload con ID stringa, zero, negativo o non intero;
- aggiorna smoke claim e controllo di parità.

La CI #213 è completamente verde. Il browser non ricostruisce il collegamento da `entity_key` o da altri campi. La verifica visuale nel browser reale di produzione dietro Cloudflare Access resta separata e non è ancora certificata.

## Preview del draft

La preview legacy apre HTML generato dall'endpoint `editorial-draft-preview`. La nuova Control Room non conserva la dipendenza visuale dal renderer HTML legacy.

Per la parità operativa necessaria, la vista nuova espone il contenuto persistito completo e la sua provenienza. Questo è sufficiente per verificare testo, claim, fonti, regole e stato editoriale. La futura anteprima visuale del sito deve appartenere al renderer pubblico Astro, non al template HTML legacy.

Questa decisione non autorizza pubblicazione, materializzazione o modifica del draft.

## Gap chiuso: audit → versione draft

Lo schema esistente contiene già:

```text
editorial_review_draft_events.id
editorial_review_draft_events.draft_id
editorial_review_drafts.version
```

Non è necessaria una migrazione D1. La branch `fix/control-room-audit-draft-version-linkage-readonly` estende esclusivamente la proiezione read-only dello snapshot:

```text
event_key
domain
action
actor
entity
draft_id
draft_version
details
created_at
```

Regole del contratto:

- ogni evento espone una `event_key` stabile e univoca server-side;
- gli eventi `draft` espongono `draft_id` e `draft_version` positivi;
- gli altri domini espongono entrambi i campi come `null`;
- la UI seleziona gli eventi tramite `event_key`;
- la UI non legge `details.draftId`, `details.version` o altri metadati opachi per ricostruire relazioni;
- `details` resta visibile come JSON validato, non come comando o autorizzazione.

Le chiavi sono namespaced per dominio, ad esempio:

```text
draft-event:12
readiness-event:7
claim-event:31
research-run:5
ai-run:4
```

La fixture e gli smoke verificano chiavi vuote o duplicate, linkage mancante sui draft, linkage improprio sugli altri domini e tipi non validi.

La chiusura tecnica è implementata sulla branch; CI e merge restano da completare prima di dichiararla operativa.

## Mutation legacy escluse

La legacy contiene ancora:

- avvio Workflow recent-demand;
- accettazione brief;
- conversione brief;
- valutazione readiness;
- approvazione bundle per draft;
- generazione draft;
- approvazione o richiesta modifiche al draft;
- registrazione dell'esito di un claim atomico.

Queste capacità non sono parità read-only. Verranno migrate una per branch, con conferma, idempotenza, audit e reload dello stato. La pubblicazione resta fuori scope.

## Verdetto

Con la conservazione di `task_id` e il contratto audit canonico, la nuova Control Room raggiunge la parità sulle letture effettivamente mostrate dalla legacy e le supera per dettaglio, sicurezza, identità delle righe e isolamento dei guasti.

La rimozione della legacy **non è autorizzata** perché resta il fallback delle mutation operative non ancora migrate. La parità read-only, da sola, non autorizza la cancellazione del fallback.

## Verifica

- PR #49: merge `e0a39fa9`, CI #209 verde;
- PR #50: merge `41a9beee`, CI #213 verde;
- linkage audit → versione draft: implementato sulla branch, CI ancora da eseguire;
- verifica visuale in produzione dei nuovi linkage: ancora aperta.

## Definition of Done verificabile

- [x] tutte le letture legacy sono mappate;
- [x] lo snapshot resta il contratto canonico condiviso;
- [x] il dettaglio draft resta una risorsa indipendente e GET-only;
- [x] nessun token applicativo è gestito dal browser nuovo;
- [x] Access protegge shell e proxy in modalità fail-closed;
- [x] nessun accesso diretto a D1 dal browser;
- [x] nessuna mutation o capacità di pubblicazione introdotta;
- [x] `task_id` del claim conservato e mostrato senza euristiche;
- [x] audit legato canonicamente alla versione draft senza migrazione o euristiche client;
- [ ] CI della branch audit linkage verde;
- [ ] verifica browser reale dei nuovi linkage;
- [ ] mutation operative migrate;
- [ ] fallback legacy non più necessario;
- [ ] legacy rimossa.

# Audit di parità con la Control Room legacy

Data di riferimento: **22 luglio 2026**.

Branch:

```text
chore/control-room-legacy-parity-audit
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

Non comprende l'introduzione di mutation, la modifica di D1, Workflow, Container, AI Gateway, Vertex AI, gate editoriali o capacità di pubblicazione.

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
| Gap condiviso | Il contratto backend non rende disponibile la lettura né alla legacy né alla nuova UI. Il client non deve inventarla. |
| Mutation differita | La capacità modifica stato ed è esclusa dall'audit read-only. |

## Inventario delle letture legacy

La legacy legge un solo snapshot da `GET /api/maintenance/control-room` e mostra:

1. dieci metriche overview;
2. brief con score, stato, bundle, readiness e draft collegato;
3. claim con soggetto, testo, stato, fonte, scadenza e task;
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
| Claim: ID, brief, soggetto, testo, stato, fonte, scadenza, task | Tutti i campi legacy più scope, campo, domanda di verifica, evidence, note, trust, confidence, valore e stato temporale derivato | Superata | `ClaimsSources.tsx` |
| Evidence bundle: ID, slug, versione, readiness e review status | Quattro gate distinti, conteggi, warning strutturati, revisore e timestamp | Superata | `ReadinessEvidence.tsx` |
| Draft: ID, slug, versione, stato e renderer | Inventario completo, bundle e brief canonici, claim usati/esclusi, autore, revisore, note, errori e timestamp | Superata | `DraftDecisions.tsx` |
| Preview HTML del renderer legacy | Dettaglio on demand con corpo strutturato, FAQ, fonti, provenance, regole, metadati e stato pagina | Superata per l'ispezione editoriale | `DraftDetailReadonly.tsx`, `draft-detail-contract.ts` |
| Queue: ID, tipo, entità, priorità, stato ed errore | Tutti i campi legacy più due date, tentativi, lock, payload e dettaglio | Superata | `QueueAudit.tsx` |
| Audit: data, dominio, azione, attore ed entità | Tutti i campi legacy più dettagli JSON opachi e filtri | Superata | `QueueAudit.tsx` |
| Messaggio `approved draft ≠ published page` | Stato draft, stato pagina materializzata e publication eligibility mostrati separatamente | Superata | `DraftDetailReadonly.tsx`, `Overview.tsx` |
| Layout desktop con tabelle scrollabili | Layout desktop, Sheet mobile, focus da tastiera, dialog e stati vuoti | Superata | smoke UI, claim, readiness, draft, dettaglio, queue e audit |
| Errore globale durante il caricamento | Health, snapshot e dettaglio draft falliscono in modo indipendente conservando dati validi precedenti | Superata | `ControlRoomApp.tsx`, `draft-detail-api.ts` |

## Preview del draft

La preview legacy apre HTML generato dall'endpoint `editorial-draft-preview`. La nuova Control Room non conserva la dipendenza visuale dal renderer HTML legacy.

Per la parità operativa necessaria, la vista nuova espone il contenuto persistito completo e la sua provenienza. Questo è sufficiente per verificare testo, claim, fonti, regole e stato editoriale. La futura anteprima visuale del sito deve appartenere al renderer pubblico Astro, non al template HTML legacy.

Questa decisione non autorizza pubblicazione, materializzazione o modifica del draft.

## Gap condiviso: audit → versione draft

Il contratto aggregato dell'audit espone:

```text
domain, action, actor, entity, details, created_at
```

Non espone un ID evento stabile né campi canonici `draft_id` e `draft_version`. Alcuni `details` possono contenere un `draftId`, ma la UI non può assumere che sia sempre presente o usarlo come relazione garantita.

Conclusione:

- non è una regressione della nuova UI, perché la legacy usa lo stesso contratto;
- resta un gap operativo reale;
- non deve essere risolto con euristiche nel browser;
- deve essere affrontato con uno scope backend read-only esplicito prima di introdurre mutation sui draft.

Branch consigliata:

```text
fix/control-room-audit-draft-version-linkage-readonly
```

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

La nuova Control Room ha **parità funzionale read-only** rispetto alle letture necessarie della legacy e applica guardrail più forti.

La rimozione della legacy **non è autorizzata in questa branch** perché resta il fallback delle mutation operative non ancora migrate. Il gap audit → versione draft resta aperto e deve essere chiuso nel contratto server-side, non nel client.

## Definition of Done verificabile

- [x] tutte le letture legacy sono mappate;
- [x] lo snapshot resta il contratto canonico condiviso;
- [x] il dettaglio draft resta una risorsa indipendente e GET-only;
- [x] nessun token applicativo è gestito dal browser nuovo;
- [x] Access protegge shell e proxy in modalità fail-closed;
- [x] nessun accesso diretto a D1 dal browser;
- [x] nessuna mutation o capacità di pubblicazione introdotta;
- [x] il gap di linkage audit è dichiarato senza ricostruzioni client;
- [ ] smoke e CI della branch verdi;
- [ ] mutation operative migrate;
- [ ] fallback legacy non più necessario;
- [ ] legacy rimossa.

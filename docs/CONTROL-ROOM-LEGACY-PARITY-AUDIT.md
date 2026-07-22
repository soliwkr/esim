# Audit di parità con la Control Room legacy

Data di riferimento: **22 luglio 2026**.

Branch dell'audit e dei gap read-only:

```text
chore/control-room-legacy-parity-audit
fix/control-room-claim-task-linkage-readonly
fix/control-room-audit-draft-version-linkage-readonly
```

Prima branch di mutation:

```text
feat/control-room-brief-decision-mutation
```

## Scopo

Questo audit confronta la Control Room legacy in `src/control-room-v3.ts` con la nuova Control Room Astro + React sotto `/control-room-foundation`.

La fase read-only comprende:

- letture operative;
- sessione e perimetro privato;
- guardrail editoriali;
- loading, errori parziali, retry, empty state, tastiera e mobile;
- contratti runtime;
- dipendenze residue che impediscono la rimozione della legacy.

La fase mutation procede una capacità per branch. La prima capacità è soltanto la decisione umana `proposed → accepted|dismissed`. Conversione, claim, readiness, draft, queue retry, materializzazione e pubblicazione restano escluse.

## Fonti confrontate

- `src/control-room-v3.ts` — shell, letture e azioni della legacy;
- `src/control-room.ts` — snapshot canonico condiviso;
- `apps/web/src/worker.ts` — Access guard e route server-side;
- `apps/web/src/lib/control-room-api.ts` — contratto runtime dello snapshot;
- `apps/web/src/lib/draft-detail-contract.ts` — contratto del dettaglio draft;
- `apps/web/src/components/control-room/*` — viste della React island;
- `scripts/smoke-control-room-*.mjs` — smoke runtime e browser;
- `tests/fixtures/control-room-*.json` — payload canonici di test.

## Matrice di parità

| Area legacy | Nuova Control Room | Esito |
|---|---|---|
| Token operativo in `sessionStorage` | Cloudflare Access e maintenance token soltanto server-side | Superata |
| Refresh manuale dello snapshot | Health e snapshot indipendenti con refresh esplicito | Superata |
| 10 metriche overview | Tutte le 19 metriche, capability, binding e timestamp | Superata |
| Brief | Campi legacy più run, segnali, score, quality flag, note e filtri | Superata |
| Claim | Campi legacy più verifica, evidence, trust, scadenza, `task_id` e stato task | Superata |
| Evidence bundle | Quattro gate distinti, conteggi, warning, revisore e timestamp | Superata |
| Draft | Inventario completo più relazioni, claim, revisione, errori e timestamp | Superata |
| Preview HTML legacy | Dettaglio strutturato on demand con corpo, FAQ, fonti e provenance | Superata per l'ispezione editoriale |
| Queue | Campi legacy più due date, tentativi, lock, payload e dettaglio | Superata |
| Audit | Chiave stabile, linkage draft canonico, dettagli JSON opachi e filtri | Superata |
| Guardrail pubblicazione | Stati draft, pagina e publication eligibility separati | Superata |
| Desktop | Desktop, Sheet mobile, focus, tastiera e stati vuoti | Superata |
| Errore globale | Errori parziali isolati con dati validi precedenti conservati | Superata |

## Gap chiuso: claim → task ID

La query canonica espone già:

```text
q.id AS task_id
q.status AS task_status
```

La PR #50, merge `41a9beee`, conserva il dato senza modificare backend o D1:

- `task_id: number | null` nel contratto;
- validazione come `null` o intero positivo;
- fixture collegata ai task persistiti;
- ID e stato task nel dettaglio claim;
- payload invalidi rifiutati;
- nessuna ricostruzione da `entity_key`.

CI #213 completamente verde. La verifica visuale nel browser reale resta aperta.

## Preview del draft

La preview legacy apre HTML generato dall'endpoint `editorial-draft-preview`. La nuova Control Room non conserva questa dipendenza visuale.

Il dettaglio on demand espone contenuto persistito, claim, fonti, provenance, regole e stato editoriale; la futura anteprima visuale del sito deve appartenere al renderer pubblico Astro.

Questa decisione non autorizza pubblicazione, materializzazione o modifica del draft.

## Gap chiuso: audit → versione draft

Lo schema esistente contiene già:

```text
editorial_review_draft_events.id
editorial_review_draft_events.draft_id
editorial_review_drafts.version
```

La PR #52, merge `35f56e82`, chiude il gap senza migrazione D1. Lo snapshot espone:

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

- ogni evento ha una `event_key` stabile e univoca server-side;
- gli eventi `draft` hanno `draft_id` e `draft_version` positivi;
- gli altri domini hanno entrambi i campi `null`;
- la UI seleziona tramite `event_key`;
- la UI non legge `details.draftId`, `details.version` o altri metadati opachi per ricostruire relazioni;
- `details` resta JSON validato, non comando o autorizzazione.

Chiavi namespaced:

```text
draft-event:<id>
readiness-event:<id>
claim-event:<id>
research-run:<id>
ai-run:<id>
```

CI #217 e CI finale #220 completamente verdi. Gli smoke verificano chiavi vuote o duplicate, linkage mancante sui draft, linkage improprio sugli altri domini e tipi non validi.

## Mutation migrata: decisione brief

La branch `feat/control-room-brief-decision-mutation` introduce esclusivamente:

```text
proposed → accepted | dismissed
accepted → converted  # resta capacità separata e non esposta da questa UI
```

Guardrail implementati:

- un solo brief per richiesta;
- conferma esplicita tramite AlertDialog accessibile;
- attore derivato dal JWT Cloudflare Access già verificato, mai dal body browser;
- evento `editorial_brief_events` append-only;
- transizioni illegali bloccate da D1;
- retry della stessa decisione idempotente;
- motivo obbligatorio per `dismissed`;
- task editoriale aperto cancellato soltanto sul rifiuto;
- reload dello snapshot dopo esito;
- risposta con `publicationTriggered: false`;
- nessuna conversione, generazione claim, draft, materializzazione o pubblicazione.

La migrazione `0020` conserva gli stati storici già osservati con un attore esplicitamente marcato come backfill, senza inventare l'identità originale.

Questo checkpoint è **in implementazione**: CI, merge, migrazione remota e verifica browser reale non sono ancora dichiarati completati.

## Mutation legacy ancora escluse

La legacy contiene ancora:

- avvio Workflow recent-demand;
- conversione brief;
- valutazione readiness;
- approvazione bundle per draft;
- generazione draft;
- approvazione o richiesta modifiche al draft;
- registrazione dell'esito di un claim atomico.

Queste capacità verranno migrate una per branch, con conferma, idempotenza, audit, reload dello stato e test end-to-end. La pubblicazione resta fuori scope.

## Verdetto

La nuova Control Room ha **parità read-only completa in CI** rispetto alle letture operative necessarie della legacy e applica guardrail più forti.

La decisione brief è la prima mutation in migrazione. La rimozione della legacy **non è autorizzata** perché resta il fallback delle mutation non ancora migrate.

## Verifica

- PR #49: merge `e0a39fa9`, CI #209 verde;
- PR #50: merge `41a9beee`, CI #213 verde;
- PR #52: merge `35f56e82`, CI finale #220 verde;
- branch decisione brief: CI e merge ancora aperti;
- verifica visuale in produzione dei nuovi linkage e della mutation: ancora aperta.

## Definition of Done

- [x] tutte le letture legacy mappate;
- [x] snapshot canonico condiviso;
- [x] dettaglio draft indipendente e GET-only;
- [x] nessun token applicativo nel browser;
- [x] Access fail-closed;
- [x] nessun accesso diretto a D1;
- [x] `task_id` conservato senza euristiche;
- [x] audit legato canonicamente alla versione draft senza euristiche;
- [x] decisione brief progettata con conferma, idempotenza e audit append-only;
- [ ] CI completa della mutation verde;
- [ ] migrazione `0020` applicata e verificata in produzione;
- [ ] verifica browser reale della mutation;
- [ ] mutation operative residue migrate;
- [ ] fallback legacy non più necessario;
- [ ] legacy rimossa.

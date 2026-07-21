# Prossime azioni

Questa lista contiene soltanto il lavoro immediatamente eseguibile. La roadmap completa vive in `ROADMAP.md`; la migrazione frontend vive in `docs/FRONTEND-PLAN.md`.

Ultimo aggiornamento: **21 luglio 2026**.

## Now

### 1. Avviare Page Readiness ed evidence bundle

Branch:

```text
feat/control-room-readiness-evidence
```

Obiettivo esclusivo: migrare nella nuova Control Room la lettura degli evidence bundle già presenti nello snapshot protetto.

La fase non modifica backend, D1, Workflow, Container, AI, gate editoriali o contratti API.

### 2. Mappare e validare il contratto bundle

Usare soltanto `evidenceBundles` già restituito da `GET /control-room-foundation/api/snapshot`.

Ogni record deve validare esplicitamente:

- ID, brief, page slug e versione;
- readiness score e review status;
- `review_draft_eligible` e `publication_eligible`;
- `ready_for_review_draft` e `ready_for_publication` senza fonderli;
- conteggi verified, insufficient, contradicted, pending ed expired;
- conflitti, fonti, soggetti e first-party tests;
- warning;
- revisore, reviewed at, created at e updated at.

Un campo non conforme deve rendere invalido il payload. Il client non ricalcola score, gate o conteggi.

### 3. Costruire la vista read-only

La vista deve offrire:

- riepilogo readiness per bundle;
- filtri per review status, draft eligibility, publication eligibility e presenza warning;
- tabella con score e gate separati;
- dettaglio accessibile da tastiera;
- conteggi claim, conflitti e fonti;
- warning mostrati come persistiti;
- empty state reale e empty state dei filtri;
- layout utilizzabile su desktop e mobile.

La UI deve rendere evidente che:

```text
review draft eligible ≠ publication eligible
```

Un bundle idoneo alla generazione di un draft non è automaticamente pubblicabile.

### 4. Definition of Done

Prima del merge devono passare:

- TypeScript strict e build Astro;
- migrazioni locali e smoke del quality gate invariati;
- build e smoke del Container invariati;
- bundle reale dentro `workerd`;
- smoke Chromium generale della Control Room;
- smoke Chromium dedicato a readiness ed evidence bundle;
- filtri, dettaglio, tastiera, mobile, contratto invalido ed empty state;
- nessuna richiesta browser diversa da `GET`;
- nessuna credenziale o accesso diretto a D1;
- nessuna route o azione di approvazione o pubblicazione;
- nessuna regressione su overview, radar, segnali, brief, claim e draft preview.

### 5. Verificare il deploy reale

Dopo il merge:

- aprire `https://senzaroaming.it/control-room-foundation`;
- verificare la sezione Page Readiness;
- aprire il bundle reale del primo ciclo editoriale;
- verificare score 77, draft eligibility positiva e publication eligibility negativa;
- verificare conteggi, conflitto e warning;
- controllare desktop e mobile;
- confermare che non esistano azioni di approvazione, generazione o pubblicazione.

### 6. Fase successiva

Dopo la verifica reale:

```text
feat/control-room-draft-decisions
```

Scope previsto: draft, preview e decisioni editoriali. Le eventuali mutation richiederanno uno scope separato e conferme esplicite; non vengono introdotte automaticamente nella fase readiness.

## Fuori scope immediato

- valutazione o ricalcolo della readiness;
- approvazione dell'evidence bundle;
- generazione draft;
- modifica claim o fonti;
- mutation della maintenance queue;
- nuovi endpoint o query D1;
- pubblicazione;
- modifiche alla Control Room legacy;
- framework esterni di data quality.

## Checkpoint completati il 21 luglio 2026

### Sessione server-side

- PR #31 mergiata e verificata;
- un solo login Cloudflare Access;
- proxy snapshot read-only;
- nessuna credenziale applicativa nel browser.

### Overview e health

- PR #32 mergiata e verificata;
- metriche, capability, binding, timestamp e guardrail visibili;
- errori parziali e contratti runtime verificati.

### Radar e brief

- PR #34 mergiata e verificata;
- run, segnali e brief visibili;
- filtro run → segnali basato su `run_id`;
- punteggi, flag e nullable preservati;
- nessun linkage segnale → brief inventato.

### Quality gate score zero

- PR #36 mergiata nel commit `2927419`;
- segnale reale con score zero filtrato;
- flag `zero_relevance` visibile;
- conteggi riallineati;
- nessuna modifica automatica a brief o claim.

### Claim, fonti e scadenze

- PR #37 mergiata nel commit `6a71174`;
- CI, deploy e verifica browser completati;
- cinque filtri e dettaglio read-only verificati;
- stato canonico e stato temporale separati;
- fonte ed evidenza distinte;
- payload non validi rifiutati;
- nessuna richiesta browser diversa da `GET`;
- nessuna mutation o pubblicazione.

## Freeze immediato

- niente nuove pagine tramite template string nel Worker;
- niente ampliamenti sostanziali della Control Room legacy;
- browser senza accesso diretto a D1;
- nessuna pubblicazione automatica;
- nessun secret in URL, HTML, JavaScript client, storage, log o repository;
- nessuna mutation nella fase readiness read-only.

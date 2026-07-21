# Prossime azioni

Questa lista contiene soltanto il lavoro immediatamente eseguibile. La roadmap completa vive in `ROADMAP.md`; la migrazione frontend vive in `docs/FRONTEND-PLAN.md`.

Ultimo aggiornamento: **21 luglio 2026**.

## Now

### 1. Chiudere la PR #44 su queue e audit read-only

Branch:

```text
feat/control-room-queue-audit
```

La PR #44 migra nella nuova Control Room la lettura di `queue` e `audit` già presenti nello snapshot aggregato.

Scope implementato e in verifica:

#### Queue

- ID task;
- task type, entity type ed entity key;
- priorità e stato canonico;
- due at;
- attempts e max attempts;
- locked by;
- last error;
- payload JSON normalizzato;
- created at e updated at;
- filtri per stato, task type, entity type e condizione;
- dettaglio accessibile in Sheet.

#### Audit

- domain;
- action;
- actor;
- entity;
- details JSON normalizzati;
- created at;
- filtri per dominio, azione e attore;
- dettaglio accessibile in Sheet.

La prima iterazione resta read-only. Non introduce claim mutation, draft action, gestione operativa della queue, nuovi endpoint o pubblicazione.

### 2. Conservare le separazioni operative

La UI rende esplicito che:

```text
queue status ≠ decisione editoriale
failed task ≠ contenuto non valido
completed task ≠ pagina pubblicata
audit event ≠ autorizzazione operativa
```

Regole:

- stato, tentativi, errori e priorità vengono mostrati come persistiti;
- i riepiloghi locali descrivono soltanto i record restituiti dalla query limitata dello snapshot;
- il client non ricalcola priorità, retry o outcome;
- payload e dettagli audit vengono trattati come JSON opaco validato;
- lo snapshot non espone un ID evento audit né un legame univoco con una versione draft;
- nessun linkage mancante viene ricostruito;
- nessun pulsante retry, complete, dismiss, approve o publish viene introdotto;
- nessuna richiesta browser diversa da `GET` viene aggiunta.

### 3. Definition of Done della PR #44

Prima del merge devono passare:

- TypeScript strict e build Astro;
- migrazioni locali e quality gate invariati;
- build e smoke del Container invariati;
- runtime `workerd` con queue e audit reali;
- smoke Chromium generale;
- smoke claim, readiness e draft invariati;
- smoke dedicato a queue e audit;
- stati queue non ammessi rifiutati;
- tentativi, timestamp, payload e dettagli non conformi rifiutati;
- empty state, filtri, tastiera e mobile;
- nessuna richiesta browser diversa da `GET`;
- nessuna credenziale o accesso diretto a D1;
- nessuna route o azione di retry, completamento, approvazione o pubblicazione;
- nessuna regressione su overview, radar, segnali, brief, claim, readiness e draft.

### 4. Verificare il deploy reale

Dopo il merge:

- aprire `https://senzaroaming.it/control-room-foundation`;
- verificare task reali pending, processing o failed quando presenti;
- verificare tipo, entità, priorità, tentativi, lock, errore e payload;
- verificare eventi audit reali del primo ciclo editoriale;
- controllare dominio, azione, attore, entità, dettagli e timestamp;
- controllare desktop e mobile;
- confermare l’assenza di azioni operative e pubblicazione.

### 5. Fase successiva

Soltanto dopo la parità read-only di queue e audit:

- decidere con scope esplicito se chiudere il gap draft su corpo, provenance e stato pagina;
- progettare eventuali mutation una per branch;
- mantenere approvazione editoriale e pubblicazione come gate separati;
- valutare la rimozione della legacy soltanto dopo parità funzionale verificata.

## Fuori scope immediato

- retry, complete, dismiss o modifica dei task;
- avvio Workflow dalla nuova UI;
- generazione o rigenerazione draft;
- approvazione o richiesta modifiche draft;
- modifica claim, fonti o evidence bundle;
- estensione di endpoint o query D1;
- pubblicazione;
- modifiche alla Control Room legacy;
- migrazione del sito pubblico.

## Checkpoint completati il 21 luglio 2026

### Sessione server-side

- PR #31 verificata;
- un solo login Access;
- proxy snapshot read-only;
- nessuna credenziale applicativa nel browser.

### Overview e health

- PR #32 verificata;
- metriche, capability, binding, timestamp e guardrail visibili;
- errori parziali e contratti runtime verificati.

### Radar e brief

- PR #34 verificata;
- run, segnali e brief visibili;
- filtro run → segnali basato su `run_id`;
- nessun linkage segnale → brief inventato.

### Quality gate score zero

- PR #36 verificata sul dato reale;
- segnale con score zero filtrato;
- flag `zero_relevance` e conteggi riallineati.

### Claim, fonti e scadenze

- PR #37 verificata;
- cinque filtri e dettaglio read-only;
- stato canonico e stato temporale separati;
- fonte ed evidenza distinte.

### Page Readiness ed evidence bundle

- PR #39 e hotfix #40 verificate;
- quattro gate distinti;
- warning strutturati reali visibili;
- fixture aderente al payload canonico;
- nessuna mutation o pubblicazione.

### Draft, preview e decisioni

- PR #42 mergiata nel commit `856da79`;
- CI #157 completamente verde;
- deploy e verifica browser reale completati;
- draft `2`, versione `2`, renderer `editorial-page-draft-v2` e stato `approved` visibili;
- bundle `1`, readiness `77` e publication eligibility negativa separati;
- revisore, note, claim usati ed esclusi visibili;
- gap su corpo, provenance e stato pagina dichiarato senza deduzioni;
- nessuna mutation, generazione o pubblicazione.

## Freeze immediato

- niente nuove pagine tramite template string nel Worker;
- niente ampliamenti sostanziali della Control Room legacy;
- browser senza accesso diretto a D1;
- nessuna pubblicazione automatica;
- nessun secret in URL, HTML, JavaScript client, storage, log o repository;
- nessuna mutation nella fase queue e audit read-only.

# Prossime azioni

Questa lista contiene soltanto il lavoro immediatamente eseguibile. La roadmap completa vive in `ROADMAP.md`; la migrazione frontend vive in `docs/FRONTEND-PLAN.md`.

Ultimo aggiornamento: **21 luglio 2026**.

## Now

### 1. Avviare la fase draft, preview e decisioni

Branch prevista:

```text
feat/control-room-draft-decisions
```

Obiettivo esclusivo iniziale: migrare nella nuova Control Room la lettura completa dei draft, della preview e delle decisioni editoriali già persistite.

La prima iterazione resta read-only. Non introduce approvazione, rigenerazione, mutation, nuovi endpoint o pubblicazione.

### 2. Leggere il contratto canonico prima del codice

Prima di modificare la UI, verificare nel backend e nello snapshot:

- record draft completo e campi nullable;
- evidence bundle collegato;
- versione e renderer;
- stato canonico del draft;
- contenuto strutturato e metadati SEO disponibili;
- claim usati ed esclusi;
- provenance per campi, sezioni e FAQ;
- autore, note di revisione, errore e timestamp;
- eventuale pagina materializzata e relativo stato;
- decisioni editoriali e audit già esposti.

Non inventare linkage o semantiche mancanti. Se un dato necessario non è nello snapshot, fermare lo scope frontend e documentare il gap prima di cambiare il backend.

### 3. Conservare le separazioni editoriali

La UI deve rendere esplicito che:

```text
approved draft ≠ published page
review draft    ≠ publication eligibility
editorial approval ≠ publication action
```

Regole:

- lo stato del draft resta distinto dallo stato della pagina;
- un draft approvato può restare materializzato in `review`;
- provenance e claim esclusi non vengono nascosti;
- errori e contenuti nullable vengono mostrati senza dati sostitutivi;
- il client non ricalcola score, gate o decisioni;
- nessun pulsante di pubblicazione viene introdotto.

### 4. Vista read-only prevista

La nuova sezione deve includere, soltanto quando supportato dal contratto reale:

- elenco draft con pagina, versione, renderer e stato;
- collegamento a evidence bundle e brief;
- preview dei campi principali;
- dettaglio del contenuto strutturato;
- claim usati ed esclusi;
- provenance leggibile;
- note di revisione ed eventuali errori;
- stato della pagina materializzata separato;
- filtri utili e dettaglio accessibile;
- empty state reale, contratto invalido, desktop, mobile e tastiera.

### 5. Definition of Done della fase read-only

Prima del merge devono passare:

- TypeScript strict e build Astro;
- migrazioni locali e quality gate invariati;
- build e smoke del Container invariati;
- runtime `workerd` con draft reale;
- smoke Chromium generale;
- smoke Chromium claim e readiness invariati;
- smoke dedicato a draft e preview;
- contratti non conformi rifiutati;
- nessuna richiesta browser diversa da `GET`;
- nessuna credenziale o accesso diretto a D1;
- nessuna route o azione di approvazione, generazione o pubblicazione;
- nessuna regressione su overview, radar, segnali, brief, claim e readiness.

### 6. Verifica reale dopo il merge

Dopo il deploy:

- aprire `https://senzaroaming.it/control-room-foundation`;
- verificare il draft reale del primo ciclo editoriale;
- verificare versione `2` e renderer `editorial-page-draft-v2`;
- verificare stato draft `approved` e pagina materializzata ancora `review`;
- verificare claim usati, esclusi e provenance;
- controllare desktop e mobile;
- confermare che non esistano azioni di generazione, approvazione operativa o pubblicazione.

### 7. Fase successiva

Soltanto dopo la parità read-only dei draft:

```text
feat/control-room-queue-audit
```

Le eventuali mutation editoriali richiedono branch separate, contratti espliciti, autorizzazione e conferme accessibili. Non vengono incluse automaticamente nella migrazione read-only.

## Fuori scope immediato

- generazione o rigenerazione draft;
- approvazione o rifiuto tramite nuova UI;
- materializzazione di nuove pagine;
- modifica claim, fonti o evidence bundle;
- mutation della maintenance queue;
- nuovi endpoint o query D1 senza gap documentato e scope esplicito;
- pubblicazione;
- modifiche alla Control Room legacy;
- migrazione del sito pubblico.

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

### Page Readiness ed evidence bundle

- PR #39 e hotfix #40 mergiate;
- CI completa, deploy e verifica browser completati;
- score 77, draft eligibility positiva e publication eligibility negativa visibili;
- quattro gate distinti;
- conteggi, conflitto, warning strutturati e zero first-party tests visibili;
- fixture riallineata al payload canonico;
- warning non conformi rifiutati;
- nessuna richiesta browser diversa da `GET`;
- nessuna mutation o pubblicazione.

## Freeze immediato

- niente nuove pagine tramite template string nel Worker;
- niente ampliamenti sostanziali della Control Room legacy;
- browser senza accesso diretto a D1;
- nessuna pubblicazione automatica;
- nessun secret in URL, HTML, JavaScript client, storage, log o repository;
- nessuna mutation nella prima fase draft read-only.

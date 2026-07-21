# Prossime azioni

Questa lista contiene soltanto il lavoro immediatamente eseguibile. La roadmap completa vive in `ROADMAP.md`; la migrazione frontend vive in `docs/FRONTEND-PLAN.md`.

Ultimo aggiornamento: **21 luglio 2026**.

## Now

### 1. Chiudere la PR #42 su draft e decisioni read-only

Branch:

```text
feat/control-room-draft-decisions
```

La PR sostituisce la preview ridotta dell’ultimo draft con un inventario delle versioni e delle decisioni di revisione già presenti nello snapshot.

Scope implementato:

- pagina, versione, renderer e stato canonico del draft;
- evidence bundle e brief collegati tramite ID persistiti;
- title e H1 esposti dallo snapshot;
- claim usati ed esclusi;
- generatore, revisore, data di revisione e note;
- errore e timestamp;
- filtri per stato, renderer e presenza di revisione;
- dettaglio accessibile desktop e mobile;
- guardrail esplicito tra approvazione editoriale e pubblicazione.

### 2. Conservare le separazioni editoriali

La UI deve continuare a mostrare:

```text
approved draft ≠ published page
review draft ≠ publication eligibility
editorial approval ≠ publication action
```

Regole:

- lo stato `approved` appartiene al draft;
- publication eligibility arriva dall’evidence bundle e resta separata;
- lo stato della pagina materializzata non viene dedotto;
- il client non ricalcola score, gate o decisioni;
- nessun pulsante di approvazione, rigenerazione o pubblicazione viene introdotto.

### 3. Rendere visibile il gap del contratto corrente

Lo snapshot aggregato non espone:

- corpo strutturato completo;
- FAQ e fonti del draft;
- provenance field-level del renderer v2;
- stato della pagina materializzata;
- audit collegato univocamente a una specifica versione del draft.

Questi dati esistono nel backend tramite endpoint o tabelle già presenti, ma la PR #42 non cambia API, proxy o query. La UI dichiara il gap e non ricostruisce dati mancanti.

Una fase successiva potrà scegliere fra:

1. estendere esplicitamente lo snapshot aggregato;
2. aggiungere un proxy GET-only dedicato sotto Access;
3. mantenere il gap finché non serve parità completa.

La scelta richiederà scope backend esplicito e una decisione architetturale documentata.

### 4. Definition of Done della PR #42

Prima del merge devono passare:

- TypeScript strict e build Astro;
- migrazioni locali e quality gate invariati;
- build e smoke del Container invariati;
- runtime `workerd` con array draft reale;
- smoke Chromium generale;
- smoke claim e readiness invariati;
- smoke dedicato a draft e decisioni;
- stati draft non ammessi rifiutati;
- array claim e timestamp non conformi rifiutati;
- empty state, filtri, tastiera e mobile;
- nessuna richiesta browser diversa da `GET`;
- nessuna credenziale o accesso diretto a D1;
- nessuna route o azione di generazione, approvazione o pubblicazione;
- nessuna regressione su overview, radar, segnali, brief, claim e readiness.

### 5. Verificare il deploy reale

Dopo il merge:

- aprire `https://senzaroaming.it/control-room-foundation`;
- verificare il draft reale `2`;
- verificare versione `2` e renderer `editorial-page-draft-v2`;
- verificare stato draft `approved`;
- verificare bundle `1`, readiness `77` e publication eligibility negativa;
- verificare revisore, note, claim usati ed esclusi;
- verificare che lo stato pagina sia indicato come non disponibile nello snapshot, non dedotto;
- controllare desktop e mobile;
- confermare l’assenza di azioni operative.

### 6. Fase successiva

Soltanto dopo la verifica reale della PR #42:

```text
feat/control-room-queue-audit
```

Queue e audit resteranno inizialmente read-only. Le mutation editoriali richiederanno branch separate, contratti espliciti, autorizzazione e conferme accessibili.

## Fuori scope immediato

- generazione o rigenerazione draft;
- approvazione, richiesta modifiche o rifiuto tramite nuova UI;
- materializzazione di pagine;
- estensione di endpoint o query D1 nella PR #42;
- modifica claim, fonti o evidence bundle;
- mutation della maintenance queue;
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

## Freeze immediato

- niente nuove pagine tramite template string nel Worker;
- niente ampliamenti sostanziali della Control Room legacy;
- browser senza accesso diretto a D1;
- nessuna pubblicazione automatica;
- nessun secret in URL, HTML, JavaScript client, storage, log o repository;
- nessuna mutation nella fase draft read-only.

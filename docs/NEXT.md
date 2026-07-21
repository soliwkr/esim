# Prossime azioni

Questa lista contiene soltanto il lavoro immediatamente eseguibile. La roadmap completa vive in `ROADMAP.md`; la migrazione frontend vive in `docs/FRONTEND-PLAN.md`.

Ultimo aggiornamento: **21 luglio 2026**.

## Now

### 1. Chiudere la PR #36 — Zero relevance gate

Branch:

```text
fix/research-zero-relevance-gate
```

Problema osservato in produzione:

```text
query/topic: Holafly recent experiences
titolo: esperienza a uno spettacolo di Shane Gillis ad Austin
relevance_score: 0
eligible_for_editorial: 1
```

Il record è un falso positivo. Il gate storico filtrava duramente soltanto date vecchie o future e trattava tutta la bassa rilevanza come warning consultivo.

Correzione autorizzata:

- `relevance_score = 0` diventa condizione bloccante;
- il record riceve `zero_relevance`;
- gli oggetti esistenti vengono riallineati con una migrazione D1;
- gli override umani deliberati restano validi e auditabili;
- `0 < relevance_score < 0,35` resta consultivo;
- `relevance_score IS NULL` non viene filtrato automaticamente.

### 2. Verificare migrazione e regressione

Prima del merge devono passare:

- TypeScript strict e build Astro;
- tutte le migrazioni locali, inclusa `0018_research_zero_relevance_gate.sql`;
- smoke D1 con il falso positivo osservato;
- conferma che il record con score `0` sia filtered;
- conferma che un record con score `0,2` resti eligible;
- conteggi `eligible_count` e `filtered_count` corretti;
- Container, `workerd` e Chromium invariati;
- nessuna regressione su Access, Control Room o publication gate.

### 3. Verificare il backfill in produzione

Dopo il merge e il deploy:

- il segnale #11 non deve più risultare `eligible`;
- deve apparire tra i segnali filtrati;
- deve mostrare il flag `zero_relevance`;
- il run di origine deve avere conteggi riallineati;
- nessun brief o claim esistente viene modificato automaticamente.

Il backfill corregge eligibility e conteggi. Non cancella record e non annulla decisioni editoriali già persistite.

### 4. Riprendere claim, fonti e scadenze

Subito dopo la verifica della PR #36:

```text
feat/control-room-claims-sources
```

Scope già approvato:

- claim e brief collegato;
- soggetto, campo, testo e domanda di verifica;
- stato canonico, evidence e note;
- tipo di fonte, etichetta, URL e trust level;
- verification status, confidence, checked at e valid until;
- task status;
- stato temporale della scadenza separato dallo stato canonico;
- filtri e dettaglio read-only.

## Fuori scope della PR #36

- classificatore semantico o LLM nel quality gate;
- framework esterni di data quality;
- topic matching euristico generalizzato;
- avvio Workflow o nuovo run automatico;
- cancellazione dei segnali filtrati;
- modifica di brief, claim, readiness o draft;
- nuovi endpoint;
- mutation o pubblicazione.

Uno spike su strumenti come Evidently o Cleanlab potrà essere valutato dopo aver raccolto un dataset revisionato. Non è necessario per correggere l'invariante deterministico osservato.

## Checkpoint completati il 21 luglio 2026

### Sessione server-side

- PR #31 mergiata e verificata;
- un solo login Cloudflare Access;
- proxy snapshot read-only;
- nessuna credenziale applicativa nel browser;
- API originale invariata.

### Overview e health

- PR #32 mergiata e verificata;
- 19 metriche, capability, binding, timestamp e guardrail visibili;
- errori parziali e contratti runtime verificati;
- nessuna mutation o pubblicazione.

### Radar e brief

- PR #34 mergiata e verificata;
- run, segnali e brief visibili;
- filtro run → segnali basato su `run_id`;
- punteggi, flag e nullable preservati;
- nessun linkage segnale → brief inventato;
- desktop, mobile e tastiera verificati;
- nessuna mutation o pubblicazione.

## Freeze immediato

- niente nuove pagine tramite template string nel Worker;
- niente ampliamenti sostanziali della Control Room legacy;
- browser senza accesso diretto a D1;
- nessuna pubblicazione automatica;
- nessun secret in URL, HTML, JavaScript client, storage, log o repository;
- niente prosecuzione della migrazione claim finché il backfill quality gate non è verificato in produzione.

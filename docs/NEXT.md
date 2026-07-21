# Prossime azioni

Questa lista contiene soltanto il lavoro immediatamente eseguibile. La roadmap completa vive in `ROADMAP.md`; la migrazione frontend vive in `docs/FRONTEND-PLAN.md`.

Ultimo aggiornamento: **21 luglio 2026**.

## Now

### 1. Aprire la fase claim, fonti e scadenze

Branch prevista:

```text
feat/control-room-claims-sources
```

Obiettivo esclusivo: migrare in sola lettura i claim e i relativi dati di fonte, verifica, scadenza e task già presenti nello snapshot protetto.

La fase non modifica backend, D1, Workflow, Container, AI, gate editoriali o contratti API.

### 2. Mostrare i claim reali

La vista deve mostrare:

- ID e brief collegato;
- soggetto, campo e testo del claim;
- domanda di verifica;
- stato canonico;
- evidence e note;
- source kinds richiesti.

La UI non deve trasformare un claim `insufficient`, `pending` o scaduto in un fatto utilizzabile.

### 3. Mostrare le fonti

Per ogni claim, quando presenti:

- tipo di fonte;
- etichetta;
- URL;
- trust level;
- provenienza distinta dall’evidenza testuale.

Una fonte ufficiale resta una dichiarazione attribuita e non diventa automaticamente un test indipendente.

### 4. Mostrare verifica e scadenza

Mostrare:

- verification status;
- confidence;
- checked at;
- valid until;
- task status;
- stato temporale derivato della data: assente, valida o scaduta.

Lo stato temporale è soltanto una presentazione della data. Non sostituisce e non riscrive lo stato canonico del claim.

### 5. Aggiungere filtri e dettaglio

Filtri previsti:

- stato claim;
- brief;
- tipo di fonte;
- verifica;
- scadenza.

Il dettaglio resta read-only e deve essere utilizzabile da tastiera e su mobile.

### 6. Estendere i contratti runtime

Validare esplicitamente i campi claim necessari alla vista, inclusi valori nullable e array `required_source_kinds`.

Un record non conforme deve produrre un errore leggibile, non dati incompleti o ricostruiti.

### 7. Definition of Done

Prima del merge devono passare:

- TypeScript strict e build Astro;
- migrazioni locali senza modifiche allo schema;
- build e smoke del Container invariati;
- bundle reale dentro `workerd`;
- snapshot reale con claim e campi di fonte/verifica;
- Chromium desktop e mobile;
- filtri, Sheet, tastiera e focus;
- loading, error, contratto invalido ed empty state;
- nessuna richiesta browser diversa da `GET`;
- nessuna route o azione di pubblicazione;
- nessuna regressione su overview, radar, segnali, brief e draft preview.

## Fuori scope immediato

- decomposizione o modifica dei claim;
- verifica, dismiss o refresh manuale;
- creazione o modifica delle fonti;
- mutation della maintenance queue;
- nuovi endpoint o query D1;
- readiness, approvazione draft o pubblicazione;
- modifiche alla Control Room legacy.

Le azioni operative saranno introdotte soltanto in branch separate, con scope esplicito, conferme accessibili, audit e guardrail invariati.

## Checkpoint completati il 21 luglio 2026

### Sessione server-side

- PR #31 mergiata e verificata;
- un solo login Cloudflare Access;
- proxy snapshot read-only;
- nessuna credenziale applicativa nel browser;
- API originale invariata.

### Overview e health

- PR #32 mergiata con CI completa verde;
- deploy e verifica manuale completati;
- 19 metriche, capability, binding, timestamp e guardrail visibili;
- errori parziali e contratti runtime verificati;
- nessuna mutation o pubblicazione.

### Radar e brief

- PR #34 mergiata nel commit `53f8b8f`;
- CI completa verde;
- deploy e verifica manuale nel browser reale completati;
- run, segnali e brief visibili;
- filtro run → segnali basato su `run_id`;
- punteggi, flag e nullable preservati;
- nessun collegamento segnale → brief inventato;
- desktop, mobile e tastiera verificati;
- nessuna mutation o pubblicazione.

## Freeze immediato

- niente nuove pagine tramite template string nel Worker;
- niente nuovi componenti generici scritti a mano;
- niente ampliamenti sostanziali della Control Room legacy;
- browser senza accesso diretto a D1;
- backend editoriale, claim, evidence bundle e gate invariati;
- nessuna pubblicazione automatica;
- nessun bypass pubblico della policy Access;
- nessun secret in URL, HTML, JavaScript client, storage, log o repository.

## Dopo la Control Room

1. migrare il sito pubblico ad Astro;
2. collegare Search Console e sitemap;
3. configurare CMP, GTM e GA4;
4. definire il dizionario canonico degli eventi;
5. attivare OpenSEO e trend intelligence;
6. attivare affiliazioni controllate.

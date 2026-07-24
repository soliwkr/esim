# Prossime azioni

Ultimo aggiornamento: **24 luglio 2026**.

Questa lista contiene soltanto il lavoro immediatamente eseguibile.

## Now

### 1. Chiudere lo scope M5.6

Branch:

```text
docs/public-catalog-pilot-scope
```

Documento:

```text
docs/PUBLIC-CATALOG-PILOT-SCOPE.md
```

Obiettivo esclusivo:

```text
read-only candidate audit
+ maximum four release candidates
+ versioned manifest
+ no publication mutation
```

Decisioni già definite:

- candidate, release candidate e published sono stati distinti;
- una release candidate resta `pages.status='review'`;
- il pilot può contenere da zero a quattro entry;
- nessun Paese, dispositivo o provider viene scelto prima dell’audit reale;
- latest bundle, publication eligibility, approvazione umana e latest approved draft sono obbligatori;
- provenance, freshness e coerenza draft/pagina sono obbligatorie;
- slug riservati, file probe e collisioni vengono esclusi;
- intenti duplicati o cannibalizzanti vengono esclusi;
- la pagina Cina non è candidata automaticamente;
- la foundation non introduce `review → published`;
- nessun deploy o cutover.

La PR di scope modifica soltanto documentazione canonica.

### 2. Implementare M5.6a dopo il merge dello scope

Branch tecnica autorizzata:

```text
feat/public-catalog-pilot-foundation
```

Output previsto:

```text
src/public-catalog-pilot.ts
data/public-catalog-pilot.json
scripts/smoke-public-catalog-pilot.mjs
```

I nomi finali possono cambiare soltanto se la struttura reale del repository richiede un’alternativa più semplice.

La foundation deve includere:

- modello tipizzato server-only;
- query o adapter read-only sui dati editoriali;
- candidate report con ammessi, esclusi, blocker e warning;
- manifest schema e validazione;
- massimo quattro entry;
- latest bundle e draft validation;
- publication eligibility e approvazioni persistite;
- coerenza tra brief, bundle, draft, provenance e pagina;
- freshness runtime;
- collisioni di slug e intento;
- fixture eligible, ineligible, stale, superseded, duplicate ed empty;
- nessuna mutation D1;
- nessun endpoint pubblico;
- nessuna pubblicazione.

### 3. Acceptance M5.6a

Sul medesimo head finale:

- tipi Cloudflare;
- typecheck e build;
- migrazioni D1 invariate;
- quality gate e golden evaluation;
- Container build e smoke;
- regressioni preview;
- canonical renderer parity;
- sitemap/robots parity;
- candidate audit fixtures;
- manifest validation;
- tutte le suite Control Room.

Deve inoltre essere dimostrato:

```text
active matrix invariata
pages published create/update count = 0
publication endpoint count = 0
public deploy count = 0
```

### 4. Audit dei dati reali soltanto dopo la foundation

L’audit operativo deve leggere:

- brief reali;
- evidence bundle reali;
- claim e scadenze;
- draft approvati;
- pagine materializzate in review;
- intenti e slug.

Possibili risultati:

```text
0 candidate → blocker report, nessuna forzatura
1–4 candidate → manifest reale
>4 candidate → selezione motivata, nessuna espansione del cap
```

Non viene creato lavoro editoriale fittizio soltanto per riempire il pilot.

### 5. Tenere separata la pubblicazione

Dopo che esistono release candidate reali, serve una decisione esplicita:

```text
pubblicare sul legacy prima del cutover
OR
pubblicare insieme a M5.7
OR
pubblicare dopo M5.7
```

La mutation `review → published` richiede:

- branch separata;
- identità verificata;
- conferma esplicita;
- state machine D1;
- audit append-only;
- idempotenza;
- freshness recheck;
- rollback/deindicizzazione;
- test end-to-end;
- autorizzazione dell’utente.

## Checkpoint chiusi

### M5.5a — SEO contract

```text
PR #69
merge 46f1d66a591dd7860c101c86cb8295d97e4a2106
```

### M5.5b.1 — Route policy

```text
PR #71
merge bd51faddddbb54647c22c3361dd04c5bc65e7681
CI finale #329
```

### M5.5b.2 — Canonical Astro parity

```text
PR #73
merge b3a6625bfe6e3a06a46412e58f89a033dc82b9ff
CI finale #350
```

### M5.5b.3 — Sitemap e robots parity

```text
PR #75
merge 8d52e7e316d632dcda0d5bb45b818a490df9fef6
CI finale #365
```

Legacy e Astro condividono builder, output e fallimento chiuso. Ownership live ancora backend.

## Track M4 parallela

```text
conversione brief
→ operazioni claim
→ decisione draft
→ eventuale retry queue
```

Ogni mutation richiede Access, conferma, state machine, audit, idempotenza, reload e test end-to-end.

## Google measurement ancora bloccato

```text
CMP
→ Consent Mode
→ dizionario eventi
→ GTM
→ GA4
→ Search Console / sitemap
→ verifica dati reali
```

Nessuna credenziale Google entra nel repository o nel frontend.

## Verifiche operative aperte

- header HTTP live delle preview;
- linkage claim → task nel browser reale;
- linkage audit → ID/versione draft nel browser reale;
- topic-mismatch sul primo run autorizzato;
- redirect `www → apex` definitivo;
- nessun Workflow avviato soltanto per creare dati di test.

## Freeze immediato

- niente pubblicazione automatica;
- niente endpoint o pulsante publish in M5.6a;
- niente scelta anticipata di Paesi o provider;
- niente generazione massiva;
- niente accesso browser a D1;
- niente secret o PII nel client, URL, manifest, log o repository;
- niente affiliazioni o tracking anticipati;
- niente cambio della matrice attiva prima di M5.7;
- niente Search Console submission;
- niente cutover dell’apice;
- nessuna rimozione legacy finché resta un fallback operativo.

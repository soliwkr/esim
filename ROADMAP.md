# Senza Roaming — Roadmap

Ultimo aggiornamento: **6 agosto 2026**.

Questa è la roadmap canonica di `soliwkr/esim`. Lo storico dettagliato vive nel versionamento Git e nei documenti risultato.

## Principi non negoziabili

1. L'AI non pubblica direttamente.
2. Brief, claim, readiness, draft, materializzazione e pubblicazione sono gate distinti.
3. I fatti commerciali richiedono fonti identificabili e data di verifica.
4. Claim insufficienti, contraddetti o scaduti non alimentano testo fattuale.
5. `partial` e `unknown` restano stati reali; non diventano completezza o `false`.
6. Il browser non accede direttamente a D1.
7. Ogni mutation richiede identità verificata, state machine, audit e test.
8. Astro è il frontend pubblico principale; React resta confinato alle island realmente interattive.
9. Preview, release candidate e `published` restano distinti.
10. Eventi e KPI vengono definiti prima dell'attivazione analytics.
11. Tracking non essenziale soltanto con il consenso previsto.
12. GitHub è la memoria canonica del progetto.
13. Domanda SEO e monetizzazione non autorizzano claim senza evidence.
14. L'infrastruttura non deve diventare un fine separato da traffico, utilità e revenue.

---

## M0 — Fondazioni tecniche

**Stato: completato salvo checkpoint `www → apex`.**

- custom Cloudflare Worker;
- D1 e migration versionate;
- apex domain;
- Workflows, Container, AI Gateway;
- API protette;
- deploy production manual-only;
- nessuna migration/mutation D1 implicita nel deploy.

## M1 — Qualità e osservabilità

**Stato: quality gate operativo.**

- documentazione canonica;
- audit/run history;
- freshness;
- relevance zero deterministica;
- golden evaluation;
- topic-mismatch gate.

## M2 — Motore AI editoriale

**Stato: nucleo v1 operativo.**

- recent demand;
- brief strutturati;
- claim atomici / fonti / verifiche;
- AI Gateway + Vertex;
- nessuna pubblicazione automatica.

## M3 — Readiness e draft grounded

**Stato: completato e verificato.**

- Page Readiness;
- evidence bundle;
- review eligibility separata da publication eligibility;
- draft grounded con provenance field-level;
- primo draft approvato senza pubblicazione automatica.

## M4 — Control Room definitiva

**Stato: read-only completo; mutation residue aperte.**

Completati:

- Astro shell + React island + shadcn/ui;
- Cloudflare Access / JWT origin validation;
- browser senza maintenance token;
- parità read-only;
- prime mutation con audit;
- catalog pilot audit privato.

Residuo:

```text
brief conversion
→ claim operations
→ draft decisions
→ eventuale retry queue
→ rimozione legacy privata dopo parità necessaria
```

M4 non blocca il First Euro pubblico.

## M5 — Frontend pubblico Astro

**Stato: completato e verificato live.**

- homepage, listing, trust pages e renderer articolo;
- preview namespaced noindex/no-store;
- metadata / Open Graph / JSON-LD;
- route policy e cutover apex;
- sitemap e robots;
- published-only routing;
- API, `/go/*`, Control Room ed execution plane preservati;
- responsive / keyboard / overflow smoke.

## M6 — Misurazione e indicizzazione

**Stato: foundation live e ricertificata.**

- iubenda CMP;
- Consent Mode Basic;
- GTM + GA4 consent-gated;
- zero Google requests senza consenso Misurazione;
- Search Console collegata;
- sitemap inviata una volta;
- exporter GSC read-only;
- production recovery e safety contract;
- deploy `workflow_dispatch` only.

Stato:

```text
GA4: live
GTM: live
Ads: disabled
affiliate tracking: disabled
```

GSC iniziale:

```text
2026-07-24: 1 impression
clicks: 0
```

---

## M7 — Intelligence SEO, Demand e First Euro

**Stato: foundation + First Euro map mergiate; demand expansion in corso.**

### M7.0 — SEO foundation

**Completata.**

- Keyword Planner originale: 1.623 keyword uniche;
- ownership iniziale;
- cannibalization baseline;
- title/H1/promise baseline;
- internal-linking baseline;
- homepage, hub e `/migliore-esim` riallineati;
- GSC read-only disponibile.

La foundation **non equivale a SEO completata**.

### M7.1 — First Euro Demand Intelligence

**PR #111 mergiata.**

Contratto:

```text
search demand
→ cluster ownership
→ money-page priority
→ SERP differentiation
→ evidence requirements
→ first commercial slice
```

Output versionati:

- corpus Planner completo;
- long-tail priority universe;
- SERP competitor snapshot;
- question expansion da SERP / FAQ provider / community;
- top 20 execution order;
- cannibalization v2;
- internal linking v2;
- `/migliore-esim` brief;
- `/esim-europa` brief;
- search-to-social angle bank.

Decisione:

```text
#1 /migliore-esim   → first existing-URL money slice
#2 /esim-europa     → first new evidence-native money page
```

`/esim-iphone` è un forte traffic feeder.

### M7.1b — Autocomplete A–Z + PAA / related

**Gate corrente — draft PR #113.**

Collector riproducibile:

```text
Serper /autocomplete
→ seed + base + a…z

Serper /search
→ PAA / related quando esposti
→ organic SERP shape
```

Prima capture reale:

```text
17 seed
476 request
3659 autocomplete rows
2829 query uniche
153 organic rows
0 errors
```

PAA/related IT nella capture corrente:

```text
peopleAlsoAsk=0
relatedSearches=0
```

Diagnostic separato:

```text
US control relatedSearches=8
US control PAA=0
Italian P0 PAA/related=0
```

Regola: zero resta zero. Nessuna domanda sintetica viene rinominata PAA.

Nuovi segnali:

- hotspot = forte problem/setup feeder;
- USA = voice/local-number requirement;
- Europe = unlimited/duration/data/voice dimensions;
- Airalo/Holafly = intent separation confermata;
- iPhone = model/compatibility feeder.

### M7.2 — Search-to-Social Content Engine

**Dopo la prima money page, test bounded.**

```text
query / SERP question
→ money page
→ verified fact
→ hook / tension / twist
→ short / video / carousel
→ human review
→ publish manuale
→ click / comment / branded search
→ new demand candidates
```

Principi:

- social deriva dalla stessa evidence della pagina;
- community/aneddoti alimentano domanda/sentiment, non performance truth;
- HeyGen/Hyperframes o equivalenti sono execution tools, non fonti;
- niente social auto-publish nella prima slice.

### M7.3 — Consumer-first public surfaces

Dopo la prima money slice riallineare:

```text
/
/destinazioni
/confronti
```

Da:

```text
foundation/dev-facing copy
```

A:

```text
destinazione
→ giorni
→ dati
→ hotspot
→ decision page / money page
```

Metodo/governance restano trust assets su `/metodo` e `/trasparenza`.

---

## Evidence Truth Engine — track parallela

**Stato: design + schema local-only completati.**

Completati:

```text
#103 source universe
#104 immutable snapshot spike
#105 claims coverage
#106 Italy evidence pack
#107 Europe evidence pack
#108 D1 mapping design
#109 canonical closeout
#110 upstream evidence D1 schema foundation
```

Schema versionato:

```text
0021_evidence_upstream_storage.sql
```

Tabelle:

```text
evidence_capture_runs
evidence_snapshots
evidence_field_observations
evidence_claim_candidates
```

**D1 remoto resta a `0020`.**

Prossimi gate:

```text
source reconciliation / onboarding
→ idempotent importer
→ explicit remote 0021 apply
→ controlled ingest
→ verification provenance bridge
```

Non costruire un terzo exploratory evidence pack senza un nuovo blocker strutturale.

---

## M8 — Monetizzazione controllata

**Stato: non attiva; partner application in parallelo.**

Obiettivo:

```text
first verified money page
→ first affiliate redirect
→ first attributed sale
→ first euro
```

Provider partner iniziali:

```text
Airalo
Holafly
Ubigi
```

Prima di `AFFILIATE_MODE=enabled`:

1. almeno una money page consumer-ready;
2. claim commerciali bounded e fresh;
3. programma affiliate approvato;
4. partner redirect/config validata;
5. disclosure chiara;
6. `provider_redirect_intent` measurement design;
7. privacy/consent recheck;
8. secret/config fuori dal repository;
9. deploy production manuale autorizzato;
10. live smoke redirect + disclosure.

Revenue scoring viene dopo dati reali.

## M9 — Crescita e manutenzione

**Stato: successivo alla prima vertical slice misurata.**

- weekly demand loop;
- GSC opportunities/query 8–20;
- refresh fonti scadute;
- commercial drift monitoring;
- content refresh;
- expansion dei cluster con impressions/click/revenue;
- pSEO soltanto dopo prova di qualità;
- espansione internazionale dopo stabilità italiana.

---

## Ordine operativo corrente

### Track A — Traffic & Money

```text
close #113 A–Z/PAA enrichment
→ preview-first /migliore-esim consumer rewrite
→ bounded commercial materialization
→ affiliate/measurement gate
→ explicit production deploy
→ /esim-europa
→ M7.2 search-to-social test
```

### Track B — Truth Engine

```text
source reconciliation
→ importer
→ explicit remote 0021
→ controlled ingest
→ verification provenance
```

### Track C — Operations

```text
M4 mutation residue
+ GSC/GA4 observation
+ www redirect checkpoint
```

Track A e B procedono in parallelo e si incontrano sui fatti pubblicabili della money page.

## Stop conditions

Non fare adesso:

- mass pSEO;
- crawler fleet senza necessità;
- terzo evidence pack esplorativo senza blocker;
- ranking/provider winner universale;
- affiliate activation senza disclosure/evidence/measurement;
- remote migration implicita;
- deploy automatico;
- social publishing autonomo;
- FX implicito;
- claim performance da community anecdotes.

Il prossimo valore deve essere misurabile come:

```text
impression
→ click
→ affiliate redirect
→ sale
→ revenue
```

senza abbassare il livello di verità commerciale.

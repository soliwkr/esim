# Senza Roaming — Roadmap

Ultimo aggiornamento: **6 agosto 2026**.

Questa è la roadmap canonica di `soliwkr/esim`. Lo storico dettagliato delle singole fasi resta nel versionamento Git e nei documenti risultato.

## Documenti operativi

- `ROADMAP.md` — milestone e criteri di uscita;
- `docs/STATUS.md` — stato verificato;
- `docs/NEXT.md` — lavoro immediato;
- `docs/ARCHITECTURE.md` — confini tecnici;
- `docs/DECISIONS.md` — decisioni architetturali accettate;
- `docs/FRONTEND-PLAN.md` — piano frontend;
- `docs/M7-FIRST-EURO-DEMAND-INTELLIGENCE.md` — demand/first-money track;
- `docs/MEASUREMENT-CONSENT-SCOPE.md` — scope privacy/measurement;
- `docs/MEASUREMENT-EVENT-DICTIONARY.md` — eventi e parametri canonici.

## Principi non negoziabili

1. L'AI non pubblica direttamente.
2. Brief, claim, readiness, draft, materializzazione e pubblicazione sono gate distinti.
3. I fatti commerciali richiedono fonti identificabili e data di verifica.
4. Claim insufficienti, contraddetti o scaduti non alimentano testo fattuale.
5. `partial` e `unknown` restano stati reali; non vengono trasformati in completezza o `false`.
6. Il browser non accede direttamente a D1.
7. Ogni mutation richiede identità verificata, state machine, audit e test.
8. Astro è il frontend pubblico principale; React resta confinato alle island realmente interattive della Control Room.
9. Preview, release candidate e pagina `published` restano distinti.
10. Eventi e KPI vengono definiti prima dell'attivazione analytics.
11. Nessun tracking non essenziale parte prima del consenso previsto.
12. Il repository è la memoria canonica del progetto.
13. Domanda SEO e monetizzazione non autorizzano claim senza evidence; allo stesso tempo l'infrastruttura non deve diventare un fine separato dal traffico e dalla revenue.

---

## M0 — Fondazioni tecniche

**Stato: completato, salvo checkpoint `www → apex`.**

Completati:

- custom Cloudflare Worker;
- D1 e migration versionate;
- dominio apex;
- Workflows, Container e AI Gateway;
- API protette;
- deploy production manual-only;
- nessuna migration/mutation D1 implicita nel deploy;
- vere 404 / noindex dove richiesto.

Aperto:

- ricontrollo definitivo `www → apex`.

## M1 — Qualità e osservabilità

**Stato: quality gate operativo.**

Completati:

- documentazione canonica;
- audit e run history;
- freshness;
- relevance zero deterministica;
- golden evaluation;
- topic-mismatch gate.

Aperti:

- osservabilità aggregata;
- eventuale verifica live aggiuntiva topic-mismatch quando necessaria.

## M2 — Motore AI editoriale

**Stato: nucleo v1 operativo.**

Completati:

- recent demand e segnali;
- brief strutturati;
- claim atomici / fonti / verifiche;
- AI Gateway + Vertex AI;
- nessuna pubblicazione automatica.

Aperti:

- deduplicazione semantica storica;
- trust/evaluation evoluti solo se dimostrano valore.

## M3 — Readiness e draft grounded

**Stato: completato e verificato.**

- Page Readiness;
- evidence bundle versionato;
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

Aperti su branch separate:

```text
brief conversion
→ claim operations
→ draft decisions
→ eventuale retry queue
→ rimozione legacy privata dopo parità necessaria
```

M4 non blocca il first-money path pubblico.

## M5 — Frontend pubblico Astro

**Stato: completato e verificato live.**

Completati:

- homepage, listing, trust pages e renderer articolo;
- preview `/astro-foundation*` noindex/no-store;
- metadata / Open Graph / JSON-LD;
- route policy e cutover apex;
- sitemap e robots;
- published-only routing;
- API, `/go/*`, Control Room ed execution plane preservati;
- responsive, keyboard e overflow smoke.

Il frontend pubblico resta content-first e non diventa una SPA generale.

## M6 — Misurazione e indicizzazione

**Stato: foundation live e ricertificata.**

Completati:

- iubenda CMP;
- Consent Mode Basic;
- GTM e GA4 consent-gated;
- zero Google requests senza consenso alla Misurazione;
- Search Console collegata;
- sitemap canonica inviata una volta;
- exporter GSC read-only;
- production recovery e safety contract;
- deploy production `workflow_dispatch` only.

Stato corrente:

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

Nessuna Indexing API e nessuna submission ripetuta senza motivo.

---

## M7 — Intelligence SEO, Demand e First Euro

**Stato: foundation live; M7.1 in corso.**

### M7.0 — SEO foundation

**Completata.**

- Keyword Planner originale: 1.623 keyword uniche;
- keyword ownership iniziale;
- cannibalization baseline;
- title/H1/promise baseline;
- internal-linking baseline;
- homepage, hub e `/migliore-esim` riallineati;
- Search Console read-only disponibile.

La foundation **non equivale a SEO completata**.

### M7.1 — First Euro Demand Intelligence

**Gate corrente — draft PR #111.**

Obiettivo:

```text
search demand
→ cluster ownership
→ money-page priority
→ SERP differentiation
→ evidence requirements
→ first commercial slice
```

Output richiesti/attuali:

- lettura reale del corpus Planner completo;
- long-tail priority universe;
- SERP competitor snapshot;
- question/PAA/FAQ/community expansion;
- top 10–20 execution order;
- cannibalization v2;
- internal linking v2;
- first-money brief `/migliore-esim`;
- first-new-page brief `/esim-europa`;
- search-to-social angle bank;
- GSC feedback loop quando il dataset diventa sostanziale.

Decisione iniziale:

```text
#1 /migliore-esim   → first existing-URL money slice
#2 /esim-europa     → first new evidence-native money page
```

Il corpus completo mostra inoltre forte domanda device/compatibility: `/esim-iphone` viene trattata come traffic feeder, non come money page primaria.

### M7.2 — Search-to-Social Content Engine

**Successivo alla prima money page, con test bounded.**

Target:

```text
query / SERP question
→ money page
→ verified fact
→ hook / tension / twist
→ short / video / carousel
→ human review
→ publish
→ click / comment / branded search
→ new demand candidates
```

Principi:

- contenuto social deriva dalla stessa evidence della pagina;
- community/aneddoti alimentano domanda e sentiment attribution, non performance truth;
- tool come HeyGen/Hyperframes sono mezzi di produzione, non fonti;
- nessuna pubblicazione social automatica nella prima slice.

### M7.3 — Consumer-first public surfaces

Dopo la prima money slice:

```text
/
/destinazioni
/confronti
```

vengono riallineate da foundation/dev-facing copy a superfici orientate a:

```text
destinazione
→ giorni
→ dati
→ hotspot
→ decision page / money page
```

Metodo, governance e provenance restano trust assets su `/metodo` e `/trasparenza`.

---

## Evidence Truth Engine — track parallela a M7

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

Prossimi gate, separati:

```text
source reconciliation / onboarding
→ idempotent importer
→ explicit remote 0021 apply
→ controlled ingest
→ verification provenance bridge
```

Non costruire un terzo exploratory evidence pack salvo nuovo blocker strutturale.

---

## M8 — Monetizzazione controllata

**Stato: non ancora attiva; preparazione partner in corso.**

Obiettivo iniziale:

```text
first verified money page
→ first affiliate redirect
→ first attributed sale
→ first euro
```

Percorsi affiliate ufficiali identificati per:

```text
Airalo
Holafly
Ubigi
```

Le application possono procedere in parallelo a M7.1/Truth Engine.

Prima di `AFFILIATE_MODE=enabled` devono esistere:

1. almeno una money page consumer-ready;
2. claim commerciali bounded e fresh;
3. programma affiliate approvato;
4. partner redirect/config validata;
5. disclosure chiara;
6. `provider_redirect_intent` measurement design;
7. privacy/consent recheck;
8. secret/config fuori dal repository;
9. deploy production manuale autorizzato;
10. live smoke di redirect e disclosure.

Revenue scoring e ottimizzazione vengono dopo dati sufficienti, non prima del primo euro.

## M9 — Crescita e manutenzione

**Stato: successivo alla prima vertical slice misurata.**

- weekly demand loop;
- GSC opportunities e query 8–20;
- refresh fonti scadute;
- commercial drift monitoring;
- content refresh;
- expansion dei cluster che dimostrano impressions/click/revenue;
- pSEO soltanto dopo prova di qualità e differenziazione;
- espansione internazionale dopo stabilità italiana.

---

## Ordine operativo corrente

### Track A — Traffic & Money

```text
close #111 M7.1
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

I track A e B procedono in parallelo e si incontrano sui fatti pubblicabili della money page.

## Stop conditions

Non fare adesso:

- mass pSEO;
- crawler fleet senza necessità;
- un terzo evidence pack esplorativo senza blocker;
- ranking/provider winner universale;
- affiliate activation senza disclosure/evidence/measurement;
- remote migration implicita;
- deploy automatico;
- social publishing autonomo;
- conversione FX implicita;
- claim performance da community anecdotes.

Il prossimo valore deve essere misurabile in termini di:

```text
impression
→ click
→ affiliate redirect
→ sale
→ revenue
```

senza abbassare il livello di verità commerciale.

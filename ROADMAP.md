# Senza Roaming — Roadmap

Ultimo aggiornamento: **8 agosto 2026**.

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

**Stato: demand intelligence completata; First Money UI pronta come preview; Truth Engine pronto al gate remoto `0021`.**

### M7.0 — SEO foundation

**Completata.**

- Keyword Planner: 1.623 keyword uniche;
- ownership iniziale;
- cannibalization baseline;
- title/H1/promise baseline;
- internal-linking baseline;
- homepage, hub e `/migliore-esim` riallineati;
- GSC read-only disponibile.

La foundation non equivale a monetizzazione live.

### M7.1 — First Euro Demand Intelligence

**Completata con PR #111 e #113.**

```text
search demand
→ cluster ownership
→ money-page priority
→ SERP differentiation
→ evidence requirements
→ first commercial slice
```

Decisione:

```text
#1 /migliore-esim   → first existing-URL money slice
#2 /esim-europa     → first new evidence-native money page
```

`/esim-iphone` resta traffic feeder.
`/esim-hotspot` resta problem/setup feeder.

### M7.1c — First Money UI `/migliore-esim`

**PR #117 mergiata.**

Preview:

```text
/astro-foundation/articoli/migliore-esim
```

Struttura:

```text
destinazione
→ giorni
→ dati
→ hotspot
→ scenario
→ evidence slots
→ FAQ/obiezioni
→ supporting guides
```

Verifiche:

```text
CI #626: success
Visual Capture #5: success
desktop/mobile review: completata
CI post-merge #627: success
```

La canonical `/migliore-esim` resta invariata.

La preview non contiene link affiliate `/go/*`, provider ranking/winner, claim provider-specifici non verificati, publication mutation o deploy.

I facts commerciali sono il punto di convergenza con la Truth Engine.

### M7.2 — Search-to-Social Content Engine

**Dopo la prima money page materializzata, test bounded.**

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

### M7.3 — Consumer-first public surfaces

Dopo la prima money slice riallineare:

```text
/
/destinazioni
/confronti
```

Metodo/governance restano trust assets su `/metodo` e `/trasparenza`.

---

## Evidence Truth Engine — track parallela

**Stato: source reconciliation + onboarding production + importer local/fixture chiusi; prossimo gate `0021` remoto separato.**

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
#119 fail-closed source reconciliation
#121 target source_registry read-only verification
#122 local idempotent source onboarding gate
remote run 31205724615 production source onboarding 9/9
#124 idempotent evidence importer local/fixture
```

### Upstream schema

Schema versionato/local-tested:

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

### Source reconciliation / onboarding — chiuso

```text
2 evidence pack
12 source references
9 reconciliation identities
8 unique production registry identities
```

Contratto:

```text
sourceAuditKey + canonical URL + provider/source role
→ exactly one active approved source_registry row
```

Fail closed:

```text
0 match  → source_not_registered
>1 match → source_registry_ambiguous
```

Nessun auto-registration, provider-root fallback, redirect auto-remap o ID D1 environment-specific versionato.

Production onboarding autorizzato e verificato:

```text
run:                  31205724615
registry rows before: 7
approved inserts:     8
registry rows after:  15
resolved:             9/9
missing:              0
ambiguous:            0
```

Verifica read-only indipendente:

```text
verified_at: 2026-08-07T18:11:04.432Z
readyForImporter: true
```

Documento risultato:

```text
docs/research/EVIDENCE-SOURCE-REGISTRY-REMOTE-ONBOARDING-RESULT-2026-08-07.md
```

### Importer idempotente local/fixture — PR #124

Contratto:

```text
approved pack + immutable artifacts
→ resolved environment source IDs
→ evidence_capture_runs
→ evidence_snapshots
→ evidence_field_observations
→ pending evidence_claim_candidates
```

CI tecnica #651 ha provato su D1 locale isolato:

```text
Italy first:  1 run / 6 snapshot / 9 observation / 4 candidate
Europe first: 1 run / 6 snapshot / 9 observation / 4 candidate
Totale:       2 / 12 / 18 / 8

exact rerun:
0 run / 0 snapshot / 0 observation / 0 candidate
```

Guardrail provati:

- artifact hash e candidate content-address fail-closed;
- source resolution fail-closed;
- `unknown|not_applicable` non diventano candidate;
- `partial` resta bounded;
- EUR/USD source-native preservati;
- provenance multi-source preservata;
- `source_registry`, `claim_verifications`, `plans` invariati;
- `--remote` rifiutato.

Documento risultato:

```text
docs/research/EVIDENCE-PACK-IMPORTER-LOCAL-RESULT-2026-08-08.md
```

### Gate corrente — explicit remote `0021`

```text
read-only remote preflight
→ explicit remote 0021 authorization
→ migration apply
→ migration/schema verification
```

La migration remota non è autorizzata dal source onboarding né dal checkpoint importer.

Gate successivi:

```text
explicit remote 0021
→ separately authorized controlled evidence ingest
→ post-ingest audit
→ verification provenance bridge
→ bounded commercial fact materialization
```

Non costruire un terzo exploratory evidence pack senza un nuovo blocker strutturale.

---

## M8 — Monetizzazione controllata

**Stato: non attiva; First Money UI pronta come preview; Truth Engine local importer chiuso.**

Obiettivo:

```text
first verified money page
→ first affiliate redirect
→ first attributed sale
→ first euro
```

Provider iniziali:

```text
Airalo
Holafly
Ubigi
```

Percorso corrente:

```text
source gate 9/9 ✅
local/fixture importer ✅
→ explicit remote 0021
→ controlled evidence ingest
→ verified commercial facts
→ canonical /migliore-esim
→ affiliate + measurement gate
→ explicit production deploy
→ first affiliate click
```

Prima di `AFFILIATE_MODE=enabled`:

1. First Money UI con facts bounded/fresh/verificati;
2. programma affiliate approvato/config disponibile;
3. partner redirect/config validata;
4. disclosure chiara;
5. `provider_redirect_intent` measurement design;
6. privacy/consent recheck;
7. secret/config fuori dal repository;
8. `AFFILIATE_MODE` change esplicito;
9. deploy production manuale autorizzato;
10. live smoke redirect + disclosure.

Canonical cutover, affiliate activation e deploy restano gate separati.

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
First Money preview merged
→ await bounded verified commercial facts
→ canonical /migliore-esim cutover
→ affiliate/measurement gate
→ explicit production deploy
→ first affiliate click
→ /esim-europa
```

### Track B — Truth Engine

```text
source reconciliation ✅
→ source onboarding production 9/9 ✅
→ importer local/fixture ✅
→ explicit remote 0021
→ controlled ingest
→ verification provenance
→ facts per First Money UI
```

### Track C — Operations

```text
M4 mutation residue
+ GSC/GA4 observation
+ www redirect checkpoint
```

Track A e B si incontrano sui fatti pubblicabili della money page.

## Stop conditions

Non fare adesso:

- mass pSEO;
- crawler fleet senza necessità;
- terzo evidence pack esplorativo senza blocker;
- ranking/provider winner universale;
- affiliate activation senza disclosure/evidence/measurement;
- remote `0021` senza nuova autorizzazione esplicita;
- controlled evidence ingest remoto senza scope/autorizzazione separati;
- deploy automatico;
- social publishing autonomo;
- FX implicito;
- claim performance da community anecdotes.

Il prossimo valore deve restare misurabile come:

```text
impression
→ click
→ affiliate redirect
→ sale
→ revenue
```

senza abbassare il livello di verità commerciale.

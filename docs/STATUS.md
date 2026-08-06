# Stato del progetto

Data di riferimento: **6 agosto 2026**.

Questo documento fotografa lo stato operativo reale di Senza Roaming. Lo storico dettagliato resta nel versionamento Git e nei documenti risultato delle singole milestone.

## Stato sintetico

| Area | Stato | Nota |
|---|---|---|
| Dominio principale | Operativo | `https://senzaroaming.it` serve Astro |
| Dominio `www` | Da ricontrollare | redirect implementato; checkpoint definitivo ancora aperto |
| Worker | Operativo | un solo custom Worker; deploy production manual-only |
| D1 remoto | Operativo fino a `0020` | `0021` è versionata nel repository ma **non applicata al remoto** |
| Workflow / Container / AI | Operativi | recent-demand, Container e AI Gateway già verificati |
| Ciclo editoriale | Operativo fino al draft approvato | nessuna pubblicazione autonoma dell'AI |
| Control Room nuova | Operativa | read-only completo + prime mutation; legacy ancora fallback |
| Frontend pubblico Astro | Live | homepage, hub, trust pages, articoli published-only, sitemap/robots |
| M7 SEO foundation | Live | ownership e on-page baseline applicate |
| M7.1 First Euro | Draft research #111 | demand intelligence, money-page priority e search-to-social in corso |
| Evidence packs | Verificati live | Italy #106 + Europe #107, due capture ciascuno |
| Upstream evidence D1 | Schema locale versionato | #108 design + #110 `0021` schema local-only |
| Search Console | Collegata | 1 impression osservata il 24 luglio; dataset ancora troppo piccolo |
| CMP / GTM / GA4 | Live e consent-gated | Basic Consent Mode ricertificato |
| Affiliazioni | Disabilitate nel sito | application Airalo/Holafly/Ubigi in preparazione; `AFFILIATE_MODE=disabled` |
| Google Ads / remarketing | Disabilitati | fuori scope |

## Main corrente

Ultimo merge verificato:

```text
PR #110 — upstream evidence D1 schema foundation
merge/main: df938858cdfe1f34a7560bf7d49c363222ece8c4
CI main #592: success
```

PR #110 ha introdotto nel repository la migration versionata:

```text
migrations/0021_evidence_upstream_storage.sql
```

con tabelle:

```text
evidence_capture_runs
evidence_snapshots
evidence_field_observations
evidence_claim_candidates
```

Verificato localmente:

- CHECK/FK/JSON constraints;
- coverage state `observed | partial | unknown | not_applicable`;
- immutabilità di run/snapshot/observation;
- candidate eligibility soltanto da evidence supportata;
- local + regional fixture;
- source-native EUR/USD;
- nessuna mutation di `source_registry`, `claim_verifications` o `plans` v1.

**Il D1 remoto resta a `0020`.** Nessuna remote migration o ingest è stato eseguito.

## Architettura live

```text
Cloudflare Assets
  ├── /_astro/* → static assets
  └── /*         → custom Worker
                       ├── Astro pubblico
                       ├── Astro + React island Control Room
                       ├── backend/API/provider redirects
                       ├── D1
                       ├── Workflows / Container
                       └── AI Gateway → Vertex AI
```

Il browser non accede direttamente a D1. API, `/go/*`, legacy Control Room ed execution plane restano backend-owned.

## Frontend pubblico — problema commerciale attuale

Il sito è tecnicamente live e indicizzabile, ma il prodotto pubblico non è ancora money-ready.

Stato reale:

- homepage e hub hanno struttura UX/SEO valida;
- parte del copy racconta ancora workflow, ownership e gate interni più del problema del viaggiatore;
- `/migliore-esim` è live ma provider-neutral e senza CTA affiliate;
- affiliazioni e provider redirect measurement commerciale restano disabilitati;
- le prime money page specialistiche non sono ancora pubblicate.

La prossima trasformazione pubblica è quindi:

```text
foundation/dev-facing copy
→ consumer-first decision surfaces
→ verified commercial facts
→ affiliate CTA con disclosure e measurement bounded
```

## M7.1 — First Euro Demand Intelligence

Draft PR corrente:

```text
PR #111 — M7.1: start first-euro demand intelligence
branch: research/m7-first-euro-demand-intelligence
```

La ricerca ha già acquisito:

- il workbook Keyword Planner originale con **1.623 keyword uniche**;
- baseline #95 e page ownership esistente;
- Search Console live via GSC Wizard;
- SERP competitor italiane e internazionali recenti;
- provider/affiliate official surfaces;
- question expansion da SERP, FAQ e community;
- cannibalization v2;
- internal linking v2;
- search-to-social angle bank;
- page brief `/migliore-esim`;
- page brief `/esim-europa`;
- execution order 1→20.

Checkpoint GSC osservato:

```text
2026-07-24: impressions=1, clicks=0
query+page rows utili: 0
```

Il dataset GSC è troppo piccolo per governare la roadmap. Resta feedback loop futuro, non fonte primaria della priorità attuale.

### Ordine first-money attuale

Le prime decisioni della #111 sono:

```text
1  /migliore-esim
2  /esim-europa
3  /codice-sconto-holafly
4  /airalo-recensioni
5  /airalo-vs-holafly
6  /esim-usa
7  /esim-egitto
8  /esim-giappone
9  /esim-turchia
10 /esim-albania
```

L'ordine completo 1→20 vive in:

```text
research/seo/m7-first-euro-execution-order.csv
```

`/esim-iphone` entra come forte traffic feeder, non come money page primaria.

### Primo URL monetizzabile

`/migliore-esim` è il percorso più rapido perché:

- esiste già ed è published;
- Planner primary `migliore esim` è nel bucket 5.000;
- il cluster baseline è commerciale;
- può ricevere scenario cards e CTA senza creare una nuova route;
- Italy/Europe evidence permette bounded use cases, ma non un winner universale.

### Prima nuova money page

`/esim-europa` è la prima nuova pagina evidence-native perché:

- la SERP è commercialmente attiva;
- il pack Europa #107 esiste già per Airalo/Holafly/Ubigi;
- coverage, validity, data model, FUP, hotspot, activation e source-native currency sono già state modellate;
- il vantaggio previsto non è catalogue breadth, ma scenario + provenance + freshness + `partial/unknown` espliciti.

## Evidence supply chain

Contratto verificato:

```text
source_registry
→ evidence_capture_runs
→ immutable evidence snapshots
→ deterministic field observations
→ pending evidence candidates
→ verification / conflict / freshness
→ evidence bundle
→ Page Readiness
→ grounded page
→ separate human publication gate
```

### Verificato live

```text
#104 immutable snapshot spike
#106 Italy local pack
#107 Europe regional pack
```

Italy e Europe sono state catturate due volte con raw identity distinta e semantic fingerprint stabile.

Regole invarianti:

- missing evidence != false;
- `partial` non diventa completezza;
- aggregate country count non prova country membership;
- source-native price non viene convertito implicitamente;
- hotspot allowed e share limit restano separati;
- technology != measured performance;
- source URL/prezzo/raw hash non sono plan identity;
- ranking non viene calcolato dal layer evidence.

## Gate truth-engine successivo

Dopo il merge della #111, il prossimo gate tecnico è **source reconciliation / onboarding**:

```text
pack sourceAuditKey + canonical URL + provider/source role
→ exactly one approved source_registry row
```

Fail closed:

```text
0 match  → source_not_registered
>1 match → source_registry_ambiguous
```

Soltanto dopo:

```text
idempotent importer
→ controlled remote schema apply (gate separato)
→ controlled ingest
→ verification provenance bridge
```

Non costruire un crawler o un terzo exploratory evidence pack salvo un nuovo blocker strutturale.

## Monetizzazione — stato

Il sito resta:

```text
AFFILIATE_MODE=disabled
affiliate tracking=disabled
```

Sono stati verificati percorsi affiliate ufficiali per Airalo, Holafly e Ubigi. L'utente sta aprendo le relative application mentre #111 prosegue.

Affiliate activation richiederà separatamente:

- account/provider approval;
- partner links/config riservata;
- disclosure pubblica;
- redirect destination validation;
- `provider_redirect_intent` measurement scope;
- privacy/consent recheck;
- explicit production deploy.

Nessun partner ID, token o secret viene versionato.

## Search-to-Social

M7.1 definisce un futuro M7.2:

```text
search demand
→ money page
→ verified fact
→ creative angle
→ short / carousel / video
→ human review
→ publish
→ click/comment/branded search
→ new demand candidates
```

L'AI può produrre draft creativi. Non pubblica autonomamente e non può trasformare aneddoti community in performance truth.

## Production e measurement

Pipeline production invariata:

```text
workflow_dispatch
→ fail-closed preflight
→ npm run deploy
→ D1 binding read-only
→ no implicit remote migration
→ live smoke
```

Measurement attuale:

```text
CMP: iubenda
Consent Mode: Basic
GTM: live
GA4: live
Ads: disabled
affiliate event: not active
```

## Checkpoint aperti

- chiudere e mergeare #111 dopo final CI;
- source reconciliation / onboarding;
- affiliate application result Airalo/Holafly/Ubigi;
- first-money implementation di `/migliore-esim`;
- prima nuova page `/esim-europa` dopo bounded evidence materialization;
- consumer-first rewrite di homepage/hub;
- provider redirect measurement + affiliate gate separati;
- ricontrollo definitivo `www → apex`;
- osservazione GSC/GA4 con dati più maturi.

## Freeze

- niente deploy implicito;
- niente remote migration implicita;
- niente importer prima di source reconciliation;
- niente auto-registration fonti;
- niente FX implicito;
- niente `unknown → false/0/[]`;
- niente provider winner universale;
- niente pubblicazione autonoma AI;
- niente affiliate secrets nel repository;
- niente token operativi negli URL;
- niente mass pSEO prima della prima vertical slice misurata.

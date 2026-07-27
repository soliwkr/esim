# Stato del progetto

Data di riferimento: **27 luglio 2026**.

Questo documento fotografa lo stato operativo reale di Senza Roaming.

## Stato sintetico

| Area | Stato | Nota |
|---|---|---|
| Dominio principale | Operativo | `https://senzaroaming.it` serve Astro |
| Dominio `www` | Da ricontrollare | redirect implementato, checkpoint definitivo aperto |
| Worker e D1 | Operativi | un solo custom Worker; D1 remoto fino a `0020` |
| Workflow e Container | Operativi | ciclo recent-demand verificato end-to-end |
| AI Gateway e Vertex AI | Operativi | percorso AI controllato |
| Ciclo editoriale | Operativo fino al draft approvato | nessuna pubblicazione automatica |
| Control Room nuova | Operativa | read-only completo; prima mutation live |
| Control Room legacy | Transitoria | fallback delle mutation residue |
| Frontend pubblico Astro | Live | M5.7 chiusa e verificata |
| Sitemap e robots | Live | endpoint Astro raggiungibili |
| Catalog pilot | Audit live completato | 1 candidate, 0 eligible, 0 selected |
| iubenda CMP | Live | consenso, persistenza e revoca verificati |
| Google access | Verificato | GA4, GTM e Search Console via service account impersonato |
| Search Console | Collegata | proprietà dominio verificata e sitemap inviata |
| GTM container M6 | Pubblicato | versione 2, 7 variabili, 1 trigger, 1 tag |
| GTM e GA4 produzione | Attivi post-consenso | zero richieste Google prima del consenso Misurazione |
| Google Ads e remarketing | Disabilitati | fuori scope M6 |
| Affiliazioni | Disabilitate | nessun tracking o link remunerato attivo |

## Architettura live

```text
Cloudflare Assets
  ├── /_astro/* → asset statici
  └── /*         → custom Worker
                       ├── Astro pubblico
                       ├── Astro shell + React island Control Room
                       ├── backend/API/redirect provider
                       ├── D1
                       ├── Workflows e Container
                       └── AI Gateway → Vertex AI
```

Astro possiede home, listing, trust pages, articoli published-only, sitemap, robots, 404, preview e shell Control Room. API, `/go/*`, legacy privata ed execution plane restano backend-owned.

## M5 — frontend pubblico

```text
PR #81 — apex cutover
merge e62b570248bf97afaa3f283cfbb847ceea01f529
CI finale #404

PR #82 — live closeout
merge 6735a05515c2155eb990a9315d6168d111b9261c
CI #406
```

Verificato live:

- homepage con nuovo design;
- articolo `/migliore-esim`;
- listing e trust pages;
- `/sitemap.xml`;
- `/robots.txt`;
- redirect `/go/airalo`;
- navigazione e rendering operativi.

La homepage e i listing sono fondazioni visuali e di catalogo, non ancora il risultato di una keyword map SEO definitiva.

## Catalog pilot

```text
candidateCount: 1
eligibleCount: 0
selectedCount: 0
excludedCount: 1
```

La candidate `esim-cina-senza-vpn` resta:

```text
page status: review
publication eligible: false
ready for publication: false
```

Il manifest pubblico resta vuoto.

## M6 — Consent e measurement live

Contratti:

```text
Consent Mode Basic
nessun GTM o GA4 prima del consenso
nessun ping Google pre-consenso
ad_storage denied
ad_user_data denied
ad_personalization denied
```

Advanced Consent Mode, cookieless pings, Google Ads, remarketing e affiliate tracking restano fuori scope.

### CMP

```text
PR #85 — remote embed reale
merge f421d247e5a2ce250ba432e445f2aedf74af6f50

PR #90 — deploy osservabile e contratto D1 production
merge c29bf0cf31a66bf830cb74a7cf46d57a7f060c76
CI #448
```

Verificato live:

- un solo embed iubenda sulle route canoniche;
- CMP assente da preview e route tecniche;
- banner reale;
- rifiuto, consenso, persistenza e revoca;
- finalità `4` — Misurazione;
- nessuna richiesta Google quando `purpose 4=false`.

### Google access

```text
GA4 account: 402095950
GA4 property: 546858987
GA4 stream: 15310040016
Measurement ID: G-GWJ9YPPVJW

GTM account: 6367654517
GTM container: 259190865
GTM public ID: GTM-W3LSK9RZ

Search Console: sc-domain:senzaroaming.it
permission: siteOwner
```

Autenticazione tramite impersonazione del service account e ADC; nessuna key JSON creata o versionata.

### GTM e GA4 foundation

```text
PR #91
merge 24f473b5de9f714e997c4ddd6e50d77c36c34a29
CI main #468: success
GTM version 2: published
PR deploy #92
merge 9f4ba922c8cbf0682474c98aebb4b8b7ea2e6297
CI deploy #470
PR cleanup #93
merge f9aaf071b69164e81617840fc85d36d507ec710e
CI cleanup #471: success
```

Configurazione pubblicata:

```text
variables: 7
triggers: 1
tags: 1
errors: 0
trigger: CE - sr_page_view_ready
tag: GA4 - page_view - consent gated
event: page_view
oncePerLoad: true
additional consent: analytics_storage
```

Parametri bounded:

```text
page_location
route_class
page_type
content_slug
render_mode
site_language
```

### Deploy e verifica live

Il job di produzione ha completato con successo deploy e verifica server-side. Il run #470 è rosso soltanto perché i due step opzionali di commento PR hanno ricevuto `HTTP 403 — Resource not accessible by integration` dopo il successo del deploy.

Non è stato eseguito alcun retry.

Browser live verificato:

```text
rifiuto:
  purpose 4=false
  bootstrap=false
  Google requests=0

consenso:
  purpose 4=true
  bootstrap=true
  sr_page_view_ready=1
  GTM request=present
  GA4 collect=present

persistenza:
  banner non riproposto
  pageReadyCount=1 per page load
  GTM e GA4 presenti

revoca + reload:
  purpose 4=false
  bootstrap=false
  Google requests=0
```

Contesto homepage verificato:

```text
route_class: home
page_type: home
content_slug: ""
render_mode: canonical
site_language: it
page_location: https://senzaroaming.it/
```

Documenti:

```text
docs/GTM-GA4-FOUNDATION.md
docs/GTM-GA4-CONTAINER-CHECKLIST.md
docs/PUBLIC-MEASUREMENT-DEPLOY-RESULT-2026-07-27.md
```

## Search Console e sitemap

La proprietà dominio è accessibile e la sitemap canonica è stata inviata il 26 luglio 2026:

```text
https://senzaroaming.it/sitemap.xml
```

Non è stata usata la Indexing API. Non ripetere la submission. Le richieste manuali restano rinviate finché homepage, listing e prime pagine prioritarie non sono riallineate a una keyword map e a intenti SEO definitivi.

## Contratto di deploy D1

Il config sorgente conserva:

```text
database_id=REPLACE_WITH_D1_DATABASE_ID
```

`scripts/prepare-production-d1-binding.mjs` risolve il solo database remoto `senza-roaming`, valida UUID e binding e modifica esclusivamente `apps/web/dist/server/wrangler.json`. Nessuna migration o mutation è implicita nel deploy.

## Performance measurement foundation

Lighthouse locale post-consenso in browser pulito:

```text
mobile: Performance 89, FCP 1,7 s, LCP 3,2 s, TBT 170 ms, CLS 0
desktop: Performance 100, FCP 0,7 s, LCP 0,7 s, TBT 20 ms, CLS 0
```

Il carico residuo osservato è principalmente vendor iubenda/GTM. Nessuna ottimizzazione vendor è stata inclusa nella foundation.

## Guardrail invariati

- nessun tracking Google prima del consenso Misurazione;
- nessun analytics nella Control Room o preview;
- nessun Ads, remarketing o affiliazione;
- nessuna PII, token, JWT o ID editoriali negli eventi;
- nessuna mutation o migration D1;
- nessun cambio routing;
- nessuna publication capability;
- nessuna rimozione legacy.

## Gap aperti

- primi dati Search Console e GA4 da osservare senza modifiche premature;
- keyword map e copy SEO di homepage/listing;
- redirect `www → apex` definitivo;
- topic-mismatch sul prossimo run autorizzato;
- mutation M4 residue;
- publication capability separata;
- eventuale rimozione legacy dopo stabilizzazione.

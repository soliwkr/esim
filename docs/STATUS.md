# Stato del progetto

Data di riferimento: **26 luglio 2026**.

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
| iubenda CMP | Live | deploy e boundary server-side verificati; banner confermato nel browser |
| Google access | Verificato | GA4, GTM e Search Console accessibili via service account impersonato |
| Search Console | Collegata | proprietà dominio verificata e sitemap inviata |
| Workspace GTM M6 | Configurato, non pubblicato | 7 variabili, 1 trigger, 1 tag; audit API senza errori |
| GTM e GA4 produzione | Non attivi | foundation in PR draft #91, nessun deploy |
| Affiliazioni | Disabilitate | nessun link remunerato attivo |

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

## M6 — scope e contratti

```text
PR #83 — Define M6 consent and measurement foundation
merge 83f784fccf562a38e48de7fca483f3d56483ccc4
CI #408
```

Contratto:

```text
Consent Mode Basic
nessun GTM o GA4 prima del consenso
nessun ping Google pre-consenso
ad_storage denied
ad_user_data denied
ad_personalization denied
```

Advanced Consent Mode, cookieless pings, Google Ads, remarketing e affiliate tracking restano fuori scope.

Event dictionary v1:

```text
page_view
provider_redirect_intent
consent_update locale/debug
```

`provider_redirect_intent` resta differito finché il `page_view` base non è verificato. Il redirect `/go/{provider}` continua a scrivere in D1 il click effettivo.

## Consent foundation live

```text
PR #84 — spike tecnico
merge 6e3b0047af67219af7429749003d86f36af61237
CI finale #415

PR #85 — remote embed reale
merge f421d247e5a2ce250ba432e445f2aedf74af6f50
CI finale #426

PR #90 — deploy osservabile e contratto D1 production
merge c29bf0cf31a66bf830cb74a7cf46d57a7f060c76
CI finale #448
```

Deploy CMP-only:

```text
workflow run id: 30197982680
result: success
```

Verificato live lato server:

- `/` e `/privacy` contengono esattamente un embed iubenda;
- footer preferenze presente;
- GTM, GA4, Ads e DoubleClick assenti;
- CMP assente da preview, API health, sitemap e robots;
- nessuna migration, mutation D1 o modifica editoriale.

Verificato dall’utente nel browser:

- il banner reale compare e funziona.

Non ancora certificato integralmente:

- persistenza di accettazione e rifiuto;
- riapertura, modifica e revoca;
- GDPR globale e modalità Basic nella configurazione remota;
- rete vendor;
- guasto iubenda;
- tastiera, mobile, overflow e performance sul vendor reale.

## Contratto di deploy D1

Il config sorgente conserva:

```text
database_id=REPLACE_WITH_D1_DATABASE_ID
```

`scripts/prepare-production-d1-binding.mjs` risolve il solo database remoto `senza-roaming`, valida UUID e binding e modifica esclusivamente il config Worker compilato. Nessuna migration o mutation è implicita nel deploy.

## Google access verificato

Documento:

```text
docs/GOOGLE-MEASUREMENT-ACCESS-RESULT-2026-07-26.md
```

Autenticazione:

```text
info@trovatemi.it
→ roles/iam.serviceAccountTokenCreator sul solo service account
→ senza-roaming@soliwkr.iam.gserviceaccount.com
→ Application Default Credentials tramite impersonazione
```

Nessuna chiave privata JSON è stata creata o versionata.

Identificativi verificati tramite API:

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

## Search Console e sitemap

La proprietà dominio è accessibile e la sitemap canonica è stata inviata manualmente il 26 luglio 2026:

```text
https://senzaroaming.it/sitemap.xml
```

Il valore iniziale `0 pagine rilevate` non viene trattato come errore. Non è stata usata la Indexing API e non vengono ripetute submission.

Le richieste manuali di indicizzazione sono rinviate finché homepage, listing e prime pagine prioritarie non sono riallineate a una keyword map e a intenti SEO definitivi.

## PR #91 — GTM e GA4 foundation

```text
branch: feat/public-gtm-ga4-foundation
PR: #91 draft
CI: verde
production deploy: non autorizzato
GTM container publish: non eseguito
```

Implementato sulla branch:

- `GTM_ID` e `GA4_MEASUREMENT_ID` validati fail-closed;
- script GTM emesso soltanto sulle route canoniche indexable;
- script inerte `type=text/plain` prima del consenso;
- classificazione iubenda `data-iub-purposes="4"`;
- nessun fallback GTM `noscript`;
- un solo `dataLayer` e guard anti-duplicazione;
- evento tecnico locale `sr_page_view_ready`;
- contesto bounded;
- `page_location = origin + pathname`;
- preview, Control Room, API, `/go/*`, sitemap, robots, 404 e probe esclusi;
- preparazione deterministica del config compilato con `GTM-W3LSK9RZ` e `G-GWJ9YPPVJW`;
- smoke pure, workerd e Chromium;
- Privacy condizionale aggiornata.

## Workspace GTM M6

Workspace verificato:

```text
workspace ID: 3
name: M6 - Consent-gated GA4 foundation
errors: 0
variables: 7
triggers: 1
tags: 1
```

Risorse:

```text
trigger ID 10: CE - sr_page_view_ready
tag ID 11: GA4 - page_view - consent gated
tag type: gaawe
event: page_view
measurement ID: {{DLV - sr_ga4_measurement_id}}
tag firing option: oncePerLoad
additional consent: analytics_storage
```

Parametri evento:

```text
page_location
route_class
page_type
content_slug
render_mode
site_language
```

Non sono presenti trigger All Pages, History Change o Click. Non sono presenti Ads, Floodlight, remarketing, affiliate o Custom HTML. Il container non è stato pubblicato e la produzione non è cambiata.

## Stato produzione measurement

```text
CMP iubenda: attiva
GTM: non attivo
GA4: non attivo
Ads: non attivi
affiliate tracking: non attivo
```

## Guardrail invariati

- nessun analytics nella Control Room o preview;
- nessun Ads, remarketing o affiliazione;
- nessuna PII, token, JWT o ID editoriali negli eventi;
- nessuna mutation o migration D1;
- nessun cambio routing;
- nessuna publication capability;
- nessuna rimozione legacy.

## Gap aperti

- Consent Overview nel workspace GTM;
- ambiente applicativo locale o preview Cloudflare esplicitamente autorizzato;
- Tag Assistant, Network e DebugView;
- verifica rifiuto, consenso, reload e revoca;
- un solo `page_view` reale;
- performance post-consenso;
- decisione vendor finale iubenda;
- keyword map e copy SEO di homepage/listing;
- primi dati Search Console;
- redirect `www → apex` definitivo;
- topic-mismatch sul prossimo run autorizzato;
- mutation M4 residue;
- publication capability separata;
- eventuale rimozione legacy dopo stabilizzazione.

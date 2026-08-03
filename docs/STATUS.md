# Stato del progetto

Data di riferimento: **3 agosto 2026**.

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
| M7 on-page foundation | Live | homepage e tre hub riallineati alla keyword ownership |
| M7 `/migliore-esim` | Live | ponte legacy slug-bound e guida decisionale senza ranking |
| Sitemap e robots | Live | endpoint Astro raggiungibili |
| Catalog pilot | Audit live completato | 1 candidate, 0 eligible, 0 selected |
| Evidence supply chain | Coverage audit in closeout | source universe chiuso; snapshot live Ubigi verificato; 54 provider×field rows; nessun provider ancora comparison-ready |
| iubenda CMP | Live e ricertificata | ripristinata dopo la regressione M7 #62; reject/grant/reload/revoke verificati nel browser reale |
| Google access | Verificato | GA4, GTM e Search Console via service account impersonato |
| Search Console | Primo export live verificato | 26–27 luglio: 0 click, 0 impression, dati freschi incompleti |
| GTM container M6 | Pubblicato | versione 2, 7 variabili, 1 trigger, 1 tag |
| GTM e GA4 produzione | Live e consent-gated | ripristinati; `page_view` reale e zero Google dopo revoca verificati |
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

Homepage, listing e `/migliore-esim` includono il riallineamento M7 pubblicato automaticamente dal run di deploy #62 sul merge commit `abfe7e331435ed05660bcece005f7105232644c8`.

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

## Evidence supply chain — Source Universe, snapshot e Claims Coverage

La PR #103 ha chiuso il Source Universe Audit e ha ricondotto le fonti/provider e i tool già studiati al contratto upstream senza introdurre un secondo source system.

La PR #104 ha implementato e verificato il primo spike tecnico su una sola pagina pubblica Ubigi:

```text
SOURCE
→ immutable EVIDENCE SNAPSHOT
→ deterministic field extraction
→ NORMALIZED DATUM
→ PENDING CLAIM CANDIDATE
```

Prima cattura reale:

```text
source: Ubigi Italy 50GB / 30 days
HTTP: 200
locale: en-GB
country context: IT
currency context: USD
fields: data_gb, validity_days, price
all candidates: pending
D1 writes: none
```

Il prezzo `US$29` resta `price { amount: 29, currency: USD }` con warning `downstream_price_eur_mapping_required`; non viene promosso a `price_eur`. `validity_days=30` conserva `activation_trigger_out_of_scope` perché l'H1 non prova il trigger di attivazione.

I tre locator verso l'H1 sono stati riprodotti contro lo snapshot reale.

Seconda cattura reale:

```text
raw snapshot: changed
semantic fingerprint: unchanged
Semantic changes: 0
```

Questo verifica sul provider reale il confine `page/raw drift ≠ commercial fact drift`.

Bake-off opzionale:

```text
Trafilatura: 2.2.0
50GB retained verbatim: true
30 days retained verbatim: true
US$29 retained verbatim: true
```

Trafilatura resta helper/benchmark offline, non dependency canonica e non source-of-truth. Nessun crawler, scheduler, change monitor, Partner API credential, maintenance queue integration o deploy è stato introdotto.

Documento risultato:

```text
docs/research/EVIDENCE-SNAPSHOT-SPIKE-RESULT-2026-08-03.md
```

### Claims Coverage Audit

La PR #105 è il closeout read-only della copertura necessaria alle prime pagine commerciali.

Output:

```text
docs/research/claims-field-catalog.md
docs/research/claims-source-candidates.csv
docs/research/claims-coverage-matrix.csv
docs/research/CLAIMS-COVERAGE-AUDIT.md
```

Stato audit:

```text
providers: Airalo, Holafly, Ubigi
coverage rows: 54 provider×field
runtime changes: none
D1 writes/migrations: none
provider credentials: none
ranking: none
publication: none
deploy: none
```

Conclusioni:

- fonti ufficiali adatte esistono già per gran parte del core commerciale;
- solo Ubigi possiede al momento tre core field verificati tramite snapshot canonico;
- Airalo e Holafly hanno superfici ufficiali identificate ma non ancora snapshot-canonicalizzate;
- nessun provider è ancora comparison-ready come row completa e simmetrica;
- prezzo/valuta richiedono capture context comune o futura derivazione FX esplicita; `price_eur` non viene inferito;
- hotspot allowed e share limit/period devono restare separati;
- unlimited e FUP devono restare distinti ma collegati;
- Airalo activation resta exact-package;
- network/operator e radio technology non dimostrano performance reale;
- refund richiede scenario/effective-date e può avere conflict fra fonti ufficiali;
- compatibility richiede exact model + hardware region; carrier lock resta user-state;
- performance e routing/VPN restano unsupported come claim propri automatici senza protocollo osservativo.

Il prossimo gate è un **Italy comparison evidence pack** read-only: stessa destinazione, tre provider, uno scenario decisionale bounded e stessa capture window, con unknown/conflict preservati e nessun provider winner.

## M6 — Consent e measurement

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
- nessuna richiesta Google quando la Misurazione è rifiutata o revocata.

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

### Deploy e verifica live originari

Il job di produzione M6 originario ha completato con successo deploy e verifica server-side. Il run #470 è rosso soltanto perché i due step opzionali di commento PR hanno ricevuto `HTTP 403 — Resource not accessible by integration` dopo il successo del deploy.

Browser live verificato il 27 luglio 2026:

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

### Regressione M7 e recovery production

Il deploy automatico M7 #62 del 28 luglio ha pubblicato vuoti `CMP_PROVIDER`, `CMP_EMBED_ID`, `GTM_ID` e `GA4_MEASUREMENT_ID`. La regressione è rimasta privacy-safe perché il codice fail-closed non ha avviato tracking Google.

La pipeline production è stata quindi corretta e resa manual-only:

```text
PR #99 — Harden production deploy safety
merge fd511a5ffd51b55bce7b4b28b1d01b4f43ded8e4

PR #100 — Fix production live Control Room smoke contract
merge f2579346ab9591015e31cf54f3a9e4efa4791ceb

PR #101 — Fix production consent smoke dialog visibility
merge f2df5cd6ef4bf4784205911e80786f55c28f3dd0
```

Recovery riuscita:

```text
GitHub Actions run: 30439227471
commit: f2df5cd6ef4bf4784205911e80786f55c28f3dd0
conclusion: success
Worker version: db76b202-2a62-4871-8abf-61c488316285
AFFILIATE_MODE: disabled
D1 remote migration/mutation: none
```

Il run ha completato deploy, route M7, preview, SEO, published-only, smoke CMP/measurement, legacy Control Room e Control Room foundation protetta da Access.

### Ricertificazione browser reale post-recovery

Il browser smoke automatizzato usa uno stub iubenda controllato, quindi il widget reale è stato ricertificato separatamente in Chrome Incognito. Durante il test finale il blocco DNS locale è stato disattivato.

Risultati osservati:

```text
pre-consenso:
  Google requests=0

rifiuto + reload:
  Google requests=0

consenso:
  GTM-W3LSK9RZ attivato

reload con consenso persistito:
  Google tag HTTP 200
  GA4 collect HTTP 204
  tid=G-GWJ9YPPVJW
  en=page_view
  dl=https://senzaroaming.it/destinazioni
  ep.route_class=listing
  ep.page_type=destination_listing

revoca salvata + reload:
  Google requests=0
  GTM assente
  GA4 collect assente
```

Il ciclo reale reject → grant → persistence → revoke è quindi nuovamente chiuso live dopo il recovery.

Contesto homepage verificato nello storico M6:

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
docs/PRODUCTION-RECOVERY-CHECKPOINT-2026-07-29.md
```

## Search Console e sitemap

La proprietà dominio è accessibile e la sitemap canonica è stata inviata il 26 luglio 2026:

```text
https://senzaroaming.it/sitemap.xml
```

Primo export diretto verificato il 27 luglio 2026:

```text
property: sc-domain:senzaroaming.it
range: 2026-07-26 → 2026-07-27
dataState: all
daily rows: 2
clicks: 0
impressions: 0
query/page/country/device rows: 0
firstIncompleteDate: 2026-07-26
```

L'accesso ADC impersonato, lo scope read-only e il client Search Analytics funzionano. I dati sono ancora freschi e insufficienti per modificare keyword ownership, copy o priorità.

Non è stata usata la Indexing API. Non ripetere la submission. Le richieste manuali restano rinviate finché homepage, listing e prime pagine prioritarie non sono riallineate a una keyword map e a intenti SEO definitivi.

## M7 — prima slice on-page

Implementazione verificata sulla PR #97 e pubblicata dal deploy automatico #62:

```text
homepage: owner dell’intento umbrella “esim viaggio”
/destinazioni: hub geografico, non pagina Paese
/guide: hub dei problemi pratici
/confronti: hub comparativo, non classifica generale
CI branch: success
CI merge commit #520: success
deploy automatico #62: success
```

La slice introduce:

- title, description, H1 e promessa coerenti con la keyword map M7;
- criteri distinti per i tre hub;
- link curati soltanto verso URL esistenti e pubblicati;
- link preview-aware nel namespace `/astro-foundation`;
- smoke dedicato su ownership, title, H1, internal linking e assenza di `/esim-viaggio`;
- verifica desktop e mobile senza overflow;
- contratti CMP e measurement invariati.

La slice non introduce:

- nuove route o pSEO;
- modifiche a Worker backend, D1, Workflow, Container, AI o Control Room;
- mutation o publication capability;
- affiliazioni, Ads o nuovi eventi analytics;
- submission Search Console o Indexing API;

## M7 — riallineamento `/migliore-esim`

Implementazione verificata sulla PR #98 e pubblicata dal deploy automatico #62:

```text
branch: feat/m7-migliore-esim-alignment
base: 006472311ed8f727873257c94c4f53f271ad5368
CI branch #519: success
CI merge commit #520: success
deploy automatico #62: success
```

La slice introduce:

- title, meta description e H1 coerenti con l’ownership `migliore esim`;
- risposta diretta, criteri, scenari, limiti e FAQ senza vincitore universale;
- ponte legacy temporaneo e slug-bound nel read model pubblico esistente;
- fail-closed se il seed non resta `comparison` con primary keyword `migliore esim`;
- nessun prezzo, ranking, copertura, soglia, velocità o provider vincitore;
- link in uscita verso homepage, hub e tre guide, con articoli caricati tramite `loadPublishedArticle()` e omessi se non `published`;
- link canonical e preview coerenti con il rispettivo namespace;
- disclosure coerente con affiliazioni disabilitate;
- smoke dedicato su canonical, preview, published-only, desktop, mobile e assenza overflow;
- internal-linking matrix aggiornata soltanto per i link in uscita.

Il ponte non è una seconda pipeline editoriale: resta limitato al seed legacy pubblicato e deve essere rimosso quando la pagina sarà rimaterializzata tramite il workflow grounded. Nessuna altra pagina è stata riscritta per aggiungere link in entrata.

La slice non introduce:

- nuove route, backend o API;
- migrazioni o mutation D1;
- Workflow, Container, AI, Control Room o gate editoriali;
- publication capability;
- affiliazioni, Ads o nuovi eventi analytics;
- submission Search Console o Indexing API;

## Contratto di deploy D1

Il config sorgente conserva:

```text
database_id=REPLACE_WITH_D1_DATABASE_ID
```

`scripts/prepare-production-d1-binding.mjs` risolve il solo database remoto `senza-roaming`, valida UUID e binding e modifica esclusivamente `apps/web/dist/server/wrangler.json`. Nessuna migration o mutation è implicita nel deploy.

Il workflow GitHub production è ora allineato a questo contratto:

```text
workflow_dispatch soltanto
→ npm ci
→ preflight M6 e AFFILIATE_MODE=disabled
→ npm run deploy
→ binding D1 read-only
→ nessuna creazione D1
→ nessuna migration o mutation D1 remote
→ smoke live pubblico e Control Room
```

Il recovery run `30439227471` ha verificato questo percorso end-to-end.

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
- nessuna PII, token, JWT o ID editoriali interni negli eventi;
- nessuna mutation o migration D1;
- nessun cambio routing;
- nessuna publication capability;
- nessuna rimozione legacy.

## Gap aperti

- Italy comparison evidence pack prima di generalizzare evidence capture, monitoring o ingest;
- dati Search Console sostanziali e primi dati GA4 da osservare senza modifiche premature;
- redirect `www → apex` definitivo;
- topic-mismatch sul prossimo run autorizzato;
- mutation M4 residue;
- publication capability separata;
- eventuale rimozione legacy dopo stabilizzazione.

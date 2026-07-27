# GTM e GA4 — foundation M6

Data: **27 luglio 2026**.

## Stato

```text
PR applicativa: #91 — merged
GTM container version: 2 — published
production deploy: completed
server-side live verification: passed
browser live consent checkpoint: passed
Google Ads: disabled
remarketing: disabled
affiliate tracking: disabled
```

Risultato completo:

```text
docs/PUBLIC-MEASUREMENT-DEPLOY-RESULT-2026-07-27.md
```

## Identificativi verificati

```text
Google Analytics account: 402095950
GA4 property: 546858987
Web data stream: 15310040016
Measurement ID: G-GWJ9YPPVJW

Google Tag Manager account: 6367654517
Web container: 259190865
Public container ID: GTM-W3LSK9RZ
Workspace ID: 3
Workspace name: M6 - Consent-gated GA4 foundation
Published version: 2

Search Console property: sc-domain:senzaroaming.it
```

Gli identificativi sono pubblici e non sono credenziali. Il service account viene usato tramite impersonazione e Application Default Credentials; nessuna chiave privata JSON è stata creata o versionata.

## Contratto browser live

La release applica **Google Consent Mode Basic**:

```text
prima del consenso Misurazione
→ embed iubenda soltanto
→ script GTM inerte type=text/plain
→ nessuna richiesta Google

dopo consenso Misurazione
→ iubenda attiva lo script purpose 4
→ un solo bootstrap dataLayer
→ un solo container GTM
→ evento tecnico locale sr_page_view_ready
→ un solo page_view GA4 per page load

dopo revoca + reload
→ purpose 4 false
→ bootstrap nuovamente inerte
→ nessuna richiesta Google
```

Il bootstrap:

- è emesso soltanto su route pubbliche canoniche indicizzabili;
- è classificato `data-iub-purposes="4"` — Misurazione;
- è protetto contro doppia esecuzione;
- usa il `dataLayer` standard;
- calcola `page_location` come `origin + pathname`;
- non include query string o hash;
- non include PII, token, ID editoriali o testo libero;
- non include il fallback GTM `noscript`.

## Contesto bounded

```text
route_class: home | listing | trust | article
page_type:
  home
  destination_listing | guide_listing | comparison_listing
  method | transparency | privacy
  destination | guide | comparison
content_slug: slug published soltanto per article
render_mode: canonical
site_language: it
```

## Configurazione GTM pubblicata

Workspace verificato prima della pubblicazione:

```text
variables: 7
triggers: 1
tags: 1
errors: 0
```

Variabili Data Layer v2:

```text
DLV - sr_ga4_measurement_id
DLV - route_class
DLV - page_type
DLV - content_slug
DLV - render_mode
DLV - site_language
DLV - page_location
```

Trigger:

```text
ID: 10
name: CE - sr_page_view_ready
type: customEvent
event name: sr_page_view_ready
```

Tag:

```text
ID: 11
name: GA4 - page_view - consent gated
type: gaawe
event: page_view
measurement ID: {{DLV - sr_ga4_measurement_id}}
trigger: 10
tag firing option: oncePerLoad
additional consent required: analytics_storage
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

Il container non contiene trigger All Pages, History Change o Click; non contiene Ads, Floodlight, remarketing, affiliate o Custom HTML.

## Checkpoint completati

- Consent Overview verificato in UI;
- Preview e Tag Assistant;
- Network pre-consenso e post-consenso;
- rifiuto iniziale;
- consenso Misurazione;
- persistenza dopo reload;
- revoca e reload;
- un solo `page_view` per page load;
- GA4 DebugView;
- `page_location` senza query e hash;
- route escluse;
- Lighthouse locale post-consenso:
  - mobile Performance 89;
  - desktop Performance 100;
- deploy e boundary server-side live;
- browser checkpoint live completo.

## Route escluse

```text
/astro-foundation*
/control-room-foundation*
/control-room
/api/*
/go/*
/sitemap.xml
/robots.txt
/_astro/*
404 e file probe
```

## Deploy

Il `wrangler.jsonc` sorgente conserva vuoti:

```text
GTM_ID
GA4_MEASUREMENT_ID
```

Il comando di deploy prepara soltanto il config compilato:

```text
build
→ prepare-production-consent-config
→ prepare-production-measurement-config
→ prepare-production-d1-binding
→ wrangler deploy
```

Il deploy non esegue migration o mutation D1.

## Fuori scope invariato

- Advanced Consent Mode e cookieless pings;
- Google Ads, remarketing e Floodlight;
- affiliate tracking;
- `provider_redirect_intent`;
- analytics nella Control Room o preview;
- PII o dati editoriali interni;
- capacità di pubblicazione automatica.

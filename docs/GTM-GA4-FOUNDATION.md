# GTM e GA4 — foundation M6

Data: **26 luglio 2026**.

## Identificativi verificati

```text
Google Analytics account: 402095950
GA4 property: 546858987
Web data stream: 15310040016
Measurement ID: G-GWJ9YPPVJW

Google Tag Manager account: 6367654517
Web container: 259190865
Public container ID: GTM-W3LSK9RZ

Search Console property: sc-domain:senzaroaming.it
```

Gli identificativi sono pubblici e non sono credenziali. Il service account viene usato tramite impersonazione e Application Default Credentials locali; nessuna chiave privata JSON è stata creata o versionata.

## Contratto browser

La prima release applica **Google Consent Mode Basic**:

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
→ un solo page_view GA4
```

Il bootstrap:

- è emesso soltanto su route pubbliche canoniche indicizzabili;
- è classificato `data-iub-purposes="4"` — Misurazione;
- è protetto contro doppia esecuzione;
- usa il `dataLayer` standard;
- calcola `page_location` come `origin + pathname`;
- non include query string o hash;
- non include PII, token, ID editoriali o testo libero;
- non include il fallback GTM `noscript`, perché produrrebbe una richiesta incompatibile con il contratto Basic pre-consenso.

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

## Contratto container GTM

Il container non viene pubblicato da questa branch. La configurazione attesa è:

1. variabili Data Layer v2 per:
   - `sr_ga4_measurement_id`;
   - `route_class`;
   - `page_type`;
   - `content_slug`;
   - `render_mode`;
   - `site_language`;
   - `page_location`;
2. trigger Custom Event esatto `sr_page_view_ready`;
3. un solo Google tag diretto a `sr_ga4_measurement_id`;
4. configurazione `page_location` dal dataLayer;
5. parametri bounded del dizionario eventi;
6. nessun tag Ads, Floodlight, remarketing, affiliate o Custom HTML;
7. nessun trigger All Pages alternativo capace di duplicare il page view.

La pubblicazione del container richiede prima Preview/Tag Assistant, Network e GA4 DebugView.

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

Il comando di deploy prepara soltanto il config compilato, dopo aver verificato la CMP reale e `AFFILIATE_MODE=disabled`:

```text
build
→ prepare-production-consent-config
→ prepare-production-measurement-config
→ prepare-production-d1-binding
→ wrangler deploy
```

Questa branch non autorizza ancora il deploy. Prima servono container GTM configurato ma non pubblicato, CI verde e verifica in preview/debug.

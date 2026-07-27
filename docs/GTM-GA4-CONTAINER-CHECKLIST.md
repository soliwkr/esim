# GTM container checklist — M6 foundation

Il container `GTM-W3LSK9RZ` resta non pubblicato finché questa checklist non è completata.

## Workspace

- [x] workspace dedicato `M6 - Consent-gated GA4 foundation` creato;
- [x] workspace ID `3` verificato;
- [x] nessun tag Ads, Floodlight, remarketing, affiliate o Custom HTML;
- [x] nessun trigger All Pages alternativo;
- [x] Consent Overview verificato in UI;
- [x] nessuna modifica al container pubblicato durante la preparazione.

Checkpoint Consent Overview del 26 luglio 2026:

```text
consenso non configurato: 0 tag
consenso configurato: 1 tag
tag: GA4 - page_view - consent gated
consenso integrato: ad_storage, ad_personalization, ad_user_data, analytics_storage
consenso aggiuntivo: analytics_storage
```

## Variabili Data Layer v2

- [x] `DLV - sr_ga4_measurement_id` → `sr_ga4_measurement_id`;
- [x] `DLV - route_class` → `route_class`;
- [x] `DLV - page_type` → `page_type`;
- [x] `DLV - content_slug` → `content_slug`;
- [x] `DLV - render_mode` → `render_mode`;
- [x] `DLV - site_language` → `site_language`;
- [x] `DLV - page_location` → `page_location`.

Audit API:

```text
variables: 7
errors: 0
Data Layer version: 2
```

## Trigger

- [x] Custom Event con nome esatto `sr_page_view_ready`;
- [x] trigger ID `10`;
- [x] nessuna regex;
- [x] nessun trigger History Change;
- [x] nessun trigger Click nella prima release.

## Tag GA4

- [x] tag `GA4 - page_view - consent gated` creato;
- [x] tag ID `11`;
- [x] tipo `gaawe`;
- [x] evento `page_view`;
- [x] Measurement ID da `DLV - sr_ga4_measurement_id`;
- [x] trigger esclusivo ID `10` — `sr_page_view_ready`;
- [x] `page_location` da `DLV - page_location`;
- [x] parametri bounded `route_class`, `page_type`, `content_slug`, `render_mode`, `site_language`;
- [x] `tagFiringOption = oncePerLoad`;
- [x] consenso aggiuntivo richiesto `analytics_storage`;
- [x] nessuna user property applicativa;
- [x] nessun parametro con query string, referrer libero o ID interni.

Audit API finale:

```text
variables: 7
triggers: 1
tags: 1
errors: 0
container publish: non eseguito
```

## Checkpoint browser locale — 26 luglio 2026

Ambiente verificato:

```text
branch: feat/public-gtm-ga4-foundation
runtime: http://127.0.0.1:8787
container: GTM-W3LSK9RZ
workspace: 3 — modalità Anteprima
measurement ID: G-GWJ9YPPVJW
container publish: non eseguito
production deploy: non eseguito
```

La configurazione remota iubenda è stata completata aggiungendo i servizi **Google Analytics 4** e **Google Tag Manager** alla policy. Prima di tale aggiornamento la preferenza salvata esponeva soltanto la finalità `1`; dopo aggiornamento e reset dei dati locali il banner espone e salva anche la finalità `4` — Misurazione.

Evidenza verificata nel browser:

```text
prima del consenso Misurazione:
- bootstrap presente come type=text/plain
- class=_iub_cs_activate
- data-iub-purposes=4
- nessun caricamento del container reale GTM-W3LSK9RZ
- nessuna raccolta GA4 reale

dopo consenso:
- purposes state: {1: true, 4: true}
- Tag Assistant trova GTM-W3LSK9RZ
- Tag Assistant trova G-GWJ9YPPVJW
- richiesta page_view a region1.google-analytics.com/g/collect
- route_class=home
- page_type=home
- content_slug vuoto
- render_mode=canonical
- site_language=it
- debug flag presente

reload con consenso persistito:
- banner non riproposto
- seconda pagina registrata
- 2 attivazioni totali su 2 page load
- una sola attivazione del tag per ciascun page load

revoca Misurazione + reload:
- purposes state: {1: true, 4: false}
- bootstrap eseguito: false
- script measurement bloccati: 1
- richieste GTM/GA4 reali: 0

rifiuto iniziale + reload:
- preference expressed: true
- purposes state: {1: true, 4: false}
- bootstrap eseguito: false
- script measurement bloccati: 1
- richieste GTM/GA4 reali: 0

page_location con URL browser contenente query e hash:
- browser: http://127.0.0.1:8787/?utm_source=checkpoint#fragment
- page_location: http://127.0.0.1:8787/
- sr_page_view_ready: 1

route escluse verificate senza measurement:
- /astro-foundation: 200
- /control-room-foundation: 403
- /api/health: 200
- /sitemap.xml: 200
- /robots.txt: 200
- /go/airalo: 302
- /file-inesistente.js: 404

GA4 DebugView:
- page_view ricevuto in modalità debug
- 2 page_view corrispondenti a 2 caricamenti autorizzati
- presenti page_location, page_type, render_mode, route_class e site_language
- presenti soltanto gli eventi automatici GA4 attesi: first_visit e session_start
- nessun provider_redirect_intent
```

## Checkpoint performance locale — 27 luglio 2026

I run Lighthouse 13.0.2 sono stati eseguiti sul runtime locale post-consenso, in una finestra senza estensioni e senza Tag Assistant. Il precedente run con estensioni attive è stato escluso perché Lighthouse segnalava esplicitamente l'interferenza del browser.

```text
mobile:
- Performance: 89
- FCP: 1,7 s
- LCP: 3,2 s
- Speed Index: 1,7 s
- Total Blocking Time: 170 ms
- CLS: 0
- run warnings: 0

desktop:
- Performance: 100
- FCP: 0,7 s
- LCP: 0,7 s
- Speed Index: 0,7 s
- Total Blocking Time: 20 ms
- Time to Interactive: 1,2 s
- CLS: 0
- run warnings: 0
```

Il carico residuo osservato è attribuito principalmente agli script terzi iubenda e GTM. Non viene aperto un intervento di ottimizzazione vendor dentro questa foundation.

## Verifica prima della pubblicazione

- [x] prima del consenso nessuna richiesta al container GTM reale o alla raccolta GA4 reale;
- [x] rifiuto: nessuna richiesta Google reale;
- [x] consenso Misurazione: un solo caricamento GTM per page load;
- [x] un solo `page_view` per page load in Tag Assistant;
- [x] `page_location` verificato nel hit reale senza query e hash;
- [x] parametri bounded della homepage corretti;
- [x] preview, Control Room e route tecniche senza container;
- [x] revoca e reload bloccano nuovamente GTM;
- [x] GA4 DebugView UI riceve il test autorizzato;
- [x] nessun evento `provider_redirect_intent` nella foundation iniziale;
- [x] performance ricontrollata su desktop e mobile.

## Pubblicazione

La pubblicazione del container e il deploy del codice sono checkpoint separati. Entrambi richiedono evidenza reale e documentazione del risultato.

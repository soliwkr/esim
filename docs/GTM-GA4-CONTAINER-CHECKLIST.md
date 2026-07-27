# GTM container checklist — M6 foundation

Stato finale al **27 luglio 2026**: checklist completata, container pubblicato come versione `2`, deploy produzione verificato.

## Workspace

- [x] workspace dedicato `M6 - Consent-gated GA4 foundation` creato;
- [x] workspace ID `3` verificato;
- [x] nessun tag Ads, Floodlight, remarketing, affiliate o Custom HTML;
- [x] nessun trigger All Pages alternativo;
- [x] Consent Overview verificato in UI;
- [x] nessuna modifica al container pubblicato durante la preparazione.

Checkpoint Consent Overview:

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

- [x] tag `GA4 - page_view - consent gated`;
- [x] tag ID `11`;
- [x] tipo `gaawe`;
- [x] evento `page_view`;
- [x] Measurement ID da `DLV - sr_ga4_measurement_id`;
- [x] trigger esclusivo ID `10`;
- [x] `page_location` da `DLV - page_location`;
- [x] parametri bounded `route_class`, `page_type`, `content_slug`, `render_mode`, `site_language`;
- [x] `tagFiringOption = oncePerLoad`;
- [x] consenso aggiuntivo `analytics_storage`;
- [x] nessuna user property applicativa;
- [x] nessun parametro con query string, referrer libero o ID interni.

```text
variables: 7
triggers: 1
tags: 1
errors: 0
published version: 2
```

## Checkpoint browser locale

Verificato prima della pubblicazione:

- bootstrap inerte `type=text/plain` prima del consenso;
- classe `_iub_cs_activate` e purpose `4`;
- nessuna richiesta GTM/GA4 prima del consenso;
- consenso con `{1: true, 4: true}`;
- un solo `page_view` per page load;
- parametri bounded corretti;
- reload senza duplicazioni;
- revoca e rifiuto con zero richieste Google;
- `page_location` senza query e hash;
- preview, Control Room e route tecniche escluse;
- GA4 DebugView;
- nessun `provider_redirect_intent`.

## Checkpoint performance locale

Lighthouse 13.0.2, runtime locale post-consenso, browser senza estensioni e senza Tag Assistant:

```text
mobile:
- Performance: 89
- FCP: 1,7 s
- LCP: 3,2 s
- Speed Index: 1,7 s
- Total Blocking Time: 170 ms
- CLS: 0
- warnings: 0

desktop:
- Performance: 100
- FCP: 0,7 s
- LCP: 0,7 s
- Speed Index: 0,7 s
- Total Blocking Time: 20 ms
- Time to Interactive: 1,2 s
- CLS: 0
- warnings: 0
```

Il run precedente con estensioni attive è escluso. Il carico residuo osservato è principalmente vendor iubenda/GTM.

## Pubblicazione container

```text
container: GTM-W3LSK9RZ
version: 2
name: M6 - Consent-gated GA4 foundation
published: 27 luglio 2026
```

Il riepilogo versione mostra un tag, un trigger e dodici variabili totali; le modifiche M6 sono esattamente sette Data Layer Variables, un trigger e un tag.

## Deploy produzione

```text
PR applicativa: #91
PR deploy one-shot: #92
CI deploy: #470
PR cleanup workflow: #93
CI cleanup: #471
```

Nel run #470 sono riusciti:

```text
Deploy consent-gated production measurement
Verify live server-rendered measurement boundary
```

Il run è rosso soltanto per i due step opzionali di commento PR, falliti con `HTTP 403 — Resource not accessible by integration`. Il Worker è stato deployato e il boundary live è passato; nessun retry è stato eseguito.

## Checkpoint browser live

- [x] rifiuto iniziale: purpose `4=false`, bootstrap non eseguito, zero richieste Google;
- [x] consenso: purpose `4=true`, bootstrap eseguito, un solo `sr_page_view_ready`;
- [x] GTM reale caricato;
- [x] GA4 collect reale inviato;
- [x] contesto homepage bounded corretto;
- [x] persistenza dopo reload;
- [x] nessun doppione nello stesso page load;
- [x] revoca + reload: purpose `4=false`, bootstrap bloccato, zero richieste Google;
- [x] preview, Control Room e route tecniche escluse lato server.

Contesto homepage:

```text
route_class: home
page_type: home
content_slug: ""
render_mode: canonical
site_language: it
page_location: https://senzaroaming.it/
```

## Stato finale

- [x] Consent Mode Basic rispettato;
- [x] nessun ping Google pre-consenso;
- [x] container pubblicato;
- [x] deploy produzione completato;
- [x] verifica server-side live;
- [x] verifica browser live completa;
- [x] job one-shot rimosso;
- [x] Ads, remarketing, affiliate e `provider_redirect_intent` assenti.

Documento risultato:

```text
docs/PUBLIC-MEASUREMENT-DEPLOY-RESULT-2026-07-27.md
```

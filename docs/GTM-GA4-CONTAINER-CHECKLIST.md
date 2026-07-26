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

Questo checkpoint certifica la configurazione del tag nel workspace, non ancora il comportamento runtime del consenso o delle richieste di rete.

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
- [x] nessuna user property;
- [x] nessun parametro con query string, referrer libero o ID interni.

Audit API finale:

```text
variables: 7
triggers: 1
tags: 1
errors: 0
container publish: non eseguito
```

## Verifica prima della pubblicazione

- [ ] prima del consenso nessuna richiesta `googletagmanager.com` o `google-analytics.com`;
- [ ] rifiuto: nessuna richiesta Google;
- [ ] consenso Misurazione: un solo caricamento GTM;
- [ ] un solo `page_view` in Tag Assistant;
- [ ] `page_location` senza query e hash;
- [ ] parametri bounded corretti;
- [ ] preview e Control Room senza container;
- [ ] revoca e reload bloccano nuovamente GTM;
- [ ] GA4 DebugView riceve soltanto il test autorizzato;
- [x] nessun evento `provider_redirect_intent` nella foundation iniziale;
- [ ] performance ricontrollata su desktop e mobile.

## Pubblicazione

La pubblicazione del container e il deploy del codice sono checkpoint separati. Entrambi richiedono evidenza reale e documentazione del risultato.

# GTM container checklist — M6 foundation

Il container `GTM-W3LSK9RZ` resta non pubblicato finché questa checklist non è completata.

## Workspace

- [ ] usare un workspace dedicato alla foundation M6;
- [ ] nessun tag Ads, Floodlight, remarketing, affiliate o Custom HTML;
- [ ] nessun trigger All Pages alternativo;
- [ ] Consent Overview abilitato;
- [ ] nessuna modifica al container pubblicato durante la preparazione.

## Variabili Data Layer v2

- [ ] `DLV - sr_ga4_measurement_id` → `sr_ga4_measurement_id`;
- [ ] `DLV - route_class` → `route_class`;
- [ ] `DLV - page_type` → `page_type`;
- [ ] `DLV - content_slug` → `content_slug`;
- [ ] `DLV - render_mode` → `render_mode`;
- [ ] `DLV - site_language` → `site_language`;
- [ ] `DLV - page_location` → `page_location`.

## Trigger

- [ ] Custom Event con nome esatto `sr_page_view_ready`;
- [ ] nessuna regex;
- [ ] nessun trigger History Change;
- [ ] nessun trigger Click nella prima release.

## Google tag

- [ ] Tag ID da `DLV - sr_ga4_measurement_id`;
- [ ] trigger esclusivo `sr_page_view_ready`;
- [ ] `page_location` impostato da `DLV - page_location`;
- [ ] parametri bounded `route_class`, `page_type`, `content_slug`, `render_mode`, `site_language`;
- [ ] un solo page view per caricamento;
- [ ] nessuna user property;
- [ ] nessun parametro con query string, referrer libero o ID interni.

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
- [ ] nessun evento `provider_redirect_intent` nella foundation iniziale;
- [ ] performance ricontrollata su desktop e mobile.

## Pubblicazione

La pubblicazione del container e il deploy del codice sono checkpoint separati. Entrambi richiedono evidenza reale e documentazione del risultato.

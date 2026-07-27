# Public measurement deploy result — 27 luglio 2026

## Scope

Attivazione in produzione della foundation M6 consent-gated per Google Tag Manager e Google Analytics 4.

```text
PR applicativa: #91
merge applicativo: 24f473b5de9f714e997c4ddd6e50d77c36c34a29
GTM container: GTM-W3LSK9RZ
GTM version: 2 — M6 - Consent-gated GA4 foundation
GA4 measurement ID: G-GWJ9YPPVJW
PR deploy one-shot: #92
merge deploy: 9f4ba922c8cbf0682474c98aebb4b8b7ea2e6297
CI deploy: #470
PR cleanup workflow: #93
merge cleanup: f9aaf071b69164e81617840fc85d36d507ec710e
```

## Risultato deploy

Il job di produzione ha completato con successo:

```text
Deploy consent-gated production measurement: success
Verify live server-rendered measurement boundary: success
```

Il run CI #470 è risultato rosso soltanto per i due step opzionali che tentavano di scrivere un commento sulla PR #91:

```text
HTTP 403 — Resource not accessible by integration
```

Questo errore non ha coinvolto il deploy Cloudflare né la verifica live. Non è stato eseguito alcun retry del deploy.

Il job one-shot è stato rimosso con PR #93 dopo CI #471 verde.

## Boundary server-side live

Verificato automaticamente su produzione:

- homepage, listing, trust pages e articolo canonico contengono un solo embed iubenda;
- un solo bootstrap measurement inerte è presente;
- `type="text/plain"`;
- classe `_iub_cs_activate`;
- `data-iub-purposes="4"`;
- `GTM-W3LSK9RZ` e `G-GWJYPPVJW` presenti nel bootstrap;
- nessun fallback GTM `noscript`;
- nessun dominio Ads, DoubleClick o remarketing;
- preview, Control Room, API, sitemap, robots, `/go/*` e 404 restano senza CMP e measurement markers.

## Checkpoint browser live

### Rifiuto iniziale

Dopo `Rifiuta tutto` e reload:

```text
preferenceExpressed: true
purpose 4: false
bootstrapExecuted: false
blockedMeasurementScripts: 1
actualGoogleRequests: []
```

### Consenso Misurazione

Dopo attivazione della finalità Misurazione:

```text
purpose 4: true
preferenceExpressed: true
bootstrapExecuted: true
pageReadyCount: 1
GTM request: present
GA4 collect request: present
```

Contesto verificato:

```text
route_class: home
page_type: home
content_slug: ""
render_mode: canonical
site_language: it
page_location: https://senzaroaming.it/
```

### Persistenza

Dopo reload con consenso salvato:

```text
purpose 4: true
preferenceExpressed: true
bootstrapExecuted: true
pageReadyCount: 1
gtmLoaded: true
ga4CollectSent: true
```

Il banner non è stato riproposto e non si è verificata duplicazione nello stesso page load.

### Revoca

Dopo disattivazione di Misurazione, salvataggio e reload:

```text
purpose 4: false
preferenceExpressed: true
bootstrapExecuted: false
blockedMeasurementScripts: 1
actualGoogleRequests: []
```

## Checkpoint precedenti riutilizzati

Prima del deploy erano già stati verificati:

- Consent Overview del workspace GTM;
- Tag Assistant;
- Network pre-consenso e post-consenso;
- un solo `page_view` per page load;
- GA4 DebugView con parametri bounded;
- `page_location` senza query string e hash;
- route escluse;
- Lighthouse locale pulito post-consenso:
  - mobile Performance 89;
  - desktop Performance 100.

## Stato finale

```text
CMP iubenda: live
GTM container version 2: published
GTM production: active only after Measurement consent
GA4 production: active only after Measurement consent
Google Ads: disabled
remarketing: disabled
affiliate tracking: disabled
provider_redirect_intent: not implemented
Advanced Consent Mode: disabled
cookieless pings: disabled
```

## Guardrail invariati

- nessun tracking Google prima del consenso Misurazione;
- nessuna PII, token, JWT o ID editoriali negli eventi;
- nessun analytics nella Control Room o nella preview;
- nessuna migration o mutation D1;
- nessuna modifica a Workflow, Container, AI o gate editoriali;
- nessuna capacità di pubblicazione automatica;
- nessun evento provider o affiliate introdotto.

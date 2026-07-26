# Prossime azioni

Ultimo aggiornamento: **26 luglio 2026**.

Questa lista contiene soltanto il lavoro immediatamente eseguibile.

## Now — chiudere la foundation PR #91

Branch e PR:

```text
feat/public-gtm-ga4-foundation
PR #91 — draft
```

Stato verificato prima della CI finale:

```text
CMP iubenda: live
Google access: verificato
Search Console: collegata
sitemap: inviata
GTM produzione: spento
GA4 produzione: spento
```

La branch introduce soltanto la foundation consent-gated:

- `GTM_ID` e `GA4_MEASUREMENT_ID` fail-closed;
- bootstrap GTM inerte `type=text/plain`;
- classificazione iubenda `purpose 4` — Misurazione;
- nessuna richiesta Google prima del consenso;
- contesto pagina bounded;
- `page_location = origin + pathname`;
- preview, Control Room e route tecniche escluse;
- preparazione deterministica del config compilato;
- smoke pure, workerd e Chromium;
- Privacy coerente con lo stato runtime.

### Prima di portare la PR ready

```text
CI completa verde
→ review del diff
→ workspace GTM configurato ma non pubblicato
→ Preview / Tag Assistant
→ Network e GA4 DebugView
→ rifiuto, consenso, reload e revoca
→ un solo page_view
→ controllo performance
```

La PR non viene mergiata e il codice non viene deployato finché il workspace GTM non è verificato.

## Workspace GTM — configurare senza pubblicare

Container:

```text
GTM-W3LSK9RZ
```

Usare un workspace dedicato M6 con:

### Variabili Data Layer v2

```text
sr_ga4_measurement_id
route_class
page_type
content_slug
render_mode
site_language
page_location
```

### Trigger

```text
Custom Event esatto: sr_page_view_ready
```

### Google tag

- Tag ID letto da `sr_ga4_measurement_id`;
- trigger esclusivo `sr_page_view_ready`;
- `page_location` letto dal dataLayer;
- parametri bounded del dizionario;
- nessuna user property;
- nessun trigger All Pages alternativo;
- nessun Custom HTML;
- nessun Ads, Floodlight, remarketing o affiliate tag.

Checklist completa:

```text
docs/GTM-GA4-CONTAINER-CHECKLIST.md
```

## Checkpoint browser e dati

Verificare in una finestra pulita:

1. prima della scelta non parte alcuna richiesta Google;
2. Rifiuta mantiene GTM e GA4 bloccati;
3. consenso Misurazione carica GTM una sola volta;
4. Tag Assistant mostra un solo `page_view`;
5. `page_location` non contiene query string o hash;
6. DebugView riceve solo il test autorizzato;
7. reload conserva correttamente la scelta;
8. revoca e reload bloccano nuovamente GTM;
9. preview e Control Room restano senza container;
10. mobile, tastiera, overflow e performance restano accettabili.

## Dopo il checkpoint

```text
workspace verificato
→ pubblicazione container esplicitamente autorizzata
→ merge PR #91 con expected head SHA
→ deploy pubblico separatamente autorizzato
→ verifica live Network / Tag Assistant / DebugView
→ registrazione del risultato
```

Pubblicazione del container, merge e deploy sono tre gate distinti.

## Search Console

Completato:

```text
proprietà: sc-domain:senzaroaming.it
sitemap: https://senzaroaming.it/sitemap.xml
submission: 26 luglio 2026
```

Non ripetere la submission e non usare la Indexing API. Attendere i primi dati di scansione.

Le richieste manuali di indicizzazione restano rinviate fino a:

```text
keyword map
→ architettura contenuti
→ copy homepage e listing
→ prime URL prioritarie realmente pronte
```

## Track parallela M4

```text
conversione brief
→ operazioni claim
→ decisione draft
→ eventuale retry queue
```

La legacy privata resta finché serve come fallback operativo.

## Freeze immediato

- niente deploy o merge PR #91 prima del checkpoint GTM;
- niente pubblicazione container senza Preview/DebugView;
- niente Advanced Consent Mode o cookieless pings;
- niente tracking pre-consenso;
- niente eventi fuori dal dizionario;
- niente `provider_redirect_intent` prima del checkpoint base;
- niente PII o dati editoriali interni;
- niente analytics nella Control Room o preview;
- niente Ads, remarketing o affiliate tracking;
- niente submission ripetute o Indexing API;
- niente secret o UUID D1 nel repository;
- niente mutation D1, Workflow, Container, AI o gate editoriali;
- niente pubblicazione automatica;
- niente rimozione legacy durante M6.

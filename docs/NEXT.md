# Prossime azioni

Ultimo aggiornamento: **26 luglio 2026**.

Questa lista contiene soltanto il lavoro immediatamente eseguibile.

## Now — verificare la foundation PR #91 nel browser

Branch e PR:

```text
feat/public-gtm-ga4-foundation
PR #91 — draft
```

Stato verificato:

```text
CMP iubenda: live
Google access: verificato
Search Console: collegata
sitemap: inviata
CI PR #91: verde
workspace GTM M6: configurato, non pubblicato
GTM produzione: spento
GA4 produzione: spento
```

La branch introduce la foundation consent-gated:

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

## Workspace GTM — completato, non pubblicato

```text
container: GTM-W3LSK9RZ
workspace ID: 3
workspace: M6 - Consent-gated GA4 foundation
```

Audit API:

```text
errors: 0
variables: 7
triggers: 1
tags: 1
```

Risorse configurate:

- sette Data Layer Variable v2;
- trigger ID `10`, Custom Event esatto `sr_page_view_ready`;
- tag ID `11`, `GA4 - page_view - consent gated`;
- evento `page_view`;
- Measurement ID letto dal dataLayer;
- parametri bounded;
- `oncePerLoad`;
- consenso aggiuntivo `analytics_storage`;
- nessun trigger All Pages, History Change o Click;
- nessun Ads, Floodlight, remarketing, affiliate o Custom HTML.

Checklist:

```text
docs/GTM-GA4-CONTAINER-CHECKLIST.md
```

## Checkpoint browser e dati

Restano da verificare:

1. Consent Overview nel workspace GTM;
2. prima della scelta non parte alcuna richiesta Google;
3. Rifiuta mantiene GTM e GA4 bloccati;
4. consenso Misurazione carica GTM una sola volta;
5. Tag Assistant mostra un solo `page_view`;
6. `page_location` non contiene query string o hash;
7. i parametri bounded sono corretti;
8. DebugView riceve solo il test autorizzato;
9. reload conserva correttamente la scelta;
10. revoca e reload bloccano nuovamente GTM;
11. preview e Control Room restano senza container;
12. mobile, tastiera, overflow e performance restano accettabili.

Il codice della PR non è ancora live. Il checkpoint integrato richiede quindi un ambiente applicativo esplicitamente autorizzato: locale oppure preview Cloudflare separata. Non si pubblica il container GTM e non si modifica l’apice per aggirare questo gate.

## Dopo il checkpoint

```text
Preview / Tag Assistant / Network / DebugView verificati
→ PR #91 ready
→ merge con expected head SHA
→ pubblicazione container esplicitamente autorizzata
→ deploy pubblico separatamente autorizzato
→ verifica live completa
→ registrazione del risultato
```

Merge, pubblicazione del container e deploy sono gate distinti.

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

- niente deploy o merge PR #91 prima del checkpoint integrato;
- niente pubblicazione container senza Preview e DebugView;
- niente Advanced Consent Mode o cookieless pings;
- niente tracking pre-consenso;
- niente eventi fuori dal dizionario;
- niente `provider_redirect_intent` prima del checkpoint base;
- niente PII o dati editoriali interni;
- niente analytics nella Control Room o preview pubblica ordinaria;
- niente Ads, remarketing o affiliate tracking;
- niente submission ripetute o Indexing API;
- niente secret o UUID D1 nel repository;
- niente mutation D1, Workflow, Container, AI o gate editoriali;
- niente pubblicazione automatica;
- niente rimozione legacy durante M6.

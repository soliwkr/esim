# Prossime azioni

Ultimo aggiornamento: **26 luglio 2026**.

Questa lista contiene soltanto il lavoro immediatamente eseguibile.

## Now — chiudere i checkpoint residui della PR #91

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
CI PR #91: verde sul commit precedente al checkpoint docs
workspace GTM M6: configurato, non pubblicato
Preview GTM locale: verificata
GTM produzione: spento
GA4 produzione: spento
```

La branch introduce la foundation consent-gated:

- `GTM_ID` e `GA4_MEASUREMENT_ID` fail-closed;
- bootstrap GTM inerte `type=text/plain`;
- classificazione iubenda `purpose 4` — Misurazione;
- nessuna richiesta Google reale prima del consenso;
- contesto pagina bounded;
- `page_location = origin + pathname`;
- preview, Control Room e route tecniche escluse dal contratto;
- preparazione deterministica del config compilato;
- smoke pure, workerd e Chromium;
- Privacy coerente con lo stato runtime.

## Workspace GTM — completato, non pubblicato

```text
container: GTM-W3LSK9RZ
workspace ID: 3
workspace: M6 - Consent-gated GA4 foundation
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

## Checkpoint browser locale — completato per grant e reload

Ambiente:

```text
runtime: http://127.0.0.1:8787
GTM workspace: Anteprima
container publish: non eseguito
production deploy: non eseguito
```

La policy iubenda è stata completata aggiungendo i servizi **Google Analytics 4** e **Google Tag Manager**. Dopo reset dei dati locali, il banner ha esposto e salvato la finalità `4` — Misurazione.

Verificato:

1. prima del consenso il bootstrap resta `type=text/plain` e il container reale non viene caricato;
2. il consenso salvato espone `{1: true, 4: true}`;
3. Tag Assistant trova `GTM-W3LSK9RZ` e `G-GWJ9YPPVJW` soltanto dopo il grant;
4. parte un hit `page_view` verso GA4;
5. i parametri homepage risultano bounded: `home`, `home`, slug vuoto, `canonical`, `it`;
6. il reload conserva il consenso e non ripropone il banner;
7. due page load producono due attivazioni totali: una sola per ciascun caricamento.

## Checkpoint residui prima di rendere pronta la PR

1. rifiuto esplicito: nessuna richiesta Google reale;
2. `page_location` nel hit reale senza query string o hash;
3. revoca della finalità Misurazione e reload: GTM nuovamente bloccato;
4. route preview e Control Room senza container nel browser reale;
5. verifica nella UI GA4 DebugView del solo test autorizzato;
6. controllo mobile, tastiera, overflow e performance;
7. CI verde sull'ultimo commit documentale.

## Dopo il checkpoint

```text
checkpoint residui verificati
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
- niente pubblicazione container senza completare i checkpoint residui;
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

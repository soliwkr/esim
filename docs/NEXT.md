# Prossime azioni

Ultimo aggiornamento: **27 luglio 2026**.

Questa lista contiene soltanto il lavoro immediatamente eseguibile.

## Now — chiudere la PR #91

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
CI #465: verde sul precedente head documentale
workspace GTM M6: configurato, non pubblicato
Preview GTM locale: verificata
checkpoint performance: completato
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

## Checkpoint browser locale — completato

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
2. rifiuto iniziale e reload mantengono finalità `4=false`, bootstrap non eseguito e zero richieste GTM/GA4 reali;
3. il grant salva `{1: true, 4: true}` e carica GTM/GA4 soltanto dopo consenso;
4. Tag Assistant mostra un solo `page_view` per page load;
5. il reload conserva la scelta senza doppia attivazione;
6. la revoca seguita da reload blocca nuovamente GTM/GA4;
7. `page_location` rimuove query string e hash;
8. i parametri homepage risultano bounded: `home`, `home`, slug vuoto, `canonical`, `it`;
9. preview, Control Room, API, sitemap, robots, redirect e 404 restano senza measurement;
10. GA4 DebugView riceve il test autorizzato con i parametri previsti;
11. nessun `provider_redirect_intent` è presente.

## Checkpoint performance — completato

Lighthouse 13.0.2 è stato eseguito sul runtime locale post-consenso in una finestra senza estensioni e senza Tag Assistant.

```text
mobile:
Performance 89
FCP 1,7 s
LCP 3,2 s
Speed Index 1,7 s
TBT 170 ms
CLS 0
warnings 0

desktop:
Performance 100
FCP 0,7 s
LCP 0,7 s
Speed Index 0,7 s
TBT 20 ms
TTI 1,2 s
CLS 0
warnings 0
```

Il precedente run con estensioni attive è escluso perché Lighthouse segnalava esplicitamente l'interferenza del browser. Il carico residuo è principalmente vendor iubenda/GTM e non apre una fase di ottimizzazione dentro questa foundation.

## Unico checkpoint residuo prima di rendere pronta la PR

1. CI verde sull'ultimo commit documentale;
2. passaggio della PR #91 da draft a ready.

## Dopo il checkpoint

```text
CI finale della branch verde
→ PR #91 ready
→ merge con expected head SHA, soltanto dopo autorizzazione esplicita
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

- niente merge PR #91 prima della CI verde sull'ultimo head e di un'autorizzazione esplicita;
- niente pubblicazione container senza autorizzazione esplicita;
- niente deploy pubblico senza autorizzazione esplicita;
- niente Advanced Consent Mode o cookieless pings;
- niente tracking pre-consenso;
- niente eventi fuori dal dizionario;
- niente `provider_redirect_intent` prima del checkpoint base live;
- niente PII o dati editoriali interni;
- niente analytics nella Control Room o preview pubblica ordinaria;
- niente Ads, remarketing o affiliate tracking;
- niente submission ripetute o Indexing API;
- niente secret o UUID D1 nel repository;
- niente mutation D1, Workflow, Container, AI o gate editoriali;
- niente pubblicazione automatica;
- niente rimozione legacy durante M6.

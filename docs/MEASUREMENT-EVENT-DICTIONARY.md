# Measurement event dictionary

Versione: **1.0-draft**  
Data: **25 luglio 2026**.

## Scopo

Definire una volta sola eventi, parametri, fonti e divieti della misurazione pubblica di Senza Roaming.

Questo dizionario precede l’attivazione di GTM e GA4. Un evento non presente qui non può essere aggiunto direttamente nel container.

## Principi

- analytics soltanto dopo consenso esplicito;
- nessun evento dalla Control Room o dalle preview;
- nessun dato personale o operativo interno;
- cardinalità bounded;
- un solo owner per evento;
- D1 e GA4 non vengono confusi;
- il server-side redirect log resta fonte di verità per gli outbound completati;
- gli eventi vengono aggiunti per necessità decisionale, non perché tecnicamente disponibili.

## Route class

Valori consentiti:

```text
home
listing
trust
article
```

Non sono ammessi valori liberi.

## Page type

Valori consentiti:

```text
home
destination_listing
guide_listing
comparison_listing
method
transparency
privacy
destination
guide
comparison
```

## Parametri comuni

| Parametro | Tipo | Valori | Note |
|---|---|---|---|
| `event_schema_version` | string | `1` | obbligatorio su eventi custom |
| `route_class` | enum | lista bounded | nessun valore libero |
| `page_type` | enum | lista bounded | nessun valore libero |
| `content_slug` | string | slug pubblicato o vuoto | mai ID D1 |
| `render_mode` | enum | `canonical` | preview esclusa |
| `site_language` | enum | `it` | fisso nella prima release |

## Dati vietati globalmente

- nome, email, telefono, indirizzo;
- IP o user agent raccolti dall’app;
- maintenance token, JWT, chiavi o secret;
- ID di brief, claim, bundle, draft o audit;
- testo di claim o contenuto editoriale;
- query SQL;
- URL completi con query string;
- referrer contenenti dati sensibili;
- dati della Control Room;
- contenuti `review`, `draft` o archived;
- testo libero dell’utente;
- fingerprint o identificatori custom persistenti.

## Eventi release 1

### `page_view`

**Stato:** autorizzato per la prima release GA4.

**Owner:** GA4 tag configurato in GTM.

**Trigger:** una volta per ogni caricamento completo di una route canonical pubblica valida, dopo consenso analytics.

**Route ammesse:** home, listing, trust, article.

**Parametri:**

```text
route_class
page_type
content_slug
render_mode=canonical
site_language=it
```

**Page location:**

```text
origin + pathname
```

Query string e hash vengono esclusi dalla proprietà inviata esplicitamente.

**Regole anti-duplicazione:**

- una sola GA4 Configuration/Google Tag responsabile del page view;
- nessun secondo tag custom `page_view`;
- nessun page view dalla CMP;
- nessun page view dal codice Astro;
- nessun page view su sitemap, robots, API, redirect, preview, Control Room o 404.

**Decisioni abilitate:**

- pagine e sezioni lette;
- distribuzione tra guide, confronti e destinazioni;
- baseline di traffico prima della monetizzazione.

### `provider_redirect_intent`

**Stato:** autorizzato dopo il checkpoint base `page_view`; può essere implementato nella stessa branch GA4 ma resta disabilitato finché il page view non è verificato.

**Owner:** click listener minimale pubblico o GTM click trigger vincolato a link interni `/go/{provider}`.

**Trigger:** click dell’utente su un link provider, dopo consenso analytics e prima della navigazione al redirect.

**Parametri consentiti:**

```text
provider_slug
placement
page_slug
page_type
monetized
```

Vincoli:

- `provider_slug` deve appartenere all’elenco renderizzato server-side;
- `placement` usa enum bounded, non testo libero;
- `page_slug` è lo slug pubblico;
- `monetized` è booleano e inizialmente sempre `false`;
- nessun URL esterno completo viene inviato.

**Semantica:** misura l’intento browser. Non prova che il redirect o la destinazione siano stati raggiunti.

**Fonte di verità operativa:** tabella D1 `outbound_clicks`, scritta dal redirect server-side.

**Decisioni abilitate:**

- confronto tra click intent e redirect completati;
- posizione dei CTA;
- provider consultati, senza ranking automatico.

### `consent_update`

**Stato:** evento tecnico locale, non inviato a GA4.

**Owner:** adapter CMP.

**Trigger:** accettazione, rifiuto, modifica o revoca delle preferenze.

**Destinazione:** `dataLayer` e debug locale soltanto.

**Parametri consentiti:**

```text
consent_schema_version
analytics_storage
action
```

Valori:

```text
analytics_storage: denied | granted
action: accept | reject | update | revoke
```

Non inviare timestamp custom, identificatori di consenso, proof ID o dati CMP a GA4.

**Finalità:** orchestrazione e verifica tecnica del caricamento dei tag.

## Eventi differiti

### `navigation_click`

Non autorizzato nella prima release. Il costo di cardinalità e manutenzione non è giustificato prima di avere una baseline `page_view`.

### `article_view`

Non autorizzato come evento separato. Gli articoli sono identificati da `page_view` con `route_class=article`, `page_type` e `content_slug`.

### `listing_view`

Non autorizzato come evento separato. I listing sono identificati da `page_view` con `route_class=listing`.

### Scroll, engagement custom e tempo attivo

Non autorizzati. Le metriche automatiche GA4 devono essere valutate e documentate prima dell’uso decisionale.

### Search, form, login e account

Non applicabili al sito pubblico corrente.

## Placement enum per provider

Prima versione:

```text
hero_primary
article_inline
comparison_table
related_card
footer_or_other
unknown
```

Il valore `unknown` è fallback tecnico e deve essere monitorato; non deve diventare il valore prevalente.

## DataLayer contract

Il progetto usa un oggetto versionato, non push arbitrari.

Esempio concettuale:

```js
window.dataLayer.push({
  event: 'provider_redirect_intent',
  event_schema_version: '1',
  provider_slug: 'airalo',
  placement: 'article_inline',
  page_slug: 'migliore-esim',
  page_type: 'comparison',
  monetized: false,
})
```

L’esempio non autorizza ancora l’inserimento di codice nel layout.

## Consent requirements

| Evento | Prima del consenso | Dopo consenso analytics | Dopo revoca |
|---|---:|---:|---:|
| `page_view` | bloccato | consentito | bloccato |
| `provider_redirect_intent` | bloccato | consentito | bloccato |
| `consent_update` locale | consentito per orchestrazione | consentito per orchestrazione | consentito per orchestrazione |

## Ambienti

### Produzione

Invia dati soltanto alla proprietà GA4 production verificata.

### Preview e Control Room

Nessun container e nessun evento.

### Test locale / CI

Usa mock e intercettazione di rete. Non invia dati reali a Google.

### Debug live autorizzato

Usa Tag Assistant e GA4 DebugView per una finestra limitata. Il debug mode non resta attivo globalmente.

## Acceptance per evento

Ogni evento implementato deve avere:

- fixture valida;
- fixture con parametri vietati;
- test consenso denied;
- test consenso granted;
- test revoca;
- test route escluse;
- test anti-duplicazione;
- verifica Network;
- verifica Tag Assistant;
- verifica DebugView;
- documentazione del risultato reale.

## Change control

Per aggiungere o modificare un evento:

```text
modifica dizionario
→ review
→ CI
→ configurazione GTM
→ verifica preview/debug
→ pubblicazione container
→ verifica dati reali
```

Non modificare direttamente GTM senza prima aggiornare questo file.

## KPI iniziali derivabili

Soltanto dopo dati sufficienti:

- page views per `page_type`;
- pagine canoniche più lette;
- rapporto redirect intent / page view;
- rapporto redirect completati D1 / redirect intent GA4;
- distribuzione dei placement;
- qualità tecnica del consenso.

Questi KPI non determinano automaticamente ranking editoriali o pubblicazione.

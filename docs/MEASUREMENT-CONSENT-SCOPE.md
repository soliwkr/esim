# M6 — Measurement and consent scope

Data: **25 luglio 2026**.

Branch di scope:

```text
docs/measurement-consent-scope
```

## Obiettivo

Introdurre misurazione pubblica verificabile senza modificare il ciclo editoriale, il backend operativo o la privacy boundary della Control Room.

La sequenza obbligatoria è:

```text
inventario
→ scelta CMP
→ Consent Mode Basic
→ event dictionary
→ GTM
→ GA4
→ verifica live
→ Search Console
→ sitemap submission
```

Questa fase non autorizza ancora codice di tracking. Definisce il contratto che le branch tecniche dovranno rispettare.

## Stato di partenza verificato

### Repository

- `wrangler.jsonc` contiene `GTM_ID`, ma il valore è vuoto;
- `Env` espone `GTM_ID`, ma nessun renderer lo utilizza;
- `PublicLayout.astro` contiene soltanto metadata e JSON-LD inerte;
- non sono presenti snippet `gtag`, Google Tag Manager, GA4 o CMP;
- la pagina Privacy dichiara correttamente che CMP, GA4 e GTM non sono attivi;
- il footer non contiene ancora un comando per modificare o revocare il consenso;
- la preview `/astro-foundation*` e la Control Room sono noindex/no-store e devono restare escluse dalla misurazione.

### Misurazione server-side esistente

`/go/{provider}` registra già in D1:

```text
page_slug
provider_slug
placement
monetized
created_at
```

Il contratto applicativo non persiste IP o user agent per questi redirect.

Questo registro D1 resta la fonte di verità per i redirect effettivamente completati. Un futuro evento analytics sul click rappresenterà soltanto l’intento browser e non sostituirà il dato server-side.

### Infrastruttura esterna

Risulta preparata esternamente, ma non ancora certificata nel repository:

- container Google Tag Manager;
- proprietà Google Analytics 4;
- proprietà Google Search Console;
- service account per API Google.

“Preparato” non equivale a “collegato”. ID, stream, permessi e stato delle proprietà devono essere verificati senza versionare chiavi o secret.

## Decisione proposta: Consent Mode Basic

M6 iniziale usa **Google Consent Mode Basic**.

Contratto:

```text
prima del consenso analytics:
  nessun GTM
  nessun GA4
  nessun ping Google
  analytics_storage = denied
  ad_storage = denied
  ad_user_data = denied
  ad_personalization = denied

dopo consenso analytics esplicito:
  GTM può caricarsi
  GA4 può misurare
  analytics_storage = granted
  tutti i consent type advertising restano denied
```

Razionale:

- il sito non usa Google Ads;
- le affiliazioni sono disabilitate;
- non serve conversion modeling pre-consenso;
- il prodotto parte oggi da zero tracking;
- Basic Mode conserva il confine più semplice da testare: nessun dato a Google prima della scelta.

Advanced Consent Mode e cookieless pings non fanno parte di M6. Potranno essere valutati soltanto in una fase Ads o monetizzazione separata, con nuova decisione e nuova informativa.

## Route incluse ed escluse

### Incluse dopo consenso

Soltanto risposte pubbliche canoniche valide:

```text
/
/destinazioni
/guide
/confronti
/metodo
/trasparenza
/privacy
/{slug-published}
```

### Escluse sempre

```text
/astro-foundation*
/control-room-foundation*
/control-room
/api/*
/go/*
/sitemap.xml
/robots.txt
/_astro/*
404 e file probe
```

La CMP può essere visibile sulle pagine canoniche, compresa Privacy. GTM e GA4 non vengono mai caricati nella Control Room o nella preview.

## Data flow target

```text
browser su route canonica
→ CMP essenziale caricata per prima
→ stato consenso locale della CMP
→ nessun tag Google finché analytics è denied
→ consenso analytics esplicito
→ caricamento singolo GTM
→ tag GA4
→ eventi conformi al dizionario
→ proprietà GA4
```

Search Console non dipende dal consenso e non richiede JavaScript sul sito.

## Storage e categorie

### Necessario

Consentito senza consenso soltanto per:

- memorizzare la scelta del banner;
- sicurezza e funzionamento tecnico;
- impedire che il banner venga riproposto in modo errato.

### Analytics

Attivabile soltanto dopo consenso esplicito.

### Advertising e personalizzazione

Non attivati in M6.

### Applicativo

Il sito pubblico non introduce account, form, newsletter o profilazione.

## Parametri vietati

Nessun evento analytics può contenere:

- nome, email, telefono o indirizzo;
- IP raccolto o persistito dall’applicazione;
- user agent raccolto o persistito dall’applicazione;
- maintenance token, JWT o secret;
- ID interni di brief, claim, bundle o draft;
- dati della Control Room;
- query SQL;
- testo libero inserito dall’utente;
- URL completi con query operative o token;
- contenuti non published.

## URL e query string

La configurazione GA4 deve inviare come `page_location` soltanto:

```text
origin + pathname canonica
```

Le query string non devono essere inviate come proprietà custom. Gli eventuali parametri di campagna gestiti da Google richiedono una decisione separata quando esisterà traffico paid.

## CMP requirements

La CMP scelta deve:

- supportare Google Consent Mode v2;
- supportare Basic Mode o blocco completo dei tag;
- essere caricabile come primo script nel `<head>`;
- offrire banner italiano accessibile da tastiera e mobile;
- offrire “Accetta”, “Rifiuta” e scelta granulare con pari dignità visiva;
- consentire modifica e revoca dal footer;
- memorizzare prova e versione del consenso;
- non richiedere React;
- funzionare con Astro SSR e Cloudflare;
- evitare dipendenze dal renderer legacy;
- consentire staging/test senza contaminare i dati di produzione;
- avere una procedura documentata di rollback/disattivazione.

La scelta finale deriva dallo spike `docs/CMP-SPIKE.md` e viene registrata in `docs/DECISIONS.md` prima del codice.

## Eventi

Il contratto canonico è `docs/MEASUREMENT-EVENT-DICTIONARY.md`.

Prima release:

```text
page_view
provider_redirect_intent
consent_update (solo dataLayer/debug, non inviato a GA4)
```

`navigation_click`, `article_view` e `listing_view` non vengono attivati come eventi separati nella prima release: tipo e contenuto della pagina vengono descritti da parametri bounded del `page_view` per evitare duplicazione e cardinalità inutile.

## Ownership tecnica

### Astro

- punto di inclusione CMP nel layout pubblico;
- attributi semantici bounded per tipo pagina e slug;
- comando footer per modificare il consenso;
- nessun tracking nella React island.

### CMP

- banner e preferenze;
- consenso persistito;
- default denied;
- aggiornamento dello stato;
- blocco o caricamento condizionale di GTM.

### GTM

- un solo container;
- consenso come prerequisito;
- mapping dal dataLayer agli eventi versionati;
- nessun Custom HTML non revisionato;
- nessun tag Ads in M6.

### GA4

- raccolta analytics post-consenso;
- stream web canonico;
- retention e data controls verificati;
- nessun collegamento Ads autorizzato da questa fase.

### Worker e D1

- nessuna nuova responsabilità analytics;
- redirect provider server-side invariato;
- nessuna mutation o migration per M6 foundation.

## Branch plan

```text
1. docs/measurement-consent-scope
2. spike/cmp-comparison
3. feat/public-consent-foundation
4. feat/public-gtm-ga4-foundation
5. docs/search-console-verification
```

Ogni branch resta ristretto e viene verificato separatamente.

## Acceptance — consent foundation

La branch CMP/Consent deve provare:

- nessuna richiesta a domini Google prima del consenso;
- rifiuto persistito e rispettato;
- consenso analytics persistito e rispettato;
- revoca funzionante;
- preferenze riapribili dal footer;
- nessun banner nella Control Room o preview;
- nessun blocco di navigazione, SEO o accessibilità;
- nessun JavaScript pubblico oltre CMP/consent autorizzati;
- nessun doppio caricamento;
- desktop, mobile e tastiera;
- CSP e header compatibili, se introdotti;
- rollback rimuovendo configurazione CMP senza cambiare routing o D1.

## Acceptance — GTM/GA4

La branch analytics deve provare:

- GTM assente prima del consenso;
- GTM caricato una sola volta dopo consenso;
- un solo `page_view` per caricamento pagina;
- `page_location` senza query string;
- parametri conformi al dizionario;
- nessun evento da preview o Control Room;
- `provider_redirect_intent` soltanto dopo consenso;
- redirect D1 ancora operativo e indipendente da GA4;
- GA4 DebugView e Network verificati;
- nessun tag Ads o affiliate;
- performance pubblica ricontrollata.

## Privacy page update

La pagina Privacy dovrà essere aggiornata nella stessa branch che attiva la CMP, non prima.

Dovrà descrivere almeno:

- CMP scelta e finalità;
- storage necessario del consenso;
- Google Analytics 4;
- Consent Mode Basic;
- categorie attive e inattive;
- modalità di revoca;
- dati non inviati intenzionalmente;
- ruolo separato del logging server-side dei redirect;
- data di entrata in vigore.

La revisione legale definitiva resta responsabilità del titolare; il repository documenta il comportamento tecnico effettivo.

## Search Console

Dopo il checkpoint analytics:

- verificare proprietà dominio;
- verificare `https://senzaroaming.it/sitemap.xml`;
- inviare la sitemap;
- registrare data, proprietà e risultato senza credenziali;
- verificare che preview, Control Room e pagine `review` non siano indicizzabili;
- non usare l’API per forzare indicizzazione massiva.

## Non obiettivi

M6 non introduce:

- Google Ads;
- advertising cookies;
- remarketing;
- enhanced conversions;
- affiliate tracking;
- fingerprinting;
- server-side GTM;
- profili utente;
- form o newsletter;
- analytics nella Control Room;
- pubblicazione editoriale;
- modifiche D1, Workflow, Container, AI o gate editoriali;
- rimozione del renderer legacy.

## Exit criteria dello scope

Lo scope è chiuso quando:

- inventario repository documentato;
- Basic Consent Mode accettato come proposta iniziale;
- shortlist CMP definita;
- dizionario eventi v1 versionato;
- route incluse/escluse definite;
- data-flow e dati vietati definiti;
- acceptance e rollback definiti;
- canonici aggiornati;
- PR documentale completamente verde e mergiata.

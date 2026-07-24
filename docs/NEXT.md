# Prossime azioni

Ultimo aggiornamento: **25 luglio 2026**.

Questa lista contiene soltanto il lavoro immediatamente eseguibile.

## Now — chiudere lo scope M6

Branch:

```text
docs/measurement-consent-scope
```

Documenti sul branch:

```text
docs/MEASUREMENT-CONSENT-SCOPE.md
docs/CMP-SPIKE.md
docs/MEASUREMENT-EVENT-DICTIONARY.md
```

Lo scope stabilisce:

- Consent Mode Basic;
- nessun tag o ping Google prima del consenso;
- analytics-only;
- advertising consent sempre negato in M6;
- route canonical incluse;
- preview, Control Room, API, redirect, sitemap, robots e 404 escluse;
- parametri vietati;
- D1 come fonte di verità per redirect completati;
- iubenda come candidato principale per lo spike;
- event dictionary v1.

### 1. Verificare la branch documentale

Controllare che il diff contenga soltanto documentazione e canonici.

Poi:

```text
PR draft
→ CI completa
→ ready
→ merge
```

Nessun tracking viene attivato da questa PR.

## Dopo il merge — spike CMP

Branch proposta:

```text
spike/iubenda-consent-foundation
```

### Scope esclusivo

- configurazione pubblica CMP validata server-side;
- script iubenda soltanto sulle route canonical 200;
- CMP come primo script eseguibile nel `<head>`;
- nessun GTM o GA4;
- Basic Consent Mode / blocco completo dei servizi Google;
- banner italiano;
- Accetta, Rifiuta e Personalizza;
- link footer per riaprire le preferenze;
- aggiornamento della pagina Privacy coerente con il comportamento reale;
- nessuna CMP in preview, Control Room, API, redirect, sitemap, robots o 404;
- test desktop, mobile e tastiera;
- baseline di performance e richieste di rete;
- rollback rimuovendo adapter/configurazione CMP.

### Configurazione esterna richiesta

Prima o durante lo spike servirà un account CMP e gli identificativi pubblici del sito. Non servono chiavi API nel browser.

Variabili previste:

```text
CMP_PROVIDER=iubenda
CMP_SITE_ID=
CMP_COOKIE_POLICY_ID=
```

Gli identificativi pubblici possono vivere nelle vars Cloudflare. Token, password e service-account key non vengono versionati.

### Acceptance dello spike

- nessuna richiesta a domini Google prima del consenso;
- CMP caricata una sola volta;
- rifiuto persistito;
- accettazione analytics persistita;
- revoca funzionante;
- preferenze riapribili dal footer;
- UI accessibile da tastiera e mobile;
- sito leggibile anche se la CMP fallisce;
- nessun React pubblico;
- preview e Control Room escluse;
- privacy page aggiornata;
- impatto prestazionale misurato;
- CI completa verde.

Se iubenda fallisce i gate, il fallback è CookieYes. Non si passa direttamente a una CMP custom.

## Dopo lo spike — consent foundation

Branch tecnica separata:

```text
feat/public-consent-foundation
```

La decisione vendor finale deve essere registrata in `docs/DECISIONS.md` prima dell’implementazione definitiva.

Contratto Consent Mode:

```text
analytics_storage = denied di default
ad_storage = denied
ad_user_data = denied
ad_personalization = denied
```

Soltanto un consenso analytics esplicito può aggiornare:

```text
analytics_storage = granted
```

## GTM/GA4 foundation

Branch successiva:

```text
feat/public-gtm-ga4-foundation
```

### Prima release

- un solo container GTM;
- caricamento soltanto dopo consenso;
- una sola configurazione GA4;
- un solo `page_view` per pagina;
- `page_location = origin + pathname`;
- nessuna query string custom;
- nessun evento da preview o Control Room;
- nessun Ads tag;
- nessun affiliate tag.

### Eventi

```text
page_view
provider_redirect_intent
consent_update locale/debug
```

`article_view` e `listing_view` restano parametri del `page_view`, non eventi separati.

`provider_redirect_intent` viene attivato soltanto dopo il checkpoint del page view. Il redirect effettivo continua a essere registrato server-side in D1.

### Verifica

- Tag Assistant;
- Network panel;
- GA4 DebugView;
- denied/granted/revoke;
- anti-duplicazione;
- route escluse;
- performance;
- CI e smoke Chromium.

## Search Console

Dopo consent e analytics verificati:

```text
verifica proprietà dominio
→ controllo canonical/robots/sitemap
→ submission sitemap
→ registrazione risultato
```

Non forzare indicizzazione di preview, Control Room o pagine `review`.

## Infrastruttura Google da inventariare

Senza esporre secret, confermare:

- ID container GTM;
- proprietà e data stream GA4;
- proprietà Search Console;
- permessi del service account;
- dominio verificato;
- eventuali collegamenti Ads esistenti da mantenere disattivati;
- ambiente production usato dal container.

“Creato” non equivale a “collegato”.

## Track parallela M4

```text
conversione brief
→ operazioni claim
→ decisione draft
→ eventuale retry queue
```

La legacy privata resta finché serve come fallback operativo.

## Publication capability resta separata

M6 non introduce:

```text
review → published
```

La prima pubblicazione richiede ancora branch, identità, conferma, state machine D1, audit, idempotenza, freshness recheck, rollback e test end-to-end.

## Freeze immediato

- niente snippet GTM o GA4 prima della consent foundation;
- niente Advanced Consent Mode o cookieless pings;
- niente tracking pre-consenso;
- niente eventi fuori dal dizionario;
- niente PII o dati editoriali interni;
- niente analytics nella Control Room;
- niente Ads, remarketing o affiliate tracking;
- niente sitemap submission prematura;
- niente secret nel repository;
- niente mutation D1, Workflow, Container, AI o gate editoriali;
- niente pubblicazione automatica;
- niente rimozione legacy durante M6 foundation.

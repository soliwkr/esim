# Prossime azioni

Ultimo aggiornamento: **25 luglio 2026**.

Questa lista contiene soltanto il lavoro immediatamente eseguibile.

## Now — chiudere PR #84

```text
branch spike/iubenda-consent-foundation
PR #84 — Spike iubenda consent foundation
CI applicativa #411 completamente verde
```

Già verificato:

- configurazione server-only fail-closed;
- vars CMP vuote per default;
- nessun cambiamento alla produzione quando la configurazione è assente;
- iubenda soltanto sulle route canonical indexable con fixture locale;
- nessuna CMP su preview, Control Room, API, redirect, sitemap, robots, 404 e file probe;
- ordine config inline → autoblocking → runtime iubenda;
- autoblocking senza `async` o `defer`;
- `googleConsentMode: true`;
- Accetta, Rifiuta e Personalizza configurati;
- link footer per riaprire le preferenze;
- Privacy condizionale;
- nessun GTM o GA4;
- nessuna richiesta Google nel browser smoke;
- desktop, mobile, tastiera e assenza overflow;
- tutte le suite Control Room verdi.

Documento:

```text
docs/IUBENDA-CONSENT-SPIKE-RESULT.md
```

### Prima del merge

```text
STATUS + NEXT + DECISIONS sullo stesso head
→ CI finale code + documentazione
→ aggiornamento descrizione PR
→ ready
→ merge con expected head SHA
```

La CI #411 non viene riutilizzata come scorciatoia dopo gli aggiornamenti documentali.

## Subito dopo — configurare iubenda reale

Lo spike non può certificare il vendor reale senza un sito configurato nella dashboard iubenda.

### Passaggi esterni richiesti

1. creare o aprire il sito `senzaroaming.it` nell’account iubenda;
2. attivare Privacy Controls and Cookie Solution;
3. impostare lingua italiana;
4. applicare GDPR a tutti gli utenti;
5. mostrare Accetta, Rifiuta e Personalizza;
6. disabilitare la chiusura implicita del banner;
7. abilitare blocco preventivo/autoblocking;
8. abilitare Google Consent Mode v2;
9. mantenere TCF/Ads/remarketing disattivati;
10. recuperare dal codice Embed:

```text
siteId
cookiePolicyId
```

Questi sono identificativi pubblici, non secret. Non condividere password, token, chiavi API o service-account JSON.

## Branch di attivazione CMP-only

Dopo aver verificato gli ID reali:

```text
feat/public-consent-foundation
```

Configurazione Cloudflare prevista:

```text
CMP_PROVIDER=iubenda
CMP_SITE_ID=<public siteId>
CMP_COOKIE_POLICY_ID=<public cookiePolicyId>
GTM_ID=
```

GTM deve restare vuoto.

### Scope esclusivo

- configurare le tre vars pubbliche;
- nessun altro codice analytics;
- deploy della sola CMP;
- aggiornamento Privacy con comportamento reale;
- verifica live del banner e della revoca;
- misura performance e richieste vendor;
- decisione definitiva iubenda vs fallback CookieYes;
- rollback azzerando le vars o revertendo la configurazione.

### Checkpoint live obbligatori

- prima visita mostra il banner;
- Accetta funziona;
- Rifiuta funziona;
- Personalizza funziona;
- rifiuto e consenso persistono;
- il footer riapre le preferenze;
- revoca e modifica funzionano;
- nessuna richiesta GTM/GA4/Google Analytics;
- nessuna CMP su `/astro-foundation*`;
- nessuna CMP nella Control Room;
- nessuna CMP su 404, sitemap, robots o API;
- pagina leggibile se il vendor non risponde;
- nessun overflow mobile;
- accessibilità da tastiera;
- impatto prestazionale registrato;
- privacy page coerente;
- nessun cambiamento D1 o editoriale.

## Dopo il checkpoint CMP — GTM/GA4 foundation

Branch separata:

```text
feat/public-gtm-ga4-foundation
```

Non parte prima della verifica live CMP.

Prima release:

- un solo container GTM;
- GTM assente prima del consenso analytics;
- una sola configurazione GA4;
- un solo `page_view` per pagina;
- `page_location = origin + pathname`;
- nessuna query string custom;
- nessun evento da preview o Control Room;
- advertising consent sempre denied;
- nessun Ads o affiliate tag.

Eventi:

```text
page_view
provider_redirect_intent
consent_update locale/debug
```

Il redirect effettivo continua a essere registrato server-side in D1.

## Infrastruttura Google da verificare

Senza esporre secret:

- ID container GTM;
- proprietà e data stream GA4;
- proprietà Search Console;
- permessi service account;
- dominio verificato;
- ambiente production del container;
- eventuali collegamenti Ads da lasciare inattivi.

“Creato” non equivale a “collegato”.

## Search Console

Dopo consent e analytics verificati:

```text
verifica proprietà dominio
→ controllo canonical/robots/sitemap
→ submission sitemap
→ registrazione risultato
```

Preview, Control Room e pagine `review` restano escluse.

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

- niente ID fittizi o di esempio in produzione;
- niente deploy CMP prima della configurazione iubenda reale;
- niente GTM o GA4 nella branch CMP-only;
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
- niente rimozione legacy durante M6.

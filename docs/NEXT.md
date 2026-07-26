# Prossime azioni

Ultimo aggiornamento: **26 luglio 2026**.

Questa lista contiene soltanto il lavoro immediatamente eseguibile.

## Now — chiudere PR #85

```text
branch feat/public-consent-foundation
PR #85 — Activate iubenda remote consent foundation
CI applicativa #421 completamente verde
```

La dashboard iubenda reale non ha restituito il vecchio snippet con `siteId` e `cookiePolicyId`. Ha restituito un embed remoto unificato:

```text
https://embeds.iubenda.com/widgets/{public-uuid}.js
```

La branch adatta quindi la foundation della PR #84 al contratto effettivo del vendor.

### Verificato dalla CI applicativa #421

- resolver server-only fail-closed per `CMP_PROVIDER` e `CMP_EMBED_ID`;
- UUID normalizzato e validato;
- configurazioni assenti, incomplete, non supportate o malformate disabilitate senza output parziale;
- un solo embed remoto iubenda sulle route canonical indexable;
- nessuna CMP su preview, Control Room, API, redirect, sitemap, robots, 404 e file probe;
- nessun vecchio triplet config inline/autoblocking/runtime;
- footer per riaprire le preferenze;
- Privacy page condizionale;
- base Wrangler e regressioni storiche ancora CMP-off;
- preparazione deterministica del config compilato prima del deploy reale;
- deploy bloccato se `GTM_ID` non è vuoto;
- nessuna richiesta Google Analytics, Tag Manager, Ads o DoubleClick;
- desktop, mobile, tastiera e assenza overflow;
- migrazioni D1 invariate;
- quality gate, golden evaluation e Container verdi;
- tutte le suite Control Room verdi.

### Prima del merge

```text
STATUS + NEXT + DECISIONS + risultato spike sullo stesso head
→ CI finale code + documentazione
→ aggiornamento descrizione PR
→ ready
→ merge con expected head SHA
```

La CI #421 non viene riutilizzata come scorciatoia dopo gli aggiornamenti documentali.

## Subito dopo il merge — deploy CMP-only

Il comando di deploy:

```text
npm run build
→ scripts/prepare-production-consent-config.mjs
→ wrangler deploy sul config compilato
```

La preparazione di produzione imposta soltanto:

```text
CMP_PROVIDER=iubenda
CMP_EMBED_ID=<UUID pubblico versionato>
GTM_ID=
```

Il config base resta vuoto per mantenere fail-closed sviluppo, CI e regressioni storiche. Il deploy reale viene invece preparato in modo deterministico dal repository, senza valori manuali nella dashboard Cloudflare.

## Checkpoint live obbligatorio

Dopo il deploy verificare nel browser reale:

- prima visita mostra il banner;
- Accetta funziona;
- Rifiuta funziona;
- Personalizza funziona;
- consenso e rifiuto persistono;
- il footer riapre le preferenze;
- revoca e modifica funzionano;
- configurazione remota iubenda corrisponde a GDPR globale e Basic Consent Mode;
- nessuna richiesta GTM, GA4 o Google Analytics;
- nessuna CMP su `/astro-foundation*`;
- nessuna CMP nella Control Room;
- nessuna CMP su 404, sitemap, robots, API e `/go/*`;
- pagina leggibile se la risorsa vendor non risponde;
- accessibilità da tastiera;
- nessun overflow mobile;
- impatto prestazionale registrato;
- Privacy page coerente;
- nessun cambiamento D1 o editoriale.

Il vendor non viene dichiarato definitivamente accettato finché questo checkpoint non è completo.

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

## Freeze immediato

- niente deploy prima di CI finale e merge della PR #85;
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

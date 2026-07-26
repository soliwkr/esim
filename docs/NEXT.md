# Prossime azioni

Ultimo aggiornamento: **26 luglio 2026**.

Questa lista contiene soltanto il lavoro immediatamente eseguibile.

## Now — chiudere PR #90

Branch:

```text
ops/run-public-consent-deploy-now
```

Stato verificato:

```text
CMP-only deploy: riuscito
workflow run id: 30197982680
server-side live boundary: verificato
GTM: spento
GA4: spento
```

La branch mantiene soltanto il contratto durevole:

- `scripts/prepare-production-d1-binding.mjs`;
- `scripts/smoke-production-deploy-config.mjs`;
- `npm run deploy` con preparazione consent e D1;
- documentazione canonica aggiornata.

Gli hook temporanei usati per il deploy osservabile sono stati rimossi prima del merge.

### Prima del merge

```text
STATUS + NEXT + DECISIONS + deploy result sullo stesso head
→ CI finale completa
→ aggiornamento descrizione PR #90
→ ready
→ merge con expected head SHA
```

Il run di deploy non sostituisce la CI finale sul codice ripulito e documentato.

## Subito dopo — checkpoint UX iubenda reale

Aprire `https://senzaroaming.it` in un browser pulito o in navigazione privata.

Verificare:

- prima visita mostra il banner;
- Accetta funziona;
- Rifiuta funziona;
- Personalizza funziona;
- consenso e rifiuto persistono dopo reload;
- il footer riapre le preferenze;
- modifica e revoca funzionano;
- configurazione remota applica GDPR globale;
- Google Consent Mode resta nel contratto Basic previsto;
- nessuna richiesta GTM, GA4 o Google Analytics;
- nessuna CMP su `/astro-foundation*`;
- nessuna CMP nella Control Room;
- nessuna CMP su 404, sitemap, robots, API e `/go/*`;
- pagina leggibile se iubenda non risponde;
- banner utilizzabile da tastiera;
- nessun overflow mobile;
- impatto prestazionale registrato;
- Privacy coerente con il comportamento reale.

Il checkpoint automatico ha già provato route e HTML server-side. Questa verifica chiude invece UI, persistenza, revoca e comportamento reale del vendor.

## Decisione vendor

Dopo il checkpoint UX:

```text
tutti i criteri superati
→ iubenda accettata definitivamente

blocco funzionale, accessibilità o performance non accettabile
→ rollback CMP
→ valutazione fallback CookieYes
```

Rollback CMP-only:

- ripristinare configurazione vuota nel preparatore production consent;
- nuovo deploy controllato;
- verificare assenza embed e link preferenze;
- registrare il risultato.

## Dopo l’accettazione CMP — GTM/GA4 foundation

Branch separata:

```text
feat/public-gtm-ga4-foundation
```

Non parte prima della chiusura del checkpoint UX iubenda.

Prima release:

- un solo container GTM;
- nessun GTM prima del consenso analytics;
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

- niente GTM o GA4 prima della chiusura UX CMP;
- niente Advanced Consent Mode o cookieless pings;
- niente tracking pre-consenso;
- niente eventi fuori dal dizionario;
- niente PII o dati editoriali interni;
- niente analytics nella Control Room;
- niente Ads, remarketing o affiliate tracking;
- niente sitemap submission prematura;
- niente secret o UUID D1 nel repository;
- niente mutation D1, Workflow, Container, AI o gate editoriali;
- niente pubblicazione automatica;
- niente rimozione legacy durante M6.

# Deploy Cloudflare

Ultimo aggiornamento: **28 luglio 2026**.

## Principio

Il repository conserva un config sorgente portabile e fail-closed. Gli identificatori remoti specifici dell’account vengono risolti soltanto durante il deploy e inseriti nel config Worker compilato.

Non versionare token, secret o UUID D1.

## Database D1

Binding canonica:

```text
binding: DB
database_name: senza-roaming
database_id: REPLACE_WITH_D1_DATABASE_ID
```

Il placeholder nel `wrangler.jsonc` è intenzionale.

Durante il deploy:

```text
scripts/prepare-production-d1-binding.mjs
```

- usa Wrangler autenticato per elencare i database remoti;
- richiede un solo database chiamato `senza-roaming`;
- valida il relativo UUID;
- aggiorna soltanto `apps/web/dist/server/wrangler.json`;
- non stampa e non versiona l’UUID;
- fallisce su database mancanti, duplicati, binding ambigue o ID discordanti.

La creazione iniziale di un database, per un account nuovo, è provisioning
separato e non appartiene al workflow di deploy. Il workflow production non
esegue mai `d1 create`.

## Migrazioni

Locale:

```bash
npm run db:migrate:local
```

Produzione:

```bash
npm run db:migrate:remote
```

Le migrazioni remote restano un’operazione distinta dal deploy del frontend e
non vengono eseguite implicitamente da `npm run deploy` né dal workflow
production.

## Configurazione pubblica

Il `wrangler.jsonc` sorgente conserva:

```text
SITE_NAME=Senza Roaming
SITE_URL=https://senzaroaming.it
CMP_PROVIDER=
CMP_EMBED_ID=
GTM_ID=
AFFILIATE_MODE=disabled
```

Sviluppo e CI restano quindi CMP-off e analytics-off per default.

Il deploy M6 prepara nel solo config compilato:

```text
CMP_PROVIDER=iubenda
CMP_EMBED_ID=<Actions secret o variable>
GTM_ID=<Actions secret o variable>
GA4_MEASUREMENT_ID=<Actions secret o variable>
AFFILIATE_MODE=disabled
```

`scripts/preflight-production-deploy.mjs` e i preparatori rifiutano:

- configurazione CMP, GTM o GA4 assente o invalida;
- valori M6 già scritti nel config sorgente;
- `AFFILIATE_MODE` diverso da `disabled`;
- `CMP_SITE_ID` o `CMP_COOKIE_POLICY_ID` legacy;
- configurazioni Ads o DoubleClick.

## Secret GitHub Actions

Richiesti per il deploy Wrangler:

```text
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID
```

La configurazione M6 usa i nomi Actions già previsti:

```text
CMP_PROVIDER
CMP_EMBED_ID
GTM_ID
GA4_MEASUREMENT_ID
```

Il workflow accetta ciascun valore da secret o variable, applica il masking e
non lo stampa. Altri secret applicativi restano configurati in Cloudflare e non
devono essere stampati, copiati nelle PR o inseriti nel repository.

## Comando canonico

```bash
npm run deploy
```

Sequenza:

```text
preflight M6 + AFFILIATE_MODE
→
Astro build
→ preparazione consent
→ preparazione measurement consent-gated
→ risoluzione binding D1 remota
→ wrangler deploy sul config compilato
```

Il comando non esegue migrazioni D1 e non introduce pubblicazione editoriale.

## Checkpoint prima del deploy

- CI completamente verde;
- configurazione M6 presente e valida nel contesto Actions;
- `AFFILIATE_MODE=disabled`;
- nessun Ads, remarketing o affiliate tracking;
- nessuna mutation D1 o modifica dei gate editoriali;
- scope e rollback dichiarati.

## Checkpoint dopo il deploy

- route canoniche operative;
- binding D1 valida;
- CMP soltanto sulle route pubbliche canonical indexable;
- preview, Control Room, API, `/go/*`, sitemap, robots e 404 escluse;
- bootstrap GTM/GA4 inerte prima del consenso Misurazione;
- preview e Control Room senza CMP o measurement;
- risultato registrato nei documenti canonici.

## Workflow GitHub

`.github/workflows/deploy-production.yml` è avviabile soltanto con
`workflow_dispatch`. Non esiste trigger `push` su `main`.

Il workflow:

- installa con `npm ci`;
- esegue typecheck e preflight fail-closed;
- verifica in read-only la presenza dei Worker secrets richiesti;
- invoca esclusivamente `npm run deploy`;
- non crea D1 e non applica migration remote;
- verifica route M7, preview e header, sitemap/robots, published-only, CMP,
  measurement consent-gated e Control Room protetta.

Merge e deploy restano decisioni distinte. La draft PR di sicurezza non
autorizza né esegue un deploy.

## Dominio

Il dominio operativo e canonico è:

```text
https://senzaroaming.it
```

Il redirect `www → apex` resta un checkpoint separato da ricontrollare.

## Misurazione

Gli eventi canonici M6 sono definiti in:

```text
docs/MEASUREMENT-EVENT-DICTIONARY.md
```

La CMP non autorizza automaticamente l'esecuzione di GTM o GA4. Il bootstrap
resta `text/plain` e viene attivato soltanto dal consenso alla finalità
Misurazione.

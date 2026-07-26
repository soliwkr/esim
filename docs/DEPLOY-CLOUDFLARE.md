# Deploy Cloudflare

Ultimo aggiornamento: **26 luglio 2026**.

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

Creazione iniziale, soltanto per un account nuovo:

```bash
npx wrangler d1 create senza-roaming
```

## Migrazioni

Locale:

```bash
npm run db:migrate:local
```

Produzione:

```bash
npm run db:migrate:remote
```

Le migrazioni remote restano un’operazione distinta dal deploy del frontend e non vengono eseguite implicitamente da `npm run deploy`.

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

Il deploy CMP-only prepara nel solo config compilato:

```text
CMP_PROVIDER=iubenda
CMP_EMBED_ID=<UUID pubblico versionato>
GTM_ID=
```

`scripts/prepare-production-consent-config.mjs` rifiuta:

- `GTM_ID` valorizzato;
- `CMP_SITE_ID` o `CMP_COOKIE_POLICY_ID` legacy;
- configurazioni incomplete o non previste.

## Secret GitHub Actions

Richiesti per il deploy Wrangler:

```text
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID
```

Altri secret applicativi restano configurati in Cloudflare e non devono essere stampati, copiati nelle PR o inseriti nel repository.

## Comando canonico

```bash
npm run deploy
```

Sequenza:

```text
Astro build
→ preparazione consent CMP-only
→ risoluzione binding D1 remota
→ wrangler deploy sul config compilato
```

Il comando non esegue migrazioni D1 e non introduce pubblicazione editoriale.

## Checkpoint prima del deploy

- CI completamente verde;
- `GTM_ID` vuoto;
- nessun Ads, remarketing o affiliate tracking;
- nessuna mutation D1 o modifica dei gate editoriali;
- scope e rollback dichiarati.

## Checkpoint dopo il deploy

- route canoniche operative;
- binding D1 valida;
- CMP soltanto sulle route pubbliche canonical indexable;
- preview, Control Room, API, `/go/*`, sitemap, robots e 404 escluse;
- nessun GTM o GA4 prima del relativo scope separato;
- risultato registrato nei documenti canonici.

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

La CMP non autorizza automaticamente GTM o GA4. La loro attivazione richiede una branch separata dopo la verifica completa del banner reale.

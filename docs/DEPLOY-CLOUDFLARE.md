# Deploy Cloudflare

## 1. Database D1

```bash
npx wrangler d1 create senza-roaming
```

Copiare il `database_id` restituito dentro `wrangler.jsonc`.

## 2. Migrazioni

Locale:

```bash
npm run db:migrate:local
```

Produzione:

```bash
npm run db:migrate:remote
```

## 3. Variabili

Aggiornare in `wrangler.jsonc`:

```text
SITE_NAME
SITE_URL
GTM_ID
AFFILIATE_MODE
```

## 4. Secret

Dopo approvazione affiliate:

```bash
npx wrangler secret put AFFILIATE_LINKS_JSON
```

## 5. GitHub Actions

Aggiungere nei secret del repository:

```text
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID
```

Il push esegue soltanto il typecheck. Il deploy è manuale tramite `workflow_dispatch` per evitare pubblicazioni accidentali.

## 6. Dominio

Il brand di lavoro è **Senza Roaming**. Prima di modificare `SITE_URL`, verificare e registrare il dominio scelto presso un registrar. Non assumere che un dominio sia disponibile finché l'ordine non è completato.

## 7. Tracking

`GTM_ID` è predisposto ma va attivato soltanto insieme a una CMP e al consenso appropriato. L'evento applicativo da configurare è:

```text
outbound_click
```

Parametri previsti:

```text
provider
placement
```

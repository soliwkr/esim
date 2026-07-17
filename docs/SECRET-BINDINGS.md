# Secret bindings del Worker

Il Worker `senza-roaming` richiede due secret cifrati disponibili direttamente nel suo ambiente di esecuzione:

```text
MAINTENANCE_TOKEN
AI_GATEWAY_TOKEN
```

## Dove inserirli

Nel pannello Cloudflare:

```text
Workers & Pages
→ senza-roaming
→ Impostazioni
→ Variabili e segreti
→ Aggiungi
→ Tipo: Secret
```

Dopo aver aggiunto entrambi i valori, premere `Distribuisci` nella stessa schermata. Un secret salvato soltanto nel Secrets Store dell'account non diventa automaticamente una variabile del Worker: deve essere aggiunto come secret del Worker o collegato tramite un binding esplicito.

## Verifica

Aprire:

```text
/api/health
```

Il risultato corretto contiene:

```json
{
  "maintenanceApi": "enabled",
  "aiGateway": "enabled"
}
```

## Deploy

`wrangler.jsonc` dichiara entrambi i nomi come secret obbligatori. I deploy successivi devono fallire se il Worker non li possiede, evitando un falso esito verde con API disabilitate.

I valori non devono essere committati, stampati nei log o condivisi in chat.

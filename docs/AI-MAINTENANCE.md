# AI maintenance layer

Senza Roaming non usa l'AI come generatore automatico di articoli. La usa come operatore di manutenzione su dati strutturati, fonti datate e claim verificabili.

## Principio operativo

```text
fonte ufficiale
  -> task di manutenzione
  -> lettura e confronto
  -> claim strutturati
  -> rilevazione cambiamenti o conflitti
  -> revisione editoriale
  -> eventuale pubblicazione
```

L'agente non modifica direttamente lo stato di una pagina da `review` a `published`.

## Tabelle

### `source_registry`

Una riga per ogni fonte canonica. Registra:

- entità alimentata;
- tipo e URL della fonte;
- livello di fiducia;
- frequenza di controllo;
- data dell'ultimo controllo e dell'ultimo cambiamento;
- hash del contenuto, ETag e Last-Modified;
- errori consecutivi.

### `claim_verifications`

Una riga per ogni affermazione verificabile, per esempio:

- `price_eur`;
- `validity_days`;
- `data_gb`;
- `unlimited_policy`;
- `hotspot_policy`;
- `fair_use_policy`;
- `activation_policy`;
- `refund_policy`;
- `network`;
- `device_compatibility`.

Ogni claim conserva fonte, valore JSON, stato, confidenza, evidenza, data di controllo e scadenza.

### `maintenance_queue`

Coda consumabile da n8n, GitHub Actions o un agente dedicato. I task previsti sono:

- `refresh_source`;
- `verify_claims`;
- `refresh_page`;
- `compare_plans`;
- `editorial_review`.

## Sicurezza

L'API è disabilitata finché non viene configurato il secret Cloudflare:

```bash
npx wrangler secret put MAINTENANCE_TOKEN
```

Tutte le richieste devono contenere:

```http
Authorization: Bearer <MAINTENANCE_TOKEN>
```

Il token non deve essere inserito in `wrangler.jsonc`, GitHub o documenti pubblici.

## Endpoint

### Stato

```http
GET /api/maintenance/status
```

Restituisce fonti, fonti scadute, coda, pagine in revisione e i prossimi task.

### Accodamento fonti scadute

```http
POST /api/maintenance/enqueue-due
```

Crea al massimo un task giornaliero per ogni fonte che ha superato la propria finestra di freschezza.

### Presa in carico atomica

```http
POST /api/maintenance/claim-task
Content-Type: application/json

{"workerId":"n8n-source-checker"}
```

Il task con priorità più alta passa da `pending` a `processing` tramite un'unica query `UPDATE ... RETURNING`.

### Registrazione del controllo

```http
POST /api/maintenance/source-check
Content-Type: application/json

{
  "taskId": 1,
  "sourceId": 1,
  "httpStatus": 200,
  "changed": true,
  "contentHash": "sha256:...",
  "etag": "...",
  "lastModified": "...",
  "notes": "Pagina provider letta correttamente.",
  "claims": [
    {
      "fieldName": "hotspot_policy",
      "value": "Consentito secondo le condizioni del piano",
      "status": "verified",
      "confidence": 1,
      "evidence": "Estratto breve e contestuale della fonte ufficiale"
    }
  ]
}
```

Quando `changed=true`, il sistema crea automaticamente un task `editorial_review`. Non pubblica la pagina.

### Fallimento controllato

```http
POST /api/maintenance/task-failure
Content-Type: application/json

{"taskId":1,"error":"Timeout durante la lettura della fonte"}
```

Il task viene riprogrammato dopo 15 minuti fino al numero massimo di tentativi; poi passa a `failed`.

## Primo ciclo da automatizzare

1. Chiamare `enqueue-due` una volta al giorno.
2. Chiamare `claim-task`.
3. Recuperare esclusivamente la fonte indicata nel payload.
4. Estrarre claim senza inventare valori mancanti.
5. Inviare il risultato a `source-check` oppure `task-failure`.
6. Fermarsi quando `claim-task` restituisce `task: null`.
7. Revisionare manualmente i task `editorial_review` prima di aggiornare contenuti e stato delle pagine.

## Regole non negoziabili

- Le fonti ufficiali prevalgono sulle sintesi di terzi.
- Un dato assente resta assente; non viene dedotto dall'AI.
- Un conflitto diventa `conflict`, non viene risolto scegliendo il valore più conveniente.
- Prezzi e condizioni devono conservare la data di verifica.
- Le recensioni devono distinguere dichiarazioni del provider, test diretto e giudizio editoriale.
- Nessuna commissione affiliate può determinare automaticamente la classifica.

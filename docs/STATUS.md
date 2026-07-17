# Stato del progetto

Data di riferimento: **17 luglio 2026**.

Questo documento fotografa lo stato reale di Senza Roaming. Va aggiornato quando cambia un fatto operativo, non quando cambia soltanto un'intenzione.

## Stato sintetico

| Area | Stato | Nota |
|---|---|---|
| Dominio principale | Operativo | `https://senzaroaming.it` serve il Worker |
| Dominio `www` | Da verificare | redirect 308 implementato e unito; serve conferma dopo il deploy più recente |
| Worker | Operativo | health pubblico positivo |
| D1 | Operativo | migrazioni `0001`–`0008` applicabili via deploy |
| API manutenzione | Operativa | protetta da `MAINTENANCE_TOKEN` |
| Container last30days | Operativo | health restituisce Python 3.12.13 e commit upstream fissato |
| Workflow recent-demand | Operativo a livello di enqueue | prima istanza accettata; completamento e ingest da verificare |
| AI Gateway | Configurato | token presente nel Worker |
| Vertex AI | Bloccato esternamente | Google restituisce `BILLING_DISABLED` finché il billing account non viene riattivato |
| Affiliazioni | Disabilitate | link ufficiali non remunerati |
| Analytics | Non configurata | GTM predisposto, CMP/GA4/GSC ancora da collegare |
| Dashboard privata | Non costruita | API di base già disponibili |
| Contenuti | Parziali | pagine fondamentali disponibili; pagine commerciali restano soggette a verifica |

## Verifiche completate

### Worker e dominio

Health pubblico osservato:

```json
{
  "ok": true,
  "site": "Senza Roaming",
  "affiliateMode": "disabled",
  "maintenanceApi": "enabled",
  "aiGateway": "enabled"
}
```

### Container

Health osservato:

```json
{
  "ok": true,
  "service": "last30days-runner",
  "upstreamCommit": "249c7a4c040558a903d6838dee31012980d4946d",
  "python": "3.12.13"
}
```

### Prima ricerca manuale

Istanza accettata:

```text
manual-20260717084113-0bc853bc
```

Stato iniziale osservato:

```json
{
  "status": "queued",
  "error": null,
  "output": null,
  "rollback": null
}
```

Resta da verificare:

- stato finale dell'istanza;
- eventuali errori di esecuzione;
- numero di segnali importati in D1;
- task editoriale creato dal Workflow.

### 404 e scanner

Le richieste verso file inesistenti restituiscono correttamente:

```text
HTTP/2 404
cache-control: no-store
x-robots-tag: noindex, nofollow
x-content-type-options: nosniff
referrer-policy: strict-origin-when-cross-origin
```

## Blocchi esterni

### Google Cloud Billing

Il percorso Worker → Cloudflare AI Gateway → Vertex AI è stato raggiunto correttamente. Google ha risposto con `403 BILLING_DISABLED`.

Non risultano necessarie modifiche a:

- Cloudflare AI Gateway;
- service account Vertex;
- provider key BYOK;
- secret Worker;
- modello configurato.

A riattivazione completata, ripetere soltanto il test `/api/maintenance/ai-smoke`.

## Rischi aperti

1. Mancanza di una vista semplice sullo stato finale delle istanze Workflow.
2. Mancanza di una dashboard privata per radar, fonti, claim e coda editoriale.
3. Assenza di Search Console e analytics: il progetto non misura ancora domanda organica reale o conversioni.
4. Le pagine commerciali non devono uscire dalla revisione senza fonti ufficiali aggiornate.
5. Il repository pubblico non deve contenere token, link affiliate segreti o credenziali.

## Prossimo checkpoint

Il prossimo checkpoint tecnico è raggiunto quando:

- il redirect `www → apex` è verificato in produzione;
- la prima istanza recent-demand ha uno stato finale noto;
- i segnali importati sono leggibili;
- esiste un endpoint o una vista per seguire i run;
- il test Vertex viene ripetuto dopo la riattivazione del billing.

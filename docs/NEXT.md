# Prossime azioni

Questa lista contiene soltanto il lavoro immediatamente eseguibile. La roadmap completa vive in `ROADMAP.md`.

Ultimo aggiornamento: **17 luglio 2026**.

## Now

### 1. Verificare il redirect canonico

Dopo il deploy più recente:

```bash
curl -I "https://www.senzaroaming.it/guide?test=$(date +%s)"
```

Atteso:

```text
HTTP/2 308
location: https://senzaroaming.it/guide?test=...
```

Poi:

```bash
curl -IL "https://www.senzaroaming.it/settings.py?test=$(date +%s)"
```

Atteso:

```text
308 www → apex
404 file inesistente
```

### 2. Verificare la prima istanza recent-demand

Istanza:

```text
manual-20260717084113-0bc853bc
```

Controllare nei Workflows Cloudflare:

- stato finale;
- durata;
- step fallito, se presente;
- output restituito dal Container;
- ingest D1;
- task editoriale creato.

Poi leggere i segnali:

```bash
curl -sS \
  "https://senzaroaming.it/api/maintenance/research-signals?status=new&limit=20" \
  -H "Authorization: Bearer IL_TUO_MAINTENANCE_TOKEN"
```

Non incollare token o credenziali nei log, nelle issue o nella chat.

### 3. Aggiungere osservabilità delle ricerche

Implementare:

```text
GET /api/maintenance/research-runs
GET /api/maintenance/research-run-status?id=<instanceId>
```

Risposta minima per un run:

```json
{
  "id": "manual-...",
  "status": "queued|running|completed|failed",
  "startedAt": null,
  "completedAt": null,
  "durationMs": null,
  "signalCount": 0,
  "error": null
}
```

Requisiti:

- autenticazione con `MAINTENANCE_TOKEN`;
- nessun secret nella risposta;
- stato persistito in D1;
- errore sintetico e payload grezzo non pubblico;
- aggiornamento idempotente da parte del Workflow.

### 4. Preparare la Dashboard MVP

Prima versione:

- stato servizi;
- run recenti;
- segnali nuovi;
- task editoriali aperti;
- fonti scadute;
- azione per avviare una ricerca manuale.

Non includere ancora:

- editing completo delle pagine;
- analytics avanzata;
- affiliazioni;
- OpenSEO incorporato;
- funzioni multi-progetto dello studio.

### 5. Ripetere Vertex smoke quando il billing torna attivo

```bash
curl -sS -X POST \
  "https://senzaroaming.it/api/maintenance/ai-smoke" \
  -H "Authorization: Bearer IL_TUO_MAINTENANCE_TOKEN"
```

Atteso: risposta contenente `SENZA_ROAMING_AI_OK`.

Non cambiare service account, AI Gateway o secret prima di aver verificato la riattivazione del billing Google.

## Next

Dopo il checkpoint infrastrutturale:

1. clustering e deduplicazione dei segnali;
2. brief editoriale strutturato;
3. primo blocco di pagine Tier 1 verificate;
4. Search Console e sitemap;
5. CMP, GTM e GA4;
6. dizionario canonico degli eventi;
7. Dashboard con coda editoriale e registro claim.

## Later

- OpenSEO come servizio condiviso dello studio;
- Trends MCP per momentum e stagionalità;
- Command Center multi-progetto;
- programmi affiliate;
- attribuzione economica;
- espansione internazionale.

## Definition of Done del checkpoint attuale

- [ ] redirect `www` verificato;
- [ ] prima istanza Workflow conclusa con stato noto;
- [ ] segnali D1 verificati oppure errore diagnosticato;
- [ ] endpoint di osservabilità implementati e testati;
- [ ] Dashboard MVP avviata;
- [ ] Vertex smoke ripetuto dopo la riattivazione GCP;
- [ ] `docs/STATUS.md` aggiornato con i risultati reali.

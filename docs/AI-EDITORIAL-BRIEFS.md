# Brief editoriali controllati con Vertex AI

Questo modulo trasforma esclusivamente i segnali recenti marcati `eligible_for_editorial=1` in proposte editoriali revisionabili.

## Flusso

```text
research_signals eligible
  -> Cloudflare AI Gateway BYOK
  -> Vertex AI / Gemini
  -> JSON strutturato
  -> ai_editorial_runs
  -> editorial_briefs
  -> maintenance_queue editorial_review
  -> decisione umana
```

L'AI non pubblica pagine, non modifica claim verificati e non considera Reddit o YouTube fonti ufficiali per prezzi, copertura, reti, hotspot, fair use, VPN o rimborsi.

## Dati conservati

`ai_editorial_runs` registra:

- modello e versione del prompt;
- ID dei segnali analizzati;
- stato, utilizzo e response ID;
- numero di brief oppure errore sintetico.

`editorial_briefs` conserva:

- cluster e titolo proposto;
- tipo di asset e intento di ricerca;
- opportunity score prodotto dal modello;
- evidence score deterministico calcolato dal Worker;
- rischi e quality flag;
- verifiche ufficiali richieste;
- scaletta;
- stato umano `proposed`, `accepted`, `dismissed` o `converted`.

La tabella `editorial_brief_signals` mantiene il collegamento verificabile tra ogni brief e i segnali che lo hanno generato.

## Endpoint protetti

### Genera brief

```http
POST /api/maintenance/editorial-analyze
Authorization: Bearer <MAINTENANCE_TOKEN>
Content-Type: application/json

{
  "signalIds": [1],
  "reason": "first_editorial_test"
}
```

Senza `signalIds`, il sistema prende fino a 12 segnali nuovi e idonei. `limit` accetta valori da 1 a 20. La stessa selezione non viene addebitata due volte: il run è idempotente, salvo `"force": true`.

### Elenca brief

```http
GET /api/maintenance/editorial-briefs?status=proposed&limit=30
```

Stati ammessi: `proposed`, `accepted`, `dismissed`, `converted`, `all`.

### Decisione umana

```http
POST /api/maintenance/editorial-brief-action
Authorization: Bearer <MAINTENANCE_TOKEN>
Content-Type: application/json

{
  "briefIds": [1],
  "status": "accepted",
  "notes": "Approvo la ricerca sulle eSIM per la Cina; verificare le fonti ufficiali."
}
```

Un brief deve essere `accepted` prima di diventare `converted`. Nessuno dei due stati pubblica automaticamente una pagina.

## Scoring

`opportunityScore` valuta il potenziale editoriale sulla base della domanda osservata.

`evidenceScore` viene calcolato nel Worker usando:

- rilevanza;
- freschezza rispetto alla finestra del radar;
- corroborazione;
- diversità delle fonti;
- penalità per contenuto promozionale.

I due valori restano separati: un tema può essere interessante ma sostenuto da evidenza debole.

## Output strutturato

La richiesta Vertex usa `responseMimeType: application/json` e un `responseSchema`. Il Worker valida nuovamente ogni campo e rifiuta brief che non citano ID presenti nella selezione.

I payload inviati al modello non vengono raccolti nei log AI Gateway (`cf-aig-collect-log-payload: false`).

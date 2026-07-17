# Radar della domanda recente

Senza Roaming usa `last30days` come sorgente di intelligence editoriale. Il suo compito non è certificare prezzi, copertura, reti o condizioni commerciali. Serve a rilevare ciò che viaggiatori e utenti stanno chiedendo, confrontando o lamentando nelle ultime settimane.

Repository upstream fissato nell'immagine Container:

```text
https://github.com/mvanhorn/last30days-skill
commit 249c7a4c040558a903d6838dee31012980d4946d
```

Il pin impedisce che un aggiornamento upstream non verificato entri automaticamente in produzione.

## Architettura Cloudflare

```text
Cloudflare Workflow
  -> Cloudflare Container on demand
  -> Python 3.12 + last30days
  -> export JSON agent versionato
  -> normalizzazione nel Worker
  -> D1 research_runs + research_signals
  -> maintenance_queue editorial_review
  -> spegnimento del Container dopo inattività
```

Il Container non è esposto direttamente su Internet. Il Worker lo raggiunge tramite un Durable Object binding e protegge gli endpoint operativi con `MAINTENANCE_TOKEN`.

## Confine di fiducia

```text
community/social evidence
  -> domanda, linguaggio, dubbi, problemi percepiti
  -> research_signals
  -> revisione editoriale

fonti ufficiali
  -> prezzi, dati, durata, hotspot, fair use, rete, rimborsi
  -> claim_verifications
  -> quality gate commerciale
```

Un segnale Reddit, YouTube o Web non può diventare un claim commerciale verificato. Può soltanto aprire una ricerca, una FAQ, una guida o un controllo su una fonte ufficiale.

## Container

L'immagine si trova in:

```text
containers/last30days/Dockerfile
containers/last30days/server.py
```

Caratteristiche operative:

- Python 3.12;
- esecuzione come utente non privilegiato;
- una sola ricerca contemporanea;
- timeout massimo di 15 minuti;
- query limitate a 500 caratteri;
- payload massimo di 64 KB;
- browser cookies disabilitati;
- nessuna credenziale social incorporata nell'immagine;
- fonti iniziali ammesse: Reddit, YouTube, Web, Hacker News, GitHub, Polymarket, Digg, arXiv e Techmeme.

Endpoint interno del Container:

```text
GET  /health
POST /run
```

## Workflow

Workflow Cloudflare:

```text
senza-roaming-recent-demand
```

Pianificazione iniziale, in UTC:

```text
Lunedì 05:00
Giovedì 05:00
```

Batch del lunedì:

```text
eSIM viaggio problemi
Airalo vs Holafly recent experiences
```

Batch del giovedì:

```text
best eSIM Japan recent experiences
travel eSIM questions unanswered
```

Ogni query usa inizialmente il profilo `quick` e le fonti Reddit, YouTube e Web. Il Workflow esegue retry controllati e importa direttamente il JSON in D1 senza attraversare un endpoint pubblico.

## Endpoint protetti

### Stato del runner

```http
GET /api/maintenance/research-runner-health
Authorization: Bearer <MAINTENANCE_TOKEN>
```

La prima chiamata può richiedere più tempo perché avvia il Container.

### Esecuzione manuale

```http
POST /api/maintenance/research-run
Authorization: Bearer <MAINTENANCE_TOKEN>
Content-Type: application/json

{
  "reason": "manual_test",
  "queries": [
    {
      "query": "eSIM viaggio problemi",
      "depth": "quick",
      "sources": ["reddit", "youtube", "web"]
    }
  ]
}
```

Sono accettate da una a sei query per avvio. La risposta `202` restituisce l'ID dell'istanza Workflow; la ricerca prosegue in modo durevole.

### Importazione manuale compatibile

Il vecchio percorso resta disponibile per importare un export JSON già prodotto altrove:

```http
POST /api/maintenance/research-ingest
Authorization: Bearer <MAINTENANCE_TOKEN>
Content-Type: application/json
```

Oppure:

```bash
export SENZA_ROAMING_MAINTENANCE_URL="https://senzaroaming.it"
export MAINTENANCE_TOKEN="..."
npm run research:ingest -- research.json
```

## Contratto accettato

L'ingest accetta:

- export agent standard con `schema_version` in formato `major.minor`;
- export `kind: "discovery"`;
- export di confronto con `comparison: true`.

Il sistema conserva soltanto campi normalizzati:

- query e finestra temporale;
- stato delle fonti;
- titolo e sintesi del segnale;
- fonte, URL e data;
- engagement nativo;
- rilevanza;
- cluster, momentum e corroborazione.

Non conserva automaticamente l'intero corpus o le credenziali del motore di ricerca.

## Consultazione dei segnali

```http
GET /api/maintenance/research-signals?status=new&limit=30
GET /api/maintenance/research-signals?status=new&type=complaint&limit=30
GET /api/maintenance/research-signals?status=new&type=question&limit=30
```

Tipi assegnati dal normalizzatore:

- `question`;
- `complaint`;
- `comparison`;
- `recommendation`;
- `trend`;
- `content_gap`.

La classificazione è un aiuto operativo, non una verità editoriale.

## Revisione

```http
POST /api/maintenance/research-signal-action
Authorization: Bearer <MAINTENANCE_TOKEN>
Content-Type: application/json

{
  "signalIds": [12, 13],
  "status": "accepted",
  "notes": "Creare FAQ su hotspot e fair use per il Giappone."
}
```

Stati disponibili:

```text
new -> reviewed -> accepted -> converted
                    \-> dismissed
```

`converted` significa che il segnale è stato trasformato in un blueprint, una FAQ, un task di verifica o un aggiornamento editoriale.

## Comportamento automatico

Ogni nuovo report:

1. calcola un hash del payload per evitare duplicati;
2. normalizza al massimo 100 segnali;
3. conserva lo stato delle fonti, distinguendo `no-results` da errori e fonti non configurate;
4. crea un task `editorial_review` nella coda di manutenzione;
5. non modifica pagine pubblicate;
6. non crea claim commerciali verificati;
7. lascia al quality gate il passaggio verso contenuti pubblicabili.

## Costi e capacità

La configurazione usa un solo Container con `max_instances: 1` e spegnimento automatico dopo due minuti di inattività. Le ricerche programmate sono intenzionalmente piccole. Fonti premium, scraping autenticato, X, TikTok, Instagram e LinkedIn restano disattivati finché non esiste una ragione economica per abilitarli.

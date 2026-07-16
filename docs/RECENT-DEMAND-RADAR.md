# Radar della domanda recente

Senza Roaming usa `last30days` come sorgente opzionale di intelligence editoriale. Il suo compito non è certificare prezzi, copertura, reti o condizioni commerciali. Serve a rilevare ciò che viaggiatori e utenti stanno chiedendo, confrontando o lamentando nelle ultime settimane.

Repository upstream:

```text
https://github.com/mvanhorn/last30days-skill
```

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

Un segnale Reddit, YouTube, TikTok o X non può diventare un claim commerciale verificato. Può soltanto aprire una ricerca, una FAQ, una guida o un controllo su una fonte ufficiale.

## Perché non viene incorporato nel Worker

`last30days` è un motore locale/agentico con Python 3.12, più fonti esterne e credenziali opzionali. Deve essere eseguito su una workstation, VPS, runner GitHub o workflow n8n. Il Cloudflare Worker riceve soltanto l'export JSON stabile.

## Contratto accettato

L'endpoint accetta:

- export agent standard con `schema_version` in formato `major.minor`;
- export `kind: "discovery"`;
- export di confronto con `comparison: true`.

Il profilo previsto è quello prodotto da:

```bash
python3 skills/last30days/scripts/last30days.py "eSIM travel problems" --emit=json --output research.json
```

Il sistema conserva soltanto campi normalizzati, non una copia completa del report:

- query e finestra temporale;
- stato delle fonti;
- titolo e sintesi del segnale;
- fonte, URL e data;
- engagement nativo;
- rilevanza;
- cluster, momentum e corroborazione.

## Query iniziali consigliate

Eseguire sia query italiane sia inglesi, perché molte discussioni eSIM sono internazionali:

```text
eSIM viaggio problemi
Airalo problemi rimborso hotspot
Holafly fair use hotspot speed
best eSIM Japan recent experiences
eSIM USA travel complaints
eSIM Turkey activation problems
travel eSIM questions unanswered
Airalo vs Holafly recent experiences
```

Per scoprire temi emergenti:

```bash
python3 skills/last30days/scripts/last30days.py --discover "travel connectivity eSIM" --emit=json --output discovery.json
```

## Importazione

Configurare localmente, senza committare i valori:

```bash
export SENZA_ROAMING_MAINTENANCE_URL="https://senzaroaming.it"
export MAINTENANCE_TOKEN="..."
```

Importare il file:

```bash
npm run research:ingest -- research.json
```

Endpoint equivalente:

```http
POST /api/maintenance/research-ingest
Authorization: Bearer <MAINTENANCE_TOKEN>
Content-Type: application/json
```

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

Dopo la valutazione, aggiornare uno o più segnali:

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

Ogni nuovo import:

1. calcola un hash del payload per evitare duplicati;
2. normalizza al massimo 100 segnali;
3. conserva lo stato delle fonti, distinguendo `no-results` da errori e fonti non configurate;
4. crea un task `editorial_review` nella coda di manutenzione;
5. non modifica pagine pubblicate e non crea claim verificati.

## Cadenza consigliata

Per l'MVP:

- una ricerca generale eSIM ogni settimana;
- una ricerca per provider ogni due settimane;
- una ricerca per le destinazioni Tier 1 prima dei periodi di picco;
- discovery mensile;
- esecuzione straordinaria quando Search Console mostra una nuova query o un calo improvviso.

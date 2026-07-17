# Senza Roaming — eSIM SEO/AEO affiliate engine

Sito editoriale italiano dedicato alle eSIM da viaggio: destinazioni, compatibilità, confronti tra provider e strumenti di scelta.

## Obiettivo

Intercettare ricerche ad alta intenzione come `esim giappone`, `esim usa`, `migliore esim`, `airalo recensioni` e `holafly come funziona`, offrendo risposte verificabili e collegamenti affiliate dichiarati.

## Stack

- Cloudflare Workers
- Cloudflare D1
- Cloudflare Containers
- Cloudflare Workflows
- Cloudflare AI Gateway con Vertex AI BYOK
- TypeScript senza framework applicativo
- Python 3.12 nel runner di ricerca
- GitHub Actions
- Google Tag Manager predisposto, da attivare con CMP e consenso

## Stato MVP

- motore Worker completo;
- routing SEO, sitemap, robots e dati strutturati;
- schema D1 per pagine, provider, destinazioni, piani e click;
- tracking minimale senza IP o user agent;
- redirect provider con affiliate link conservati come secret;
- 1.623 keyword analizzate;
- 38 blueprint consolidati;
- 4 pagine fondamentali pubblicabili;
- 12 pagine bloccate in revisione fino alla verifica dei dati commerciali;
- workflow di deploy manuale;
- registro fonti, claim verificabili e coda di manutenzione AI;
- API protetta per agenti di aggiornamento e controllo;
- radar della domanda recente eseguito su Container e pianificato con Workflows.

## Macchina AI-driven

L'AI non pubblica articoli in autonomia. Opera su un ciclo controllato:

```text
fonti ufficiali
  -> coda di manutenzione
  -> estrazione di claim verificabili
  -> rilevazione di cambiamenti e conflitti
  -> revisione editoriale
  -> pubblicazione controllata
```

La migrazione `0007_ai_maintenance.sql` introduce:

- `source_registry` per provenienza, fiducia e freschezza delle fonti;
- `claim_verifications` per prezzo, durata, dati, hotspot, fair use, rete, attivazione e altre affermazioni datate;
- `maintenance_queue` per task consumabili da Workflows, GitHub Actions o agenti dedicati;
- una vista delle fonti scadute e un bootstrap dei provider ufficiali.

L'API di manutenzione richiede un secret separato:

```bash
npx wrangler secret put MAINTENANCE_TOKEN
```

Vedi `docs/AI-MAINTENANCE.md`.

## Radar della domanda recente

La migrazione `0008_recent_demand_radar.sql` mantiene separati:

```text
segnali della community -> opportunità editoriali
fonti ufficiali         -> claim commerciali verificati
```

Il radar usa un'immagine Python 3.12 con una versione fissata di `last30days`. Cloudflare Workflows avvia il Container soltanto quando serve, importa l'export JSON versionato in D1 e apre un task di revisione editoriale.

Rileva:

- domande ricorrenti;
- lamentele e problemi percepiti;
- confronti tra provider;
- raccomandazioni cercate;
- temi emergenti e content gap.

Non aggiorna prezzi, copertura, rete, hotspot o fair use. I segnali sociali non diventano claim commerciali.

Endpoint protetti principali:

```text
GET  /api/maintenance/research-runner-health
POST /api/maintenance/research-run
GET  /api/maintenance/research-signals
POST /api/maintenance/research-signal-action
```

Vedi `docs/RECENT-DEMAND-RADAR.md`.

## Ricerca keyword

Sorgente: Google Keyword Planner, Italia/italiano, periodo 1 luglio 2025 – 30 giugno 2026.

Foglio originale:

https://docs.google.com/spreadsheets/d/1fah6iZW5WNWD-MIA3EJnwK3hRHUMrkbC1PANy1hgEVQ/edit

Analisi e page map:

```text
research/keyword-planner/
```

## Avvio locale

```bash
npm install
npm run types
npm run db:migrate:local
npm run dev
```

Per sviluppare o distribuire il Container deve essere disponibile Docker.

## Configurazione

La modalità iniziale è:

```text
AFFILIATE_MODE=disabled
```

I link portano ai siti ufficiali senza remunerazione.

Dopo l'approvazione di programmi affiliate ufficiali:

```text
AFFILIATE_MODE=enabled
AFFILIATE_LINKS_JSON=<secret Cloudflare>
```

Vedi `docs/AFFILIATE-SETUP.md`.

## Migrazioni

```text
0001_init.sql
0002_blueprints_tier1.sql
0003_blueprints_tier2_3.sql
0004_catalog.sql
0005_published_pages.sql
0006_review_queue.sql
0007_ai_maintenance.sql
0008_recent_demand_radar.sql
```

## Quality gate

Le pagine commerciali non vengono pubblicate automaticamente. Gli stati sono:

```text
draft → review → published → archived
```

Una pagina destinazione o provider resta in `review` finché non contiene dati verificati su prezzo, durata, dati, hotspot, fair use, rete, attivazione e fonte ufficiale.

L'AI può creare o aggiornare claim e task di revisione, ma non può promuovere direttamente una pagina a `published`.

## Documentazione

- `docs/EDITORIAL-SYSTEM.md`
- `docs/AFFILIATE-SETUP.md`
- `docs/DEPLOY-CLOUDFLARE.md`
- `docs/AI-MAINTENANCE.md`
- `docs/RECENT-DEMAND-RADAR.md`
- `docs/CLOUDFLARE-VERTEX-SETUP.md`

## Dominio

Il dominio operativo è **senzaroaming.it**. Finché l'attivazione dei nameserver non è completata, il Worker resta collaudabile tramite `workers.dev`.

# Architettura di Senza Roaming

## Scopo

Senza Roaming è un execution project autonomo: pubblica contenuti, conserva fonti e claim, raccoglie segnali di domanda, governa una coda editoriale e misura il passaggio verso i provider.

Non è il sistema operativo dell'intero studio e non deve diventarlo.

## Componenti principali

```text
Utente / crawler
      │
      ▼
Cloudflare Worker
      ├── pagine pubbliche SEO/AEO
      ├── sitemap, robots, canonical e 404
      ├── redirect provider
      └── API protette di manutenzione
              │
              ├── D1
              │    ├── pagine e catalogo
              │    ├── fonti e claim
              │    ├── maintenance queue
              │    └── research runs e signals
              │
              ├── Cloudflare Workflows
              │    └── orchestrazione dei run
              │
              ├── Cloudflare Container
              │    └── last30days runner
              │
              └── Cloudflare AI Gateway
                   └── Vertex AI BYOK
```

## Separazione delle fonti

### Fonti ufficiali

Sono utilizzabili per claim commerciali datati:

- prezzo;
- durata;
- quantità di dati;
- hotspot;
- fair use;
- rete;
- copertura dichiarata;
- attivazione;
- compatibilità;
- termini del provider.

Ogni claim deve avere almeno fonte, data di verifica, stato e collegamento alla pagina interessata.

### Community, trend e ricerca recente

Sono utilizzabili per:

- domande ricorrenti;
- linguaggio reale degli utenti;
- lamentele;
- confronti cercati;
- content gap;
- priorità editoriali;
- segnali di momentum o stagionalità.

Non possono aggiornare direttamente un claim commerciale.

## Flusso della domanda recente

```text
query pianificata o manuale
        │
        ▼
Cloudflare Workflow
        │
        ▼
last30days Container
        │
        ▼
export JSON versionato
        │
        ▼
normalizzazione e ingest in D1
        │
        ▼
research_signals + task editoriale
        │
        ▼
revisione umana / AI controllata
```

## Flusso AI

```text
segnali e dati strutturati
        │
        ▼
Cloudflare AI Gateway
        │
        ▼
Vertex AI
        │
        ├── clustering
        ├── deduplicazione
        ├── scoring spiegabile
        └── brief e task
                │
                ▼
          revisione umana
                │
                ▼
          pubblicazione controllata
```

L'AI non possiede un percorso diretto per promuovere una pagina a `published`.

## Dashboard del progetto

La dashboard di Senza Roaming è specifica del dominio eSIM e deve gestire:

- run del radar;
- segnali;
- coda editoriale;
- fonti;
- claim;
- pagine;
- anteprime;
- errori;
- operazioni manuali del Workflow.

Deve essere costruita sopra API stabili e protette, evitando accesso diretto del browser a D1.

## Confine con il futuro Command Center dello studio

Il futuro Command Center è un control plane multi-progetto. Non deve incorporare il database o la logica editoriale di Senza Roaming.

Il modello previsto è:

```text
Command Center dello studio
        │
        ├── registry dei progetti
        ├── stato aggregato
        ├── costi, alert e autorizzazioni
        └── azioni tramite contratti API
                │
                ▼
Senza Roaming execution plane
```

Il contratto futuro dovrà esporre soltanto dati e azioni necessari, per esempio:

- health sintetico;
- conteggi per stato;
- run recenti;
- task bloccati;
- opportunità principali;
- fonti scadute;
- trigger di operazioni autorizzate.

## Confine con OpenSEO

OpenSEO è un servizio specialistico condiviso dello studio e non va fuso nel Worker di Senza Roaming.

OpenSEO può fornire:

- keyword research;
- SERP e competitor intelligence;
- rank tracking;
- backlink;
- audit tecnici;
- AI visibility;
- dati Search Console.

Senza Roaming deve ricevere risultati normalizzati o task, non dipendere dall'intera codebase di OpenSEO.

## Sicurezza

- `MAINTENANCE_TOKEN` protegge le API operative.
- `AI_GATEWAY_TOKEN` protegge il percorso AI.
- I link affiliate e le credenziali restano secret Cloudflare.
- La dashboard privata deve usare Cloudflare Access o autenticazione equivalente.
- Nessun token, service account JSON o dato sensibile deve essere versionato.
- Le risposte di errore non devono esporre secret o payload completi di provider esterni.

## Deployment

GitHub Actions esegue:

1. installazione dipendenze;
2. generazione tipi Cloudflare;
3. typecheck;
4. migrazioni D1;
5. build e smoke test del Container;
6. deploy Worker, Workflow e Container;
7. controlli post-deploy disponibili nel workflow.

## Principio di evoluzione

Aggiungere un componente solo quando:

1. risolve un problema osservato;
2. possiede un confine chiaro;
3. produce dati strutturati e verificabili;
4. è osservabile;
5. può fallire senza pubblicare informazioni scorrette;
6. non duplica una capacità già disponibile nello studio.

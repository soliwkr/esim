# Architettura di Senza Roaming

Data di riferimento: **18 luglio 2026**.

## Scopo

Senza Roaming è un execution project autonomo: pubblica contenuti, conserva fonti e claim, raccoglie segnali di domanda, governa una coda editoriale e misura il passaggio verso i provider.

Non è il sistema operativo dell'intero studio e non deve diventarlo.

## Architettura target

```text
Utente / crawler
      │
      ▼
Astro su Cloudflare
      ├── sito pubblico content-first
      ├── layout, navigazione e SEO
      ├── pagine statiche e on-demand
      ├── asset compilati
      └── shell Control Room
              │
              ▼
        React island privata
              ├── query e mutation tipizzate
              ├── tabelle, form e dialog
              └── nessun accesso diretto a D1

Custom Cloudflare Worker entrypoint
      ├── handler Astro
      ├── API protette di manutenzione
      ├── redirect provider
      ├── D1
      ├── Cloudflare Workflows
      ├── Cloudflare Container
      └── Cloudflare AI Gateway
              └── Vertex AI BYOK
```

La migrazione al frontend Astro non riscrive il backend. Claim, evidence bundle, queue, Workflow, Container, AI e gate editoriali restano l'execution plane canonico.

## Responsabilità del frontend

### Astro

Astro è responsabile di:

- HTML pubblico e layout;
- routing delle pagine;
- navigazione;
- metadata, canonical e schema;
- sitemap, robots e 404;
- rendering statico o on-demand;
- composizione delle isole interattive;
- caricamento minimo di JavaScript.

### React island

React è usato soltanto dove esiste interattività applicativa complessa, inizialmente la Control Room.

È responsabile di:

- stato della sessione operativa;
- query, mutation, loading, error e retry;
- tabelle, filtri e form;
- preview e decisioni editoriali;
- notifiche e conferme;
- accessibilità dei flussi interattivi.

Il sito pubblico non diventa una SPA generale.

### Componenti UI

I componenti generici non vengono riscritti da zero.

La UI deve usare un kit e blocchi comprovati. Il candidato principale è shadcn/ui; Mantine viene confrontato nello spike. La decisione definitiva è registrata dopo una prova misurata.

Non sono ammessi nella nuova UI:

- template string HTML monolitiche;
- rendering applicativo con `innerHTML`;
- listener manuali per ogni pulsante;
- form validation artigianale;
- componenti base duplicati senza necessità di dominio.

## Backend ed execution plane

Il Worker e i binding esistenti restano responsabili di:

- API protette;
- D1 e migrazioni;
- claim, fonti e verifiche;
- maintenance queue;
- research runs e signals;
- evidence bundle e Page Readiness;
- draft e stati editoriali;
- Workflows e Container;
- AI Gateway e Vertex;
- publication guardrails.

Astro e React non modificano direttamente D1 dal browser.

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
- routing;
- termini del provider.

Ogni claim deve avere fonte, data di verifica, stato e collegamento alla pagina interessata.

### Community, trend e ricerca recente

Sono utilizzabili per:

- domande ricorrenti;
- linguaggio reale degli utenti;
- lamentele;
- confronti cercati;
- content gap;
- priorità editoriali;
- momentum o stagionalità.

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

## Flusso editoriale

```text
segnali eligible
      │
      ▼
brief AI strutturato
      │
      ▼
accettazione umana
      │
      ▼
claim atomici + fonti
      │
      ▼
Page Readiness + evidence bundle
      │
      ▼
draft grounded in review
      │
      ▼
revisione umana
      │
      ▼
publication gate separato
```

L'AI non possiede un percorso diretto per promuovere una pagina a `published`.

## Dashboard del progetto

La Control Room è specifica del dominio eSIM e deve gestire:

- run del radar;
- segnali;
- coda editoriale;
- brief;
- fonti e claim;
- readiness;
- draft e preview;
- errori e health;
- operazioni manuali del Workflow.

Deve essere costruita sopra API stabili e protette, evitando accesso diretto del browser a D1.

La Control Room HTML manuale è legacy transitoria. La versione definitiva è una React island dentro Astro.

## Strategia di integrazione Cloudflare

La forma preferita usa un custom Worker entrypoint:

```text
custom entrypoint
├── route API esistenti
├── export Workflow e Container
└── handler Astro per pagine e asset
```

Lo spike deve dimostrare che il singolo deploy mantiene:

- binding D1 e secret;
- Workflow e Container;
- API;
- migrazioni;
- route pubbliche;
- deploy automatico;
- smoke test live;
- guardrail editoriali.

Due Worker separati vengono adottati soltanto se il modello singolo crea rischi o accoppiamento non accettabili.

## Confine con il futuro Command Center dello studio

Il futuro Command Center è un control plane multi-progetto. Non deve incorporare il database o la logica editoriale di Senza Roaming.

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

## Confine con OpenSEO

OpenSEO è un servizio specialistico condiviso dello studio e non va fuso nel Worker di Senza Roaming.

Senza Roaming riceve risultati normalizzati o task, non dipende dall'intera codebase di OpenSEO.

## Sicurezza

- `MAINTENANCE_TOKEN` protegge le API operative durante la fase transitoria.
- `AI_GATEWAY_TOKEN` protegge il percorso AI.
- Cloudflare Access deve proteggere la Control Room definitiva.
- Link affiliate e credenziali restano secret Cloudflare.
- Nessun token o dato sensibile viene versionato o inserito negli URL.
- Le risposte di errore non espongono secret o payload completi di provider esterni.
- Il frontend non contiene funzioni di pubblicazione automatica.

## Deployment

GitHub Actions esegue:

1. installazione dipendenze;
2. generazione tipi Cloudflare;
3. typecheck;
4. build Astro e frontend;
5. migrazioni D1;
6. build e smoke test del Container;
7. deploy Worker, Workflow, Container e asset;
8. smoke test live di pagine, client e API essenziali.

Il deploy automatico parte per modifiche operative unite in `main`; le modifiche ai soli documenti non devono distribuire produzione.

## Principio di evoluzione

Aggiungere un componente solo quando:

1. risolve un problema osservato;
2. possiede un confine chiaro;
3. produce dati strutturati e verificabili;
4. è osservabile;
5. può fallire senza pubblicare informazioni scorrette;
6. non duplica una capacità già disponibile;
7. non ricostruisce artigianalmente un componente generico già risolto.

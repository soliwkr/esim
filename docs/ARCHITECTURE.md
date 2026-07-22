# Architettura di Senza Roaming

Data di riferimento: **22 luglio 2026**.

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
      └── shell Control Room privata
              │
              ▼
React island
              ├── letture tipizzate e validate
              ├── snapshot aggregato
              ├── risorse GET on demand
              ├── tabelle, filtri e dialog
              ├── mutation soltanto in fasi autorizzate
              └── nessun accesso diretto a D1

Custom Cloudflare Worker entrypoint
      ├── Cloudflare Access guard
      ├── proxy snapshot read-only
      ├── proxy dettaglio draft GET-only
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

Responsabilità:

- caricamento e refresh delle risorse applicative;
- validazione dei contratti ricevuti;
- stati loading, error, partial failure e retry;
- tabelle, filtri, form e dialog;
- preview e decisioni editoriali nelle fasi autorizzate;
- notifiche e conferme;
- accessibilità dei flussi interattivi.

Il sito pubblico non diventa una SPA generale.

### Componenti UI

I componenti generici non vengono riscritti da zero. La UI usa shadcn/ui con primitive Radix e sorgenti versionati in `apps/web/src/components/ui`.

Non sono ammessi nella nuova UI:

- template string HTML monolitiche;
- rendering applicativo con `innerHTML`;
- listener manuali per ogni pulsante;
- form validation artigianale quando esiste una soluzione comprovata;
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

- overview e health;
- run del radar;
- segnali;
- coda editoriale;
- brief;
- fonti e claim;
- readiness;
- draft e preview;
- dettaglio completo del draft;
- errori e audit;
- operazioni manuali del Workflow nelle fasi autorizzate.

Deve essere costruita sopra API stabili e protette. La Control Room HTML manuale è legacy transitoria; la versione definitiva è una React island dentro Astro.

## Strategia di integrazione Cloudflare

Il progetto usa un solo custom Worker entrypoint:

```text
richiesta Cloudflare
        │
        ▼
apps/web/src/worker.ts
        ├── /astro-foundation → handler Astro
        ├── /control-room-foundation* → Access guard
        │       ├── pagina → handler Astro
        │       ├── /api/snapshot → proxy read-only
        │       └── /api/draft-detail → proxy GET-only on demand
        └── tutte le altre route → src/index.ts
                                  ├── API e health
                                  ├── sito e Control Room legacy
                                  ├── redirect provider
                                  └── publication guardrails
```

Lo stesso modulo esporta `RecentDemandWorkflow` e `Last30DaysContainer`. Due Worker separati vengono adottati soltanto se il modello singolo crea rischi o accoppiamento non accettabili.

## Perimetro privato della Control Room

```text
browser autenticato
→ path protetto da Access
→ validazione dell’identità nel Worker
→ React island
→ GET /control-room-foundation/api/snapshot
→ GET /control-room-foundation/api/draft-detail?draftId=<id> on demand
→ delega server-side alle API esistenti
```

Conseguenze:

- un solo login visibile;
- nessuna credenziale applicativa nel browser;
- nessun token in HTML, URL, bundle o storage;
- proxy GET-only e risposte `no-store` / `noindex`;
- API originali invariate per agenti e consumer legacy;
- nessuna mutation o capacità di pubblicazione introdotta dai proxy.

## Risorse della Control Room

### Health e snapshot

La overview legge:

```text
GET /api/health
GET /control-room-foundation/api/snapshot
```

Il client valida a runtime:

- stato generale;
- binding e capability attese;
- timestamp dello snapshot;
- 19 metriche overview;
- collezioni di dominio necessarie alla UI;
- guardrail di pubblicazione disabilitata.

Health e snapshot sono gestiti in modo indipendente. Un errore health non nasconde lo snapshot; un errore snapshot non nasconde i dati health già validi. Il refresh conserva dati precedenti affidabili mentre segnala il fallimento parziale.

`/api/health` descrive soprattutto configurazione e binding. Non viene presentato come probe end-to-end di Workflow, Container, AI Gateway o provider esterni.

### Dettaglio draft on demand

Lo snapshot conserva soltanto l’inventario dei draft. Corpo completo e provenance non vengono caricati insieme alla dashboard iniziale.

```text
operatore seleziona una versione
→ GET /control-room-foundation/api/draft-detail?draftId=<id>
→ Access guard già applicato al path
→ controllo metodo e draftId
→ maintenance token aggiunto soltanto server-side
→ GET /api/maintenance/editorial-draft-grounding?draftId=<id>
→ risposta privata no-store/noindex
→ validazione runtime dedicata nel client
```

Il backend esistente restituisce:

- contenuto strutturato;
- FAQ e fonti;
- provenance dei campi principali, delle sezioni e delle FAQ;
- claim usati ed esclusi;
- regole e metadati di generazione;
- stato della pagina materializzata;
- revisore, note e timestamp.

Il client verifica che ID, bundle, versione, slug e renderer corrispondano al record dell’inventario. Un mismatch viene rifiutato.

Il dettaglio è una risorsa indipendente:

- non viene richiesto prima dell’apertura;
- può fallire senza cancellare snapshot, overview o inventario;
- dispone di loading, errore e retry propri;
- non abilita generazione, review action, materializzazione o pubblicazione.

Separazioni:

```text
draft status ≠ materialized page status
materialized page review ≠ publication eligibility
approved draft ≠ published page
```

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

OpenSEO è un servizio specialistico condiviso dello studio e non va fuso nel Worker di Senza Roaming. Senza Roaming riceve risultati normalizzati o task, non dipende dall'intera codebase di OpenSEO.

## Sicurezza

- Le API operative restano protette server-side.
- Cloudflare Access protegge la Control Room e tutti i proxy sotto il path.
- Credenziali e link riservati restano configurazione non versionata.
- Nessun token o dato sensibile viene inserito negli URL.
- Le risposte di errore non espongono credenziali o payload completi di provider esterni.
- Il frontend non contiene funzioni di pubblicazione automatica.
- Il browser non accede direttamente a D1.
- Le fonti mostrate dal dettaglio devono essere HTTPS.

## Deployment e verifica

GitHub Actions esegue:

1. installazione dipendenze;
2. generazione tipi Cloudflare;
3. typecheck;
4. build Astro e frontend;
5. migrazioni D1;
6. quality smoke e golden evaluation;
7. build e smoke test del Container;
8. runtime `workerd`;
9. smoke Chromium delle viste di dominio;
10. deploy Worker, Workflow, Container e asset su `main`;
11. smoke live delle route essenziali.

In pull request, gli smoke verificano:

- route Astro e Access guard;
- proxy snapshot, proxy dettaglio draft e API originali;
- contratti delle metriche e delle collezioni;
- payload non validi rifiutati;
- errori parziali e risorse indipendenti;
- caricamento on demand del draft;
- hydration, tastiera e mobile;
- assenza di mutation e route di pubblicazione.

## Principio di evoluzione

Aggiungere un componente solo quando:

1. risolve un problema osservato;
2. possiede un confine chiaro;
3. produce dati strutturati e verificabili;
4. è osservabile;
5. può fallire senza pubblicare informazioni scorrette;
6. non duplica una capacità già disponibile;
7. non ricostruisce artigianalmente un componente generico già risolto.

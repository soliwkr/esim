# Piano frontend

Data di riferimento: **22 luglio 2026**.

## Decisione

Senza Roaming non usa più il Cloudflare Worker come generatore di nuove interfacce HTML, CSS e JavaScript applicative.

La direzione adottata è:

```text
Astro
├── sito pubblico orientato ai contenuti
├── layout, navigazione, SEO e pagine
└── shell della Control Room

React island
└── applicazione interattiva della Control Room

Custom Cloudflare Worker
├── perimetro Access e proxy server-side
├── API
├── D1
├── Workflows
├── Container
├── AI Gateway / Vertex
└── gate editoriali e di pubblicazione
```

Il backend non viene riscritto. La migrazione riguarda il livello di presentazione e il modo in cui il browser consuma contratti protetti.

## Principio operativo

Non si costruiscono da zero componenti generici già risolti dall'ecosistema.

Da riusare:

- button, input, select, dialog, drawer e toast;
- tabelle, filtri, pagination e stati vuoti;
- loading, error, retry e focus management;
- responsive layout e pattern di navigazione;
- primitive accessibili e testate.

Da scrivere nel progetto:

- flussi brief → claim → readiness → draft;
- contratti e validazione dei dati di dominio;
- regole editoriali e guardrail;
- viste specifiche di Senza Roaming;
- copy e design token del brand.

## Stack

### Operativo

- Astro come frontend principale;
- adapter Cloudflare;
- React soltanto per la Control Room e altre isole realmente interattive;
- TypeScript strict;
- shadcn/ui con primitive Radix e sorgenti versionati;
- icone Lucide;
- validazione runtime dei payload API;
- smoke D1, `workerd` e Chromium.

### Target da adottare soltanto quando serve

- TanStack Query per cache, retry e mutation complesse;
- TanStack Table per dataset operativi più grandi;
- React Hook Form per form editoriali;
- Zod se i contratti condivisi richiedono una libreria dedicata.

Una libreria viene aggiunta soltanto quando riduce complessità reale.

## UI kit

La Control Room usa **shadcn/ui**. Il confronto con Mantine resta opzionale e non blocca la migrazione senza un vantaggio concreto da misurare.

## Integrazione Cloudflare verificata

Il progetto usa un singolo Worker:

```text
richiesta
→ custom Worker entrypoint
→ Access guard per la Control Room
→ proxy snapshot read-only
→ proxy dettaglio draft GET-only on demand
→ handler Astro per pagine e asset
→ router backend per API e pagine non migrate
```

Sono verificati:

- export di Workflow e Container;
- D1 e configurazione runtime;
- API di manutenzione;
- deploy automatico;
- migrazioni D1;
- 404, canonical, robots e sitemap esistenti;
- assenza di route di pubblicazione automatica;
- live smoke della shell e del proxy snapshot;
- dettaglio draft GET-only, PR #47 e verifica in produzione;
- linkage claim → task, PR #50 e CI #213;
- identità audit e linkage draft canonico, PR #52 e CI finale #220.

I due nuovi linkage non sono ancora attestati visivamente nel browser reale dietro Cloudflare Access.

## Struttura incrementale

```text
apps/
  web/                 # Astro, React island e componenti Control Room

src/                   # backend ed execution plane esistenti
migrations/
containers/
scripts/
```

La riorganizzazione completa del repository viene valutata soltanto dopo il rilascio stabile della Control Room e del frontend pubblico.

## Fasi

### F0 — Congelare la UI artigianale

- [x] Control Room v3 riconosciuta come transitoria;
- [x] solo fallback e bugfix critici;
- [x] nessuna nuova funzione importante nella dashboard HTML manuale;
- [x] nessuna nuova pagina pubblica costruita con template string nel Worker.

### F1 — Frontend foundation

- [x] `apps/web` con Astro, React e Cloudflare;
- [x] custom Worker entrypoint;
- [x] binding, Workflow, Container e API verificati in `workerd`;
- [x] assenza di route di pubblicazione;
- [x] fondazione distribuita e verificata in produzione.

### F2 — Control Room UI e perimetro privato

- [x] shadcn/ui con componenti sorgente versionati;
- [x] shell responsive in una React island;
- [x] Cloudflare Access e validazione nell'origine;
- [x] sessione mediata dal Worker;
- [x] secondo login e credenziali browser rimossi;
- [x] hydration, loading, error, empty, tastiera e mobile coperti.

### F3 — Migrare la Control Room read-only

Ordine completato:

1. overview e health — **PR #32**;
2. radar e brief — **PR #34**;
3. claim, fonti e scadenze — **PR #37**;
4. readiness ed evidence bundle — **PR #39 + hotfix #40**;
5. draft, preview e decisioni — **PR #42**;
6. queue e audit — **PR #44, CI #174 e verifica browser reale**;
7. dettaglio draft completo — **PR #47, CI #198 e verifica browser reale**;
8. audit sistematico di parità — **PR #49, merge `e0a39fa9`, CI #209**;
9. linkage claim → task — **PR #50, merge `41a9beee`, CI #213**;
10. linkage audit → versione draft — **PR #52, merge `35f56e82`, CI finale #220**.

#### F3.1 — Overview e health

**Stato: completata e verificata in produzione.**

- metriche overview, capability, binding, timestamp e guardrail;
- health e snapshot come risorse indipendenti;
- payload non validi rifiutati;
- nessuna mutation, pubblicazione o accesso browser a D1.

#### F3.2 — Radar e brief

**Stato: completata e verificata in produzione.**

- run, segnali e brief reali;
- filtro run → segnali basato sul `run_id` canonico;
- punteggi, stati, quality flags e nullable preservati;
- nessun linkage segnale → brief inventato;
- nessuna mutation o pubblicazione.

#### F3.3 — Claim, fonti, scadenze e task

**Stato: completata in CI; verifica visuale del task linkage aperta.**

- contratto claim, fonti, verifica e scadenza validato a runtime;
- filtri per stato, brief, fonte, verifica e scadenza;
- fonte distinta dall'evidenza;
- stato temporale separato dallo stato canonico;
- `task_id` e `task_status` persistiti e mostrati;
- `task_id` accetta soltanto `null` o interi positivi;
- nessuna ricostruzione da `entity_key`;
- nessuna richiesta browser diversa da `GET`;
- nessuna mutation o pubblicazione.

#### F3.4 — Page Readiness ed evidence bundle

**Stato: completata e verificata in produzione.**

- score, conteggi e quattro gate distinti;
- warning strutturati `{ code, message?, ...metadata }`;
- filtri, dettaglio, empty state, desktop e mobile;
- fixture aderente al payload canonico;
- nessuna valutazione, approvazione o pubblicazione.

#### F3.5 — Draft, preview e decisioni

**Stato: completata e verificata in produzione.**

- tutte le versioni draft dello snapshot;
- bundle e brief collegati tramite ID canonici;
- title, H1, claim usati ed esclusi;
- generatore, revisore, timestamp, note ed errori;
- readiness e publication eligibility separate;
- empty state, contratto invalido, desktop, mobile e tastiera;
- nessuna richiesta browser diversa da `GET`.

Il vecchio inventario non ricostruisce corpo, provenance o stato pagina. Questi dati appartengono alla risorsa separata F3.7.

#### F3.6 — Queue e audit

**Stato: letture complete in CI; verifica visuale del nuovo audit linkage aperta.**

Queue:

- task `pending`, `processing` e `failed`;
- tipo, entità, priorità, stato, scadenza, tentativi, lock ed errore;
- payload JSON e timestamp;
- filtri e dettaglio read-only.

Audit:

- `event_key` stabile e namespaced;
- dominio, azione, attore, entità e timestamp;
- `draft_id` e `draft_version` obbligatori per gli eventi draft;
- linkage draft nullo per gli altri domini;
- dettagli JSON opachi;
- filtri e dettaglio read-only;
- nessuna interpretazione di `details` per ricostruire relazioni.

Separazioni verificate:

```text
queue status ≠ decisione editoriale
failed task ≠ contenuto non valido
completed task ≠ pagina pubblicata
audit event ≠ autorizzazione operativa
```

#### F3.7 — Dettaglio draft completo read-only

**Stato: completata e verificata in produzione con PR #47.**

Architettura:

```text
inventario draft nello snapshot
→ selezione esplicita della versione
→ GET /control-room-foundation/api/draft-detail?draftId=<id>
→ Cloudflare Access e validazione origine
→ maintenance token soltanto server-side
→ endpoint backend esistente
→ contratto runtime dedicato
```

La vista mostra corpo, campi principali, blocchi, FAQ, fonti HTTPS, provenance, claim usati/esclusi, regole di generazione e stato reale della pagina materializzata.

Proprietà di isolamento:

- nessuna richiesta prima dell’apertura;
- errore confinato nel relativo Sheet;
- snapshot preservato;
- retry esplicito;
- corrispondenza inventario/dettaglio;
- nessun token operativo nel browser;
- proxy `GET`-only.

Non include generazione, revisione operativa, materializzazione, mutation o pubblicazione.

#### F3.8 — Audit di parità legacy

**Stato: parità read-only completa in CI.**

La matrice versionata verifica:

- copertura delle letture operative;
- guardrail equivalenti o più forti;
- assenza di token applicativi nel browser;
- Access e proxy GET-only;
- assenza di mutation e accesso diretto a D1;
- linkage claim → task canonico;
- identità audit e linkage draft canonico;
- inventario delle mutation ancora ospitate dalla legacy.

Il template HTML della preview legacy non è un requisito di parità. Una futura preview visuale appartiene al renderer pubblico Astro.

La legacy resta necessaria come fallback delle mutation.

### F4 — Migrare le azioni operative

Una branch per capacità:

```text
decisione brief
→ conversione brief
→ operazioni claim
→ decisione draft
→ eventuale retry queue
```

Ogni mutation richiede:

- scope esplicito;
- conferma dell’operatore;
- idempotenza;
- audit persistito;
- reload dello snapshot;
- gestione degli errori;
- test end-to-end;
- nessuna pubblicazione implicita.

La prima mutation non è ancora scelta né avviata.

### F5 — Migrare il sito pubblico

- home;
- layout e navigazione;
- pagine statiche;
- listing destinazioni, guide e confronti;
- pagina articolo;
- schema markup, canonical, sitemap e 404;
- progressive migration senza cambiare lo stato editoriale delle pagine.

### F6 — Consolidamento

- eliminare renderer HTML, CSS e JavaScript manuali;
- ridurre codice duplicato;
- test visuali e browser smoke;
- budget performance;
- documentazione del design system;
- eventuale riorganizzazione completa del repository.

## Guardrail

- Astro e React non accedono direttamente a D1 dal browser;
- le azioni passano dalle API protette;
- nessun componente UI introduce pubblicazione automatica;
- la migrazione non modifica claim, evidence bundle o stati editoriali senza azione esplicita;
- la pagina Cina resta `review` finché il publication gate non è soddisfatto;
- un payload JSON non è valido soltanto perché esiste un tipo TypeScript;
- segnali e trend non vengono presentati come claim commerciali verificati;
- una scadenza derivata nel client non riscrive lo stato canonico;
- una fonte ufficiale non viene presentata come test indipendente;
- draft eligibility non viene presentata come publication eligibility;
- lo stato del draft non viene presentato come stato della pagina;
- lo stato della queue non viene presentato come decisione editoriale;
- un errore del dettaglio draft non invalida lo snapshot;
- il dettaglio on demand non abilita materializzazione o pubblicazione;
- relazioni mancanti non vengono ricostruite con euristiche client;
- la legacy non viene rimossa finché resta il fallback delle mutation.

## Cosa non facciamo adesso

- riscrivere il backend;
- avviare mutation senza scope esplicito;
- spostare subito tutte le directory;
- pubblicare la pagina Cina;
- costruire un design system proprietario da zero;
- introdurre una libreria senza necessità dimostrata;
- aggiungere nuove feature alla Control Room legacy;
- duplicare query D1 già coperte dal contratto backend;
- copiare il renderer HTML legacy nella nuova Control Room;
- rimuovere la legacy prima della migrazione delle mutation.

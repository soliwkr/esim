# Piano frontend

Data di riferimento: **21 luglio 2026**.

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
→ proxy read-only per lo snapshot
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
- live smoke della shell e del proxy.

La separazione in due Worker non viene introdotta.

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
- [x] overview, claim preview e draft preview iniziale read-only;
- [x] Cloudflare Access e validazione nell'origine;
- [x] sessione mediata dal Worker;
- [x] secondo login e credenziali browser rimossi;
- [x] hydration, loading, error, empty, tastiera e mobile coperti.

### F3 — Migrare la Control Room

Ordine:

1. overview e health — **completate e verificate con PR #32**;
2. radar e brief — **completati e verificati con PR #34**;
3. claim, fonti e scadenze — **completati e verificati con PR #37**;
4. readiness ed evidence bundle — **completati con PR #39 e hotfix #40**;
5. draft, preview e decisioni — **completati e verificati con PR #42**;
6. audit e queue — **prossima fase read-only**;
7. azioni operative autorizzate, una per branch.

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

Il quality checkpoint successivo ha verificato che uno score esattamente zero venga filtrato con `zero_relevance`.

#### F3.3 — Claim, fonti e scadenze

**Stato: completata e verificata in produzione.**

- contratto claim completo;
- filtri per stato, brief, fonte, verifica e scadenza;
- fonte distinta dall'evidenza;
- stato temporale separato dallo stato canonico;
- nessuna richiesta browser diversa da `GET`;
- nessuna mutation o pubblicazione.

#### F3.4 — Page Readiness ed evidence bundle

**Stato: completata e verificata in produzione.**

- score, conteggi e quattro gate distinti;
- warning strutturati `{ code, message?, ...metadata }`;
- filtri, dettaglio, empty state, desktop e mobile;
- fixture aderente al payload canonico dopo la hotfix #40;
- nessuna valutazione, approvazione o pubblicazione.

#### F3.5 — Draft, preview e decisioni

**Stato: completata e verificata in produzione con PR #42.**

Dati esistenti usati:

- ID draft, evidence bundle, versione, page slug e page type;
- renderer e stato canonico;
- title e H1;
- claim usati ed esclusi;
- generated by, reviewed by, reviewed at e review notes;
- error message, created at e updated at;
- bundle e brief collegati tramite ID canonici.

Vista verificata:

- riepilogo draft totali, approvati, in revisione e revisionati;
- tabella versioni;
- filtri per stato, renderer e presenza di revisione;
- dettaglio read-only accessibile;
- readiness score e publication eligibility del bundle;
- guardrail editoriale;
- empty state, contratto invalido, desktop, mobile e tastiera;
- nessuna richiesta browser diversa da `GET`.

Separazioni:

```text
approved draft ≠ published page
review draft ≠ publication eligibility
editorial approval ≠ publication action
```

Gap del contratto aggregato:

- corpo completo, FAQ e fonti;
- provenance field-level del renderer v2;
- stato della pagina materializzata;
- audit collegato univocamente a una specifica versione.

La PR #42 non chiude questi gap con endpoint o query nuovi. La UI li rende espliciti e non deduce dati mancanti.

Non include:

- generazione o rigenerazione draft;
- approvazione o richiesta modifiche;
- materializzazione della pagina;
- mutation della queue;
- nuovi endpoint o query D1;
- pubblicazione.

#### F3.6 — Queue e audit

**Stato: prossima fase, inizialmente read-only.**

La fase deve partire dalla lettura dei contratti reali già presenti nello snapshot e mostrare, soltanto quando esposti:

- task type, entity, priorità, stato, due at, tentativi e lock;
- ultimo errore, payload e timestamp;
- dominio, azione, attore, entità, dettagli e timestamp degli eventi audit;
- filtri e dettaglio accessibile;
- empty state, contratto invalido, desktop, mobile e tastiera.

Separazioni obbligatorie:

```text
queue status ≠ decisione editoriale
failed task ≠ contenuto non valido
completed task ≠ pagina pubblicata
audit event ≠ autorizzazione operativa
```

La prima iterazione non introduce retry, complete, dismiss, avvio Workflow, mutation o pubblicazione.

La vecchia Control Room viene rimossa solo dopo test end-to-end e parità funzionale.

### F4 — Migrare il sito pubblico

- home;
- layout e navigazione;
- pagine statiche;
- listing destinazioni, guide e confronti;
- pagina articolo;
- schema markup, canonical, sitemap e 404;
- progressive migration senza cambiare lo stato editoriale delle pagine.

### F5 — Consolidamento

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
- la migrazione non modifica claim, evidence bundle o stati editoriali;
- la pagina Cina resta `review` finché il publication gate non è soddisfatto;
- un payload JSON non viene considerato valido soltanto perché esiste un tipo TypeScript;
- segnali e trend non vengono presentati come claim commerciali verificati;
- una scadenza derivata nel client non riscrive lo stato canonico del claim;
- una fonte ufficiale non viene presentata come test indipendente;
- draft eligibility non viene presentata come publication eligibility;
- lo stato del draft non viene presentato come stato della pagina;
- lo stato della queue non viene presentato come decisione editoriale.

## Definition of Done F3.5

- [x] tutte le versioni draft dello snapshot sono visibili;
- [x] contratto completo dei campi usati è validato;
- [x] bundle e brief sono collegati senza deduzioni arbitrarie;
- [x] approvazione draft e publication eligibility restano distinte;
- [x] stato pagina mancante è dichiarato, non dedotto;
- [x] filtri, dettaglio, loading, error ed empty state sono verificati;
- [x] tastiera e viewport mobile sono verificati;
- [x] typecheck, build, migrazioni, quality gate, Container e runtime sono verdi;
- [x] smoke Chromium generale, claim, readiness e draft sono verdi;
- [x] nessuna richiesta browser diversa da `GET`;
- [x] nessuna generazione, revisione operativa, mutation, pubblicazione o accesso browser a D1;
- [x] overview, radar, segnali, brief, claim e readiness non regrediscono;
- [x] deploy e verifica manuale sono verdi.

## Cosa non facciamo adesso

- riscrivere il backend;
- estendere automaticamente lo snapshot per chiudere i gap draft;
- spostare subito tutte le directory;
- pubblicare la pagina Cina;
- costruire un design system proprietario da zero;
- introdurre una libreria senza necessità dimostrata;
- aggiungere nuove feature alla Control Room legacy;
- introdurre mutation nella stessa fase queue e audit read-only.
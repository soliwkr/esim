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
- [x] overview, claim preview e draft preview read-only;
- [x] Cloudflare Access e validazione nell'origine;
- [x] sessione mediata dal Worker;
- [x] secondo login e credenziali browser rimossi;
- [x] hydration, loading, error, empty, tastiera e mobile coperti.

### F3 — Migrare la Control Room

Ordine:

1. overview e health — **completate e verificate con PR #32**;
2. radar e brief — **completati e verificati con PR #34**;
3. claim, fonti e scadenze — **completati e verificati con PR #37**;
4. readiness ed evidence bundle — **completati e verificati con PR #39 + hotfix #40**;
5. draft, preview e decisioni — **prossima fase read-only**;
6. audit e queue;
7. azioni operative autorizzate, una per branch.

#### F3.1 — Overview e health

**Stato: completata e verificata in produzione.**

- tutte le metriche overview sono visibili;
- capability e binding hanno semantica esplicita;
- timestamp e guardrail sono mostrati;
- health e snapshot sono risorse indipendenti;
- payload non validi vengono rifiutati;
- nessuna mutation, pubblicazione o accesso browser a D1.

#### F3.2 — Radar e brief

**Stato: completata e verificata in produzione.**

- `researchRuns`, `signals` e `briefs` sono validati a runtime;
- run, segnali e brief reali sono visibili;
- filtro run → segnali basato sul `run_id` canonico;
- punteggi, stati, quality flags e nullable preservati;
- nessun linkage segnale → brief inventato;
- filtri, Sheet, tastiera e mobile verificati;
- nessuna mutation o pubblicazione.

Il quality checkpoint successivo ha verificato in produzione che uno score esattamente zero venga filtrato con `zero_relevance`.

#### F3.3 — Claim, fonti e scadenze

**Stato: completata e verificata in produzione.**

- contratto claim completo validato a runtime;
- claim e brief collegato, soggetto, campo, testo e domanda di verifica;
- stato, evidence, note, fonte, trust level e source kinds richiesti;
- verification status, confidence, checked at, valid until e task status;
- filtri per stato, brief, fonte, verifica e scadenza;
- dettaglio read-only accessibile;
- fonte distinta dall'evidenza;
- URL esterni limitati a HTTP/HTTPS;
- stato temporale separato dallo stato canonico;
- empty state, contratto invalido, desktop, mobile e tastiera verificati;
- nessuna richiesta browser diversa da `GET`;
- nessuna mutation o pubblicazione.

#### F3.4 — Page Readiness ed evidence bundle

**Stato: completata e verificata in produzione.**

Dati esistenti usati:

- ID bundle, brief, page slug e versione;
- readiness score e review status;
- `review_draft_eligible` e `publication_eligible`;
- `ready_for_review_draft` e `ready_for_publication`;
- verified, insufficient, contradicted, pending ed expired count;
- conflict, source, subject e first-party test count;
- warning strutturati;
- revisore, reviewed at, created at e updated at.

Vista verificata:

- riepilogo bundle, draft idonei, pubblicabili e record con warning;
- tabella con score, review status e gate separati;
- filtri per review status, draft eligibility, publication eligibility e warning;
- dettaglio read-only accessibile;
- conteggi claim, conflitti, fonti, soggetti e test first-party;
- warning, revisore e timestamp mostrati come persistiti;
- empty state, contratto invalido, desktop, mobile e tastiera.

Contratti:

- i quattro gate sono validati come `0 | 1`;
- i conteggi sono validati come interi non negativi;
- ogni warning richiede `code` non vuoto e accetta `message` opzionale testuale;
- metadati warning aggiuntivi vengono preservati senza reinterpretazione;
- stringhe legacy e warning non conformi vengono rifiutati;
- readiness score, warning, conteggi e gate non vengono ricalcolati;
- draft eligibility e publication eligibility non vengono fuse;
- un record incoerente rende invalido lo snapshot.

La prima verifica reale ha scoperto una fixture `string[]` non aderente al backend canonico. La hotfix #40 ha riallineato parser, rendering, fixture e smoke al formato `{ code, message, ...metadata }`; il payload reale è ora visibile in produzione.

Non include:

- valutazione o ricalcolo della readiness;
- approvazione dell'evidence bundle;
- generazione draft;
- mutation della queue;
- nuovi endpoint o query D1;
- draft decisions o pubblicazione.

#### F3.5 — Draft, preview e decisioni

**Stato: prossima fase, inizialmente read-only.**

La fase deve partire dalla lettura del contratto reale e mostrare, soltanto quando esposti:

- draft, evidence bundle e brief collegati;
- versione, renderer e stato canonico;
- contenuto strutturato e metadati principali;
- claim usati ed esclusi;
- provenance per campi, sezioni e FAQ;
- autore, note, errori e timestamp;
- pagina materializzata e stato separato;
- decisioni editoriali già persistite.

Separazioni obbligatorie:

```text
approved draft ≠ published page
review draft    ≠ publication eligibility
editorial approval ≠ publication action
```

La prima iterazione non introduce generazione, approvazione, mutation, nuovi endpoint o pubblicazione. Eventuali azioni operative vengono progettate e autorizzate in branch successive.

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
- una capability configurata non viene presentata come prova di salute end-to-end;
- un payload JSON non viene considerato valido soltanto perché esiste un tipo TypeScript;
- segnali e trend non vengono presentati come claim commerciali verificati;
- una scadenza derivata nel client non riscrive lo stato canonico del claim;
- una fonte ufficiale non viene presentata come test indipendente;
- draft eligibility non viene presentata come publication eligibility;
- approvazione editoriale non viene presentata come pubblicazione.

## Definition of Done F3.4

- [x] evidence bundle reali sono visibili;
- [x] contratti runtime coprono tutti i campi usati;
- [x] readiness score e conteggi sono mostrati come persistiti;
- [x] draft eligibility e publication eligibility restano distinti;
- [x] filtri, dettaglio, loading, error ed empty state sono verificati;
- [x] tastiera e viewport mobile sono verificati;
- [x] typecheck, build, migrazioni, quality gate, Container e runtime sono verdi;
- [x] smoke Chromium generale, claim e readiness sono verdi;
- [x] nessuna richiesta browser diversa da `GET`;
- [x] nessuna approvazione, mutation, pubblicazione o accesso browser a D1;
- [x] overview, radar, segnali, brief, claim e draft preview non regrediscono;
- [x] deploy e verifica manuale sono verdi.

## Cosa non facciamo adesso

- riscrivere il backend;
- spostare subito tutte le directory;
- pubblicare la pagina Cina;
- costruire un design system proprietario da zero;
- introdurre una libreria senza necessità dimostrata;
- aggiungere nuove feature alla Control Room legacy;
- introdurre azioni operative nella stessa PR della migrazione draft read-only.

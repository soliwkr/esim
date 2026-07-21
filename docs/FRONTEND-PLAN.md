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
- smoke `workerd` e Chromium.

### Target da adottare soltanto quando serve

- TanStack Query per cache, retry e mutation complesse;
- TanStack Table per dataset operativi più grandi;
- React Hook Form per form editoriali;
- Zod se i contratti condivisi richiedono una libreria dedicata.

La migrazione overview non ha introdotto dipendenze aggiuntive. La fase radar e brief deve prima verificare se i dataset e i filtri correnti richiedono davvero TanStack Table; una libreria viene aggiunta soltanto quando riduce complessità reale.

## UI kit

La Control Room usa **shadcn/ui**. Il confronto con Mantine non è stato eseguito e resta opzionale; non blocca la migrazione in assenza di un vantaggio concreto da misurare.

Criteri per un eventuale confronto:

- quantità di codice custom;
- accessibilità e tastiera;
- qualità mobile;
- velocità di implementazione;
- coerenza con il sito pubblico Astro;
- facilità di tema e branding;
- bundle e idratazione;
- manutenzione e aggiornamenti.

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
- [x] solo bugfix critici;
- [x] nessuna nuova funzione importante nella dashboard HTML manuale;
- [x] nessuna nuova pagina pubblica costruita con template string nel Worker.

### F1 — Frontend foundation

- [x] creare `apps/web` con Astro, React e Cloudflare;
- [x] collegare il custom Worker entrypoint;
- [x] verificare binding, Workflow, Container e API in `workerd`;
- [x] verificare che non esistano route di pubblicazione;
- [x] distribuire e verificare la fondazione in produzione.

### F2 — Control Room UI e perimetro privato

- [x] installare shadcn/ui con componenti sorgente versionati;
- [x] creare una shell dashboard responsive in una sola island React;
- [x] mostrare overview, claim e draft preview campione in sola lettura;
- [x] proteggere il path con Cloudflare Access;
- [x] validare l’identità anche nell’origine;
- [x] mediare la sessione applicativa nel Worker;
- [x] eliminare il secondo login e le credenziali dal browser;
- [x] coprire hydration, loading, error, empty, tastiera e mobile.

### F3 — Migrare la Control Room

Ordine:

1. overview e health — **completate e verificate con PR #32**;
2. radar e brief — **prossima fase**;
3. claim e fonti;
4. readiness ed evidence bundle;
5. draft e preview;
6. audit e queue.

#### F3.1 — Overview e health

**Stato: completata e verificata in produzione.**

Risultati:

- tutte le metriche già esposte da `snapshot.overview` sono visibili;
- capability e binding hanno semantica esplicita;
- timestamp e guardrail sono mostrati;
- health e snapshot sono risorse indipendenti;
- payload non validi sono rifiutati;
- dati validi sono preservati durante errori parziali;
- claim e draft preview non sono regrediti;
- typecheck, build, migrazioni, Container, runtime e browser smoke sono verdi;
- deploy e verifica manuale desktop/mobile sono completati;
- nessuna mutation, pubblicazione o accesso browser a D1 è stata introdotta.

#### F3.2 — Radar e brief

**Stato: prossima fase.**

Dati esistenti da usare:

- `researchRuns`;
- `signals`;
- `briefs`.

Vista run:

- query, sistema sorgente e tipo di run;
- finestra temporale e data di generazione;
- result count, warning count, eligible count e filtered count;
- dettaglio read-only e stato vuoto.

Vista segnali:

- tipo, topic, titolo, provenienza e URL;
- data di pubblicazione, freshness e relevance score;
- idoneità editoriale, stato e quality flags;
- relazione con il run di origine.

Vista brief:

- cluster, titolo proposto, slug, asset type e search intent;
- Opportunity, Evidence e Priority Score;
- stato e note;
- evidence bundle, readiness e draft collegato quando presenti;
- filtri e dettaglio read-only.

Contratti:

- validare a runtime tutti e tre gli array;
- preservare `null` e valori canonici senza ricalcoli nel client;
- rifiutare record incoerenti con un errore esplicito;
- non usare un segnale recent-demand come prova commerciale.

Non include:

- avvio del Workflow;
- accettazione o conversione dei brief;
- nuovi endpoint o query D1;
- mutation o azioni operative;
- modifiche a AI, claim, readiness, draft o publication gate.

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
- i componenti esterni vengono ispezionati e fissati a versioni controllate;
- non si importa un template completo senza verificare dipendenze, licenza e codice;
- una capability configurata non viene presentata come prova di salute end-to-end;
- un payload JSON non viene considerato valido soltanto perché esiste un tipo TypeScript;
- segnali e trend non vengono presentati come claim commerciali verificati.

## Definition of Done F3.2

- [ ] run, segnali e brief reali sono visibili;
- [ ] relazioni run → segnali → brief sono comprensibili;
- [ ] contratti runtime coprono i tre array;
- [ ] punteggi, stati e quality flags conservano il significato canonico;
- [ ] filtri, dettaglio, loading, error ed empty state sono verificati;
- [ ] tastiera e viewport mobile sono verificati;
- [ ] typecheck, build, migrazioni, Container, runtime e browser smoke sono verdi;
- [ ] nessuna richiesta browser diversa da `GET`;
- [ ] nessuna mutation, pubblicazione o accesso browser a D1;
- [ ] overview, claim e draft preview non regrediscono.

## Cosa non facciamo adesso

- riscrivere il backend;
- spostare subito tutte le directory;
- pubblicare la pagina Cina;
- costruire un design system proprietario da zero;
- introdurre una libreria senza necessità dimostrata;
- aggiungere nuove feature alla Control Room legacy;
- introdurre azioni operative nella stessa PR della migrazione read-only di radar e brief.

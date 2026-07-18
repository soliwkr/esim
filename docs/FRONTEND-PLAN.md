# Piano frontend

Data di riferimento: **18 luglio 2026**.

## Decisione

Senza Roaming smette di usare il Cloudflare Worker come generatore artigianale di HTML, CSS e JavaScript browser.

La direzione adottata è:

```text
Astro
├── sito pubblico orientato ai contenuti
├── layout, navigazione, SEO e pagine
└── shell della Control Room

React island
└── applicazione interattiva della Control Room

Cloudflare Worker esistente
├── API
├── D1
├── Workflows
├── Container
├── AI Gateway / Vertex
└── gate editoriali e di pubblicazione
```

Il backend non viene riscritto. La migrazione riguarda il livello di presentazione e il modo in cui viene compilato e distribuito.

## Principio operativo

Non si costruiscono più a mano componenti generici già risolti dall'ecosistema.

Da riusare:

- button, input, select, dialog, drawer e toast;
- tabelle, filtri, pagination e stati vuoti;
- form validation, loading, error e retry;
- focus management, tastiera e accessibilità;
- responsive layout, dark mode e token visivi;
- dashboard shell e pattern di navigazione.

Da scrivere nel progetto:

- flussi brief → claim → readiness → draft;
- contratti API e schemi di dominio;
- regole editoriali e guardrail;
- viste specifiche di Senza Roaming;
- copy e design token del brand.

## Stack target

### Fondazione

- Astro come frontend principale;
- adapter Cloudflare;
- React soltanto per la Control Room e altre isole realmente interattive;
- TypeScript strict;
- contratti condivisi e validazione con Zod;
- client dati con TanStack Query;
- tabelle operative con TanStack Table;
- form con React Hook Form;
- icone Lucide.

### UI kit

Il candidato principale è **shadcn/ui**, usando componenti e blocchi esistenti invece di ricostruire una libreria interna.

Prima dell'adozione definitiva viene eseguito uno spike controllato contro **Mantine**.

Lo spike implementa le stesse tre viste:

1. overview con metriche e health;
2. tabella claim con filtri e pannello azione;
3. revisione draft con preview e decisione editoriale.

Criteri di scelta:

- quantità di codice custom;
- accessibilità e uso da tastiera;
- qualità mobile;
- velocità di implementazione;
- coerenza con il sito pubblico Astro;
- facilità di tema e branding;
- bundle client e idratazione necessaria;
- manutenzione e aggiornamenti;
- assenza di DOM e listener manuali.

Decisione predefinita: scegliere shadcn/ui salvo un vantaggio netto e dimostrato di Mantine nello spike.

## Integrazione Cloudflare da validare

La forma preferita è un singolo progetto distribuito su Cloudflare:

```text
richiesta
→ custom Worker entrypoint
→ route API e binding esistenti
→ handler Astro per pagine e asset
```

Lo spike deve dimostrare che il custom entrypoint Astro può convivere con:

- export di Workflow e Container;
- D1 e secret esistenti;
- API di manutenzione;
- deploy automatico;
- migrazioni D1;
- 404, canonical, robots e sitemap;
- nessuna regressione sui gate di pubblicazione.

Una separazione in due Worker viene valutata soltanto se l'integrazione nello stesso Worker produce accoppiamento o rischi operativi ingiustificati.

## Struttura incrementale

Non si sposta subito tutto il repository.

```text
apps/
  web/                 # nuovo frontend Astro

src/                   # Worker e backend esistenti, invariati nella prima fase
migrations/
containers/
```

La trasformazione in monorepo più profonda viene considerata solo dopo il primo rilascio stabile Astro.

## Fasi

### F0 — Congelare la UI artigianale

- Control Room v3 resta una soluzione transitoria;
- solo bugfix critici;
- nessuna nuova funzione importante nella dashboard HTML manuale;
- nessuna nuova pagina pubblica costruita con template string nel Worker.

### F1 — Spike architetturale

- creare `apps/web` con Astro, React e Cloudflare;
- collegare il custom Worker entrypoint;
- verificare binding, Workflow, Container e API;
- confrontare shadcn/ui e Mantine sulle tre viste campione;
- produrre una decisione misurata e una demo non pubblica.

### F2 — Design foundation

- scegliere UI kit;
- adottare un dashboard block o starter comprovato;
- definire token di brand, tipografia, spaziature e stati;
- creare layout pubblico e layout Control Room;
- creare API client tipizzato e gestione sessione.

### F3 — Migrare la Control Room

Ordine:

1. overview e health;
2. radar e brief;
3. claim e fonti;
4. readiness ed evidence bundle;
5. draft e preview;
6. audit e queue.

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

- eliminare renderer HTML/CSS/JS manuali;
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
- non si importa un template completo senza verificare dipendenze, licenza e codice.

## Definition of Done dello spike

- Astro gira in `workerd` con i binding reali o equivalenti;
- API esistenti raggiungibili senza regressioni;
- Workflow e Container continuano a essere esportati e distribuiti;
- tre viste Control Room realizzate con entrambi i candidati o con prova sufficiente a scartarne uno;
- decisione UI registrata in `docs/DECISIONS.md`;
- volume di codice custom e bundle confrontati;
- nessuna stringa HTML monolitica, `innerHTML` o listener manuale nella nuova UI;
- piano di migrazione stimato e PR dello spike non collegata al traffico pubblico.

## Cosa non facciamo adesso

- riscrivere il backend;
- spostare subito tutte le directory;
- pubblicare la pagina Cina;
- costruire un design system proprietario da zero;
- scegliere una libreria soltanto perché è popolare;
- aggiungere nuove feature alla Control Room legacy prima della migrazione.

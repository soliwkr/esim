# Piano frontend

Data di riferimento: **23 luglio 2026**.

## Decisione

Senza Roaming non usa il Cloudflare Worker come generatore di nuove interfacce HTML, CSS e JavaScript applicative.

```text
Astro
├── sito pubblico content-first
├── layout, navigazione, SEO e pagine
└── shell della Control Room

React island
└── applicazione interattiva della Control Room

Custom Cloudflare Worker
├── Cloudflare Access e route server-side
├── API
├── D1
├── Workflows
├── Container
├── AI Gateway / Vertex
└── gate editoriali e di pubblicazione
```

Il backend non viene riscritto come parte della migrazione frontend. Le estensioni server-side sono limitate a contratti espliciti e restano nello stesso execution plane.

M5 pubblico può ora procedere in parallelo alle mutation M4 residue, secondo `docs/PUBLIC-FRONTEND-PARALLEL-TRACK.md`.

## Principio operativo

Non si costruiscono da zero componenti generici già risolti dall’ecosistema.

Da riusare:

- button, input, select, dialog, AlertDialog, Sheet e toast;
- tabelle, filtri e stati vuoti;
- loading, error, retry e focus management;
- responsive layout e primitive accessibili.

Da scrivere nel progetto:

- flussi brief → claim → readiness → draft;
- contratti e validazione dei dati di dominio;
- state machine e guardrail editoriali;
- viste specifiche di Senza Roaming;
- layout, navigazione e renderer editoriali pubblici;
- test end-to-end delle operazioni e delle route pubbliche.

## Stack

### Operativo

- Astro come frontend principale;
- adapter Cloudflare;
- React soltanto per la Control Room e altre isole realmente interattive;
- TypeScript strict;
- shadcn/ui con primitive Radix e sorgenti versionati;
- Lucide;
- Tailwind 4;
- validazione runtime dei payload;
- smoke D1, `workerd` e Chromium.

### Da adottare soltanto quando serve

- TanStack Query per cache, retry e mutation più numerose;
- TanStack Table per dataset operativi più grandi;
- React Hook Form per form articolati;
- Zod se i contratti condivisi richiedono una libreria dedicata.

Una libreria viene aggiunta soltanto quando riduce complessità reale.

## Integrazione Cloudflare

Il progetto usa un singolo Worker:

```text
richiesta
→ custom Worker entrypoint
→ Access guard per /control-room-foundation*
→ route read-only o mutation esplicita
→ handler Astro per pagine e asset
→ router backend per API e pagine non migrate
```

Sono verificati:

- export Workflow e Container;
- binding D1 e configurazione runtime;
- API di manutenzione;
- build e runtime `workerd`;
- 404, canonical, robots e sitemap esistenti nel renderer legacy;
- assenza di route di pubblicazione automatica;
- shell e proxy snapshot;
- dettaglio draft GET-only on demand;
- prima route mutabile limitata alla decisione brief, verificata in CI #237 e in produzione con checkpoint #244.

La route decisione brief è operativa dietro Cloudflare Access. Il checkpoint non ha eseguito decisioni reali e ha confermato `publicationAutomation: false`.

## Struttura incrementale

```text
apps/
  web/                 # Astro, React island e componenti pubblici/Control Room

src/                   # backend ed execution plane
migrations/
containers/
scripts/
```

La riorganizzazione completa del repository viene valutata soltanto dopo il rilascio stabile della Control Room e del frontend pubblico.

## Modello a due track

```text
Track A — Control Room M4
mutation operative una per branch
→ parità completa
→ rimozione legacy privata

Track B — frontend pubblico M5
preview noindex
→ route migrate una per branch
→ catalogo pilot
→ cutover apex separato
```

Regole:

- una branch appartiene a una sola track;
- una PR M5 non introduce mutation M4;
- una PR M4 non esegue il cutover pubblico;
- M5 non cambia gli stati editoriali;
- M4 non viene dichiarato completo perché esiste una preview pubblica;
- la legacy Control Room e il renderer pubblico legacy hanno exit criteria separati.

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

### F3 — Migrare la Control Room

#### F3.1–F3.8 — Letture e parità

Completati:

1. overview e health — PR #32;
2. radar e brief — PR #34;
3. claim, fonti e scadenze — PR #37;
4. readiness ed evidence bundle — PR #39 + #40;
5. draft, preview e decisioni read-only — PR #42;
6. queue e audit — PR #44;
7. dettaglio draft completo — PR #47;
8. audit sistematico di parità legacy — PR #49;
9. linkage claim → task — PR #50;
10. linkage audit → versione draft — PR #52.

Non restano gap read-only noti in CI.

Linkage canonici:

```text
claim.task_id + claim.task_status
audit.event_key + audit.draft_id + audit.draft_version
```

Il client non ricostruisce relazioni da `entity_key`, `details` o altri campi opachi.

Il dettaglio draft resta separato dallo snapshot:

```text
inventario nello snapshot
→ apertura esplicita
→ GET /control-room-foundation/api/draft-detail?draftId=<id>
→ Access
→ maintenance token server-side
→ contratto backend esistente
```

La preview HTML legacy non è un requisito. Una futura anteprima visuale del sito appartiene al renderer pubblico Astro.

#### F3.9 — Azioni operative

Regola:

```text
una capacità mutabile
→ una branch
→ una route privata
→ una conferma esplicita
→ una state machine server-side
→ un audit persistito
→ reload dello stato
→ test end-to-end
```

Ordine:

```text
decisione brief
→ conversione brief
→ operazioni claim
→ decisione draft
→ eventuale retry queue
```

##### Prima mutation — decisione brief

Branch:

```text
feat/control-room-brief-decision-mutation
```

Transizioni:

```text
proposed → accepted | dismissed
accepted → converted  # resta gate successivo
```

Architettura:

```text
AlertDialog React
→ POST /control-room-foundation/api/brief-decision
→ Access già verificato
→ attore derivato dal JWT
→ handler server-side condiviso
→ UPDATE condizionale
→ trigger D1
→ editorial_brief_events append-only
→ snapshot reload
```

Il browser invia soltanto:

```text
briefId
action
notes
```

Il browser non può scegliere l’attore e non gestisce il maintenance token.

Guardrail:

- soltanto brief `proposed`;
- un solo brief per richiesta;
- conferma prima del POST;
- motivo obbligatorio per il rifiuto;
- stessa decisione ritentata → esito idempotente;
- decisione opposta → conflitto `409`;
- task editoriale aperto cancellato soltanto su `dismissed`;
- evento append-only;
- stati storici backfillati senza identità inventata;
- risposta con `publicationTriggered: false`;
- conteggio delle pagine pubblicate invariato.

CI finale #237 e checkpoint produttivo #244 completamente verdi. La PR non include conversione, claim, readiness, bundle, draft, materializzazione, queue retry o pubblicazione.

### F4 — Migrare il sito pubblico

**Stato: track parallela autorizzata; nessuna route canonica migrata**

#### F4.0 — Shell pubblico preview

Prima branch:

```text
feat/public-astro-shell
```

Scope:

- sostituire la pagina-spike `/astro-foundation` con una preview noindex del shell pubblico;
- introdurre layout documento, metadata contract, header, navigazione, footer, trust links, token visuali e container responsive;
- comporre una homepage preview con copy statico e non commerciale;
- servire il contenuto primario in raw HTML Astro;
- mantenere `/`, sitemap pubblica e route canoniche sul renderer legacy;
- aggiungere smoke build, runtime, mobile, tastiera e noindex;
- non modificare backend, D1, Workflow, Container, claim o publication state.

Esclusioni:

- nessun provider, prezzo, copertura o affiliazione;
- nessun accesso pubblico diretto a D1;
- nessuna route di pubblicazione;
- nessun cutover apex;
- nessuna rimozione legacy;
- nessun CMP, GA4, GTM o Search Console.

Criteri di uscita:

- typecheck e build verdi;
- tutte le suite esistenti senza regressioni;
- `/astro-foundation` noindex e fuori sitemap;
- metadata e navigazione deterministici;
- raw HTML utile senza JavaScript obbligatorio;
- responsive e tastiera verificati;
- current public routing invariato.

#### F4.1 — Trust e pagine statiche

- metodo editoriale;
- trasparenza AI;
- disclosure e principi affiliate senza attivazione;
- privacy/consenso come contenuto, non ancora come CMP;
- responsabilità e aggiornamento delle fonti.

#### F4.2 — Listing e architettura informativa

- [x] home candidata verificata in produzione;
- [x] Destinazioni preview;
- [x] Guide preview;
- [x] Confronti preview;
- [x] read model published-only condiviso;
- [x] internal linking deterministico nel namespace preview;
- [x] route matrix e fail-fast su contenuti mancanti;
- [x] CI #291 applicativa e CI #296 finale verdi;
- [x] merge, deploy e checkpoint visuale live dei listing.

#### F4.3 — Renderer editoriale Astro

Branch:

```text
feat/public-article-renderer
```

- [x] route published-only `/astro-foundation/articoli/[slug]`;
- [x] read model server-only condiviso con il renderer legacy;
- [x] blocchi strutturati, non HTML AI grezzo;
- [x] FAQ native, fonti HTTPS e provenance pubblica page-level;
- [x] claim esclusi e dati operativi interni non letti né esposti;
- [x] related links exact-cluster, published-only e deterministici;
- [x] vera 404 per slug assente, `review` o `draft`;
- [x] fail-closed per pagina `published` strutturalmente invalida;
- [x] noindex, no-store e sitemap exclusion;
- [x] preview home e listing collegate alle route articolo namespaced;
- [x] route canoniche ancora sul renderer legacy;
- [x] smoke D1, `workerd` e Chromium dedicato;
- [x] CI applicativa #302 completamente verde;
- [ ] CI finale, merge e deploy della PR #67;
- [ ] checkpoint visuale live desktop/mobile su un articolo pubblicato.

La preview articolo non espone draft. “Grounded” descrive il contenuto già
materializzato e pubblicato, non una scorciatoia attorno ai gate editoriali.

#### F4.4 — Parità SEO pubblica

Fase bloccata fino al checkpoint live di F4.3.

- canonical;
- sitemap;
- robots;
- schema;
- related links;
- disclosure condizionale;
- redirect provider;
- vere 404;
- drift/regression test.

#### F4.5 — Catalogo pilot

- piccolo set di pagine con intento distinto;
- nessuna generazione massiva;
- evidence e publication eligibility richieste;
- nessuna promessa su indicizzazione o conversione.

#### F4.6 — Cutover apex

PR separata e autorizzazione esplicita.

Richiede:

- confronto route e metadata;
- schema e sitemap validi;
- 404 reali;
- smoke mobile e accessibilità;
- provider redirect preservati;
- publication guardrails preservati;
- rollback documentato;
- assenza di pagine review pubblicate accidentalmente.

### F5 — Hardening

- eliminare renderer HTML, CSS e JavaScript manuali soltanto dopo il cutover verificato;
- ridurre codice duplicato;
- test visuali e browser smoke;
- budget performance;
- documentazione del design system;
- eventuale riorganizzazione completa del repository.

## Apporto dell’audit esterno

L’audit PR #57 non introduce dipendenze. Informa soltanto scelte ristrette:

- `astro-rank-rent` e `rankempire-italia`: slug, route, schema e fail-fast test;
- GEO Optimizer e Claude SEO: controlli di drift/regressione futuri;
- MGC: fixture negative di secret, PII, consenso, claim, sitemap e 404;
- The Sprint: pilot prima della scala;
- Open Design: brief, pre-flight e critica;
- Ahmeego: futuro modello trust/tool/content, non runtime.

## Guardrail

- Astro e React non accedono direttamente a D1 dal browser;
- tutte le route Control Room sono protette da Access;
- l’attore delle mutation deriva dall’identità verificata;
- nessun componente introduce pubblicazione automatica;
- claim, bundle e stati editoriali non vengono ricalcolati nel client;
- una scadenza derivata non riscrive lo stato canonico del claim;
- una fonte ufficiale non viene presentata come test indipendente;
- draft eligibility non viene presentata come publication eligibility;
- lo stato draft non viene presentato come stato pagina;
- lo stato queue non viene presentato come decisione editoriale;
- un errore del dettaglio non invalida lo snapshot;
- relazioni mancanti non vengono ricostruite con euristiche;
- una mutation non abilita implicitamente la successiva;
- M5 preview non equivale a public cutover;
- la legacy Control Room non viene rimossa finché resta il fallback delle mutation;
- il renderer pubblico legacy non viene rimosso finché il cutover Astro non è verificato.

## Cosa non facciamo adesso

- riscrivere l’intero backend;
- introdurre più mutation nella stessa branch;
- pubblicare la pagina Cina;
- spostare subito tutte le directory;
- costruire un design system proprietario;
- aggiungere librerie senza necessità dimostrata;
- ampliare la Control Room legacy;
- duplicare query D1 già coperte;
- copiare il renderer HTML legacy;
- copiare intere piattaforme esterne;
- attivare milioni di URL programmatici;
- cambiare l’apice nella prima PR M5;
- rimuovere una legacy prima del relativo criterio di uscita.

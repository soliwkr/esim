# Piano frontend

Data di riferimento: **24 luglio 2026**.

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
├── route ownership e precedenza
├── Cloudflare Access e route server-side
├── API
├── D1
├── Workflows
├── Container
├── AI Gateway / Vertex
└── gate editoriali e di pubblicazione
```

Il backend non viene riscritto come parte della migrazione frontend. M5 pubblico procede in parallelo alle mutation M4 residue secondo `docs/PUBLIC-FRONTEND-PARALLEL-TRACK.md`.

## Principio operativo

Non si ricostruiscono primitive generiche già risolte da librerie mature.

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
- route ownership e fallback fail-closed;
- test end-to-end delle operazioni e delle route pubbliche.

## Stack operativo

- Astro come frontend principale;
- adapter Cloudflare;
- React soltanto per la Control Room e isole realmente interattive;
- TypeScript strict;
- shadcn/ui con primitive Radix e sorgenti versionati;
- Lucide;
- Tailwind 4;
- validazione runtime dei payload;
- smoke D1, `workerd` e Chromium.

TanStack Query, TanStack Table, React Hook Form e Zod vengono aggiunti soltanto quando riducono complessità reale.

## Integrazione Cloudflare

```text
richiesta
→ custom Worker entrypoint
→ activePublicRouteDecision
→ Access guard per /control-room-foundation*
→ handler Astro per route Astro-owned
→ router backend per route backend-owned
```

### Matrice attiva

```text
Astro:
  /astro-foundation*
  /control-room-foundation*

Backend:
  route canoniche
  sitemap e robots
  provider redirect
  API ed execution plane
  legacy Control Room
  asset tecnici
  articolo fallback e 404
```

### Matrice target, non attiva

```text
Astro:
  home, listing, trust, articoli
  sitemap, robots e 404 pubblica

Backend:
  /api/*
  /go/*
  legacy Control Room finché necessaria
  D1, Workflow, Container, AI e gate editoriali
```

Il contratto è documentato in `docs/PUBLIC-SEO-ROUTING-OWNERSHIP-SCOPE.md`.

## Struttura incrementale

```text
apps/
  web/                 # Astro, React island e componenti pubblici/Control Room

src/                   # backend, route policy, read model ed execution plane
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
→ contratto SEO condiviso
→ route policy foundation
→ canonical parity sotto test
→ SEO endpoint parity
→ catalogo pilot
→ cutover apex separato
```

Regole:

- una branch appartiene a una sola track;
- una PR M5 non introduce mutation M4;
- una PR M4 non esegue il cutover pubblico;
- M5 non cambia gli stati editoriali;
- M4 non viene dichiarato completo perché esiste una preview pubblica;
- owner target non equivale a owner live;
- canonical Astro compilato non equivale a canonical Astro servito;
- la legacy Control Room e il renderer pubblico legacy hanno exit criteria separati.

## Fasi Control Room

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
- [x] credenziali browser rimosse;
- [x] hydration, loading, error, empty, tastiera e mobile coperti.

### F3 — Migrare la Control Room

Letture e parità completate con PR #32, #34, #37, #39, #40, #42, #44, #47, #49, #50 e #52.

Mutation:

```text
decisione brief
→ conversione brief
→ operazioni claim
→ decisione draft
→ eventuale retry queue
```

Prima mutation verificata:

```text
proposed → accepted | dismissed
```

`accepted → converted` resta un gate successivo.

## F4 — Migrare il sito pubblico

**Stato: M5.0–M5.5a concluse; M5.5b.1 completata in CI; nessuna route canonica migrata.**

### F4.0 — Shell pubblico preview

- [x] `/astro-foundation` noindex;
- [x] layout, metadata, header, navigazione e footer;
- [x] raw HTML senza JavaScript necessario;
- [x] current public routing invariato;
- [x] checkpoint live.

### F4.1 — Trust e pagine statiche

- [x] metodo editoriale;
- [x] trasparenza;
- [x] privacy;
- [x] componente condiviso;
- [x] checkpoint mobile 3/3;
- [x] route canoniche legacy preservate.

### F4.2 — Homepage e listing

- [x] homepage candidata;
- [x] Destinazioni, Guide e Confronti preview;
- [x] read model published-only condiviso;
- [x] internal linking deterministico;
- [x] route matrix dei listing e fail-fast;
- [x] deploy e checkpoint visuale live.

### F4.3 — Renderer editoriale Astro

- [x] `/astro-foundation/articoli/[slug]`;
- [x] published-only;
- [x] read model condiviso;
- [x] blocchi strutturati e FAQ native;
- [x] fonti HTTPS e provenance pubblica;
- [x] dati operativi interni esclusi;
- [x] related links deterministici;
- [x] vere 404 e fail-closed;
- [x] noindex, no-store e sitemap exclusion;
- [x] PR #67, CI finale #307 e checkpoint live desktop/mobile.

### F4.4 — Parità SEO pubblica

#### F4.4a — Contratto SEO condiviso

- [x] `src/public-seo.ts`;
- [x] title, description e Open Graph condivisi;
- [x] `WebSite`, `Article` e `FAQPage`;
- [x] serializer JSON-LD sicuro;
- [x] canonical e robots route-specific;
- [x] drift e regressioni;
- [x] PR #69 mergiata;
- [x] homepage e articolo verificati nel sorgente live.

#### F4.4b.1 — Route policy foundation

Branch e PR:

```text
feat/public-route-policy-foundation
PR #71
```

- [x] `src/public-route-policy.ts`;
- [x] owner e route kind tipizzati;
- [x] current/target matrix separate;
- [x] export attivo fissato alla current matrix;
- [x] reserved paths e file-probe policy condivisi;
- [x] validazione slug articolo single-segment;
- [x] custom Worker usa la matrice attiva;
- [x] nessun cambio live;
- [x] smoke dedicato;
- [x] CI applicativa #323 completamente verde.

#### F4.4b.2 — Canonical Astro parity

Prima del codice serve lo scope:

```text
docs/public-canonical-astro-parity-scope
```

Da definire:

- componenti preview/canonical;
- route Astro canoniche compilate;
- test diretto del renderer senza cambiare owner live;
- internal link canonicali;
- 404 Astro;
- published-only, fail-closed e reserved path;
- parità visuale, accessibile e SEO;
- owner live ancora legacy.

#### F4.4b.3 — SEO endpoint parity

PR separata:

- [ ] builder sitemap/robots condivisi;
- [ ] handler Astro testati;
- [ ] output semantico equivalente;
- [ ] owner live ancora legacy.

### F4.5 — Catalogo pilot

- piccolo set di pagine con intento distinto;
- nessuna generazione massiva;
- evidence e publication eligibility richieste;
- nessuna promessa su indicizzazione o conversione.

### F4.6 — Cutover apex

PR separata e autorizzazione esplicita.

Richiede:

- modifica minima della matrice attiva;
- confronto route e metadata;
- schema, sitemap, robots e 404 validi;
- smoke mobile e accessibilità;
- provider redirect preservati;
- publication guardrails preservati;
- rollback documentato;
- assenza di pagine review pubblicate accidentalmente.

### F5 — Hardening

- eliminare renderer manuali soltanto dopo il cutover verificato;
- ridurre codice duplicato;
- test visuali e browser smoke;
- budget performance;
- documentazione del design system;
- eventuale riorganizzazione completa del repository.

## Guardrail

- Astro e React non accedono direttamente a D1 dal browser;
- tutte le route Control Room sono protette da Access;
- l’attore delle mutation deriva dall’identità verificata;
- nessun componente introduce pubblicazione automatica;
- claim, bundle e stati editoriali non vengono ricalcolati nel client;
- una mutation non abilita implicitamente la successiva;
- la matrice target non diventa attiva senza PR di cutover;
- API e provider redirect non vengono intercettati da Astro;
- file probe e route riservate non diventano articoli;
- M5 preview non equivale a public cutover;
- la legacy Control Room non viene rimossa finché resta fallback delle mutation;
- il renderer pubblico legacy non viene rimosso finché il cutover Astro non è verificato.

## Cosa non facciamo adesso

- riscrivere l’intero backend;
- introdurre più mutation nella stessa branch;
- pubblicare la pagina Cina;
- costruire un design system proprietario;
- aggiungere librerie senza necessità dimostrata;
- ampliare la Control Room legacy;
- duplicare query D1 già coperte;
- copiare il renderer HTML legacy;
- attivare milioni di URL programmatici;
- cambiare `activePublicRouteDecision` prima di M5.7;
- usare flag runtime nascosti o parametri URL per scegliere il renderer;
- rimuovere una legacy prima del relativo criterio di uscita.

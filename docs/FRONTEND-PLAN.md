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

Il backend non viene riscritto come parte della migrazione frontend. Le estensioni server-side sono limitate a contratti espliciti e restano nello stesso execution plane.

M5 pubblico procede in parallelo alle mutation M4 residue secondo `docs/PUBLIC-FRONTEND-PARALLEL-TRACK.md`.

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
- route ownership e fallback fail-closed;
- test end-to-end delle operazioni e delle route pubbliche.

## Stack

### Operativo

- Astro come frontend principale;
- adapter Cloudflare;
- React soltanto per la Control Room e isole realmente interattive;
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
→ route policy e precedenza
→ Access guard per /control-room-foundation*
→ handler Astro per route possedute da Astro
→ router backend per route possedute dal backend
```

Stato live corrente:

```text
Astro owner:
  /astro-foundation*
  /control-room-foundation*

Backend owner:
  tutte le route canoniche
  sitemap e robots
  provider redirect
  API ed execution plane
```

Owner target, non ancora attivo:

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

src/                   # backend, read model condivisi ed execution plane
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
→ route ownership foundation
→ canonical parity sotto test
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

#### Letture e parità

Completati:

1. overview e health — PR #32;
2. radar e brief — PR #34;
3. claim, fonti e scadenze — PR #37;
4. readiness ed evidence bundle — PR #39 + #40;
5. draft e decisioni read-only — PR #42;
6. queue e audit — PR #44;
7. dettaglio draft completo — PR #47;
8. audit parità legacy — PR #49;
9. linkage claim → task — PR #50;
10. linkage audit → versione draft — PR #52.

Non restano gap read-only noti in CI.

#### Azioni operative

Regola:

```text
una capacità mutabile
→ una branch
→ una route privata
→ conferma esplicita
→ state machine server-side
→ audit persistito
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

Prima mutation verificata:

```text
proposed → accepted | dismissed
```

`accepted → converted` resta un gate successivo.

## F4 — Migrare il sito pubblico

**Stato: M5.0–M5.5a concluse; M5.5b route ownership in avvio; nessuna route canonica migrata.**

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
- [x] Destinazioni preview;
- [x] Guide preview;
- [x] Confronti preview;
- [x] read model published-only condiviso;
- [x] internal linking deterministico;
- [x] route matrix dei listing e fail-fast;
- [x] deploy e checkpoint visuale live.

### F4.3 — Renderer editoriale Astro

- [x] `/astro-foundation/articoli/[slug]`;
- [x] published-only;
- [x] read model condiviso;
- [x] blocchi strutturati;
- [x] FAQ native;
- [x] fonti HTTPS e provenance pubblica;
- [x] dati operativi interni esclusi;
- [x] related links deterministici;
- [x] vere 404 e fail-closed;
- [x] noindex, no-store e sitemap exclusion;
- [x] PR #67, CI finale #307 e checkpoint live desktop/mobile.

### F4.4 — Parità SEO pubblica

#### F4.4a — Contratto SEO condiviso

- [x] `src/public-seo.ts`;
- [x] title e description condivisi;
- [x] Open Graph condiviso;
- [x] `WebSite`, `Article` e `FAQPage`;
- [x] serializer JSON-LD sicuro;
- [x] canonical e robots route-specific;
- [x] drift e regressioni;
- [x] PR #69 mergiata;
- [x] homepage e articolo verificati nel sorgente live.

#### F4.4b — Routing e ownership

Scope:

```text
docs/PUBLIC-SEO-ROUTING-OWNERSHIP-SCOPE.md
```

##### Route policy foundation

Branch:

```text
feat/public-route-policy-foundation
```

- [ ] matrice current/target tipizzata;
- [ ] precedenza esplicita;
- [ ] reserved paths e file-probe policy;
- [ ] custom Worker usa la matrice corrente;
- [ ] nessun cambio live;
- [ ] smoke dedicato;
- [ ] CI completa.

##### Canonical Astro parity

PR separata:

- [ ] componenti preview/canonical;
- [ ] route Astro canoniche compilate e testate;
- [ ] internal link canonicali;
- [ ] 404 Astro;
- [ ] owner live ancora legacy.

##### SEO endpoint parity

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

- eliminare renderer HTML, CSS e JavaScript manuali soltanto dopo il cutover verificato;
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
- una route target non diventa live senza PR di cutover;
- API e provider redirect non vengono intercettati da un catch-all Astro;
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
- cambiare l’owner live nella route policy foundation;
- usare flag runtime nascosti per scegliere il renderer;
- rimuovere una legacy prima del relativo criterio di uscita.

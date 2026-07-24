# Senza Roaming — Roadmap

Ultimo aggiornamento: **24 luglio 2026**.

Questa è la roadmap canonica di `soliwkr/esim`.

## Documenti operativi

- `ROADMAP.md` — milestone e criteri di uscita;
- `docs/STATUS.md` — stato verificato;
- `docs/NEXT.md` — lavoro immediato;
- `docs/ARCHITECTURE.md` — confini tecnici;
- `docs/DECISIONS.md` — decisioni accettate;
- `docs/FRONTEND-PLAN.md` — migrazione Astro e Control Room;
- `docs/PUBLIC-FRONTEND-PARALLEL-TRACK.md` — separazione M4/M5;
- `docs/PUBLIC-HOMEPAGE-CANDIDATE-SCOPE.md` — homepage candidata;
- `docs/PUBLIC-LISTING-PREVIEWS.md` — listing preview;
- `docs/PUBLIC-ARTICLE-RENDERER-SCOPE.md` — renderer articolo Astro;
- `docs/PUBLIC-SEO-CONTRACT-FOUNDATION-SCOPE.md` — M5.5a;
- `docs/PUBLIC-SEO-ROUTING-OWNERSHIP-SCOPE.md` — M5.5b.1;
- `docs/PUBLIC-CANONICAL-ASTRO-PARITY-SCOPE.md` — M5.5b.2;
- `docs/PUBLIC-SEO-ENDPOINT-PARITY-SCOPE.md` — M5.5b.3.

## Principi non negoziabili

1. L’AI non pubblica direttamente.
2. Brief, claim, readiness, draft, materializzazione e pubblicazione sono gate distinti.
3. I fatti commerciali richiedono fonti identificabili e data di verifica.
4. Claim insufficienti o scaduti non alimentano testo fattuale.
5. Il browser non accede direttamente a D1.
6. Ogni mutation richiede identità verificata, conferma, state machine, audit e test.
7. Astro è il frontend pubblico; React resta un’isola realmente interattiva.
8. Una preview Astro non equivale a un cutover.
9. Una riga `review` non equivale a contenuto pubblico.
10. Un owner target non equivale all’owner live.
11. Canonical Astro compilato non equivale a canonical Astro servito.
12. Endpoint Astro compilato non equivale a endpoint Astro live-owned.
13. Il repository è la memoria canonica.

## M0 — Fondazioni tecniche

**Stato: completato salvo verifica definitiva `www → apex`.**

- [x] Worker e D1;
- [x] migrazioni versionate;
- [x] deploy automatico;
- [x] dominio principale;
- [x] Container e Workflow;
- [x] API manutenzione protette;
- [x] vere 404 e noindex;
- [ ] ricontrollare redirect `www`.

## M1 — Qualità e osservabilità

**Stato: quality gate operativo; osservabilità avanzata aperta.**

- [x] documentazione canonica;
- [x] storico run e audit;
- [x] freshness;
- [x] score zero deterministico;
- [x] golden evaluation;
- [x] topic-mismatch gate;
- [x] snapshot Control Room;
- [x] audit repository esterni;
- [ ] verifica live topic-mismatch;
- [ ] health aggregato;
- [ ] log errori unificati.

## M2 — Motore AI editoriale

**Stato: nucleo v1 operativo.**

- [x] AI Gateway e Vertex;
- [x] segnali idonei soltanto;
- [x] brief strutturati e persistiti;
- [x] claim atomici e fonti;
- [x] esiti verificati;
- [x] nessuna pubblicazione automatica;
- [ ] deduplicazione semantica storica;
- [ ] Trust Score evoluto.

## M3 — Readiness e draft grounded

**Stato: completato e verificato.**

- [x] aggregazione claim e conflitti;
- [x] review-draft eligibility separata dalla publication eligibility;
- [x] evidence bundle versionato;
- [x] provenance field-level;
- [x] esclusione claim insufficienti;
- [x] materializzazione solo in `review`;
- [x] primo draft grounded approvato senza pubblicazione.

## M4 — Control Room definitiva

**Stato: letture complete; prima mutation in produzione; mutation residue aperte.**

### Foundation e letture

- [x] Astro shell e React island;
- [x] shadcn/ui;
- [x] custom Worker;
- [x] Cloudflare Access;
- [x] sessione server-side;
- [x] browser senza credenziali applicative;
- [x] overview, health, radar, segnali e brief;
- [x] claim, fonti, scadenze e task;
- [x] readiness e bundle;
- [x] draft, dettaglio, queue e audit;
- [x] linkage canonici;
- [x] parità legacy read-only.

### Mutation

- [x] decisione brief `proposed → accepted | dismissed`;
- [ ] conversione brief;
- [ ] operazioni claim;
- [ ] decisione draft;
- [ ] eventuale retry queue;
- [ ] rimozione legacy privata dopo parità mutabile.

**Criterio di uscita M4:** la legacy privata non è più un fallback operativo.

## M5 — Frontend pubblico Astro e catalogo

**Stato: M5.0–M5.5a verificate in produzione; M5.5b.1–M5.5b.2 completate in CI senza cutover; scope M5.5b.3 definito.**

### M5.0 — Public shell

- [x] `/astro-foundation` noindex;
- [x] layout, metadata, header, menu e footer;
- [x] raw HTML senza JavaScript necessario;
- [x] mobile e tastiera;
- [x] `/` invariato;
- [x] fuori sitemap;
- [x] checkpoint mobile live.

### M5.1 — Trust pages

- [x] Metodo, Trasparenza e Privacy preview;
- [x] componente condiviso;
- [x] route canoniche legacy preservate;
- [x] CI completa;
- [x] checkpoint mobile live 3/3.

### M5.2 — Homepage candidata

- [x] read model server-only condiviso;
- [x] soltanto righe `published`;
- [x] limiti e ordine deterministici;
- [x] raw HTML, noindex, no-store e sitemap exclusion;
- [x] `/` ancora legacy;
- [x] fixture populated/empty;
- [x] desktop, mobile, tastiera e 404;
- [x] PR #63 e CI finale #284;
- [x] checkpoint visuale live.

### M5.3 — Listing preview

- [x] Destinazioni, Guide e Confronti;
- [x] read model published-only;
- [x] internal linking deterministico;
- [x] route matrix e fail-fast;
- [x] PR #65 e CI finale #296;
- [x] checkpoint visuale live.

### M5.4 — Renderer editoriale Astro

- [x] `/astro-foundation/articoli/[slug]`;
- [x] read model condiviso;
- [x] blocchi strutturati e FAQ native;
- [x] provenance e fonti HTTPS;
- [x] dati operativi interni esclusi;
- [x] related links published-only;
- [x] vera 404 e fail-closed;
- [x] noindex, no-store e sitemap exclusion;
- [x] smoke D1/workerd/Chromium;
- [x] PR #67 e CI finale #307;
- [x] checkpoint visuale live.

### M5.5 — Parità SEO e routing

#### M5.5a — Contratto SEO condiviso

- [x] modello tipizzato condiviso;
- [x] title, description e Open Graph;
- [x] `WebSite`, `Article` e `FAQPage`;
- [x] serializer JSON-LD sicuro;
- [x] canonical, robots e cache route-specific;
- [x] drift e regressioni;
- [x] zero JavaScript eseguibile;
- [x] PR #69 e CI completa;
- [x] sorgente live homepage e articolo;
- [ ] header HTTP live da controllo esterno dedicato.

#### M5.5b.1 — Route policy foundation

- [x] matrice current/target tipizzata;
- [x] route kind e precedenza esplicite;
- [x] reserved paths e file-probe policy;
- [x] custom Worker usa `activePublicRouteDecision`;
- [x] export attivo fissato alla current matrix;
- [x] API e `/go/*` backend-owned;
- [x] preview e Control Room foundation Astro-owned;
- [x] boundary doppi slash preservato;
- [x] smoke dedicato;
- [x] PR #71, merge `bd51faddddbb54647c22c3361dd04c5bc65e7681`;
- [x] CI finale #329 completamente verde.

#### M5.5b.2 — Canonical Astro parity

Scope: `docs/PUBLIC-CANONICAL-ASTRO-PARITY-SCOPE.md`.

```text
feat/public-canonical-astro-parity
PR #73
merge b3a6625bfe6e3a06a46412e58f89a033dc82b9ff
CI finale #350
```

- [x] render mode `preview | canonical` tipizzato;
- [x] route Astro canoniche compilate;
- [x] componenti condivisi senza copy preview in modalità canonical;
- [x] internal link interamente canonici;
- [x] canonical, robots e cache route-specific;
- [x] articolo published-only e fail-closed;
- [x] reserved path e file probe esclusi dagli articoli;
- [x] 404 Astro reale e noindex;
- [x] Worker factory tipizzata per smoke locale;
- [x] default production ancora su `activePublicRouteDecision`;
- [x] nessun flag runtime o route di test;
- [x] smoke diretto del renderer Astro canonicale;
- [x] populated ed empty state;
- [x] desktop, mobile, tastiera e overflow;
- [x] runtime production-style ancora legacy-owned;
- [x] CI finale code + canonici #350 completamente verde.

Route compilate:

```text
/
/destinazioni
/guide
/confronti
/metodo
/trasparenza
/privacy
/{slug-published}
/404
```

Nessun cutover o deploy pubblico è stato dichiarato. Sitemap e robots restano backend-owned.

#### M5.5b.3 — SEO endpoint parity

Scope: `docs/PUBLIC-SEO-ENDPOINT-PARITY-SCOPE.md`.

Branch documentale:

```text
docs/public-seo-endpoint-parity-scope
```

Branch tecnica autorizzata dopo il merge dello scope:

```text
feat/public-seo-endpoint-parity
```

- [x] scope separato prima del codice;
- [x] current ownership e confini documentati;
- [x] contratto sitemap published-only, deterministico e fail-closed;
- [x] contratto robots condiviso documentato;
- [x] modalità di confronto legacy/Astro definita;
- [x] populated, empty e invalid state definiti;
- [ ] builder sitemap/robots condivisi;
- [ ] handler Astro compilati e testati;
- [ ] output legacy/Astro equivalente;
- [ ] preview, review, draft e route tecniche escluse;
- [ ] ownership live ancora legacy verificata dalla CI.

### M5.6 — Catalogo pilot

- [ ] piccolo set di pagine con intento distinto;
- [ ] evidence e publication eligibility;
- [ ] nessuna generazione massiva;
- [ ] indicizzazione e click prima della scala.

### M5.7 — Cutover apex

- [ ] PR separata e autorizzazione esplicita;
- [ ] modifica minima della matrice attiva;
- [ ] confronto route e metadata;
- [ ] schema, sitemap, robots e 404 validi;
- [ ] redirect provider preservati;
- [ ] rollback documentato;
- [ ] nessuna pagina review esposta;
- [ ] rimozione legacy solo dopo verifica.

## M6 — Misurazione e indicizzazione

**Stato: infrastruttura esterna preparata; integrazione non avviata.**

- [ ] CMP;
- [ ] Consent Mode;
- [ ] dizionario eventi;
- [ ] GTM;
- [ ] GA4;
- [ ] Search Console e sitemap;
- [ ] verifica dati reali;
- [ ] report query, landing, CTR e indicizzazione;
- [ ] registro esperimenti.

M6 parte dopo route pubbliche stabili. Nessun tracking sulle preview noindex.

## M7 — Intelligence SEO

- [ ] GSC operativa;
- [ ] rank tracking;
- [ ] competitor set;
- [ ] Trends;
- [ ] opportunity score v2;
- [ ] audit tecnico/editoriale/GEO.

## M8 — Monetizzazione controllata

- [ ] programmi affiliate ufficiali;
- [ ] disclosure;
- [ ] configurazione riservata dei link;
- [ ] affiliate mode esplicita;
- [ ] tracking privacy-first;
- [ ] revenue score dopo dati sufficienti.

## M9 — Crescita e manutenzione

- [ ] ciclo domanda settimanale;
- [ ] refresh fonti scadute;
- [ ] discovery cluster;
- [ ] aggiornamento pagine in perdita;
- [ ] espansione internazionale dopo stabilità italiana.

## Ordine operativo

### Track A — M4

```text
conversione brief
→ operazioni claim
→ decisione draft
→ eventuale retry queue
→ rimozione legacy privata
```

### Track B — M5

```text
merge scope sitemap/robots parity
→ implementazione endpoint parity senza attivazione
→ catalogo pilot
→ cutover apex separato
```

### Dopo M5 stabile

```text
CMP e Consent Mode
→ GTM / GA4
→ Search Console
→ misurazione
→ monetizzazione controllata
```

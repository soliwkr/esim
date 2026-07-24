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
- `docs/PUBLIC-SEO-ROUTING-OWNERSHIP-SCOPE.md` — route policy;
- `docs/PUBLIC-CANONICAL-ASTRO-PARITY-SCOPE.md` — renderer canonico Astro;
- `docs/PUBLIC-SEO-ENDPOINT-PARITY-SCOPE.md` — sitemap e robots.

## Principi non negoziabili

1. L’AI non pubblica direttamente.
2. Brief, claim, readiness, draft, materializzazione e pubblicazione sono gate distinti.
3. I fatti commerciali richiedono fonti identificabili e data di verifica.
4. Claim insufficienti o scaduti non alimentano testo fattuale.
5. Il browser non accede direttamente a D1.
6. Ogni mutation richiede identità verificata, conferma, state machine, audit e test.
7. Astro è il frontend principale; React resta una island per interattività complessa.
8. Una preview Astro non equivale a un cutover.
9. Una riga `review` non equivale a contenuto pubblico.
10. Owner target, codice compilato e owner live sono concetti distinti.
11. Il repository è la memoria canonica.

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

**Stato: M5.0–M5.5b.2 completate; M5.5b.3 implementata e verificata dalla CI applicativa #359, con PR #75 ancora da chiudere; nessun cutover.**

### M5.0 — Public shell

- [x] `/astro-foundation` noindex;
- [x] layout, metadata, header, menu e footer;
- [x] raw HTML senza JavaScript necessario;
- [x] mobile e tastiera;
- [x] `/` invariato;
- [x] fuori sitemap;
- [x] checkpoint live.

### M5.1 — Trust pages

- [x] Metodo, Trasparenza e Privacy preview;
- [x] componente condiviso;
- [x] route canoniche legacy preservate;
- [x] checkpoint mobile 3/3.

### M5.2 — Homepage candidata

- [x] read model server-only condiviso;
- [x] righe `published` soltanto;
- [x] limiti e ordine deterministici;
- [x] noindex/no-store e sitemap exclusion;
- [x] desktop, mobile, tastiera e empty state;
- [x] PR #63 e CI finale #284.

### M5.3 — Listing preview

- [x] Destinazioni, Guide e Confronti;
- [x] read model published-only;
- [x] internal linking deterministico;
- [x] route matrix e fail-fast;
- [x] PR #65 e CI finale #296.

### M5.4 — Renderer editoriale Astro

- [x] `/astro-foundation/articoli/[slug]`;
- [x] read model condiviso;
- [x] blocchi, FAQ, fonti e provenance;
- [x] related links published-only;
- [x] vera 404 e fail-closed;
- [x] noindex/no-store;
- [x] PR #67 e CI finale #307.

### M5.5 — Parità SEO e routing

#### M5.5a — Contratto SEO condiviso

- [x] title, description e Open Graph;
- [x] `WebSite`, `Article` e `FAQPage`;
- [x] serializer JSON-LD sicuro;
- [x] canonical, robots e cache route-specific;
- [x] drift e regressioni;
- [x] PR #69;
- [ ] header HTTP live da controllo esterno dedicato.

#### M5.5b.1 — Route policy foundation

- [x] current/target matrix tipizzate;
- [x] route kind e precedenza esplicite;
- [x] reserved path e file-probe policy;
- [x] `activePublicRouteDecision = currentPublicRouteDecision`;
- [x] PR #71, merge `bd51faddddbb54647c22c3361dd04c5bc65e7681`;
- [x] CI finale #329.

#### M5.5b.2 — Canonical Astro parity

- [x] render mode `preview | canonical`;
- [x] home, listing, trust, articolo e 404 canonici compilati;
- [x] internal link apex;
- [x] published-only e fail-closed;
- [x] factory `createPublicWorker(routeDecision)`;
- [x] smoke diretto senza switch live;
- [x] PR #73, merge `b3a6625bfe6e3a06a46412e58f89a033dc82b9ff`;
- [x] CI finale #350.

#### M5.5b.3 — SEO endpoint parity

Scope: `docs/PUBLIC-SEO-ENDPOINT-PARITY-SCOPE.md`.

Branch e PR:

```text
feat/public-seo-endpoint-parity
PR #75
```

- [x] builder server-only condivisi per sitemap e robots;
- [x] route statiche derivate da `PUBLIC_CANONICAL_STATIC_PATHS`;
- [x] query D1 `status='published'` soltanto;
- [x] validazione origin, slug, date, duplicati e limite URL;
- [x] XML deterministico con escaping dedicato;
- [x] `lastmod` normalizzato;
- [x] robots deterministico con newline finale;
- [x] legacy backend delegato al contratto condiviso;
- [x] handler Astro `/sitemap.xml` e `/robots.txt` compilati;
- [x] GET, HEAD, query string e trailing slash coerenti;
- [x] populated, empty e invalid state;
- [x] fallimento chiuso senza sitemap parziale;
- [x] confronto body e header legacy/Astro;
- [x] runtime production-style ancora backend-owned;
- [x] tutte le suite Control Room verdi nella CI applicativa #359;
- [ ] CI finale code + canonici;
- [ ] PR #75 pronta e merge.

Ownership live ancora invariata:

```text
/sitemap.xml → backend
/robots.txt  → backend
```

### M5.6 — Catalogo pilot

**Prossima fase dopo il merge di PR #75.**

- [ ] scope documentale separato;
- [ ] piccolo set di pagine con intento distinto;
- [ ] evidence e publication eligibility esplicite;
- [ ] nessuna generazione massiva;
- [ ] criteri di pubblicazione e rollback;
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
- [ ] Search Console e submission sitemap;
- [ ] verifica dati reali;
- [ ] report query, landing, CTR e indicizzazione.

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
chiusura PR #75 sitemap/robots parity
→ scope catalogo pilot
→ catalogo pilot ristretto
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

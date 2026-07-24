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
- `docs/PUBLIC-SEO-ROUTING-OWNERSHIP-SCOPE.md` — route policy;
- `docs/PUBLIC-CANONICAL-ASTRO-PARITY-SCOPE.md` — renderer canonico Astro;
- `docs/PUBLIC-SEO-ENDPOINT-PARITY-SCOPE.md` — sitemap e robots;
- `docs/PUBLIC-CATALOG-PILOT-SCOPE.md` — catalogo pilot M5.6.

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
11. Candidate, release candidate e pagina published sono stati distinti.
12. Il repository è la memoria canonica.

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

**Stato: M5.0–M5.5b.3 completate senza cutover; scope M5.6 in corso.**

### M5.0–M5.4 — Preview e renderer pubblico

- [x] shell `/astro-foundation` noindex/no-store;
- [x] trust pages;
- [x] homepage candidata;
- [x] listing Destinazioni, Guide e Confronti;
- [x] renderer articolo grounded;
- [x] published-only, 404 e fail-closed;
- [x] desktop, mobile e tastiera;
- [x] route canoniche live preservate.

### M5.5 — Parità SEO e routing

#### M5.5a — Contratto SEO condiviso

- [x] metadata e Open Graph;
- [x] `WebSite`, `Article` e `FAQPage`;
- [x] serializer JSON-LD sicuro;
- [x] PR #69;
- [ ] header HTTP live da controllo esterno dedicato.

#### M5.5b.1 — Route policy

- [x] current/target matrix tipizzate;
- [x] reserved path e file-probe policy;
- [x] `activePublicRouteDecision = currentPublicRouteDecision`;
- [x] PR #71, merge `bd51faddddbb54647c22c3361dd04c5bc65e7681`;
- [x] CI finale #329.

#### M5.5b.2 — Canonical Astro parity

- [x] home, listing, trust, articolo e 404 canonici compilati;
- [x] factory `createPublicWorker(routeDecision)`;
- [x] smoke diretto senza switch live;
- [x] PR #73, merge `b3a6625bfe6e3a06a46412e58f89a033dc82b9ff`;
- [x] CI finale #350.

#### M5.5b.3 — Sitemap e robots parity

- [x] builder server-only condivisi;
- [x] legacy e Astro delegano allo stesso contratto;
- [x] published-only, ordine, `lastmod`, escaping e fail-closed;
- [x] GET, HEAD, query string e trailing slash;
- [x] populated, empty e invalid state;
- [x] tutte le regressioni pubbliche e Control Room;
- [x] PR #75, merge `8d52e7e316d632dcda0d5bb45b818a490df9fef6`;
- [x] CI finale #365.

Ownership live invariata:

```text
route canoniche → backend
/sitemap.xml    → backend
/robots.txt     → backend
```

### M5.6 — Catalogo pilot

Scope: `docs/PUBLIC-CATALOG-PILOT-SCOPE.md`.

Branch documentale:

```text
docs/public-catalog-pilot-scope
```

#### M5.6a — Candidate audit foundation

- [ ] modello tipizzato read-only;
- [ ] query e report sui gate reali;
- [ ] massimo quattro entry;
- [ ] manifest versionato;
- [ ] latest bundle e latest approved draft;
- [ ] publication eligibility e approvazioni umane;
- [ ] provenance e freshness;
- [ ] collisioni di slug e intento;
- [ ] fixtures eligible/ineligible/empty;
- [ ] nessuna mutation o pubblicazione;
- [ ] active matrix invariata;
- [ ] CI completa.

Branch tecnica autorizzabile dopo il merge dello scope:

```text
feat/public-catalog-pilot-foundation
```

#### M5.6b — Preparazione release candidate reali

- [ ] audit dei dati remoti reali;
- [ ] selezione senza nomi anticipati;
- [ ] chiusura blocker una pagina alla volta;
- [ ] bundle `approved_for_publication`;
- [ ] draft grounded `approved`;
- [ ] pagina materializzata in `review`;
- [ ] manifest aggiornato con ID e versioni reali;
- [ ] massimo quattro release candidate.

#### M5.6c — Decisione di pubblicazione

**Non autorizzata dallo scope M5.6a.**

- [ ] scegliere esplicitamente se pubblicare prima, durante o dopo M5.7;
- [ ] branch mutation separata;
- [ ] transizione `review → published` server-side e auditata;
- [ ] conferma umana;
- [ ] rollback/deindicizzazione;
- [ ] test end-to-end e verifica live.

La pagina Cina non entra automaticamente nel pilot: il suo stato canonico noto resta `publication_eligible=false` e `review`.

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
scope M5.6
→ candidate audit foundation
→ release candidate reali in review
→ decisione esplicita publication/cutover
→ M5.7 apex cutover
```

### Dopo M5 stabile

```text
CMP e Consent Mode
→ GTM / GA4
→ Search Console
→ misurazione
→ monetizzazione controllata
```

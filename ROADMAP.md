# Senza Roaming — Roadmap

Ultimo aggiornamento: **24 luglio 2026**.

Questa è la roadmap canonica di `soliwkr/esim`.

## Principi non negoziabili

1. L’AI non pubblica direttamente.
2. Brief, claim, readiness, draft, materializzazione e pubblicazione sono gate distinti.
3. I fatti commerciali richiedono fonti identificabili e data di verifica.
4. Claim insufficienti, contraddetti o scaduti non alimentano testo fattuale.
5. Il browser non accede direttamente a D1.
6. Ogni mutation richiede identità verificata, conferma, state machine, audit e test.
7. Astro è il frontend pubblico principale; React resta confinato alla Control Room.
8. Preview, renderer compilato, owner versionato e owner verificato live sono stati distinti.
9. Candidate, release candidate e pagina `published` sono stati distinti.
10. Il repository è la memoria canonica.

## M0 — Fondazioni tecniche

**Stato: completato, salvo ricontrollo definitivo `www → apex`.**

- [x] custom Cloudflare Worker;
- [x] D1 e migrazioni versionate;
- [x] dominio principale;
- [x] deploy automatico;
- [x] Workflow, Container e AI Gateway;
- [x] API manutenzione protette;
- [x] vere 404 e noindex;
- [ ] ricontrollare redirect `www`.

## M1 — Qualità e osservabilità

**Stato: quality gate operativo; osservabilità avanzata aperta.**

- [x] documentazione canonica;
- [x] audit e storico run;
- [x] freshness;
- [x] relevance zero deterministica;
- [x] golden evaluation;
- [x] topic-mismatch gate;
- [ ] verifica live topic-mismatch sul prossimo run autorizzato;
- [ ] health aggregato e log errori unificati.

## M2 — Motore AI editoriale

**Stato: nucleo v1 operativo.**

- [x] recent demand e segnali;
- [x] brief strutturati;
- [x] claim atomici, fonti e verifiche;
- [x] AI Gateway e Vertex AI;
- [x] nessuna pubblicazione automatica;
- [ ] deduplicazione semantica storica;
- [ ] Trust Score evoluto.

## M3 — Readiness e draft grounded

**Stato: completato e verificato.**

- [x] Page Readiness;
- [x] evidence bundle versionato;
- [x] publication eligibility separata dalla review eligibility;
- [x] draft grounded con provenance field-level;
- [x] materializzazione soltanto in `review`;
- [x] primo draft approvato senza pubblicazione.

## M4 — Control Room definitiva

**Stato: letture complete; prima mutation live; mutation residue aperte.**

- [x] Astro shell, React island e shadcn/ui;
- [x] Cloudflare Access e sessione mediata dal Worker;
- [x] browser senza maintenance token;
- [x] parità read-only con la legacy;
- [x] decisione brief `proposed → accepted | dismissed`;
- [x] audit catalog pilot privato e read-only;
- [ ] conversione brief;
- [ ] operazioni claim;
- [ ] decisione draft;
- [ ] eventuale retry queue;
- [ ] rimozione legacy privata dopo parità mutabile.

M4 non blocca il frontend pubblico, ma la legacy privata resta finché serve come fallback operativo.

## M5 — Frontend pubblico Astro e catalogo

**Stato: completato e verificato live.**

### M5.0–M5.4 — Preview e renderer pubblico

- [x] shell pubblica Astro;
- [x] homepage, listing e trust pages;
- [x] renderer articolo grounded;
- [x] preview `/astro-foundation*` noindex/no-store;
- [x] desktop, mobile, tastiera e assenza overflow.

### M5.5 — SEO e routing parity

```text
PR #69  SEO contract
PR #71  route policy — CI #329
PR #73  canonical Astro parity — CI #350
PR #75  sitemap/robots parity — CI #365
```

- [x] metadata, Open Graph e JSON-LD condivisi;
- [x] current e target route matrix versionate;
- [x] sitemap e robots condivisi e fail-closed;
- [x] vere 404;
- [x] API e redirect provider preservati.

### M5.6 — Catalog pilot e audit remoto

```text
PR #77  catalog pilot foundation — merge fa9ed9486e400e77ad915153284c7b277a51b4d0 — CI #379
PR #78  remote audit scope — merge bc0050b891b93678631fa80d3d46ac36a1fbb2fd — CI #381
PR #79  private audit route — merge df890103310cf1591eb2d8137a8385135c665d71 — CI #386
```

Risultato live:

```text
candidateCount: 1
eligibleCount: 0
selectedCount: 0
excludedCount: 1
```

- [x] loader D1 read-only;
- [x] gate deterministici e approvazioni umane;
- [x] claim, fonti, provenance e freshness;
- [x] cap massimo quattro;
- [x] manifest versionato;
- [x] audit remoto protetto da Cloudflare Access;
- [x] manifest confermato vuoto;
- [x] `esim-cina-senza-vpn` resta `review` e non pubblicabile.

### M5.7 — Apex design cutover

```text
PR #81 — Cut over canonical public routes to Astro
merge e62b570248bf97afaa3f283cfbb847ceea01f529
CI finale #404 completamente verde
```

Verifica live conclusa:

- [x] nuovo design Astro sull’apice;
- [x] homepage canonica;
- [x] articolo `/migliore-esim`;
- [x] sitemap XML;
- [x] robots;
- [x] redirect provider `/go/airalo`;
- [x] API, Control Room ed execution plane ancora backend-owned;
- [x] pagine `review` e `draft` non esposte;
- [x] preview namespaced preservata;
- [x] nessuna publication capability introdotta;
- [x] nessuna rimozione legacy nello stesso cutover.

Documento di verifica:

```text
docs/PUBLIC-APEX-CUTOVER-RESULT-2026-07-24.md
```

## M6 — Misurazione e indicizzazione

**Stato: prossima milestone; proprietà esterne preparate, integrazione applicativa assente.**

Ordine obbligatorio:

```text
scope e inventario privacy
→ CMP
→ Consent Mode
→ dizionario eventi
→ GTM
→ GA4
→ Search Console
→ sitemap submission
→ verifica dati reali
```

- [ ] definire scope M6 e data-flow;
- [ ] scegliere/configurare CMP compatibile;
- [ ] implementare Consent Mode;
- [ ] versionare il dizionario eventi;
- [ ] collegare GTM e GA4 senza duplicazioni;
- [ ] verificare Search Console;
- [ ] inviare sitemap soltanto dopo controllo finale;
- [ ] verificare dati reali e assenza di tracking pre-consenso.

## M7 — Intelligence SEO

- [ ] query e pagine GSC;
- [ ] rank tracking e competitor;
- [ ] Trends e opportunity score v2;
- [ ] audit tecnico, editoriale e GEO.

## M8 — Monetizzazione controllata

- [ ] programmi affiliate ufficiali;
- [ ] disclosure e configurazione riservata;
- [ ] tracking privacy-first;
- [ ] revenue score dopo dati sufficienti.

## M9 — Crescita e manutenzione

- [ ] ciclo domanda settimanale;
- [ ] refresh fonti scadute;
- [ ] discovery cluster;
- [ ] aggiornamento pagine in perdita;
- [ ] espansione internazionale dopo stabilità italiana.

## Ordine operativo corrente

### Track A — Control Room M4

```text
conversione brief
→ operazioni claim
→ decisione draft
→ eventuale retry queue
→ rimozione legacy privata
```

### Track B — Prodotto pubblico

```text
M5.7 live closeout
→ M6 measurement foundation
→ dati reali
→ M7 intelligence SEO
→ M8 monetizzazione controllata
```

Publication capability resta una branch separata e non è autorizzata da M5.7 o M6.

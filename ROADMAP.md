# Senza Roaming — Roadmap

Ultimo aggiornamento: **26 luglio 2026**.

Questa è la roadmap canonica di `soliwkr/esim`.

## Documenti operativi

- `ROADMAP.md` — milestone e criteri di uscita;
- `docs/STATUS.md` — stato verificato;
- `docs/NEXT.md` — lavoro immediato;
- `docs/ARCHITECTURE.md` — confini tecnici;
- `docs/DECISIONS.md` — decisioni accettate;
- `docs/FRONTEND-PLAN.md` — piano frontend;
- `docs/MEASUREMENT-CONSENT-SCOPE.md` — scope M6;
- `docs/CMP-SPIKE.md` — confronto CMP;
- `docs/MEASUREMENT-EVENT-DICTIONARY.md` — eventi e parametri canonici.

## Principi non negoziabili

1. L’AI non pubblica direttamente.
2. Brief, claim, readiness, draft, materializzazione e pubblicazione sono gate distinti.
3. I fatti commerciali richiedono fonti identificabili e data di verifica.
4. Claim insufficienti, contraddetti o scaduti non alimentano testo fattuale.
5. Il browser non accede direttamente a D1.
6. Ogni mutation richiede identità verificata, conferma, state machine, audit e test.
7. Astro è il frontend pubblico principale; React resta confinato alla Control Room.
8. Preview, owner versionato e owner verificato live sono stati distinti.
9. Candidate, release candidate e pagina `published` sono stati distinti.
10. Eventi e KPI vengono definiti prima dell’attivazione analytics.
11. Nessun tracking non essenziale parte prima del consenso.
12. Il repository è la memoria canonica.

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

M4 non blocca il prodotto pubblico, ma la legacy privata resta finché serve come fallback operativo.

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
PR #77  catalog pilot foundation — CI #379
PR #78  remote audit scope — CI #381
PR #79  private audit route — CI #386
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
- [x] manifest versionato e vuoto;
- [x] audit remoto protetto da Cloudflare Access;
- [x] `esim-cina-senza-vpn` resta `review` e non pubblicabile.

### M5.7 — Apex design cutover

```text
PR #81 — Cut over canonical public routes to Astro
merge e62b570248bf97afaa3f283cfbb847ceea01f529
CI finale #404
PR #82 — closeout live
merge 6735a05515c2155eb990a9315d6168d111b9261c
CI #406
```

- [x] nuovo design Astro sull’apice;
- [x] homepage e articolo canonico verificati;
- [x] sitemap, robots e redirect provider verificati;
- [x] API, Control Room ed execution plane backend-owned;
- [x] pagine `review` e `draft` non esposte;
- [x] preview namespaced preservata;
- [x] nessuna publication capability o rimozione legacy nel cutover.

## M6 — Misurazione e indicizzazione

**Stato: CMP-only implementata sulla PR #85; deploy e verifica vendor live ancora aperti.**

Contratti versionati:

```text
docs/MEASUREMENT-CONSENT-SCOPE.md
docs/CMP-SPIKE.md
docs/MEASUREMENT-EVENT-DICTIONARY.md
docs/IUBENDA-CONSENT-SPIKE-RESULT.md
```

### Discovery e scope

- [x] `GTM_ID` esiste come variabile vuota;
- [x] nessun renderer usa GTM;
- [x] nessuno snippet GTM, GA4 o `gtag` è attivo;
- [x] privacy page descrive il comportamento effettivo;
- [x] redirect provider registra già i click effettivi server-side in D1;
- [x] preview e Control Room sono escluse dalla futura misurazione;
- [x] Basic Consent Mode scelto;
- [x] Advanced/cookieless pings esclusi;
- [x] analytics-only, senza Ads o affiliate;
- [x] dati vietati e URL sanitizzati definiti;
- [x] event dictionary v1 definito;
- [x] PR documentale #83 mergiata — CI #408.

### CMP foundation

```text
PR #84 — spike tecnico legacy
merge 6e3b0047af67219af7429749003d86f36af61237
CI finale #415

PR #85 — remote embed reale e activation foundation
CI applicativa #421 verde
```

- [x] boundary CMP server-only fail-closed;
- [x] route incluse ed escluse verificate;
- [x] formato reale dell’account identificato come embed remoto UUID;
- [x] contratto `CMP_PROVIDER` + `CMP_EMBED_ID` implementato;
- [x] un solo script remoto sulle pagine canonical indexable;
- [x] regressioni storiche mantenute CMP-off;
- [x] preparazione deterministica del config compilato di produzione;
- [x] deploy guard che richiede `GTM_ID` vuoto;
- [x] CI applicativa completa della PR #85;
- [ ] CI finale code + documentazione;
- [ ] merge PR #85;
- [ ] deploy CMP-only;
- [ ] verifica live banner, persistenza, revoca, rete e performance;
- [ ] decisione vendor finale.

### Eventi iniziali

```text
page_view
provider_redirect_intent
consent_update (locale/debug, non GA4)
```

`article_view` e `listing_view` non sono eventi separati: vengono descritti da parametri bounded del `page_view`.

### Lavoro successivo

- [ ] GTM e GA4 foundation post-consenso;
- [ ] verifica dati reali con Tag Assistant, Network e DebugView;
- [ ] Search Console;
- [ ] sitemap submission.

### Ordine obbligatorio

```text
scope e inventario
→ spike CMP
→ formato reale account
→ consent foundation CMP-only
→ verifica live CMP
→ GTM
→ GA4
→ verifica dati
→ Search Console
→ sitemap submission
```

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

### Track B — Measurement M6

```text
CI finale e merge PR #85
→ deploy CMP-only
→ checkpoint live iubenda
→ GTM/GA4 foundation
→ verifica dati
→ Search Console
```

Publication capability resta una branch separata e non è autorizzata da M6.

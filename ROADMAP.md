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
- `docs/MEASUREMENT-EVENT-DICTIONARY.md` — eventi e parametri canonici;
- `docs/GTM-GA4-FOUNDATION.md` — contratto tecnico della foundation analytics.

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

**Stato: CMP live; accessi Google e sitemap verificati; foundation GTM/GA4 in PR draft #91, non deployata.**

Contratti versionati:

```text
docs/MEASUREMENT-CONSENT-SCOPE.md
docs/CMP-SPIKE.md
docs/MEASUREMENT-EVENT-DICTIONARY.md
docs/IUBENDA-CONSENT-SPIKE-RESULT.md
docs/PUBLIC-CONSENT-DEPLOY-RESULT-2026-07-26.md
docs/GOOGLE-MEASUREMENT-ACCESS-RESULT-2026-07-26.md
docs/GTM-GA4-FOUNDATION.md
```

### Discovery e scope

- [x] Consent Mode Basic scelto;
- [x] Advanced Mode e cookieless pings esclusi;
- [x] analytics-only, senza Ads o affiliate;
- [x] dati vietati, URL sanitizzati ed eventi bounded definiti;
- [x] redirect provider server-side D1 preservato;
- [x] preview e Control Room escluse;
- [x] PR documentale #83 mergiata — CI #408.

### CMP foundation

```text
PR #84 — spike tecnico legacy
merge 6e3b0047af67219af7429749003d86f36af61237
CI finale #415

PR #85 — remote embed reale e activation foundation
merge f421d247e5a2ce250ba432e445f2aedf74af6f50
CI finale #426

PR #90 — deploy osservabile e contratto D1 production
merge c29bf0cf31a66bf830cb74a7cf46d57a7f060c76
CI #448
```

- [x] boundary CMP server-only fail-closed;
- [x] formato account reale come embed remoto UUID;
- [x] un solo script iubenda sulle route canoniche indexable;
- [x] preview, private e route tecniche escluse;
- [x] deploy CMP-only riuscito;
- [x] verifica HTTP live riuscita;
- [x] banner reale confermato nel browser dall’utente;
- [ ] persistenza, revoca, rete vendor e performance da certificare integralmente;
- [ ] decisione vendor finale.

### Infrastruttura Google verificata

```text
GA4 property: 546858987
GA4 stream: 15310040016
Measurement ID: G-GWJ9YPPVJW
GTM container: GTM-W3LSK9RZ
Search Console: sc-domain:senzaroaming.it
```

- [x] service account accessibile tramite impersonazione e ADC, senza key JSON;
- [x] Analytics Admin API read-only;
- [x] Tag Manager API read-only;
- [x] Search Console API read-only;
- [x] sitemap canonica inviata il 26 luglio 2026;
- [x] nessuna Indexing API usata;
- [ ] primi dati di scansione e indicizzazione da attendere senza submission ripetute.

### GTM e GA4 foundation

Branch e PR:

```text
feat/public-gtm-ga4-foundation
PR #91 — draft
```

- [x] contratto fail-closed `GTM_ID` + `GA4_MEASUREMENT_ID`;
- [x] bootstrap GTM inerte `type=text/plain` prima del consenso;
- [x] classificazione iubenda `purpose 4` — Misurazione;
- [x] nessun fallback `noscript` pre-consenso;
- [x] contesto pagina bounded;
- [x] `page_location = origin + pathname`;
- [x] guard anti-duplicazione;
- [x] route escluse preservate;
- [x] preparazione deterministica del config compilato;
- [x] smoke pure, workerd e Chromium aggiunti;
- [ ] CI PR #91;
- [ ] workspace GTM configurato ma non pubblicato;
- [ ] Tag Assistant, Network e DebugView;
- [ ] rifiuto, consenso, reload e revoca;
- [ ] un solo `page_view` reale;
- [ ] controllo performance;
- [ ] deploy pubblico separatamente autorizzato.

### Eventi iniziali

```text
page_view
provider_redirect_intent
consent_update (locale/debug, non GA4)
```

`provider_redirect_intent` resta differito finché il checkpoint base `page_view` non è verificato. `article_view` e `listing_view` non sono eventi separati.

### Indicizzazione e contenuti

La sitemap è inviata, ma homepage e listing non vengono forzati manualmente in indicizzazione prima della keyword map e del riallineamento SEO dei testi. Le richieste manuali restano riservate alle sole URL prioritarie quando saranno realmente pronte.

### Ordine operativo corrente

```text
CI e review PR #91
→ workspace GTM non pubblicato
→ Tag Assistant / Network / DebugView
→ checkpoint consenso e revoca
→ container publish + deploy esplicitamente autorizzati
→ verifica dati reali
→ keyword map e copy SEO
→ richieste manuali soltanto per URL forti
```

## M7 — Intelligence SEO

- [ ] query e pagine GSC;
- [ ] keyword map per homepage e listing;
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
PR #91 foundation
→ workspace GTM e debug
→ publish/deploy autorizzati
→ verifica dati
→ SEO content readiness
```

Publication capability resta una branch separata e non è autorizzata da M6.

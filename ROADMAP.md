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
- `docs/PUBLIC-SEO-CONTRACT-FOUNDATION-SCOPE.md` — prima slice M5.5.

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
10. Il repository è la memoria canonica.

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

**Stato: M5.0–M5.4 verificate in produzione; M5.5a implementata e verde in CI, ma non ancora mergiata o verificata live. Nessuna route canonica è migrata.**

### M5.0 — Public shell

- [x] `/astro-foundation` noindex;
- [x] layout, metadata, header, menu e footer;
- [x] raw HTML senza JavaScript necessario;
- [x] mobile e tastiera;
- [x] `/` invariato;
- [x] fuori sitemap;
- [x] checkpoint mobile live.

### M5.1 — Trust pages

- [x] Metodo preview;
- [x] Trasparenza preview;
- [x] Privacy preview;
- [x] componente condiviso;
- [x] route canoniche legacy preservate;
- [x] CI completa;
- [x] checkpoint mobile live 3/3.

### M5.2 — Homepage candidata

Branch: `feat/public-homepage-candidate`.

- [x] read model server-only condiviso;
- [x] soltanto righe `published`;
- [x] guide featured, limite 9;
- [x] destinazioni, limite 6;
- [x] ordine deterministico;
- [x] raw HTML, noindex, no-store e sitemap exclusion;
- [x] `/` ancora legacy;
- [x] fixture published/review/draft ed empty state;
- [x] desktop, mobile, tastiera e 404;
- [x] PR #63 mergiata nel commit `7ba767d`;
- [x] CI finale #284 verde;
- [x] checkpoint visuale live desktop/mobile.

### M5.3 — Listing preview

Branch: `feat/public-listing-previews`.

- [x] Destinazioni, Guide e Confronti preview;
- [x] stesso read model published-only;
- [x] internal linking deterministico;
- [x] route matrix e fail-fast;
- [x] PR #65 mergiata nel commit `2483fbfd1327754a1a526e8c3e6b201a412e610d`;
- [x] CI #291 applicativa e CI #296 finale verdi;
- [x] deploy e risposte delle tre route;
- [x] checkpoint visuale live mobile/narrow 3/3 e desktop largo.

### M5.4 — Renderer editoriale Astro

Branch: `feat/public-article-renderer`.

- [x] route published-only `/astro-foundation/articoli/[slug]`;
- [x] read model server-only condiviso con il renderer legacy;
- [x] pagina grounded in raw HTML Astro;
- [x] blocchi strutturati, non HTML AI grezzo;
- [x] FAQ native `details`/`summary`;
- [x] provenance pubblica page-level e fonti HTTPS;
- [x] nessun claim escluso o dato operativo interno esposto;
- [x] related links published-only e deterministici;
- [x] vera 404 per slug assente, `review` o `draft`;
- [x] fail-closed per righe pubblicate strutturalmente invalide;
- [x] noindex, no-store e sitemap exclusion;
- [x] preview home/listing collegate agli articoli namespaced;
- [x] route canoniche ancora legacy;
- [x] smoke D1/workerd/Chromium dedicato;
- [x] CI applicativa #302 verde;
- [x] CI finale #307 verde;
- [x] PR #67 mergiata nel commit `4810c0c32d54dca6f85de19d507a6da13f3dc574`;
- [x] deploy e checkpoint visuale live desktop/mobile su un articolo `published`.

Il checkpoint live mostra hero, risposta diretta, disclosure, blocchi, FAQ, provenance, fonti e footer. Nessun overflow orizzontale è visibile. La sezione related è omessa quando il query set è vuoto.

### M5.5 — Parità SEO

#### M5.5a — Fondazione del contratto SEO

Branch:

```text
feat/public-seo-contract-foundation
```

PR draft: `#69`.

Scope canonico: `docs/PUBLIC-SEO-CONTRACT-FOUNDATION-SCOPE.md`.

- [x] modello SEO tipizzato condiviso tra legacy e Astro;
- [x] title, description e Open Graph derivati dallo stesso contratto;
- [x] `WebSite`, `Article` e `FAQPage` JSON-LD da dati pubblici validati;
- [x] serializzazione JSON-LD sicura contro terminazione dello script;
- [x] preview ancora noindex, no-store e self-canonical;
- [x] route canoniche ancora legacy e indicizzabili;
- [x] drift smoke tra valori SEO normalizzati;
- [x] regressioni sitemap, robots, redirect provider e 404;
- [x] zero JavaScript eseguibile aggiunto al sito pubblico;
- [x] fixture di sicurezza con `</script>`, `<example>`, virgolette e caratteri accentati;
- [x] CI applicativa #312 completamente verde;
- [ ] CI finale sul head documentale;
- [ ] merge e deploy automatico;
- [ ] checkpoint live di metadata e JSON-LD su homepage e articolo preview.

CI #311 ha rilevato un’asserzione troppo ampia dello smoke sugli attributi HTML quotati. La verifica è stata corretta sul DOM reale senza ridurre il guardrail: nessun elemento arbitrario, nessuno script eseguibile e JSON-LD non interrompibile.

Questa slice non migra `/sitemap.xml`, `/robots.txt`, `/go/{provider}`, l’apice, i listing o `/{slug}`.

#### M5.5b — Routing e ownership SEO

Da scoprire e autorizzare soltanto dopo il checkpoint live di M5.5a:

- [ ] ownership futura di canonical, sitemap e robots;
- [ ] route matrix di cutover;
- [ ] schema e redirect provider sotto routing finale;
- [ ] drift/regression test di cutover;
- [ ] rollback.

### M5.6 — Catalogo pilot

- [ ] piccolo set di pagine con intento distinto;
- [ ] evidence e publication eligibility;
- [ ] nessuna generazione massiva;
- [ ] indicizzazione e click prima della scala.

### M5.7 — Cutover apex

- [ ] PR separata e autorizzazione esplicita;
- [ ] confronto route e metadata;
- [ ] schema, sitemap e 404 validi;
- [ ] redirect provider preservati;
- [ ] rollback documentato;
- [ ] nessuna pagina review esposta;
- [ ] rimozione legacy solo dopo verifica.

## M6 — Misurazione e indicizzazione

**Stato: infrastruttura esterna preparata; integrazione non avviata.**

GTM, GA4, Search Console e service account sono stati preparati dall’operatore. Nessuna credenziale è configurata nel repository.

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
CI finale e merge della fondazione SEO
→ checkpoint live metadata/JSON-LD
→ scope routing/ownership SEO
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

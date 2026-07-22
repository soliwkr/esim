# Senza Roaming — Roadmap

Questa è la roadmap canonica del progetto `soliwkr/esim`. Descrive l'ordine con cui Senza Roaming passa da infrastruttura funzionante a proprietà editoriale, SEO e affiliate governabile.

Ultimo aggiornamento: **22 luglio 2026**.

## Come leggere i documenti

- [`ROADMAP.md`](ROADMAP.md) — ordine dei blocchi e criteri di uscita;
- [`docs/FRONTEND-PLAN.md`](docs/FRONTEND-PLAN.md) — migrazione frontend e Control Room;
- [`docs/CAPABILITY-MAP.md`](docs/CAPABILITY-MAP.md) — layer del sistema;
- [`docs/SKILL-REGISTRY.md`](docs/SKILL-REGISTRY.md) — skill, repository e servizi adottati;
- [`docs/RESEARCH-QUALITY-EVALUATION.md`](docs/RESEARCH-QUALITY-EVALUATION.md) — golden dataset, metriche e soglie di adozione dei framework;
- [`docs/STATUS.md`](docs/STATUS.md) — stato operativo reale;
- [`docs/NEXT.md`](docs/NEXT.md) — lavoro immediatamente eseguibile.

## Principi non negoziabili

1. L'AI non pubblica direttamente.
2. Community e trend generano opportunità editoriali, non claim commerciali.
3. Prezzi, copertura, rete, hotspot, fair use, durata, attivazione, routing e accesso richiedono fonti identificabili e data di verifica.
4. Un requisito generale non è un claim verificato.
5. Ogni automazione deve essere osservabile, idempotente e protetta.
6. Il repository è la memoria canonica.
7. Senza Roaming resta un execution project autonomo.
8. Una capacità viene adottata soltanto se migliora una decisione e ha un criterio di successo.
9. Non si riscrivono componenti generici già risolti da librerie mature.
10. Il sito pubblico resta content-first.

## M0 — Fondazioni tecniche

**Stato: completato, salvo verifica canonica `www`**

- [x] Worker pubblico su Cloudflare.
- [x] D1 con migrazioni versionate.
- [x] Deploy automatico da GitHub Actions.
- [x] Dominio principale collegato.
- [x] Container `last30days` operativo.
- [x] Cloudflare Workflow per il radar.
- [x] Endpoint protetti di manutenzione.
- [x] Vere 404 e noindex.
- [x] Redirect `www → apex` implementato.
- [x] Primo run end-to-end e ingest in D1.
- [ ] Verificare definitivamente il `308` in produzione.

## M1 — Memoria, qualità e osservabilità

**Stato: quality gate operativo; evaluation e osservabilità in completamento**

- [x] Roadmap, status, architettura, decisioni e next.
- [x] Storico e stato dei run.
- [x] Quality gate freshness `eligible` / `filtered`.
- [x] Score zero come failure deterministica.
- [x] Backfill reale e flag `zero_relevance` verificati in produzione.
- [x] Audit specifico di run, brief, claim e verifiche.
- [x] Snapshot aggregato per dashboard.
- [ ] Golden evaluation versionata — **PR #45 in verifica**.
- [ ] Topic-mismatch gate con zero falsi positivi sul golden set.
- [ ] Health aggregato runtime completo.
- [ ] Log errori recenti in una singola interfaccia.
- [ ] Audit log unificato oltre la vista aggregata corrente.

### Quality checkpoint score zero

La PR #36 è mergiata, distribuita e verificata:

```text
relevance = 0              → filtered + zero_relevance
0 < relevance < 0,35       → eligible + warning
relevance = null           → nessun filtro automatico
manual override            → preservato e auditabile
```

Il record falso positivo osservato risulta filtrato. Nessun brief o claim è stato modificato automaticamente.

### Quality evaluation spike

La PR #45 aggiunge un golden dataset e misura il trigger D1 reale con confusion matrix.

Baseline caratterizzata:

```text
true positive:  3
false positive: 1
true negative:  4
false negative: 0
precision:       0.75
recall:          1.00
```

Il falso positivo residuo ha score positivo ma nessuna pertinenza semantica con la query.

Decisione proposta:

- usare subito golden dataset + evaluator D1 in CI;
- usare Promptfoo quando esisterà un vero prompt, modello o grader semantico;
- usare Evidently per report e drift quando il corpus sarà significativo;
- usare Cleanlab quando esisteranno probabilità di modello e volume sufficiente;
- non aggiungere framework come wrapper decorativi attorno a regole deterministiche.

## M2 — Motore AI editoriale controllato

**Stato: nucleo v1 completato in produzione**

- [x] AI Gateway e Vertex AI BYOK.
- [x] Input limitato ai segnali idonei.
- [x] Output strutturato e validato.
- [x] Opportunity, Evidence e Priority Score.
- [x] Brief persistiti e provenienza nel backend.
- [x] Accettazione umana e conversione in requisiti e task.
- [x] Decomposizione in claim atomici.
- [x] Matching soggetto claim/fonte.
- [x] Esiti verificati, contraddetti, insufficienti e dismiss.
- [x] Primo evidence set: 5 verified, 1 insufficient.
- [x] Nessuna pubblicazione automatica.
- [ ] Deduplicazione semantica storica.
- [ ] Trust Score con prove ufficiali, first-party e indipendenti.

## M3 — Page Readiness e draft grounded

**Stato: completato e verificato in produzione**

- [x] Aggregazione claim verificati, insufficienti, conflitti e scadenze.
- [x] Separazione dichiarazioni provider e test first-party.
- [x] `readyForReviewDraft` separato da `readyForPublication`.
- [x] Evidence bundle versionato.
- [x] Provenienza claim per campi, sezioni e FAQ.
- [x] Blocco dei claim insufficienti come fatti.
- [x] Conflitti documentali preservati per scope.
- [x] Materializzazione soltanto in `review`.
- [x] Primo draft Cina v2 grounded.
- [x] Approvazione editoriale senza pubblicazione.

## M4 — Frontend foundation e Control Room definitiva

**Stato: parità read-only quasi completa**

### M4.0 — Freeze legacy

- [x] Control Room HTML manuale riconosciuta come transitoria.
- [x] Legacy limitata a fallback e bugfix critici.
- [x] Nessuna nuova funzione importante costruita con HTML e DOM manuale.

### M4.1 — Astro e Cloudflare

- [x] `apps/web` con Astro e React integration.
- [x] Custom Worker entrypoint.
- [x] API, D1, Workflow e Container nello stesso execution plane.
- [x] Build e smoke runtime dentro `workerd`.
- [x] Deploy automatico e live smoke.
- [x] Un solo Worker.

### M4.2 — UI foundation

- [x] shadcn/ui installato e versionato.
- [x] Shell dashboard responsive in una React island.
- [x] Hydration, loading, error, empty, tastiera e mobile verificati.
- [ ] Confronto Mantine soltanto se emerge un vantaggio misurabile.

### M4.3 — Perimetro privato e sessione

- [x] Cloudflare Access.
- [x] Validazione dell'identità nell'origine.
- [x] Sessione mediata dal Worker.
- [x] Secondo login applicativo rimosso.
- [x] Snapshot automatico senza credenziali nel browser.
- [x] API originale invariata per agenti e consumer legacy.

### M4.4 — Migrazione funzionale Control Room

- [x] Overview e health — PR #32 verificata.
- [x] Radar e brief — PR #34 verificata.
- [x] Claim, fonti e scadenze — PR #37 verificata.
- [x] Page Readiness ed evidence bundle — PR #39 + hotfix #40 verificate.
- [x] Draft, preview e decisioni — PR #42 verificata.
- [x] Queue e audit — PR #44, CI #174 e browser reale verificati.
- [ ] Dettaglio draft completo on demand e read-only.
- [ ] Audit di parità con la Control Room legacy.
- [ ] Azioni operative autorizzate, una per branch.
- [ ] Rimozione legacy dopo parità funzionale.

Separazioni verificate:

```text
approved draft ≠ published page
review draft ≠ publication eligibility
editorial approval ≠ publication action
queue status ≠ decisione editoriale
failed task ≠ contenuto non valido
completed task ≠ pagina pubblicata
audit event ≠ autorizzazione operativa
```

Gap read-only ancora da chiudere:

- corpo completo, FAQ e fonti del draft;
- provenance field-level;
- stato reale della pagina materializzata;
- audit collegato univocamente alla versione del draft.

**Criterio di uscita M4:** la nuova Control Room conserva tutte le letture e i guardrail necessari; la legacy può essere rimossa senza perdita funzionale. Le mutation vengono introdotte soltanto dopo questo audit.

## M5 — Frontend pubblico Astro e primo catalogo

**Stato: dopo M4**

- [ ] Migrare layout, home e navigazione.
- [ ] Migrare pagine statiche.
- [ ] Migrare listing destinazioni, guide e confronti.
- [ ] Migrare pagina articolo e preview.
- [ ] Conservare canonical, sitemap, schema e vere 404.
- [ ] Migliorare mobile, gerarchia e internal linking.
- [ ] Pubblicare soltanto contenuti supportati da evidence set.
- [ ] Eliminare renderer HTML, CSS e JavaScript manuali.

## M6 — Misurazione e indicizzazione

**Stato: pianificato**

- [ ] Google Search Console e sitemap.
- [ ] CMP e consenso.
- [ ] GA4 e GTM.
- [ ] Eventi canonici e definizioni uniche delle metriche.
- [ ] Report query, landing, CTR e indicizzazione.
- [ ] Registro esperimenti e CRO su dati osservabili.

## M7 — Intelligence SEO e trend condivisa

**Stato: direzione presa, implementazione separata**

- [ ] OpenSEO come servizio dello studio.
- [ ] Search Console collegata.
- [ ] Rank tracking, competitor set e audit.
- [ ] Trends MCP per momentum e stagionalità.
- [ ] Opportunity Score v2.

## M8 — Monetizzazione controllata

**Stato: non avviato**

- [ ] Programmi affiliate ufficiali.
- [ ] Disclosure visibile.
- [ ] Link come configurazione riservata.
- [ ] Attivazione esplicita della modalità affiliate.
- [ ] Tracking privacy-first e attribuzione.
- [ ] Revenue Score dopo dati sufficienti.

## M9 — Crescita e manutenzione continua

**Stato: futuro**

- [ ] Ciclo settimanale della domanda recente.
- [ ] Refresh automatico delle fonti scadute.
- [ ] Discovery mensile di cluster.
- [ ] Aggiornamento delle pagine in perdita.
- [ ] Audit tecnico, editoriale e GEO.
- [ ] Espansione internazionale dopo stabilità italiana.

## Ordine operativo attuale

1. chiudere la PR #45 sul golden quality evaluation;
2. ridurre il falso positivo con `feat/research-topic-mismatch-gate`;
3. aggiungere il dettaglio draft completo GET-only e read-only;
4. eseguire l'audit di parità e rimuovere la legacy soltanto quando sicuro;
5. introdurre azioni operative una per branch;
6. migrare il sito pubblico ad Astro;
7. collegare Search Console, consenso e analytics;
8. attivare affiliazioni soltanto dopo quality gate e misurazione.

## Regola di aggiornamento

- cambia ordine o rilascio → `ROADMAP.md`;
- cambia il piano frontend → `docs/FRONTEND-PLAN.md`;
- cambia una scelta architetturale → `docs/DECISIONS.md`;
- cambia ciò che è realmente operativo → `docs/STATUS.md`;
- cambia il lavoro immediato → `docs/NEXT.md`.

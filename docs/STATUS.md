# Stato del progetto

Data di riferimento: **22 luglio 2026**.

Questo documento fotografa lo stato operativo reale di Senza Roaming.

## Stato sintetico

| Area | Stato | Nota |
|---|---|---|
| Dominio principale | Operativo | `https://senzaroaming.it` serve il Worker |
| Dominio `www` | Operativo da ricontrollare | redirect 308 implementato e distribuito |
| Worker e D1 | Operativi | produzione fino a `0018`; migrazione `0019` in PR #46 |
| API manutenzione | Operativa | accesso riservato; contratto invariato |
| Deploy | Automatico per modifiche operative su `main` | modifiche documentali escluse |
| Container e Workflow recent-demand | Operativi | prima istanza completata end-to-end |
| Quality gate score zero | Operativo e verificato | PR #36, flag `zero_relevance` |
| Golden quality evaluation | Operativa in CI | PR #45, dataset revisionato e confusion matrix |
| Topic-mismatch gate | PR #46 in verifica | anchor deterministiche, CI #183 verde |
| AI Gateway e Vertex AI | Operativi | percorso AI controllato verificato |
| Motore brief | Operativo | primo brief creato, prioritizzato, accettato e convertito |
| Verifica claim | Operativa | claim atomici, fonti, esiti, scadenze e task persistiti |
| Page Readiness backend | Operativa | primo bundle: score 77, draft sì, pubblicazione no |
| Renderer editoriale v2 | Operativo | campi principali e sezioni legati a claim verificati |
| Primo draft | Approvato editorialmente | draft `2` approved; pagina materializzata ancora `review` |
| Control Room legacy | Transitoria | fallback e bugfix critici soltanto |
| Frontend foundation | Operativa | Astro, React island e custom entrypoint nello stesso Worker |
| Cloudflare Access | Operativo e verificato | perimetro privato e validazione nell'origine |
| Sessione server-side | Operativa | un solo login e snapshot automatico |
| Overview e health | Operative e verificate | PR #32 |
| Radar e brief | Operativi e verificati | PR #34 |
| Claim, fonti e scadenze | Operativi e verificati | PR #37 |
| Page Readiness ed evidence bundle UI | Operativa e verificata | PR #39 + hotfix #40 |
| Draft, preview e decisioni UI | Operativa e verificata | PR #42 |
| Queue e audit UI | Operative e verificate | PR #44, CI #174 e verifica browser reale |
| Pubblicazione automatica | Assente | nessun endpoint pubblica automaticamente |
| Affiliazioni | Disabilitate | modalità affiliate non attiva |
| Analytics | Non configurata | CMP, GA4, GTM e GSC ancora da collegare |

## Primo ciclo editoriale controllato

```text
recent demand
→ brief AI
→ accettazione umana
→ claim atomici
→ fonti ufficiali
→ esiti verificati
→ Page Readiness
→ evidence bundle
→ draft v2 grounded
→ approvazione editoriale
```

Nessuno di questi passaggi ha pubblicato la pagina.

Evidence set Cina:

```text
claim atomici: 6
verified:       5
insufficient:   1
pending:        0
```

Evidence bundle `1`:

```text
readiness score:        77
review draft eligible:  true
publication eligible:   false
verified:               5
insufficient:           1
conflicts:              1
first-party tests:      0
```

Draft corrente:

```text
id:                     2
version:                2
renderer:               editorial-page-draft-v2
status:                 approved
materialized page:      review
```

La pagina pubblica continua a restituire `404` con `noindex, nofollow`.

## Control Room definitiva

Architettura operativa:

```text
Cloudflare Access
→ validazione nell'origine
→ shell Astro
→ una React island
→ proxy snapshot read-only
→ API esistente
→ D1 soltanto server-side
```

Sono verificati in produzione:

- sessione con un solo login e nessuna credenziale applicativa nel browser;
- overview e health;
- radar, segnali e brief;
- claim, fonti, verifiche e scadenze;
- Page Readiness ed evidence bundle;
- draft, versioni e decisioni di revisione read-only;
- queue e audit aggregato read-only;
- filtri, dettagli, desktop, mobile e contratti runtime;
- nessuna mutation o capacità di pubblicazione.

### Queue e audit — checkpoint completato

La PR #44 è mergiata nel commit `ea0600b2`, ha superato la CI #174 ed è stata verificata nel browser reale.

Guardrail verificati:

```text
queue status ≠ decisione editoriale
failed task ≠ contenuto non valido
completed task ≠ pagina pubblicata
audit event ≠ autorizzazione operativa
```

## Quality evaluation — PR #45 completata

La PR #45 è mergiata nel commit `a918177` e aggiunge:

```text
tests/fixtures/research-quality-golden.json
scripts/evaluate-research-quality-golden.mjs
npm run eval:research-quality
```

Baseline del gate precedente:

```text
true positive:  3
false positive: 1
true negative:  4
false negative: 0
precision:       0.75
recall:          1.00
```

Framework valutati:

- Promptfoo quando esisterà un vero grader semantico o confronto prompt/modello;
- Evidently per reporting e drift su un corpus più ampio;
- Great Expectations soltanto per un data-quality layer multipipeline;
- Cleanlab con probabilità di modello e volume etichettato sufficiente.

Nessuno di questi framework è stato inserito nel Worker.

## Topic-mismatch gate — PR #46 in verifica

La PR #46 introduce per i nuovi run research e comparison:

```text
query
→ anchor informative
→ research_runs.topic_anchors_json
→ trigger D1 su title + summary
→ nessun match: filtered + topic_mismatch
```

Esempio:

```text
Holafly recent experiences
→ ["holafly"]
```

Proprietà verificate nella CI #183:

- migrazione `0019` valida in D1;
- score zero ancora filtrato;
- risultato estraneo con score `0.2` filtrato con `topic_mismatch`;
- risultato Holafly pertinente con score `0.2` ancora idoneo;
- ingest reale attraverso l'API verificato in `workerd`;
- golden set: `3 TP`, `0 FP`, `5 TN`, `0 FN`;
- precision e recall `1.00` sul dataset versionato;
- Container e tutti gli smoke della Control Room invariati.

Limiti:

- matching letterale di almeno un anchor;
- nessuna comprensione di sinonimi, entità implicite o negazioni;
- run discovery esenti tramite anchor `[]`;
- run esistenti non riclassificati e nessun backfill;
- nessuna modifica automatica a brief, claim, bundle o draft.

Il gate non è ancora dichiarato operativo in produzione finché PR #46, deploy e migrazione remota non sono completati.

## Gap aperti

- corpo completo, FAQ, fonti e provenance field-level del draft non sono ancora nella nuova UI;
- lo stato della pagina materializzata non è esposto nello snapshot aggregato;
- l'audit non è legato univocamente a una specifica versione draft;
- health aggregato runtime e log errori unificati restano incompleti;
- refresh automatico delle fonti scadute resta da completare;
- Search Console, CMP e analytics non sono configurati;
- la Control Room legacy non è ancora rimossa.

## Prossimo checkpoint

Prima chiudere PR #46 e verificare il deploy. Poi:

```text
feat/control-room-draft-detail-readonly
```

La fase successiva completa corpo, fonti, provenance e stato pagina tramite un proxy GET-only on demand, senza mutation o pubblicazione.

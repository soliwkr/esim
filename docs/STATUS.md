# Stato del progetto

Data di riferimento: **22 luglio 2026**.

Questo documento fotografa lo stato operativo reale di Senza Roaming.

## Stato sintetico

| Area | Stato | Nota |
|---|---|---|
| Dominio principale | Operativo | `https://senzaroaming.it` serve il Worker |
| Dominio `www` | Operativo da ricontrollare | redirect 308 implementato e distribuito |
| Worker e D1 | Operativi | migrazioni versionate fino a `0018_research_zero_relevance_gate.sql` |
| API manutenzione | Operativa | accesso riservato e contratto invariato |
| Deploy | Automatico per modifiche operative su `main` | modifiche documentali escluse |
| Container e Workflow recent-demand | Operativi | prima istanza completata end-to-end |
| Quality gate ricerca | Operativo e verificato | score zero filtrato con `zero_relevance` |
| Quality evaluation | PR #45 in verifica | golden dataset e confusion matrix contro D1 reale |
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

Il primo ciclo ha completato:

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

- sessione con un solo login;
- nessuna credenziale applicativa nel browser;
- overview e health;
- radar, segnali e brief;
- claim, fonti, verifiche e scadenze;
- Page Readiness ed evidence bundle reali;
- draft, versioni e decisioni di revisione read-only;
- queue e audit aggregato read-only;
- relazioni draft → evidence bundle → brief tramite ID canonici;
- warning strutturati persistiti;
- filtri e dettagli desktop/mobile;
- contratti runtime delle viste chiuse;
- nessuna mutation o capacità di pubblicazione.

### Queue e audit — checkpoint completato

La PR #44 è mergiata nel commit `ea0600b2`, ha superato la CI #174 ed è stata verificata nel browser reale.

Queue mostra come persistiti:

- task `pending`, `processing` e `failed`;
- tipo, entità, priorità, scadenza, tentativi e lock;
- ultimo errore, payload e timestamp;
- riepiloghi limitati ai record restituiti dallo snapshot.

Audit mostra:

- dominio, azione, attore, entità e timestamp;
- dettagli JSON opachi;
- limite esplicito: nessun ID evento e nessun legame univoco con una versione draft.

Guardrail verificati:

```text
queue status ≠ decisione editoriale
failed task ≠ contenuto non valido
completed task ≠ pagina pubblicata
audit event ≠ autorizzazione operativa
```

## Quality gate score zero

La PR #36 è distribuita e verificata:

```text
relevance = 0              → filtered + zero_relevance
0 < relevance < 0,35       → eligible + warning consultivo
relevance = null           → nessun filtro automatico
manual_quality_override    → decisione umana preservata
```

La migrazione conserva i record per audit e non modifica automaticamente brief, claim, readiness o draft.

## PR #45 — Research quality golden evaluation

La PR #45 è in verifica e non modifica il gate di produzione.

Aggiunge:

```text
tests/fixtures/research-quality-golden.json
scripts/evaluate-research-quality-golden.mjs
npm run eval:research-quality
```

Il golden evaluator:

- applica le migrazioni D1 locali;
- inserisce otto segnali revisionati;
- esegue il trigger canonico;
- confronta l'output con il comportamento corrente e con label editoriali umane;
- produce confusion matrix, precision e recall;
- pulisce i record di test.

Baseline attesa:

```text
true positive:  3
false positive: 1
true negative:  4
false negative: 0
precision:       0.75
recall:          1.00
```

Il falso positivo residuo è un risultato estraneo al topic con score positivo `0.2`. La baseline lo rende misurabile; non lo considera corretto.

Framework valutati:

- Promptfoo: candidato quando esisterà un vero grader semantico o prompt/model comparison;
- Evidently: candidato per reporting e drift su un corpus più ampio;
- Great Expectations: non necessario per vincoli già coperti da D1 e runtime tests;
- Cleanlab: da rivalutare con probabilità di modello e volume etichettato sufficiente.

Nessuno di questi framework viene inserito nel Worker durante lo spike.

## Gap ancora aperti

- corpo completo, FAQ, fonti e provenance field-level del draft non sono ancora nella nuova UI;
- lo stato della pagina materializzata non è esposto nello snapshot aggregato;
- l'audit non è legato univocamente a una specifica versione draft;
- health aggregato runtime e log errori unificati restano incompleti;
- refresh automatico delle fonti scadute resta da completare;
- Search Console, CMP e analytics non sono configurati;
- la Control Room legacy non è ancora rimossa.

## Prossimo checkpoint

Dopo la PR #45:

```text
feat/research-topic-mismatch-gate
```

Criterio di uscita:

```text
false positive: 1 → 0
false negative: 0 → 0
```

La fase deve filtrare il topic mismatch con una regola auditabile, conservare i segnali rilevanti low-positive e non modificare automaticamente brief, claim, bundle o draft già esistenti.

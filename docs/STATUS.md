# Stato del progetto

Data di riferimento: **21 luglio 2026**.

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
| Quality gate ricerca | Operativo e verificato | score zero filtrato con `zero_relevance`; backfill reale confermato |
| AI Gateway e Vertex AI | Operativi | percorso AI controllato verificato |
| Motore brief | Operativo | primo brief creato, prioritizzato, accettato e convertito |
| Verifica claim | Operativa | claim atomici, fonti, esiti, scadenze e task persistiti |
| Page Readiness | Operativa | primo evidence bundle: score 77, draft sì, pubblicazione no |
| Renderer editoriale v2 | Operativo | campi principali e sezioni legati a claim verificati |
| Primo draft | Approvato editorialmente | draft `2` approved; pagina materializzata ancora `review` |
| Control Room legacy | Transitoria | fallback e bugfix critici soltanto |
| Frontend foundation | Operativa | Astro, React island e custom entrypoint nello stesso Worker |
| Cloudflare Access | Operativo e verificato | perimetro privato e validazione nell'origine |
| Sessione server-side Control Room | Operativa | un solo login e snapshot automatico |
| Overview e health | Operative e verificate | PR #32 |
| Radar e brief | Operativi e verificati | PR #34 |
| Claim, fonti e scadenze | PR #37 in verifica | migrazione read-only sul contratto snapshot esistente |
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
- filtri e dettagli desktop/mobile;
- contratti runtime;
- nessuna mutation o capacità di pubblicazione.

## Quality gate score zero verificato

La Control Room ha reso visibile un falso positivo persistito con topic Holafly, contenuto relativo a uno spettacolo comico e `relevance_score = 0`.

La PR #36 è mergiata nel commit `2927419`, distribuita e verificata sul record reale:

```text
relevance = 0              → filtered + zero_relevance
0 < relevance < 0,35       → eligible + warning consultivo
relevance = null           → nessun filtro automatico
manual_quality_override    → decisione umana preservata
```

La migrazione `0018`:

- conserva i record per audit;
- corregge eligibility e conteggi dei run;
- preserva override umani espliciti;
- applica la stessa regola agli inserimenti futuri;
- non modifica automaticamente brief, claim, readiness o draft.

Il segnale osservato risulta ora filtrato e mostra `zero_relevance` nella Control Room.

## PR #37 — Claim, fonti e scadenze

La PR #37 migra la vista claim dalla preview iniziale a un registro read-only completo usando esclusivamente i dati già esposti dallo snapshot.

Implementazione in verifica:

- tabella claim con brief, soggetto, stato canonico, fonte e scadenza;
- filtri per stato, brief, tipo di fonte, verifica e scadenza;
- dettaglio con domanda di verifica, evidence, note e source kinds richiesti;
- metadati della fonte separati dall'evidenza testuale;
- verification status, confidence, checked at, valid until e task status;
- stato temporale derivato `valida`, `scaduta` o `senza scadenza`;
- stato temporale esplicitamente separato dallo stato canonico del claim;
- link fonte limitato a URL HTTP/HTTPS;
- validazione runtime rigorosa dei campi usati;
- regressioni browser dedicate desktop, mobile, tastiera, filtri, contratto invalido ed empty state.

Restano invariati:

- query e contratto del backend;
- D1 e migrazioni;
- Workflow, Container e AI;
- claim, verifiche, fonti e queue persistiti;
- readiness, draft e gate di pubblicazione.

## Rischi aperti

1. La PR #37 deve superare typecheck, build, runtime e i due smoke Chromium.
2. La nuova vista deve essere verificata nel browser reale dopo il deploy.
3. Lo stato temporale derivato non deve essere interpretato come mutation dello stato canonico.
4. Una fonte ufficiale resta una dichiarazione attribuita e non un test indipendente.
5. L'health corrente descrive soprattutto configurazione e binding.
6. La Control Room legacy deve restare congelata.
7. Le fonti devono rientrare automaticamente nella coda alla scadenza.
8. Search Console, CMP e analytics non sono ancora disponibili.
9. Il repository pubblico non deve contenere credenziali o dati riservati.

## Prossimo checkpoint

Il checkpoint è raggiunto quando:

- PR #37 è mergiata con CI completa verde;
- claim, fonti, verifiche e scadenze reali sono leggibili;
- filtri e dettaglio sono utilizzabili da tastiera e su mobile;
- payload claim non validi vengono rifiutati;
- stato canonico e stato temporale restano distinti;
- nessuna richiesta browser diversa da `GET` viene introdotta;
- overview, radar, segnali, brief e draft preview non regrediscono;
- deploy e verifica manuale sono verdi;
- nessuna mutation o capacità di pubblicazione viene introdotta.

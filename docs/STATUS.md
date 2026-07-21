# Stato del progetto

Data di riferimento: **21 luglio 2026**.

Questo documento fotografa lo stato operativo reale di Senza Roaming.

## Stato sintetico

| Area | Stato | Nota |
|---|---|---|
| Dominio principale | Operativo | `https://senzaroaming.it` serve il Worker |
| Dominio `www` | Operativo da ricontrollare | redirect 308 implementato e distribuito |
| Worker e D1 | Operativi | migrazioni versionate fino a `0017`; PR #36 aggiunge `0018` |
| API manutenzione | Operativa | accesso riservato e contratto invariato |
| Deploy | Automatico per modifiche operative su `main` | modifiche documentali escluse |
| Container e Workflow recent-demand | Operativi | prima istanza completata end-to-end |
| Quality gate ricerca | Correzione PR #36 in verifica | score zero osservato erroneamente come eligible |
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
| Claim, fonti e scadenze | Temporaneamente in attesa | riprende dopo la verifica del backfill PR #36 |
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

## Falso positivo recent-demand osservato

La nuova vista radar ha reso visibile un record persistito come idoneo:

```text
query/topic:       Holafly recent experiences
titolo:            esperienza a uno spettacolo di Shane Gillis ad Austin
relevance score:   0
eligible:          true
quality flags:     nessuno
```

Il record è estraneo al dominio eSIM. La UI ha mostrato correttamente il dato persistito; il difetto è nel quality gate storico.

### Causa

La migrazione `0010_research_signal_quality.sql` applica come condizioni bloccanti soltanto:

- contenuto oltre la finestra recente;
- data oltre due giorni nel futuro.

`low_relevance` era soltanto un flag consultivo. Per questo uno score esattamente pari a zero restava eligible.

### PR #36 — Correzione deterministica

La branch `fix/research-zero-relevance-gate` introduce:

- migrazione `0018_research_zero_relevance_gate.sql`;
- backfill dei record con `relevance_score <= 0`;
- preservazione degli override umani già espliciti;
- flag persistito `zero_relevance`;
- nuovo trigger D1 per gli inserimenti futuri;
- conteggi run riallineati;
- flag API coerente;
- smoke D1 basato sul falso positivo osservato.

Semantica scelta:

```text
relevance = 0              → filtered
0 < relevance < 0,35       → eligible + warning consultivo
relevance = null           → nessun filtro automatico
manual_quality_override    → decisione umana preservata
```

La CI ha già verificato con successo migrazione e smoke D1 sulla branch. Restano da completare la suite intera, il merge, il deploy e il controllo del record reale.

## Confini della correzione

La PR #36 non introduce:

- classificatori semantici o LLM;
- framework esterni di data quality;
- cancellazione dei segnali;
- nuovi endpoint;
- nuovi run del Workflow;
- modifiche a brief, claim, readiness o draft;
- mutation o pubblicazione.

## Rischi aperti

1. Il backfill remoto deve essere verificato sul segnale reale.
2. Un relevance score positivo ma errato può ancora richiedere revisione umana o un futuro gate semantico.
3. Gli strumenti esterni di evaluation richiedono prima un dataset revisionato.
4. L'health corrente descrive soprattutto configurazione e binding.
5. La Control Room legacy deve restare congelata.
6. Le fonti devono rientrare automaticamente nella coda alla scadenza.
7. Search Console, CMP e analytics non sono ancora disponibili.
8. Il repository pubblico non deve contenere credenziali o dati riservati.

## Prossimo checkpoint

Il checkpoint quality gate è raggiunto quando:

- PR #36 è mergiata con CI completa verde;
- migrazione `0018` è applicata in produzione;
- il segnale osservato risulta filtered;
- `zero_relevance` è visibile;
- i conteggi del run sono corretti;
- nessun brief o claim viene alterato automaticamente;
- la migrazione claim/fonti/scadenze può riprendere.

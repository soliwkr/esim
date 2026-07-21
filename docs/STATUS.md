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
| Page Readiness backend | Operativa | primo evidence bundle: score 77, draft sì, pubblicazione no |
| Renderer editoriale v2 | Operativo | campi principali e sezioni legati a claim verificati |
| Primo draft | Approvato editorialmente | draft `2` approved; pagina materializzata ancora `review` |
| Control Room legacy | Transitoria | fallback e bugfix critici soltanto |
| Frontend foundation | Operativa | Astro, React island e custom entrypoint nello stesso Worker |
| Cloudflare Access | Operativo e verificato | perimetro privato e validazione nell'origine |
| Sessione server-side Control Room | Operativa | un solo login e snapshot automatico |
| Overview e health | Operative e verificate | PR #32 |
| Radar e brief | Operativi e verificati | PR #34 |
| Claim, fonti e scadenze | Operativi e verificati | PR #37, CI e verifica browser completate |
| Page Readiness ed evidence bundle UI | Hotfix in verifica | PR #39 distribuita; contratto warning reale non coperto dalla fixture |
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
- filtri e dettagli desktop/mobile;
- contratti runtime delle viste già chiuse;
- nessuna mutation o capacità di pubblicazione.

## Quality gate score zero verificato

La PR #36 è mergiata nel commit `2927419`, distribuita e verificata sul record reale:

```text
relevance = 0              → filtered + zero_relevance
0 < relevance < 0,35       → eligible + warning consultivo
relevance = null           → nessun filtro automatico
manual_quality_override    → decisione umana preservata
```

La migrazione conserva i record per audit, riallinea eligibility e conteggi, preserva override espliciti e non modifica automaticamente brief, claim, readiness o draft.

## PR #37 — Claim, fonti e scadenze

La PR #37 è mergiata nel commit `6a71174`, distribuita e verificata nel browser reale.

Risultati verificati:

- tabella claim con brief, soggetto, stato canonico, fonte e scadenza;
- filtri per stato, brief, tipo di fonte, verifica e scadenza;
- dettaglio con domanda di verifica, evidence, note e source kinds richiesti;
- metadati della fonte separati dall'evidenza testuale;
- verification status, confidence, checked at, valid until e task status;
- stato temporale `valida`, `scaduta` o `senza scadenza` separato dallo stato canonico;
- link fonte limitato a URL HTTP/HTTPS;
- payload claim non conformi rifiutati;
- desktop, mobile, tastiera, empty state e filtri verificati;
- nessuna richiesta browser diversa da `GET`;
- nessuna mutation o capacità di pubblicazione.

Restano invariati backend, query D1, Workflow, Container, AI, queue, readiness, draft e publication gate.

## PR #39 — Page Readiness ed evidence bundle

La PR #39 ha migrato nella nuova Control Room la lettura di `evidenceBundles` già presente nello snapshot ed è stata mergiata nel commit `4e3e3c9` dopo CI completa verde.

Implementazione:

- tabella bundle con pagina, brief, versione, score e review status;
- filtri per review status, draft eligibility, publication eligibility e warning;
- `review_draft_eligible` separato da `publication_eligible`;
- `ready_for_review_draft` separato da `ready_for_publication`;
- dettaglio con verified, insufficient, contradicted, pending ed expired count;
- conflitti, fonti, soggetti e test first-party;
- revisore, reviewed at, created at e updated at;
- empty state, contratto invalido, tastiera, desktop e mobile;
- smoke dedicato senza richieste browser diverse da `GET`.

### Incidente di verifica reale

Dopo il deploy, Cloudflare Access e la shell hanno funzionato, ma lo snapshot è stato rifiutato dal client come non conforme.

Causa verificata:

```text
backend canonico: warnings = oggetti { code, message, ...metadata }
fixture PR #39:   warnings = string[]
parser PR #39:    richiedeva string[]
```

Il backend, D1, il proxy e il gate Page Readiness non risultano guasti. Il difetto è limitato al contratto e alla fixture frontend.

Hotfix in corso:

```text
fix/control-room-readiness-warning-contract
```

La hotfix:

- valida ogni warning come oggetto con `code` obbligatorio e `message` opzionale;
- preserva metadati aggiuntivi senza interpretarli;
- mostra codice e messaggio persistiti;
- usa una fixture aderente al Page Readiness canonico;
- aggiunge regressioni per stringhe legacy, codice mancante e messaggio non testuale;
- non modifica backend, query, D1, Workflow, Container, AI o gate editoriali.

## Rischi aperti

1. La hotfix warning contract deve superare typecheck, build, runtime e i tre smoke Chromium.
2. La vista readiness deve essere verificata di nuovo nel browser reale dopo il deploy.
3. Draft eligibility e publication eligibility devono restare distinti in ogni stato UI.
4. Score, warning e conteggi non devono essere reinterpretati dal client.
5. Una fonte ufficiale resta una dichiarazione attribuita e non un test indipendente.
6. L'health corrente descrive soprattutto configurazione e binding.
7. La Control Room legacy deve restare congelata.
8. Le fonti devono rientrare automaticamente nella coda alla scadenza.
9. Search Console, CMP e analytics non sono ancora disponibili.
10. Il repository pubblico non deve contenere credenziali o dati riservati.

## Prossimo checkpoint

Il prossimo checkpoint è raggiunto quando:

- la hotfix è mergiata con CI completa verde;
- lo snapshot reale non viene più rifiutato;
- gli evidence bundle reali sono visibili;
- score 77, draft eligibility positiva e publication eligibility negativa sono leggibili nel bundle reale;
- conteggi, conflitto, warning strutturati e zero first-party tests sono visibili;
- warning bundle non conformi vengono rifiutati;
- filtri e dettaglio sono utilizzabili da tastiera e su mobile;
- nessuna richiesta browser diversa da `GET` viene introdotta;
- overview, radar, brief, claim e draft preview non regrediscono;
- deploy e verifica manuale sono verdi;
- nessuna approvazione, generazione, mutation o pubblicazione viene introdotta.

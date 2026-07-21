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
| Quality gate ricerca | Operativo e verificato | score zero filtrato con `zero_relevance` |
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
| Draft, preview e decisioni UI | Operativa e verificata | PR #42, CI e verifica browser reale completate |
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
- relazioni draft → evidence bundle → brief tramite ID canonici;
- warning strutturati persistiti;
- filtri e dettagli desktop/mobile;
- contratti runtime delle viste chiuse;
- nessuna mutation o capacità di pubblicazione.

## Quality gate score zero verificato

La PR #36 è mergiata, distribuita e verificata sul record reale:

```text
relevance = 0              → filtered + zero_relevance
0 < relevance < 0,35       → eligible + warning consultivo
relevance = null           → nessun filtro automatico
manual_quality_override    → decisione umana preservata
```

La migrazione conserva i record per audit, riallinea eligibility e conteggi e non modifica automaticamente brief, claim, readiness o draft.

## Claim, fonti e scadenze

La PR #37 è distribuita e verificata:

- cinque filtri e dettaglio read-only;
- fonte distinta dall’evidenza;
- verification status, confidence, checked at, valid until e task status;
- stato temporale separato dallo stato canonico;
- link fonte limitato a HTTP/HTTPS;
- nessuna richiesta browser diversa da `GET`;
- nessuna mutation o pubblicazione.

## Page Readiness ed evidence bundle

Le PR #39 e #40 sono distribuite e verificate. La prima verifica reale ha rilevato una fixture warning non aderente al backend; la hotfix ha riallineato parser, rendering, fixture e smoke al formato canonico:

```text
{ code, message?, ...metadata }
```

Sono visibili score, conteggi, quattro gate distinti, warning, revisore e timestamp. La UI non ricalcola readiness o decisioni.

## PR #42 — Draft, preview e decisioni read-only

La PR #42 è mergiata nel commit `856da79`, distribuita e verificata nel browser reale.

Usa esclusivamente gli array già presenti nello snapshot:

```text
drafts
evidenceBundles
briefs
```

Risultati verificati:

- inventario di tutte le versioni draft esposte;
- filtri per stato, renderer e presenza di revisione;
- evidence bundle e brief collegati tramite ID canonici;
- title, H1, claim usati ed esclusi;
- generatore, revisore, reviewed at, note, errori e timestamp;
- publication eligibility del bundle mostrata separatamente;
- dettaglio read-only accessibile;
- empty state, contratto invalido, tastiera, desktop e mobile;
- nessuna richiesta browser diversa da `GET`;
- nessuna azione di generazione, approvazione, rigenerazione o pubblicazione.

Guardrail verificati:

```text
approved draft ≠ published page
review draft ≠ publication eligibility
editorial approval ≠ publication action
```

### Gap esplicito del contratto aggregato

Lo snapshot non espone:

- corpo strutturato, FAQ e fonti;
- provenance field-level del renderer v2;
- stato della pagina materializzata;
- audit legato univocamente a una specifica versione del draft.

Il backend possiede già tali dati attraverso endpoint e tabelle esistenti, ma la PR #42 non amplia API o query. La UI dichiara il gap e non deduce dati mancanti.

Restano invariati backend, D1, Workflow, Container, AI, draft generation, review actions, queue e publication gate.

## Rischi aperti

1. Lo stato della pagina non deve essere dedotto dallo stato del draft.
2. Il gap su corpo completo e provenance richiederà uno scope backend esplicito se verrà chiuso.
3. Queue e audit devono essere migrati senza introdurre mutation implicite.
4. Una fonte ufficiale resta una dichiarazione attribuita e non un test indipendente.
5. L'health corrente descrive soprattutto configurazione e binding.
6. La Control Room legacy deve restare congelata.
7. Le fonti devono rientrare automaticamente nella coda alla scadenza.
8. Search Console, CMP e analytics non sono ancora disponibili.
9. Il repository pubblico non deve contenere credenziali o dati riservati.

## Prossimo checkpoint

Il prossimo checkpoint riguarda **queue e audit in sola lettura**.

È raggiunto quando:

- i contratti reali di `queue` e `audit` sono letti integralmente e validati a runtime;
- task, priorità, stato, tentativi, errori e timestamp vengono mostrati come persistiti;
- eventi audit, attore, dominio, azione, entità e dettagli vengono mostrati senza reinterpretazione;
- relazioni non presenti nello snapshot non vengono inventate;
- filtri, dettaglio, empty state, contratto invalido, tastiera e mobile sono verificati;
- overview, radar, brief, claim, readiness e draft non regrediscono;
- nessuna mutation della queue o azione editoriale viene introdotta nella stessa fase read-only;
- nessuna capacità di pubblicazione viene aggiunta.
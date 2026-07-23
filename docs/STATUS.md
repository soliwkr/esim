# Stato del progetto

Data di riferimento: **23 luglio 2026**.

Questo documento fotografa lo stato operativo reale di Senza Roaming.

## Stato sintetico

| Area | Stato | Nota |
|---|---|---|
| Dominio principale | Operativo | `https://senzaroaming.it` serve il Worker |
| Dominio `www` | Operativo da ricontrollare | redirect 308 implementato e distribuito |
| Worker e D1 | Operativi | stack remoto allineato fino a `0020`; verifica funzionale del topic-mismatch sul prossimo run ancora aperta |
| API manutenzione | Operativa | accesso riservato; contratti legacy preservati |
| Deploy | Automatico per modifiche operative su `main` | modifiche documentali escluse |
| Container e Workflow recent-demand | Operativi | prima istanza completata end-to-end |
| Quality gate score zero | Operativo e verificato | PR #36, flag `zero_relevance` |
| Golden quality evaluation | Operativa in CI | PR #45 |
| Topic-mismatch gate | Mergiato, verifica remota aperta | PR #46, CI #188; migrazione `0019` da attestare |
| AI Gateway e Vertex AI | Operativi | percorso AI controllato verificato |
| Motore brief | Operativo | primo brief creato, prioritizzato, accettato e convertito |
| Verifica claim | Operativa | claim atomici, fonti, esiti, scadenze e task persistiti |
| Page Readiness backend | Operativa | primo bundle: score 77, draft sì, pubblicazione no |
| Renderer editoriale v2 | Operativo | campi e sezioni legati a claim verificati |
| Primo draft | Approvato editorialmente | draft `2` approved; pagina materializzata ancora `review` |
| Control Room legacy | Transitoria e necessaria | fallback delle mutation residue; rimozione non autorizzata |
| Frontend foundation | Operativa | Astro, React island e custom entrypoint nello stesso Worker |
| Cloudflare Access | Operativo e verificato | perimetro privato e validazione nell'origine |
| Sessione server-side | Operativa | un solo login e nessuna credenziale applicativa nel browser |
| Overview, radar e brief | Operativi e verificati | PR #32 e #34 |
| Claim → task ID | Verificato in CI | PR #50, merge `41a9beee`, CI #213; browser reale aperto |
| Readiness, draft, queue e audit | Operativi e verificati | PR #39, #40, #42 e #44 |
| Audit → versione draft | Verificato in CI | PR #52, merge `35f56e82`, CI finale #220; browser reale aperto |
| Dettaglio draft completo | Verificato in produzione | PR #47, CI #198 |
| Parità read-only legacy | Completa in CI | PR #49 + #50 + #52 |
| Decisione brief mutation | Operativa e verificata in produzione | PR #54, merge `15ea0445`, CI #237, checkpoint #244; nessuna decisione reale eseguita |
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

La pagina pubblica continua a restituire `404` con `noindex, nofollow` nell’ultima verifica documentata.

## Control Room in produzione

Architettura verificata:

```text
Cloudflare Access
→ validazione nell'origine
→ shell Astro
→ una React island
→ snapshot read-only
→ dettaglio draft GET-only on demand
→ decisione brief POST controllata
→ API esistenti
→ D1 soltanto server-side
```

Sono verificati in produzione sessione, overview, radar, brief, claim, readiness, inventario draft, queue/audit, dettaglio draft completo, desktop/mobile, route e UI della decisione brief e separazione fra stato draft, pagina materializzata e publication eligibility.

Sono verificati in CI ma non ancora attestati nel browser reale di produzione:

- rendering `task_id` nel dettaglio claim — CI #213;
- `event_key` audit e linkage `draft_id` + `draft_version` — CI #220.

Non restano gap read-only noti rispetto alle letture necessarie della legacy.

## Decisione brief — PR #54 in produzione

Branch:

```text
feat/control-room-brief-decision-mutation
```

Scope esclusivo:

```text
proposed → accepted | dismissed
```

Implementazione verificata dalla CI finale #237 e dal checkpoint produttivo #244:

- route privata `POST /control-room-foundation/api/brief-decision`;
- attore derivato dal JWT Cloudflare Access già verificato;
- body browser limitato a `briefId`, azione e note;
- conferma tramite AlertDialog accessibile;
- motivo obbligatorio per il rifiuto;
- migrazione locale `0020` con state machine D1;
- evento `editorial_brief_events` append-only;
- retry della stessa decisione idempotente;
- conflitto sulla decisione opposta;
- cancellazione del task editoriale aperto soltanto su `dismissed`;
- reload dello snapshot dopo esito;
- `publicationTriggered: false` nel contratto;
- conteggio delle pagine pubblicate invariato prima/dopo;
- test endpoint reale e browser desktop/mobile;
- regressioni claim, readiness, draft, dettaglio, queue/audit e legacy parity verdi.

La CI finale #237 ha superato typecheck, build Astro, migrazioni D1 locali, quality gate, golden evaluation, Container, runtime `workerd` e tutti gli smoke della Control Room.

Il checkpoint produttivo #244 ha attestato:

- migrazione `0020` registrata nella D1 remota, senza migrazioni residue;
- tabella `editorial_brief_events`, colonne `decision_actor` / `decided_at` e trigger attesi presenti;
- pagine `published` invariate: `4 → 4`;
- stati brief invariati: un solo brief `converted`;
- Access anonimo `302`, pagina e snapshot autenticati `200`;
- `publicationAutomation: false`;
- nessuna richiesta browser non-GET;
- nessuna decisione su brief reali.

La Control Room reale mostra correttamente l’empty state perché non esistono brief `proposed`. Conversione brief, claim, readiness, bundle, draft, queue retry, materializzazione e pubblicazione restano escluse.

## Dettaglio draft completo

La PR #47 è mergiata nel commit `2c790272`, ha superato la CI #198 ed è stata verificata nel browser reale il 22 luglio 2026.

```text
GET /control-room-foundation/api/draft-detail?draftId=<id>
```

Il proxy richiede Access, accetta soltanto `GET`, conserva il maintenance token server-side e delega al contratto backend esistente. Un errore resta confinato nel relativo Sheet e non cancella lo snapshot.

## Parità legacy

- PR #49: audit sistematico, merge `e0a39fa9`, CI #209;
- PR #50: claim → task, merge `41a9beee`, CI #213;
- PR #52: audit → versione draft, merge `35f56e82`, CI #220.

La prima mutation migrata e verificata è la decisione brief. La legacy resta il fallback per avvio Workflow, conversione brief, operazioni claim, readiness/bundle, generazione e decisione draft e altre azioni non ancora migrate.

## Topic-mismatch gate

La PR #46, merge `215470ae`, è verde in CI #188. La migrazione remota `0019` e il primo nuovo run autorizzato non sono ancora attestati in produzione.

## Gap aperti

- verifica browser reale dei due linkage read-only recenti;
- prima decisione reale soltanto quando esisterà un brief `proposed` e sarà autorizzata;
- verifica remota di `0019`;
- health aggregato e log errori unificati;
- refresh automatico delle fonti scadute;
- Search Console, CMP e analytics;
- migrazione delle mutation residue e successiva rimozione della legacy.

## Prossimo checkpoint

```text
verifica visuale dei linkage read-only recenti
→ conversione brief come capacità separata
```

La decisione brief è operativa, ma non è stata eseguita su dati reali. Nessuna capacità successiva viene attivata implicitamente.

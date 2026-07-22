# Stato del progetto

Data di riferimento: **22 luglio 2026**.

Questo documento fotografa lo stato operativo reale di Senza Roaming.

## Stato sintetico

| Area | Stato | Nota |
|---|---|---|
| Dominio principale | Operativo | `https://senzaroaming.it` serve il Worker |
| Dominio `www` | Operativo da ricontrollare | redirect 308 implementato e distribuito |
| Worker e D1 | Operativi | produzione verificata fino a `0018`; `0019` mergiata ma non attestata; `0020` soltanto sulla branch mutation |
| API manutenzione | Operativa | accesso riservato; contratti esistenti preservati |
| Deploy | Automatico per modifiche operative su `main` | modifiche documentali escluse |
| Container e Workflow recent-demand | Operativi | prima istanza completata end-to-end |
| Quality gate score zero | Operativo e verificato | PR #36, flag `zero_relevance` |
| Golden quality evaluation | Operativa in CI | PR #45, dataset revisionato e confusion matrix |
| Topic-mismatch gate | Mergiato, verifica remota aperta | PR #46, CI #188 verde; migrazione remota da attestare |
| AI Gateway e Vertex AI | Operativi | percorso AI controllato verificato |
| Motore brief | Operativo | primo brief creato, prioritizzato, accettato e convertito |
| Verifica claim | Operativa | claim atomici, fonti, esiti, scadenze e task persistiti |
| Page Readiness backend | Operativa | primo bundle: score 77, draft sì, pubblicazione no |
| Renderer editoriale v2 | Operativo | campi principali e sezioni legati a claim verificati |
| Primo draft | Approvato editorialmente | draft `2` approved; pagina materializzata ancora `review` |
| Control Room legacy | Transitoria e ancora necessaria | fallback delle mutation; rimozione non autorizzata |
| Frontend foundation | Operativa | Astro, React island e custom entrypoint nello stesso Worker |
| Cloudflare Access | Operativo e verificato | perimetro privato e validazione nell'origine |
| Sessione server-side | Operativa | un solo login e snapshot automatico |
| Overview e health | Operative e verificate | PR #32 |
| Radar e brief | Operativi e verificati | PR #34 |
| Claim, fonti e scadenze | Operativi e verificati | PR #37 |
| Claim → task ID | Implementato e verificato in CI | PR #50, merge `41a9beee`, CI #213; verifica browser reale aperta |
| Page Readiness ed evidence bundle UI | Operativa e verificata | PR #39 + hotfix #40 |
| Draft, preview e decisioni UI | Operativa e verificata | PR #42 |
| Queue e audit UI | Operative e verificate | PR #44, CI #174 e verifica browser reale |
| Audit → versione draft | Implementato e verificato in CI | PR #52, merge `35f56e82`, CI finale #220; nessuna migrazione D1 |
| Dettaglio draft completo UI | Operativo e verificato in produzione | PR #47, CI #198 e verifica browser reale |
| Parità read-only legacy | Completa in CI | PR #49 + PR #50 + PR #52; verifica visuale dei nuovi linkage aperta |
| Decisione brief mutation | In implementazione | branch `feat/control-room-brief-decision-mutation`; CI, merge e migrazione remota aperti |
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

## Control Room definitiva

Architettura operativa in produzione:

```text
Cloudflare Access
→ validazione nell'origine
→ shell Astro
→ una React island
→ snapshot read-only
→ dettaglio draft GET-only on demand
→ API esistenti
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
- dettaglio draft completo con corpo, sezioni, FAQ, fonti e provenance;
- caricamento del dettaglio soltanto dopo apertura esplicita;
- stato draft, stato pagina materializzata e publication eligibility separati;
- filtri, dettagli, desktop, mobile e contratti runtime;
- nessuna mutation nella nuova UI e nessuna capacità di pubblicazione.

Sono verificati dalla CI ma non ancora attestati nel browser reale di produzione dietro Cloudflare Access:

- rendering di `task_id` nel dettaglio claim — CI #213;
- `event_key` audit e linkage `draft_id` + `draft_version` — CI finale #220.

## Dettaglio draft completo — checkpoint completato

La PR #47 è mergiata nel commit `2c790272`, ha superato la CI #198 ed è stata verificata nel browser reale il 22 luglio 2026.

La risorsa privata è:

```text
GET /control-room-foundation/api/draft-detail?draftId=<id>
```

Il custom Worker richiede Cloudflare Access, accetta soltanto `GET`, valida un `draftId` positivo, conserva il maintenance token server-side, delega all’endpoint backend esistente e imposta `no-store`, `noindex` e `nosniff`.

La React island carica il dettaglio soltanto quando viene aperta una versione. Un errore resta confinato nel relativo Sheet e non cancella l’inventario valido dello snapshot. Nessuna generation, review action, materializzazione o pubblicazione è presente.

## Audit di parità legacy — letture chiuse in CI

La PR #49 è mergiata nel commit `e0a39fa9` dopo la CI #209 completamente verde. La matrice è versionata in `docs/CONTROL-ROOM-LEGACY-PARITY-AUDIT.md` e lo smoke `smoke:legacy-parity` resta nella pipeline.

Il gap `claim → task_id` è stato chiuso dalla PR #50:

- `task_id: number | null` nel contratto claim;
- validazione limitata a `null` o intero positivo;
- ID e stato task mostrati senza euristiche client;
- CI #213 completamente verde.

Il gap `audit → specifica versione draft` è stato chiuso dalla PR #52, merge `35f56e82`, senza migrazione D1:

- lo schema esistente fornisce ID evento, `draft_id` e versione draft;
- lo snapshot espone una `event_key` namespaced e univoca;
- il client seleziona per `event_key` e non interpreta `details`;
- CI #217 e CI finale #220 completamente verdi.

Non restano gap read-only noti. La legacy non viene rimossa perché resta il fallback delle mutation operative non ancora migrate.

## Decisione brief — checkpoint in implementazione

Branch:

```text
feat/control-room-brief-decision-mutation
```

Lo scope è limitato a:

```text
proposed → accepted | dismissed
```

La branch introduce:

- una route privata `POST /control-room-foundation/api/brief-decision`;
- attore derivato dal JWT Access già verificato;
- conferma accessibile prima dell’invio;
- migrazione `0020` con state machine D1;
- audit append-only per la decisione;
- retry idempotente e conflitto sulla decisione opposta;
- motivo obbligatorio per il rifiuto;
- reload dello snapshot;
- risposta che attesta `publicationTriggered: false`;
- smoke endpoint reale e browser.

Non sono ancora verificati o operativi in produzione:

- CI della branch;
- merge;
- applicazione remota di `0020`;
- comportamento nel browser reale dietro Access.

Conversione brief e tutte le mutation successive restano escluse.

## Quality evaluation — PR #45 completata

La PR #45 è mergiata nel commit `a918177` e misura il trigger D1 reale con un golden dataset versionato. La baseline iniziale era `3 TP`, `1 FP`, `4 TN`, `0 FN`, precision `0.75`, recall `1.00`.

Nessun framework esterno è stato inserito nel Worker. Promptfoo, Evidently, Great Expectations e Cleanlab restano subordinati a un caso d’uso reale e misurabile.

## Topic-mismatch gate — PR #46 mergiata

La PR #46, merge `215470ae`, introduce anchor informative per i nuovi run research e comparison. La CI #188 verifica score zero, `topic_mismatch`, risultato Holafly pertinente, ingest `workerd`, golden set `3 TP`, `0 FP`, `5 TN`, `0 FN`, precision e recall `1.00`.

Il gate non è ancora dichiarato verificato in produzione finché non viene attestata l’applicazione remota della migrazione `0019`.

## Gap aperti

- CI, merge e verifica remota della mutation decisione brief;
- verifica browser reale dei linkage claim → task e audit → versione draft;
- health aggregato runtime e log errori unificati restano incompleti;
- refresh automatico delle fonti scadute resta da completare;
- Search Console, CMP e analytics non sono configurati;
- la Control Room legacy non è ancora rimossa perché ospita mutation residue;
- verifica remota della migrazione `0019` ancora aperta.

## Prossimo checkpoint

```text
feat/control-room-brief-decision-mutation
```

La branch deve superare typecheck, migrazione D1 locale, runtime `workerd`, smoke endpoint/browser e legacy parity prima di essere proposta per il merge. La pubblicazione resta fuori scope.

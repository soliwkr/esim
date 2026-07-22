# Stato del progetto

Data di riferimento: **22 luglio 2026**.

Questo documento fotografa lo stato operativo reale di Senza Roaming.

## Stato sintetico

| Area | Stato | Nota |
|---|---|---|
| Dominio principale | Operativo | `https://senzaroaming.it` serve il Worker |
| Dominio `www` | Operativo da ricontrollare | redirect 308 implementato e distribuito |
| Worker e D1 | Operativi | produzione verificata fino a `0018`; `0019` mergiata, verifica remota ancora aperta |
| API manutenzione | Operativa | accesso riservato; snapshot read-only esteso senza nuove route |
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

Architettura operativa:

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
- nessuna mutation o capacità di pubblicazione.

Sono verificati dalla CI ma non ancora attestati nel browser reale di produzione dietro Cloudflare Access:

- rendering di `task_id` nel dettaglio claim — CI #213;
- `event_key` audit e linkage `draft_id` + `draft_version` — CI finale #220.

## Dettaglio draft completo — checkpoint completato

La PR #47 è mergiata nel commit `2c790272`, ha superato la CI #198 ed è stata verificata nel browser reale il 22 luglio 2026.

La risorsa privata è:

```text
GET /control-room-foundation/api/draft-detail?draftId=<id>
```

Il custom Worker:

- richiede Cloudflare Access prima della route;
- accetta soltanto `GET`;
- valida un `draftId` intero positivo;
- usa il maintenance token soltanto server-side;
- delega all’endpoint backend esistente `GET /api/maintenance/editorial-draft-grounding`;
- imposta `no-store`, `noindex` e `nosniff`.

La React island carica il dettaglio soltanto quando viene aperta una versione. Il contratto runtime separato valida identità, corpo strutturato, FAQ, fonti HTTPS, provenance, claim usati/esclusi, stato pagina, metadati e timestamp.

La verifica visuale conferma che in produzione vengono renderizzati il corpo, i blocchi editoriali, i badge claim, le fonti e la provenance. Lo screenshot ricevuto era compresso e non viene usato per attestare valori testuali puntuali o lo stato della migrazione `0019`.

Un errore del dettaglio resta confinato nel relativo Sheet e non cancella l’inventario valido dello snapshot. Nessuna generation, review action, materializzazione o pubblicazione è presente.

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
- gli eventi draft espongono ID e versione positivi;
- gli altri domini espongono entrambi i campi come `null`;
- il client seleziona per `event_key` e non interpreta `details`;
- CI #217 e CI finale #220 completamente verdi, inclusi D1 locale, `workerd`, Queue/Audit e legacy parity.

Non restano gap read-only noti rispetto alle letture necessarie della legacy. La preview HTML legacy non viene mantenuta come dipendenza visuale: il dettaglio strutturato copre l’ispezione editoriale e una futura preview del sito deve appartenere al renderer pubblico Astro.

La legacy non viene rimossa perché resta il fallback delle mutation operative non ancora migrate.

## Quality evaluation — PR #45 completata

La PR #45 è mergiata nel commit `a918177` e misura il trigger D1 reale con un golden dataset versionato.

Baseline del gate precedente:

```text
true positive:  3
false positive: 1
true negative:  4
false negative: 0
precision:       0.75
recall:          1.00
```

Nessun framework esterno è stato inserito nel Worker. Promptfoo, Evidently, Great Expectations e Cleanlab restano subordinati a un caso d’uso reale e misurabile.

## Topic-mismatch gate — PR #46 mergiata

La PR #46, merge `215470ae`, introduce per i nuovi run research e comparison:

```text
query
→ anchor informative
→ research_runs.topic_anchors_json
→ trigger D1 su title + summary
→ nessun match: filtered + topic_mismatch
```

Proprietà verificate nella CI #188:

- migrazione `0019` valida in D1 locale;
- score zero ancora filtrato;
- risultato estraneo con score `0.2` filtrato con `topic_mismatch`;
- risultato Holafly pertinente con score `0.2` ancora idoneo;
- ingest reale attraverso l'API verificato in `workerd`;
- golden set: `3 TP`, `0 FP`, `5 TN`, `0 FN`;
- precision e recall `1.00` sul dataset versionato;
- Container e tutti gli smoke della Control Room invariati.

Il gate non è ancora dichiarato verificato in produzione finché non viene attestata l’applicazione remota della migrazione `0019`. La prova funzionale completa avverrà sul primo nuovo run autorizzato, senza creare dati artificiali.

## Gap aperti

- verifica browser reale dei linkage claim → task e audit → versione draft;
- health aggregato runtime e log errori unificati restano incompleti;
- refresh automatico delle fonti scadute resta da completare;
- Search Console, CMP e analytics non sono configurati;
- la Control Room legacy non è ancora rimossa perché ospita mutation;
- verifica remota della migrazione `0019` ancora aperta.

## Prossimo checkpoint

```text
definire esplicitamente la prima mutation della Control Room
```

Nessuna mutation viene avviata da questo checkpoint documentale. La capacità scelta dovrà avere branch dedicata, conferma esplicita, idempotenza, audit persistito, reload dello snapshot, gestione degli errori e test end-to-end. La pubblicazione resta fuori scope.

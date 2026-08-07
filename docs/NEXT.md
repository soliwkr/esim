# Prossime azioni

Ultimo aggiornamento: **7 agosto 2026**.

Questa lista contiene soltanto lavoro immediatamente eseguibile e gate già definiti. Non è un changelog.

## Gate corrente — explicit remote source onboarding

La catena di source identity è ora verificata fino al local-first gate.

Checkpoint chiusi:

```text
PR #119  fail-closed source reconciliation
PR #121  target D1 read-only verification
PR #122  local idempotent source onboarding gate
```

Target D1 osservato con PR #121, in due letture indipendenti:

```text
source_registry rows inspected: 7
manifest identities:             9
resolved:                        0
source_not_registered:           9
source_registry_ambiguous:       0
readyForImporter:                false
```

Le 9 identity di reconciliation deduplicano a **8 registry identity D1 uniche** perché due source Ubigi condividono intenzionalmente la stessa canonical commerce identity.

La slice locale della PR #122 ha dimostrato su D1 isolato e migrato:

```text
first run:   8 inserts → 9/9 resolved
second run:  0 inserts → 9/9 resolved
metadata conflict: fail closed
--remote: forbidden
```

### Prossima mutation separata

L'onboarding remoto **non è autorizzato implicitamente** dal local test.

Quando viene autorizzato, la sequenza deve essere:

```text
read-only remote preflight
→ expect 8 missing approved identities and 0 conflicts
→ explicit source_registry onboarding
→ read-only verifier rerun
→ require 9/9 resolved exactly-one
```

La mutation deve usare esclusivamente gli intent versionati in:

```text
research/evidence/source-registry-onboarding-intents.json
```

Regole:

- nessun URL arbitrario;
- nessun auto-registration dall'importer;
- nessun provider-root fallback;
- nessun redirect auto-remap;
- nessun hardcoded environment source ID;
- nessun overwrite automatico di metadata esistenti;
- stessa identity D1 con metadata diversi → block;
- nessuna maintenance queue mutation;
- nessuna remote `0021` apply nella stessa operazione;
- nessun evidence import;
- nessun `claim_verifications` write;
- nessun ranking, publication, affiliate activation o deploy.

Il gate si chiude soltanto con:

```text
9/9 manifest identities
→ exactly one active approved source_registry row ciascuna
```

## Gate successivo — importer idempotente

Soltanto dopo il postcondition remoto `9/9 resolved`.

Contratto previsto:

```text
pack.json + immutable artifacts
→ resolved environment source IDs
→ evidence_capture_runs
→ evidence_snapshots
→ evidence_field_observations
→ pending evidence_claim_candidates
```

Requisiti:

- idempotenza/content-addressed identity;
- artifact hash verificato;
- source ID risolti dall'ambiente, mai hardcoded nel pack;
- `observed` e soltanto il sotto-fatto realmente supportato da `partial` possono alimentare candidate;
- `unknown` e `not_applicable` non diventano factual candidate;
- nessun `claim_verifications` write;
- nessun ranking/publication;
- fixture locale prima di ingest reale.

## Remote D1 schema — gate ulteriore

D1 remoto resta a:

```text
0020
```

`0021_evidence_upstream_storage.sql` è versionata e local-tested ma **non applicata al remoto**.

Sequenza corretta:

```text
remote source onboarding
→ 9/9 source verification
→ importer local/fixture
→ explicit remote 0021 authorization
→ controlled evidence ingest
→ verification provenance bridge
```

Non applicare `0021` come effetto collaterale di onboarding, importer o deploy.

## First Money UI — pronta a ricevere facts

Preview mergiata:

```text
/astro-foundation/articoli/migliore-esim
```

Canonical ancora invariato:

```text
/migliore-esim
```

La preview contiene la struttura consumer-first ma conserva intenzionalmente gli evidence slot non materializzati.

```text
destinazione
→ giorni
→ dati
→ hotspot
→ scenario
→ evidence slots
→ FAQ/obiezioni
→ supporting guides
```

Nessun `/go/*`, provider winner o affiliate claim è live.

### Facts minimi per la prima money page

Per offerte bounded servono almeno:

```text
data amount / unlimited model
validity/duration
hotspot allowed
hotspot share limit when stated
FUP
activation trigger
voice/SMS availability when relevant
source-native price
```

Unknown resta unknown. Nessun FX implicito.

## Percorso diretto verso production SEO + primo click affiliate

Il percorso corrente è:

```text
8 remote source onboarding intents
→ 9/9 source identities resolved
→ importer + controlled evidence ingest
→ verification provenance
→ bounded verified commercial facts
→ materialize facts in First Money UI
→ separate canonical /migliore-esim cutover
→ affiliate + measurement gate
→ explicit production deploy
→ first real affiliate click
```

Quindi il progetto è nella **corsia finale verso il primo click affiliate**, ma il click non è ancora sbloccato.

## First affiliate activation gate

Prima di `AFFILIATE_MODE=enabled`:

1. money page consumer-ready con facts verificati e fresh;
2. affiliate account/provider approval disponibile;
3. `/go/*` destination/redirect validato;
4. disclosure pubblica chiara;
5. `provider_redirect_intent` measurement design accettato;
6. privacy/consent regression rechecked;
7. partner secret/config fuori dal repository;
8. `AFFILIATE_MODE` change esplicito;
9. production deploy manuale autorizzato;
10. live smoke redirect + disclosure + no secret leakage.

Canonical cutover, affiliate activation e deploy restano gate distinti.

## Decisione First Euro — invariata

```text
1  /migliore-esim        ← first existing-URL money slice
2  /esim-europa          ← first new evidence-native money page
3  /codice-sconto-holafly
4  /airalo-recensioni
5  /airalo-vs-holafly
6  /esim-usa
7  /esim-egitto
8  /esim-giappone
9  /esim-turchia
10 /esim-albania
```

`/esim-iphone` resta high-demand compatibility feeder.
`/esim-hotspot` resta problem/setup feeder, non money page automatica.

## Affiliate applications — dipendenza esterna parallela

Provider iniziali:

```text
Airalo
Holafly
Ubigi
```

Non versionare token, secret o partner credentials.

## Search Console feedback loop

Stato noto iniziale:

```text
2026-07-24: 1 impression
clicks: 0
```

Finché il dataset resta minimo:

- non cambiare ownership per rumore;
- non ripetere sitemap submission;
- non usare Indexing API.

Quando emergono query reali, usare:

```text
impressions without clicks
positions 8–20
unexpected query-page matches
new long tails
```

per refresh e priorità.

## Checkpoint aperti

- explicit remote source onboarding delle 8 identity approvate;
- read-only post-verification `9/9`;
- importer idempotente;
- explicit remote `0021` gate;
- controlled ingest;
- verification provenance bridge;
- facts materializzati nella First Money UI;
- canonical cutover separato `/migliore-esim`;
- affiliate approval/config + measurement gate;
- first explicit production deploy money-ready;
- first real affiliate click;
- `/esim-europa`;
- M7.2 bounded social test;
- consumer-first homepage/hub;
- `www → apex` definitivo.

## Freeze

- niente remote source onboarding senza autorizzazione esplicita;
- niente remote `0021` apply senza gate esplicito;
- niente importer prima del `9/9` remoto;
- niente source auto-registration;
- niente metadata overwrite automatico;
- niente FX implicito;
- niente `unknown → false/0/[]`;
- niente ranking/provider winner universale;
- niente affiliate secret versionato;
- niente tracking non consentito;
- niente deploy automatico;
- niente pubblicazione autonoma dell'AI.

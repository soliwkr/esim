# Prossime azioni

Ultimo aggiornamento: **7 agosto 2026**.

Questa lista contiene soltanto lavoro immediatamente eseguibile e gate già definiti. Non è un changelog.

## Gate corrente — importer idempotente local/fixture

La catena source identity è ora chiusa anche nel target production.

Checkpoint chiusi:

```text
PR #119  fail-closed source reconciliation
PR #121  target D1 read-only verification
PR #122  local idempotent source onboarding gate
remote run 31205724615  production source onboarding
```

Stato target verificato dopo la mutation:

```text
source_registry rows inspected: 15
manifest identities:             9
resolved:                        9
source_not_registered:           0
source_registry_ambiguous:       0
readyForImporter:                true
```

Il source gate production è quindi chiuso:

```text
8 approved D1 registry identities
→ 9/9 reconciliation identities exactly-one
```

Documento risultato:

```text
docs/research/EVIDENCE-SOURCE-REGISTRY-REMOTE-ONBOARDING-RESULT-2026-08-07.md
```

### Obiettivo della prossima branch tecnica

Costruire e provare **solo localmente / su fixture** un importer idempotente:

```text
pack.json + immutable artifacts
→ resolved environment source IDs
→ evidence_capture_runs
→ evidence_snapshots
→ evidence_field_observations
→ pending evidence_claim_candidates
```

Requisiti non negoziabili:

- input limitato ai pack/artifact già approvati;
- artifact hash verificato prima di importare;
- source IDs risolti tramite il resolver e l'ambiente/fixture, mai hardcodati nei pack;
- idempotency/content-addressed identity esplicita;
- rerun dello stesso pack → zero duplicati;
- `observed` può alimentare candidate;
- `partial` alimenta soltanto il sotto-fatto realmente supportato;
- `unknown` e `not_applicable` non diventano factual candidate;
- conflict resta conflict;
- source-native currency resta source-native, nessun FX implicito;
- nessun `claim_verifications` write;
- nessun ranking/provider winner;
- nessuna publication mutation;
- nessun deploy;
- nessuna remote `0021` apply come effetto collaterale;
- nessun ingest D1 remoto in questa branch.

Il gate importer locale si chiude soltanto con fixture/migration locale che dimostri almeno:

```text
first import  → expected upstream rows
second import → zero duplicate semantic rows
hash/source mismatch → fail closed
unknown/partial guards → preserved
```

## Remote D1 schema — gate separato successivo

D1 remoto resta a:

```text
0020
```

`0021_evidence_upstream_storage.sql` è versionata e local-tested ma **non applicata al remoto**.

Dopo l'importer local/fixture verde:

```text
explicit remote 0021 authorization
→ verify migration apply
→ controlled evidence ingest
→ post-ingest verification
→ verification provenance bridge
```

Non applicare `0021` come effetto collaterale dell'importer, del deploy o di altri workflow.

La precedente autorizzazione dell'8-source onboarding **non autorizza** la migration `0021` né l'evidence ingest remoto.

## Controlled evidence ingest — dopo `0021`

Solo dopo migration remota esplicitamente autorizzata e verificata:

```text
approved Italy/Europe packs
→ importer contro target
→ upstream evidence rows
→ deterministic post-ingest audit
```

Il controlled ingest deve essere una mutation separata, bounded e auditabile.

Non scrive automaticamente `claim_verifications` e non pubblica pagine.

## Verification provenance bridge

Dopo l'ingest upstream, collegare candidate/evidence al ciclo editoriale esistente senza saltare i gate:

```text
pending evidence candidate
→ human/system verification gate
→ verified/contradicted/expired state
→ evidence bundle
→ Page Readiness
→ grounded materialization
```

Un evidence candidate non equivale a un claim verificato.

## First Money UI — pronta a ricevere facts

Preview mergiata:

```text
/astro-foundation/articoli/migliore-esim
```

Canonical ancora invariato:

```text
/migliore-esim
```

La preview contiene la struttura consumer-first ma conserva gli evidence slot non materializzati.

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

Gate completati:

```text
source reconciliation            ✅
target source verification       ✅
local source onboarding          ✅
production source onboarding 9/9 ✅
```

Percorso restante:

```text
importer local/fixture
→ explicit remote 0021
→ controlled evidence ingest
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

- importer idempotente local/fixture;
- explicit remote `0021` gate;
- controlled evidence ingest;
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

- niente remote `0021` apply senza nuova autorizzazione esplicita;
- niente controlled ingest remoto senza scope/autorizzazione separati;
- niente source auto-registration;
- niente metadata overwrite automatico;
- niente FX implicito;
- niente `unknown → false/0/[]`;
- niente ranking/provider winner universale;
- niente affiliate secret versionato;
- niente tracking non consentito;
- niente deploy automatico;
- niente pubblicazione autonoma dell'AI.

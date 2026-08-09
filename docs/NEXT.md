# Prossime azioni

Ultimo aggiornamento: **9 agosto 2026**.

## Gate corrente — durable evidence artifact provenance

La catena source identity, importer locale e schema remoto è chiusa.

Checkpoint completati:

```text
PR #119  fail-closed source reconciliation
PR #121  target D1 read-only verification
PR #122  local source onboarding gate
run 31205724615  production source onboarding 9/9
PR #124  idempotent evidence importer local/fixture
PR #125  explicit remote 0021 migration gate
run 31260773468  remote 0021 apply + schema verification
PR #126  remote 0021 canonical closeout
CI #660  post-merge main green
```

Production state:

```text
source_registry rows: 15
manifest identities: 9
resolved:            9
missing:             0
ambiguous:           0
remote migration:    0021
upstream tables:     4/4
indexes:             7/7
triggers:            9/9
upstream evidence:   not ingested
```

## Blocker scoperto prima del controlled ingest

`evidence_snapshots.artifact_ref` deve puntare a raw bytes persistenti e verificabili. Il mapping #108 aveva lasciato deliberatamente aperta la scelta dello storage.

I bundle originali Italy/Europe #106/#107 erano inoltre locali e ignorati da Git. Non risultano presenti nel repository o negli artifact delle CI storiche.

Recovery read-only tentato il 9 agosto 2026:

```text
run: 31313829528
Italy capture: fail-closed
reason: ubigi-italy-plan HTTP 403
complete pack artifact: none
remote D1 mutation: none
```

Non ricostruire i pack dalla documentazione e non usare diagnostici parziali come raw evidence.

## Artifact storage foundation — gate corrente

Decisione:

```text
private Cloudflare R2
+ SHA-256 content-addressed keys
+ create-only conditional writes
+ no overwrite/delete nel percorso operativo
```

Contratto:

```text
raw:  v1/raw/sha256/<prefix>/<digest>.<extension>
pack: v1/packs/sha256/<prefix>/<digest>.json
ref:  r2://evidence-artifacts/<object-key>
```

R2 non viene dichiarato WORM/Object Lock; l'immutabilità è applicativa/content-addressed.

Documento:

```text
docs/research/EVIDENCE-ARTIFACT-STORAGE.md
research/evidence/artifact-storage-policy.json
```

### Prossimi passi immediati

```text
artifact storage contract CI
→ merge design gate
→ explicit remote R2 provisioning authorization
→ provision private evidence bucket/config
→ verify create-only upload/read/checksum path
→ recover original bundle OR approve replacement captures
```

Il provisioning R2 è una mutation infrastrutturale separata e non è autorizzato dalla branch di design.

## Controlled ingest — gate successivo, ancora bloccato

Il controlled ingest è già definito ma non può essere eseguito finché non esistono artifact raw approvati e persistenti.

Sequenza futura:

```text
read-only remote D1 preflight
→ source resolution 9/9
→ exact approved Italy/Europe pack verification
→ stage exact pack + raw bytes in R2
→ verify every artifact_ref/hash
→ idempotency/drift preflight
→ atomic bounded D1 batch
→ deterministic post-ingest audit
```

Cloudflare D1 batch è il percorso previsto per l'atomicità multi-statement; non usare `BEGIN TRANSACTION` remoto, già incompatibile con il percorso Wrangler sperimentato.

Scope:

- una coppia Italy/Europe esplicitamente approvata;
- write soltanto in `evidence_capture_runs`, `evidence_snapshots`, `evidence_field_observations`, `evidence_claim_candidates`;
- nessuna source auto-registration;
- nessun metadata overwrite;
- nessun `claim_verifications` write;
- nessun `plans` write;
- nessun ranking o provider winner;
- nessuna pubblicazione, canonical cutover, affiliate activation o deploy;
- rerun soltanto exact/idempotent.

### Stop conditions ingest

Fermarsi prima delle write D1 se:

- artifact storage non è persistente/risolvibile;
- pack/raw bytes non sono disponibili integralmente;
- pack identity non è esplicitamente approvata;
- source resolution non è 9/9;
- artifact hash o candidate content-address non coincidono;
- il target contiene stato parziale o chiave driftata;
- esistono righe upstream inattese;
- lo scope richiede una mutation fuori dalle quattro tabelle upstream.

I conteggi fixture attesi sono:

```text
2 capture runs
12 snapshots
18 field observations
8 pending candidates
```

ma il gate production deve confermarli dai pack reali, non assumerli.

## Gate successivo — verification provenance bridge

Dopo ingest riuscito:

```text
pending evidence candidate
→ human/system verification gate
→ verified / contradicted / expired
→ evidence bundle
→ Page Readiness
→ grounded materialization
```

Un pending candidate non è un claim verificato.

`partial` resta partial; `unknown` resta unknown; conflict non viene nascosto.

## First Money UI

Preview:

```text
/astro-foundation/articoli/migliore-esim
```

Canonical ancora invariata:

```text
/migliore-esim
```

La preview contiene la struttura consumer-first ma conserva gli evidence slot non materializzati. Nessun `/go/*`, provider winner o affiliate claim è live.

Facts minimi bounded:

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

## Percorso verso production SEO + primo click affiliate

Completati:

```text
source reconciliation ✅
production source onboarding 9/9 ✅
local/fixture importer ✅
remote 0021 ✅
```

Corrente:

```text
durable artifact provenance
```

Restante:

```text
R2 provenance gate
→ approved raw pack availability
→ controlled evidence ingest
→ verification provenance
→ bounded verified commercial facts
→ materialize First Money UI
→ separate canonical /migliore-esim cutover
→ affiliate + measurement gate
→ explicit production deploy
→ first real affiliate click
```

## First affiliate activation gate

Prima di `AFFILIATE_MODE=enabled`:

1. money page con facts verificati e fresh;
2. affiliate account/provider approval;
3. `/go/*` destination/redirect validato;
4. disclosure pubblica chiara;
5. `provider_redirect_intent` measurement design;
6. privacy/consent regression rechecked;
7. partner secret/config fuori dal repository;
8. change esplicito di `AFFILIATE_MODE`;
9. deploy production manuale autorizzato;
10. live smoke redirect + disclosure + no secret leakage.

Canonical cutover, affiliate activation e deploy restano gate distinti.

## Decisione First Euro

```text
1  /migliore-esim
2  /esim-europa
3  /codice-sconto-holafly
4  /airalo-recensioni
5  /airalo-vs-holafly
6  /esim-usa
7  /esim-egitto
8  /esim-giappone
9  /esim-turchia
10 /esim-albania
```

`/esim-iphone` resta compatibility feeder.
`/esim-hotspot` resta problem/setup feeder.

## Freeze

- niente R2 provisioning remoto senza autorizzazione esplicita;
- niente controlled ingest con artifact effimeri/non risolvibili;
- niente ricostruzione dei pack storici da documentazione;
- niente replacement capture approvata implicitamente;
- niente claim verification automatica;
- niente source auto-registration;
- niente metadata overwrite automatico;
- niente FX implicito;
- niente `unknown → false/0/[]`;
- niente ranking/provider winner universale;
- niente affiliate secret versionato;
- niente tracking non consentito;
- niente deploy automatico;
- niente pubblicazione autonoma dell'AI.

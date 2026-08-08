# Prossime azioni

Ultimo aggiornamento: **8 agosto 2026**.

## Gate corrente — controlled evidence ingest

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
```

Nessun evidence pack è stato ancora importato nel D1 remoto.

Documenti risultato:

```text
docs/research/EVIDENCE-SOURCE-REGISTRY-REMOTE-ONBOARDING-RESULT-2026-08-07.md
docs/research/EVIDENCE-PACK-IMPORTER-LOCAL-RESULT-2026-08-08.md
docs/research/EVIDENCE-REMOTE-0021-RESULT-2026-08-08.md
```

## Controlled ingest — prossimo gate separato

Richiede nuova autorizzazione esplicita.

Sequenza:

```text
read-only remote preflight
→ source resolution 9/9
→ verify approved Italy/Europe artifacts
→ idempotency/drift preflight
→ bounded remote ingest
→ deterministic post-ingest audit
```

Scope:

- soltanto i pack Italy e Europe già approvati;
- write soltanto in `evidence_capture_runs`, `evidence_snapshots`, `evidence_field_observations`, `evidence_claim_candidates`;
- nessuna source auto-registration;
- nessun metadata overwrite;
- nessun `claim_verifications` write;
- nessun `plans` write;
- nessun ranking o provider winner;
- nessuna pubblicazione, canonical cutover, affiliate activation o deploy;
- rerun soltanto se semanticamente exact e a zero insert.

### Stop conditions

Fermarsi prima delle write se:

- source resolution non è 9/9;
- artifact hash o candidate content-address non coincidono;
- il target contiene uno stato parziale o una chiave esistente driftata;
- i pack differiscono da quelli approvati;
- esistono righe upstream inattese;
- lo scope richiede una mutation fuori dalle quattro tabelle upstream.

Dopo le write verificare:

```text
2 capture runs
12 snapshots
18 field observations
8 pending candidates
```

I numeri sono attesi dal fixture gate, ma devono essere confermati dai pack reali e non assunti.

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

Restante:

```text
controlled evidence ingest
→ verification provenance
→ bounded verified commercial facts
→ materialize First Money UI
→ separate canonical /migliore-esim cutover
→ affiliate + measurement gate
→ explicit production deploy
→ first real affiliate click
```

Il progetto è nella corsia finale, ma il click affiliate non è ancora sbloccato.

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

- niente controlled ingest remoto senza nuova autorizzazione esplicita;
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

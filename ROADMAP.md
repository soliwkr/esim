# Senza Roaming — Roadmap

Ultimo aggiornamento: **9 agosto 2026**.

## Principi non negoziabili

1. L'AI non pubblica direttamente.
2. Brief, claim, readiness, draft, materializzazione e pubblicazione sono gate distinti.
3. I fatti commerciali richiedono fonti identificabili e data di verifica.
4. Claim insufficienti, contraddetti o scaduti non alimentano testo fattuale.
5. `partial` e `unknown` restano stati reali.
6. Il browser non accede direttamente a D1.
7. Ogni mutation richiede identità verificata, audit e test.
8. Astro è il frontend pubblico; React resta nelle island interattive.
9. Preview, release candidate e published restano distinti.
10. Tracking non essenziale soltanto con il consenso previsto.
11. GitHub è la memoria canonica.
12. Domanda SEO e monetizzazione non autorizzano claim senza evidence.
13. Evidence production non è completa se il raw artifact referenziato non è persistente, risolvibile e protetto dal contratto di retention previsto.

## M0–M6

- **M0 Fondazioni tecniche:** completato salvo checkpoint `www → apex`.
- **M1 Qualità e osservabilità:** quality gate operativo.
- **M2 Motore AI editoriale:** nucleo v1 operativo.
- **M3 Readiness e draft grounded:** completato e verificato.
- **M4 Control Room:** read-only completo; mutation residue aperte.
- **M5 Frontend pubblico Astro:** completato e verificato live.
- **M6 Misurazione e indicizzazione:** CMP, GTM, GA4 e GSC live; Ads e affiliate tracking disabilitati.

## M7 — Intelligence SEO, Demand e First Euro

**Stato:** demand intelligence completata; First Money UI pronta come preview; Truth Engine al gate durable locked artifact provenance prima del controlled ingest.

### SEO e demand

Completati:

- 1.623 keyword Planner uniche;
- ownership/cannibalization/internal linking;
- homepage, hub e `/migliore-esim` riallineati;
- GSC exporter read-only;
- First Euro demand intelligence;
- priorità #1 `/migliore-esim`, #2 `/esim-europa`.

### First Money UI

PR #117 mergiata.

Preview:

```text
/astro-foundation/articoli/migliore-esim
```

Canonical `/migliore-esim` invariata.

La preview è noindex/no-store e non contiene `/go/*`, ranking universali, claim non verificati, publication mutation o deploy.

## Evidence Truth Engine

### Checkpoint completati

```text
#103 source universe
#104 immutable snapshot spike
#105 claims coverage
#106 Italy evidence pack
#107 Europe evidence pack
#108 D1 mapping design
#109 canonical closeout
#110 upstream evidence schema foundation
#119 fail-closed source reconciliation
#121 target source_registry verification
#122 local source onboarding gate
run 31205724615 production source onboarding 9/9
#124 idempotent evidence importer local/fixture
#125 explicit remote 0021 migration gate
run 31260773468 remote 0021 apply + schema verification
#126 remote 0021 canonical closeout
CI #660 post-merge main green
#127 durable artifact storage foundation
```

### Production source state

```text
source_registry rows: 15
manifest identities: 9
resolved:            9
missing:             0
ambiguous:           0
```

### Importer local/fixture

Verificato:

```text
first import: 2 runs / 12 snapshots / 18 observations / 8 candidates
exact rerun:  0 / 0 / 0 / 0
```

Fail-closed su source resolution, artifact hash, candidate content-address, existing-key drift e partial state. Nessun FX implicito, auto-registration, claim write o publication.

### Upstream schema production

Remote D1 è allineato a:

```text
0021_evidence_upstream_storage.sql
```

Run `31260773468` ha verificato:

```text
preflight: 0001–0020 applicate, sole pending 0021
post-apply: 21 migration
             4 tabelle
             7 indici
             9 trigger
```

Documento:

```text
docs/research/EVIDENCE-REMOTE-0021-RESULT-2026-08-08.md
```

Nessun evidence pack è stato importato nello stesso gate.

### Gate emerso — durable locked artifact provenance

Il design #108 richiede che `evidence_snapshots.artifact_ref` sia risolvibile insieme al raw hash, ma non aveva ancora scelto lo storage persistente. I pack #106/#107 erano inoltre artifact locali ignorati da Git.

PR #127 ha scelto Cloudflare R2 privato con content addressing. Una verifica successiva della documentazione Cloudflare corrente ha chiarito che, pur non essendo implementato S3 Object Lock nella API S3-compatible, R2 offre **Bucket Locks nativi** che possono impedire overwrite/delete anche indefinitamente.

Contratto corretto:

```text
private Cloudflare R2
+ content-addressed SHA-256 keys
+ create-only conditional writes
+ native R2 Bucket Lock Indefinite su v1/
+ no overwrite/delete nel percorso operativo
```

Forma:

```text
raw:  r2://evidence-artifacts/v1/raw/sha256/<prefix>/<digest>.<ext>
pack: r2://evidence-artifacts/v1/packs/sha256/<prefix>/<digest>.json
```

Lock canonica:

```text
id:        evidence-v1-indefinite
prefix:    v1/
enabled:   true
condition: Indefinite
```

Il gate production deve inoltre richiedere:

```text
r2.dev disabled
zero custom domains
```

Non viene dichiarata equivalenza con legal hold/WORM irrevocabile: un amministratore Cloudflare autorizzato può modificare la configurazione della lock rule.

Questa fase resta locale/design-only finché non viene autorizzato il provisioning remoto del bucket.

Documento:

```text
docs/research/EVIDENCE-ARTIFACT-STORAGE.md
```

### Artifact recovery

I bundle originali `pack.json + sources/` Italia/Europa non risultano presenti nel repository o negli artifact CI storici.

Recovery read-only tentato il 9 agosto 2026:

```text
run 31313829528
Italy: ubigi-italy-plan HTTP 403
complete recovery artifact: none
D1 mutation: none
```

Il 403 non viene bypassato con scraping alternativo. Un nuovo pack con raw identity differente non è automaticamente approvato anche se il semantic fingerprint storico coincide.

Documento:

```text
docs/research/EVIDENCE-PACK-RECOVERY-RESULT-2026-08-09.md
```

### Gate corrente

```text
correct native-bucket-lock contract CI
→ explicit remote R2 provisioning authorization
→ create/verify private bucket
→ disable/verify r2.dev + zero custom domains
→ install/verify indefinite native bucket lock on v1/
→ recover original Italy/Europe bundles OR approve replacement captures
→ stage exact pack + raw bytes in R2
```

### Gate successivo — controlled evidence ingest

Solo dopo artifact provenance completa:

```text
approved Italy + Europe packs
→ read-only remote D1 preflight
→ source resolution 9/9
→ verify exact R2 lock/provenance
→ artifact/candidate identity verification
→ atomic bounded D1 ingest
→ deterministic post-ingest audit
```

Non deve scrivere `claim_verifications`, `plans` o altre tabelle fuori dalle quattro upstream evidence tables. Nessun ranking, publication, canonical cutover, affiliate activation o deploy.

### Gate successivi

```text
controlled evidence ingest
→ verification provenance bridge
→ bounded verified commercial facts
→ First Money UI materialization
```

Un evidence candidate non equivale a un claim verificato.

## M8 — Monetizzazione controllata

**Stato:** non attiva.

Obiettivo:

```text
first verified money page
→ first affiliate redirect
→ first attributed sale
→ first euro
```

Percorso:

```text
source gate 9/9 ✅
local importer ✅
remote 0021 ✅
→ durable locked artifact provenance
→ controlled evidence ingest
→ verified commercial facts
→ canonical /migliore-esim
→ affiliate + measurement gate
→ explicit production deploy
→ first affiliate click
```

Prima di `AFFILIATE_MODE=enabled` servono facts verified/fresh, account affiliate approvato, redirect `/go/*`, disclosure, measurement design, privacy recheck, secret fuori repo, change esplicito e live smoke.

## M9 — Crescita e manutenzione

Dopo la prima vertical slice misurata:

- weekly demand loop;
- GSC opportunities;
- source freshness/refresh;
- commercial drift monitoring;
- expansion basata su impressions, click e revenue;
- pSEO soltanto dopo prova di qualità.

## Ordine operativo corrente

### Track A — Traffic & Money

```text
First Money preview
→ bounded verified facts
→ canonical /migliore-esim
→ affiliate/measurement gate
→ explicit deploy
→ first affiliate click
→ /esim-europa
```

### Track B — Truth Engine

```text
source reconciliation ✅
→ production onboarding 9/9 ✅
→ local importer ✅
→ remote 0021 ✅
→ durable locked artifact provenance
→ controlled ingest
→ verification provenance
→ facts per First Money UI
```

### Track C — Operations

```text
M4 mutation residue
+ GSC/GA4 observation
+ www redirect checkpoint
```

## Stop conditions

Non fare adesso:

- provisioning R2 remoto senza autorizzazione separata;
- artifact production senza native Bucket Lock canonica;
- controlled ingest con artifact effimeri/non risolvibili;
- ricostruzione dei pack storici da documentazione o diagnostici parziali;
- replacement capture promossa implicitamente ad approved pack;
- claim verification automatica;
- mass pSEO;
- terzo scenario evidence senza blocker strutturale;
- ranking/provider winner universale;
- affiliate activation senza disclosure/evidence/measurement;
- deploy automatico;
- social publishing autonomo;
- FX implicito;
- claim performance da community anecdotes.

Il valore resta misurabile come:

```text
impression → click → affiliate redirect → sale → revenue
```

senza abbassare il livello di verità commerciale.

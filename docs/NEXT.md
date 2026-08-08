# Prossime azioni

Ultimo aggiornamento: **8 agosto 2026**.

Questa lista contiene soltanto lavoro immediatamente eseguibile e gate già definiti. Non è un changelog.

## Gate corrente — explicit remote `0021`

La catena source identity e il gate importer local/fixture sono chiusi.

Checkpoint chiusi:

```text
PR #119  fail-closed source reconciliation
PR #121  target D1 read-only verification
PR #122  local idempotent source onboarding gate
remote run 31205724615  production source onboarding 9/9
PR #124  idempotent evidence importer local/fixture
```

Production source state verificato:

```text
source_registry rows inspected: 15
manifest identities:             9
resolved:                        9
source_not_registered:           0
source_registry_ambiguous:       0
readyForImporter:                true
```

Importer local/fixture verificato:

```text
first import:
  2 runs
  12 snapshots
  18 observations
  8 pending candidates

exact rerun:
  0 runs
  0 snapshots
  0 observations
  0 candidates
```

Documenti risultato:

```text
docs/research/EVIDENCE-SOURCE-REGISTRY-REMOTE-ONBOARDING-RESULT-2026-08-07.md
docs/research/EVIDENCE-PACK-IMPORTER-LOCAL-RESULT-2026-08-08.md
```

## Remote D1 schema — prossimo gate separato

D1 remoto resta a:

```text
0020
```

`0021_evidence_upstream_storage.sql` è versionata e local-tested ma **non applicata al remoto**.

Il prossimo passo richiede una nuova autorizzazione esplicita:

```text
read-only remote migration preflight
→ explicit remote 0021 apply
→ verify remote migration state
→ verify upstream tables/constraints
```

Non applicare `0021` come effetto collaterale dell'importer, del deploy o di altri workflow.

Le autorizzazioni precedenti per source onboarding e importer locale **non autorizzano** la migration `0021`.

### Condizioni di stop

Prima della mutation remota:

- rileggere main e i canonici aggiornati;
- verificare che il target D1 sia ancora a `0020`;
- verificare la migration `0021` esatta versionata in main;
- verificare che non esistano migration remote inattese;
- se lo stato differisce dalle precondizioni, fermarsi senza mutation.

Dopo l'apply:

- rileggere lo stato migration remoto;
- verificare esistenza e schema delle quattro tabelle upstream;
- non importare pack nello stesso gate;
- documentare il risultato remoto separatamente.

## Controlled evidence ingest — gate successivo a `0021`

Solo dopo migration remota esplicitamente autorizzata e verificata:

```text
approved Italy/Europe packs
→ separately authorized importer run contro target
→ upstream evidence rows
→ deterministic post-ingest audit
```

Il controlled ingest deve essere una mutation separata, bounded e auditabile.

Requisiti:

- soltanto i pack Italy/Europe già approvati;
- source resolution 9/9 prima delle write;
- artifact/candidate identity fail-closed;
- idempotency preflight;
- nessun auto-registration;
- nessun `claim_verifications` write;
- nessun ranking/publication;
- post-ingest count/identity audit;
- rerun eventuale soltanto se semanticamente exact.

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

`partial` resta partial; `unknown` resta unknown; conflict non viene nascosto.

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
local/fixture evidence importer  ✅
```

Percorso restante:

```text
explicit remote 0021
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

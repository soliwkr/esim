# Evidence R2 provisioning gate

Data: **12 agosto 2026**.

## Scopo

Questo gate prepara la sola capacità operativa necessaria a leggere, creare e verificare in modo controllato lo storage raw della Truth Engine.

Non esegue automaticamente il provisioning al merge e non autorizza:

- upload di evidence artifact;
- ingest D1;
- `claim_verifications`;
- materializzazione della money page;
- affiliate activation;
- deploy production.

Il preflight remoto è read-only. Il provisioning remoto resta una mutation infrastrutturale esplicita e separata.

## Target canonico

Logical store usato negli `artifact_ref`:

```text
evidence-artifacts
```

Bucket Cloudflare R2 reale:

```text
senza-roaming-evidence-artifacts
```

Configurazione richiesta:

```text
jurisdiction: default
storage class: Standard
r2.dev: disabled
custom domains: 0
protected prefix: v1/
```

Native Bucket Lock obbligatoria:

```text
id:        evidence-v1-indefinite
prefix:    v1/
enabled:   true
condition: Indefinite
```

Policy versionata:

```text
research/evidence/r2-provisioning-policy.json
```

## Workflow

Workflow manual-only:

```text
.github/workflows/evidence-r2-provisioning.yml
```

Richiede:

```text
operation = preflight | provision
expected_main_sha = <exact main SHA>
```

`confirmation` è intenzionalmente separata:

```text
preflight  → confirmation deve essere vuota
provision  → confirmation deve essere PROVISION_EVIDENCE_R2
```

Questo impedisce che un run autorizzato soltanto per ispezione read-only possa proseguire per errore alla mutation.

Il workflow verifica che:

- sia stato lanciato da `main`;
- il checkout coincida esattamente con `expected_main_sha`;
- `operation` sia `preflight` oppure `provision`;
- `preflight` abbia confirmation vuota;
- `provision` abbia la confirmation string esatta;
- le credenziali Cloudflare necessarie siano presenti senza stamparle.

Il workflow non ha trigger `push` e non viene invocato dalla CI normale.

## Operazione `preflight` — read-only

`preflight` esegue soltanto letture Cloudflare R2 e produce:

```text
artifacts/evidence-r2-preflight.json
```

Non esegue lo step di provisioning né la verifica post-mutation.

### Bucket assente

È l'unico stato eleggibile per un futuro percorso create:

```text
GET target bucket
→ 404
→ readyToProvision=true
```

Il preflight si chiude qui. Non crea il bucket.

### Bucket già esistente e perfettamente compatibile

Il risultato è un no-op verificato:

```text
exact private bucket
+ r2.dev disabled
+ zero custom domains
+ zero protected lifecycle deletes
+ exact canonical lock
→ alreadyProvisioned=true
→ no mutation
```

### Bucket già esistente ma driftato

Il gate fallisce chiuso senza tentare repair automatico.

Stop conditions:

```text
wrong jurisdiction
wrong storage class
r2.dev enabled
one or more custom domains
missing lock
extra/different lock
lifecycle delete overlapping v1/
```

Non vengono introdotte mutation di repair perché cambiare accesso pubblico, lifecycle o retention di un bucket già esistente richiede un gate amministrativo distinto.

## Operazione `provision` — mutation separatamente autorizzabile

`provision` richiede la confirmation esatta `PROVISION_EVIDENCE_R2` oltre allo SHA di `main`.

Se il target è assente, il percorso ammesso è strettamente:

```text
POST create bucket
→ read-only state verification before lock
→ PUT exact native Bucket Lock
→ read-only final verification
```

Se il bucket è già esistente e perfettamente compatibile, il percorso diventa un no-op verificato.

Non sono presenti nel percorso:

```text
DELETE
object upload
r2.dev enable/disable mutation
custom-domain mutation
lifecycle mutation
D1 write
Worker deploy
```

Il bucket nuovo deve risultare già privato. Se, dopo la create, `r2.dev` risultasse attivo o comparisse qualunque altro drift, il gate fallisce prima della lock mutation invece di tentare una correzione implicita.

## Lifecycle boundary

Il namespace evidence protetto è:

```text
v1/
```

Una lifecycle delete rule è incompatibile se il suo prefix si sovrappone a `v1/`, incluso:

```text
prefix vuoto
v1/
v1/raw/
v1/packs/
```

Una lifecycle rule su un namespace completamente diverso può coesistere, purché non indebolisca `v1/`.

## Audit artifact

I run conservano per 30 giorni soltanto gli artifact prodotti dall'operazione scelta.

Possibili file:

```text
artifacts/evidence-r2-preflight.json
artifacts/evidence-r2-provisioning.json
artifacts/evidence-r2-result.json
```

Gli artifact contengono soltanto stato sanitizzato:

- target bucket name;
- jurisdiction/storage class;
- managed public access boolean;
- custom domain count;
- lock rules;
- eventuali lifecycle delete incompatibili.

Non contengono API token o secret.

## Smoke contract

```text
scripts/smoke-evidence-r2-provisioning-gate.mjs
```

La fixture Cloudflare prova:

1. bucket assente → preflight read-only;
2. bucket compatibile → provisioning no-op read-only;
3. public/custom-domain/lock/storage/jurisdiction/lifecycle drift → fail before writes;
4. bucket assente → esattamente `POST bucket` + `PUT lock` nel percorso provision;
5. nessun `DELETE`, object upload o domain mutation;
6. bucket appena creato che risulta inaspettatamente pubblico → stop prima della lock;
7. stesso default `fetch` usato dal percorso CLI/workflow;
8. workflow manual-only con `operation`, SHA esatto e confirmation richiesta soltanto per `provision`.

Lo smoke viene eseguito dalla CI standard dentro `smoke:runtime` e non contatta Cloudflare reale.

## Gate successivo

Dopo merge e CI post-merge verde, il primo passo remoto consentito è soltanto:

```text
operation=preflight
→ exact current main SHA
→ confirmation vuota
→ read-only R2 state audit
```

Dal risultato:

```text
absent      → nuova autorizzazione esplicita necessaria prima di provision
compatible  → nessuna mutation R2 necessaria
blocked     → stop; nessun repair implicito
```

Anche dopo un eventuale provisioning riuscito, nello stesso run non vengono caricati pack/raw artifact e non viene eseguito controlled evidence ingest.

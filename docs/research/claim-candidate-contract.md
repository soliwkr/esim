# Claim candidate contract

Data audit: **3 agosto 2026**.

## Scopo

Un claim candidate è un **dato proposto e ancora non verificato** derivato da uno specifico evidence snapshot.

Non è:

- un `claim_verification`;
- un fatto pubblicabile;
- un testo editoriale;
- un ranking input affidabile per default;
- un'autorizzazione alla pubblicazione.

Il contratto serve a impedire che estrazione, verifica e pubblicazione vengano fuse in un unico passaggio.

```text
snapshot
→ datum estratto
→ claim candidate
→ verifica/conflitto/freshness
→ claim verificato
→ evidence bundle
```

## 1. Forma minima

Schema concettuale:

```json
{
  "candidateKey": "sha256:...",
  "snapshotId": "snapshot:...",
  "subjectType": "plan",
  "subjectKey": "provider:plan:destination",
  "fieldName": "hotspot_policy",
  "scope": {
    "provider": "...",
    "plan": "...",
    "destination": "...",
    "deviceModel": null,
    "deviceRegion": null
  },
  "rawValue": "...",
  "normalizedValue": {},
  "evidenceLocator": {},
  "observedAt": "2026-08-03T00:00:00Z",
  "proposedValidUntil": "...",
  "extractorId": "...",
  "extractorVersion": "...",
  "sourceRole": "product_page",
  "warnings": [],
  "status": "pending"
}
```

In questa fase lo schema è documentale e non viene materializzato in D1.

## 2. Identità e deduplica

La candidate key deve dipendere almeno da:

```text
snapshot identity
subject type + subject key
field name
scope canonicalizzato
raw value
normalized value
extractor version
```

Lo stesso snapshot e lo stesso estrattore non devono produrre duplicati semanticamente identici.

Una nuova cattura dello stesso URL può invece produrre una candidate nuova quando il dato è cambiato.

## 3. Status

Il candidato nasce sempre:

```text
pending
```

Stati futuri ammissibili a livello concettuale:

```text
pending
accepted_for_verification
rejected_extraction
superseded
```

Non usare `verified`, `published` o equivalenti nel layer candidate: appartengono a gate successivi già esistenti.

## 4. Subject e scope

Il subject deve essere coerente con il modello esistente:

```text
provider
destination
plan
device
page
policy
```

Per facts ad alta variabilità, `plan` deve prevalere su `provider`.

Esempio sbagliato:

```text
subject=provider:holafly
field=hotspot_policy
value=true
```

quando la fonte dichiara che la quantità condivisibile dipende dal piano/destinazione.

Esempio corretto:

```text
subject=plan:<stable-plan-key>
scope.provider=holafly
scope.destination=<country>
field=hotspot_policy
```

## 5. Field iniziali compatibili con il repository

Il maintenance layer esistente cita già:

```text
price_eur
validity_days
data_gb
unlimited_policy
hotspot_policy
fair_use_policy
activation_policy
refund_policy
network
device_compatibility
```

L'audit non rinomina questi field in D1.

Per una pipeline futura è però necessario evitare di comprimere proprietà differenti nello stesso valore opaco.

### Price

Candidate normalizzata:

```json
{
  "amount": 29,
  "currency": "USD"
}
```

Regole:

- non inferire la valuta dal dominio;
- non convertire valuta nella candidate originale;
- preservare price context, locale e destination;
- eventuale prezzo precedente barrato è un field separato, non il prezzo corrente per default.

### Data allowance

```json
{
  "quantity": 50,
  "unit": "GB"
}
```

Per unlimited:

```json
{
  "unlimited": true
}
```

ma `fair_use_policy` resta separato e obbligatorio prima di usare formulazioni assolute come "senza limiti".

### Validity

```json
{
  "duration": 30,
  "unit": "day",
  "activationTrigger": "first_supported_network_connection"
}
```

Se la fonte non chiarisce il trigger, non inventarlo.

### Hotspot

```json
{
  "allowed": true,
  "shareLimit": null,
  "shareLimitUnit": null,
  "sharePeriod": null
}
```

`allowed=true` è insufficiente quando la fonte segnala limiti giornalieri plan-specific; in quel caso la candidate deve contenere warning `exact_limit_missing`.

### Network

```json
{
  "operators": ["..."],
  "technologies": ["4G", "5G"]
}
```

È una dichiarazione di rete/coverage pubblicata dalla fonte, non una misurazione di performance.

### Device compatibility

```json
{
  "model": "...",
  "region": "...",
  "esimCapable": true
}
```

La regione/versione hardware non può essere scartata quando manufacturer o provider dichiarano eccezioni geografiche.

## 6. Evidence locator obbligatorio

Ogni candidate deve puntare al frammento che sostiene il valore.

Esempi:

```json
{"type":"html","selector":"...","heading":"..."}
{"type":"json","pointer":"/plans/0/price"}
{"type":"pdf","page":12,"section":"..."}
```

Per estrazioni browser:

```json
{
  "type": "browser",
  "visibleTextAnchor": "...",
  "domPath": "..."
}
```

Il testo estratto usato come prova deve essere minimo e contestuale. Il body completo appartiene allo snapshot, non al claim candidate.

## 7. Provenance dell'estrazione

Campi obbligatori:

```text
extractor_id
extractor_version
observed_at
snapshot_id
source_role
```

Campi raccomandati:

```text
normalizer_version
schema_version
locale
currency_context
warnings[]
```

L'LLM, se usato, deve essere identificato come componente dell'estrattore e non può eliminare la necessità di raw value + locator.

## 8. Confidence

La confidence del candidato descrive al massimo **certezza dell'estrazione**, non verità commerciale.

Esempio:

```text
extractionConfidence=1.0
```

può significare che `US$29` è stato letto senza ambiguità.

Non significa che:

- il prezzo sia ancora attuale domani;
- sia disponibile per un utente italiano;
- il piano sia acquistabile;
- il provider sia migliore;
- il dato sia publication-eligible.

La confidence di `claim_verifications` resta un gate separato.

## 9. Proposed validity

`proposedValidUntil` è una proposta deterministica derivata dalla classe di volatilità, non una verifica.

Esempio:

```text
price → observed_at + 3 days
plan network → +7 days
terms → +30 days
manufacturer compatibility → +30 days
regulator framework → +90/180 days
```

Il verifier può accorciare la validità, non deve estenderla automaticamente oltre la policy senza motivazione.

## 10. Conflict handling

Il layer candidate non risolve conflitti.

Se due snapshot producono:

```text
same subject
same field
same scope
incompatible values
```

entrambi vengono conservati e inviati alla verifica.

Se lo scope differisce, il sistema deve tentare prima la separazione per:

```text
plan
destination
customer type
purchase channel
effective date
locale
```

## 11. Claim eligibility per source role

| Source role | Può generare candidate per | Non dimostra da sola |
|---|---|---|
| provider root | identità, dichiarazioni generiche | prezzo/piano/destinazione specifici |
| product page | prezzo, dati, validità, reti dichiarate del piano | performance osservata |
| official help | policy/procedura dichiarata | universalità se la pagina rimanda al piano |
| official terms | condizioni contrattuali | qualità reale del servizio |
| manufacturer | capacità hardware | compatibilità commerciale con ogni provider |
| regulator | regole, licenze, methodology, provider-reported coverage | performance di una travel eSIM |
| GSMA standard | standard tecnico | supporto del singolo device/provider |
| first-party test | comportamento osservato nel test | termini commerciali generali |
| demand source | nessun commercial fact automatico | qualsiasi claim commerciale |

## 12. Demand signals non diventano claim candidate

Per questi input:

```text
GSC
Trends
Reddit
YouTube
forum
competitor SERP
```

l'output consentito è:

```text
research question
brief candidate
source discovery task
```

non:

```text
commercial claim candidate
```

Eccezione futura possibile soltanto per un `editorial_reference` esplicitamente attribuito e non usato come verità commerciale; richiede scope separato.

## 13. Safety e publication boundary

Il claim candidate layer non può:

- scrivere `pages.status`;
- modificare un evidence bundle approvato;
- marcare un claim come verified;
- creare ranking automatici;
- attivare affiliazioni;
- scegliere un provider vincitore;
- generare testo fattuale per pagine live.

La catena resta:

```text
candidate
≠ verified claim
≠ publication-eligible evidence
≠ published content
```

## 14. Acceptance per uno spike futuro

Prima di scalare, uno spike tecnico dovrebbe dimostrare soltanto:

1. una fonte ufficiale;
2. due o tre field;
3. snapshot immutabile;
4. estrazione riproducibile;
5. candidate con locator;
6. seconda cattura senza cambiamento → nessun falso delta;
7. modifica fixture → delta deterministico;
8. nessuna mutation alle tabelle editoriali esistenti.

Un crawler multi-provider non è il primo passo autorizzato da questo contratto.

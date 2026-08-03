# Claims field catalog

Data audit: **3 agosto 2026**.

## Scopo

Questo catalogo traduce i criteri realmente richiesti dalle prime pagine Senza Roaming in field fattuali verificabili.

Non modifica lo schema D1. Serve a distinguere:

```text
criterio editoriale
→ fatto necessario
→ scope minimo
→ evidence requirement
→ field esistente oppure schema gap
```

Fonti canoniche di domanda editoriale:

- `research/seo/m7-keyword-map.csv`;
- `migrations/0005_published_pages.sql`;
- `docs/research/claim-candidate-contract.md`;
- `docs/research/unsupported-evidence-areas.md`.

## Stati del modello

- **existing** — il maintenance layer cita già un field compatibile;
- **existing-but-needs-structure** — il nome esiste, ma un singolo valore opaco rischia di comprimere proprietà diverse;
- **schema-gap** — il criterio è necessario alle pagine ma non ha ancora un field canonico dedicato;
- **observation-only** — non è correttamente derivabile da documentazione provider; richiede un protocollo first-party o uno stato utente.

## Catalogo

| Field concettuale | Stato modello | Scope minimo | Perché serve | Evidence minima | Freshness iniziale |
|---|---|---|---|---|---:|
| `destination_coverage` | schema-gap | plan + destination + purchase context | pagine Paese, `/migliore-esim`, `/esim-estero` | exact product/catalog snapshot | 7 giorni |
| `plan_type` | schema-gap | plan | distinguere locale, regionale, globale | product/catalog page con coverage scope | 14 giorni |
| `price` | existing upstream; downstream ha `price_eur` | plan + destination + locale + currency + timestamp | confronto economico datato | exact product snapshot | 3 giorni |
| `data_gb` | existing | plan + destination | quantità reale di dati | exact product snapshot | 7 giorni |
| `unlimited_policy` | existing-but-needs-structure | plan + destination | distinguere fixed-data da unlimited marketing | product page + FUP | 7 giorni |
| `fair_use_policy` | existing-but-needs-structure | plan + destination + time window | evitare “illimitato senza limiti” | product page + same-scope FUP/technical specs | 7 giorni |
| `validity_days` | existing | plan + destination | durata sufficiente per il viaggio | exact product/package page | 7 giorni |
| `activation_policy` | existing-but-needs-structure | exact package | capire quando parte la validità | package/product validity policy | 7 giorni |
| `hotspot_policy` | existing-but-needs-structure | plan + destination | hotspot sì/no | product page o policy applicabile allo stesso piano | 7 giorni |
| `hotspot_share_limit` | schema-gap | plan + destination + period | il boolean hotspot non basta per confronti reali | exact product/technical specs | 7 giorni |
| `network` | existing-but-needs-structure | plan + destination | operatori dichiarati | exact product/coverage page | 7 giorni |
| `radio_technology` | schema-gap o split futuro di `network` | plan + destination | 4G/5G dichiarato senza confonderlo con performance | provider plan + coverage context | 7 giorni |
| `observed_performance` | observation-only | plan + destination + place + time + device + network | eventuali claim velocità/latency | protocollo first-party versionato o dataset indipendente adeguato | molto breve |
| `refund_policy` | existing-but-needs-structure | provider + product type + scenario + effective date | costi/rischi post-acquisto | terms + refund policy | 14–30 giorni |
| `device_compatibility` | existing-but-needs-structure | exact model + hardware region | evitare compatibilità falsa per nome commerciale | manufacturer exact model/region | 30 giorni |
| `carrier_lock_state` | observation-only | singolo device utente | requisito reale prima dell'acquisto | controllo sul dispositivo/account operatore | runtime utente |
| `voice_sms_included` | schema-gap | exact plan | `/esim-estero` distingue solo dati vs esigenze chiamate | exact product snapshot | 7 giorni |
| `top_up_policy` | schema-gap, non P0 | exact plan/profile | utile dopo acquisto e per durata viaggio | product/help page | 14 giorni |
| `routing_ip_behavior` | observation-only per claim proprio | plan + destination + network + timestamp | Cina/VPN, geolocation, servizi bloccati | provider statement attribuito + test first-party per claim osservativo | molto breve |

## 1. Core decision set M7

La pagina `/migliore-esim` dichiara come criteri:

```text
destinazione
durata
dati
hotspot
attivazione
rete
prezzo
```

Il catalogo li traduce in un set minimo non ambiguo:

```text
destination_coverage
validity_days
data_gb OR unlimited_policy + fair_use_policy
hotspot_policy + hotspot_share_limit when applicable
activation_policy
network + radio_technology when declared
price {amount,currency,context,timestamp}
```

Un solo valore `hotspot=true` non è sufficiente se il piano limita la quantità condivisibile.

Un solo valore `network=5G` non è sufficiente per dire che il piano è “più veloce”.

Un solo numero `29` non è un prezzo confrontabile senza valuta e capture context.

## 2. `/esim-estero`

La guida deve distinguere:

```text
locale
regionale
globale
```

oltre a:

```text
Paesi inclusi
giorni
dati
hotspot
attivazione
voice/SMS quando richiesti
```

Oggi `plan_type`, `destination_coverage` e `voice_sms_included` sono schema gap concettuali. L'audit li registra; non autorizza una migrazione.

## 3. Compatibilità

`device_compatibility` non può restare soltanto:

```text
model → true
```

Il minimo corretto è:

```text
manufacturer
model / model code
hardware region / market
esim capability
source checked_at
```

`carrier_lock_state` è invece proprietà del singolo dispositivo/account. Non va materializzato come verità del modello.

## 4. Prezzo e valuta

Il primo snapshot reale ha dimostrato:

```text
destination=italy
locale=en-GB
currency=USD
```

Quindi il layer evidence deve conservare `price {amount,currency}`.

Il field downstream `price_eur` non va valorizzato con:

- cambio implicito;
- inferenza geografica;
- semplice copia dell'importo USD.

Per confrontare prezzi in una valuta comune servirà una decisione separata fra:

1. capture dello stesso purchase context/currency per tutti i provider;
2. oppure conversione derivata con fonte FX, timestamp e provenance separati.

Il Claims Coverage Audit non sceglie ancora una delle due.

## 5. Unlimited, FUP e hotspot

Questi concetti restano distinti:

```text
unlimited_marketing_label
fair_use_policy
high_speed_threshold
post_threshold_speed
hotspot_allowed
hotspot_share_limit
hotspot_share_period
```

Il maintenance layer può continuare a usare i field esistenti finché non viene autorizzato un cambio schema, ma ogni extractor futuro deve già evitare di perdere questa struttura nei raw/normalized candidates.

## 6. Network vs performance

Separazione obbligatoria:

```text
operatori dichiarati
radio technology dichiarata
coverage modellata
performance osservata
```

Una product page può sostenere i primi due come statement attribuito. Non sostiene da sola velocità reale, latenza o copertura indoor.

## 7. Ranking boundary

Nessun field di questo catalogo autorizza:

```text
score automatico
provider winner
migliore assoluto
```

La coverage del field è prerequisito della comparazione, non decisione editoriale.

## Stop condition

Prima di cambiare D1 o generalizzare gli extractor, il Claims Coverage Audit deve mostrare:

- quali field core hanno almeno una fonte primaria adatta per Airalo, Holafly e Ubigi;
- quali hanno solo fonte generic/provider-wide;
- quali richiedono una seconda fonte complementare;
- quali non hanno oggi un metodo di prova sufficiente;
- quali schema gap bloccano una rappresentazione corretta.

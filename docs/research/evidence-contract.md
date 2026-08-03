# Evidence snapshot contract

Data audit: **3 agosto 2026**.

## Scopo

Questo documento definisce il confine mancante tra il registro canonico delle fonti già esistente e i claim verificati già governati da Senza Roaming.

Il contratto è **read-only e progettuale** in questa fase. Non introduce tabelle D1, crawler, Worker, Workflow, endpoint, mutation o capacità di pubblicazione.

La pipeline obiettivo è:

```text
SOURCE
→ EVIDENCE SNAPSHOT
→ DETERMINISTIC EXTRACTION
→ NORMALIZED DATUM
→ CLAIM CANDIDATE
→ VERIFIED CLAIM
```

Il repository possiede già `source_registry`, `claim_verifications`, freshness, conflitti ed evidence bundle. Il gap è la conservazione immutabile di ciò che una fonte mostrava nel momento esatto in cui un dato è stato estratto.

## 1. Source non equivale a evidence

Una riga di `source_registry` identifica **dove guardare**.

Non dimostra da sola:

- cosa mostrava la pagina a una certa data;
- quale variante locale/currency era servita;
- quale sezione sosteneva un valore;
- se un redirect ha cambiato l'URL finale;
- se il contenuto era renderizzato via JavaScript;
- se il dato è stato successivamente modificato;
- se due documenti ufficiali erano in conflitto.

Per questo un claim fattuale futuro deve poter risalire a uno snapshot immutabile e non soltanto a un URL vivo.

## 2. Evidence snapshot

Uno snapshot rappresenta una singola osservazione di una fonte.

Contratto minimo proposto:

```text
snapshot_id
source_id | source_audit_key
requested_url
final_url
fetched_at
http_status
content_type
capture_method
locale
currency_context
country_context
etag
last_modified
sha256
artifact_location
parser_input_version
robots_or_terms_note
capture_warning[]
```

### `capture_method`

Valori candidati:

```text
http_html
http_json
pdf
browser_rendered
manual_first_party_test
```

Non vengono implementati in questo audit.

### Artifact

L'artifact conserva il corpo necessario a riprodurre l'estrazione. Il database operativo non deve necessariamente contenere il body completo: può contenere metadata e un riferimento a storage immutabile.

Decisione di storage rinviata a uno spike separato.

## 3. URL e contesto di cattura

### Redirect

Conservare sempre:

- URL richiesto;
- URL finale;
- catena di redirect quando disponibile.

### Query string

Non eliminare automaticamente parametri che possono cambiare semantica, per esempio:

- currency;
- locale;
- country;
- plan/sku;
- duration;
- destination.

Rimuovere tracking (`utm_*`, click IDs) soltanto nella chiave canonica, mantenendo comunque il requested URL nello snapshot.

### Localizzazione

Una pagina resa in EUR non è la stessa evidenza di una pagina resa in USD se il claim riguarda il prezzo.

Uno snapshot di prezzo deve quindi conservare almeno:

```text
currency_context
locale
country_context
```

Se il sito decide la valuta in modo implicito tramite geolocalizzazione, cookie o header, lo snapshot deve registrare tale dipendenza oppure il dato resta non idoneo a un claim di prezzo normalizzato.

## 4. Evidence locator

Ogni datum estratto deve avere un locator riproducibile verso lo snapshot.

Esempi:

```text
html_selector
json_pointer
pdf_page + section
visible_heading + nearby_value
manual_test_step
```

Il locator non è una citazione editoriale: serve a dimostrare da quale parte dell'artifact è stato ottenuto il valore.

È vietato usare come locator soltanto:

```text
"homepage"
"FAQ"
"sito ufficiale"
```

## 5. Estrazione deterministica

L'AI può assistere discovery o classificazione, ma un valore commerciale destinato a diventare claim deve passare attraverso una trasformazione riproducibile.

Ogni estrazione deve registrare:

```text
extractor_id
extractor_version
field_name
raw_value
raw_unit
raw_context
locator
warnings[]
```

Se la stessa evidenza produce valori diversi con la stessa versione dell'estrattore, l'estrazione non è deterministica e non può avanzare automaticamente.

## 6. Normalizzazione

Il valore raw viene conservato. Il valore normalizzato non lo sostituisce.

### Prezzo

```json
{
  "amount": 29,
  "currency": "USD"
}
```

Non convertire automaticamente in EUR come verità della fonte. Eventuale conversione valutaria è un dato derivato separato con propria fonte/timestamp.

### Dati

```json
{
  "quantity": 50,
  "unit": "GB"
}
```

`unlimited=true` non implica assenza di fair use.

### Validità

Separare:

```text
duration
unit
activation_trigger
```

Esempio: `30 days` e `starts on first supported-network connection` sono due proprietà distinte.

### Hotspot

Separare almeno:

```text
allowed
share_limit
share_limit_unit
share_period
plan_scope
```

Una FAQ generica non autorizza a impostare `allowed=true` per ogni piano se la stessa fonte rimanda alle specifiche del piano.

### Rete e copertura

Separare:

```text
network_partner_claimed
technology_claimed
coverage_area_claimed
observed_connectivity
```

Le prime tre possono derivare da documenti/provider; `observed_connectivity` richiede test first-party o altra evidenza indipendente appropriata.

## 7. Scope obbligatorio

Ogni datum deve dichiarare a cosa si applica.

Dimensioni possibili:

```text
provider
plan / sku
destination
region
device_model
device_region
operating_system
time window
customer type
```

Un claim può ereditare scope solo quando la fonte lo dichiara esplicitamente.

Non è consentito trasformare:

> molte eSIM supportano hotspot

in:

> tutte le eSIM del provider supportano hotspot.

## 8. Source roles e trust

Il `source_kind` D1 esistente resta invariato in questo audit:

```text
official_provider
official_help
official_terms
regulator
manufacturer
first_party_test
editorial_reference
```

Il ruolo semantico viene distinto nell'audit senza cambiare enum.

Esempi:

- provider root → identità e dichiarazioni generiche;
- product page → piano/sku volatile;
- help → procedura o policy dichiarata;
- terms → condizioni contrattuali;
- manufacturer → capacità hardware;
- regulator → legge/regolazione/coverage methodology;
- GSMA → standard tecnico, mappato temporaneamente a `editorial_reference` perché manca `standards_body`;
- first-party test → comportamento osservato, non termini commerciali.

`trust_level=5` non significa che una fonte può dimostrare qualsiasi field. **Autorità e pertinenza sono entrambe necessarie.**

## 9. Freshness suggerita

Valori iniziali per progettare il monitoraggio futuro, non ancora applicati a D1:

| Evidenza | Finestra suggerita |
|---|---:|
| prezzo / disponibilità SKU | 1–3 giorni |
| quota dati / validità / reti del piano | 3–7 giorni |
| hotspot / fair use plan-specific | 7 giorni |
| help provider generica | 14 giorni |
| refund / terms | 14–30 giorni |
| provider identity/root | 30 giorni |
| device compatibility manufacturer | 30 giorni |
| carrier compatibility manufacturer | 14 giorni |
| regulator page operativa | 90 giorni |
| regulator identity / framework stabile | 180 giorni |
| standard GSMA | 90 giorni o evento-versione |
| first-party performance/routing test | per test e contesto; mai ereditato indefinitamente |

La finestra reale deve poter essere più corta in presenza di `last_changed_at`, release note o cambi di catalogo frequenti.

## 10. Conflitti

Un conflitto fra fonti ufficiali non viene risolto scegliendo il testo più recente o conveniente senza analisi dello scope.

Procedura futura:

```text
snapshot A
snapshot B
→ confronta subject + field + scope + effective date
→ scope distinto: conserva entrambi
→ stesso scope e valori incompatibili: conflict
→ revisione umana
```

Esempi ad alto rischio:

- terms vs refund FAQ;
- help generica vs product page;
- homepage marketing vs fair-use policy;
- provider device list vs manufacturer regional matrix.

## 11. Fonti di domanda: confine rigido

Questi sistemi possono alimentare domanda e brief:

```text
Google Search Console
Google Trends
Reddit
YouTube
community/forum
SERP/competitor discovery
```

Non possono diventare automaticamente evidence source per claim commerciali.

Questo preserva ADR-003:

```text
demand signal ≠ commercial truth
```

Una discussione può generare la domanda "Holafly consente hotspot in Giappone?"; la risposta fattuale deve essere verificata su fonti appropriate.

## 12. Fail-closed

Un datum non avanza a claim candidate quando manca uno dei seguenti elementi:

- snapshot identificabile;
- timestamp;
- final URL;
- field;
- raw value;
- evidence locator;
- scope sufficiente;
- parser/extractor version;
- source role compatibile col field.

Un valore ambiguo non viene completato dall'AI.

## 13. Confini di questa fase

Non vengono introdotti:

- nuove tabelle;
- storage artifact;
- fetcher/crawler;
- browser automation production;
- mutation D1;
- migration D1;
- queue task;
- endpoint;
- provider credential;
- ranking;
- affiliate tracking;
- publication capability.

Il prossimo spike tecnico, se autorizzato dopo questo audit, dovrà dimostrare la cattura di **una sola fonte** e la riproducibilità di **pochi field** prima di generalizzare il sistema.

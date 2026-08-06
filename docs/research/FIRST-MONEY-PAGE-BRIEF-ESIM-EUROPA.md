# First Money Page Brief — `/esim-europa`

Data: **6 agosto 2026**

Stato: **research brief, non autorizza pubblicazione o affiliate activation**.

## Ruolo

`/esim-europa` è la prima nuova money page candidata ad essere costruita direttamente sulla evidence supply chain verificata.

Non è un hub geografico generico e non possiede l'intento `esim viaggio` della homepage.

Owner previsto:

```text
primary cluster: esim europa
intent: commercial investigation / destination-regional decision
journey: comparison → purchase
```

## Perché viene subito dopo `/migliore-esim`

`/migliore-esim` è il percorso più rapido al primo click perché esiste già.

`/esim-europa` è invece il miglior candidato per la prima nuova pagina perché il repository possiede già un pack regionale reale con:

```text
scenario: 14-day Europe trip
countries: Italy + France + Spain
usage: high data
hotspot: required
providers: Airalo / Holafly / Ubigi
```

Il pack è stato catturato due volte con semantic fingerprint stabile e ranking `not_computed`.

Questo permette di costruire una pagina utile senza trasformare un aggregato commerciale o un provider label in verità non provata.

## Search intent osservato

La SERP live mostra una combinazione di:

- product page regionali dei provider;
- comparison/affiliate guide;
- provider-vs-provider content;
- community questions su multi-country, quantità dati, hotspot e affidabilità;
- contenuti video che confrontano piani e provider.

La pagina deve quindi rispondere a una decisione reale, non essere un testo enciclopedico su cosa sia una eSIM.

## Direct answer target

La risposta iniziale deve essere scenario-first:

> Per scegliere una eSIM per l'Europa non basta guardare il numero di Paesi o la parola “illimitata”. Verifica che il piano includa davvero tutte le tappe del tuo itinerario, che duri abbastanza, che l'hotspot sia compatibile con il tuo uso e che eventuali fair-use limit siano chiari. Il piano migliore cambia in base a giorni, dati e Paesi attraversati.

La formulazione finale deve essere revisionata contro l'evidence bundle pubblicabile.

## Domande che la pagina deve possedere

Il corpus M7.1 ha trovato queste domande commerciali o pre-acquisto:

1. Quali Paesi sono inclusi nella eSIM Europa?
2. Funziona in tutti i Paesi del mio itinerario?
3. Quando parte la validità?
4. Posso installarla prima di partire?
5. Posso usare hotspot/tethering?
6. Quanti dati posso condividere in hotspot?
7. “Dati illimitati” significa davvero senza limiti?
8. Quanto fair use è previsto?
9. Quanti GB mi servono per 7, 10, 14 o 30 giorni?
10. Posso mantenere WhatsApp e il mio numero?
11. Posso usare SIM fisica ed eSIM insieme?
12. Meglio un piano regionale o più piani locali?
13. Airalo o Holafly per l'Europa?
14. Quando ha senso Ubigi?
15. Cosa cambia per chi lavora dal laptop?

Queste domande non autorizzano una FAQ separata per ogni variante. Devono essere clusterizzate nella stessa owner page quando condividono lo stesso intento.

## Struttura proposta

### 1. Hero decisionale

- H1: orientato a `eSIM Europa` / scelta del piano;
- risposta diretta in 2–3 frasi;
- quick selector non interattivo o progressive-enhancement in base a:
  - Paesi;
  - giorni;
  - uso dati;
  - hotspot.

CTA iniziale solo dopo affiliate gate:

```text
Confronta le opzioni verificate
```

Non usare “migliore” senza scenario.

### 2. Prima tabella utile

La tabella commerciale deve mostrare soltanto campi verificati e comparabili.

Candidate columns:

```text
provider / offer
validità
data model
source currency price
hotspot allowed
hotspot share limit
activation
coverage qualifier
checked_at
```

Regole:

- niente FX implicito;
- niente `price_eur` derivato da USD senza layer FX separato;
- `partial` deve essere visibile come partial;
- `unknown` non diventa “No”;
- aggregate country count non prova membership dell'itinerario;
- network regionale resta country-scoped quando la source lo è.

### 3. Scenari d'uso

Almeno tre scenari bounded:

#### Viaggio breve, uso normale

Domanda:

```text
mappe + messaggi + prenotazioni + social moderato
```

La pagina può spiegare come confrontare fixed-GB vs unlimited senza dichiarare una quantità universale di dati.

#### Uso intenso / streaming

Confronto centrato su:

```text
data model
FUP
validity
price
```

#### Remote work / laptop

Confronto centrato su:

```text
hotspot allowed
share limit
period
FUP
coverage/network evidence
```

Questo scenario è particolarmente importante perché la SERP e le community questions mostrano che “illimitato” e “hotspot” vengono spesso confusi.

### 4. Copertura multi-Paese

Deve spiegare la differenza fra:

```text
regional label
aggregate country count
specific country membership
```

Un piano che dichiara “Europa” o “N Paesi” non può essere descritto come adatto a un itinerario finché le tappe specifiche non risultano supportate.

### 5. Installazione vs attivazione

Sezione breve ma conversion-critical.

Deve distinguere:

```text
installazione del profilo
≠
inizio della validità
```

La policy è plan/provider specifica e deve provenire da evidence verificata.

### 6. WhatsApp, numero e Dual SIM

Deve risolvere l'obiezione senza promettere capacità hardware universali.

Separare:

- piano data-only;
- eventuale voice/SMS incluso;
- mantenimento del numero WhatsApp;
- uso simultaneo SIM principale/eSIM subordinato al dispositivo.

### 7. Airalo vs Holafly vs Ubigi

Non deve essere un podio.

La forma corretta è:

```text
Se il tuo scenario è X → guarda i campi A/B/C
Se il tuo scenario è Y → guarda i campi D/E/F
```

Un provider può risultare adatto a uno scenario e non a un altro.

### 8. Prima di comprare

Checklist finale:

- dispositivo compatibile e sbloccato;
- tutte le destinazioni comprese;
- validità sufficiente;
- quantità/modello dati;
- hotspot;
- fair use;
- activation trigger;
- voice/SMS se necessari;
- source date.

## Evidence requirements

Campi minimi per una comparison commerciale reale:

```text
plan_type
destination_coverage
validity_days
data_gb OR unlimited_policy
fair_use_policy
price amount + source currency
hotspot_policy
hotspot_share_limit
activation_policy
network/operator evidence where available
radio technology only as technology statement
voice_sms_included when explicitly supported
```

## Evidence already available

Il pack Europa #107 ha dimostrato che il modello sa conservare:

- regional plan type;
- aggregate country count senza inferire membership;
- source-native EUR/USD;
- fixed data vs unlimited/FUP;
- hotspot allowed e share-limit separati;
- activation known/unknown;
- country-scoped network quando disponibile;
- `observed | partial | unknown | not_applicable`.

Non significa che ogni campo sia già verificato/pubblicabile in D1 remoto.

## SERP differentiation

Non provare a battere gli aggregatori sulla quantità di piani.

Il vantaggio SenzaRoaming deve essere:

```text
meno righe
+ più chiarezza sullo scenario
+ stato evidence visibile
+ freshness
+ distinzione unknown/partial
+ trade-off hotspot/FUP/coverage
```

Competitor live osservati includono provider pages, TechRadar, comparison sites e provider-vs-provider pages.

## Internal links

Inbound target:

```text
/
/destinazioni
/confronti
/migliore-esim
/esim-estero
/esim-giga-illimitati
future airalo-vs-holafly
```

Outbound target:

```text
/migliore-esim
/esim-estero
/esim-telefoni-compatibili
/esim-come-funziona
/esim-giga-illimitati
/airalo-vs-holafly when published
provider review pages when published
```

## Search-to-social yield

La pagina deve produrre almeno questi angle:

1. **“41 Paesi. Bello. Ma ci sono i tuoi?”**
   - fact need: coverage membership / aggregate count distinction.
2. **“La eSIM è illimitata. Il tuo hotspot no.”**
   - fact need: unlimited + hotspot share limit.
3. **“Installata non significa attivata.”**
   - fact need: activation policy.
4. **“Europa 14 giorni: non partire dal prezzo.”**
   - fact need: validity + data + hotspot + price.
5. **“Airalo o Holafly? Domanda incompleta.”**
   - fact need: scenario-specific trade-offs.
6. **“WhatsApp non cambia numero solo perché cambi linea dati.”**
   - guidance must be technically accurate and device caveats preserved.

## Affiliate boundary

La pagina può essere sviluppata in preview prima dell'attivazione affiliate.

CTA reali richiedono separatamente:

```text
affiliate account approved
partner destination URL validated
redirect path /go/* preserved
clear disclosure
tracking scope accepted
AFFILIATE_MODE explicit
production deploy authorization
```

Non inserire token, partner IDs o tracking parameters nei documenti versionati se sono riservati.

## Measurement

Prima del deploy commerciale definire un evento bounded per provider redirect intent, coerente con M6 e consent/privacy policy.

Nessuna nuova misurazione viene introdotta da questo brief.

## Exit criteria del brief

La implementation branch può partire quando:

1. #111 è accettata;
2. source reconciliation/import path rende disponibili i fatti necessari o esiste una bounded materialization verificabile equivalente;
3. affiliate path dei provider scelti è disponibile;
4. exact page owner e internal links sono confermati;
5. nessun claim numerico viene copiato direttamente dal presente brief.

La pagina deve poter essere utile anche se un provider resta `unknown` su un campo: l'unknown viene mostrato o il confronto viene ridotto, non riempito per inferenza.

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

## Autocomplete A–Z enrichment — 6 agosto 2026

La capture M7.1b ha interrogato:

```text
esim europa
esim europa + a…z
```

Risultato:

```text
223 suggestion uniche
```

Le base suggestions includono pattern espliciti su:

```text
esim europa internet illimitato
esim europa dati
esim illimitato europa
esim europa internet
esim europa 30 dias
esim europa 15 dias
```

Nel corpus A–Z emergono inoltre:

- unlimited / illimitato;
- quantità dati;
- 15/30-day style durations;
- prezzo/economicità;
- numero/chiamate;
- Svizzera / multi-country boundary;
- provider brand tails.

Conseguenze:

1. `duration` deve essere una dimensione esplicita, non solo una colonna accessoria;
2. `unlimited` deve sempre essere accoppiato a FUP/post-threshold semantics quando disponibili;
3. `voice/SMS/local number` deve essere mostrato come incluso/non incluso/unknown solo quando provato;
4. Svizzera e altri edge-country non vanno inferiti dal semplice label “Europa”;
5. fixed-GB vs unlimited è un decision fork reale;
6. prezzo senza durata/data/hotspot non è una risposta sufficiente.

La capture PAA/related italiana ha restituito zero righe e questo zero-state viene preservato. Le domande già raccolte da SERP/FAQ/community restano una demand source separata.

## Direct answer target

La risposta iniziale deve essere scenario-first:

> Per scegliere una eSIM per l'Europa non basta guardare il numero di Paesi o la parola “illimitata”. Verifica che il piano includa davvero tutte le tappe del tuo itinerario, che duri abbastanza, che l'hotspot sia compatibile con il tuo uso e che eventuali fair-use limit siano chiari. Se ti servono chiamate o un numero locale, verifica anche che il piano non sia soltanto dati. Il piano migliore cambia in base a giorni, dati, Paesi e uso reale.

La formulazione finale deve essere revisionata contro l'evidence bundle pubblicabile.

## Domande che la pagina deve possedere

Il corpus M7.1 + A–Z converge su queste domande commerciali/pre-acquisto:

1. Quali Paesi sono inclusi nella eSIM Europa?
2. Funziona in tutti i Paesi del mio itinerario?
3. La Svizzera è inclusa?
4. Quando parte la validità?
5. Posso installarla prima di partire?
6. Quanto deve durare il piano per 7, 10, 14, 15 o 30 giorni?
7. Meglio GB fissi o dati illimitati?
8. “Dati illimitati” significa davvero senza limiti?
9. Quanto fair use è previsto?
10. Posso usare hotspot/tethering?
11. Quanti dati posso condividere in hotspot?
12. Il piano include chiamate/SMS o un numero?
13. Posso mantenere WhatsApp e il mio numero principale?
14. Posso usare SIM fisica ed eSIM insieme?
15. Meglio un piano regionale o più piani locali?
16. Airalo o Holafly per l'Europa?
17. Quando ha senso Ubigi?
18. Cosa cambia per chi lavora dal laptop?

Queste domande non autorizzano una FAQ separata per ogni variante. Devono essere clusterizzate nella stessa owner page quando condividono lo stesso intento.

## Struttura proposta

### 1. Hero decisionale

- H1 orientato a `eSIM Europa` / scelta del piano;
- risposta diretta in 2–3 frasi;
- quick selector non interattivo o progressive-enhancement in base a:
  - Paesi;
  - giorni;
  - uso dati;
  - hotspot;
  - necessità voice/numero quando rilevante.

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
voice/SMS/number when explicitly supported
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
- network regionale resta country-scoped quando la source lo è;
- assenza di voice evidence non diventa automaticamente `data-only` se il piano non è stato verificato su quel campo.

### 3. Scenari d'uso

Almeno quattro scenari bounded:

#### Viaggio breve, uso normale

Domanda:

```text
mappe + messaggi + prenotazioni + social moderato
```

Confronto:

```text
fixed data
validity
price
activation
```

#### 14–30 giorni / uso intenso

Confronto:

```text
data model
unlimited semantics
FUP
validity
price
```

#### Remote work / laptop

Confronto:

```text
hotspot allowed
share limit
period
FUP
coverage/network evidence
```

#### Serve anche un numero / chiamate

Confronto:

```text
data-only
voice/SMS included
local number if any
WhatsApp/main-number guidance
```

Questo scenario non deve far sembrare voice/numero una caratteristica standard delle travel eSIM.

### 4. Copertura multi-Paese

Deve spiegare la differenza fra:

```text
regional label
aggregate country count
specific country membership
```

Un piano che dichiara “Europa” o “N Paesi” non può essere descritto come adatto a un itinerario finché le tappe specifiche non risultano supportate.

Edge-country come Svizzera devono essere verificati esplicitamente quando sono parte dello scenario.

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

Separare:

- piano data-only;
- eventuale voice/SMS incluso;
- eventuale local number;
- mantenimento del numero WhatsApp;
- uso simultaneo SIM principale/eSIM subordinato al dispositivo.

### 7. Airalo vs Holafly vs Ubigi

Non deve essere un podio.

Forma corretta:

```text
Se il tuo scenario è X → guarda A/B/C
Se il tuo scenario è Y → guarda D/E/F
```

Un provider può risultare adatto a uno scenario e non a un altro.

### 8. Prima di comprare

Checklist finale:

- dispositivo compatibile e sbloccato;
- tutte le destinazioni comprese;
- validità sufficiente;
- quantità/modello dati;
- FUP/post-threshold;
- hotspot;
- activation trigger;
- voice/SMS/numero se necessari;
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
voice_sms_included when explicitly supported
local_number when explicitly supported
network/operator evidence where available
radio technology only as technology statement
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

Voice/SMS/local-number è ora un **explicit demand requirement** ma deve restare `unknown`/omesso finché l'evidence pipeline non lo supporta per l'offerta specifica.

## SERP differentiation

Non provare a battere gli aggregatori sulla quantità di piani.

Il vantaggio SenzaRoaming deve essere:

```text
meno righe
+ più chiarezza sullo scenario
+ stato evidence visibile
+ freshness
+ distinzione unknown/partial
+ trade-off hotspot/FUP/coverage/voice
```

## Internal links

Inbound target:

```text
/
/destinazioni
/confronti
/migliore-esim
/esim-estero
/esim-giga-illimitati
future /esim-hotspot
future airalo-vs-holafly
```

Outbound target:

```text
/migliore-esim
/esim-estero
/esim-telefoni-compatibili
/esim-come-funziona
/esim-giga-illimitati
future /esim-hotspot when owner is approved
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
6. **“Ti serve un numero? Controlla prima che non sia data-only.”**
   - fact need: explicit voice/SMS/local-number evidence.

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

Non inserire token, partner IDs o tracking parameters riservati nei documenti versionati.

## Measurement

Prima del deploy commerciale definire un evento bounded per provider redirect intent, coerente con M6 e consent/privacy policy.

Nessuna nuova misurazione viene introdotta da questo brief.

## Exit criteria del brief

La implementation branch può partire quando:

1. #111 è accettata;
2. A–Z enrichment #113 è chiusa o comunque i suoi owner/section findings sono stati recepiti;
3. source reconciliation/import path rende disponibili i fatti necessari o esiste una bounded materialization verificabile equivalente;
4. affiliate path dei provider scelti è disponibile;
5. exact page owner e internal links sono confermati;
6. nessun claim numerico viene copiato direttamente dal presente brief.

La pagina deve poter essere utile anche se un provider resta `unknown` su un campo: l'unknown viene mostrato o il confronto viene ridotto, non riempito per inferenza.

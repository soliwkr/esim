# First Money Page Brief — `/migliore-esim`

Data: **6 agosto 2026**.

## Decisione

`/migliore-esim` è il candidato più veloce per la **prima vertical slice monetizzabile** di Senza Roaming.

Motivo:

```text
URL già live
+ cluster Planner forte
+ ownership SEO già definita
+ renderer e measurement già in produzione
+ evidence Italia/Europa già disponibile upstream
```

`/esim-europa` resta il candidato prioritario per la **prima nuova money page evidence-native** subito dopo.

Questa decisione non autorizza ancora affiliate mode, provider link, publication mutation o deploy.

## Search intent

```text
primary: migliore esim
intent: commercial investigation / evaluation
journey: pre-purchase
Planner primary bucket: 5.000
Planner aggregate cluster: 12.050
```

L'utente non cerca il nostro workflow editoriale. Cerca una decisione.

## Autocomplete A–Z enrichment — 6 agosto 2026

La capture riproducibile M7.1b ha interrogato:

```text
migliore esim
migliore esim + a…z
```

con `gl=it`, `hl=it`, `location=Italy`.

Risultato per il seed:

```text
148 suggestion uniche
```

Le base suggestions sono soprattutto destination-led:

```text
migliore esim giappone
migliore esim per usa
migliore esim per egitto
migliore esim per la cina
migliore esim per turchia
migliore esim regno unito
migliore esim per albania
migliore esim per marocco
migliore esim per londra
```

Conseguenze sul brief:

1. `/migliore-esim` possiede **la decisione generica**, non le risposte complete per singola destinazione;
2. above-the-fold deve portare rapidamente da “qual è la migliore?” a “dove vai / quanti giorni / quanti dati / hotspot?”;
3. le destination specialist devono ricevere il deep answer appena esistono;
4. non creare blocchi lunghi tipo “migliore eSIM USA/Giappone/Egitto…” dentro questa pagina: diventerebbero cannibalizzazione;
5. le destination mentions servono come routing cards/link, non come mini-articoli;
6. il termine “migliore” deve restare scenario-bound, non diventare winner universale.

La capture PAA live per il seed ha restituito zero righe; le domande SERP/FAQ/community di #111 restano fonti demand distinte e non vengono rinominate PAA.

## Problema della pagina corrente

La pagina corrente è intenzionalmente provider-neutral e utile come safety foundation, ma è ancora troppo astratta per convertire.

Oggi spiega soprattutto:

- criteri;
- scenari generici;
- perché non esiste un winner universale;
- perché i claim devono essere verificati.

Manca ancora il prodotto consumer:

```text
scenario concreto
→ opzioni reali
→ differenze verificate
→ CTA verso il provider appropriato
```

## Promessa target

> Non ti diamo una classifica permanente. Ti mostriamo quale tipo di eSIM ha più senso per il tuo viaggio e quali differenze risultano verificate oggi.

## H1 target

```text
Qual è la migliore eSIM per viaggiare?
```

L'H1 attuale può rimanere.

## Direct answer target

La prima schermata deve rispondere subito e poi portare a una scelta:

```text
La migliore eSIM cambia con destinazione, giorni, dati e hotspot.
Per un viaggio breve e leggero può bastare un piano a GB; per uso intenso può contare di più l'unlimited/FUP; per più Paesi serve verificare la copertura regionale tappa per tappa.
```

I provider vengono nominati soltanto quando esiste evidence verificata e freshness valida.

## Above the fold

Target:

```text
H1
↓
risposta diretta
↓
4 input mentali
  Dove vai?
  Quanti giorni?
  Quanti dati?
  Ti serve hotspot?
↓
scenario cards
```

Niente apertura con:

- claim pipeline;
- brief/draft/published;
- ownership URL;
- spiegazione del sistema di governance.

Queste informazioni restano accessibili tramite `/metodo` e `/trasparenza`.

## Scenario cards v1

Non sono classifiche.

### 1. Viaggio breve / uso leggero

Decision criteria:

- destination coverage;
- finite data allowance;
- validity;
- activation;
- price.

### 2. Uso intenso / video / mappe continue

Decision criteria:

- unlimited label oppure grande allowance;
- fair use;
- post-threshold behavior;
- validity;
- price.

### 3. Laptop / lavoro remoto

Decision criteria:

- hotspot allowed;
- hotspot share limit;
- data/FUP;
- activation;
- network evidence where available.

### 4. Itinerario multi-Paese

Decision criteria:

- regional plan type;
- explicit country membership;
- validity across entire trip;
- country-scoped network caveats;
- activation.

Natural CTA:

```text
Confronta le eSIM per l'Europa → /esim-europa
```

quando la nuova page esisterà.

## Routing destinations — progressive disclosure

L'A–Z giustifica una superficie di routing, non una lista infinita di paragrafi.

Prima tranche coerente con la priority map:

```text
Europa
USA
Egitto
Giappone
Turchia
Albania
Svizzera
Thailandia
```

Altri destination tail osservati (`Cina`, `Marocco`, `Regno Unito/Londra`, ecc.) restano candidate demand da validare nella rispettiva priorità; non vanno pubblicati come link a route inesistenti.

## Provider comparison module

Il modulo futuro deve essere evidence-bound.

Esempio di colonne consentite quando verificate:

```text
Provider
Piano / offer identity
Destinazione o regione
Dati / unlimited
Validità
Hotspot
Fair use
Attivazione
Prezzo + valuta nativa
Controllato il
CTA
```

Non mostrare come fatto:

- performance non misurata;
- copertura di un Paese dedotta da aggregate country count;
- prezzo convertito via FX implicito;
- network appiattito da evidenza country-specific;
- winner universale.

## Evidence già utilizzabile come input upstream

### Italy pack

Scenario reale:

```text
Italy
10-day trip
high data
hotspot required
Airalo / Holafly / Ubigi
```

Due capture stabili semanticamente.

### Europe pack

Scenario reale:

```text
Europe
14-day trip
Italy + France + Spain
high data
hotspot required
Airalo / Holafly / Ubigi
```

Due capture stabili semanticamente al momento del checkpoint live.

Questi pack **non sono ancora claim_verifications nel D1 remoto** e non possono essere usati come scorciatoia per pubblicare provider facts.

## Evidence fields richiesti prima della monetizzazione

Per ogni provider card:

```text
subject_key / stable offer identity
source registry reconciliation
capture timestamp
price amount + native currency
validity
finite data OR unlimited label
FUP where applicable
hotspot allowed
hotspot share limit if proven
activation policy
coverage state
source_checked_at / freshness
verification decision
```

Optional only when proven:

```text
network
radio technology
voice/SMS inclusion
```

## CTA affiliate

Copy CTA preferita:

```text
Vedi il piano sul sito ufficiale
```

o una variante scenario-specifica neutrale.

Evitare CTA come:

```text
Compra il migliore
Offerta imbattibile
Il più veloce
Il vincitore
```

salvo futura evidence specifica che autorizzi esattamente quel claim.

## Disclosure

Prima di `AFFILIATE_MODE=enabled` deve esistere disclosure chiara vicino al primo blocco commerciale:

```text
Alcuni link possono essere affiliati. Se acquisti tramite questi link possiamo ricevere una commissione, senza costi aggiuntivi per te. Le commissioni non determinano quali dati pubblichiamo o come verifichiamo i claim.
```

Testo definitivo da validare nella fase M8.

## Measurement

Il primo euro richiede almeno:

```text
page_view
→ provider_redirect_intent
→ provider redirect server-side
→ affiliate network conversion/reporting
```

`provider_redirect_intent` è già definito concettualmente ma resta differito e deve essere attivato con scope separato e consent/privacy review.

Non mettere partner ID, commissione o token nel client oltre quanto strettamente richiesto dal link/redirect contract autorizzato.

## Internal linking

Inbound prioritari:

```text
/
/confronti
/esim-estero
future destination pages
future provider pages
```

Outbound prioritari:

```text
/esim-estero
/esim-come-funziona
/esim-telefoni-compatibili
future /esim-europa
future /airalo-recensioni
future /airalo-vs-holafly
```

Quando le destination pages esistono, le routing cards devono puntare direttamente agli owner specialistici e non moltiplicare la risposta dentro `/migliore-esim`.

## SERP differentiation

Non possiamo battere aggregatori da migliaia di piani sulla pura breadth.

La differenziazione deve essere:

```text
scenario-first
+ evidence freshness visibile
+ distinction between observed / partial / unknown
+ hotspot/FUP/activation trattati seriamente
+ niente winner venduto come eterno
```

## Search-to-social yield

La pagina ha alto content yield.

Prime creative:

```text
"La migliore eSIM non esiste."
"La più economica può costarti di più."
"La eSIM è illimitata. Il tuo hotspot no."
"29 dollari o 46,90 euro? Domanda sbagliata."
"41 Paesi. Ottimo. Ma ci sono i tuoi?"
```

Ogni creative deve risolvere verso la stessa pagina o una specialistica coerente.

## Gate prima dell'implementazione commerciale

1. source reconciliation completata;
2. importer fixture/local validato;
3. decisione separata sull'applicazione remota di `0021`;
4. evidence Italia/Europa importata in modo controllato;
5. verification bridge sufficiente per i facts mostrati;
6. programma affiliate almeno per i provider mostrati approvato;
7. disclosure pronta;
8. redirect/tracking contract autorizzato;
9. copy consumer-first completo;
10. smoke canonical + mobile + affiliate-disabled/enabled boundaries;
11. deploy manuale separato;
12. live verification.

## Success criterion

La page diventa first-money ready quando:

```text
utente arriva con intento "migliore esim"
→ capisce in pochi secondi quale scenario lo riguarda
→ vede differenze provider verificabili e datate
→ può aprire una offerta ufficiale tramite redirect affiliate trasparente
→ nessun claim supera l'evidence disponibile
```

Il primo click o la prima commissione non vengono promessi: vengono resi tecnicamente e commercialmente possibili e misurabili.

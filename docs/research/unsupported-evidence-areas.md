# Unsupported evidence areas

Data audit: **3 agosto 2026**.

## Scopo

Questo registro elenca i fatti che Senza Roaming **non dovrebbe ancora trattare come automaticamente dimostrabili**, anche quando esiste una pagina ufficiale correlata.

Serve a evitare il salto pericoloso:

```text
ho trovato una pagina ufficiale
→ quindi posso pubblicare il claim
```

Una fonte autorevole può essere insufficiente per field, scope, data o tipo di prova.

## Legenda

- **rosso** — nessuna catena di prova sufficiente definita; non usare come fatto automatico;
- **ambra** — prove disponibili ma richiedono scope preciso, snapshot o confronto;
- **verde limitato** — fonte primaria appropriata identificata, ma freshness e provenance restano obbligatorie.

## Matrice

| Area | Stato | Problema | Evidenza necessaria | Conseguenza editoriale |
|---|---|---|---|---|
| prezzo corrente | rosso | geolocalizzazione, valuta, promozioni e SKU cambiano rapidamente | snapshot exact-plan con locale/currency e timestamp | niente prezzi specifici finché manca capture context riproducibile |
| catalogo piani disponibile | rosso | inventory dinamico, URL generati, piani app-only | discovery + snapshot per SKU stabile | non dire "offre X piani" da homepage/catalog generico |
| dati inclusi e validità | ambra | plan-specific; activation trigger può differire | exact product page + policy di validità | attribuire solo al piano catturato |
| unlimited / fair use | rosso | "unlimited" marketing non descrive throttling/FUP | product page + fair-use policy dello stesso scope | vietare "illimitato senza limiti" senza policy completa |
| hotspot consentito | ambra | provider generici rimandano spesso alle specifiche del piano | help + exact plan/destination snapshot | niente boolean universale provider-wide |
| limite hotspot giornaliero | rosso | spesso presente solo nella destination/product page | exact plan snapshot | non inferire quantità da FAQ generica |
| network partner | ambra | lista può cambiare per destinazione/piano | exact plan/coverage page, freshness breve | attribuire come rete dichiarata, non come garanzia |
| 4G/5G disponibile | ambra | tecnologia dichiarata ≠ copertura reale ≠ disponibilità sul singolo device | provider plan + regulator/coverage + device scope | usare "dichiarato/supportato" salvo test indipendente |
| copertura reale | rosso | mappe sono modellate/provider-reported; roaming partner e indoor variano | regulator methodology + provider data + first-party observation | niente percentuali/garanzie di copertura senza metodo definito |
| velocità reale | rosso | varia per rete, cella, congestion, device e roaming | protocollo first-party ripetibile o dataset indipendente adeguato | niente "più veloce" come fatto proprio |
| latenza reale | rosso | dipende da routing e punto di misura | first-party test con endpoint, timestamp, rete e device | niente valori generici |
| routing / IP geolocation | rosso | comportamento runtime, può cambiare per rete/piano | first-party test ripetibile + provider statement separato | provider statement resta attribuito, non prova indipendente |
| accesso a servizi bloccati / VPN | rosso | forte dipendenza da routing, censura, DNS e tempo | test first-party in-destination + fonti istituzionali appropriate | niente promessa "senza VPN" automatica |
| compatibilità device generica | ambra | varianti regionali e carrier lock | manufacturer exact model + region + provider requirements | chiedere modello esatto; niente liste aggregate non scoped |
| carrier lock | rosso | stato del singolo terminale, non deducibile dal modello | controllo utente/device | trattare come requisito da verificare, non come fact del modello |
| refund eligibility | ambra | terms, policy e FAQ possono divergere per scenario | snapshot terms + policy + effective date | conflitto → conflict, non scegliere la formulazione più favorevole |
| cancellation subscription | ambra | prodotto prepaid vs subscription differente | terms dello specifico product type | mantenere scope product-type separato |
| activation timing | ambra | installazione vs first-network-connection varia per piano | product validity policy | non generalizzare dal provider |
| disponibilità destinazione | rosso | catalogo cambia e può dipendere da purchase context | current catalog snapshot + exact plan | niente "copre N Paesi" come base per pagina destination specifica |
| legalità/obblighi SIM locali | ambra | regolazione complessa e talvolta riferita a SIM locali/licenziatari | regulator/law specifico + legal scope | non dedurre che una travel eSIM è vietata/permessa da una regola generica |
| consumer registration locale | ambra | può riguardare SIM vendute da licenziatari locali | regulator policy specifica | evitare applicazione automatica a provider travel internazionali |
| roaming EU fair use | verde limitato | regola generale UE/EEA non coincide con condizioni travel-eSIM | Commissione UE + prodotto/provider scope | utile come contesto, non come claim su Airalo/Holafly/Ubigi |
| eSIM hardware capability | verde limitato | manufacturer è fonte primaria ma esistono eccezioni regionali | manufacturer exact model/region | pubblicabile solo con scope modello/regione e freshness |
| standard eSIM | verde limitato | standard GSMA non prova implementazione di un device/provider | GSMA spec + manufacturer/provider quando necessario | usare per definizioni tecniche, non per supporto commerciale specifico |
| review/award/Trustpilot | rosso | terza parte, ranking methodology, snapshot e possibile marketing | metodologia indipendente e scope dedicato | escluso dai factual provider claims in questa fase |
| affiliate commission | rosso | incentivo commerciale e dato non editoriale | programma ufficiale + governance M8 separata | non entra in ranking o truth layer; `AFFILIATE_MODE=disabled` |

## 1. Prezzi e cataloghi dinamici

Il test web dell'audit mostra già un rischio concreto: una stessa famiglia di pagine Ubigi può essere resa con valute diverse in base al contesto. Il valore visualizzato è quindi inseparabile da:

```text
final URL
currency context
locale
country context
timestamp
plan/sku
```

Una cattura che salva soltanto `29` non è evidence sufficiente.

### Regola

Fino a uno snapshot layer reale:

- non ampliare il sito con tabelle prezzo automatizzate;
- non materializzare "da €X";
- non confrontare provider per prezzo da homepage;
- non convertire valuta automaticamente nel truth layer.

## 2. Unlimited non significa assenza di limiti

Le product page possono usare `Unlimited` e contemporaneamente rimandare a Fair Use Policy.

Il modello deve separare:

```text
unlimited_marketing_label
fair_use_policy
throttle_threshold
hotspot_share_limit
```

Quando threshold o condizioni non sono disponibili, il claim resta insufficiente per formulazioni assolute.

## 3. Hotspot: generic policy ≠ plan fact

Evidenza osservata nell'audit:

- Airalo dichiara tethering possibile se supportato da device e rete;
- Holafly dichiara che molte eSIM permettono hotspot e invita a controllare la destination plan per il limite;
- Ubigi pubblica istruzioni di tethering e sul commerce site dichiara data sharing.

Queste formulazioni hanno scope diverso.

### Regola

Un futuro confronto hotspot deve richiedere:

```text
provider
plan
destination
share allowance
time window
checked_at
```

Non usare una singola FAQ generica per produrre una matrice provider-wide.

## 4. Network, coverage e performance sono tre cose diverse

```text
network partner claimed
≠ coverage model
≠ observed performance
```

Una pagina provider può elencare operatori e 5G. Una mappa regulator può descrivere copertura modellata. Nessuna delle due dimostra che un utente travel-eSIM otterrà una certa velocità in un edificio specifico.

### Per affermazioni di performance

Servirebbe un protocollo first-party versionato con almeno:

- luogo;
- data/ora;
- device;
- OS;
- plan;
- rete agganciata;
- radio technology;
- server/endpoint;
- più campioni;
- statistiche dichiarate;
- routing/IP osservato.

Fuori scope dell'audit attuale.

## 5. Cina, VPN e routing

La candidate `esim-cina-senza-vpn` esistente è il caso più importante per il nuovo source layer.

Un provider può dichiarare un comportamento di routing. Questo supporta soltanto:

> il provider dichiara X

Non supporta automaticamente:

> X funziona sempre in Cina

Per un claim osservativo occorrerebbe un first-party test con data, località, rete, piano e servizi target. Il risultato scade rapidamente e non deve diventare proprietà eterna del provider.

## 6. Device compatibility

Manufacturer > provider aggregator per la capacità hardware.

Gerarchia proposta:

```text
manufacturer exact model/region
→ carrier/provider requirement
→ provider compatibility list come conferma commerciale
```

Samsung documenta esplicitamente varianti per regione; Apple e Google mantengono caveat per modelli/mercati. Quindi il futuro device checker deve trattare `model + region`, non soltanto il nome commerciale.

## 7. Regulator evidence

Il regulator è fonte primaria per:

- autorità e licenze;
- normative;
- consumer rules;
- spectrum/coverage methodology;
- obblighi locali.

Non è automaticamente fonte primaria per:

- catalogo del travel-eSIM provider;
- prezzo;
- hotspot;
- routing del piano;
- performance percepita.

Una legge sulla vendita/registrazione di SIM locali non va applicata a una travel eSIM internazionale senza analisi del soggetto regolato.

## 8. Contenuto app-only o browser-rendered

Alcuni dati possono non esistere nell'HTML iniziale.

Rischi:

- API private/non documentate;
- contenuto dipendente da cookie/geolocation;
- app mobile;
- rate limit;
- bot protection;
- termini d'uso.

Il futuro fetcher deve fallire chiuso. Non è autorizzato a bypassare autenticazione, bot protection o controlli di accesso.

## 9. Demand sources

GSC, Trends, Reddit, YouTube e SERP sono **supportati come domanda**, non come evidence di commercial truth.

Possono produrre:

```text
question
problem pattern
keyword opportunity
brief candidate
source-discovery task
```

Non possono produrre direttamente:

```text
price
coverage
refund policy
hotspot allowance
provider winner
```

## 10. Gap strutturali emersi

Il modello D1 attuale possiede:

- source registry;
- hash/ETag/Last-Modified;
- freshness;
- claim verification;
- conflicts;
- evidence bundle.

Mancano, per una supply chain verificabile su scala:

1. artifact snapshot immutabile;
2. final URL + capture context;
3. evidence locator;
4. extractor/parser version;
5. claim candidate layer separato;
6. scope strutturato per plan/destination/device-region;
7. standard-body source kind dedicato;
8. protocollo first-party test versionato.

Questi sono **gap documentati**, non autorizzazioni a modificare schema.

## Stop condition

Finché questi gap non vengono chiusi con spike piccoli e verificabili, non avviare:

- crawler multi-provider;
- pSEO fattuale su scala;
- ranking automatico;
- price comparison live;
- claim di performance;
- claim VPN/routing non attribuiti;
- monetizzazione basata su dati non verificati.

# Google measurement access — risultato 26 luglio 2026

## Metodo di autenticazione

L’account umano `info@trovatemi.it` impersona soltanto:

```text
senza-roaming@soliwkr.iam.gserviceaccount.com
```

Il binding assegnato sul singolo service account è:

```text
roles/iam.serviceAccountTokenCreator
```

Le librerie locali usano Application Default Credentials generate tramite impersonazione. Non sono state create, mostrate o versionate chiavi private JSON.

## Google Analytics

Chiamata read-only `accountSummaries.list` riuscita:

```text
account: 402095950
account name: Senzaroaming.it
property: 546858987
property name: SenzaRoaming.it
canEdit: true
```

Chiamata read-only `dataStreams.list` riuscita:

```text
data stream: 15310040016
type: WEB_DATA_STREAM
display name: SenzaRoaming
measurement ID: G-GWJ9YPPVJW
default URI: https://Senzaroaming.it
```

## Google Tag Manager

Chiamate read-only `accounts.list` e `containers.list` riuscite:

```text
account: 6367654517
account name: SenzaRoaming.it
container: 259190865
container name: senzaroaming.it
public ID: GTM-W3LSK9RZ
usage context: web
```

## Google Search Console

Chiamata read-only `sites.list` riuscita:

```text
property: sc-domain:senzaroaming.it
permission: siteOwner
```

Il livello `siteOwner` è superiore al minimo necessario per audit ordinari e potrà essere ridotto dopo la configurazione iniziale.

## Sitemap

La sitemap canonica è stata inviata manualmente il 26 luglio 2026:

```text
https://senzaroaming.it/sitemap.xml
```

Search Console mostrava inizialmente `0 pagine rilevate`, stato normale immediatamente dopo la submission. Non è stata usata la Indexing API e non sono state richieste submission massive di URL.

## Confini

Questo risultato certifica accesso e identificativi. Non certifica ancora:

- container GTM configurato o pubblicato;
- traffico GA4 reale;
- Tag Assistant;
- Network post-consenso;
- DebugView;
- indicizzazione delle URL;
- performance dopo attivazione.

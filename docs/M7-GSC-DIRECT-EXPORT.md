# M7 — Export diretto Google Search Console

Data: **27 luglio 2026**.

## Obiettivo

Acquisire dati reali da Google Search Console senza dipendere da GSC Wizard e senza usare la Indexing API.

La proprietà canonica è:

```text
sc-domain:senzaroaming.it
```

Il tool usa l'endpoint ufficiale read-only:

```text
POST https://www.googleapis.com/webmasters/v3/sites/{siteUrl}/searchAnalytics/query
```

Scope OAuth richiesto:

```text
https://www.googleapis.com/auth/webmasters.readonly
```

## Autenticazione

Il contratto già verificato dal progetto resta:

```text
info@trovatemi.it
→ impersonazione
→ senza-roaming@soliwkr.iam.gserviceaccount.com
→ Application Default Credentials
```

Non vengono create o versionate chiavi private JSON.

Il comando legge un access token temporaneo tramite:

```text
gcloud auth application-default print-access-token \
  --scopes=https://www.googleapis.com/auth/webmasters.readonly
```

Lo scope viene passato esplicitamente dal client. Il token non viene stampato, scritto nei file o incluso nei metadata.

Se la workstation non ha più le ADC impersonate, ricrearle localmente con:

```bash
gcloud auth application-default login \
  --impersonate-service-account senza-roaming@soliwkr.iam.gserviceaccount.com
```

Questa operazione avviene soltanto sulla workstation autorizzata. Non copiare token, codici OAuth o file ADC nella chat, nel repository o nei secret Cloudflare.

## Comando

L'exporter usa soltanto moduli nativi di Node. Non richiede un'installazione completa delle dipendenze del frontend per eseguire l'acquisizione Search Console.

Export iniziale con dati anche freschi:

```bash
npm run seo:gsc-export -- \
  --start 2026-07-26 \
  --end 2026-07-27 \
  --data-state all
```

Export dei soli dati finalizzati:

```bash
npm run seo:gsc-export -- \
  --start 2026-07-01 \
  --end 2026-07-24 \
  --data-state final
```

Filtro opzionale Italia:

```bash
npm run seo:gsc-export -- --country ita
```

## Output

Directory predefinita:

```text
research/seo/gsc/{end-date}/
```

File prodotti:

```text
daily.csv
queries.csv
pages.csv
query-pages.csv
countries.csv
devices.csv
metadata.json
```

`metadata.json` registra:

- proprietà;
- intervallo;
- data di estrazione;
- stato `all` o `final`;
- eventuale filtro Paese;
- righe per export;
- paginazione e metadata restituiti da Google;
- limiti dichiarati della fonte.

## Primo checkpoint live

Eseguito il **27 luglio 2026** sulla workstation autorizzata:

```text
property: sc-domain:senzaroaming.it
range: 2026-07-26 → 2026-07-27
dataState: all
scope: webmasters.readonly
```

Risultato verificato:

```text
daily.csv: 2 rows
queries.csv: 0 rows
pages.csv: 0 rows
query-pages.csv: 0 rows
countries.csv: 0 rows
devices.csv: 0 rows
```

Le due righe giornaliere riportano `0` click e `0` impression. Search Console ha indicato `firstIncompleteDate: 2026-07-26`, quindi lo snapshot è fresco e può cambiare.

Conclusioni:

- autenticazione ADC e impersonazione funzionano;
- proprietà e scope sono corretti;
- il client reale, la paginazione e gli output funzionano contro l'API ufficiale;
- zero righe dimensionali è un risultato valido;
- nessuna keyword ownership o pagina viene modificata sulla base di questo snapshot;
- la sitemap non viene reinviata;
- gli output locali non vengono commitati automaticamente.

## Limiti da preservare

- Search Console può omettere query anonimizzate;
- l'API restituisce le righe principali e non garantisce l'intero universo dei dati;
- dati freschi possono cambiare;
- zero righe è un risultato valido e non autorizza una nuova submission della sitemap;
- click, impression, CTR e posizione non sono volumi Keyword Planner;
- nessun output viene pubblicato automaticamente;
- nessun dato viene scritto in D1;
- nessuna route, copy live, GTM, GA4 o gate editoriale viene modificato.

## Verifica automatizzata

Il contratto locale copre:

```text
argomenti e date
→ proprietà dominio
→ filtro Paese
→ row limit massimo 25.000
→ paginazione startRow
→ comando ADC con scope read-only esplicito
→ autenticazione Bearer non persistita
→ escaping CSV
→ metadata incompleti
→ assenza del token nei risultati
```

Comando:

```bash
npm run smoke:seo-gsc-export
```

La CI usa risposte simulate e non richiede credenziali Google.

## Stato ambiente ChatGPT

Il sandbox usato per preparare questa branch non contiene:

```text
gcloud
Application Default Credentials
variabili GOOGLE_* o CLOUDSDK_*
```

La verifica live è stata quindi eseguita sulla workstation autorizzata e registrata qui tramite gli output prodotti dal client. Nessun token o file ADC è stato trasferito.

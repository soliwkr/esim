# Prossime azioni

Ultimo aggiornamento: **27 luglio 2026**.

Questa lista contiene soltanto il lavoro immediatamente eseguibile.

## M6 measurement foundation — chiusa live

Stato verificato:

```text
PR #91: merged
CI main #468: success
GTM container version 2: published
production deploy: completed
server-side live verification: passed
browser live reject/grant/reload/revoke: passed
PR #93 cleanup workflow: merged
Ads: disabled
remarketing: disabled
affiliate tracking: disabled
```

Documento risultato:

```text
docs/PUBLIC-MEASUREMENT-DEPLOY-RESULT-2026-07-27.md
```

Non riaprire la foundation per aggiungere eventi, Ads o affiliazioni. Ogni nuova capacità measurement richiede dizionario eventi, scope e branch separati.

## Now — chiusura baseline M7

Completato sulla branch stacked:

```text
PR #95: baseline SEO e keyword ownership
PR #96: exporter diretto Search Console
primo export live: 27 luglio 2026
range: 2026-07-26 → 2026-07-27
clicks: 0
impressions: 0
query/page rows: 0
data: incomplete dal 2026-07-26
```

L'assenza iniziale di query e pagine non modifica la keyword map e non autorizza nuove submission.

Ordine operativo immediato:

```text
1. CI e review finali PR #95
2. merge PR #95
3. riallineare la base della PR #96 a main, se richiesto da GitHub
4. CI e review finali PR #96
5. merge PR #96
6. aprire una PR separata per homepage e tre listing
7. verificare preview e smoke
8. affrontare /migliore-esim in una slice successiva
```

Nessun deploy pubblico è implicito nella chiusura documentale e nel tool locale M7.

## Prima slice on-page M7

Scope:

```text
homepage
/destinazioni
/guide
/confronti
```

Output già definiti dalla baseline:

- query target primaria e secondarie per pagina;
- intento e fase del viaggio;
- cannibalizzazioni e query escluse;
- title, H1, promessa e outline;
- internal linking minimo;
- priorità editoriale e criterio di successo;
- nessuna nuova route;
- nessuna generazione massiva o pSEO.

La slice deve modificare soltanto frontend pubblico Astro e contratti SEO pertinenti, con preview, typecheck e smoke. Non deve toccare backend, D1, Workflow, Container, Control Room, gate editoriali o publication capability.

## Search Console

Completato:

```text
proprietà: sc-domain:senzaroaming.it
sitemap: https://senzaroaming.it/sitemap.xml
submission: 26 luglio 2026
exporter diretto read-only: verificato
primo snapshot: acquisito
```

Regole:

- non ripetere la submission;
- non usare la Indexing API;
- attendere dati sostanziali di scansione e ricerca;
- non trattare zero dati iniziali come errore;
- non cambiare ownership sulla base di uno snapshot incompleto;
- richieste manuali soltanto dopo keyword map applicata e copy forte.

## Measurement — osservazione post-lancio

Nei prossimi giorni controllare senza modificare il container:

- presenza di `page_view` in GA4 Realtime;
- assenza di eventi inattesi;
- distribuzione di `route_class` e `page_type`;
- nessun parametro libero o ad alta cardinalità;
- nessun traffico da preview o Control Room;
- nessun `provider_redirect_intent` finché non viene progettato separatamente.

Non introdurre dashboard o automazioni sulla base di poche ore di dati.

## Track parallela M4

```text
conversione brief
→ operazioni claim
→ decisione draft
→ eventuale retry queue
```

La legacy privata resta finché serve come fallback operativo.

## Freeze immediato

- niente Advanced Consent Mode o cookieless pings;
- niente tracking pre-consenso;
- niente eventi fuori dal dizionario;
- niente `provider_redirect_intent` senza branch e checkpoint dedicati;
- niente PII o dati editoriali interni;
- niente analytics nella Control Room o preview;
- niente Ads, remarketing o affiliate tracking;
- niente submission ripetute o Indexing API;
- niente secret o UUID D1 nel repository;
- niente mutation D1, Workflow, Container, AI o gate editoriali fuori scope;
- niente pubblicazione automatica;
- niente rimozione legacy durante la stabilizzazione.

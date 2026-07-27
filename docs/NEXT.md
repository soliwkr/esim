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

## Now — keyword map e copy SEO

La prossima fase pubblica è M7, senza forzare indicizzazione prima che le pagine siano realmente allineate agli intenti.

Ordine operativo:

```text
1. acquisire i primi dati Search Console disponibili
2. costruire keyword map per homepage e listing
3. definire cluster e intenti prioritari
4. riallineare copy di homepage, Destinazioni, Guide e Confronti
5. scegliere le prime URL forti
6. richiedere indicizzazione manuale soltanto per quelle URL
```

Scope iniziale raccomandato:

```text
homepage
/destinazioni
/guide
/confronti
/migliore-esim
```

Output attesi:

- query target primaria e secondarie per pagina;
- intento e fase del viaggio;
- cannibalizzazioni e gap;
- title, H1, description e outline;
- internal linking minimo;
- priorità editoriale e criterio di successo;
- nessuna generazione massiva o pSEO prima della validazione.

## Search Console

Completato:

```text
proprietà: sc-domain:senzaroaming.it
sitemap: https://senzaroaming.it/sitemap.xml
submission: 26 luglio 2026
```

Regole:

- non ripetere la submission;
- non usare la Indexing API;
- attendere i primi dati di scansione;
- non trattare zero dati iniziali come errore;
- richieste manuali soltanto dopo keyword map e copy forte.

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

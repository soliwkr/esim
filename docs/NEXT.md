# Prossime azioni

Ultimo aggiornamento: **28 luglio 2026**.

Questa lista contiene soltanto il lavoro immediatamente eseguibile e i gate operativi già definiti.

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

## M7 baseline e Search Console — chiuse

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

## Prima slice on-page M7 — verificata, non deployata

PR #97 applica la baseline a:

```text
homepage
/destinazioni
/guide
/confronti
```

Stato verificato:

```text
homepage owner: esim viaggio
hub geografico: /destinazioni
hub pratico: /guide
hub comparativo: /confronti
CI branch: success
runtime smoke: success
Control Room smoke: success
deploy: non autorizzato
```

La slice contiene title, description, H1, promessa, criteri e internal linking verso sole URL esistenti. Preview e canonical usano URL coerenti con il rispettivo namespace.

Non contiene nuove route, pSEO, backend, D1, Workflow, Container, AI, publication capability, affiliazioni o nuovi eventi analytics.

## Slice M7 `/migliore-esim` — verificata, non deployata

```text
PR #98: implementazione verificata
branch: feat/m7-migliore-esim-alignment
base: 006472311ed8f727873257c94c4f53f271ad5368
CI branch: success
deploy: non autorizzato
```

Implementato:

- ownership dell’intento commerciale `migliore esim`;
- title, meta description e H1 target;
- struttura decisionale con criteri, scenari, limiti e FAQ;
- nessun ranking, prezzo specifico, provider vincitore o claim commerciale nuovo;
- ponte legacy temporaneo limitato al solo seed `migliore-esim`;
- loader e query published-only esistenti riusati;
- link in uscita verso homepage, hub e guide pubblicate;
- nessuna riscrittura delle altre pagine per aggiungere link in entrata;
- preview e canonical namespace-safe;
- smoke dedicato canonical, preview, published-only, desktop, mobile e overflow;
- CMP, measurement e Control Room invariati.

Il ponte deve restare incapace di aggiungere fatti commerciali e deve essere rimosso quando la pagina sarà rimaterializzata tramite il workflow grounded.

## Gate di chiusura PR #98

La chiusura autorizzata della slice segue questa sequenza:

```text
1. rendere ready la PR #98
2. eseguire il merge con merge commit soltanto dopo CI verde sull’head documentale corrente
3. verificare la CI del merge commit su main
4. non eseguire deploy pubblico
5. mantenere AFFILIATE_MODE=disabled
```

Ready, merge e deploy restano decisioni distinte. Il merge deve usare l’head atteso; il deploy e la verifica live della homepage, dei tre hub e di `/migliore-esim` richiedono un'autorizzazione esplicita separata.

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
- richieste manuali soltanto dopo keyword map applicata, copy forte e verifica live.

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

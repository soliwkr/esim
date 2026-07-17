# Prossime azioni

Questa lista contiene soltanto il lavoro immediatamente eseguibile. La roadmap completa vive in `ROADMAP.md`.

Ultimo aggiornamento: **17 luglio 2026**.

## Now

### 1. Distribuire la Control Room MVP

Avviare manualmente il workflow di produzione su `main` dopo il merge della PR.

Verificare:

```text
/control-room
→ HTTP 200
→ cache-control: no-store
→ x-robots-tag: noindex, nofollow
```

Lo snapshot iniziale deve mostrare almeno:

```text
5 claim verified
1 claim insufficient
1 draft approved
1 pagina review
0 pagine published
```

### 2. Testare le azioni principali dalla UI

Dalla Control Room verificare, senza usare accesso diretto a D1:

- refresh dello snapshot;
- avvio manuale di una ricerca recent-demand;
- lettura di brief, claim, bundle, draft e queue;
- apertura della preview privata;
- registrazione controllata di un esito claim;
- generazione e decisione editoriale su un draft.

Non testare alcuna pubblicazione: la dashboard non deve offrire questa funzione.

### 3. Aggiungere Cloudflare Access

Proteggere `/control-room` con una policy Access dedicata.

Obiettivo:

```text
Cloudflare Access
→ shell Control Room
→ sessione operativa browser
→ API di manutenzione
```

La sessione applicativa resta un secondo livello; non deve comparire negli URL o nel repository.

### 4. Completare l'health aggregato runtime

Lo snapshot corrente legge D1 e configurazione. Il passo successivo deve verificare anche:

```text
Worker
D1
Container
Workflow
AI Gateway / Vertex
queue
fonti scadute
errori recenti
```

Ogni componente deve avere stato `ok`, `warning` o `error`, più ultima verifica e dettaglio sintetico.

### 5. Automatizzare il refresh delle fonti scadute

Le verifiche hanno `validUntil` differenti. Alla scadenza:

```text
fonte due
→ task refresh_source
→ nuova verifica
→ nuovo evidence bundle
→ draft precedente eventualmente stale
```

Nessun refresh deve modificare automaticamente una pagina pubblicata.

### 6. Preparare il primo blocco Tier 1

Dopo la verifica della dashboard:

- definire le prime pagine ad alta utilità;
- creare evidence set separati;
- usare lo stesso percorso claim → readiness → review;
- mantenere affiliazioni disabilitate finché il sistema editoriale non è stabile.

## Completato

- redirect canonico e vere 404;
- recent-demand Workflow e osservabilità;
- quality gate `eligible` / `filtered`;
- Vertex AI attraverso Cloudflare AI Gateway;
- primo brief AI reale;
- Opportunity, Evidence e Priority Score;
- claim generali e atomici;
- 5 verifiche ufficiali e 1 esito `insufficient`;
- Page Readiness Gate;
- evidence bundle versionato;
- renderer v2 con provenienza campo → claim;
- draft `2` approvato editorialmente;
- pagina ancora in `review` e pubblicamente `404 noindex`;
- Control Room MVP implementata nella PR corrente.

## Dopo la Control Room

1. Search Console e sitemap operative;
2. CMP, GTM e GA4;
3. dizionario canonico degli eventi;
4. OpenSEO come servizio condiviso;
5. trend e stagionalità;
6. affiliazioni controllate;
7. funzioni multi-progetto dello studio.

## Definition of Done del checkpoint attuale

- [ ] PR Control Room unita;
- [ ] deploy di produzione completato;
- [ ] `/control-room` verificata nel browser;
- [ ] snapshot aggregato verificato sui dati reali;
- [ ] almeno una azione UI testata end-to-end;
- [ ] Cloudflare Access configurato;
- [x] nessuna funzione di pubblicazione presente;
- [x] `docs/STATUS.md` aggiornato con il draft v2 approvato.

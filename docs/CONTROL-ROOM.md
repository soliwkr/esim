# Senza Roaming Control Room

La Control Room è il pannello operativo privato del progetto.

## URL

```text
https://senzaroaming.it/control-room
```

La pagina è `noindex`, non incorpora dati nel documento HTML e interroga soltanto le API di manutenzione già protette.

## Sessione browser

La prima versione richiede l'apertura di una sessione operativa nel browser.

Le informazioni di sessione:

- restano nella sessione della scheda;
- non vengono inserite negli URL;
- non vengono salvate nel repository;
- possono essere rimosse con il pulsante **Blocca**;
- non devono essere copiate in chat, issue o log pubblici.

Cloudflare Access resta il livello successivo consigliato per proteggere anche il caricamento della shell.

## Snapshot aggregato

La Control Room mostra:

- capacità configurate;
- conteggi di fonti, queue, ricerca, brief, claim, bundle, draft e pagine;
- run e segnali recenti;
- pipeline editoriale con Priority Score;
- claim atomici, fonti, scadenze e task;
- Page Readiness ed evidence bundle;
- draft e renderer usato;
- coda operativa;
- audit unificato recente.

## Azioni disponibili

La dashboard può:

- avviare il Workflow recent-demand;
- accettare un brief;
- convertire un brief in task di verifica;
- valutare Page Readiness;
- approvare un bundle soltanto per un draft in `review`;
- generare un draft evidence-bound;
- approvare o respingere editorialmente un draft;
- aprire una preview privata;
- registrare un esito atomico con fonte, evidenza e valore JSON esplicito.

## Limiti invarianti

La Control Room non possiede una funzione di pubblicazione.

```text
draft approved
≠ page published
```

Un draft approvato mantiene:

```text
editorial_review_drafts.status = approved
pages.status = review
```

La pubblicazione richiede un futuro gate separato, un evidence bundle idoneo e una decisione umana distinta.

## Test di produzione

Dopo il deploy verificare che la pagina restituisca:

```text
HTTP 200
cache-control: no-store
x-robots-tag: noindex, nofollow
```

Nello snapshot iniziale ci aspettiamo almeno:

```text
5 claim verified
1 claim insufficient
1 draft approved
1 pagina review
0 pagine pubblicate
```

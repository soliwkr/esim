# Production recovery checkpoint — 29 luglio 2026

## Scopo

Questo documento registra il ripristino tecnico della configurazione M6 dopo la regressione introdotta dal deploy automatico M7 #62 e il successivo closeout browser reale del consenso.

## Stato GitHub

```text
PR #99 — Harden production deploy safety
merge: fd511a5ffd51b55bce7b4b28b1d01b4f43ded8e4

PR #100 — Fix production live Control Room smoke contract
merge: f2579346ab9591015e31cf54f3a9e4efa4791ceb

PR #101 — Fix production consent smoke dialog visibility
merge: f2df5cd6ef4bf4784205911e80786f55c28f3dd0
```

La pipeline production è manual-only (`workflow_dispatch`), usa `npm ci` e la sequenza canonica `npm run deploy`. Il deploy non crea D1 e non applica migration o mutation D1 remote.

## Dispatch di recovery

Run riuscito:

```text
GitHub Actions run: 30439227471
commit: f2df5cd6ef4bf4784205911e80786f55c28f3dd0
conclusion: success
Worker version: db76b202-2a62-4871-8abf-61c488316285
```

Il run ha completato con successo:

- checkout del commit atteso;
- `npm ci`;
- Cloudflare types;
- typecheck;
- preflight production fail-closed;
- verifica prerequisiti Cloudflare Access;
- build Astro;
- preparazione CMP nel config compilato;
- preparazione GTM/GA4 consent-gated nel config compilato;
- risoluzione read-only del binding D1;
- deploy Worker, Container e Workflow;
- smoke live pubblico, preview, SEO, published-only, CMP e measurement;
- health legacy Control Room v3;
- protezione anonima della Control Room foundation;
- accesso service-token alla Control Room foundation;
- validazione JWT origin;
- snapshot proxy server-side.

`AFFILIATE_MODE` è rimasto `disabled`.

## Smoke pubblico e measurement

Il workflow ha riportato:

```text
Production public, preview, SEO, consent and measurement smoke passed.
```

Il contratto verificato include:

- cinque route M7 canoniche;
- preview namespaced;
- sitemap e robots;
- pagine review non pubblicate;
- CMP configurata sulle sole route canoniche;
- bootstrap measurement inerte prima del consenso;
- nessun caricamento GTM pre-consenso nel contratto HTML;
- attivazione GTM una sola volta nello smoke consent-gated;
- contesto GA4 bounded;
- `sr_page_view_ready` non duplicato.

Lo smoke Chromium intercetta intenzionalmente lo script iubenda e usa uno stub controllato per provare il contratto applicativo. Per questo il widget reale è stato ricertificato separatamente nel browser.

## Browser reale — closeout CMP e measurement

Ricertificazione eseguita in una sessione Chrome Incognito con DevTools Network. Durante la verifica finale il blocco DNS locale è stato disattivato, così l'assenza di richieste Google potesse essere attribuita al consenso e non al filtro di rete.

### Stato iniziale

- banner iubenda reale visibile;
- controllo preferenze disponibile;
- prima di qualsiasi scelta il filtro Network `google` mostrava zero richieste Google;
- nessun GTM o GA4 pre-consenso.

### Rifiuto e persistenza

Dopo `Rifiuta` e reload:

```text
Google requests: 0
GTM: assente
GA4 collect: assente
```

Il banner non è stato riproposto impropriamente e la preferenza di rifiuto è risultata persistita.

### Consenso e persistenza

Dopo consenso alla finalità `Misurazione`:

- il sito ha attivato GTM soltanto dopo il consenso;
- il container richiesto è `GTM-W3LSK9RZ`;
- dopo reload con consenso persistito il Google tag ha risposto HTTP 200;
- GA4 ha inviato una richiesta `collect` HTTP 204 alla stream `G-GWJ9YPPVJW`;
- il payload mostrava `en=page_view`;
- `dl=https://senzaroaming.it/destinazioni`;
- il contesto bounded osservato includeva `ep.route_class=listing` e `ep.page_type=destination_listing`;
- nel page load osservato era presente una sola richiesta `collect` filtrata come evento GA4.

### Revoca e reload

La preferenza `Misurazione` è stata disattivata e salvata nel pannello iubenda. Dopo reload, con il filtro Network `google` e senza blocco DNS locale:

```text
Google requests: 0 / 7
GTM: assente
Google tag: assente
GA4 collect: assente
```

Questo chiude la ricertificazione reale del ciclo:

```text
pre-consenso → zero Google
rifiuto → zero Google
reload dopo rifiuto → zero Google
consenso → GTM attivo
reload con consenso → GA4 collect HTTP 204
page_view reale → verificato
revoca salvata → Misurazione off
reload dopo revoca → zero Google
```

## Control Room

Legacy:

```text
Control Room v3 is live and the served JavaScript is syntactically valid.
```

Foundation:

```text
Cloudflare Access, origin JWT validation and server-side snapshot proxy are active.
```

La route `/control-room-foundation*` resta il perimetro Access. La legacy `/control-room` resta backend-owned come fallback operativo finché le mutation residue non sono migrate.

## D1

Il deploy ha eseguito soltanto la risoluzione del binding tramite il contratto `prepare-production-d1-binding.mjs` e il normale `wrangler deploy`.

Non risultano comandi di creazione database, migration remote o mutation D1 nel workflow production di recovery.

## Esito

Il ripristino M6 è chiuso live:

- iubenda CMP reale nuovamente attiva;
- Consent Mode Basic preservato;
- GTM e GA4 nuovamente attivi soltanto dopo consenso;
- rifiuto e revoca impediscono il caricamento Google;
- persistenza verificata in entrambe le direzioni;
- `page_view` reale verificato;
- M7 resta invariata;
- affiliazioni restano disabilitate;
- nessuna migration o mutation D1.

## Guardrail invariati

- nessun Advanced Consent Mode;
- nessun cookieless ping;
- nessun Ads o remarketing;
- nessuna affiliazione;
- nessuna Indexing API;
- nessuna nuova submission Search Console;
- nessuna publication capability;
- nessuna mutation o migration D1;
- nessuna modifica a contenuti M7.

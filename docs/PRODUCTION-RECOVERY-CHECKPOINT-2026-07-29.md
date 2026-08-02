# Production recovery checkpoint — 29 luglio 2026

## Scopo

Questo documento registra il ripristino tecnico della configurazione M6 dopo la regressione introdotta dal deploy automatico M7 #62.

Non è ancora il closeout browser definitivo del vendor CMP: il workflow production usa uno stub controllato per verificare il contratto consent-gated e non sostituisce una ricertificazione manuale del widget iubenda reale.

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

## Checkpoint ancora aperto

Il browser smoke production intercetta intenzionalmente lo script iubenda e usa uno stub controllato per verificare il contratto di attivazione.

Restano quindi da ricertificare sul widget iubenda reale, in una sessione browser pulita:

1. banner reale visibile;
2. rifiuto con `purpose 4=false` e zero richieste Google;
3. consenso con `purpose 4=true`;
4. un solo GTM e un solo `page_view` per load;
5. persistenza dopo reload;
6. revoca della finalità 4;
7. zero nuove richieste Google dopo revoca e reload.

Fino a quella verifica non dichiarare che reject/grant/reload/revoke reali sono stati ricertificati il 29 luglio 2026.

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

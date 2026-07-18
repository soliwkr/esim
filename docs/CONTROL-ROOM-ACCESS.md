# Cloudflare Access per la Control Room

Questa procedura protegge `/control-room-foundation` con due livelli indipendenti:

1. Cloudflare Access applica la policy prima del Worker;
2. il custom Worker entrypoint valida il JWT `Cf-Access-Jwt-Assertion` prima di delegare la route ad Astro.

La sessione applicativa con `MAINTENANCE_TOKEN` resta un secondo livello per leggere lo snapshot protetto. Nessun token deve essere inserito in URL, HTML, log o repository.

## Prerequisiti

- zona `senzaroaming.it` attiva nello stesso account Cloudflare del Worker;
- organizzazione Cloudflare Zero Trust configurata;
- identity provider disponibile;
- accesso amministrativo a GitHub Actions secrets e ai Worker secrets.

## 1. Creare l'applicazione Access

Nel dashboard Cloudflare:

1. aprire **Zero Trust → Access controls → Applications**;
2. creare una nuova applicazione **Self-hosted and private**;
3. aggiungere il public hostname `senzaroaming.it`;
4. proteggere il path `/control-room-foundation*`;
5. aggiungere una policy **Allow** limitata all'identità operativa autorizzata;
6. mantenere il comportamento deny-by-default;
7. copiare l'**Application Audience (AUD) Tag**.

La route non deve avere una policy Bypass pubblica.

## 2. Configurare la validazione nell'origine

Impostare sul Worker `senza-roaming` questi secret, senza versionarne i valori:

- `CF_ACCESS_TEAM_DOMAIN` — team domain completo, per esempio `https://<team>.cloudflareaccess.com`;
- `CF_ACCESS_AUD` — Audience Tag dell'applicazione Access.

Il Worker usa il team domain per recuperare le chiavi pubbliche Cloudflare, accetta soltanto JWT RS256, verifica firma, issuer, audience, scadenza e tempi di validità. Se la configurazione manca, la route risponde `503`; se il JWT manca o non è valido, risponde `403`.

`CF_ACCESS_TEST_JWKS` esiste esclusivamente negli smoke locali con chiavi effimere e non deve essere configurato in produzione.

## 3. Creare il service token per lo smoke live

In Cloudflare Zero Trust:

1. creare un service token dedicato al deploy di Senza Roaming;
2. aggiungere all'applicazione una policy **Service Auth** che consenta soltanto quel token;
3. salvare Client ID e Client Secret una sola volta.

Aggiungere nei GitHub Actions secrets:

- `CF_ACCESS_CLIENT_ID`;
- `CF_ACCESS_CLIENT_SECRET`.

Il workflow usa questi valori soltanto negli header `CF-Access-Client-Id` e `CF-Access-Client-Secret` dello smoke live.

## 4. Verifica prima del merge

La PR può essere mergiata soltanto quando:

- [ ] l'app Access esiste sul path corretto;
- [ ] la policy utente autorizza soltanto l'identità prevista;
- [ ] la policy Service Auth autorizza il service token di CI;
- [ ] i Worker secrets `CF_ACCESS_TEAM_DOMAIN` e `CF_ACCESS_AUD` esistono;
- [ ] i GitHub secrets `CF_ACCESS_CLIENT_ID` e `CF_ACCESS_CLIENT_SECRET` esistono;
- [ ] la CI della PR è verde;
- [ ] nessun secret compare nel diff o nei log.

## 5. Verifica dopo il deploy

Il workflow di produzione verifica automaticamente:

- richiesta anonima alla route: non deve mai restituire `200`;
- richiesta con service token: deve restituire la shell Astro `200`;
- header `Cache-Control: no-store` e `X-Robots-Tag: noindex`;
- presenza di una sola island Astro/React;
- Control Room legacy e `/api/health` ancora operative;
- nessuna capacità di pubblicazione introdotta.

## Rollback

In caso di errore:

1. non rimuovere Access lasciando la route pubblica;
2. ripristinare il commit Worker precedente oppure mantenere il guard fail-closed;
3. verificare team domain, AUD, policy e service token;
4. riattivare la route soltanto dopo smoke autenticato riuscito.

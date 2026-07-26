# Public consent CMP-only deployment result

Data: **26 luglio 2026**.

## Scope

Attivare in produzione soltanto la foundation iubenda già implementata, mantenendo disabilitati:

```text
GTM
GA4
Google Ads
remarketing
affiliate tracking
```

Nessuna modifica a D1, Workflows, Container, AI, gate editoriali o publication capability era autorizzata.

## Riferimenti

```text
PR #83 — scope consent e measurement
PR #84 — spike tecnico iubenda
PR #85 — remote embed reale
PR #90 — deploy osservabile e contratto D1 runtime
```

Remote embed pubblico:

```text
https://embeds.iubenda.com/widgets/{public-uuid}.js
```

L’UUID pubblico resta versionato nel repository; non è un secret.

## Blocco scoperto durante il deploy

Il `wrangler.jsonc` canonico conserva intenzionalmente:

```text
database_id=REPLACE_WITH_D1_DATABASE_ID
```

Il primo tentativo reale ha raggiunto Cloudflare ma è stato rifiutato perché la binding `DB` compilata non conteneva un UUID remoto valido.

Non è stato copiato il database ID nel repository. È stato introdotto un preparatore fail-closed:

```text
scripts/prepare-production-d1-binding.mjs
```

Il preparatore:

1. usa Wrangler autenticato per elencare i database D1 remoti;
2. richiede un solo database con nome esatto `senza-roaming`;
3. valida il relativo UUID;
4. richiede una sola binding compilata `DB` per `senza-roaming`;
5. sostituisce il placeholder soltanto in `apps/web/dist/server/wrangler.json`;
6. non stampa e non versiona l’UUID;
7. fallisce se trova ambiguità, un UUID invalido o un ID discordante.

Il config sorgente resta portabile e privo di identificatori remoti specifici dell’account.

## Comando di deploy risultante

```text
npm run build
→ scripts/prepare-production-consent-config.mjs
→ scripts/prepare-production-d1-binding.mjs
→ wrangler deploy sul config compilato
```

Il preparatore consent richiede:

```text
CMP_PROVIDER=iubenda
CMP_EMBED_ID=<UUID pubblico versionato>
GTM_ID=
```

Il deploy viene bloccato se `GTM_ID` è valorizzato o se ricompaiono le variabili legacy `CMP_SITE_ID` e `CMP_COOKIE_POLICY_ID`.

## Verifica automatizzata

Run osservabile:

```text
workflow: Deploy public consent checkpoint
run id: 30197982680
head: 933252556d99aa227b428f18eb0ede34f686b06a
result: success
```

Completati con successo:

- installazione dipendenze e Chromium;
- tipi Cloudflare;
- Astro check e TypeScript strict;
- build del Worker di produzione;
- smoke isolato della consent foundation;
- risoluzione remota della binding D1;
- deploy Wrangler;
- verifica HTTP post-deploy sulle route reali.

## Verificato in produzione

- `/` contiene esattamente un embed iubenda con l’UUID configurato;
- `/privacy` contiene esattamente un embed iubenda con l’UUID configurato;
- homepage e Privacy espongono `Gestisci preferenze cookie`;
- Privacy dichiara iubenda configurata e GTM/GA4 inattivi;
- nessun riferimento a Google Analytics, Google Tag Manager, Ads o DoubleClick nell’HTML verificato;
- `/astro-foundation` non contiene la CMP;
- `/api/health` non contiene la CMP;
- `/sitemap.xml` non contiene la CMP;
- `/robots.txt` non contiene la CMP;
- D1 e contratti editoriali non sono stati modificati.

## Non ancora certificato

La verifica automatizzata prova il deployment e il boundary server-side, ma non chiude il checkpoint UX del vendor reale.

Restano da verificare in un browser pulito:

- banner visibile alla prima visita;
- Accetta;
- Rifiuta;
- Personalizza;
- persistenza di consenso e rifiuto;
- riapertura dal footer;
- modifica e revoca;
- configurazione remota GDPR globale e Basic Consent Mode;
- richieste di rete effettive del vendor;
- comportamento se iubenda non risponde;
- accessibilità da tastiera del banner reale;
- layout mobile e assenza overflow;
- impatto prestazionale;
- eventuale registro preferenze disponibile nel piano account.

## Stato finale del checkpoint tecnico

```text
CMP deploy: completato
server-side route boundary: verificato live
GTM: disabilitato
GA4: disabilitato
Ads: disabilitati
affiliate tracking: disabilitato
vendor UX acceptance: aperta
```

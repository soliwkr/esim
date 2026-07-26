# iubenda consent foundation — spike and remote embed result

Ultimo aggiornamento: **26 luglio 2026**.

## Fase 1 — spike tecnico

```text
branch spike/iubenda-consent-foundation
PR #84 — Spike iubenda consent foundation
merge 6e3b0047af67219af7429749003d86f36af61237
CI applicativa #411
CI finale #415
```

### Obiettivo

Verificare che Senza Roaming possa integrare una CMP iubenda soltanto sulle pagine pubbliche canoniche, mantenendo il sito invariato quando la configurazione è assente o invalida.

### Risultato dello spike

Lo spike ha verificato:

- resolver server-only fail-closed;
- configurazione vuota o invalida senza output parziale;
- CMP soltanto sulle risposte canonical indexable;
- preview, Control Room, API, `/go/*`, sitemap, robots, 404 e file probe esclusi;
- footer per riaprire le preferenze;
- pagina Privacy condizionale;
- nessun GTM, GA4, Ads o affiliate tracking;
- nessuna richiesta Google nel browser harness;
- accessibilità da tastiera, desktop, mobile e assenza overflow;
- tutte le regressioni pubbliche e private.

Il prototipo iniziale usava il formato documentato legacy:

```text
configurazione inline con siteId e cookiePolicyId
→ autoblocking/{siteId}.js
→ iubenda_cs.js
```

La CI usava ID numerici fittizi e stub locali. Non certificava l’account iubenda reale.

## Fase 2 — discovery sull’account reale

Nella dashboard di `senzaroaming.it`, il comando:

```text
Privacy Controls and Cookie Solution
→ Integra
```

non ha restituito il triplet legacy. Ha restituito un solo embed remoto:

```text
<script type="text/javascript"
  src="https://embeds.iubenda.com/widgets/{public-uuid}.js"></script>
```

Il numero presente nell’URL dashboard `/flow/{number}` non viene interpretato come `siteId`. L’identificativo canonico dell’integrazione è l’UUID pubblico incluso nello script fornito dal prodotto.

La configurazione remota rende superfluo ricostruire manualmente `siteId`, `cookiePolicyId`, autoblocking e runtime. Il repository integra il codice effettivamente fornito dall’account invece di dedurre parametri interni.

## Fase 3 — adattamento e attivazione CMP-only

```text
branch feat/public-consent-foundation
PR #85 — Activate iubenda remote consent foundation
CI applicativa #421 completamente verde
```

### Contratto aggiornato

Variabili runtime:

```text
CMP_PROVIDER
CMP_EMBED_ID
```

Regole:

- entrambi vuoti → `disabled`;
- uno solo presente → `invalid/incomplete`;
- provider diverso da `iubenda` → `invalid/unsupported_provider`;
- UUID malformato → `invalid/invalid_embed_id`;
- configurazione valida → un solo URL `https://embeds.iubenda.com/widgets/{uuid}.js`.

Le variabili legacy non appartengono più al contratto:

```text
CMP_SITE_ID
CMP_COOKIE_POLICY_ID
```

### Route incluse nel test dedicato

```text
/
/guide
/destinazioni
/confronti
/metodo
/trasparenza
/privacy
/{slug-published}
```

### Route escluse

```text
/astro-foundation*
/control-room-foundation*
/api/*
/go/*
/sitemap.xml
/robots.txt
404 e file probe
```

### Separazione fra base e deploy

Il config Wrangler base resta fail-closed:

```text
CMP_PROVIDER=
CMP_EMBED_ID=
GTM_ID=
```

Questo preserva sviluppo, CI e regressioni storiche senza CMP.

Prima del deploy, `scripts/prepare-production-consent-config.mjs` modifica il solo config compilato:

```text
CMP_PROVIDER=iubenda
CMP_EMBED_ID=<UUID pubblico versionato>
GTM_ID=
```

Il preparatore:

- non modifica il config sorgente;
- rifiuta un `GTM_ID` valorizzato;
- rifiuta la ricomparsa delle variabili legacy;
- non legge password, token, API key o service-account JSON;
- rende riproducibile la configurazione reale di produzione.

### Verifica CI #421

- tipi Cloudflare;
- Astro check e TypeScript strict;
- build Worker di produzione;
- migrazioni D1 invariate;
- quality gate e golden evaluation;
- Container build e smoke;
- regressioni storiche con CMP base disabilitata;
- contratto puro UUID;
- preparazione production config e guard `GTM_ID`;
- runtime isolato con UUID fittizio;
- un solo embed remoto sulle route incluse;
- assenza del vecchio triplet iubenda;
- assenza CMP sulle route escluse;
- assenza di richieste Google Analytics, Tag Manager, Ads e DoubleClick;
- footer preferenze raggiungibile da tastiera;
- harness locale di riapertura preferenze;
- desktop, mobile e assenza overflow;
- tutte le suite Control Room.

## Limite dichiarato

La CI intercetta la risorsa remota e la sostituisce con uno stub deterministico. Non certifica ancora:

- aspetto e testo effettivi del banner;
- presenza reale dei comandi Accetta, Rifiuta e Personalizza;
- persistenza reale delle scelte;
- modifica e revoca;
- registro preferenze iubenda;
- configurazione remota GDPR e Consent Mode;
- comportamento in caso di errore vendor reale;
- peso, timing e impatto prestazionale della risorsa;
- richieste di rete effettive generate dal vendor.

## Stato produzione

Prima del merge e deploy della PR #85:

```text
production CMP: disabilitata
GTM: disabilitato
GA4: disabilitato
vendor live: non verificato
```

La PR #85 non viene dichiarata live sulla sola base della CI.

## Prossimo checkpoint

```text
canonici finali
→ CI finale
→ ready e merge PR #85
→ deploy CMP-only
→ verifica browser reale
```

La verifica live deve coprire:

- banner alla prima visita;
- Accetta, Rifiuta e Personalizza;
- persistenza;
- riapertura dal footer;
- revoca e modifica;
- esclusione delle route non canoniche;
- nessuna richiesta GTM/GA4/Google Analytics;
- fallback leggibile se il vendor non risponde;
- tastiera, mobile e overflow;
- performance;
- coerenza della pagina Privacy.

## Esito attuale

```text
integration boundary: verificato
real embed format: identificato e implementato
application CI: verde (#421)
production deploy: non ancora eseguito
vendor live: non ancora verificato
GTM: disabilitato
GA4: disabilitato
next: CI finale, merge, deploy CMP-only e checkpoint live
```

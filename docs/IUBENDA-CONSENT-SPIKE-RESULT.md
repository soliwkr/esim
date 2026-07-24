# iubenda consent foundation — spike result

Data: **25 luglio 2026**.

## Branch e PR

```text
branch spike/iubenda-consent-foundation
PR #84 — Spike iubenda consent foundation
CI applicativa #411 completamente verde
```

## Obiettivo

Verificare che Senza Roaming possa integrare iubenda sulle sole pagine pubbliche canoniche, mantenendo il comportamento di produzione invariato finché la configurazione CMP non viene fornita.

## Implementato

- resolver server-only fail-closed per `CMP_PROVIDER`, `CMP_SITE_ID` e `CMP_COOKIE_POLICY_ID`;
- configurazione disabilitata quando tutte le variabili sono vuote;
- configurazione rifiutata quando è incompleta, usa un provider non supportato o ID non numerici positivi;
- script soltanto sulle risposte canonical pubbliche indexable;
- ordine:

```text
configurazione inline
→ https://cs.iubenda.com/autoblocking/{siteId}.js
→ https://cdn.iubenda.com/cs/iubenda_cs.js
```

- autoblocking senza `async` o `defer`;
- runtime iubenda asincrono;
- `googleConsentMode: true` nella configurazione;
- applicazione GDPR globale;
- pulsanti Accetta, Rifiuta e Personalizza;
- widget fluttuante disattivato;
- link footer `iubenda-cs-preferences-link` per riaprire le preferenze;
- Privacy page condizionale e coerente con stato attivo/inattivo;
- nessun GTM o GA4.

## Route incluse nella configurazione locale

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

## Route escluse

```text
/astro-foundation*
/control-room-foundation*
/api/*
/go/*
/sitemap.xml
/robots.txt
404 e file probe
```

## Verifica CI #411

- tipi Cloudflare;
- Astro check e TypeScript strict;
- build Worker di produzione;
- migrazioni D1 invariate;
- quality gate e golden evaluation;
- Container build e smoke;
- tutte le regressioni pubbliche storiche con CMP disabilitata;
- smoke dedicato con ID fittizi;
- ordine e unicità degli script;
- assenza CMP sulle route escluse;
- assenza di riferimenti o richieste Google Tag Manager/Analytics;
- configurazione disponibile a runtime;
- link preferenze raggiungibile da tastiera;
- harness locale che verifica l’apertura del controllo preferenze;
- desktop, mobile e assenza overflow;
- tutte le suite Control Room.

## Limite dichiarato

La CI non contatta o certifica il servizio iubenda reale. Le richieste esterne vengono intercettate e sostituite con stub locali per rendere il test deterministico e per evitare dipendenze di rete.

Non sono ancora verificati con un account reale:

- aspetto e contenuto effettivo del banner;
- persistenza reale di accettazione e rifiuto;
- log delle preferenze iubenda;
- comportamento reale Google Consent Mode;
- performance della risorsa vendor;
- eventuali impostazioni remote della dashboard iubenda.

## Stato produzione

```text
CMP_PROVIDER=
CMP_SITE_ID=
CMP_COOKIE_POLICY_ID=
GTM_ID=
```

Con le variabili vuote:

- nessuno script iubenda viene emesso;
- il footer non mostra il comando preferenze;
- la pagina Privacy continua a dichiarare CMP, GTM e GA4 inattivi;
- il sito mantiene il comportamento M5.7.

## Prossimo checkpoint

1. creare/configurare il sito `senzaroaming.it` nella dashboard iubenda;
2. configurare Privacy Controls and Cookie Solution in italiano;
3. impostare Basic Consent Mode e blocco preventivo;
4. recuperare i due identificativi pubblici `siteId` e `cookiePolicyId` dal codice Embed;
5. configurare le vars Cloudflare senza secret;
6. deploy controllato della sola CMP, ancora senza GTM/GA4;
7. verificare live Accetta, Rifiuta, Personalizza, persistenza, revoca, rete e performance;
8. registrare la decisione vendor finale.

## Esito

```text
integration boundary: verificato
vendor live: non verificato
production CMP: disabilitata
GTM: disabilitato
GA4: disabilitato
next: configurazione iubenda reale e live CMP checkpoint
```

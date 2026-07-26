# Stato del progetto

Data di riferimento: **26 luglio 2026**.

Questo documento fotografa lo stato operativo reale di Senza Roaming.

## Stato sintetico

| Area | Stato | Nota |
|---|---|---|
| Dominio principale | Operativo | `https://senzaroaming.it` serve Astro |
| Dominio `www` | Da ricontrollare | redirect implementato, checkpoint definitivo aperto |
| Worker e D1 | Operativi | un solo custom Worker; D1 remoto fino a `0020` |
| Workflow e Container | Operativi | ciclo recent-demand verificato end-to-end |
| AI Gateway e Vertex AI | Operativi | percorso AI controllato |
| Ciclo editoriale | Operativo fino al draft approvato | nessuna pubblicazione automatica |
| Control Room nuova | Operativa | read-only completo; prima mutation live |
| Control Room legacy | Transitoria | fallback delle mutation residue |
| Frontend pubblico Astro | Live | M5.7 chiusa e verificata |
| Sitemap e robots | Live | endpoint Astro raggiungibili |
| Catalog pilot | Audit live completato | 1 candidate, 0 eligible, 0 selected |
| Scope measurement M6 | Completato | PR #83, CI #408 |
| iubenda consent spike | Mergiato | PR #84, CI finale #415; vecchio harness locale |
| Remote embed activation | Implementata in draft | PR #85, CI applicativa #421 verde; non ancora deployata |
| GTM e GA4 | Non attivi | nessun tag o ping Google |
| Affiliazioni | Disabilitate | nessun link remunerato attivo |

## Architettura live

```text
Cloudflare Assets
  ├── /_astro/* → asset statici
  └── /*         → custom Worker
                       ├── Astro pubblico
                       ├── Astro shell + React island Control Room
                       ├── backend/API/redirect provider
                       ├── D1
                       ├── Workflows e Container
                       └── AI Gateway → Vertex AI
```

Astro possiede home, listing, trust pages, articoli published-only, sitemap, robots, 404, preview e shell Control Room. API, `/go/*`, legacy privata ed execution plane restano backend-owned.

## M5 chiusa

```text
PR #81 — apex cutover
merge e62b570248bf97afaa3f283cfbb847ceea01f529
CI finale #404

PR #82 — live closeout
merge 6735a05515c2155eb990a9315d6168d111b9261c
CI #406
```

Verificato live:

- homepage con nuovo design;
- articolo `/migliore-esim`;
- `/sitemap.xml`;
- `/robots.txt`;
- redirect `/go/airalo`;
- navigazione e rendering operativi.

## Catalog pilot

```text
candidateCount: 1
eligibleCount: 0
selectedCount: 0
excludedCount: 1
```

La candidate `esim-cina-senza-vpn` resta:

```text
page status: review
publication eligible: false
ready for publication: false
```

Manifest:

```json
{
  "schemaVersion": 1,
  "generatedAt": null,
  "entries": []
}
```

## M6 — Scope e dizionario

```text
PR #83 — Define M6 consent and measurement foundation
merge 83f784fccf562a38e48de7fca483f3d56483ccc4
CI #408 completamente verde
```

Contratto iniziale:

```text
Consent Mode Basic
nessun GTM o GA4 prima del consenso
analytics_storage denied di default
ad_storage denied
ad_user_data denied
ad_personalization denied
```

Advanced Consent Mode, cookieless pings, Google Ads, remarketing e affiliate tracking restano fuori scope.

Event dictionary v1:

```text
page_view
provider_redirect_intent
consent_update locale/debug
```

Il redirect `/go/{provider}` continua a scrivere in D1 `page_slug`, `provider_slug`, `placement`, `monetized` e `created_at`. D1 resta la fonte di verità per il redirect completato; il futuro evento GA4 rappresenterà soltanto l’intento browser.

## PR #84 — spike storico

```text
branch spike/iubenda-consent-foundation
PR #84 — Spike iubenda consent foundation
merge 6e3b0047af67219af7429749003d86f36af61237
CI applicativa #411
CI finale #415
```

Lo spike ha dimostrato:

- boundary server-only fail-closed;
- route incluse ed escluse;
- footer preferenze e Privacy condizionale;
- assenza GTM/GA4 e richieste Google;
- desktop, mobile, tastiera e regressioni complete.

Il suo harness usava però il formato iubenda legacy con configurazione inline, `siteId`, `cookiePolicyId`, autoblocking e runtime separati. Non certificava il formato reale restituito dall’account.

## PR #85 — remote embed reale

La dashboard reale di `senzaroaming.it` restituisce un embed unificato a configurazione remota:

```text
https://embeds.iubenda.com/widgets/{public-uuid}.js
```

Branch e PR:

```text
feat/public-consent-foundation
PR #85 — Activate iubenda remote consent foundation
CI applicativa #421 completamente verde
```

### Implementato

- `src/public-consent.ts` ora valida `CMP_PROVIDER` e `CMP_EMBED_ID`;
- il valore embed deve essere un UUID canonico;
- configurazione vuota, incompleta, non supportata o malformata fallisce chiusa;
- un solo script remoto viene emesso sulle pagine canonical indexable;
- nessuna CMP su preview, Control Room, API, redirect, sitemap, robots, 404 o file probe;
- il vecchio triplet inline/autoblocking/runtime non viene più emesso;
- footer e Privacy restano condizionali;
- GTM e GA4 restano assenti.

### Separazione CI e produzione

Il `wrangler.jsonc` base resta:

```text
CMP_PROVIDER=
CMP_EMBED_ID=
GTM_ID=
```

Questo mantiene disabilitata la CMP in sviluppo, CI e regressioni storiche.

Il comando di deploy esegue invece:

```text
npm run build
→ scripts/prepare-production-consent-config.mjs
→ wrangler deploy
```

Il preparatore modifica soltanto il config Worker compilato:

```text
CMP_PROVIDER=iubenda
CMP_EMBED_ID=<UUID pubblico versionato>
GTM_ID=
```

Il preparatore rifiuta il deploy se `GTM_ID` è valorizzato o se ricompaiono le variabili legacy `CMP_SITE_ID` e `CMP_COOKIE_POLICY_ID`.

### Verificato dalla CI applicativa #421

- tipi Cloudflare, Astro check, TypeScript strict e build;
- migrazioni D1 invariate;
- quality gate e golden evaluation;
- Container build e smoke;
- regressioni pubbliche storiche con CMP disabilitata;
- contratto puro UUID e preparazione production config;
- Worker isolato con embed UUID fittizio;
- unicità dello script e assenza del triplet legacy;
- route incluse ed escluse;
- nessuna richiesta Google Analytics, Tag Manager, Ads o DoubleClick;
- link preferenze raggiungibile da tastiera;
- desktop, mobile e assenza overflow;
- tutte le suite Control Room.

## Stato produzione measurement

Lo stato attualmente verificato su `main` resta:

```text
CMP non attiva
GTM non attivo
GA4 non attivo
```

La PR #85 non viene descritta come live finché non sono completati:

```text
canonici finali
→ CI finale
→ ready e merge
→ deploy
→ verifica browser reale
```

La CI non certifica ancora UI reale del banner, persistenza, revoca, registro preferenze, impostazioni remote o performance vendor.

## Guardrail invariati

- nessun tracking Google attivo prima del checkpoint live;
- nessun analytics nella Control Room o preview;
- nessun Ads, remarketing o affiliazione;
- nessuna PII, token, JWT o ID editoriali negli eventi;
- nessuna mutation o migration D1;
- nessun cambio routing;
- nessuna publication capability;
- nessuna sitemap submission;
- nessuna rimozione legacy.

## Gap aperti

- aggiornamento finale dei canonici PR #85;
- CI finale code + documentazione;
- ready e merge PR #85;
- deploy controllato CMP-only;
- verifica live Accetta, Rifiuta, Personalizza, persistenza, revoca, rete e performance;
- verifica della configurazione remota iubenda e Basic Consent Mode;
- decisione vendor finale;
- GTM e GA4 post-consenso;
- Tag Assistant, Network e DebugView;
- Search Console e sitemap submission;
- redirect `www → apex` definitivo;
- topic-mismatch sul prossimo run autorizzato;
- mutation M4 residue;
- publication capability separata;
- eventuale rimozione legacy dopo stabilizzazione.

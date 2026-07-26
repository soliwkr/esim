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
| iubenda foundation | Live, checkpoint UX aperto | remote embed CMP-only deployato e boundary server-side verificato |
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

## M5 — frontend pubblico

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

## M6 — scope e contratti

```text
PR #83 — Define M6 consent and measurement foundation
merge 83f784fccf562a38e48de7fca483f3d56483ccc4
CI #408
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

Il redirect `/go/{provider}` continua a scrivere in D1 il click effettivo. Il futuro evento GA4 rappresenterà soltanto l’intento browser.

## Consent foundation

### PR #84 — spike tecnico

```text
merge 6e3b0047af67219af7429749003d86f36af61237
CI applicativa #411
CI finale #415
```

Ha verificato boundary fail-closed, route incluse/escluse, footer preferenze, Privacy condizionale, assenza Google, desktop, mobile, tastiera e regressioni complete. Usava però il formato iubenda legacy con `siteId` e `cookiePolicyId` fittizi.

### PR #85 — remote embed reale

```text
merge f421d247e5a2ce250ba432e445f2aedf74af6f50
CI applicativa #421
CI finale #426
```

La dashboard reale restituisce:

```text
https://embeds.iubenda.com/widgets/{public-uuid}.js
```

Implementato:

- `CMP_PROVIDER` + `CMP_EMBED_ID` validati server-side;
- un solo script remoto sulle pagine canonical indexable;
- configurazioni assenti, incomplete o malformate fail-closed;
- nessuna CMP su preview, Control Room, API, `/go/*`, sitemap, robots, 404 o file probe;
- footer e Privacy condizionali;
- GTM e GA4 assenti.

## Deploy CMP-only in produzione

Documento di risultato:

```text
docs/PUBLIC-CONSENT-DEPLOY-RESULT-2026-07-26.md
```

Run osservabile:

```text
workflow: Deploy public consent checkpoint
run id: 30197982680
head: 933252556d99aa227b428f18eb0ede34f686b06a
result: success
```

Completati con successo:

- tipi Cloudflare;
- typecheck e build;
- smoke isolato della consent foundation;
- risoluzione remota della binding D1;
- deploy Wrangler;
- verifica HTTP post-deploy.

Verificato live lato server:

- `/` e `/privacy` contengono esattamente un embed iubenda;
- footer preferenze presente;
- Privacy dichiara iubenda configurata con GTM/GA4 inattivi;
- nessun riferimento Google Analytics, Tag Manager, Ads o DoubleClick;
- CMP assente da `/astro-foundation`, `/api/health`, `/sitemap.xml` e `/robots.txt`;
- nessuna migration, mutation D1 o modifica editoriale.

## Contratto di deploy D1

Il config sorgente conserva intenzionalmente:

```text
database_id=REPLACE_WITH_D1_DATABASE_ID
```

`scripts/prepare-production-d1-binding.mjs`:

- risolve il database remoto con nome esatto `senza-roaming` tramite Wrangler;
- richiede un UUID valido e una sola binding `DB` coerente;
- modifica soltanto il config Worker compilato;
- non stampa e non versiona l’UUID;
- fallisce su database mancanti, duplicati o discordanti.

Comando canonico:

```text
npm run build
→ prepare-production-consent-config
→ prepare-production-d1-binding
→ wrangler deploy
```

## Stato produzione measurement

```text
CMP iubenda: attiva sulle route canoniche previste
GTM: non attivo
GA4: non attivo
Ads: non attivi
affiliate tracking: non attivo
```

La verifica server-side non certifica ancora l’esperienza reale del banner.

## Checkpoint UX vendor ancora aperto

Da verificare in un browser pulito:

- banner alla prima visita;
- Accetta, Rifiuta e Personalizza;
- persistenza;
- riapertura dal footer;
- modifica e revoca;
- GDPR globale e Basic Consent Mode nella configurazione remota;
- rete vendor e assenza di richieste Google;
- comportamento in caso di guasto iubenda;
- tastiera, mobile, overflow e performance.

Il vendor non è ancora dichiarato definitivamente accettato.

## Guardrail invariati

- nessun GTM o GA4;
- nessun analytics nella Control Room o preview;
- nessun Ads, remarketing o affiliazione;
- nessuna PII, token, JWT o ID editoriali negli eventi;
- nessuna mutation o migration D1;
- nessun cambio routing;
- nessuna publication capability;
- nessuna sitemap submission;
- nessuna rimozione legacy.

## Gap aperti

- cleanup e merge finale della PR #90;
- checkpoint UX iubenda reale;
- decisione vendor finale;
- GTM e GA4 post-consenso;
- Tag Assistant, Network e DebugView;
- Search Console e sitemap submission;
- redirect `www → apex` definitivo;
- topic-mismatch sul prossimo run autorizzato;
- mutation M4 residue;
- publication capability separata;
- eventuale rimozione legacy dopo stabilizzazione.

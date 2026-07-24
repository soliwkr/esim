# Stato del progetto

Data di riferimento: **25 luglio 2026**.

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
| Scope measurement M6 | Completato | PR #83, merge `83f784fccf562a38e48de7fca483f3d56483ccc4`, CI #408 |
| iubenda consent spike | Implementato, default disabilitato | PR #84, CI applicativa #411; vendor live non verificato |
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

Documenti canonici:

```text
docs/MEASUREMENT-CONSENT-SCOPE.md
docs/CMP-SPIKE.md
docs/MEASUREMENT-EVENT-DICTIONARY.md
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

## iubenda consent spike

Branch e PR:

```text
spike/iubenda-consent-foundation
PR #84 — Spike iubenda consent foundation
CI applicativa #411 completamente verde
```

### Implementato

- `src/public-consent.ts` con configurazione server-only fail-closed;
- vars pubbliche `CMP_PROVIDER`, `CMP_SITE_ID`, `CMP_COOKIE_POLICY_ID` vuote per default;
- configurazione incompleta o non valida non carica script;
- iubenda soltanto sulle pagine canonical indexable;
- nessuna CMP su preview, Control Room, API, redirect, sitemap, robots, 404 o file probe;
- ordine config inline → autoblocking → runtime CMP;
- autoblocking senza `async` o `defer`;
- `googleConsentMode: true`;
- pulsanti Accetta, Rifiuta e Personalizza;
- link footer per riaprire le preferenze;
- pagina Privacy condizionale;
- nessun GTM o GA4.

### Verificato dalla CI applicativa #411

- tipi Cloudflare, typecheck e build;
- migrazioni D1 invariate;
- quality gate, golden evaluation e Container;
- tutte le regressioni pubbliche con CMP disabilitata;
- runtime isolato con ID fittizi;
- ordine e unicità degli script;
- route incluse ed escluse;
- nessuna richiesta a domini Google Analytics/Tag Manager;
- link preferenze raggiungibile da tastiera;
- harness locale del controllo preferenze;
- desktop, mobile e assenza overflow;
- tutte le suite Control Room.

Documento di risultato:

```text
docs/IUBENDA-CONSENT-SPIKE-RESULT.md
```

### Limite

La CI usa stub locali per le risorse iubenda. Non certifica ancora il servizio vendor reale, la persistenza reale del consenso, il log delle preferenze o le configurazioni remote della dashboard.

## Stato produzione measurement

```text
CMP_PROVIDER=
CMP_SITE_ID=
CMP_COOKIE_POLICY_ID=
GTM_ID=
```

Con valori vuoti:

- nessuno script iubenda viene emesso;
- nessun link preferenze viene mostrato;
- Privacy continua a dichiarare CMP, GTM e GA4 inattivi;
- nessuna richiesta Google viene effettuata;
- il comportamento M5.7 resta invariato.

## Guardrail invariati

- nessun tracking attivo;
- nessun analytics nella Control Room o preview;
- nessun Ads, remarketing o affiliazione;
- nessuna PII, token, JWT o ID editoriali negli eventi;
- nessuna mutation o migration D1;
- nessun cambio routing;
- nessuna publication capability;
- nessuna sitemap submission;
- nessuna rimozione legacy.

## Gap aperti

- aggiornamento finale dei canonici PR #84;
- CI finale code + documentazione;
- ready e merge PR #84;
- creazione/configurazione reale del sito iubenda;
- recupero di `siteId` e `cookiePolicyId` pubblici;
- configurazione Cloudflare vars;
- deploy controllato CMP-only;
- verifica live Accetta/Rifiuta/Personalizza, persistenza, revoca, rete e performance;
- decisione vendor finale;
- consent foundation definitiva;
- GTM e GA4 post-consenso;
- Tag Assistant, Network e DebugView;
- Search Console e sitemap submission;
- redirect `www → apex` definitivo;
- topic-mismatch sul prossimo run autorizzato;
- mutation M4 residue;
- publication capability separata;
- eventuale rimozione legacy dopo stabilizzazione.

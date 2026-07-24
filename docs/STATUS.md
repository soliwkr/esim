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
| Analytics e consenso | Non attivi | scope M6 in branch documentale |
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

## M6 — Discovery e scope

Branch:

```text
docs/measurement-consent-scope
```

Documenti creati:

```text
docs/MEASUREMENT-CONSENT-SCOPE.md
docs/CMP-SPIKE.md
docs/MEASUREMENT-EVENT-DICTIONARY.md
```

### Stato repository verificato

- `wrangler.jsonc` contiene `GTM_ID: ""`;
- `Env` espone `GTM_ID`;
- nessun renderer usa questa variabile;
- nessuno snippet GTM, GA4, `gtag` o CMP è attivo;
- `PublicLayout.astro` contiene soltanto metadata e JSON-LD;
- la pagina Privacy dichiara che CMP, GA4 e GTM non sono attivi;
- il footer non possiede ancora un controllo di revoca/modifica consenso;
- preview e Control Room restano escluse dalla misurazione.

### Misurazione server-side già esistente

Il redirect `/go/{provider}` scrive in `outbound_clicks`:

```text
page_slug
provider_slug
placement
monetized
created_at
```

Il contratto applicativo non salva IP o user agent. D1 resta la fonte di verità per i redirect effettivamente eseguiti.

### Infrastruttura Google

Risulta preparata esternamente ma non certificata nel repository:

- Google Tag Manager;
- Google Analytics 4;
- Google Search Console;
- service account API.

Nessun ID, stream o permesso viene considerato verificato finché non viene controllato senza esporre credenziali.

### Contratto proposto

M6 iniziale usa Consent Mode Basic:

```text
prima del consenso:
  GTM assente
  GA4 assente
  nessun ping Google
  analytics_storage denied
  consent type advertising denied

dopo consenso analytics:
  GTM può caricarsi una volta
  GA4 può misurare
  analytics_storage granted
  consent type advertising ancora denied
```

Advanced Consent Mode, cookieless pings, Google Ads, remarketing e affiliate tracking sono fuori scope.

### CMP spike

Candidati confrontati:

```text
iubenda
CookieYes
consentmanager
```

Candidato principale per lo spike tecnico: **iubenda**.

Motivo: forte supporto italiano, integrazione Google Consent Mode, Basic Mode tramite blocco completo e possibilità di installazione diretta prima di GTM.

Vendor finale ancora pendente: performance, accessibilità, condizioni operative e comportamento Astro devono essere provati.

### Event dictionary v1

```text
page_view
provider_redirect_intent
consent_update locale/debug
```

- `page_view` è l’unico evento GA4 iniziale obbligatorio;
- articolo e listing sono parametri bounded del page view;
- `provider_redirect_intent` resta distinto dal redirect completato registrato in D1;
- `consent_update` non viene inviato a GA4.

## Guardrail invariati

- nessun tracking attivo nella branch documentale;
- nessuna richiesta Google prima del consenso nella futura implementazione;
- nessun analytics nella Control Room o preview;
- nessun Ads, remarketing o affiliazione;
- nessuna PII, token, JWT o ID editoriali negli eventi;
- nessuna mutation o migration D1;
- nessun cambio routing;
- nessuna publication capability;
- nessuna sitemap submission prima del checkpoint tecnico.

## Gap aperti

- CI e merge dello scope M6;
- spike tecnico iubenda;
- decisione CMP finale;
- aggiornamento privacy reale durante la consent foundation;
- link footer per modifica/revoca;
- Consent Mode Basic;
- GTM e GA4 post-consenso;
- verifica Tag Assistant, Network e DebugView;
- Search Console e sitemap submission;
- redirect `www → apex` definitivo;
- topic-mismatch sul prossimo run autorizzato;
- mutation M4 residue;
- publication capability separata;
- eventuale rimozione legacy dopo stabilizzazione.

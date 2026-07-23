# Triage dei repository esterni

Data di riferimento: **23 luglio 2026**.

Questa appendice completa il primo checkpoint di [`EXTERNAL-REPOSITORY-AUDIT.md`](EXTERNAL-REPOSITORY-AUDIT.md). Registra repository secondari, duplicati e famiglie da non confondere con candidati già approvati.

La triage non autorizza integrazioni.

## Criterio

- **Priorità A** — può ridurre direttamente il percorso M5/M6/M8;
- **Priorità B** — può migliorare qualità, sicurezza o processo dopo il lancio;
- **Priorità C** — fuori dal percorso corrente o duplicato;
- **Rifiutato** — incompatibile con governance o modello di prodotto.

## Nuovi repository ispezionati

### `itallstartedwithaidea/argus`

**Priorità B — estrarre governance e trasparenza, non il prodotto**

Elementi interessanti:

- gate umano prima della pubblicazione;
- score composto con breakdown visibile;
- distinzione fra analisi algoritmica e verdetto;
- workflow di contestazione e prove;
- sitemap costruita soltanto dai report pubblicati;
- dashboard privata e route pubbliche distinte.

Non è pertinente il dominio fake-profile detection. La logica di scoring non va trasferita ai claim eSIM. Il pattern utile è:

```text
analisi automatica
→ spiegazione dei segnali
→ revisione umana
→ decisione esplicita
→ pubblicazione separata
```

Senza Roaming implementa già una separazione editoriale più granulare; ARGUS è una conferma del modello, non una dipendenza.

### `itallstartedwithaidea/last-mile`

**Priorità C — parcheggiare**

Il repository dichiara esplicitamente di essere in Phase 1. Contiene un progetto ampio di scanner production-readiness con Semgrep, secret scanning, dependency audit, migration safety, observability e policy engine.

Sono interessanti come checklist future:

- secret protection;
- migration dry-run e rollback;
- route/auth validation;
- dependency audit;
- health/ready endpoint;
- regole per `env` nel client e middleware mancanti.

Non va adottata la piattaforma multi-agent. `soliwkr/esim` ha già CI, smoke, migrazioni versionate, Access e quality gate. Eventuali controlli mancanti devono essere aggiunti direttamente alla CI esistente con scope ristretto.

### `itallstartedwithaidea/writing-agent`

**Rifiutato come motore editoriale; possibile consultazione limitata di QA stilistica**

Il posizionamento centrale è la produzione di testo calibrato per superare sistemi di AI detection. Questo obiettivo non è compatibile con Senza Roaming.

Non adottare:

- detector evasion come criterio di qualità;
- post-processing per rendere invisibile l'origine AI;
- revisioni casuali simulate;
- punteggi di autenticità usati al posto di accuratezza e provenienza.

Una consultazione futura può riguardare soltanto controlli innocui e indipendenti, per esempio:

- ripetizione di frasi;
- uniformità eccessiva dei paragrafi;
- corporate filler;
- leggibilità;
- coerenza del tono.

Anche questi controlli devono restare subordinati a claim verificati, chiarezza e utilità per il lettore.

### `itallstartedwithaidea/agent-starter-pack`

**Priorità C — parcheggiare**

È un fork/copia di un toolkit Google Cloud per agenti con Cloud Run, Agent Engine, Terraform e pipeline Vertex AI.

Può essere consultato in futuro per:

- evaluation lifecycle;
- osservabilità degli agenti;
- template CI/CD;
- separazione fra prototipo, evaluation e deploy.

Non è una base adatta a Senza Roaming:

- stack target differente;
- infrastruttura molto più ampia;
- duplicazione di AI Gateway, Workflow e deployment esistenti;
- nessun beneficio immediato per Astro pubblico o monetizzazione affiliate.

## Famiglie del catalogo `itallstartedwithaidea`

La classificazione seguente serve a ordinare l'audit. Per i repository non ancora aperti, il livello è preliminare e non costituisce una valutazione del codice.

### SEO, GEO, discovery e misurazione

| Repository | Triage |
|---|---|
| `programmatic-seo-engine` | Priorità A; analizzato nel documento principale |
| `analytics-auditor` | Priorità A per M6; analizzato |
| `reddit` | Priorità B; deduplica e verifica, autopublish rifiutato |
| `backlinks-disavow` | Priorità C; backlink operations future |
| `Building-a-Search-Engine-Demo` | Priorità C; demo non necessaria |
| `business-discovery-engine` | Fuori scope consumer; scartato per il percorso corrente |
| `dealer_email_scraper` | Fuori scope e privacy-sensitive |
| `intel-harvester` | Fuori scope contact harvesting; pattern tecnici soltanto |

### Agent framework, skill e contesto

| Repository | Triage |
|---|---|
| `agent-skills` | Priorità B; consultazione selettiva |
| `skills` | Priorità C finché non viene deduplicato rispetto ad `agent-skills` |
| `awesome-agent-skills` | Indice/catalogo, non runtime |
| `agency-agents` | Priorità B come libreria di ruoli |
| `ai-agents-crash-course` | Materiale didattico, fuori percorso critico |
| `MiniAgent` | Esperimento da parcheggiare |
| `ContextOS` | Concetti utili, runtime rifiutato |
| `BHIL-AI-First-Development-Toolkit` | Parcheggiare; possibile processo di sviluppo |
| `agent-starter-pack` | Parcheggiare; stack Google Cloud |
| `pocketgpt` | Fuori percorso corrente |

### Advertising e Google Ads

Questa famiglia è quasi interamente **post-lancio**. Senza traffico, eventi canonici e conversioni attribuibili non deve influenzare M5.

Repository inclusi:

- `advertising-hub`;
- `google-ads-api-agent`;
- `google-ads-skills`;
- `google-ads-gemini-extension`;
- `gemini-cli-googleadsagent`;
- `google_ads_bid_automation`;
- `google-ads-scripts`;
- `google-ads-bulk-campaign-builder`;
- `google_ads_anomoly_detection_script`;
- `itallstartedwithaidea_google_ads_account_grader`;
- `google-ads-claudecodeskill`;
- `google-ads-budget-management-script`;
- `free-google-ads-scripts`;
- `ad-tracking-diagnostic`;
- `googleads_negatives_script`;
- `google-ads-symbol-remover`;
- `google-ads-exclusions-display-pmax-ads`;
- `google_ads_script_outofstock_items_script`;
- `unblock-coverted-keywords-script`;
- `google-ads-mcp`;
- `claude-googleadsagent`;
- `google_ads_impressionshare_script`;
- `google_ads_budget_projection_script`;
- `google_ads_negative_keyword_conflict_script`;
- `google_ads_create_labels_assign_automatically`;
- `google-ads-price-extension-script`.

Possibili eccezioni da valutare in M6/M8:

- tracking diagnostic;
- conversion naming;
- attribution;
- anomaly detection su dati reali.

Nessuna API Google Ads o gestione campagne entra nel lancio organico.

### Creative e media

| Repository | Triage |
|---|---|
| `creative-asset-validator` | Priorità B per asset futuri |
| `creative-asset-generator` | Post-lancio, non parte del renderer pubblico |
| `ad-creative-mcp` | Advertising post-lancio |
| `brand-prompt-compare` | Possibile supporto al brief visuale, non runtime |
| `writing-agent` | Motore rifiutato; QA stilistica limitata |

### Tooling e progetti laterali

| Repository | Triage |
|---|---|
| `last-mile` | Checklist futura; piattaforma non adottata |
| `argus` | Governance interessante; prodotto fuori scope |
| `creative-asset-validator` | Verifica asset futura |
| `wrike-calendar-automation` | Fuori scope |
| `sheet-shell-demo` | Demo fuori scope |
| `bejeweled-game` | Irrilevante |
| `Google-SSO-Implementation-v2.0.0` | Non sostituisce Cloudflare Access |
| `markdown-fallacy-benchmark` | Possibile evaluation research, non M5 |
| `itallstartedwithaidea` | Repository profilo/catalogo |

## Duplicati e sovrapposizioni da risolvere

Prima di leggere file ripetuti va verificata la provenienza e la divergenza reale tra:

- `soliwkr/programmatic-seo-engine` e `itallstartedwithaidea/programmatic-seo-engine`;
- `Soliwkr-pro/advertising-hub` e `itallstartedwithaidea/advertising-hub`;
- `Soliwkr-pro/intel-harvester` e `itallstartedwithaidea/intel-harvester`;
- `msitarzewski/agency-agents` e `itallstartedwithaidea/agency-agents`;
- `itallstartedwithaidea/agent-skills`, `skills` e `awesome-agent-skills`.

La copia o il fork non deve essere analizzato due volte come se rappresentasse capacità indipendenti.

## Shortlist aggiornata

### Percorso immediato

1. primitive Astro/slug da `rankempire-italia`;
2. audit CI da `geo-optimizer-skill`;
3. programmatic/drift checks da `claude-seo`;
4. tracking e pilot discipline da Sprint;
5. brief/pre-flight da `open-design`;
6. analytics verification da `analytics-auditor`.

### Percorso successivo

7. semantic dedup e live verification da `reddit`;
8. security/observability checks selettivi da `last-mile` e `agent-skills`;
9. asset QA da `creative-asset-validator` e HyperFrames;
10. attribution/advertising soltanto dopo traffico e conversioni misurabili.

## Conclusione della triage

Nessun repository aggiuntivo supera la shortlist del documento principale.

Il prossimo lavoro utile non è aprire altri 40 README indiscriminatamente, ma:

1. confrontare i sei candidati immediati con il codice reale di `apps/web`;
2. identificare primitive già presenti per evitare duplicazioni;
3. produrre una matrice costo/beneficio e una sequenza unica di spike;
4. chiudere l'audit prima di modificare il percorso M5.

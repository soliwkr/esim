# Senza Roaming — Skill & Service Registry

Questo registro evita due errori opposti:

1. dimenticare capacità utili discusse durante la progettazione;
2. installare ogni repository o prompt dentro il runtime, creando un monolite fragile.

Una **skill** è un metodo riutilizzabile. Può essere implementata in codice, eseguita da un agente, applicata manualmente o fornita da un servizio condiviso.

Ultimo aggiornamento: **17 luglio 2026**.

## Stati decisionali

- **CORE** — parte nativa di Senza Roaming.
- **SHARED** — servizio dello studio consumato dal progetto.
- **PLAYBOOK** — metodo operativo da incorporare in prompt, checklist o procedure.
- **REFERENCE** — sorgente di pattern; nessuna dipendenza diretta.
- **DEFERRED** — utile soltanto dopo una determinata scala.
- **REJECTED** — non coerente o costo/complessità superiore al vantaggio.

## Ricerca ed evidence

| Capacità / sorgente | Classe | Stato | Ruolo in Senza Roaming | Decisione |
|---|---|---:|---|---|
| `last30days` | CORE | Attivo | Domande, problemi, confronti e linguaggio recente da Reddit, YouTube e web | Container fissato a commit upstream; mai usato per verificare claim commerciali |
| Quality gate recent-demand | CORE | Attivo | Freschezza, eleggibilità, rilevanza, corroborazione e promozionalità | Logica nativa D1/Worker, non delegata all'AI |
| Source Registry | CORE | Attivo | Catalogo delle fonti ufficiali con fiducia e scadenza | Base canonica per ogni claim commerciale |
| Claim Verification | CORE | Schema attivo | Prezzo, rete, hotspot, fair use, durata, attivazione e compatibilità | Estrattore e conflict detection ancora da costruire |
| Trends MCP | SHARED | Pianificato | Momentum, stagionalità e crescita relativa dei temi | Segnale di priorità, mai fonte fattuale per offerte e copertura |
| Google Search Console | SHARED | Pianificato | Domanda first-party, query reali e pagine già emergenti | Peso alto nell'Opportunity Score dopo raccolta dati |
| OpenSEO / DataForSEO | SHARED | Pianificato | SERP, keyword, competitor, ranking, backlink e audit | Servizio separato dello studio, progetto dedicato a Senza Roaming |

## Intelligence AI

| Capacità | Classe | Stato | Ruolo | Vincolo |
|---|---|---:|---|---|
| Cloudflare AI Gateway BYOK | CORE | Attivo | Gateway, log e governance delle chiamate Vertex | Payload logging disattivato per i prompt editoriali sensibili |
| Vertex AI / Gemini 3.1 Flash Lite | CORE | Attivo | Clustering, classificazione e brief strutturati | Non pubblica e non certifica claim |
| Editorial clustering | CORE | Implementato | Raggruppa segnali eleggibili in opportunità coerenti | Output validato da schema e da codice |
| Opportunity Score | CORE | Implementato v1 | Priorità editoriale proposta dal modello | Diventerà ibrido quando arriveranno GSC, trend e conversioni |
| Evidence Score | CORE | Implementato v1 | Misura deterministica di qualità delle evidenze | Non dipende dal giudizio del modello |
| Semantic deduplication | CORE | Pianificato | Evita brief e pagine equivalenti | Deve confrontare archivio esistente prima di creare task |
| Trust Score | CORE | Pianificato | Freschezza e copertura dei claim verificati | Separato dall'Opportunity Score |
| Revenue Score | CORE | Pianificato | Potenziale economico basato su click/conversioni reali | Non attivare prima di dati sufficienti |
| Multi-model fallback | SHARED | Pianificato | Policy di costo, disponibilità e qualità tra modelli | Non necessario per il primo catalogo |

## Skill editoriali e marketing

Le skill sotto non sono pacchetti runtime. Sono playbook da tradurre in istruzioni, checklist, quality gate e template.

| Skill | Provenienza | Classe | Uso previsto |
|---|---|---|---|
| Customer research | `soliwkr/marketingskills` | PLAYBOOK | Trasformare segnali in problemi, obiezioni, linguaggio e job-to-be-done |
| Product marketing | `soliwkr/marketingskills` | PLAYBOOK | Posizionamento del sito, delle guide e dei confronti senza claim gonfiati |
| Content strategy | `soliwkr/marketingskills` | PLAYBOOK | Cluster, pillar, priorità e formati editoriali |
| Copywriting | `soliwkr/marketingskills` | PLAYBOOK | Titoli, direct answer, CTA e disclosure chiare |
| CRO | `soliwkr/marketingskills` | PLAYBOOK | Esperimenti su CTA, gerarchia, confronto e passaggio al provider |
| Analytics | `soliwkr/marketingskills` | PLAYBOOK | Eventi, metriche e lettura dei funnel |
| AI SEO | `soliwkr/marketingskills` | PLAYBOOK | Risposte estraibili, fonti, entità e struttura per motori AI |
| SEO audit | `soliwkr/marketingskills` | PLAYBOOK | Controllo tecnico e contenutistico periodico |
| Schema | `soliwkr/marketingskills` | PLAYBOOK | Dati strutturati coerenti con il contenuto reale |
| Programmatic SEO | `soliwkr/marketingskills` | PLAYBOOK | Template solo quando esistono dati e differenziazione sufficienti |

## Ruoli di controllo

| Ruolo | Provenienza | Classe | Responsabilità |
|---|---|---|---|
| Evidence Collector | `soliwkr/agency-agents` | PLAYBOOK | Raccoglie evidenza, data, fonte e limiti senza inferenze indebite |
| Reality Checker | `soliwkr/agency-agents` | PLAYBOOK | Contesta punteggi, ipotesi e brief prima che diventino backlog |
| Security Engineer | `soliwkr/agency-agents` | PLAYBOOK | Secret, auth, rate limit, permessi, logging e superficie di attacco |
| Experiment Tracker | `soliwkr/agency-agents` | PLAYBOOK | Ipotesi, variante, metrica, finestra e decisione finale |

Decisione: non introdurre un framework multi-agent generico. Questi ruoli diventano **modalità di revisione**, job specifici o checklist, non personaggi autonomi che parlano tra loro.

## Audit esterno

| Sorgente | Classe | Stato | Uso |
|---|---|---:|---|
| `soliwkr/claude-seo` | REFERENCE | Pianificato | Audit periodico di SEO tecnico, contenuti, schema, GSC, PageSpeed, CrUX e GEO |
| Lighthouse / PageSpeed / CrUX | SHARED | Pianificato | Performance e Core Web Vitals |
| Rich Results Test / validatori schema | PLAYBOOK | Pianificato | Controllo prima delle release editoriali |

`claude-seo` non entra nel Worker. Deve comportarsi come ispettore esterno che produce issue o task verificabili.

## Analytics e attribuzione

| Capacità / sorgente | Classe | Stato | Decisione |
|---|---|---:|---|
| Eventi D1 privacy-first | CORE | Attivo base | Continuare per click essenziali e controllo interno |
| GA4 + GTM + CMP | CORE | Pianificato | Attivare solo con consenso e tassonomia eventi canonica |
| Full Funnel AI Analytics | REFERENCE | Parzialmente adottato | Adottare definizioni uniche delle metriche, non lo stack completo |
| BigQuery / dbt / MLflow / multi-touch attribution | DEFERRED | Non avviato | Giustificato solo con traffico, spesa e conversioni sufficienti |

Metriche canoniche da definire:

- `provider_click`;
- `qualified_provider_click`;
- `page_with_verified_claims`;
- `stale_commercial_page`;
- `research_signal_accepted`;
- `signal_to_published_page`;
- `organic_landing_conversion`.

## Dashboard e servizi condivisi

| Componente | Classe | Stato | Confine |
|---|---|---:|---|
| Dashboard Senza Roaming | CORE | Pianificato | Gestisce segnali, brief, fonti, claim, pagine, run e metriche del progetto |
| Studio Command Center | SHARED | Cantiere separato | Vista portfolio, costi, alert, stato e accesso ai servizi specialistici |
| OpenSEO | SHARED | Pianificato | Motore SEO specialistico, non modulo copiato dentro `esim` |
| Trends MCP | SHARED | Pianificato | Provider di trend, non database canonico |

## Criteri per introdurre una nuova skill

Una nuova skill entra nel registro soltanto se risponde chiaramente a cinque domande:

1. quale decisione migliora;
2. quali input usa;
3. quale output strutturato produce;
4. chi la revisiona;
5. dove vive: progetto, servizio condiviso, playbook o riferimento.

Non viene adottata se:

- duplica una capacità esistente;
- produce solo testo non verificabile;
- richiede un nuovo servizio senza un problema reale;
- trasforma un segnale debole in un claim;
- non dispone di ownership e criterio di successo.

## Priorità di attivazione

1. completare brief AI e task editoriali;
2. costruire Dashboard MVP del progetto;
3. collegare Search Console, CMP e analytics;
4. attivare OpenSEO come servizio condiviso;
5. aggiungere Trends MCP come segnale di momentum;
6. introdurre audit periodici `claude-seo`;
7. applicare CRO ed Experiment Tracker quando esiste traffico;
8. considerare warehouse e attribuzione avanzata soltanto a scala reale.
# Licenze e provenienza dei candidati esterni

Data di riferimento: **23 luglio 2026**.

Questo documento registra il controllo preliminare delle licenze per i candidati della shortlist. Non sostituisce una revisione legale e non autorizza la copia del codice.

## Regola operativa

Prima di importare codice da un repository esterno occorre registrare:

- repository e owner originali;
- file o commit sorgente;
- licenza applicabile;
- copyright notice richiesto;
- modifiche apportate;
- motivo per cui una dipendenza o una riscrittura è preferibile;
- test che dimostrano il beneficio.

Quando basta un pattern o una checklist, preferire un'implementazione originale documentando l'ispirazione, senza copiare blocchi sostanziali.

## Candidati verificati

| Repository | Licenza osservata | Conseguenza preliminare |
|---|---|---|
| `Auriti-Labs/geo-optimizer-skill` | MIT | spike e uso consentiti preservando notice e licenza per copie sostanziali |
| `soliwkr/claude-seo` | MIT, copyright upstream `agricidaniel` | usare checklist o codice soltanto con attribuzione dovuta |
| `itallstartedwithaidea/analytics-auditor` | MIT | pattern e codice riusabili con notice dovuto |
| `soliwkr/open-design` | Apache License 2.0 | preferire processo; copie sostanziali richiedono adempimenti Apache/NOTICE applicabili |
| `soliwkr/rankempire-italia` | nessun `LICENSE` trovato alla radice della branch analizzata | trattare come codice interno non redistribuibile finché la provenienza dei file non è chiarita |
| `soliwkr/thesprint-uk` | progetto privato dell'utente; licenza non ancora registrata nell'audit | estrarre soprattutto contratti e concetti; verificare dipendenze/file prima di copiare |

## Fork e copie

Non assumere che la licenza del repository forkato copra automaticamente ogni file aggiunto dopo il fork.

Prima dell'estrazione verificare divergenza e provenienza fra:

- `soliwkr/programmatic-seo-engine` e `itallstartedwithaidea/programmatic-seo-engine`;
- `Soliwkr-pro/advertising-hub` e `itallstartedwithaidea/advertising-hub`;
- `Soliwkr-pro/intel-harvester` e `itallstartedwithaidea/intel-harvester`;
- `msitarzewski/agency-agents` e `itallstartedwithaidea/agency-agents`;
- le varianti `agent-skills`, `skills` e `awesome-agent-skills`.

## Decisione per gli spike

### Rank Empire

Non copiare ancora file. Lo spike deve prima:

1. identificare il commit che ha introdotto la primitiva;
2. verificare se il file proviene da un sub-repository o template separato;
3. confrontare il codice con implementazioni standard già disponibili;
4. decidere fra riscrittura originale e import con attribuzione interna.

La piccola funzione slug può essere riscritta e testata facilmente; non è necessario trascinare il factory code.

### GEO Optimizer

Eseguire inizialmente come tool esterno pinned. Non vendorizzare il package nel repository durante lo spike.

### Claude SEO

Trasformare le failure mode utili in test originali di `soliwkr/esim`. Non copiare intere skill nel runtime.

### Analytics Auditor

Estrarre casi di test e firme di rilevamento soltanto nella futura branch M6, preservando attribution se viene copiato codice sostanziale.

### Open Design

Usare il metodo di discovery, pre-flight e autocritica. Non importare daemon, prompt completi o design system senza una decisione separata.

### Sprint

Definire un nuovo contratto eventi Senza Roaming. Non copiare cookie name, durate, sub-ID o storage senza una decisione CMP/privacy.

## Freeze

Fino al completamento dello spike pertinente:

- nessun package esterno viene aggiunto a `package.json`;
- nessun file sorgente esterno viene copiato;
- nessuna licenza viene rimossa o abbreviata;
- nessuna dipendenza viene approvata solo perché MIT o Apache;
- nessun codice senza provenienza chiara entra in `main`.

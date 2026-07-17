# Quality gate dei segnali recenti

Il radar della domanda conserva i risultati del motore di ricerca, ma non considera automaticamente ogni risultato una prova di domanda recente.

## Perché esiste

I motori di ricerca possono restituire:

- contenuti vecchi ma ancora molto popolari;
- video sponsorizzati o con coupon;
- risultati con bassa rilevanza;
- fonti isolate senza corroborazione;
- date mancanti o incoerenti.

Questi elementi possono essere utili come contesto, ma non devono entrare silenziosamente nella coda editoriale prioritaria.

## Regole dure

La migrazione `0010_research_signal_quality.sql` aggiunge:

- `freshness_days`;
- `quality_flags_json`;
- `eligible_for_editorial`;
- conteggi `eligible_count` e `filtered_count` per ogni run.

Un segnale viene filtrato automaticamente quando:

```text
età del contenuto > finestra dichiarata + 7 giorni
oppure
la data risulta oltre 2 giorni nel futuro
```

Il margine di sette giorni assorbe ritardi di indicizzazione e differenze di fuso orario.

Il database applica questa regola tramite trigger D1. Il gate resta quindi attivo anche se un vecchio Worker o un import manuale non valorizza i nuovi campi.

## Flag consultivi

L'API aggiunge inoltre flag che non bloccano automaticamente il segnale, ma aiutano la revisione:

- `missing_published_at`;
- `low_relevance`;
- `uncorroborated`;
- `promotional_or_sponsored`;
- `outside_recent_window`;
- `future_dated`;
- `manual_quality_override`.

Un contenuto sponsorizzato può ancora rivelare una domanda reale, ma non deve essere trattato come prova neutrale.

## Consultazione

Per impostazione predefinita l'endpoint restituisce soltanto i segnali idonei:

```http
GET /api/maintenance/research-signals?status=new&eligibility=eligible&limit=30
```

Per vedere ciò che il gate ha escluso:

```http
GET /api/maintenance/research-signals?status=new&eligibility=filtered&limit=30
```

Per vedere entrambi:

```http
GET /api/maintenance/research-signals?status=new&eligibility=all&limit=30
```

Riepilogo per la dashboard:

```http
GET /api/maintenance/research-quality-summary?limit=10
```

## Azioni e override

Un segnale filtrato può essere marcato `reviewed` o `dismissed`, ma D1 impedisce che diventi direttamente `accepted` o `converted`.

L'override deve essere deliberato:

```json
{
  "signalIds": [12],
  "status": "accepted",
  "notes": "Data verificata manualmente e contenuto ancora rilevante.",
  "overrideQualityGate": true
}
```

L'override:

1. ripristina l'idoneità editoriale;
2. aggiunge il flag `manual_quality_override`;
3. aggiorna i conteggi del run;
4. conserva la nota del revisore.

## Confine di fiducia

Il quality gate stabilisce soltanto se un segnale è utilizzabile come intelligence editoriale recente.

Non trasforma mai Reddit, YouTube o altri risultati sociali in una fonte verificata per:

- prezzi;
- dati inclusi;
- durata;
- rete;
- hotspot;
- fair use;
- rimborsi;
- copertura.

Questi claim continuano a richiedere una fonte ufficiale nel registro di verifica commerciale.

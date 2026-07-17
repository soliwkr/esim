# Stato del progetto

Data di riferimento: **17 luglio 2026**.

Questo documento fotografa lo stato reale di Senza Roaming. Va aggiornato quando cambia un fatto operativo, non quando cambia soltanto un'intenzione.

## Stato sintetico

| Area | Stato | Nota |
|---|---|---|
| Dominio principale | Operativo | `https://senzaroaming.it` serve il Worker |
| Dominio `www` | Da verificare | redirect 308 implementato e distribuito; manca l'ultima verifica canonica |
| Worker | Operativo | health pubblico positivo |
| D1 | Operativo | migrazioni versionate fino a `0014_atomic_editorial_claims.sql` |
| API manutenzione | Operativa | protetta da `MAINTENANCE_TOKEN` |
| Container last30days | Operativo | Python 3.12.13 e commit upstream fissato |
| Workflow recent-demand | Operativo | prima istanza completata end-to-end e persistita in D1 |
| Quality gate recent-demand | Operativo | 1 segnale `eligible`, 2 `filtered` nel primo run |
| AI Gateway | Operativo | Cloudflare AI Gateway raggiunge Vertex AI |
| Vertex AI | Operativo | smoke `SENZA_ROAMING_AI_OK` con `gemini-3.1-flash-lite` |
| Motore brief | Operativo | primo brief strutturato creato, prioritizzato, accettato e convertito |
| Verifica claim | Operativa | claim generali e atomici, task, fonti, esiti e audit persistiti |
| Affiliazioni | Disabilitate | link ufficiali non remunerati |
| Analytics | Non configurata | CMP, GA4, GTM e GSC ancora da collegare |
| Dashboard privata | Non costruita | backend disponibile in larga parte |
| Contenuti | In preparazione | nessuna pagina generata automaticamente; primo evidence set disponibile |

## Verifiche completate

### Worker, Container e Workflow

Il Worker e il Container rispondono correttamente. La prima istanza recent-demand:

```text
manual-20260717084113-0bc853bc
```

ha concluso con stato `complete`.

Output osservato:

```text
query completate: 1
segnali ricevuti: 3
segnali inseriti: 3
errori: 0
```

La qualità del primo run è stata classificata così:

```text
totale: 3
eligible: 1
filtered: 2
awaiting review: 1
```

I due risultati fuori dalla finestra recente sono conservati per audit ma esclusi dall'intelligence editoriale.

### Vertex AI

Il percorso è operativo:

```text
Worker
→ Cloudflare AI Gateway
→ Google Vertex AI
→ gemini-3.1-flash-lite
```

Smoke osservato:

```json
{
  "ok": true,
  "provider": "google-vertex-ai",
  "projectId": "soliwkr",
  "location": "global",
  "model": "gemini-3.1-flash-lite",
  "response": "SENZA_ROAMING_AI_OK"
}
```

### Primo ciclo editoriale controllato

Il primo segnale idoneo ha prodotto il brief:

```text
eSIM in Cina: funzionano davvero senza VPN?
```

Punteggi osservati:

```text
Opportunity Score: 85
Evidence Score:    54
Priority Score:    63
Priority Band:     medium
```

Il brief è stato:

1. accettato da una persona;
2. convertito in requisiti di verifica;
3. scomposto in claim atomici per provider e documento;
4. collegato a fonti ufficiali;
5. chiuso senza pubblicazione automatica.

### Primo evidence set atomico

Stato finale:

```text
claim atomici: 6
verified:       5
insufficient:   1
pending:        0
```

Claim verificati:

- Airalo dichiara routing attraverso gateway fuori dalla Cina continentale;
- Airalo dichiara che non serve una VPN aggiuntiva;
- Nomad dichiara che non serve una VPN aggiuntiva;
- la FAQ generale Holafly dichiara che non offre un servizio VPN incorporato;
- la pagina prodotto globale Holafly dichiara una VPN integrata automaticamente per i viaggi in Cina.

Claim insufficiente:

- la pagina prodotto Holafly specifica per la Cina, nella versione italiana osservata, non esponeva in modo sufficiente la stessa dichiarazione.

Le due dichiarazioni Holafly restano separate per `documentType` e non vengono fuse in una falsa conclusione unica.

## Vincoli dimostrati

- Un segnale community non diventa una prova commerciale.
- Un requisito generale non può diventare un fatto verificato.
- Un claim atomico richiede soggetto, campo, affermazione e fonte compatibile.
- D1 impedisce esiti fattuali senza `source_id` e `claim_verification_id`.
- Una fonte deve riferirsi allo stesso soggetto del claim.
- Il riuso della stessa URL non duplica il record fonte.
- Nessun endpoint del ciclo crea o pubblica automaticamente una pagina.

## Rischi aperti

1. Il redirect `www → apex` deve ancora essere verificato definitivamente in produzione.
2. Manca una Dashboard privata per radar, brief, claim, fonti e task.
3. Manca un health aggregato consultabile da un unico endpoint o pannello.
4. Manca un audit log unificato oltre agli audit specifici dei singoli moduli.
5. Le verifiche attuali descrivono dichiarazioni ufficiali dei provider; non equivalgono sempre a test indipendenti sul campo.
6. Le fonti hanno scadenze diverse e devono rientrare automaticamente nella coda di refresh.
7. Search Console e analytics non sono ancora disponibili.
8. Il repository pubblico non deve contenere token, link affiliate segreti o credenziali.

## Prossimo checkpoint

Il prossimo checkpoint è raggiunto quando:

- esiste un **Page Readiness Gate** che aggrega claim verificati, insufficienti, in conflitto e scaduti;
- l'output distingue chiaramente dichiarazioni del provider e test first-party;
- una pagina può essere creata soltanto in stato `review`;
- la pagina conserva la provenienza claim → fonte → sezione;
- nessun claim insufficiente o scaduto viene trasformato in affermazione assertiva;
- la Dashboard MVP può leggere readiness, task, brief e fonti senza accesso diretto a D1.

# Prossime azioni

Questa lista contiene soltanto il lavoro immediatamente eseguibile. La roadmap completa vive in `ROADMAP.md`.

Ultimo aggiornamento: **17 luglio 2026**.

## Now

### 1. Verificare definitivamente il redirect canonico

```bash
curl -I "https://www.senzaroaming.it/guide?test=$(date +%s)"
```

Atteso:

```text
HTTP/2 308
location: https://senzaroaming.it/guide?test=...
```

Poi:

```bash
curl -IL "https://www.senzaroaming.it/settings.py?test=$(date +%s)"
```

Atteso:

```text
308 www → apex
404 file inesistente
```

### 2. Implementare il Page Readiness Gate

Il gate deve aggregare per brief o pagina:

- claim atomici verificati;
- claim insufficienti;
- claim in conflitto;
- claim scaduti;
- fonti uniche e categorie di fonte;
- distinzione tra dichiarazione del provider e test first-party;
- sezioni del brief che possono essere scritte in forma assertiva;
- sezioni che richiedono cautela o restano bloccate.

Output minimo:

```json
{
  "briefId": 1,
  "readyForReviewDraft": true,
  "readyForPublication": false,
  "verified": 5,
  "insufficient": 1,
  "conflicts": 0,
  "expired": 0,
  "warnings": [],
  "blockedClaims": []
}
```

`readyForReviewDraft` non implica pubblicabilità.

### 3. Costruire l'evidence bundle della prima pagina

Il bundle deve contenere:

```text
brief
→ claim atomici
→ valore verificato
→ fonte
→ data di controllo
→ scadenza
→ evidenza
→ nota editoriale
→ sezione destinataria
```

Per il primo caso Cina deve preservare la distinzione tra:

- Airalo: routing internazionale e VPN aggiuntiva non richiesta secondo il provider;
- Nomad: VPN aggiuntiva non richiesta secondo il provider;
- Holafly: dichiarazioni diverse su documenti ufficiali con scope differenti;
- claim specifico della pagina Cina rimasto `insufficient`.

### 4. Creare il primo draft soltanto in `review`

Il sistema potrà creare o aggiornare:

```text
slug: esim-cina-senza-vpn
status: review
```

Vincoli:

- nessun `published` automatico;
- nessuna frase assertiva derivata da claim insufficienti;
- source links e provenienza salvati;
- direct answer coerente con il livello dell'evidenza;
- conflitti e limiti esplicitati nel contenuto;
- idempotenza sulla stessa versione del bundle.

### 5. Preparare la Dashboard MVP

Prima versione:

- health aggregato;
- run recenti;
- segnali `eligible` e `filtered`;
- coda brief e Priority Score;
- claim generali e atomici;
- fonti, scadenze e conflitti;
- Page Readiness;
- azioni di accettazione, conversione e verifica;
- avvio manuale di ricerche senza `curl`.

Non includere ancora:

- pubblicazione automatica;
- analytics avanzata;
- affiliazioni;
- OpenSEO incorporato;
- funzioni multi-progetto dello studio.

### 6. Health aggregato e audit log

Aggiungere una risposta unica per:

```text
Worker
D1
Workflow
Container
AI Gateway / Vertex
queue
fonti scadute
errori recenti
```

L'audit unificato deve registrare almeno:

- ricerca avviata;
- brief generato;
- decisione umana;
- decomposizione claim;
- esito di verifica;
- creazione draft;
- eventuale pubblicazione futura.

## Completato oggi

- prima istanza recent-demand conclusa e osservabile;
- 3 segnali persistiti e classificati;
- quality gate `eligible` / `filtered`;
- Vertex AI operativo;
- primo brief AI reale;
- Opportunity, Evidence e Priority Score;
- accettazione e conversione del brief;
- claim generali e claim atomici;
- 5 verifiche ufficiali persistite;
- 1 esito `insufficient` preservato;
- tutti i task del primo evidence set chiusi;
- nessuna pubblicazione automatica.

## Next

Dopo il checkpoint Page Readiness:

1. Dashboard privata tramite Cloudflare Access;
2. primo blocco di pagine Tier 1 verificate;
3. Search Console e sitemap;
4. CMP, GTM e GA4;
5. dizionario canonico degli eventi;
6. OpenSEO come servizio condiviso;
7. trend e stagionalità;
8. affiliazioni controllate.

## Definition of Done del checkpoint attuale

- [ ] redirect `www → apex` verificato;
- [ ] endpoint Page Readiness implementato e testato;
- [ ] evidence bundle del brief `1` leggibile;
- [ ] primo draft creato in stato `review`;
- [ ] claim insufficienti esclusi dalle frasi assertive;
- [ ] provenienza claim → fonte → sezione persistita;
- [ ] Dashboard MVP avviata;
- [x] `docs/STATUS.md` aggiornato con i risultati reali.

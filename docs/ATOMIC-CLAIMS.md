# Claim atomici e verifica per soggetto

Un requisito di ricerca ampio non è un fatto verificabile. Prima di registrare un esito fattuale, Senza Roaming lo separa in claim atomici con un solo soggetto, un solo campo, una sola affermazione dichiarativa, una domanda di verifica e categorie di fonte ammesse.

## Perché serve

Provider differenti possono ottenere un risultato simile con meccanismi differenti. Un provider può dichiarare routing internazionale, mentre un altro può dichiarare una VPN integrata. La frase generica “le eSIM superano il Great Firewall” non è sufficientemente precisa per essere verificata come un unico claim.

## Flusso

```text
claim candidato ampio
  -> decomposizione controllata
  -> claim atomici per provider, destinazione, piano o pagina
  -> task verify_claims distinto
  -> fonte ufficiale riferita allo stesso soggetto
  -> verified | contradicted | insufficient | dismissed
```

Il parent viene chiuso come `dismissed` perché sostituito dai claim atomici; la vecchia attività viene cancellata. Nessun contenuto viene pubblicato.

## Vincoli D1

La migrazione `0014_atomic_editorial_claims.sql` aggiunge `parent_candidate_id`, `subject_type`, `subject_key`, `atomic` e `scope_json`.

D1 impedisce a un claim non atomico di diventare `verified` o `contradicted`.

## Endpoint

- `POST /api/maintenance/editorial-claim-decompose`: crea claim atomici da un parent ampio.
- `GET /api/maintenance/editorial-atomic-claims`: elenca e filtra i claim atomici.
- `POST /api/maintenance/editorial-atomic-claim-result`: registra l’esito usando una fonte riferita allo stesso soggetto.

La decomposizione richiede per ogni figlio:

- `subjectType`;
- `subjectKey`;
- `fieldName`;
- `claimText` dichiarativo;
- `verificationQuestion`;
- `requiredSourceKinds`;
- `scope` opzionale.

Per un esito fattuale, la fonte deve appartenere alle categorie richieste dal claim, avere lo stesso soggetto, usare HTTPS e produrre un record in `claim_verifications`.

Gli esiti `insufficient` e `dismissed` non creano un fatto verificato.

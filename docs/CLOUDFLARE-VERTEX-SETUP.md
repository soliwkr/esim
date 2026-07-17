# Cloudflare AI Gateway + Vertex AI

Senza Roaming usa Cloudflare AI Gateway come punto unico di accesso ai modelli Google Vertex AI. La chiave Google non deve essere salvata nel repository, nelle GitHub Actions o nelle variabili pubbliche del Worker.

## Architettura

```text
GitHub Actions
  -> verifica TypeScript e migrazioni
  -> deploy Worker e Container con Wrangler

Cloudflare Worker / Container
  -> cf-aig-authorization
  -> Cloudflare AI Gateway
  -> credenziali Vertex AI conservate con BYOK
  -> modello Gemini configurabile
```

## Valori non segreti

Configurare nel Worker o nel runner:

```text
AI_GATEWAY_ID=senza-roaming-ai
GOOGLE_VERTEX_PROJECT=<project-id>
GOOGLE_VERTEX_LOCATION=<region>
GOOGLE_VERTEX_MODEL=<model-id>
```

Il modello deve restare configurabile. Non inserirlo direttamente nella logica applicativa, perché gli endpoint Vertex AI hanno un ciclo di vita e possono essere sostituiti.

## Secret Cloudflare

Configurare nel Worker e nel runner:

```text
AI_GATEWAY_TOKEN
MAINTENANCE_TOKEN
```

`AI_GATEWAY_TOKEN` autentica la richiesta verso AI Gateway tramite l'header `cf-aig-authorization`.

## BYOK Vertex AI

Nel pannello Cloudflare:

```text
AI
-> AI Gateway
-> senza-roaming-ai
-> Provider Keys
-> Add API Key
-> Google Vertex AI
```

Caricare il JSON di un service account Google dedicato e selezionare la regione. Il service account dovrebbe avere solo il ruolo necessario all'inferenza Vertex AI, normalmente `Vertex AI User` (`roles/aiplatform.user`).

La credenziale Google resta nello Secrets Store di Cloudflare. Le applicazioni inviano soltanto il token AI Gateway.

## Endpoint provider-native

```text
https://gateway.ai.cloudflare.com/v1/<account-id>/senza-roaming-ai/google-vertex-ai/v1/projects/<project-id>/locations/<region>/publishers/google/models/<model-id>:generateContent
```

Header:

```http
cf-aig-authorization: Bearer <AI_GATEWAY_TOKEN>
Content-Type: application/json
```

## GitHub Actions

Salvare esclusivamente in:

```text
Repository
-> Settings
-> Secrets and variables
-> Actions
```

Secrets richiesti:

```text
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID
```

Variables consigliate:

```text
CLOUDFLARE_D1_DATABASE_ID
SENZA_ROAMING_SITE_URL
GOOGLE_VERTEX_PROJECT
GOOGLE_VERTEX_LOCATION
GOOGLE_VERTEX_MODEL
AI_GATEWAY_ID
```

La chiave del service account Vertex non deve essere aggiunta a GitHub: viene conservata direttamente da Cloudflare AI Gateway BYOK.

## Sequenza di attivazione

1. Attendere che la zona `senzaroaming.it` diventi attiva.
2. Creare il gateway `senza-roaming-ai`.
3. Creare un service account Google dedicato e assegnare `roles/aiplatform.user`.
4. Caricare il JSON del service account in AI Gateway BYOK.
5. Generare un token autenticato per AI Gateway.
6. Creare D1 e R2.
7. Inserire i soli secret di deploy in GitHub Actions.
8. Applicare le migrazioni remote.
9. Distribuire prima su `workers.dev`.
10. Collegare la route del dominio dopo il test di salute.

## Modelli

Usare due classi di modello, entrambe configurabili:

```text
FAST_MODEL
- classificazione segnali
- deduplicazione semantica
- estrazione di domande e lamentele

DEEP_MODEL
- content brief
- confronto tra cluster
- revisione editoriale assistita
```

Non usare il modello per certificare prezzi, fair use, hotspot, copertura o condizioni commerciali. Questi dati devono continuare a provenire da fonti ufficiali e da `claim_verifications`.

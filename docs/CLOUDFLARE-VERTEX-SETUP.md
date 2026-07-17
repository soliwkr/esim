# Cloudflare AI Gateway + Vertex AI

Senza Roaming usa Cloudflare AI Gateway come punto unico di accesso ai modelli Google Vertex AI. La chiave Google non deve essere salvata nel repository, nelle GitHub Actions o nelle variabili pubbliche del Worker.

## Configurazione attuale

```text
Cloudflare account ID: 60496826f56a093a72602bfae074fdcf
AI Gateway ID: senza-roaming-ai
Gateway authentication: enabled
BYOK alias: default
Google Cloud Project ID: soliwkr
Google Cloud Project Number: 739710211590
Service account: senza-roaming-vertex@soliwkr.iam.gserviceaccount.com
Vertex location: global
Vertex model: gemini-3.1-flash-lite
```

`739710211590` è il Project Number. Negli URL Vertex AI deve essere usato il Project ID `soliwkr`.

## Architettura

```text
GitHub Actions
  -> verifica TypeScript e migrazioni
  -> crea o riusa D1
  -> deploy Worker con Wrangler

Cloudflare Worker / Container
  -> cf-aig-authorization
  -> Cloudflare AI Gateway
  -> credenziali Vertex AI conservate con BYOK
  -> Gemini 3.1 Flash-Lite
```

## Secret Cloudflare

Configurare come secret cifrati del Worker e, in seguito, del runner:

```text
AI_GATEWAY_TOKEN
MAINTENANCE_TOKEN
```

`AI_GATEWAY_TOKEN` autentica la richiesta verso AI Gateway tramite l'header `cf-aig-authorization`.

Non inserire questi valori nel repository. La pipeline di deploy richiede soltanto il token Cloudflare dedicato al deploy.

## BYOK Vertex AI

Configurazione completata nel pannello Cloudflare:

```text
AI
-> AI Gateway
-> senza-roaming-ai
-> Provider Keys
-> Google Vertex AI
-> alias default
-> regione global
```

Il service account Google dedicato dispone del ruolo operativo Vertex AI necessario. La credenziale resta nello Secrets Store di Cloudflare. Le applicazioni inviano soltanto il token AI Gateway.

## Endpoint provider-native

```text
https://gateway.ai.cloudflare.com/v1/60496826f56a093a72602bfae074fdcf/senza-roaming-ai/google-vertex-ai/v1/projects/soliwkr/locations/global/publishers/google/models/gemini-3.1-flash-lite:generateContent
```

Header:

```http
cf-aig-authorization: Bearer <AI_GATEWAY_TOKEN>
Content-Type: application/json
```

L'alias `default` non richiede l'header `cf-aig-byok-alias`.

## GitHub Actions

Salvare in:

```text
Repository
-> Settings
-> Secrets and variables
-> Actions
```

Unico secret richiesto per il primo deploy:

```text
CLOUDFLARE_API_TOKEN
```

L'account ID è un valore non segreto già impostato nella pipeline. `AI_GATEWAY_TOKEN`, `MAINTENANCE_TOKEN` e il JSON del service account non devono essere aggiunti a GitHub.

Il workflow manuale `.github/workflows/deploy-production.yml`:

1. esegue il typecheck;
2. cerca il database D1 `senza-roaming`;
3. lo crea in giurisdizione UE se non esiste;
4. genera una configurazione Wrangler temporanea;
5. applica tutte le migrazioni remote;
6. distribuisce il Worker.

## Secret del Worker dopo il primo deploy

Nel pannello Cloudflare:

```text
Workers & Pages
-> senza-roaming
-> Settings
-> Variables and Secrets
```

Aggiungere come valori cifrati:

```text
MAINTENANCE_TOKEN=<valore casuale lungo>
AI_GATEWAY_TOKEN=<token del gateway già salvato>
```

## Test del Gateway

Dopo aver configurato entrambi i secret:

```http
POST /api/maintenance/ai-smoke
Authorization: Bearer <MAINTENANCE_TOKEN>
```

Il test invia un prompt fisso e disabilita la raccolta del payload tramite `cf-aig-collect-log-payload: false`. Una risposta valida contiene:

```json
{
  "ok": true,
  "provider": "google-vertex-ai",
  "projectId": "soliwkr",
  "location": "global",
  "model": "gemini-3.1-flash-lite"
}
```

## Quality gate

Il modello può classificare segnali, estrarre domande, produrre brief e assistere la revisione. Non può certificare prezzi, fair use, hotspot, copertura o condizioni commerciali. Questi dati devono continuare a provenire da fonti ufficiali e da `claim_verifications`.

# Configurazione affiliate

## Principio

Il repository non deve contenere URL affiliate reali. I link vengono conservati in un secret Cloudflare in formato JSON.

Modalità predefinita:

```text
AFFILIATE_MODE=disabled
```

In questa modalità `/go/<provider>` porta al sito ufficiale non remunerato e continua a misurare il numero minimale di click.

## Attivazione

Dopo l'approvazione dei programmi affiliate:

```text
AFFILIATE_MODE=enabled
```

Secret Cloudflare:

```json
{
  "airalo": "https://tracking.example/airalo",
  "holafly": "https://tracking.example/holafly",
  "ubigi": "https://tracking.example/ubigi"
}
```

Nome del secret:

```text
AFFILIATE_LINKS_JSON
```

Comando indicativo:

```bash
npx wrangler secret put AFFILIATE_LINKS_JSON
```

## Redirect

Esempio:

```text
/go/airalo?page=esim-giappone&placement=comparison-table
```

Il Worker registra soltanto:

- pagina;
- provider;
- posizione del link;
- presenza o meno di monetizzazione;
- data e ora.

Non salva IP, user agent o dati bancari.

## Disclosure

Quando `AFFILIATE_MODE=enabled`, ogni pagina commerciale mostra una dichiarazione prima dei contenuti e vicino alla CTA.

## Programmi

Verificare e candidarsi esclusivamente attraverso pagine o reti ufficiali. Non utilizzare referral personali come sostituto di un accordo publisher.

## Candidature ufficiali verificate il 16 luglio 2026

- Airalo Partners: https://partners.airalo.com/
- Holafly Affiliate Program: https://esim.holafly.com/affiliate-program/

Le condizioni e l'approvazione possono cambiare. Conservare nel repository soltanto i link alle pagine di candidatura, mai credenziali o URL di tracking personali.

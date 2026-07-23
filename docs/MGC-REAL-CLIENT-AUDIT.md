# MGC Réparation real-client implementation audit

Date: 2026-07-23

Status: research checkpoint only. The source was supplied as the user-uploaded archive `client-mgc-reparation-main.zip`. No archive content, client data, secret value, code, runtime change, workflow, publication or deployment is imported into Senza Roaming.

## Purpose

This document replaces the earlier assumption that only the Garage Terrebonne landing-page prototypes were available.

The uploaded archive contains a substantially larger real-client implementation and is therefore useful as:

- a historical case study of a local PPL system;
- evidence of which architecture and conversion patterns reached implementation;
- a negative regression corpus for security, privacy, SEO and editorial-governance checks.

It is not a reusable codebase for Senza Roaming.

## Sanitization rule

This audit records no credential value and reproduces no personal lead data.

The archive contains files and source locations consistent with live credentials. Their values were not copied, displayed, tested or committed to `soliwkr/esim`.

## Verified implementation snapshot

The archive is a React 19 / Vite single-page application, not an Astro or server-rendered public site.

Observed surface:

- 246 relevant source, data and documentation files;
- approximately 118,000 lines, dominated by JSON data and bundled documentation;
- 51 TSX files;
- 19 TypeScript files;
- 38 JavaScript files;
- 252 URLs in the generated sitemap;
- 230 pSEO records in `data/pseo_content.json`;
- static pages, service pages, city pages and dynamic FAQ pages;
- five intent/offer landing variants, including the three canonical avatars;
- live Google Places business-data loading in the browser;
- JSON-LD generation for business, reviews, FAQ, service and breadcrumbs;
- GTM/dataLayer event helpers;
- contact, quote and prequalification forms;
- a mock operations dashboard;
- keyword harvesting, Vertex content generation, sitemap generation, location enrichment and Google Business Profile scripts;
- Google Apps Script CRM/calendar/Drive/email prototypes;
- GHL and ClickUp exploration/MCP material.

The original strategic source-of-truth is included in the archive and matches the preserved version already found in `thesprint-uk`.

## Implemented pipeline

The implementation demonstrates a real sequence:

```text
keyword suggestions
→ local keyword CSV
→ Vertex AI answer generation
→ pSEO JSON database
→ client-rendered FAQ route
→ generated sitemap
→ CTA / lead form
→ browser-side webhook notification
```

It also contains a separate business-data sequence:

```text
Google Place ID
→ Places API in browser
→ hours, phone, rating and reviews
→ visible UI + JSON-LD
```

These are concrete implementations, not merely strategy notes.

## What is genuinely valuable

### 1. Intent and message match

The strongest strategic pattern remains the three-state split:

- immediate safety/pain;
- skepticism and value;
- seasonal convenience and bundling.

Each state was connected to a distinct page, offer, CRM label and urgency model. This is useful when the difference is based on actual user motivation rather than a substituted place name.

Potential Senza Roaming translation:

```text
travel intent / constraint
→ distinct entry page
→ relevant guide or comparison
→ matching CTA and provider sub-ID
→ outbound event
→ affiliate outcome when available
```

### 2. Structured content inventory

The pSEO database uses a stable record shape containing:

- slug;
- keyword;
- city;
- generated answer;
- generation timestamp.

The shape is simple and machine-readable. The Senza Roaming equivalent must be stricter and include claim/evidence/readiness state rather than a single HTML answer.

### 3. Incremental batch persistence

The Vertex generation and location-enrichment scripts save after each completed item. That crash-recovery discipline is useful, although Senza Roaming already has stronger Workflow and D1 primitives.

### 4. Live business-data normalization

The code normalizes Places data into a reusable business object and derives hours, reviews and schema fields. The reusable lesson is to normalize source data once. The browser-side key and direct API design are not reusable.

### 5. One measurement vocabulary across variants

The code consistently uses concepts such as:

- landing-page view;
- generated lead;
- click to call;
- avatar type;
- vehicle or request type.

Senza Roaming should preserve the same discipline with its own canonical vocabulary for page type, destination, CTA position, provider, sub-ID, event ID and consent state.

## Critical security findings

## P0 — credentials included in the source archive

The archive contains the following sensitive-file classes:

- `.env` with API and operational variable names;
- OAuth client configuration;
- Google Cloud service-account material including a private-key field;
- cached Google OAuth access/refresh token material;
- key/test files;
- hardcoded Google API keys in browser source;
- hardcoded Google Chat incoming-webhook credentials in form components.

The root `.gitignore` does not exclude `.env` or the credential JSON filenames found in the archive.

Required treatment outside this audit:

1. assume every real credential present in the archive is compromised;
2. revoke or rotate it at the issuing provider;
3. restrict replacement browser keys by domain, API and quota;
4. remove credentials from repository history, not only from the latest tree;
5. publish a sanitized archive if the project is retained;
6. add secret scanning and push protection.

This audit does not execute revocation because it has no mandate to mutate third-party accounts and does not use the exposed values.

## P0 — browser sends lead PII directly to a notification webhook

Multiple forms send names, phone numbers, email addresses, vehicle information and request details directly from the browser to a Google Chat webhook embedded in client code.

Consequences:

- the webhook credential is recoverable by every visitor;
- any third party can potentially submit messages to the destination;
- there is no server-side validation, rate limit, abuse control or canonical audit record;
- lead data leaves the site through a channel not accurately described by the privacy page.

Senza Roaming guardrail:

> Browser code never receives operational credentials and never sends personal or commercial events directly to an embedded third-party secret endpoint.

## P0 — PII placed in the URL

The prequalification flow redirects to the thank-you page with name, email, phone and vehicle type in query parameters.

That can expose data through:

- browser history;
- referrer headers;
- analytics page URLs;
- screenshots;
- logs;
- copied links.

Senza Roaming already prohibits operational tokens in URLs. The same rule should apply to personal data.

## P0 — personal form drafts persisted in localStorage

The quote-wizard context persists the full draft object in `localStorage`, including contact and vehicle fields.

This creates unnecessary retention on shared or compromised devices and has no expiry or consent model.

## Privacy and measurement findings

## P0 — tracking loads before consent

GTM is loaded directly from `index.html`. No CMP or consent-default-denied layer was found before the container loads.

The privacy page describes tracking as aggregated and anonymous, while code can push lead-related information and enhanced-conversion-style user data into the data layer.

This mismatch is a concrete reason that Senza Roaming M6 must define consent, event contracts and privacy text together.

## P1 — enriched lead data in the client data layer

The tracking helper can place email, phone and name-derived fields into `user_data` in the browser data layer.

Whether a destination tag hashes or transmits those fields depends on GTM configuration outside the repository. The repository provides no consent gate or verifiable destination contract.

## Trust and editorial findings

## P0 — fabricated scarcity

Dynamic FAQ pages set a random scarcity counter and render messages such as a small number of remaining places. This value is not linked to real capacity.

This is incompatible with Senza Roaming evidence rules.

## P0 — unsupported or placeholder operational claims

Examples of claim classes found in the implementation include:

- same-day availability;
- free courtesy vehicle availability;
- price superiority over dealerships;
- guarantees;
- certification language;
- fixed response-time promises;
- placeholder phone numbers;
- offers and discounts;
- hardcoded testimonials;
- default perfect rating while live data is loading.

The problem is not persuasive copy itself. The problem is that claim truth is encoded in components independently from verified source state.

## P0 — generation prompt instructs self-promotion

The Vertex content generator explicitly asks generated answers to explain why the client is the best option and to encourage a free estimate.

It does not require evidence, claim IDs, source URLs, expiry, or approval before adding the page to the pSEO database and sitemap.

## P1 — raw generated HTML

Generated answer HTML is parsed with regular expressions and inserted with `dangerouslySetInnerHTML`.

The input is generated by the project rather than by an arbitrary visitor, but a compromised model response, data file or generation pipeline can still produce unsafe or malformed markup.

Senza Roaming's structured editorial blocks are the correct replacement.

## SEO and rendering findings

## P1 — public content is a client-rendered SPA

The application decides routes from `window.location.pathname` and renders all content through React.

Consequences include:

- less deterministic raw HTML;
- metadata dependent on client rendering;
- no server-native status handling;
- weaker progressive enhancement;
- larger JavaScript dependency for content pages.

This reinforces Astro as Senza Roaming's public surface.

## P1 — unknown routes return the homepage

The routing fallback renders `HomePage` rather than a real 404 response.

A visible “page not found” state inside a dynamic FAQ route still cannot set the HTTP status in this static SPA.

## P1 — canonical coverage is optional and incomplete

The global SEO component emits a canonical only when explicitly supplied. Many page calls do not pass one.

The hreflang implementation points language alternatives to the same URL and does not model separate localized URLs or a language-selection contract.

## P1 — sitemap outruns readiness

The sitemap includes every pSEO JSON key, producing 252 URLs in the archived build, without a per-page readiness, evidence, quality or indexability gate.

This is the exact failure mode Senza Roaming must avoid.

## P1 — questionable schema choices

Dynamic FAQ pages declare `Product`, `Offer`, availability and aggregate rating without a visible price contract or clear product identity. Business schema uses default values during loading.

Schema must reflect rendered, verified facts rather than conversion intent.

## Operational findings

## P1 — no real automated test command

`package.json` has development, build and preview scripts only. No typecheck, unit, route, smoke, accessibility, security or end-to-end test command is defined.

## P2 — dashboard is mock data

The “Command Center” labels itself live, but its KPIs, chart data and shop tasks are hardcoded mock arrays.

This is a trust failure if exposed outside development.

## P2 — mixed and unfinished execution paths

The archive contains several partially overlapping operational approaches:

- direct Google Chat webhooks;
- Google Apps Script lead handling;
- GHL exploration;
- ClickUp exploration;
- Google Contacts/Calendar/Drive/Email automation;
- mock Google Business Profile publication.

The repository does not establish one canonical production path.

## Decision for Senza Roaming

`ADOPT DISCIPLINE AND FAILURE FIXTURES; REJECT CODE IMPORT`

No MGC source file should be copied into Senza Roaming.

Convert the case into deterministic checks:

### Security fixtures

- forbidden secret filenames;
- secret-pattern scan;
- no operational credential in browser bundles;
- no PII in query strings;
- no personal form draft in persistent browser storage without an explicit contract;
- no direct third-party secret webhook from the browser.

### Editorial fixtures

- no random scarcity;
- no hardcoded review, certification, guarantee, discount or availability claim;
- every factual statement maps to valid evidence;
- expired evidence cannot feed published copy;
- generated content remains draft until separate approval and publication gates.

### SEO fixtures

- real 404 response;
- canonical on every indexable page;
- raw HTML contains the primary content and metadata;
- sitemap contains only publishable/indexable pages;
- schema matches visible verified facts;
- no client-only route is required for public content.

### Measurement fixtures

- consent default before tags;
- stable event vocabulary;
- no raw PII in analytics events;
- event ID and server/client deduplication where needed;
- privacy text matches actual processors and data flows.

## Net value

The MGC archive does not reduce implementation time by supplying reusable code.

Its value is higher as evidence:

- it proves that message-match and intent segmentation can be translated into a real product;
- it exposes how quickly a working lead-generation project accumulates security, privacy, SEO and claim debt when generation and conversion are allowed to bypass governance;
- it provides concrete negative cases that can prevent the same debt in Senza Roaming.

## Explicit exclusions

This audit does not authorize:

- using client data;
- using or testing archived credentials;
- contacting the former client;
- restoring or deploying the MGC project;
- publishing Google Business Profile content;
- importing CRM records;
- reproducing testimonials, offers or claims;
- changing Senza Roaming runtime or backend;
- publication or affiliate activation.

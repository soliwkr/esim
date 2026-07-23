# Public frontend parallel track

Date: 2026-07-23

Status: architecture and execution-order decision. This document does not authorize a public route cutover, content publication, affiliate activation, backend rewrite or legacy removal.

## Decision

M5 public Astro work may proceed in parallel with the remaining M4 Control Room mutations.

The two tracks have different exit criteria and must not be coupled:

```text
Track A — M4 operations
brief conversion
→ claim operations
→ draft decision
→ optional queue retry
→ legacy removal only after operational parity

Track B — M5 public frontend
public shell preview
→ static and editorial route migration
→ catalog pilot
→ measurement readiness
→ separate apex cutover decision
```

Starting M5 does not mark M4 complete. Completing a public preview does not authorize removal of the legacy Control Room. Completing a Control Room mutation does not authorize public publication.

## Why parallel work is now acceptable

The repository has already established:

- Astro and the backend in one custom Cloudflare Worker entrypoint;
- a protected React island for the Control Room;
- server-side Access identity and no browser D1 access;
- complete read-only operational parity;
- one production-verified mutation with state machine, audit and idempotency;
- backend editorial states and publication gates independent from the frontend renderer;
- a legacy public renderer that can remain the live fallback during migration;
- CI covering Astro build, `workerd`, D1, Container and browser smoke tests.

The external-repository audit also confirms that Senza Roaming should migrate its existing public semantics rather than import another pSEO or publishing engine.

## Non-negotiable separation

```text
M5 preview ≠ public cutover
Astro route exists ≠ page is publishable
approved draft ≠ published page
public renderer migration ≠ editorial state mutation
M5 progress ≠ M4 completion
legacy fallback retained ≠ architectural failure
```

## First implementation PR

Planned branch:

```text
feat/public-astro-shell
```

Exclusive scope:

1. replace the current `/astro-foundation` spike with a real public-shell preview;
2. keep the preview `noindex` and outside the canonical public route set;
3. introduce reusable Astro public primitives:
   - document/layout shell;
   - metadata and canonical contract;
   - header and primary navigation;
   - footer and trust links;
   - public design tokens and typography;
   - responsive content container;
4. compose a first homepage preview using static, non-commercial copy;
5. preserve the current live apex and all backend routes;
6. add deterministic build and browser smoke coverage for the preview.

Explicitly excluded:

- routing `/` to Astro;
- removal or modification of the legacy public renderer;
- provider comparisons or current commercial claims;
- D1 queries from the public page;
- publication state changes;
- affiliate links or redirects;
- CMP, GA4, GTM or Search Console activation;
- Control Room mutations;
- Worker backend contract changes beyond the already existing Astro delegation.

## First-PR acceptance criteria

- `npm run types`, typecheck and Astro build are green;
- existing D1, quality, Container, runtime and Control Room smoke tests remain green;
- `/astro-foundation` renders primary content in raw HTML;
- the preview remains `noindex` and does not enter the public sitemap;
- metadata, canonical behavior and responsive navigation are deterministic;
- keyboard and mobile checks pass;
- no provider claim, price, coverage statement or affiliate CTA is introduced;
- no new publication or mutation route exists;
- current public routes continue to be served by the legacy backend.

## Later public migration slices

After the shell preview is accepted, M5 can continue one branch at a time:

1. static trust and methodology pages;
2. public homepage migration candidate;
3. destination, guide and comparison listing contracts;
4. article and grounded draft renderer in Astro;
5. canonical, sitemap, schema, related links and real 404 parity;
6. a small publication-ready catalog pilot;
7. separate apex cutover PR with rollback plan;
8. only then M6 consent, analytics and Search Console.

## Cutover gate

The apex must not switch to Astro merely because the preview looks complete.

A separate cutover decision must verify:

- route and metadata parity;
- canonical and sitemap correctness;
- real 404 behavior;
- structured-data validity;
- mobile and accessibility smoke tests;
- preservation of provider redirects and publication guardrails;
- rollback to the legacy renderer;
- no accidental publication of review-only content.

## Relationship to the audit

The audit informs implementation narrowly:

- `astro-rank-rent` / `rankempire-italia`: slug, route-matrix, schema and fail-fast test ideas;
- GEO Optimizer / Claude SEO: later drift and regression checks;
- MGC: security, privacy, claim and sitemap negative fixtures;
- The Sprint: small pilot before scale;
- Open Design: brief, pre-flight and critique process;
- Ahmeego: future trust/tool-led product composition, not a runtime dependency.

No external code is adopted by this decision.

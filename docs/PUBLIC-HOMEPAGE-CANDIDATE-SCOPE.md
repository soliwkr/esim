# Public homepage candidate — implementation record

Date: 2026-07-23

Status: completed. PR #63 was merged as `7ba767d`, final CI #284 passed, and the production preview was verified on desktop and mobile. This document does not authorize an apex cutover, canonical listing migration, publication, affiliates or analytics.

## Branch

```text
feat/public-homepage-candidate
```

## Goal achieved

`/astro-foundation` now renders the current published catalog server-side while remaining:

- namespaced;
- `noindex,nofollow`;
- `no-store`;
- outside the public sitemap;
- separate from canonical apex `/`.

## Shared source of truth

The legacy renderer and Astro use:

```text
src/public-page-cards.ts
```

Read model:

```text
slug
page_type
title
meta_description
cluster
```

Queries:

```text
featured:
status='published' AND featured=1
ORDER BY featured DESC, updated_at DESC
LIMIT 9

destinations:
status='published' AND page_type='destination'
ORDER BY featured DESC, updated_at DESC
LIMIT 6
```

The module:

- accepts no arbitrary SQL clause;
- validates positive limits;
- validates every D1 row at runtime;
- returns typed empty arrays;
- is used by legacy home, legacy listings and Astro;
- exposes no public browser API.

## Astro implementation

```text
apps/web/src/pages/astro-foundation.astro
apps/web/src/components/public/PublicPageCardGrid.astro
apps/web/src/styles/homepage-candidate.css
```

The candidate combines:

1. static hero and decision framing;
2. “Guide essenziali” from published featured pages;
3. “Destinazioni principali” from published destination pages;
4. existing method and trust sections;
5. links to canonical legacy routes.

Every card is present in raw HTML and works without JavaScript.

## Empty state

When a group has no published rows, the page renders:

```text
I contenuti sono in preparazione.
```

No AI substitute, placeholder provider, fabricated destination or fake count is generated.

## SEO isolation preserved

- canonical `https://senzaroaming.it/astro-foundation`;
- meta robots `noindex,nofollow`;
- response `X-Robots-Tag: noindex, nofollow`;
- `Cache-Control: no-store`;
- preview excluded from `/sitemap.xml`;
- canonical homepage `/` still owned by legacy.

## Test result

Dedicated command:

```bash
npm run smoke:public-homepage-candidate
```

The smoke creates isolated temporary D1 states and never changes shared or remote data.

Populated fixture:

- 10 published featured rows;
- 7 published destination rows;
- one featured `review` row;
- one destination `review` row;
- one featured `draft` row.

Verified:

- 9 featured cards rendered in deterministic order;
- 6 destination cards rendered in deterministic order;
- `review` and `draft` rows absent;
- canonical legacy links;
- legacy home uses the same published read model;
- sitemap includes published fixtures but not preview/review routes;
- unknown route returns real 404 with noindex;
- no island or required script;
- desktop grid has three columns;
- mobile grid has one column;
- keyboard and overflow checks pass.

Empty fixture:

- migrated catalog rows are archived only in the temporary state;
- both groups return empty arrays;
- two readable empty states render;
- zero catalog `<article>` elements render.

CI #279 passed the dedicated runtime checkpoint. Final CI #284 also passed all existing Control Room, D1, quality, Container and runtime suites.

## Corrections made during CI

1. The first empty fixture still contained a page seeded by migrations. The test now archives migrated rows only inside its temporary D1 state.
2. The second assertion matched the CSS selector name `catalog-card`. It now checks actual `<article class="catalog-card">` elements.

Neither correction changed production application behavior.

## Explicit exclusions preserved

PR #63 does not:

- change `/` routing;
- replace listing or article routes;
- publish `review` pages;
- read drafts, claims or evidence bundles for public rendering;
- mutate D1;
- add a public API;
- add React or required client JavaScript;
- enable affiliates, provider ranking or prices;
- install CMP, GTM, GA4 or Search Console code;
- configure or consume the service account;
- remove the legacy renderer.

## Exit status

Completed in CI:

- shared non-duplicative read model;
- published-only rendering;
- raw HTML;
- full CI.

Completed in production:

```text
merge PR #63 as 7ba767d
→ deploy from main
→ desktop checkpoint with remote catalog
→ mobile checkpoint with single-column cards and destination empty state
```

The screenshots attest visual rendering only. `noindex`, HTTP headers, published-only filtering, sitemap exclusion and review-row exclusion remain backed by CI and prior technical verification.

## Next gate

The live checkpoint authorizes the next isolated branch:

```text
feat/public-listing-previews
→ destinations / guides / comparisons in preview namespace
```

The apex cutover remains a later, separate, explicitly authorized PR.

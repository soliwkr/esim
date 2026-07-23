# Public homepage candidate — scope

Date: 2026-07-23

Status: authorized implementation scope for the next M5 branch. This document does not perform an apex cutover, publish content, enable affiliates, configure analytics or change editorial state.

## Branch

```text
feat/public-homepage-candidate
```

## Goal

Evolve `/astro-foundation` from a static shell preview into a credible candidate for the future public homepage by rendering the current published catalog server-side.

The route remains:

- namespaced under `/astro-foundation`;
- `noindex,nofollow`;
- `no-store`;
- excluded from the public sitemap;
- separate from the canonical apex `/`.

## Source of truth

The legacy homepage currently reads two published-only card groups from D1:

```text
featured:     status='published' AND featured=1, limit 9
destinations: status='published' AND page_type='destination', limit 6
```

The candidate homepage must preserve that semantic contract without copying the legacy HTML renderer.

## Allowed server-side extraction

The implementation may extract only the existing public-card read model into a small shared server-only module used by both legacy and Astro.

Allowed fields:

```text
slug
page_type
title
meta_description
cluster
```

Allowed behavior:

- query D1 only on the server;
- return only rows with `status='published'`;
- preserve `ORDER BY featured DESC, updated_at DESC`;
- preserve explicit limits;
- expose no browser API and no D1 binding to client code;
- return a typed empty array when no card exists;
- fail visibly in development/test on an invalid contract, not by inventing fallback content.

This extraction is not authorization to redesign backend contracts, add a public JSON endpoint or move editorial logic into Astro.

## Candidate homepage content

The page may combine:

1. the verified static hero and decision framing from PR #59;
2. a server-rendered “Guide essenziali” card grid from published featured pages;
3. a server-rendered “Destinazioni principali” card grid from published destination pages;
4. existing method and trust sections;
5. links to canonical legacy article/listing routes until their own Astro slices exist.

Every card must remain useful without JavaScript.

## Empty states

An empty catalog must not create fictional pages or claims.

Allowed copy is operational and non-commercial, for example:

```text
I contenuti sono in preparazione.
```

No AI-generated substitute, placeholder provider, fabricated destination or fake count is allowed.

## Metadata and SEO isolation

The candidate keeps:

- canonical `https://senzaroaming.it/astro-foundation`;
- meta robots `noindex,nofollow`;
- response `X-Robots-Tag: noindex, nofollow`;
- `Cache-Control: no-store`;
- exclusion from `/sitemap.xml`;
- no WebSite schema cutover requirement yet.

The canonical homepage `/` remains owned by the legacy renderer.

## Explicit exclusions

This branch must not:

- change `/` routing;
- replace `/destinazioni`, `/guide` or `/confronti`;
- replace article routes;
- publish pages in `review`;
- read drafts, claims or evidence bundles for public rendering;
- add or mutate D1 data;
- introduce an API endpoint;
- add React or client JavaScript to the public homepage;
- enable affiliate links or provider ranking;
- add prices, coverage, plan limits or unsupported commercial claims;
- install CMP, GTM, GA4 or Search Console code;
- configure or consume the service account;
- remove the legacy public renderer.

## Tests required

### Read-model tests

- published-only filter;
- featured ordering and limit;
- destination filter and limit;
- stable typed output;
- empty result;
- no review/draft rows returned.

### Runtime tests

- `/astro-foundation` returns 200 with noindex/no-store;
- published fixture cards appear in raw HTML;
- review fixture cards do not appear;
- card links point to canonical legacy routes;
- no `astro-island` and no required script;
- sitemap excludes `/astro-foundation`;
- apex `/` remains legacy;
- unknown public routes preserve real 404 behavior;
- all Control Room tests remain green.

### Browser tests

- desktop card grid;
- 390 px mobile stacking;
- keyboard navigation and visible focus;
- no horizontal overflow;
- empty state remains readable.

## Exit criteria

The branch is complete only when:

- the shared read model is used by legacy and Astro or an equally non-duplicative server-only design is demonstrated;
- the candidate renders only published rows;
- raw HTML is useful without JavaScript;
- CI is fully green;
- production preview is visually checked;
- no canonical route or publication state changed.

## Next gate

After this slice, and only after its live checkpoint:

```text
listing preview for destinations / guides / comparisons
```

The apex cutover remains a separate authorized PR after listing, article renderer and SEO parity work.

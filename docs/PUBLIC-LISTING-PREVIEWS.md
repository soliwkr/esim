# Public listing previews — implementation record

Date: 2026-07-23

Status: implemented in PR #65, verified by CI #291 and #296, merged as
`2483fbfd1327754a1a526e8c3e6b201a412e610d` and verified in production.
This document does not authorize canonical listing migration, article cutover,
SEO cutover, publication, affiliates or analytics.

## Branch

```text
feat/public-listing-previews
```

## Routes

```text
/astro-foundation/destinazioni
/astro-foundation/guide
/astro-foundation/confronti
```

The three routes are static Astro entrypoints. A path outside this explicit
matrix is not interpreted as a content type and returns a real 404.

## Shared route matrix

`src/public-listing-routes.ts` owns:

```text
page type
canonical path
preview path
navigation label
heading and description
card action
empty state
```

The matrix contains exactly:

| Type | Canonical | Preview |
|---|---|---|
| `destination` | `/destinazioni` | `/astro-foundation/destinazioni` |
| `guide` | `/guide` | `/astro-foundation/guide` |
| `comparison` | `/confronti` | `/astro-foundation/confronti` |

Duplicate types fail during module initialization. A requested type without a
definition throws instead of falling back to invented copy or an arbitrary query.

The legacy listing renderer now consumes the same definition for its existing
title, description and canonical path. Its route ownership and output contract
do not change.

## Published-only read model

Astro and the legacy renderer both call:

```text
loadPublishedListingCards(DB, type, 100)
```

The fixed query remains:

```sql
SELECT slug,page_type,title,meta_description,cluster
FROM pages
WHERE status='published' AND page_type=?
ORDER BY featured DESC, updated_at DESC
LIMIT ?
```

Consequences:

- no arbitrary SQL clause;
- D1 is read only on the server;
- no public browser API;
- `review` and `draft` rows are excluded;
- cards link to the existing canonical legacy article routes in PR #65;
- no article preview was implied by the listing slice.

The next authorized article-renderer slice may change only the preview listing
links to namespaced article-preview URLs. Canonical listing links and the legacy
renderer remain unchanged.

## Navigation

When `previewBase` is present, the header links Destinazioni, Guide and Confronti
to their preview paths. The homepage route cards and hero actions use the same
namespace. Trust pages therefore remain inside the preview when navigating to a
listing.

Listing cards in PR #65 still link to `/{slug}` because the article renderer had
not migrated at that checkpoint.

The listing page also renders a deterministic three-link catalog navigation with
`aria-current="page"` on the current section.

## Response and SEO isolation

Every listing preview is:

- `noindex,nofollow` in metadata;
- `X-Robots-Tag: noindex, nofollow`;
- `Cache-Control: no-store`;
- outside `/sitemap.xml`;
- canonical to its own namespaced preview URL;
- raw HTML without Astro islands or required scripts.

`apps/web/src/lib/public-preview-response.ts` centralizes the response headers.
The layout applies the helper for normal direct composition; each listing route
also applies it from route frontmatter.

This second application is intentional. CI #288 showed that response-header
mutation from `PublicLayout` did not propagate when the layout was nested inside
`PublicListingPage`. The test was not weakened: the contract was moved to the
route level, and CI #291 passed the same header assertion.

## Empty states

Each type has an explicit empty message:

```text
Non ci sono ancora destinazioni pubblicate.
Non ci sono ancora guide pubblicate.
Non ci sono ancora confronti pubblicati.
```

No provider, destination, comparison, price, ranking or count is fabricated when
the database has no published row for the type.

## Test

Dedicated command:

```bash
npm run smoke:public-listing-previews
```

The smoke creates two isolated temporary D1 states:

1. a populated catalog with three published rows per type, one `review` row per
   type and one `draft` guide;
2. an empty public catalog after migrated fixtures are archived only inside the
   temporary state.

Verified:

- all three matrix routes return 200;
- route metadata, canonical and response headers;
- published-only rendering;
- deterministic featured/update ordering;
- exact type filtering;
- exclusion of `review` and `draft`;
- parity with canonical legacy listing data;
- preview navigation and canonical article links;
- sitemap includes published articles but excludes preview and review paths;
- unknown preview route returns 404;
- desktop three-column card grid;
- mobile one-column card grid;
- current-page state, keyboard path and overflow;
- zero Astro islands and zero required scripts;
- three readable empty states with zero catalog articles;
- all existing D1, quality, Container, runtime and Control Room regressions.

CI #291 passed the application pipeline. CI #296 passed the final documentation
head before merge.

## Production checkpoint

After merge and automatic deployment:

- all three preview routes returned HTTP 200;
- Destinazioni rendered the remote empty state correctly;
- Guide rendered the remote published cards;
- Confronti rendered the remote published comparison card;
- the preview banner, breadcrumbs and header remained namespaced;
- `aria-current` styling visibly selected the current listing;
- no horizontal overflow was visible in the supplied narrow/mobile screenshots;
- the wide Guide screenshot showed the desktop hero/state two-column composition,
  the three-link navigation row and three published cards in the first grid row.

The narrow Guide screenshot was captured just above the `560px` CSS breakpoint,
so the catalog grid displayed two columns. This is expected. The dedicated CI
continues to verify one column below the mobile breakpoint.

The screenshots attest visual rendering only. Noindex/no-store, published-only
filtering, sitemap exclusion, review/draft exclusion and real 404 behavior remain
attested by runtime and browser tests.

## Explicit exclusions

PR #65 does not:

- replace `/destinazioni`, `/guide` or `/confronti`;
- change apex `/`;
- render articles in Astro;
- publish a page or mutate D1;
- read review drafts, claims or evidence bundles;
- add a public API;
- add React or client-side catalog code;
- add schema, canonical cutover or sitemap migration;
- enable provider ranking, prices or affiliates;
- install CMP, GTM, GA4 or Search Console code;
- configure or consume the Google service account;
- remove the legacy renderer.

## Closed gate and next scope

The production checkpoint is closed.

The next authorized branch is:

```text
feat/public-article-renderer
```

Its canonical scope lives in:

```text
docs/PUBLIC-ARTICLE-RENDERER-SCOPE.md
```

The apex, canonical listing routes and canonical article routes remain legacy.
The article slice is a separate noindex, published-only preview and does not
authorize SEO parity or cutover.

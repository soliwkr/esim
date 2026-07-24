export type PublicRouteOwner = 'astro' | 'backend';

export type PublicRouteKind =
  | 'preview'
  | 'control-room-foundation'
  | 'api'
  | 'provider-redirect'
  | 'legacy-control-room'
  | 'canonical-static'
  | 'seo-endpoint'
  | 'technical-asset'
  | 'canonical-article'
  | 'public-404';

export type PublicRouteDecision = Readonly<{
  pathname: string;
  owner: PublicRouteOwner;
  kind: PublicRouteKind;
  articleSlug: string | null;
}>;

export const PUBLIC_PREVIEW_BASE = '/astro-foundation' as const;
export const CONTROL_ROOM_FOUNDATION_BASE = '/control-room-foundation' as const;

export const PUBLIC_CANONICAL_STATIC_PATHS = [
  '/',
  '/destinazioni',
  '/guide',
  '/confronti',
  '/metodo',
  '/trasparenza',
  '/privacy',
] as const;

export const PUBLIC_SEO_ENDPOINT_PATHS = [
  '/sitemap.xml',
  '/robots.txt',
] as const;

export const PUBLIC_BACKEND_EXACT_PATHS = [
  '/control-room',
  '/control-room.js',
  '/favicon.svg',
] as const;

export const PUBLIC_RESERVED_SINGLE_SEGMENTS = new Set([
  'api',
  'astro-foundation',
  'control-room',
  'control-room.js',
  'control-room-foundation',
  'destinazioni',
  'guide',
  'confronti',
  'metodo',
  'trasparenza',
  'privacy',
  'go',
  'robots.txt',
  'sitemap.xml',
  'favicon.svg',
  '_astro',
  'astro',
]);

const canonicalStaticPaths = new Set<string>(PUBLIC_CANONICAL_STATIC_PATHS);
const seoEndpointPaths = new Set<string>(PUBLIC_SEO_ENDPOINT_PATHS);
const backendExactPaths = new Set<string>(PUBLIC_BACKEND_EXACT_PATHS);
const articleSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const fileProbePattern = /(^|\/)\.|(^|\/)[^/]+\.(?:bak|config|env|ini|js|json|log|map|php|properties|py|sql|txt|ya?ml)$/i;

function routingPathname(value: string): string {
  const withoutQuery = value.split(/[?#]/, 1)[0] || '/';
  return withoutQuery.startsWith('/') ? withoutQuery : `/${withoutQuery}`;
}

export function normalizePublicPathname(value: string): string {
  const withLeadingSlash = routingPathname(value);
  const collapsed = withLeadingSlash.replace(/\/{2,}/g, '/');
  if (collapsed === '/') return collapsed;
  return collapsed.replace(/\/+$/, '') || '/';
}

export function isControlRoomFoundationPath(pathname: string): boolean {
  const path = routingPathname(pathname);
  return path === CONTROL_ROOM_FOUNDATION_BASE
    || path.startsWith(`${CONTROL_ROOM_FOUNDATION_BASE}/`);
}

export function isPublicPreviewPath(pathname: string): boolean {
  const path = routingPathname(pathname);
  return path === PUBLIC_PREVIEW_BASE
    || path.startsWith(`${PUBLIC_PREVIEW_BASE}/`);
}

export function looksLikePublicFileProbe(pathnameOrPath: string): boolean {
  const path = normalizePublicPathname(pathnameOrPath).replace(/^\/+|\/+$/g, '');
  return fileProbePattern.test(path);
}

export function publicArticleSlugCandidate(pathname: string): string | null {
  const path = normalizePublicPathname(pathname);
  const segments = path.split('/').filter(Boolean);
  if (segments.length !== 1) return null;

  const slug = segments[0];
  if (!slug || PUBLIC_RESERVED_SINGLE_SEGMENTS.has(slug)) return null;
  if (!articleSlugPattern.test(slug)) return null;
  if (looksLikePublicFileProbe(slug)) return null;
  return slug;
}

function routeKind(pathname: string): Omit<PublicRouteDecision, 'owner'> {
  const path = normalizePublicPathname(pathname);

  // These two namespaces must retain the exact prefix semantics used before the policy module.
  // In particular, malformed leading-double-slash paths must not become newly Astro-owned.
  if (isControlRoomFoundationPath(pathname)) {
    return { pathname: path, kind: 'control-room-foundation', articleSlug: null };
  }
  if (isPublicPreviewPath(pathname)) {
    return { pathname: path, kind: 'preview', articleSlug: null };
  }
  if (path === '/api' || path.startsWith('/api/')) {
    return { pathname: path, kind: 'api', articleSlug: null };
  }
  if (path === '/go' || path.startsWith('/go/')) {
    return { pathname: path, kind: 'provider-redirect', articleSlug: null };
  }
  if (path === '/control-room' || path === '/control-room.js') {
    return { pathname: path, kind: 'legacy-control-room', articleSlug: null };
  }
  if (canonicalStaticPaths.has(path)) {
    return { pathname: path, kind: 'canonical-static', articleSlug: null };
  }
  if (seoEndpointPaths.has(path)) {
    return { pathname: path, kind: 'seo-endpoint', articleSlug: null };
  }
  if (backendExactPaths.has(path) || path.startsWith('/_astro/') || path.startsWith('/astro/')) {
    return { pathname: path, kind: 'technical-asset', articleSlug: null };
  }

  const articleSlug = publicArticleSlugCandidate(path);
  if (articleSlug) {
    return { pathname: path, kind: 'canonical-article', articleSlug };
  }

  return { pathname: path, kind: 'public-404', articleSlug: null };
}

export function currentPublicRouteDecision(pathname: string): PublicRouteDecision {
  const classified = routeKind(pathname);
  const owner: PublicRouteOwner = classified.kind === 'preview'
    || classified.kind === 'control-room-foundation'
    ? 'astro'
    : 'backend';

  return Object.freeze({ ...classified, owner });
}

export function targetPublicRouteDecision(pathname: string): PublicRouteDecision {
  const classified = routeKind(pathname);
  const owner: PublicRouteOwner = classified.kind === 'api'
    || classified.kind === 'provider-redirect'
    || classified.kind === 'legacy-control-room'
    || classified.kind === 'technical-asset'
    ? 'backend'
    : 'astro';

  return Object.freeze({ ...classified, owner });
}

// Production remains on the current matrix until an explicit M5.7 cutover PR changes this export.
export const activePublicRouteDecision = currentPublicRouteDecision;

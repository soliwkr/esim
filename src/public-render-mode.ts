import type { PublicListingType } from './public-page-cards';
import { PUBLIC_LISTING_DEFINITIONS } from './public-listing-routes';
import { PUBLIC_PREVIEW_BASE } from './public-route-policy';

export type PublicRenderMode = 'preview' | 'canonical';
export type PublicTrustSlug = 'metodo' | 'trasparenza' | 'privacy';

const listingByType = new Map<PublicListingType, (typeof PUBLIC_LISTING_DEFINITIONS)[number]>(
  PUBLIC_LISTING_DEFINITIONS.map((definition) => [definition.type, definition]),
);

export function publicHomePath(mode: PublicRenderMode): string {
  return mode === 'preview' ? PUBLIC_PREVIEW_BASE : '/';
}

export function publicListingPath(
  mode: PublicRenderMode,
  pageType: PublicListingType,
): string {
  const definition = listingByType.get(pageType);
  if (!definition) throw new TypeError(`Unsupported public listing page type: ${pageType}`);
  return mode === 'preview' ? definition.previewPath : definition.canonicalPath;
}

export function publicTrustPath(mode: PublicRenderMode, slug: PublicTrustSlug): string {
  return mode === 'preview' ? `${PUBLIC_PREVIEW_BASE}/${slug}` : `/${slug}`;
}

export function publicArticlePath(mode: PublicRenderMode, slug: string): string {
  const encoded = encodeURIComponent(slug);
  return mode === 'preview'
    ? `${PUBLIC_PREVIEW_BASE}/articoli/${encoded}`
    : `/${encoded}`;
}

export function publicPreviewBase(mode: PublicRenderMode): string | undefined {
  return mode === 'preview' ? PUBLIC_PREVIEW_BASE : undefined;
}

export function publicIsPreview(mode: PublicRenderMode): boolean {
  return mode === 'preview';
}

export function publicCacheControl(mode: PublicRenderMode): string {
  return mode === 'preview' ? 'no-store' : 'public,max-age=300';
}

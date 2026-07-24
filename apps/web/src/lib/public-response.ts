import type { PublicRenderMode } from '../../../../src/public-render-mode';
import { publicCacheControl } from '../../../../src/public-render-mode';

export function setPublicResponseHeaders(headers: Headers, mode: PublicRenderMode): void {
  headers.set('Cache-Control', publicCacheControl(mode));
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  if (mode === 'preview') {
    headers.set('X-Robots-Tag', 'noindex, nofollow');
  } else {
    headers.delete('X-Robots-Tag');
  }
}

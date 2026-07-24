import type { PublicRenderMode } from '../../../../src/public-render-mode';
import { publicCacheControl, publicIsPreview } from '../../../../src/public-render-mode';

export function setPublicResponseHeaders(
  headers: Headers,
  mode: PublicRenderMode,
  forceNoindex = false,
): void {
  const noindex = forceNoindex || publicIsPreview(mode);
  headers.set('Cache-Control', noindex ? 'no-store' : publicCacheControl(mode));
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  if (noindex) {
    headers.set('X-Robots-Tag', 'noindex, nofollow');
  } else {
    headers.delete('X-Robots-Tag');
  }
}

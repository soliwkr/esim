import type { ContentBlock, Env, FaqItem } from './types';
import { esc, siteBase } from './utils';

export function renderBlocks(blocks: ContentBlock[]): string {
  return blocks.map((block) => {
    if (block.type === 'paragraph') return `<p>${esc(block.text)}</p>`;
    if (block.type === 'heading') return `<h2>${esc(block.text)}</h2>`;
    if (block.type === 'bullets') return `<ul>${block.items.map((item) => `<li>${esc(item)}</li>`).join('')}</ul>`;
    if (block.type === 'steps') return `<ol>${block.items.map((item) => `<li>${esc(item)}</li>`).join('')}</ol>`;
    if (block.type === 'table') return `<div class="table-wrap"><table><thead><tr>${block.headers.map((header) => `<th>${esc(header)}</th>`).join('')}</tr></thead><tbody>${block.rows.map((row) => `<tr>${row.map((cell) => `<td>${esc(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    if (block.type === 'callout') return `<aside class="callout"><strong>${esc(block.title)}</strong><p>${esc(block.text)}</p></aside>`;
    return '';
  }).join('');
}

export function renderFaq(items: FaqItem[]): string {
  if (!items.length) return '';
  return `<section class="faq"><h2>Domande frequenti</h2>${items.map((item) => `<details><summary>${esc(item.question)}</summary><p>${esc(item.answer)}</p></details>`).join('')}</section>`;
}

export function layout(env: Env, options: {
  title: string;
  description: string;
  canonicalPath: string;
  content: string;
  schema?: Record<string, unknown> | Record<string, unknown>[];
  noindex?: boolean;
  status?: number;
}): Response {
  const canonical = `${siteBase(env)}${options.canonicalPath}`;
  const robots = options.noindex ? 'noindex,nofollow' : 'index,follow,max-image-preview:large';
  const schema = options.schema ? `<script type="application/ld+json">${JSON.stringify(options.schema)}</script>` : '';
  const html = `<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(options.title)}</title><meta name="description" content="${esc(options.description)}"><meta name="robots" content="${robots}"><link rel="canonical" href="${esc(canonical)}"><meta property="og:title" content="${esc(options.title)}"><meta property="og:description" content="${esc(options.description)}"><meta property="og:url" content="${esc(canonical)}"><meta name="theme-color" content="#102a43"><link rel="icon" href="/favicon.svg" type="image/svg+xml">${schema}<style>${styles}</style></head><body><header class="topbar"><nav class="wrap"><a class="brand" href="/">Senza <span>Roaming</span></a><div class="navlinks"><a href="/destinazioni">Destinazioni</a><a href="/guide">Guide</a><a href="/confronti">Confronti</a><a href="/metodo">Metodo</a></div></nav></header>${options.content}<footer class="footer"><div class="wrap"><strong>${esc(env.SITE_NAME)}</strong><p>Progetto editoriale indipendente sulle eSIM da viaggio. Prezzi, copertura e condizioni possono cambiare: verifichiamo le fonti e indichiamo la data dell’ultimo controllo.</p><a href="/trasparenza">Trasparenza</a><a href="/privacy">Privacy</a><a href="/metodo">Metodo editoriale</a></div></footer></body></html>`;
  const headers: Record<string, string> = {
    'content-type': 'text/html;charset=UTF-8',
    'cache-control': options.noindex ? 'no-store' : 'public,max-age=300',
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'strict-origin-when-cross-origin'
  };
  if (options.noindex) headers['x-robots-tag'] = 'noindex, nofollow';
  return new Response(html, { status: options.status ?? 200, headers });
}

const styles = `:root{--ink:#102a43;--muted:#52677b;--line:#d9e2ec;--paper:#fff;--soft:#f3f7fa;--sea:#007f86;--sea-dark:#005f63;--radius:22px;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:var(--ink);background:var(--paper)}*{box-sizing:border-box}body{margin:0;line-height:1.65}a{color:inherit}.wrap{width:min(1120px,calc(100% - 36px));margin:auto}.topbar{position:sticky;top:0;z-index:20;border-bottom:1px solid var(--line);background:rgba(255,255,255,.94);backdrop-filter:blur(14px)}nav{min-height:68px;display:flex;align-items:center;justify-content:space-between;gap:20px}.brand{text-decoration:none;font-weight:900;letter-spacing:-.04em;font-size:1.18rem}.brand span,.eyebrow{color:var(--sea)}.navlinks{display:flex;gap:18px;font-size:.94rem}.navlinks a{text-decoration:none;color:var(--muted)}.hero{padding:88px 0 62px;background:radial-gradient(circle at 90% 5%,#d8f4ef 0,transparent 40%),linear-gradient(180deg,#f8fbfd,#fff)}.eyebrow{text-transform:uppercase;letter-spacing:.14em;font-weight:850;font-size:.74rem}h1{font-size:clamp(2.5rem,7vw,5.8rem);line-height:.96;letter-spacing:-.065em;max-width:920px;margin:.2em 0}.lead{font-size:clamp(1.08rem,2vw,1.35rem);max-width:780px;color:var(--muted)}.actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:26px}.cta{display:inline-flex;padding:14px 20px;border-radius:999px;background:var(--sea);color:#fff;text-decoration:none;font-weight:850}.cta:hover{background:var(--sea-dark)}.secondary{background:#e9f1f5;color:var(--ink)}.note{font-size:.84rem;color:var(--muted)}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;padding:42px 0 78px}.card{border:1px solid var(--line);border-radius:var(--radius);padding:25px;background:#fff;box-shadow:0 14px 40px rgba(16,42,67,.04)}.card h2{letter-spacing:-.035em;line-height:1.15}.card p{color:var(--muted)}.section{padding:58px 0}.section.alt{background:var(--soft)}.article{width:min(790px,calc(100% - 36px));margin:auto;padding:42px 0 90px}.article h1{font-size:clamp(2.35rem,7vw,4.8rem)}.article h2{font-size:1.7rem;letter-spacing:-.035em;margin-top:2.4rem}.answer{border-left:5px solid var(--sea);background:#edf9f7;border-radius:0 18px 18px 0;padding:20px 22px;margin:28px 0}.breadcrumbs{font-size:.88rem;color:var(--muted);padding-top:18px}.meta{display:flex;flex-wrap:wrap;gap:9px;margin:18px 0}.pill{background:var(--soft);border:1px solid var(--line);padding:6px 10px;border-radius:999px;font-size:.8rem;color:var(--muted)}.callout,.disclosure{background:#fff7e8;border:1px solid #f3d59d;border-radius:18px;padding:18px 20px;margin:24px 0}.table-wrap{overflow:auto;border:1px solid var(--line);border-radius:16px;margin:24px 0}table{width:100%;border-collapse:collapse;min-width:560px}th,td{text-align:left;padding:13px 15px;border-bottom:1px solid var(--line)}th{background:var(--soft)}.faq details{border-top:1px solid var(--line);padding:15px 0}.faq summary{font-weight:800;cursor:pointer}.related{margin-top:50px;padding-top:28px;border-top:1px solid var(--line)}.footer{border-top:1px solid var(--line);padding:34px 0 54px;color:var(--muted);font-size:.87rem}.footer a{margin-right:13px}@media(max-width:800px){.navlinks{display:none}.grid{grid-template-columns:1fr}.hero{padding-top:62px}h1{font-size:3.25rem}}`;
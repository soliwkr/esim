import type { ContentBlock, Env, FaqItem, PageCard, PageRow } from './types';
import { loadPublishedListingCards, loadPublicHomepageCards } from './public-page-cards';
import { publicListingDefinition } from './public-listing-routes';
import { affiliateEnabled, esc, safeJsonParse, siteBase } from './utils';
import { layout, renderBlocks, renderFaq } from './render';

function cardsHtml(items: PageCard[]): string {
  if (!items.length) return '<p class="lead">I contenuti sono in preparazione.</p>';
  return items.map((item) => `<article class="card"><span class="eyebrow">${esc(item.cluster)}</span><h2><a href="/${esc(item.slug)}">${esc(item.title)}</a></h2><p>${esc(item.meta_description)}</p><a href="/${esc(item.slug)}">Leggi la guida →</a></article>`).join('');
}

export async function home(env: Env): Promise<Response> {
  const { featured, destinations } = await loadPublicHomepageCards(env.DB);
  const content = `<main><section class="hero"><div class="wrap"><div class="eyebrow">Internet in viaggio, senza improvvisare</div><h1>Trova la eSIM giusta prima di partire.</h1><p class="lead">Guide italiane su destinazioni, telefoni compatibili e provider. Confrontiamo dati, durata, hotspot, attivazione e limiti reali senza fingere che un piano vada bene per tutti.</p><div class="actions"><a class="cta" href="/migliore-esim">Confronta le eSIM</a><a class="cta secondary" href="/destinazioni">Scegli la destinazione</a></div></div></section><section class="section"><div class="wrap"><div class="eyebrow">Da dove iniziare</div><h2>Guide essenziali</h2><div class="grid">${cardsHtml(featured)}</div></div></section><section class="section alt"><div class="wrap"><div class="eyebrow">Partenze frequenti</div><h2>Destinazioni principali</h2><div class="grid">${cardsHtml(destinations)}</div></div></section></main>`;
  return layout(env, {
    title: `eSIM da viaggio: guide e confronti | ${env.SITE_NAME}`,
    description: 'Confronta eSIM da viaggio, destinazioni, provider e telefoni compatibili con guide italiane aggiornate e trasparenti.',
    canonicalPath: '/', content,
    schema: { '@context': 'https://schema.org', '@type': 'WebSite', name: env.SITE_NAME, url: siteBase(env) }
  });
}

export async function listing(env: Env, type: 'destination' | 'guide' | 'comparison'): Promise<Response> {
  const copy = publicListingDefinition(type);
  const items = await loadPublishedListingCards(env.DB, type, 100);
  return layout(env, { title: `${copy.title} | ${env.SITE_NAME}`, description: copy.description, canonicalPath: copy.canonicalPath, content: `<main><section class="hero"><div class="wrap"><div class="eyebrow">${esc(copy.title)}</div><h1>${esc(copy.title)}</h1><p class="lead">${esc(copy.description)}</p></div></section><section class="wrap grid">${cardsHtml(items)}</section></main>` });
}

async function related(env: Env, row: PageRow): Promise<string> {
  const result = await env.DB.prepare("SELECT slug,title FROM pages WHERE status='published' AND cluster=? AND slug<>? ORDER BY featured DESC,updated_at DESC LIMIT 5").bind(row.cluster, row.slug).all<{ slug: string; title: string }>();
  if (!result.results.length) return '';
  return `<aside class="related"><h2>Guide correlate</h2><ul>${result.results.map((item) => `<li><a href="/${esc(item.slug)}">${esc(item.title)}</a></li>`).join('')}</ul></aside>`;
}

function sourceList(value: string): string {
  const sources = safeJsonParse<Array<{ label: string; url: string }>>(value, []);
  const items = sources.map((source) => {
    try {
      const url = new URL(source.url);
      return url.protocol === 'https:' ? `<li><a href="${esc(url.toString())}" rel="noopener noreferrer">${esc(source.label)}</a></li>` : '';
    } catch { return ''; }
  }).join('');
  return items ? `<section><h2>Fonti</h2><ul>${items}</ul></section>` : '';
}

export async function article(env: Env, slug: string): Promise<Response> {
  const row = await env.DB.prepare("SELECT slug,page_type,title,meta_description,eyebrow,h1,direct_answer,intro,content_json,faq_json,source_links_json,primary_keyword,cluster,search_intent,source_checked_at,updated_at FROM pages WHERE slug=? AND status='published'").bind(slug).first<PageRow>();
  if (!row) return notFound(env);
  const blocks = safeJsonParse<ContentBlock[]>(row.content_json, []);
  const faq = safeJsonParse<FaqItem[]>(row.faq_json, []);
  const checked = row.source_checked_at ? row.source_checked_at.slice(0, 10) : 'da verificare';
  const disclosure = affiliateEnabled(env) ? 'Alcuni link possono essere affiliati. Potremmo ricevere una commissione senza costi aggiuntivi per te; la commissione non determina automaticamente la classifica.' : 'I link ai provider non sono attualmente remunerati.';
  const schemas: Record<string, unknown>[] = [{ '@context': 'https://schema.org', '@type': 'Article', headline: row.h1, description: row.meta_description, dateModified: row.updated_at, mainEntityOfPage: `${siteBase(env)}/${row.slug}`, author: { '@type': 'Organization', name: env.SITE_NAME } }];
  if (faq.length) schemas.push({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map((item) => ({ '@type': 'Question', name: item.question, acceptedAnswer: { '@type': 'Answer', text: item.answer } })) });
  const sectionPath = row.page_type === 'destination' ? 'destinazioni' : row.page_type === 'comparison' ? 'confronti' : 'guide';
  const content = `<main class="article"><div class="breadcrumbs"><a href="/">Home</a> / <a href="/${sectionPath}">${esc(row.cluster)}</a> / ${esc(row.h1)}</div><div class="meta"><span class="pill">${esc(row.cluster)}</span><span class="pill">Intento: ${esc(row.search_intent)}</span><span class="pill">Fonti verificate: ${esc(checked)}</span></div><div class="eyebrow">${esc(row.eyebrow)}</div><h1>${esc(row.h1)}</h1><p class="lead">${esc(row.intro)}</p><div class="answer"><strong>Risposta diretta.</strong> ${esc(row.direct_answer)}</div><div class="disclosure"><strong>Trasparenza:</strong> ${esc(disclosure)}</div>${renderBlocks(blocks)}${renderFaq(faq)}${sourceList(row.source_links_json)}${await related(env, row)}</main>`;
  return layout(env, { title: row.title, description: row.meta_description, canonicalPath: `/${row.slug}`, content, schema: schemas });
}

export function staticPage(env: Env, type: 'privacy' | 'trasparenza' | 'metodo'): Response {
  const pages = {
    privacy: { title: 'Privacy', description: 'Informazioni sul trattamento minimale dei dati.', body: '<h1>Privacy</h1><p>Non raccogliamo dati bancari, documenti, nomi o indirizzi email. Il redirect verso i provider registra soltanto pagina, provider, posizione del pulsante e data del click. Non salviamo indirizzi IP né user agent.</p><p>GTM e una CMP saranno configurati prima del lancio commerciale.</p>' },
    trasparenza: { title: 'Trasparenza editoriale e affiliazione', description: 'Come selezioniamo provider e gestiamo i link affiliati.', body: '<h1>Trasparenza</h1><p>Senza Roaming è indipendente. Possiamo ricevere commissioni tramite programmi affiliate ufficiali, senza costi aggiuntivi per il lettore.</p><p>La commissione non determina automaticamente la posizione di un provider. Valutiamo dati, durata, hotspot, rete, velocità, fair use, attivazione, assistenza e prezzo verificato.</p>' },
    metodo: { title: 'Metodo editoriale', description: 'Il processo usato per verificare e aggiornare le guide eSIM.', body: '<h1>Metodo editoriale</h1><p>Ogni pagina nasce da un intento distinto, non dalla sostituzione automatica del nome di un Paese.</p><h2>Controlli obbligatori</h2><ol><li>Compatibilità del dispositivo.</li><li>Fonti ufficiali del provider.</li><li>Data di verifica.</li><li>Dati, fair use e hotspot.</li><li>Durata, rete e attivazione.</li><li>Revisione prima della pubblicazione.</li></ol>' }
  } as const;
  const page = pages[type];
  return layout(env, { title: `${page.title} | ${env.SITE_NAME}`, description: page.description, canonicalPath: `/${type}`, content: `<main class="article">${page.body}</main>` });
}

export async function sitemap(env: Env): Promise<Response> {
  const result = await env.DB.prepare("SELECT slug,updated_at FROM pages WHERE status='published' ORDER BY slug").all<{ slug: string; updated_at: string }>();
  const base = siteBase(env);
  const staticPaths = ['/', '/destinazioni', '/guide', '/confronti', '/metodo', '/trasparenza', '/privacy'];
  const urls = [...staticPaths.map((path) => `<url><loc>${esc(`${base}${path}`)}</loc></url>`), ...result.results.map((row) => `<url><loc>${esc(`${base}/${row.slug}`)}</loc><lastmod>${esc(row.updated_at.slice(0, 10))}</lastmod></url>`)].join('');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`, { headers: { 'content-type': 'application/xml;charset=UTF-8', 'cache-control': 'public,max-age=3600' } });
}

export function favicon(): Response {
  return new Response('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="#007f86"/><path d="M14 39c8-18 25-22 37-12-9 0-17 3-22 10 7-3 14-3 21 0-12 13-27 13-36 2Z" fill="#fff"/><circle cx="43" cy="21" r="5" fill="#ffb84d"/></svg>', { headers: { 'content-type': 'image/svg+xml', 'cache-control': 'public,max-age=86400' } });
}

export function notFound(env: Env): Response {
  return layout(env, {
    title: `Pagina non trovata | ${env.SITE_NAME}`,
    description: 'La pagina richiesta non esiste.',
    canonicalPath: '/404',
    noindex: true,
    status: 404,
    content: '<main class="article"><div class="eyebrow">404</div><h1>Questa pagina non è partita.</h1><p class="lead">Torna alle destinazioni o alle guide principali.</p></main>'
  });
}

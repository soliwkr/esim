import type { ContentBlock, Env, FaqItem } from './types';
import { generateVertexJson, missingVertexConfig, VertexGatewayError } from './vertex';
import { layout, renderBlocks, renderFaq } from './render';
import { esc, safeJsonParse } from './utils';

type Obj = Record<string, unknown>;
type DraftAction = 'changes_requested' | 'approved';
type PageType = 'destination' | 'guide' | 'comparison' | 'provider';

const PROMPT_VERSION = 'editorial-page-draft-v1';
const DRAFT_ACTIONS = new Set<DraftAction>(['changes_requested', 'approved']);

const RESPONSE_SCHEMA: Obj = {
  type: 'OBJECT',
  properties: {
    title: { type: 'STRING' },
    metaDescription: { type: 'STRING' },
    eyebrow: { type: 'STRING' },
    h1: { type: 'STRING' },
    directAnswer: { type: 'STRING' },
    intro: { type: 'STRING' },
    primaryKeyword: { type: 'STRING' },
    sections: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          heading: { type: 'STRING' },
          paragraphs: { type: 'ARRAY', items: { type: 'STRING' } },
          bullets: { type: 'ARRAY', items: { type: 'STRING' } },
          claimIds: { type: 'ARRAY', items: { type: 'INTEGER' } }
        },
        required: ['heading', 'paragraphs', 'bullets', 'claimIds']
      }
    },
    faq: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          question: { type: 'STRING' },
          answer: { type: 'STRING' },
          claimIds: { type: 'ARRAY', items: { type: 'INTEGER' } }
        },
        required: ['question', 'answer', 'claimIds']
      }
    },
    usedClaimIds: { type: 'ARRAY', items: { type: 'INTEGER' } }
  },
  required: [
    'title', 'metaDescription', 'eyebrow', 'h1', 'directAnswer', 'intro',
    'primaryKeyword', 'sections', 'faq', 'usedClaimIds'
  ]
};

function json(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: { 'cache-control': 'no-store' } });
}

function authorized(request: Request, env: Env): Response | null {
  if (!env.MAINTENANCE_TOKEN) return json({ ok: false, error: 'maintenance_api_disabled' }, 503);
  if (request.headers.get('authorization') !== `Bearer ${env.MAINTENANCE_TOKEN}`) {
    return json({ ok: false, error: 'unauthorized' }, 401);
  }
  return null;
}

function obj(value: unknown): Obj | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Obj : null;
}

function arr(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function str(value: unknown, max = 4000): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function integer(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isInteger(value) ? value : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function parseJson(value: unknown, fallback: unknown): unknown {
  try { return JSON.parse(String(value ?? '')); } catch { return fallback; }
}

function uniqueStrings(value: unknown, maxItems = 20, maxLength = 1000): string[] {
  return [...new Set(arr(value).map((item) => str(item, maxLength)).filter(Boolean))].slice(0, maxItems);
}

function uniqueIntegers(value: unknown): number[] {
  return [...new Set(arr(value).map((item) => integer(item)).filter((item) => item > 0))];
}

async function readBody(request: Request): Promise<Obj | null> {
  try {
    const value: unknown = await request.json();
    return obj(value);
  } catch {
    return null;
  }
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((part) => part.toString(16).padStart(2, '0')).join('');
}

function pageType(assetType: unknown): PageType {
  const value = str(assetType, 60);
  if (value === 'destination') return 'destination';
  if (value === 'comparison') return 'comparison';
  if (value === 'provider_review') return 'provider';
  return 'guide';
}

function dateExpired(value: unknown): boolean {
  const text = str(value, 80);
  if (!text) return false;
  const parsed = Date.parse(text);
  return Number.isFinite(parsed) && parsed <= Date.now();
}

function publicDraft(row: Obj): Obj {
  return {
    id: Number(row.id),
    evidenceBundleId: Number(row.evidence_bundle_id),
    draftKey: row.draft_key,
    version: Number(row.version),
    pageSlug: row.page_slug,
    pageType: row.page_type,
    model: row.model,
    promptVersion: row.prompt_version,
    status: row.status,
    page: {
      title: row.title,
      metaDescription: row.meta_description,
      eyebrow: row.eyebrow,
      h1: row.h1,
      directAnswer: row.direct_answer,
      intro: row.intro,
      content: parseJson(row.content_json, []),
      faq: parseJson(row.faq_json, []),
      sources: parseJson(row.source_links_json, [])
    },
    usedClaimIds: parseJson(row.used_claim_ids_json, []),
    excludedClaimIds: parseJson(row.excluded_claim_ids_json, []),
    generationRules: parseJson(row.generation_rules_json, []),
    responseId: row.response_id || null,
    usage: parseJson(row.usage_json, {}),
    error: row.error_message || null,
    generatedBy: row.generated_by,
    reviewedBy: row.reviewed_by || null,
    reviewedAt: row.reviewed_at || null,
    reviewNotes: row.review_notes || '',
    materializedPageStatus: row.page_status || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

const DRAFT_SELECT = `
  SELECT d.*,p.status AS page_status
  FROM editorial_review_drafts d
  LEFT JOIN pages p ON p.slug=d.page_slug
`;

async function readDraft(env: Env, draftId: number): Promise<Obj | null> {
  const row = await env.DB.prepare(`${DRAFT_SELECT} WHERE d.id=?`).bind(draftId).first<Obj>();
  return row ? publicDraft(row) : null;
}

function evidenceClaims(bundle: Obj): { verified: Obj[]; excluded: Obj[] } {
  const claims = arr(bundle.claims).map(obj).filter((item): item is Obj => Boolean(item));
  const verified = claims.filter((claim) =>
    claim.status === 'verified'
    && claim.expired !== true
    && !dateExpired(obj(claim.verification)?.validUntil)
    && Boolean(obj(claim.source)?.url)
  );
  const verifiedIds = new Set(verified.map((claim) => Number(claim.id)));
  return { verified, excluded: claims.filter((claim) => !verifiedIds.has(Number(claim.id))) };
}

function promptFor(bundle: Obj, verifiedClaims: Obj[], excludedClaimIds: number[]): string {
  const brief = obj(bundle.brief) || {};
  const conflicts = arr(bundle.conflicts);
  const rules = uniqueStrings(bundle.contentRules, 30, 800);
  const compactClaims = verifiedClaims.map((claim) => ({
    id: Number(claim.id),
    subjectType: claim.subjectType,
    subjectKey: claim.subjectKey,
    scope: claim.scope,
    fieldName: claim.fieldName,
    claimText: claim.claimText,
    evidence: claim.evidence,
    value: claim.value,
    source: claim.source,
    verification: claim.verification
  }));

  return [
    'Sei il renderer editoriale controllato di Senza Roaming, sito italiano sulle eSIM da viaggio.',
    'Produci esclusivamente JSON conforme allo schema richiesto.',
    '',
    'OBIETTIVO:',
    'Creare una bozza leggibile e utile, destinata esclusivamente allo stato review.',
    '',
    'REGOLE INVIOLABILI:',
    '- Usa soltanto i VERIFIED CLAIMS forniti. Non introdurre fatti esterni, prezzi, reti, prestazioni, disponibilità o garanzie.',
    '- Ogni sezione e ogni FAQ deve indicare almeno un claimId verificato che la sostiene.',
    '- Attribuisci esplicitamente le dichiarazioni al provider: usa formule come “Airalo dichiara” o “secondo la pagina ufficiale Nomad”.',
    '- Non trasformare dichiarazioni dei provider in test indipendenti o promesse di funzionamento.',
    '- Non usare né parafrasare come fatto alcun claim escluso o insufficiente.',
    '- Quando documenti ufficiali dello stesso provider divergono, descrivili separatamente per pagina e scope, senza risolvere artificialmente il conflitto.',
    '- Non affermare che Google, social, mappe o altri servizi funzionino sempre: il bundle non contiene un test sul campo.',
    '- Non usare superlativi, classifiche, inviti all’acquisto o claim affiliate.',
    '- La directAnswer deve essere prudente, attribuita e coerente con i claim verificati.',
    '- Genera da 3 a 6 sezioni e da 2 a 5 FAQ.',
    '',
    `CLAIM ESCLUSI, DA NON USARE: ${JSON.stringify(excludedClaimIds)}`,
    `CONFLITTI DA MANTENERE VISIBILI: ${JSON.stringify(conflicts)}`,
    `REGOLE DEL BUNDLE: ${JSON.stringify(rules)}`,
    `BRIEF: ${JSON.stringify(brief)}`,
    `VERIFIED CLAIMS: ${JSON.stringify(compactClaims)}`
  ].join('\n');
}

function normalizeDraft(data: Obj, allowedClaims: Set<number>): {
  title: string;
  metaDescription: string;
  eyebrow: string;
  h1: string;
  directAnswer: string;
  intro: string;
  primaryKeyword: string;
  blocks: ContentBlock[];
  faq: FaqItem[];
  usedClaimIds: number[];
} | null {
  const title = str(data.title, 180);
  const metaDescription = str(data.metaDescription, 165);
  const eyebrow = str(data.eyebrow, 80);
  const h1 = str(data.h1, 180);
  const directAnswer = str(data.directAnswer, 700);
  const intro = str(data.intro, 1000);
  const primaryKeyword = str(data.primaryKeyword, 140);
  if (!title || !metaDescription || !eyebrow || !h1 || !directAnswer || !intro || !primaryKeyword) return null;

  const blocks: ContentBlock[] = [];
  const used = new Set<number>();
  for (const raw of arr(data.sections).slice(0, 6)) {
    const section = obj(raw);
    if (!section) continue;
    const heading = str(section.heading, 180);
    const claimIds = uniqueIntegers(section.claimIds).filter((id) => allowedClaims.has(id));
    if (!heading || !claimIds.length) continue;
    const paragraphs = uniqueStrings(section.paragraphs, 4, 1200);
    const bullets = uniqueStrings(section.bullets, 8, 500);
    if (!paragraphs.length && !bullets.length) continue;
    blocks.push({ type: 'heading', text: heading });
    paragraphs.forEach((text) => blocks.push({ type: 'paragraph', text }));
    if (bullets.length) blocks.push({ type: 'bullets', items: bullets });
    claimIds.forEach((id) => used.add(id));
  }

  const faq: FaqItem[] = [];
  for (const raw of arr(data.faq).slice(0, 5)) {
    const item = obj(raw);
    if (!item) continue;
    const question = str(item.question, 240);
    const answer = str(item.answer, 900);
    const claimIds = uniqueIntegers(item.claimIds).filter((id) => allowedClaims.has(id));
    if (!question || !answer || !claimIds.length) continue;
    faq.push({ question, answer });
    claimIds.forEach((id) => used.add(id));
  }

  uniqueIntegers(data.usedClaimIds).filter((id) => allowedClaims.has(id)).forEach((id) => used.add(id));
  if (!blocks.length || !used.size) return null;
  return { title, metaDescription, eyebrow, h1, directAnswer, intro, primaryKeyword, blocks, faq, usedClaimIds: [...used] };
}

function sourceLinks(claims: Obj[]): Array<{ label: string; url: string }> {
  const byUrl = new Map<string, { label: string; url: string }>();
  for (const claim of claims) {
    const source = obj(claim.source) || {};
    const url = str(source.url, 2000);
    const label = str(source.label, 300);
    if (!url.startsWith('https://') || !label) continue;
    byUrl.set(url, { label, url });
  }
  return [...byUrl.values()];
}

function addDeterministicWarnings(blocks: ContentBlock[], bundle: Obj, excluded: Obj[]): ContentBlock[] {
  const result = [...blocks];
  const conflicts = arr(bundle.conflicts).map(obj).filter((item): item is Obj => Boolean(item));
  for (const conflict of conflicts) {
    result.push({
      type: 'callout',
      title: 'Documentazione ufficiale non uniforme',
      text: str(conflict.message, 1200) || 'Le fonti ufficiali usano formulazioni differenti. La bozza mantiene separati documenti e ambiti.'
    });
  }

  const insufficient = excluded.filter((claim) => claim.status === 'insufficient');
  if (insufficient.length) {
    result.push({
      type: 'callout',
      title: 'Cosa non è dimostrato',
      text: insufficient.map((claim) => str(claim.evidence, 600) || str(claim.notes, 600) || str(claim.claimText, 600)).filter(Boolean).join(' ')
    });
  }

  const summary = obj(bundle.summary) || {};
  if (Number(summary.firstPartyTests || 0) === 0) {
    result.push({
      type: 'callout',
      title: 'Limite delle evidenze',
      text: 'Questa bozza confronta dichiarazioni ufficiali dei provider. Non contiene ancora un test indipendente eseguito sul campo in Cina.'
    });
  }
  return result;
}

async function generateDraft(request: Request, env: Env): Promise<Response> {
  const body = await readBody(request);
  if (!body) return json({ ok: false, error: 'object_payload_required' }, 400);
  const bundleId = integer(body.bundleId);
  const actor = str(body.actor, 120) || 'human-reviewer';
  const force = body.force === true;
  if (bundleId <= 0) return json({ ok: false, error: 'bundleId_required' }, 400);

  const missing = missingVertexConfig(env);
  if (missing.length) return json({ ok: false, error: 'ai_gateway_not_configured', missing }, 503);

  const bundleRow = await env.DB.prepare('SELECT * FROM page_evidence_bundles WHERE id=?')
    .bind(bundleId).first<Obj>();
  if (!bundleRow) return json({ ok: false, error: 'evidence_bundle_not_found' }, 404);
  if (!['approved_for_draft', 'approved_for_publication'].includes(str(bundleRow.review_status, 40))
      || Number(bundleRow.ready_for_review_draft || 0) !== 1) {
    return json({ ok: false, error: 'approved_evidence_bundle_required', reviewStatus: bundleRow.review_status }, 409);
  }

  const pageSlug = str(bundleRow.page_slug, 140);
  const existingPage = await env.DB.prepare('SELECT status FROM pages WHERE slug=?').bind(pageSlug).first<{ status: string }>();
  if (existingPage?.status === 'published') {
    return json({ ok: false, error: 'published_page_protected', pageSlug }, 409);
  }

  const existing = await env.DB.prepare(`
    ${DRAFT_SELECT}
    WHERE d.evidence_bundle_id=? AND d.status IN ('review','changes_requested','approved')
    ORDER BY d.version DESC LIMIT 1
  `).bind(bundleId).first<Obj>();
  if (existing && !force) {
    await env.DB.prepare(`
      INSERT INTO editorial_review_draft_events(draft_id,action,actor,details_json)
      VALUES(?,'duplicate',?,json_object('reason','same_bundle_without_force'))
    `).bind(Number(existing.id), actor).run();
    return json({ ok: true, duplicate: true, draft: publicDraft(existing) });
  }

  const bundle = obj(parseJson(bundleRow.bundle_json, {})) || {};
  const { verified, excluded } = evidenceClaims(bundle);
  if (!verified.length) return json({ ok: false, error: 'no_current_verified_claims' }, 409);
  const expiredIds = arr(bundle.claims).map(obj).filter((claim): claim is Obj => Boolean(claim))
    .filter((claim) => claim.status === 'verified' && dateExpired(obj(claim.verification)?.validUntil))
    .map((claim) => Number(claim.id));
  if (expiredIds.length) {
    return json({ ok: false, error: 'evidence_bundle_stale_re_evaluate', expiredClaimIds: expiredIds }, 409);
  }

  const maxVersion = await env.DB.prepare('SELECT COALESCE(MAX(version),0) AS version FROM editorial_review_drafts WHERE evidence_bundle_id=?')
    .bind(bundleId).first<{ version: number }>();
  const version = Number(maxVersion?.version || 0) + 1;
  const model = env.GOOGLE_VERTEX_MODEL as string;
  const draftKey = await sha256(`${bundleRow.bundle_key}|${PROMPT_VERSION}|${model}|${version}`);
  const type = pageType(obj(bundle.brief)?.assetType);

  const inserted = await env.DB.prepare(`
    INSERT INTO editorial_review_drafts(
      evidence_bundle_id,draft_key,version,page_slug,page_type,model,prompt_version,generated_by
    ) VALUES(?,?,?,?,?,?,?,?) RETURNING id
  `).bind(bundleId, draftKey, version, pageSlug, type, model, PROMPT_VERSION, actor).first<{ id: number }>();
  const draftId = Number(inserted?.id || 0);
  if (!draftId) return json({ ok: false, error: 'draft_insert_failed' }, 500);

  await env.DB.prepare(`
    INSERT INTO editorial_review_draft_events(draft_id,action,actor,details_json)
    VALUES(?,'generation_started',?,json_object('bundleId',?,'version',?))
  `).bind(draftId, actor, bundleId, version).run();

  try {
    const result = await generateVertexJson<Obj>(
      env,
      promptFor(bundle, verified, excluded.map((claim) => Number(claim.id))),
      RESPONSE_SCHEMA,
      { temperature: 0.15, maxOutputTokens: 6000 }
    );
    const allowedClaims = new Set(verified.map((claim) => Number(claim.id)));
    const normalized = normalizeDraft(result.data, allowedClaims);
    if (!normalized) throw new Error('invalid_or_untraceable_draft_output');

    const blocks = addDeterministicWarnings(normalized.blocks, bundle, excluded);
    const sources = sourceLinks(verified);
    const brief = obj(bundle.brief) || {};
    const cluster = str(brief.clusterTitle, 180) || 'Guide eSIM';
    const searchIntent = str(brief.searchIntent, 40) || 'informational';
    const title = normalized.title.includes(env.SITE_NAME) ? normalized.title : `${normalized.title} | ${env.SITE_NAME}`;
    const checkedDates = verified.map((claim) => str(obj(claim.verification)?.checkedAt, 80)).filter(Boolean).sort();
    const sourceCheckedAt = checkedDates[0] || new Date().toISOString();
    const rules = uniqueStrings(bundle.contentRules, 30, 800);

    const pageWrite = await env.DB.prepare(`
      INSERT INTO pages(
        slug,page_type,title,meta_description,eyebrow,h1,direct_answer,intro,
        content_json,faq_json,source_links_json,primary_keyword,cluster,search_intent,
        status,featured,source_checked_at,published_at,updated_at
      ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,'review',0,?,NULL,CURRENT_TIMESTAMP)
      ON CONFLICT(slug) DO UPDATE SET
        page_type=excluded.page_type,title=excluded.title,meta_description=excluded.meta_description,
        eyebrow=excluded.eyebrow,h1=excluded.h1,direct_answer=excluded.direct_answer,intro=excluded.intro,
        content_json=excluded.content_json,faq_json=excluded.faq_json,
        source_links_json=excluded.source_links_json,primary_keyword=excluded.primary_keyword,
        cluster=excluded.cluster,search_intent=excluded.search_intent,status='review',featured=0,
        source_checked_at=excluded.source_checked_at,published_at=NULL,updated_at=CURRENT_TIMESTAMP
      WHERE pages.status<>'published'
    `).bind(
      pageSlug, type, title, normalized.metaDescription, normalized.eyebrow,
      normalized.h1, normalized.directAnswer, normalized.intro,
      JSON.stringify(blocks), JSON.stringify(normalized.faq), JSON.stringify(sources),
      normalized.primaryKeyword, cluster, searchIntent, sourceCheckedAt
    ).run();
    if (!pageWrite.success) throw new Error('review_page_materialization_failed');

    await env.DB.prepare(`
      UPDATE editorial_review_drafts SET
        status='review',title=?,meta_description=?,eyebrow=?,h1=?,direct_answer=?,intro=?,
        content_json=?,faq_json=?,source_links_json=?,used_claim_ids_json=?,excluded_claim_ids_json=?,
        generation_rules_json=?,response_id=?,usage_json=?,error_message=NULL,updated_at=CURRENT_TIMESTAMP
      WHERE id=?
    `).bind(
      title, normalized.metaDescription, normalized.eyebrow, normalized.h1,
      normalized.directAnswer, normalized.intro, JSON.stringify(blocks), JSON.stringify(normalized.faq),
      JSON.stringify(sources), JSON.stringify(normalized.usedClaimIds),
      JSON.stringify(excluded.map((claim) => Number(claim.id))), JSON.stringify(rules),
      result.responseId, JSON.stringify(result.usage), draftId
    ).run();

    if (force) {
      await env.DB.prepare(`
        UPDATE editorial_review_drafts SET status='superseded',updated_at=CURRENT_TIMESTAMP
        WHERE evidence_bundle_id=? AND id<>? AND status IN ('review','changes_requested')
      `).bind(bundleId, draftId).run();
    }

    await env.DB.prepare(`
      INSERT INTO editorial_review_draft_events(draft_id,action,actor,details_json)
      VALUES(?,'generated',?,?)
    `).bind(draftId, actor, JSON.stringify({
      usedClaimIds: normalized.usedClaimIds,
      excludedClaimIds: excluded.map((claim) => Number(claim.id)),
      pageSlug,
      pageStatus: 'review'
    })).run();

    await env.DB.prepare(`
      INSERT OR IGNORE INTO maintenance_queue(
        dedupe_key,task_type,entity_type,entity_key,priority,payload_json
      ) VALUES(?,?,?,?,?,?)
    `).bind(
      `editorial-draft-review:${draftKey}`,
      'editorial_review',
      'page',
      pageSlug,
      clamp(Number(brief.priorityScore || 50), 1, 100),
      JSON.stringify({ reason: 'evidence_bound_draft_generated', draftId, bundleId, pageSlug })
    ).run();

    return json({ ok: true, duplicate: false, draft: await readDraft(env, draftId) }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'draft_generation_failed';
    await env.DB.prepare(`
      UPDATE editorial_review_drafts SET status='failed',error_message=?,updated_at=CURRENT_TIMESTAMP WHERE id=?
    `).bind(message.slice(0, 2000), draftId).run();
    await env.DB.prepare(`
      INSERT INTO editorial_review_draft_events(draft_id,action,actor,details_json)
      VALUES(?,'generation_failed',?,?)
    `).bind(draftId, actor, JSON.stringify({ message: message.slice(0, 1000) })).run();
    if (error instanceof VertexGatewayError) {
      return json({
        ok: false,
        error: 'ai_gateway_upstream_error',
        upstreamStatus: error.upstreamStatus,
        detail: error.detail,
        draftId
      }, 502);
    }
    return json({ ok: false, error: message, draftId }, 502);
  }
}

async function listDrafts(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const bundleId = Number.parseInt(url.searchParams.get('bundleId') || '0', 10) || 0;
  const draftId = Number.parseInt(url.searchParams.get('draftId') || '0', 10) || 0;
  const status = str(url.searchParams.get('status'), 40) || 'all';
  const limit = clamp(Number.parseInt(url.searchParams.get('limit') || '30', 10) || 30, 1, 100);
  const allowedStatuses = new Set(['generating', 'review', 'changes_requested', 'approved', 'failed', 'superseded']);
  if (status !== 'all' && !allowedStatuses.has(status)) return json({ ok: false, error: 'invalid_draft_status' }, 400);

  const clauses = ['1=1'];
  const bindings: unknown[] = [];
  if (bundleId > 0) { clauses.push('d.evidence_bundle_id=?'); bindings.push(bundleId); }
  if (draftId > 0) { clauses.push('d.id=?'); bindings.push(draftId); }
  if (status !== 'all') { clauses.push('d.status=?'); bindings.push(status); }
  bindings.push(limit);
  const rows = await env.DB.prepare(`
    ${DRAFT_SELECT}
    WHERE ${clauses.join(' AND ')}
    ORDER BY d.updated_at DESC,d.id DESC LIMIT ?
  `).bind(...bindings).all<Obj>();
  return json({ ok: true, count: rows.results.length, drafts: rows.results.map(publicDraft) });
}

function sourceHtml(value: unknown): string {
  const sources = arr(value).map(obj).filter((item): item is Obj => Boolean(item));
  const items = sources.map((source) => {
    const url = str(source.url, 2000);
    const label = str(source.label, 300);
    return url.startsWith('https://') && label
      ? `<li><a href="${esc(url)}" rel="noopener noreferrer">${esc(label)}</a></li>`
      : '';
  }).join('');
  return items ? `<section><h2>Fonti del bundle</h2><ul>${items}</ul></section>` : '';
}

async function previewDraft(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const draftId = Number.parseInt(url.searchParams.get('draftId') || '0', 10) || 0;
  if (draftId <= 0) return json({ ok: false, error: 'draftId_required' }, 400);
  const row = await env.DB.prepare(`${DRAFT_SELECT} WHERE d.id=?`).bind(draftId).first<Obj>();
  if (!row) return json({ ok: false, error: 'editorial_draft_not_found' }, 404);
  if (!['review', 'changes_requested', 'approved'].includes(str(row.status, 40))) {
    return json({ ok: false, error: 'draft_not_previewable', status: row.status }, 409);
  }

  const blocks = safeJsonParse<ContentBlock[]>(String(row.content_json || '[]'), []);
  const faq = safeJsonParse<FaqItem[]>(String(row.faq_json || '[]'), []);
  const sources = parseJson(row.source_links_json, []);
  const content = `<main class="article"><div class="meta"><span class="pill">PREVIEW PRIVATA</span><span class="pill">status: ${esc(String(row.status))}</span><span class="pill">bundle: ${Number(row.evidence_bundle_id)}</span><span class="pill">draft v${Number(row.version)}</span></div><div class="eyebrow">${esc(String(row.eyebrow))}</div><h1>${esc(String(row.h1))}</h1><p class="lead">${esc(String(row.intro))}</p><div class="answer"><strong>Risposta diretta proposta.</strong> ${esc(String(row.direct_answer))}</div><div class="disclosure"><strong>Bozza non pubblicabile:</strong> contenuto generato da un evidence bundle approvato per revisione. Richiede controllo umano e un gate separato prima della pubblicazione.</div>${renderBlocks(blocks)}${renderFaq(faq)}${sourceHtml(sources)}</main>`;
  return layout(env, {
    title: String(row.title),
    description: String(row.meta_description),
    canonicalPath: `/__review/${encodeURIComponent(String(row.page_slug))}`,
    content,
    noindex: true
  });
}

async function draftAction(request: Request, env: Env): Promise<Response> {
  const body = await readBody(request);
  if (!body) return json({ ok: false, error: 'object_payload_required' }, 400);
  const draftId = integer(body.draftId);
  const action = str(body.action, 40) as DraftAction;
  const actor = str(body.actor, 120) || 'human-reviewer';
  const notes = str(body.notes, 4000);
  if (draftId <= 0) return json({ ok: false, error: 'draftId_required' }, 400);
  if (!DRAFT_ACTIONS.has(action)) return json({ ok: false, error: 'invalid_draft_action' }, 400);

  const current = await env.DB.prepare('SELECT * FROM editorial_review_drafts WHERE id=?').bind(draftId).first<Obj>();
  if (!current) return json({ ok: false, error: 'editorial_draft_not_found' }, 404);
  if (!['review', 'changes_requested'].includes(str(current.status, 40))) {
    if (current.status === action) return json({ ok: true, duplicate: true, draft: await readDraft(env, draftId) });
    return json({ ok: false, error: 'draft_not_actionable', status: current.status }, 409);
  }

  await env.DB.prepare(`
    UPDATE editorial_review_drafts
    SET status=?,reviewed_by=?,reviewed_at=CURRENT_TIMESTAMP,review_notes=?,updated_at=CURRENT_TIMESTAMP
    WHERE id=?
  `).bind(action === 'approved' ? 'approved' : 'changes_requested', actor, notes, draftId).run();
  await env.DB.prepare(`
    INSERT INTO editorial_review_draft_events(draft_id,action,actor,details_json)
    VALUES(?,?,?,json_object('notes',?))
  `).bind(draftId, action, actor, notes).run();
  await env.DB.prepare(`
    UPDATE maintenance_queue SET status='completed',completed_at=CURRENT_TIMESTAMP,
      locked_at=NULL,locked_by=NULL,last_error=NULL,updated_at=CURRENT_TIMESTAMP
    WHERE entity_key=? AND task_type='editorial_review'
      AND status IN ('pending','processing','failed')
  `).bind(String(current.page_slug)).run();
  return json({ ok: true, duplicate: false, action, draft: await readDraft(env, draftId) });
}

export async function editorialDraftApi(request: Request, env: Env, path: string): Promise<Response> {
  const authError = authorized(request, env);
  if (authError) return authError;
  if (request.method === 'POST' && path === 'api/maintenance/editorial-draft-generate') {
    return generateDraft(request, env);
  }
  if (request.method === 'GET' && path === 'api/maintenance/editorial-drafts') {
    return listDrafts(request, env);
  }
  if (request.method === 'GET' && path === 'api/maintenance/editorial-draft-preview') {
    return previewDraft(request, env);
  }
  if (request.method === 'POST' && path === 'api/maintenance/editorial-draft-action') {
    return draftAction(request, env);
  }
  return json({ ok: false, error: 'editorial_draft_route_not_found' }, 404);
}

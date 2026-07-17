import type { ContentBlock, Env, FaqItem } from './types';
import { generateVertexJson, missingVertexConfig, VertexGatewayError } from './vertex';

type Obj = Record<string, unknown>;
type PageType = 'destination' | 'guide' | 'comparison' | 'provider';
type TopField = 'title' | 'metaDescription' | 'h1' | 'directAnswer' | 'intro';

const PROMPT_VERSION = 'editorial-page-draft-v2';
const TOP_FIELDS: TopField[] = ['title', 'metaDescription', 'h1', 'directAnswer', 'intro'];
const DB_FIELD_NAMES: Record<TopField, string> = {
  title: 'title',
  metaDescription: 'meta_description',
  h1: 'h1',
  directAnswer: 'direct_answer',
  intro: 'intro'
};

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
    fieldClaimIds: {
      type: 'OBJECT',
      properties: {
        title: { type: 'ARRAY', items: { type: 'INTEGER' } },
        metaDescription: { type: 'ARRAY', items: { type: 'INTEGER' } },
        h1: { type: 'ARRAY', items: { type: 'INTEGER' } },
        directAnswer: { type: 'ARRAY', items: { type: 'INTEGER' } },
        intro: { type: 'ARRAY', items: { type: 'INTEGER' } }
      },
      required: ['title', 'metaDescription', 'h1', 'directAnswer', 'intro']
    },
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
    'primaryKeyword', 'fieldClaimIds', 'sections', 'faq', 'usedClaimIds'
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

function evidenceClaims(bundle: Obj): { verified: Obj[]; excluded: Obj[] } {
  const claims = arr(bundle.claims).map(obj).filter((item): item is Obj => Boolean(item));
  const verified = claims.filter((claim) =>
    claim.status === 'verified'
    && claim.expired !== true
    && !dateExpired(obj(claim.verification)?.validUntil)
    && str(obj(claim.source)?.url, 2000).startsWith('https://')
  );
  const verifiedIds = new Set(verified.map((claim) => Number(claim.id)));
  return { verified, excluded: claims.filter((claim) => !verifiedIds.has(Number(claim.id))) };
}

function safeBrief(bundle: Obj): Obj {
  const brief = obj(bundle.brief) || {};
  return {
    id: brief.id,
    clusterTitle: brief.clusterTitle,
    proposedTitle: brief.proposedTitle,
    pageSlug: brief.pageSlug,
    assetType: brief.assetType,
    searchIntent: brief.searchIntent
  };
}

function promptFor(bundle: Obj, verifiedClaims: Obj[], excludedClaimIds: number[]): string {
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
    'Creare una bozza destinata esclusivamente allo stato review usando soltanto i claim verificati.',
    '',
    'REGOLE INVIOLABILI:',
    '- Il brief seguente descrive solo tema e intento: NON è una fonte fattuale.',
    '- Usa soltanto i VERIFIED CLAIMS. Non introdurre fatti esterni, prezzi, reti, prestazioni, disponibilità o garanzie.',
    '- title, metaDescription, h1, directAnswer e intro devono avere fieldClaimIds non vuoti e pertinenti.',
    '- directAnswer, intro e metaDescription devono nominare esplicitamente ogni provider cui attribuiscono una dichiarazione.',
    '- Ogni sezione e FAQ deve indicare almeno un claimId verificato.',
    '- Non associare claimIds a testo più ampio del claim: niente generalizzazioni da un provider a tutte o alcune eSIM.',
    '- Non trasformare dichiarazioni dei provider in test indipendenti o promesse di funzionamento.',
    '- Non usare né parafrasare come fatto alcun claim escluso o insufficiente.',
    '- Mantieni separati documenti e scope quando le fonti dello stesso provider divergono.',
    '- Non nominare Google, Maps, social, WhatsApp, Facebook, Instagram, TikTok o altri servizi se non compaiono nei claim verificati.',
    '- Non usare “garantisce”, “sempre” o formulazioni assolute.',
    '- Non usare classifiche, superlativi, inviti all’acquisto o claim affiliate.',
    '- Genera da 3 a 6 sezioni e da 2 a 5 FAQ.',
    '',
    `CLAIM ESCLUSI: ${JSON.stringify(excludedClaimIds)}`,
    `CONFLITTI DA MOSTRARE: ${JSON.stringify(arr(bundle.conflicts))}`,
    `REGOLE DEL BUNDLE: ${JSON.stringify(uniqueStrings(bundle.contentRules, 30, 800))}`,
    `BRIEF TEMATICO SANIFICATO: ${JSON.stringify(safeBrief(bundle))}`,
    `VERIFIED CLAIMS: ${JSON.stringify(compactClaims)}`
  ].join('\n');
}

type Normalized = {
  title: string;
  metaDescription: string;
  eyebrow: string;
  h1: string;
  directAnswer: string;
  intro: string;
  primaryKeyword: string;
  fieldClaimIds: Record<TopField, number[]>;
  blocks: ContentBlock[];
  faq: FaqItem[];
  sectionClaims: number[][];
  faqClaims: number[][];
  usedClaimIds: number[];
};

function normalizedSubject(value: unknown): string {
  return str(value, 120).toLocaleLowerCase('it').replace(/[^a-z0-9]+/g, ' ').trim();
}

function fieldMentionsSubjects(text: string, claimIds: number[], claimMap: Map<number, Obj>): boolean {
  const lower = normalizedSubject(text);
  const mappedClaims = claimIds.map((id) => claimMap.get(id)).filter((claim): claim is Obj => Boolean(claim));
  const providerClaims = mappedClaims.filter((claim) => claim.subjectType === 'provider');
  const subjects = [...new Set(providerClaims.map((claim) => normalizedSubject(claim.subjectKey)).filter(Boolean))];
  return subjects.every((subject) => lower.includes(subject));
}

function allGeneratedText(data: Obj): string {
  const sectionText = arr(data.sections).map(obj).filter((item): item is Obj => Boolean(item))
    .flatMap((item) => [str(item.heading), ...uniqueStrings(item.paragraphs), ...uniqueStrings(item.bullets)]);
  const faqText = arr(data.faq).map(obj).filter((item): item is Obj => Boolean(item))
    .flatMap((item) => [str(item.question), str(item.answer)]);
  return [str(data.title), str(data.metaDescription), str(data.h1), str(data.directAnswer), str(data.intro), ...sectionText, ...faqText]
    .join(' ').toLocaleLowerCase('it');
}

function evidenceCorpus(claims: Obj[]): string {
  return claims.map((claim) => [claim.claimText, claim.evidence, JSON.stringify(claim.value || {})].join(' '))
    .join(' ').toLocaleLowerCase('it');
}

function unsupportedNamedService(data: Obj, claims: Obj[]): string | null {
  const generated = allGeneratedText(data);
  const evidence = evidenceCorpus(claims);
  const terms = ['google maps', 'google', 'social media', 'social network', 'whatsapp', 'facebook', 'instagram', 'youtube', 'tiktok'];
  return terms.find((term) => generated.includes(term) && !evidence.includes(term)) || null;
}

function normalizeDraft(data: Obj, verifiedClaims: Obj[]): Normalized | null {
  const allowedClaims = new Set(verifiedClaims.map((claim) => Number(claim.id)));
  const claimMap = new Map(verifiedClaims.map((claim) => [Number(claim.id), claim]));
  const title = str(data.title, 180);
  const metaDescription = str(data.metaDescription, 165);
  const eyebrow = str(data.eyebrow, 80);
  const h1 = str(data.h1, 180);
  const directAnswer = str(data.directAnswer, 700);
  const intro = str(data.intro, 1000);
  const primaryKeyword = str(data.primaryKeyword, 140);
  if (!title || !metaDescription || !eyebrow || !h1 || !directAnswer || !intro || !primaryKeyword) return null;

  const rawFieldClaims = obj(data.fieldClaimIds);
  if (!rawFieldClaims) return null;
  const fieldClaimIds = {} as Record<TopField, number[]>;
  for (const field of TOP_FIELDS) {
    const ids = uniqueIntegers(rawFieldClaims[field]).filter((id) => allowedClaims.has(id));
    if (!ids.length) return null;
    fieldClaimIds[field] = ids;
  }

  if (!fieldMentionsSubjects(directAnswer, fieldClaimIds.directAnswer, claimMap)) return null;
  if (!fieldMentionsSubjects(intro, fieldClaimIds.intro, claimMap)) return null;
  if (!fieldMentionsSubjects(metaDescription, fieldClaimIds.metaDescription, claimMap)) return null;
  if (/\b(garantisce|garantito|garantita|funziona sempre|sempre accessibile)\b/i.test(allGeneratedText(data))) return null;
  if (unsupportedNamedService(data, verifiedClaims)) return null;

  const blocks: ContentBlock[] = [];
  const sectionClaims: number[][] = [];
  const faq: FaqItem[] = [];
  const faqClaims: number[][] = [];
  const used = new Set<number>();
  TOP_FIELDS.forEach((field) => fieldClaimIds[field].forEach((id) => used.add(id)));

  for (const raw of arr(data.sections).slice(0, 6)) {
    const section = obj(raw);
    if (!section) continue;
    const heading = str(section.heading, 180);
    const claimIds = uniqueIntegers(section.claimIds).filter((id) => allowedClaims.has(id));
    const paragraphs = uniqueStrings(section.paragraphs, 4, 1200);
    const bullets = uniqueStrings(section.bullets, 8, 500);
    if (!heading || !claimIds.length || (!paragraphs.length && !bullets.length)) continue;
    const text = [heading, ...paragraphs, ...bullets].join(' ');
    if (!fieldMentionsSubjects(text, claimIds, claimMap)) continue;
    blocks.push({ type: 'heading', text: heading });
    paragraphs.forEach((value) => blocks.push({ type: 'paragraph', text: value }));
    if (bullets.length) blocks.push({ type: 'bullets', items: bullets });
    sectionClaims.push(claimIds);
    claimIds.forEach((id) => used.add(id));
  }

  for (const raw of arr(data.faq).slice(0, 5)) {
    const item = obj(raw);
    if (!item) continue;
    const question = str(item.question, 240);
    const answer = str(item.answer, 900);
    const claimIds = uniqueIntegers(item.claimIds).filter((id) => allowedClaims.has(id));
    if (!question || !answer || !claimIds.length) continue;
    if (!fieldMentionsSubjects(answer, claimIds, claimMap)) continue;
    faq.push({ question, answer });
    faqClaims.push(claimIds);
    claimIds.forEach((id) => used.add(id));
  }

  uniqueIntegers(data.usedClaimIds).filter((id) => allowedClaims.has(id)).forEach((id) => used.add(id));
  if (sectionClaims.length < 2 || faqClaims.length < 1 || !used.size) return null;
  return {
    title,
    metaDescription,
    eyebrow,
    h1,
    directAnswer,
    intro,
    primaryKeyword,
    fieldClaimIds,
    blocks,
    faq,
    sectionClaims,
    faqClaims,
    usedClaimIds: [...used]
  };
}

function sourceLinks(claims: Obj[], usedIds: Set<number>): Array<{ label: string; url: string }> {
  const byUrl = new Map<string, { label: string; url: string }>();
  for (const claim of claims) {
    if (!usedIds.has(Number(claim.id))) continue;
    const source = obj(claim.source) || {};
    const url = str(source.url, 2000);
    const label = str(source.label, 300);
    if (url.startsWith('https://') && label) byUrl.set(url, { label, url });
  }
  return [...byUrl.values()];
}

function deterministicWarnings(blocks: ContentBlock[], bundle: Obj, excluded: Obj[]): ContentBlock[] {
  const result = [...blocks];
  const conflicts = arr(bundle.conflicts).map(obj).filter((item): item is Obj => Boolean(item));
  for (const conflict of conflicts) {
    result.push({
      type: 'callout',
      title: 'Documentazione ufficiale non uniforme',
      text: str(conflict.message, 1200) || 'Le fonti ufficiali usano formulazioni differenti; documenti e ambiti restano separati.'
    });
  }
  const insufficient = excluded.filter((claim) => claim.status === 'insufficient');
  if (insufficient.length) {
    result.push({
      type: 'callout',
      title: 'Cosa non è dimostrato',
      text: insufficient.map((claim) => str(claim.evidence, 600) || str(claim.notes, 600) || str(claim.claimText, 600))
        .filter(Boolean).join(' ')
    });
  }
  if (Number((obj(bundle.summary) || {}).firstPartyTests || 0) === 0) {
    result.push({
      type: 'callout',
      title: 'Limite delle evidenze',
      text: 'Questa bozza riporta dichiarazioni ufficiali attribuite ai provider. Non contiene ancora un test indipendente eseguito sul campo.'
    });
  }
  return result;
}

async function draftResponse(env: Env, draftId: number): Promise<Obj | null> {
  const row = await env.DB.prepare(`
    SELECT d.*,p.status AS page_status
    FROM editorial_review_drafts d
    LEFT JOIN pages p ON p.slug=d.page_slug
    WHERE d.id=?
  `).bind(draftId).first<Obj>();
  if (!row) return null;
  const mappings = await env.DB.prepare(`
    SELECT field_name,field_key,claim_id
    FROM editorial_review_draft_field_claims
    WHERE draft_id=? ORDER BY field_name,field_key,claim_id
  `).bind(draftId).all<{ field_name: string; field_key: string; claim_id: number }>();
  const fieldClaimIds: Record<string, unknown> = {};
  for (const mapping of mappings.results) {
    if (mapping.field_name === 'section' || mapping.field_name === 'faq') {
      const group = (fieldClaimIds[mapping.field_name] || {}) as Record<string, number[]>;
      group[mapping.field_key] = [...(group[mapping.field_key] || []), Number(mapping.claim_id)];
      fieldClaimIds[mapping.field_name] = group;
    } else {
      fieldClaimIds[mapping.field_name] = [...((fieldClaimIds[mapping.field_name] || []) as number[]), Number(mapping.claim_id)];
    }
  }
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
    fieldClaimIds,
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

async function insertProvenance(env: Env, draftId: number, normalized: Normalized): Promise<void> {
  const statements: D1PreparedStatement[] = [];
  for (const field of TOP_FIELDS) {
    for (const claimId of normalized.fieldClaimIds[field]) {
      statements.push(env.DB.prepare(`
        INSERT OR IGNORE INTO editorial_review_draft_field_claims(draft_id,field_name,field_key,claim_id)
        VALUES(?,?,?,?)
      `).bind(draftId, DB_FIELD_NAMES[field], '', claimId));
    }
  }
  normalized.sectionClaims.forEach((claimIds, index) => claimIds.forEach((claimId) => {
    statements.push(env.DB.prepare(`
      INSERT OR IGNORE INTO editorial_review_draft_field_claims(draft_id,field_name,field_key,claim_id)
      VALUES(?,'section',?,?)
    `).bind(draftId, String(index), claimId));
  }));
  normalized.faqClaims.forEach((claimIds, index) => claimIds.forEach((claimId) => {
    statements.push(env.DB.prepare(`
      INSERT OR IGNORE INTO editorial_review_draft_field_claims(draft_id,field_name,field_key,claim_id)
      VALUES(?,'faq',?,?)
    `).bind(draftId, String(index), claimId));
  }));
  if (statements.length) await env.DB.batch(statements);
}

async function generateGroundedDraft(request: Request, env: Env): Promise<Response> {
  const body = await readBody(request);
  if (!body) return json({ ok: false, error: 'object_payload_required' }, 400);
  const bundleId = integer(body.bundleId);
  const actor = str(body.actor, 120) || 'human-reviewer';
  const force = body.force === true;
  if (bundleId <= 0) return json({ ok: false, error: 'bundleId_required' }, 400);
  const missing = missingVertexConfig(env);
  if (missing.length) return json({ ok: false, error: 'ai_gateway_not_configured', missing }, 503);

  const bundleRow = await env.DB.prepare('SELECT * FROM page_evidence_bundles WHERE id=?').bind(bundleId).first<Obj>();
  if (!bundleRow) return json({ ok: false, error: 'evidence_bundle_not_found' }, 404);
  if (!['approved_for_draft', 'approved_for_publication'].includes(str(bundleRow.review_status, 40))
      || Number(bundleRow.ready_for_review_draft || 0) !== 1) {
    return json({ ok: false, error: 'approved_evidence_bundle_required', reviewStatus: bundleRow.review_status }, 409);
  }

  const pageSlug = str(bundleRow.page_slug, 140);
  const existingPage = await env.DB.prepare('SELECT status FROM pages WHERE slug=?').bind(pageSlug).first<{ status: string }>();
  if (existingPage?.status === 'published') return json({ ok: false, error: 'published_page_protected', pageSlug }, 409);

  const sameRenderer = await env.DB.prepare(`
    SELECT id FROM editorial_review_drafts
    WHERE evidence_bundle_id=? AND prompt_version=? AND status IN ('review','changes_requested','approved')
    ORDER BY version DESC LIMIT 1
  `).bind(bundleId, PROMPT_VERSION).first<{ id: number }>();
  if (sameRenderer && !force) {
    await env.DB.prepare(`
      INSERT INTO editorial_review_draft_events(draft_id,action,actor,details_json)
      VALUES(?,'duplicate',?,json_object('reason','same_bundle_and_renderer'))
    `).bind(Number(sameRenderer.id), actor).run();
    return json({ ok: true, duplicate: true, draft: await draftResponse(env, Number(sameRenderer.id)) });
  }

  const bundle = obj(parseJson(bundleRow.bundle_json, {})) || {};
  const { verified, excluded } = evidenceClaims(bundle);
  if (!verified.length) return json({ ok: false, error: 'no_current_verified_claims' }, 409);
  const expiredIds = arr(bundle.claims).map(obj).filter((claim): claim is Obj => Boolean(claim))
    .filter((claim) => claim.status === 'verified' && dateExpired(obj(claim.verification)?.validUntil))
    .map((claim) => Number(claim.id));
  if (expiredIds.length) return json({ ok: false, error: 'evidence_bundle_stale_re_evaluate', expiredClaimIds: expiredIds }, 409);

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
    VALUES(?,'generation_started',?,json_object('bundleId',?,'version',?,'renderer',?))
  `).bind(draftId, actor, bundleId, version, PROMPT_VERSION).run();

  try {
    const result = await generateVertexJson<Obj>(
      env,
      promptFor(bundle, verified, excluded.map((claim) => Number(claim.id))),
      RESPONSE_SCHEMA,
      { temperature: 0.1, maxOutputTokens: 6000 }
    );
    const normalized = normalizeDraft(result.data, verified);
    if (!normalized) throw new Error('invalid_or_untraceable_draft_output_v2');
    await insertProvenance(env, draftId, normalized);

    const blocks = deterministicWarnings(normalized.blocks, bundle, excluded);
    const usedSet = new Set(normalized.usedClaimIds);
    const sources = sourceLinks(verified, usedSet);
    const brief = obj(bundle.brief) || {};
    const cluster = str(brief.clusterTitle, 180) || 'Guide eSIM';
    const searchIntent = str(brief.searchIntent, 40) || 'informational';
    const title = normalized.title.includes(env.SITE_NAME) ? normalized.title : `${normalized.title} | ${env.SITE_NAME}`;
    const checkedDates = verified.filter((claim) => usedSet.has(Number(claim.id)))
      .map((claim) => str(obj(claim.verification)?.checkedAt, 80)).filter(Boolean).sort();
    const sourceCheckedAt = checkedDates[0] || new Date().toISOString();
    const rules = [
      ...uniqueStrings(bundle.contentRules, 30, 800),
      'I campi title, meta description, h1, direct answer e intro hanno claimIds persistiti.',
      'Il brief originale non è una fonte fattuale e il suo directAnswer non viene passato al renderer v2.'
    ];

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

    await env.DB.prepare(`
      UPDATE editorial_review_drafts SET status='superseded',updated_at=CURRENT_TIMESTAMP
      WHERE evidence_bundle_id=? AND id<>? AND status IN ('review','changes_requested')
    `).bind(bundleId, draftId).run();
    await env.DB.prepare(`
      INSERT INTO editorial_review_draft_events(draft_id,action,actor,details_json)
      VALUES(?,'generated',?,?)
    `).bind(draftId, actor, JSON.stringify({
      renderer: PROMPT_VERSION,
      usedClaimIds: normalized.usedClaimIds,
      fieldClaimIds: normalized.fieldClaimIds,
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
      JSON.stringify({ reason: 'field_grounded_draft_generated', draftId, bundleId, pageSlug, renderer: PROMPT_VERSION })
    ).run();
    return json({ ok: true, duplicate: false, draft: await draftResponse(env, draftId) }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'draft_generation_failed';
    await env.DB.prepare(`
      UPDATE editorial_review_drafts SET status='failed',error_message=?,updated_at=CURRENT_TIMESTAMP WHERE id=?
    `).bind(message.slice(0, 2000), draftId).run();
    await env.DB.prepare(`
      INSERT INTO editorial_review_draft_events(draft_id,action,actor,details_json)
      VALUES(?,'generation_failed',?,?)
    `).bind(draftId, actor, JSON.stringify({ renderer: PROMPT_VERSION, message: message.slice(0, 1000) })).run();
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

async function groundingStatus(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const draftId = Number.parseInt(url.searchParams.get('draftId') || '0', 10) || 0;
  if (draftId <= 0) return json({ ok: false, error: 'draftId_required' }, 400);
  const draft = await draftResponse(env, draftId);
  if (!draft) return json({ ok: false, error: 'editorial_draft_not_found' }, 404);
  return json({ ok: true, draft });
}

export async function groundedEditorialDraftApi(request: Request, env: Env, path: string): Promise<Response> {
  const authError = authorized(request, env);
  if (authError) return authError;
  if (request.method === 'POST' && path === 'api/maintenance/editorial-draft-generate') {
    return generateGroundedDraft(request, env);
  }
  if (request.method === 'GET' && path === 'api/maintenance/editorial-draft-grounding') {
    return groundingStatus(request, env);
  }
  return json({ ok: false, error: 'grounded_editorial_draft_route_not_found' }, 404);
}

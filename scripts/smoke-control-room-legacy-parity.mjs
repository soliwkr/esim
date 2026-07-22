import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const paths = {
  legacy: 'src/control-room-v3.ts',
  snapshotBackend: 'src/control-room.ts',
  worker: 'apps/web/src/worker.ts',
  api: 'apps/web/src/lib/control-room-api.ts',
  app: 'apps/web/src/components/control-room/ControlRoomApp.tsx',
  overview: 'apps/web/src/components/control-room/Overview.tsx',
  radarBriefs: 'apps/web/src/components/control-room/RadarBriefs.tsx',
  claims: 'apps/web/src/components/control-room/ClaimsSources.tsx',
  readiness: 'apps/web/src/components/control-room/ReadinessEvidence.tsx',
  drafts: 'apps/web/src/components/control-room/DraftDecisions.tsx',
  draftDetail: 'apps/web/src/components/control-room/DraftDetailReadonly.tsx',
  queueAudit: 'apps/web/src/components/control-room/QueueAudit.tsx',
  audit: 'docs/CONTROL-ROOM-LEGACY-PARITY-AUDIT.md',
};

const entries = await Promise.all(
  Object.entries(paths).map(async ([key, path]) => [key, await readFile(path, 'utf8')]),
);
const source = Object.fromEntries(entries);

function requireAll(text, tokens, label) {
  for (const token of tokens) {
    assert.ok(text.includes(token), `${label}: token mancante ${token}`);
  }
}

function between(text, start, end) {
  const startIndex = text.indexOf(start);
  assert.notEqual(startIndex, -1, `Sezione iniziale non trovata: ${start}`);
  const endIndex = text.indexOf(end, startIndex + start.length);
  assert.notEqual(endIndex, -1, `Sezione finale non trovata: ${end}`);
  return text.slice(startIndex, endIndex);
}

const legacyOverviewKeys = [
  'sources_total',
  'sources_due',
  'queue_pending',
  'signals_eligible',
  'briefs_proposed',
  'claims_verified',
  'claims_pending',
  'drafts_approved',
  'pages_review',
  'pages_published',
];

requireAll(source.legacy, legacyOverviewKeys, 'Legacy overview');
requireAll(source.api, legacyOverviewKeys, 'Contratto overview nuovo');
requireAll(source.overview, legacyOverviewKeys, 'Vista overview nuova');

requireAll(source.radarBriefs, [
  'brief.id',
  'brief.proposed_title',
  'brief.slug_suggestion',
  'brief.priority_score',
  'brief.status',
  'brief.bundle_id',
  'brief.readiness_score',
  'brief.readiness_status',
  'brief.draft_id',
  'brief.draft_status',
], 'Parità brief');

requireAll(source.claims, [
  'claim.id',
  'claim.brief_id',
  'claim.subject_key',
  'claim.claim_text',
  'claim.status',
  'claim.source_url',
  'claim.source_label',
  'claim.valid_until',
  'claim.task_id',
  'claim.task_status',
], 'Parità claim');

requireAll(source.readiness, [
  'bundle.id',
  'bundle.page_slug',
  'bundle.version',
  'bundle.readiness_score',
  'bundle.review_status',
], 'Parità evidence bundle');

requireAll(source.drafts, [
  'draft.id',
  'draft.page_slug',
  'draft.version',
  'draft.status',
  'draft.prompt_version',
], 'Parità inventario draft');

requireAll(source.queueAudit, [
  'task.id',
  'task.task_type',
  'task.entity_key',
  'task.priority',
  'task.status',
  'task.last_error',
  'event.event_key',
  'event.created_at',
  'event.domain',
  'event.action',
  'event.actor',
  'event.entity',
  'event.draft_id',
  'event.draft_version',
], 'Parità queue e audit');

requireAll(source.draftDetail, [
  'detail.page.content',
  'detail.page.faq',
  'detail.page.sources',
  'detail.fieldClaimIds',
  'detail.materializedPageStatus',
  'detail.usedClaimIds',
  'detail.excludedClaimIds',
  'detail.generationRules',
], 'Dettaglio draft sostitutivo della preview legacy');

assert.ok(source.legacy.includes("sessionStorage.getItem(storageKey)"));
assert.ok(source.legacy.includes('Authorization: `Bearer ${token}`'));
assert.ok(source.worker.includes('requireCloudflareAccess(request, env)'));
assert.ok(source.worker.includes('authorization: `Bearer ${env.MAINTENANCE_TOKEN}`'));
assert.ok((source.worker.match(/request\.method !== 'GET'/g) || []).length >= 2);

const browserSources = [
  source.app,
  source.overview,
  source.radarBriefs,
  source.claims,
  source.readiness,
  source.drafts,
  source.draftDetail,
  source.queueAudit,
  source.api,
].join('\n');

assert.doesNotMatch(browserSources, /sessionStorage|localStorage|Authorization|Bearer/);
assert.doesNotMatch(browserSources, /method\s*:\s*['"`](?:POST|PUT|PATCH|DELETE)['"`]/i);
assert.doesNotMatch(browserSources, /\bD1\b.*prepare\s*\(/i);

assert.ok(source.legacy.includes('/api/maintenance/editorial-draft-preview'));
assert.doesNotMatch(source.worker, /editorial-draft-preview/);
assert.match(source.audit, /futura anteprima visuale del sito deve appartenere al renderer pubblico Astro/);

assert.ok(source.snapshotBackend.includes('q.id AS task_id'));
assert.ok(source.legacy.includes('claim.task_id'));
const claimInterface = between(source.api, 'export interface ControlRoomClaim', 'export interface ControlRoomEvidenceWarning');
const claimParser = between(source.api, 'function parseClaims', 'function parseEvidenceBundles');
assert.match(claimInterface, /\btask_id\s*:/);
assert.match(claimParser, /task_id: requireNullablePositiveInteger/);
assert.match(source.claims, /claim\.task_id/);
assert.match(source.audit, /Gap chiuso: claim → task ID/);
assert.match(source.audit, /fix\/control-room-claim-task-linkage-readonly/);

const auditInterface = between(source.api, 'export interface ControlRoomAuditEvent', 'export interface ControlRoomCapabilities');
const auditParser = between(source.api, 'function parseAudit', 'function parseControlRoomSnapshot');
requireAll(auditInterface, ['event_key:', 'draft_id:', 'draft_version:'], 'Contratto audit canonico');
requireAll(auditParser, [
  'event_key: eventKey',
  'draft_id: draftId',
  'draft_version: draftVersion',
  'domain === "draft"',
], 'Parser audit canonico');
requireAll(source.snapshotBackend, [
  "('draft-event:' || e.id) AS event_key",
  'e.draft_id AS draft_id',
  'd.version AS draft_version',
], 'Query audit canonica');
assert.match(source.queueAudit, /setSelectedAuditKey\(event\.event_key\)/);
assert.doesNotMatch(source.queueAudit, /details.*draftId|draftId.*details/);
assert.match(source.audit, /Gap chiuso: audit → versione draft/);
assert.match(source.audit, /fix\/control-room-audit-draft-version-linkage-readonly/);

requireAll(source.legacy, [
  "name === 'research'",
  "name === 'acceptBrief'",
  "name === 'convertBrief'",
  "name === 'evaluate'",
  "name === 'approveBundle'",
  "name === 'generateDraft'",
  "name === 'approveDraft' || name === 'changesDraft'",
  "name === 'claimResult'",
], 'Mutation legacy inventariate');
assert.match(source.audit, /Mutation legacy escluse/);
assert.match(source.audit, /rimozione della legacy \*\*non è autorizzata\*\*/);

console.log('Control Room legacy parity audit passed.');
console.log('- letture legacy mappate contro la React island');
console.log('- perimetro Access e assenza di credenziali browser verificati staticamente');
console.log('- claim task_id e audit draft linkage conservati senza euristiche client');
console.log('- mutation legacy inventariate e ancora escluse');

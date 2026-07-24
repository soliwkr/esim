import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

const temporaryDirectory = await mkdtemp(path.join(tmpdir(), 'senza-roaming-catalog-pilot-'));
const policyPath = path.join(temporaryDirectory, 'public-route-policy.mjs');
const pilotPath = path.join(temporaryDirectory, 'public-catalog-pilot.mjs');
const now = new Date('2026-07-24T12:00:00.000Z');

function compile(source, fileName) {
  const result = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
      strict: true,
    },
    fileName,
    reportDiagnostics: true,
  });
  const errors = (result.diagnostics || []).filter(
    (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error,
  );
  assert.deepEqual(
    errors.map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')),
    [],
    `${fileName} must transpile without diagnostics.`,
  );
  return result.outputText;
}

function validCandidate(id, overrides = {}) {
  const slug = overrides.slug || `pilot-page-${id}`;
  const pageType = overrides.pageType || 'guide';
  const assetType = pageType === 'provider' ? 'provider_review' : pageType;
  const keyword = overrides.primaryKeyword || `keyword pilot ${id}`;
  const directAnswer = overrides.directAnswer || `Risposta diretta distinta per la pagina pilot numero ${id}.`;
  const sourceUrl = `https://provider.example/source-${id}`;
  const claimId = 1000 + id;
  const bundleId = 2000 + id;
  const draftId = 3000 + id;
  const common = {
    title: `Titolo pilot ${id}`,
    metaDescription: `Descrizione pilot ${id}`,
    eyebrow: 'Pilot verificato',
    h1: `H1 pilot ${id}`,
    directAnswer,
    intro: `Introduzione pilot ${id}`,
    content: [{ type: 'heading', text: `Sezione ${id}` }, { type: 'paragraph', text: `Contenuto ${id}` }],
    faq: [{ question: `Domanda ${id}?`, answer: `Risposta ${id}.` }],
    sources: [{ label: `Fonte ${id}`, url: sourceUrl }],
    primaryKeyword: keyword,
  };
  return {
    brief: {
      id,
      status: 'converted',
      slugSuggestion: slug,
      assetType,
      searchIntent: overrides.searchIntent || `intent-${id}`,
      priorityScore: overrides.priorityScore ?? 100 - id,
    },
    bundle: {
      id: bundleId,
      briefId: id,
      pageSlug: slug,
      version: 1,
      bundleKey: `bundle-${id}`,
      publicationEligible: true,
      readyForPublication: true,
      reviewStatus: 'approved_for_publication',
      verifiedCount: 1,
      insufficientCount: 0,
      contradictedCount: 0,
      pendingCount: 0,
      expiredCount: 0,
      conflictCount: 0,
      blockers: [],
      warnings: [],
      reviewedAt: '2026-07-20T10:00:00Z',
      updatedAt: '2026-07-20T10:00:00Z',
    },
    draft: {
      id: draftId,
      evidenceBundleId: bundleId,
      version: 1,
      pageSlug: slug,
      pageType,
      promptVersion: 'editorial-page-draft-v2',
      status: 'approved',
      ...common,
      usedClaimIds: [claimId],
      excludedClaimIds: [],
      reviewedAt: '2026-07-21T10:00:00Z',
      updatedAt: '2026-07-21T10:00:00Z',
    },
    provenance: [
      'title', 'meta_description', 'h1', 'direct_answer', 'intro', 'section', 'faq',
    ].map((fieldName, index) => ({
      draftId,
      fieldName,
      fieldKey: fieldName === 'section' || fieldName === 'faq' ? String(index) : '',
      claimId,
    })),
    page: {
      slug,
      pageType,
      ...common,
      searchIntent: overrides.searchIntent || `intent-${id}`,
      status: 'review',
      featured: false,
      sourceCheckedAt: '2026-07-19T10:00:00Z',
      publishedAt: null,
      updatedAt: '2026-07-21T10:00:00Z',
    },
    claim: {
      id: claimId,
      briefId: id,
      atomic: true,
      status: 'verified',
      sourceId: 4000 + id,
      verificationId: 5000 + id,
      sourceUrl,
      sourceStatus: 'active',
      verificationStatus: 'verified',
      validUntil: '2027-07-24T12:00:00Z',
    },
  };
}

function snapshotFromCandidates(candidates) {
  return {
    briefs: candidates.map((candidate) => candidate.brief),
    bundles: candidates.flatMap((candidate) => candidate.bundle ? [candidate.bundle] : []),
    drafts: candidates.flatMap((candidate) => candidate.draft ? [candidate.draft] : []),
    provenance: candidates.flatMap((candidate) => candidate.provenance || []),
    pages: candidates.flatMap((candidate) => candidate.page ? [candidate.page] : []),
    claims: candidates.flatMap((candidate) => candidate.claim ? [candidate.claim] : []),
  };
}

function blockerCodes(candidate) {
  return candidate.blockers.map((blocker) => blocker.code);
}

try {
  const [policySource, pilotSource] = await Promise.all([
    readFile('src/public-route-policy.ts', 'utf8'),
    readFile('src/public-catalog-pilot.ts', 'utf8'),
  ]);
  await writeFile(policyPath, compile(policySource, 'src/public-route-policy.ts'), 'utf8');
  const compiledPilot = compile(pilotSource, 'src/public-catalog-pilot.ts')
    .replace("from './public-route-policy';", "from './public-route-policy.mjs';");
  await writeFile(pilotPath, compiledPilot, 'utf8');
  const pilot = await import(`${pathToFileURL(pilotPath).href}?v=${Date.now()}`);

  const {
    PUBLIC_CATALOG_PILOT_MAX_ENTRIES,
    auditPublicCatalogPilot,
    createPublicCatalogPilotManifest,
    loadPublicCatalogPilotSnapshot,
    validatePublicCatalogPilotManifest,
  } = pilot;

  assert.equal(PUBLIC_CATALOG_PILOT_MAX_ENTRIES, 4);

  const emptyReport = auditPublicCatalogPilot(snapshotFromCandidates([]), now);
  assert.equal(emptyReport.candidateCount, 0);
  assert.equal(emptyReport.selectedCount, 0);
  const emptyManifest = JSON.parse(await readFile('data/public-catalog-pilot.json', 'utf8'));
  assert.deepEqual(emptyManifest, { schemaVersion: 1, generatedAt: null, entries: [] });
  assert.equal(validatePublicCatalogPilotManifest(emptyManifest, emptyReport).valid, true);

  const valid = validCandidate(1, { slug: 'esim-giappone', pageType: 'destination', primaryKeyword: 'esim giappone' });
  const validReport = auditPublicCatalogPilot(snapshotFromCandidates([valid]), now);
  assert.equal(validReport.selectedCount, 1);
  assert.equal(validReport.excludedCount, 0);
  assert.equal(validReport.selected[0].slug, 'esim-giappone');
  assert.equal(Object.isFrozen(validReport), true);
  assert.equal(Object.isFrozen(validReport.selected), true);

  const manifest = createPublicCatalogPilotManifest(validReport);
  assert.equal(manifest.entries.length, 1);
  assert.equal(manifest.entries[0].pageStatus, 'review');
  assert.equal(manifest.entries[0].publicationEligible, true);
  assert.equal(validatePublicCatalogPilotManifest(manifest, validReport).valid, true);

  const gateNegative = validCandidate(2);
  gateNegative.bundle.publicationEligible = false;
  gateNegative.bundle.readyForPublication = false;
  gateNegative.bundle.reviewStatus = 'approved_for_draft';
  gateNegative.bundle.insufficientCount = 1;
  const gateReport = auditPublicCatalogPilot(snapshotFromCandidates([gateNegative]), now);
  assert.equal(gateReport.selectedCount, 0);
  assert.deepEqual(
    new Set(blockerCodes(gateReport.excluded[0])),
    new Set([
      'publication_not_eligible',
      'bundle_not_approved_for_publication',
      'bundle_not_ready_for_publication',
      'insufficient_claims',
    ]),
  );

  const stale = validCandidate(3);
  stale.claim.validUntil = '2026-07-23T12:00:00Z';
  const staleReport = auditPublicCatalogPilot(snapshotFromCandidates([stale]), now);
  assert.ok(blockerCodes(staleReport.excluded[0]).includes('claim_expired_or_unbounded'));

  const latestDraftNotApproved = validCandidate(4);
  const newerDraft = {
    ...latestDraftNotApproved.draft,
    id: 3999,
    version: 2,
    status: 'review',
    reviewedAt: null,
  };
  const latestSnapshot = snapshotFromCandidates([latestDraftNotApproved]);
  latestSnapshot.drafts.push(newerDraft);
  const latestReport = auditPublicCatalogPilot(latestSnapshot, now);
  assert.ok(blockerCodes(latestReport.excluded[0]).includes('latest_draft_not_approved'));

  const drift = validCandidate(5);
  drift.page.h1 = 'H1 divergente';
  const driftReport = auditPublicCatalogPilot(snapshotFromCandidates([drift]), now);
  assert.ok(blockerCodes(driftReport.excluded[0]).includes('draft_page_scalar_drift'));

  const reserved = validCandidate(6, { slug: 'robots.txt' });
  reserved.bundle.pageSlug = 'robots.txt';
  reserved.draft.pageSlug = 'robots.txt';
  reserved.page.slug = 'robots.txt';
  const reservedReport = auditPublicCatalogPilot(snapshotFromCandidates([reserved]), now);
  assert.ok(blockerCodes(reservedReport.excluded[0]).includes('invalid_or_reserved_slug'));

  const duplicateA = validCandidate(7, { primaryKeyword: 'eSIM Europa' });
  const duplicateB = validCandidate(8, { primaryKeyword: 'esim-europa' });
  const duplicateReport = auditPublicCatalogPilot(snapshotFromCandidates([duplicateA, duplicateB]), now);
  assert.equal(duplicateReport.selectedCount, 0);
  assert.ok(duplicateReport.excluded.every((candidate) => blockerCodes(candidate).includes('duplicate_primary_keyword')));

  const five = [1, 2, 3, 4, 5].map((index) => validCandidate(20 + index, { priorityScore: 100 - index }));
  const capReport = auditPublicCatalogPilot(snapshotFromCandidates(five), now);
  assert.equal(capReport.selectedCount, 4);
  assert.equal(capReport.excludedCount, 1);
  assert.ok(blockerCodes(capReport.excluded[0]).includes('pilot_capacity_exceeded'));

  const invalidManifest = structuredClone(manifest);
  invalidManifest.entries[0].pageStatus = 'published';
  invalidManifest.entries[0].sourceUrls = ['http://insecure.example'];
  invalidManifest.entries[0].notes = 'maintenance_token=secret';
  invalidManifest.entries.push(...Array.from({ length: 4 }, (_, index) => ({
    ...structuredClone(manifest.entries[0]),
    slug: `extra-${index}`,
    primaryKeyword: `extra keyword ${index}`,
    briefId: 100 + index,
    bundleId: 200 + index,
    draftId: 300 + index,
  })));
  const invalidManifestResult = validatePublicCatalogPilotManifest(invalidManifest, validReport);
  assert.equal(invalidManifestResult.valid, false);
  const invalidCodes = new Set(invalidManifestResult.errors.map((error) => error.code));
  for (const code of [
    'manifest_capacity_exceeded',
    'manifest_page_status_invalid',
    'manifest_source_urls_invalid',
    'manifest_secret_like_data',
    'manifest_candidate_drift',
    'manifest_candidate_not_selected',
  ]) assert.ok(invalidCodes.has(code), `Missing manifest validation error ${code}`);

  const queryRows = {
    editorial_briefs: [{ id: 1, status: 'converted', slug_suggestion: 'loaded-page', asset_type: 'guide', search_intent: 'informational', priority_score: 80 }],
    page_evidence_bundles: [],
    editorial_review_drafts: [],
    editorial_review_draft_field_claims: [],
    pages: [],
    editorial_claim_candidates: [],
  };
  const seenSql = [];
  const fakeDatabase = {
    prepare(sql) {
      seenSql.push(sql);
      assert.doesNotMatch(sql, /\b(?:INSERT|UPDATE|DELETE|REPLACE|DROP|ALTER|CREATE)\b/i);
      const key = Object.keys(queryRows).find((table) => sql.includes(`FROM ${table}`));
      assert.ok(key, `Unexpected read-only query: ${sql}`);
      return {
        async all() {
          return { results: queryRows[key] };
        },
      };
    },
  };
  const loaded = await loadPublicCatalogPilotSnapshot(fakeDatabase);
  assert.equal(seenSql.length, 6);
  assert.equal(loaded.briefs[0].slugSuggestion, 'loaded-page');
  assert.equal(loaded.bundles.length, 0);
  const loadedReport = auditPublicCatalogPilot(loaded, now);
  assert.ok(blockerCodes(loadedReport.excluded[0]).includes('evidence_bundle_missing'));

  const source = await readFile('src/public-catalog-pilot.ts', 'utf8');
  assert.doesNotMatch(source, /\.(?:run|batch)\s*\(/);
  assert.doesNotMatch(source, /\b(?:INSERT|UPDATE|DELETE|REPLACE)\s+(?:INTO|FROM|pages|page_)/i);
  assert.doesNotMatch(source, /review\s*[-=]>\s*published/i);

  console.log('Public catalog pilot foundation smoke passed: audit is read-only, deterministic, capped and publication-safe.');
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}

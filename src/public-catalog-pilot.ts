import {
  looksLikePublicFileProbe,
  publicArticleSlugCandidate,
} from './public-route-policy';

export const PUBLIC_CATALOG_PILOT_SCHEMA_VERSION = 1 as const;
export const PUBLIC_CATALOG_PILOT_MAX_ENTRIES = 4 as const;
export const PUBLIC_CATALOG_PILOT_GROUNDED_RENDERER = 'editorial-page-draft-v2' as const;

export type PublicCatalogPageType = 'destination' | 'guide' | 'comparison' | 'provider';
export type PublicCatalogCandidateStatus = 'eligible' | 'excluded';

export type PublicCatalogBriefRecord = {
  id: number;
  status: string;
  slugSuggestion: string;
  assetType: string;
  searchIntent: string;
  priorityScore: number;
};

export type PublicCatalogBundleRecord = {
  id: number;
  briefId: number;
  pageSlug: string;
  version: number;
  bundleKey: string;
  publicationEligible: boolean;
  readyForPublication: boolean;
  reviewStatus: string;
  verifiedCount: number;
  insufficientCount: number;
  contradictedCount: number;
  pendingCount: number;
  expiredCount: number;
  conflictCount: number;
  blockers: unknown[];
  warnings: unknown[];
  reviewedAt: string | null;
  updatedAt: string;
};

export type PublicCatalogDraftRecord = {
  id: number;
  evidenceBundleId: number;
  version: number;
  pageSlug: string;
  pageType: PublicCatalogPageType;
  promptVersion: string;
  status: string;
  title: string;
  metaDescription: string;
  eyebrow: string;
  h1: string;
  directAnswer: string;
  intro: string;
  content: unknown[];
  faq: unknown[];
  sources: Array<{ label: string; url: string }>;
  primaryKeyword: string;
  usedClaimIds: number[];
  excludedClaimIds: number[];
  reviewedAt: string | null;
  updatedAt: string;
};

export type PublicCatalogProvenanceRecord = {
  draftId: number;
  fieldName: 'title' | 'meta_description' | 'h1' | 'direct_answer' | 'intro' | 'section' | 'faq';
  fieldKey: string;
  claimId: number;
};

export type PublicCatalogPageRecord = {
  slug: string;
  pageType: PublicCatalogPageType;
  title: string;
  metaDescription: string;
  eyebrow: string;
  h1: string;
  directAnswer: string;
  intro: string;
  content: unknown[];
  faq: unknown[];
  sources: Array<{ label: string; url: string }>;
  primaryKeyword: string;
  searchIntent: string;
  status: string;
  featured: boolean;
  sourceCheckedAt: string | null;
  publishedAt: string | null;
  updatedAt: string;
};

export type PublicCatalogClaimRecord = {
  id: number;
  briefId: number;
  atomic: boolean;
  status: string;
  sourceId: number | null;
  verificationId: number | null;
  sourceUrl: string | null;
  sourceStatus: string | null;
  verificationStatus: string | null;
  validUntil: string | null;
};

export type PublicCatalogPilotSnapshot = {
  briefs: PublicCatalogBriefRecord[];
  bundles: PublicCatalogBundleRecord[];
  drafts: PublicCatalogDraftRecord[];
  provenance: PublicCatalogProvenanceRecord[];
  pages: PublicCatalogPageRecord[];
  claims: PublicCatalogClaimRecord[];
};

export type PublicCatalogPilotIssue = {
  code: string;
  message: string;
  details?: Readonly<Record<string, unknown>>;
};

export type PublicCatalogPilotCandidate = {
  status: PublicCatalogCandidateStatus;
  slug: string;
  pageType: PublicCatalogPageType | null;
  primaryIntent: string;
  primaryKeyword: string;
  priorityScore: number;
  briefId: number;
  bundleId: number | null;
  bundleVersion: number | null;
  draftId: number | null;
  draftVersion: number | null;
  pageStatus: string | null;
  publicationEligible: boolean;
  readyForPublication: boolean;
  reviewedAt: string | null;
  sourceCheckedAt: string | null;
  claimIds: readonly number[];
  sourceUrls: readonly string[];
  blockers: readonly PublicCatalogPilotIssue[];
  warnings: readonly PublicCatalogPilotIssue[];
};

export type PublicCatalogPilotReport = {
  schemaVersion: typeof PUBLIC_CATALOG_PILOT_SCHEMA_VERSION;
  generatedAt: string;
  candidateCount: number;
  eligibleCount: number;
  selectedCount: number;
  excludedCount: number;
  selected: readonly PublicCatalogPilotCandidate[];
  excluded: readonly PublicCatalogPilotCandidate[];
  candidates: readonly PublicCatalogPilotCandidate[];
};

export type PublicCatalogPilotManifestEntry = {
  slug: string;
  pageType: PublicCatalogPageType;
  primaryIntent: string;
  primaryKeyword: string;
  briefId: number;
  bundleId: number;
  bundleVersion: number;
  draftId: number;
  draftVersion: number;
  pageStatus: 'review';
  publicationEligible: true;
  readyForPublication: true;
  reviewedAt: string;
  sourceCheckedAt: string;
  claimIds: number[];
  sourceUrls: string[];
  notes: string;
};

export type PublicCatalogPilotManifest = {
  schemaVersion: typeof PUBLIC_CATALOG_PILOT_SCHEMA_VERSION;
  generatedAt: string | null;
  entries: PublicCatalogPilotManifestEntry[];
};

export type PublicCatalogPilotManifestValidation = {
  valid: boolean;
  errors: readonly PublicCatalogPilotIssue[];
};

type QueryResult<T> = { results: T[] };
type PreparedQuery = { all<T>(): Promise<QueryResult<T>> };
export type PublicCatalogPilotDatabase = { prepare(sql: string): PreparedQuery };

type RawRecord = Record<string, unknown>;

const TOP_LEVEL_PROVENANCE = Object.freeze([
  'title',
  'meta_description',
  'h1',
  'direct_answer',
  'intro',
] as const);

const SECRET_PATTERN = /(?:api[_-]?key|access[_-]?token|maintenance[_-]?token|private[_-]?key|client[_-]?secret|authorization|bearer\s+[a-z0-9._-]+)/i;

function issue(code: string, message: string, details?: Record<string, unknown>): PublicCatalogPilotIssue {
  return Object.freeze({ code, message, ...(details ? { details: Object.freeze(details) } : {}) });
}

function finiteInteger(value: unknown): number {
  const number = Number(value);
  return Number.isInteger(number) ? number : 0;
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function nullableText(value: unknown): string | null {
  const valueText = text(value);
  return valueText || null;
}

function flag(value: unknown): boolean {
  return value === true || Number(value) === 1;
}

function parseJson(value: unknown, fallback: unknown): unknown {
  if (typeof value !== 'string') return value ?? fallback;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return fallback;
  }
}

function array(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function integerArray(value: unknown): number[] {
  return [...new Set(array(parseJson(value, [])).map(finiteInteger).filter((item) => item > 0))].sort((a, b) => a - b);
}

function sourceArray(value: unknown): Array<{ label: string; url: string }> {
  const sources: Array<{ label: string; url: string }> = [];
  for (const raw of array(parseJson(value, []))) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) continue;
    const record = raw as RawRecord;
    const label = text(record.label);
    const url = text(record.url);
    if (label && url) sources.push({ label, url });
  }
  return sources;
}

function validIso(value: string | null): boolean {
  return Boolean(value && Number.isFinite(Date.parse(value)));
}

function currentUntil(value: string | null, nowMs: number): boolean {
  if (!value) return false;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && parsed > nowMs;
}

function normalizedIntent(value: string): string {
  return value.toLocaleLowerCase('it').replace(/[^a-z0-9]+/g, ' ').trim();
}

function jsonComparable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(jsonComparable).join(',')}]`;
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${jsonComparable(record[key])}`).join(',')}}`;
  }
  return JSON.stringify(value ?? null);
}

function sameJson(left: unknown, right: unknown): boolean {
  return jsonComparable(left) === jsonComparable(right);
}

function pageTypeFromAsset(assetType: string): PublicCatalogPageType {
  if (assetType === 'destination') return 'destination';
  if (assetType === 'comparison') return 'comparison';
  if (assetType === 'provider_review' || assetType === 'provider') return 'provider';
  return 'guide';
}

function freezeCandidate(candidate: PublicCatalogPilotCandidate): PublicCatalogPilotCandidate {
  return Object.freeze({
    ...candidate,
    claimIds: Object.freeze([...candidate.claimIds]),
    sourceUrls: Object.freeze([...candidate.sourceUrls]),
    blockers: Object.freeze([...candidate.blockers]),
    warnings: Object.freeze([...candidate.warnings]),
  });
}

function latestByVersion<T extends { version: number }>(records: T[]): T | null {
  return [...records].sort((left, right) => right.version - left.version)[0] ?? null;
}

function candidateForBrief(
  snapshot: PublicCatalogPilotSnapshot,
  brief: PublicCatalogBriefRecord,
  nowMs: number,
): PublicCatalogPilotCandidate {
  const blockers: PublicCatalogPilotIssue[] = [];
  const warnings: PublicCatalogPilotIssue[] = [];
  const bundles = snapshot.bundles.filter((bundle) => bundle.briefId === brief.id);
  const bundle = latestByVersion(bundles);
  const expectedType = pageTypeFromAsset(brief.assetType);
  const briefSlug = brief.slugSuggestion;

  if (!briefSlug) {
    blockers.push(issue('brief_slug_missing', 'Il brief non possiede uno slug candidato.'));
  } else if (publicArticleSlugCandidate(`/${briefSlug}`) !== briefSlug || looksLikePublicFileProbe(briefSlug)) {
    blockers.push(issue('invalid_or_reserved_slug', 'Lo slug collide con una route riservata o non è un article slug valido.', { slug: briefSlug }));
  }
  if (!['accepted', 'converted'].includes(brief.status)) {
    blockers.push(issue('brief_not_accepted', 'Il brief deve essere accepted o converted.', { status: brief.status }));
  }
  if (!brief.searchIntent) blockers.push(issue('search_intent_missing', 'Il brief non dichiara il search intent.'));

  if (!bundle) {
    blockers.push(issue('evidence_bundle_missing', 'Non esiste un evidence bundle per il brief.'));
  }

  let draft: PublicCatalogDraftRecord | null = null;
  let page: PublicCatalogPageRecord | null = null;
  let claimIds: number[] = [];
  let sourceUrls: string[] = [];
  let primaryKeyword = '';

  if (bundle) {
    if (bundle.pageSlug !== briefSlug) {
      blockers.push(issue('bundle_slug_mismatch', 'Lo slug del bundle non coincide con il brief.', {
        briefSlug,
        bundleSlug: bundle.pageSlug,
      }));
    }
    if (bundle.reviewStatus === 'superseded') blockers.push(issue('bundle_superseded', 'L’ultima versione del bundle è superseded.'));
    if (!bundle.publicationEligible) blockers.push(issue('publication_not_eligible', 'Il gate deterministico di pubblicazione è negativo.'));
    if (bundle.reviewStatus !== 'approved_for_publication') {
      blockers.push(issue('bundle_not_approved_for_publication', 'Il bundle non è approvato umanamente per la pubblicazione.', {
        reviewStatus: bundle.reviewStatus,
      }));
    }
    if (!bundle.readyForPublication) blockers.push(issue('bundle_not_ready_for_publication', 'ready_for_publication non è attivo.'));
    if (bundle.blockers.length) blockers.push(issue('bundle_has_blockers', 'Il bundle contiene blocker persistiti.', { count: bundle.blockers.length }));
    for (const [code, count] of [
      ['insufficient_claims', bundle.insufficientCount],
      ['contradicted_claims', bundle.contradictedCount],
      ['pending_claims', bundle.pendingCount],
      ['expired_claims', bundle.expiredCount],
      ['source_conflicts', bundle.conflictCount],
    ] as const) {
      if (count > 0) blockers.push(issue(code, `Il bundle contiene ${count} elemento/i bloccante/i.`, { count }));
    }
    if (bundle.verifiedCount <= 0) blockers.push(issue('verified_claims_missing', 'Il bundle non contiene claim verificati.'));
    if (!validIso(bundle.reviewedAt)) blockers.push(issue('bundle_review_timestamp_missing', 'Il bundle approvato non possiede un reviewed_at valido.'));
    if (bundle.warnings.length) warnings.push(issue('bundle_warnings', 'Il bundle contiene warning non bloccanti.', { count: bundle.warnings.length }));

    draft = latestByVersion(snapshot.drafts.filter((item) => item.evidenceBundleId === bundle.id));
    if (!draft) {
      blockers.push(issue('draft_missing', 'Non esiste un draft per l’ultima versione del bundle.'));
    } else {
      if (draft.status !== 'approved') blockers.push(issue('latest_draft_not_approved', 'L’ultima versione del draft non è approved.', { status: draft.status }));
      if (draft.promptVersion !== PUBLIC_CATALOG_PILOT_GROUNDED_RENDERER) {
        blockers.push(issue('draft_renderer_not_grounded', 'Il draft non usa il renderer grounded autorizzato.', { promptVersion: draft.promptVersion }));
      }
      if (draft.pageSlug !== briefSlug || draft.pageSlug !== bundle.pageSlug) {
        blockers.push(issue('draft_slug_mismatch', 'Lo slug del draft non coincide con brief e bundle.', { draftSlug: draft.pageSlug }));
      }
      if (draft.pageType !== expectedType) {
        blockers.push(issue('draft_page_type_mismatch', 'Il page type del draft non coincide con l’asset type del brief.', {
          expectedType,
          draftType: draft.pageType,
        }));
      }
      if (!validIso(draft.reviewedAt)) blockers.push(issue('draft_review_timestamp_missing', 'Il draft approved non possiede un reviewed_at valido.'));
      if (!draft.primaryKeyword) blockers.push(issue('primary_keyword_missing', 'Il draft non dichiara una primary keyword.'));
      primaryKeyword = draft.primaryKeyword;
      claimIds = [...draft.usedClaimIds];
      if (!claimIds.length) blockers.push(issue('used_claims_missing', 'Il draft non dichiara claim usati.'));
      const excluded = new Set(draft.excludedClaimIds);
      const overlap = claimIds.filter((claimId) => excluded.has(claimId));
      if (overlap.length) blockers.push(issue('excluded_claim_used', 'Il draft usa claim presenti anche tra gli esclusi.', { claimIds: overlap }));

      const provenance = snapshot.provenance.filter((mapping) => mapping.draftId === draft?.id);
      for (const fieldName of TOP_LEVEL_PROVENANCE) {
        if (!provenance.some((mapping) => mapping.fieldName === fieldName)) {
          blockers.push(issue('top_level_provenance_missing', 'Manca provenance per un campo principale.', { fieldName }));
        }
      }
      if (!provenance.some((mapping) => mapping.fieldName === 'section')) {
        blockers.push(issue('section_provenance_missing', 'Manca provenance per le sezioni del draft.'));
      }
      if (!provenance.some((mapping) => mapping.fieldName === 'faq')) {
        blockers.push(issue('faq_provenance_missing', 'Manca provenance per le FAQ del draft.'));
      }
      const provenanceIds = new Set(provenance.map((mapping) => mapping.claimId));
      const unmappedClaims = claimIds.filter((claimId) => !provenanceIds.has(claimId));
      if (unmappedClaims.length) blockers.push(issue('used_claim_provenance_missing', 'Alcuni claim usati non hanno provenance persistita.', { claimIds: unmappedClaims }));
      const unexpectedMappings = [...provenanceIds].filter((claimId) => !claimIds.includes(claimId));
      if (unexpectedMappings.length) blockers.push(issue('provenance_claim_not_used', 'La provenance contiene claim non dichiarati tra quelli usati.', { claimIds: unexpectedMappings }));

      const claims = claimIds.map((claimId) => snapshot.claims.find((claim) => claim.id === claimId) ?? null);
      claims.forEach((claim, index) => {
        const claimId = claimIds[index];
        if (!claim) {
          blockers.push(issue('claim_missing', 'Un claim usato dal draft non esiste nello snapshot.', { claimId }));
          return;
        }
        if (claim.briefId !== brief.id) blockers.push(issue('claim_brief_mismatch', 'Un claim usato appartiene a un altro brief.', { claimId }));
        if (!claim.atomic || claim.status !== 'verified') blockers.push(issue('claim_not_verified_atomic', 'Un claim usato non è atomic e verified.', { claimId }));
        if (!claim.sourceId || !claim.verificationId) blockers.push(issue('claim_linkage_incomplete', 'Un claim usato non ha source o verification canoniche.', { claimId }));
        if (!claim.sourceUrl?.startsWith('https://')) blockers.push(issue('claim_source_not_https', 'La fonte di un claim usato non è HTTPS.', { claimId }));
        if (claim.sourceStatus !== 'active') blockers.push(issue('claim_source_inactive', 'La fonte di un claim usato non è attiva.', { claimId, sourceStatus: claim.sourceStatus }));
        if (claim.verificationStatus !== 'verified') blockers.push(issue('claim_verification_not_verified', 'La verifica canonica del claim non è verified.', { claimId }));
        if (!currentUntil(claim.validUntil, nowMs)) blockers.push(issue('claim_expired_or_unbounded', 'La verifica del claim è scaduta o non possiede valid_until.', { claimId, validUntil: claim.validUntil }));
      });
      sourceUrls = [...new Set(draft.sources.map((source) => source.url))].sort();
      if (!sourceUrls.length) blockers.push(issue('draft_sources_missing', 'Il draft non espone fonti.'));
      if (sourceUrls.some((url) => !url.startsWith('https://'))) blockers.push(issue('draft_source_not_https', 'Il draft contiene una fonte non HTTPS.'));
    }

    page = snapshot.pages.find((item) => item.slug === briefSlug) ?? null;
    if (!page) {
      blockers.push(issue('materialized_page_missing', 'Non esiste una pagina materializzata per lo slug.'));
    } else {
      if (page.status !== 'review') blockers.push(issue('page_not_review', 'La release candidate deve restare in review.', { status: page.status }));
      if (page.publishedAt !== null) blockers.push(issue('review_page_has_published_at', 'Una pagina review non può avere published_at valorizzato.'));
      if (page.featured) blockers.push(issue('review_page_featured', 'La pagina review non può essere featured durante la foundation.'));
      if (page.pageType !== expectedType) blockers.push(issue('page_type_mismatch', 'Il page type materializzato non coincide con il brief.', { expectedType, pageType: page.pageType }));
      if (!validIso(page.sourceCheckedAt)) blockers.push(issue('source_checked_at_missing', 'La pagina non possiede source_checked_at valido.'));
      if (draft) {
        const scalarPairs: Array<[string, string, string]> = [
          ['title', page.title, draft.title],
          ['meta_description', page.metaDescription, draft.metaDescription],
          ['eyebrow', page.eyebrow, draft.eyebrow],
          ['h1', page.h1, draft.h1],
          ['direct_answer', page.directAnswer, draft.directAnswer],
          ['intro', page.intro, draft.intro],
          ['primary_keyword', page.primaryKeyword, draft.primaryKeyword],
        ];
        for (const [fieldName, pageValue, draftValue] of scalarPairs) {
          if (pageValue !== draftValue) blockers.push(issue('draft_page_scalar_drift', 'La pagina materializzata diverge dal draft approvato.', { fieldName }));
        }
        if (!sameJson(page.content, draft.content)) blockers.push(issue('draft_page_content_drift', 'Il contenuto materializzato diverge dal draft approvato.'));
        if (!sameJson(page.faq, draft.faq)) blockers.push(issue('draft_page_faq_drift', 'Le FAQ materializzate divergono dal draft approvato.'));
        if (!sameJson(page.sources, draft.sources)) blockers.push(issue('draft_page_source_drift', 'Le fonti materializzate divergono dal draft approvato.'));
      }
      if (page.searchIntent !== brief.searchIntent) blockers.push(issue('page_intent_mismatch', 'Il search intent della pagina non coincide con il brief.'));
    }
  }

  return freezeCandidate({
    status: blockers.length ? 'excluded' : 'eligible',
    slug: briefSlug,
    pageType: expectedType,
    primaryIntent: brief.searchIntent,
    primaryKeyword,
    priorityScore: brief.priorityScore,
    briefId: brief.id,
    bundleId: bundle?.id ?? null,
    bundleVersion: bundle?.version ?? null,
    draftId: draft?.id ?? null,
    draftVersion: draft?.version ?? null,
    pageStatus: page?.status ?? null,
    publicationEligible: bundle?.publicationEligible ?? false,
    readyForPublication: bundle?.readyForPublication ?? false,
    reviewedAt: draft?.reviewedAt ?? bundle?.reviewedAt ?? null,
    sourceCheckedAt: page?.sourceCheckedAt ?? null,
    claimIds,
    sourceUrls,
    blockers,
    warnings,
  });
}

function appendBlocker(candidate: PublicCatalogPilotCandidate, blocker: PublicCatalogPilotIssue): PublicCatalogPilotCandidate {
  return freezeCandidate({
    ...candidate,
    status: 'excluded',
    blockers: [...candidate.blockers, blocker],
  });
}

export function auditPublicCatalogPilot(
  snapshot: PublicCatalogPilotSnapshot,
  now: Date = new Date(),
): PublicCatalogPilotReport {
  const nowMs = now.getTime();
  if (!Number.isFinite(nowMs)) throw new Error('public_catalog_pilot_invalid_now');

  let candidates = snapshot.briefs
    .map((brief) => candidateForBrief(snapshot, brief, nowMs))
    .sort((left, right) => right.priorityScore - left.priorityScore || left.slug.localeCompare(right.slug, 'it'));

  const keywordGroups = new Map<string, PublicCatalogPilotCandidate[]>();
  const answerGroups = new Map<string, PublicCatalogPilotCandidate[]>();
  for (const candidate of candidates.filter((item) => item.status === 'eligible')) {
    const keywordKey = normalizedIntent(candidate.primaryKeyword);
    if (keywordKey) keywordGroups.set(keywordKey, [...(keywordGroups.get(keywordKey) ?? []), candidate]);
    const draft = snapshot.drafts.find((item) => item.id === candidate.draftId);
    const answerKey = normalizedIntent(draft?.directAnswer ?? '');
    if (answerKey) answerGroups.set(answerKey, [...(answerGroups.get(answerKey) ?? []), candidate]);
  }

  const duplicateKeywordSlugs = new Set(
    [...keywordGroups.values()].filter((group) => group.length > 1).flatMap((group) => group.map((candidate) => candidate.slug)),
  );
  const duplicateAnswerSlugs = new Set(
    [...answerGroups.values()].filter((group) => group.length > 1).flatMap((group) => group.map((candidate) => candidate.slug)),
  );
  candidates = candidates.map((candidate) => {
    let next = candidate;
    if (duplicateKeywordSlugs.has(candidate.slug)) {
      next = appendBlocker(next, issue('duplicate_primary_keyword', 'La primary keyword collide con un’altra candidate del pilot.'));
    }
    if (duplicateAnswerSlugs.has(candidate.slug)) {
      next = appendBlocker(next, issue('duplicate_direct_answer', 'La risposta diretta coincide sostanzialmente con un’altra candidate.'));
    }
    return next;
  });

  let eligibleSeen = 0;
  candidates = candidates.map((candidate) => {
    if (candidate.status !== 'eligible') return candidate;
    eligibleSeen += 1;
    if (eligibleSeen <= PUBLIC_CATALOG_PILOT_MAX_ENTRIES) return candidate;
    return appendBlocker(candidate, issue('pilot_capacity_exceeded', 'La candidate supera il cap massimo di quattro release candidate.', {
      maxEntries: PUBLIC_CATALOG_PILOT_MAX_ENTRIES,
    }));
  });

  const selected = candidates.filter((candidate) => candidate.status === 'eligible');
  const excluded = candidates.filter((candidate) => candidate.status === 'excluded');
  const frozenCandidates = Object.freeze([...candidates]);
  return Object.freeze({
    schemaVersion: PUBLIC_CATALOG_PILOT_SCHEMA_VERSION,
    generatedAt: now.toISOString(),
    candidateCount: candidates.length,
    eligibleCount: selected.length,
    selectedCount: selected.length,
    excludedCount: excluded.length,
    selected: Object.freeze([...selected]),
    excluded: Object.freeze([...excluded]),
    candidates: frozenCandidates,
  });
}

export function createPublicCatalogPilotManifest(
  report: PublicCatalogPilotReport,
  generatedAt: string | null = report.generatedAt,
): PublicCatalogPilotManifest {
  const entries = report.selected.map((candidate): PublicCatalogPilotManifestEntry => {
    if (
      !candidate.pageType
      || !candidate.bundleId
      || !candidate.bundleVersion
      || !candidate.draftId
      || !candidate.draftVersion
      || candidate.pageStatus !== 'review'
      || !candidate.publicationEligible
      || !candidate.readyForPublication
      || !candidate.reviewedAt
      || !candidate.sourceCheckedAt
    ) {
      throw new Error(`public_catalog_pilot_selected_candidate_incomplete:${candidate.slug}`);
    }
    return {
      slug: candidate.slug,
      pageType: candidate.pageType,
      primaryIntent: candidate.primaryIntent,
      primaryKeyword: candidate.primaryKeyword,
      briefId: candidate.briefId,
      bundleId: candidate.bundleId,
      bundleVersion: candidate.bundleVersion,
      draftId: candidate.draftId,
      draftVersion: candidate.draftVersion,
      pageStatus: 'review',
      publicationEligible: true,
      readyForPublication: true,
      reviewedAt: candidate.reviewedAt,
      sourceCheckedAt: candidate.sourceCheckedAt,
      claimIds: [...candidate.claimIds],
      sourceUrls: [...candidate.sourceUrls],
      notes: '',
    };
  });
  return {
    schemaVersion: PUBLIC_CATALOG_PILOT_SCHEMA_VERSION,
    generatedAt,
    entries,
  };
}

function manifestEntryKey(entry: PublicCatalogPilotManifestEntry): string {
  return [entry.slug, entry.briefId, entry.bundleId, entry.bundleVersion, entry.draftId, entry.draftVersion].join(':');
}

export function validatePublicCatalogPilotManifest(
  manifest: PublicCatalogPilotManifest,
  report?: PublicCatalogPilotReport,
): PublicCatalogPilotManifestValidation {
  const errors: PublicCatalogPilotIssue[] = [];
  if (manifest.schemaVersion !== PUBLIC_CATALOG_PILOT_SCHEMA_VERSION) {
    errors.push(issue('manifest_schema_version_invalid', 'La versione dello schema manifest non è supportata.'));
  }
  if (manifest.generatedAt !== null && !validIso(manifest.generatedAt)) {
    errors.push(issue('manifest_generated_at_invalid', 'generatedAt deve essere null o ISO-8601 valido.'));
  }
  if (!Array.isArray(manifest.entries)) {
    errors.push(issue('manifest_entries_invalid', 'entries deve essere un array.'));
    return Object.freeze({ valid: false, errors: Object.freeze(errors) });
  }
  if (manifest.entries.length > PUBLIC_CATALOG_PILOT_MAX_ENTRIES) {
    errors.push(issue('manifest_capacity_exceeded', 'Il manifest supera il massimo di quattro entry.', {
      count: manifest.entries.length,
      maxEntries: PUBLIC_CATALOG_PILOT_MAX_ENTRIES,
    }));
  }

  const slugs = new Set<string>();
  const keywords = new Set<string>();
  const keys = new Set<string>();
  const reportEntries = new Map((report?.selected ?? []).map((candidate) => [candidate.slug, candidate]));

  manifest.entries.forEach((entry, index) => {
    const path = `entries[${index}]`;
    if (publicArticleSlugCandidate(`/${entry.slug}`) !== entry.slug || looksLikePublicFileProbe(entry.slug)) {
      errors.push(issue('manifest_slug_invalid', 'Lo slug manifest non è valido o è riservato.', { path, slug: entry.slug }));
    }
    if (slugs.has(entry.slug)) errors.push(issue('manifest_slug_duplicate', 'Lo slug compare più volte nel manifest.', { slug: entry.slug }));
    slugs.add(entry.slug);
    const keyword = normalizedIntent(entry.primaryKeyword);
    if (!keyword) errors.push(issue('manifest_keyword_missing', 'La primary keyword è obbligatoria.', { path }));
    if (keyword && keywords.has(keyword)) errors.push(issue('manifest_keyword_duplicate', 'La primary keyword compare più volte.', { primaryKeyword: entry.primaryKeyword }));
    if (keyword) keywords.add(keyword);
    if (!normalizedIntent(entry.primaryIntent)) errors.push(issue('manifest_intent_missing', 'Il primary intent è obbligatorio.', { path }));
    for (const [fieldName, value] of [
      ['briefId', entry.briefId],
      ['bundleId', entry.bundleId],
      ['bundleVersion', entry.bundleVersion],
      ['draftId', entry.draftId],
      ['draftVersion', entry.draftVersion],
    ] as const) {
      if (!Number.isInteger(value) || value <= 0) errors.push(issue('manifest_positive_integer_required', 'ID e versioni devono essere interi positivi.', { path, fieldName }));
    }
    if (entry.pageStatus !== 'review') errors.push(issue('manifest_page_status_invalid', 'Una release candidate deve restare review.', { path, pageStatus: entry.pageStatus }));
    if (entry.publicationEligible !== true || entry.readyForPublication !== true) {
      errors.push(issue('manifest_publication_gate_invalid', 'La release candidate deve avere entrambi i gate di pubblicazione positivi.', { path }));
    }
    if (!validIso(entry.reviewedAt) || !validIso(entry.sourceCheckedAt)) {
      errors.push(issue('manifest_timestamp_invalid', 'reviewedAt e sourceCheckedAt devono essere ISO-8601 validi.', { path }));
    }
    if (!entry.claimIds.length || entry.claimIds.some((claimId) => !Number.isInteger(claimId) || claimId <= 0)) {
      errors.push(issue('manifest_claim_ids_invalid', 'claimIds deve contenere interi positivi.', { path }));
    }
    if (new Set(entry.claimIds).size !== entry.claimIds.length) errors.push(issue('manifest_claim_ids_duplicate', 'claimIds contiene duplicati.', { path }));
    if (!entry.sourceUrls.length || entry.sourceUrls.some((url) => !url.startsWith('https://'))) {
      errors.push(issue('manifest_source_urls_invalid', 'sourceUrls deve contenere URL HTTPS.', { path }));
    }
    if (new Set(entry.sourceUrls).size !== entry.sourceUrls.length) errors.push(issue('manifest_source_urls_duplicate', 'sourceUrls contiene duplicati.', { path }));
    if (SECRET_PATTERN.test(JSON.stringify(entry))) errors.push(issue('manifest_secret_like_data', 'Il manifest contiene dati simili a secret o token.', { path }));
    const key = manifestEntryKey(entry);
    if (keys.has(key)) errors.push(issue('manifest_entry_duplicate', 'La stessa identità canonica compare più volte.', { path }));
    keys.add(key);

    if (report) {
      const candidate = reportEntries.get(entry.slug);
      if (!candidate) {
        errors.push(issue('manifest_candidate_not_selected', 'L’entry non appartiene alle release candidate selezionate dall’audit.', { slug: entry.slug }));
      } else if (
        candidate.briefId !== entry.briefId
        || candidate.bundleId !== entry.bundleId
        || candidate.bundleVersion !== entry.bundleVersion
        || candidate.draftId !== entry.draftId
        || candidate.draftVersion !== entry.draftVersion
        || candidate.pageType !== entry.pageType
        || candidate.primaryIntent !== entry.primaryIntent
        || candidate.primaryKeyword !== entry.primaryKeyword
        || !sameJson(candidate.claimIds, entry.claimIds)
        || !sameJson(candidate.sourceUrls, entry.sourceUrls)
      ) {
        errors.push(issue('manifest_candidate_drift', 'L’entry diverge dal risultato corrente dell’audit.', { slug: entry.slug }));
      }
    }
  });

  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors) });
}

function rawPageType(value: unknown): PublicCatalogPageType {
  const candidate = text(value);
  if (candidate === 'destination' || candidate === 'comparison' || candidate === 'provider') return candidate;
  return 'guide';
}

export async function loadPublicCatalogPilotSnapshot(
  database: PublicCatalogPilotDatabase,
): Promise<PublicCatalogPilotSnapshot> {
  const [briefRows, bundleRows, draftRows, provenanceRows, pageRows, claimRows] = await Promise.all([
    database.prepare(`
      SELECT id,status,slug_suggestion,asset_type,search_intent,priority_score
      FROM editorial_briefs ORDER BY id ASC
    `).all<RawRecord>(),
    database.prepare(`
      SELECT id,brief_id,page_slug,version,bundle_key,publication_eligible,ready_for_publication,
             review_status,verified_count,insufficient_count,contradicted_count,pending_count,
             expired_count,conflict_count,blockers_json,warnings_json,reviewed_at,updated_at
      FROM page_evidence_bundles ORDER BY brief_id ASC,version DESC
    `).all<RawRecord>(),
    database.prepare(`
      SELECT id,evidence_bundle_id,version,page_slug,page_type,prompt_version,status,title,
             meta_description,eyebrow,h1,direct_answer,intro,content_json,faq_json,
             source_links_json,primary_keyword,used_claim_ids_json,excluded_claim_ids_json,
             reviewed_at,updated_at
      FROM editorial_review_drafts ORDER BY evidence_bundle_id ASC,version DESC
    `).all<RawRecord>(),
    database.prepare(`
      SELECT draft_id,field_name,field_key,claim_id
      FROM editorial_review_draft_field_claims
      ORDER BY draft_id ASC,field_name ASC,field_key ASC,claim_id ASC
    `).all<RawRecord>(),
    database.prepare(`
      SELECT slug,page_type,title,meta_description,eyebrow,h1,direct_answer,intro,
             content_json,faq_json,source_links_json,primary_keyword,search_intent,status,
             featured,source_checked_at,published_at,updated_at
      FROM pages ORDER BY slug ASC
    `).all<RawRecord>(),
    database.prepare(`
      SELECT c.id,c.brief_id,c.atomic,c.status,c.source_id,c.claim_verification_id,
             s.url AS source_url,s.status AS source_status,
             v.verification_status,v.valid_until
      FROM editorial_claim_candidates c
      LEFT JOIN source_registry s ON s.id=c.source_id
      LEFT JOIN claim_verifications v ON v.id=c.claim_verification_id
      ORDER BY c.brief_id ASC,c.id ASC
    `).all<RawRecord>(),
  ]);

  return {
    briefs: briefRows.results.map((row) => ({
      id: finiteInteger(row.id),
      status: text(row.status),
      slugSuggestion: text(row.slug_suggestion),
      assetType: text(row.asset_type),
      searchIntent: text(row.search_intent),
      priorityScore: Number(row.priority_score) || 0,
    })),
    bundles: bundleRows.results.map((row) => ({
      id: finiteInteger(row.id),
      briefId: finiteInteger(row.brief_id),
      pageSlug: text(row.page_slug),
      version: finiteInteger(row.version),
      bundleKey: text(row.bundle_key),
      publicationEligible: flag(row.publication_eligible),
      readyForPublication: flag(row.ready_for_publication),
      reviewStatus: text(row.review_status),
      verifiedCount: finiteInteger(row.verified_count),
      insufficientCount: finiteInteger(row.insufficient_count),
      contradictedCount: finiteInteger(row.contradicted_count),
      pendingCount: finiteInteger(row.pending_count),
      expiredCount: finiteInteger(row.expired_count),
      conflictCount: finiteInteger(row.conflict_count),
      blockers: array(parseJson(row.blockers_json, [])),
      warnings: array(parseJson(row.warnings_json, [])),
      reviewedAt: nullableText(row.reviewed_at),
      updatedAt: text(row.updated_at),
    })),
    drafts: draftRows.results.map((row) => ({
      id: finiteInteger(row.id),
      evidenceBundleId: finiteInteger(row.evidence_bundle_id),
      version: finiteInteger(row.version),
      pageSlug: text(row.page_slug),
      pageType: rawPageType(row.page_type),
      promptVersion: text(row.prompt_version),
      status: text(row.status),
      title: text(row.title),
      metaDescription: text(row.meta_description),
      eyebrow: text(row.eyebrow),
      h1: text(row.h1),
      directAnswer: text(row.direct_answer),
      intro: text(row.intro),
      content: array(parseJson(row.content_json, [])),
      faq: array(parseJson(row.faq_json, [])),
      sources: sourceArray(row.source_links_json),
      primaryKeyword: text(row.primary_keyword),
      usedClaimIds: integerArray(row.used_claim_ids_json),
      excludedClaimIds: integerArray(row.excluded_claim_ids_json),
      reviewedAt: nullableText(row.reviewed_at),
      updatedAt: text(row.updated_at),
    })),
    provenance: provenanceRows.results.map((row) => ({
      draftId: finiteInteger(row.draft_id),
      fieldName: text(row.field_name) as PublicCatalogProvenanceRecord['fieldName'],
      fieldKey: text(row.field_key),
      claimId: finiteInteger(row.claim_id),
    })),
    pages: pageRows.results.map((row) => ({
      slug: text(row.slug),
      pageType: rawPageType(row.page_type),
      title: text(row.title),
      metaDescription: text(row.meta_description),
      eyebrow: text(row.eyebrow),
      h1: text(row.h1),
      directAnswer: text(row.direct_answer),
      intro: text(row.intro),
      content: array(parseJson(row.content_json, [])),
      faq: array(parseJson(row.faq_json, [])),
      sources: sourceArray(row.source_links_json),
      primaryKeyword: text(row.primary_keyword),
      searchIntent: text(row.search_intent),
      status: text(row.status),
      featured: flag(row.featured),
      sourceCheckedAt: nullableText(row.source_checked_at),
      publishedAt: nullableText(row.published_at),
      updatedAt: text(row.updated_at),
    })),
    claims: claimRows.results.map((row) => ({
      id: finiteInteger(row.id),
      briefId: finiteInteger(row.brief_id),
      atomic: flag(row.atomic),
      status: text(row.status),
      sourceId: finiteInteger(row.source_id) || null,
      verificationId: finiteInteger(row.claim_verification_id) || null,
      sourceUrl: nullableText(row.source_url),
      sourceStatus: nullableText(row.source_status),
      verificationStatus: nullableText(row.verification_status),
      validUntil: nullableText(row.valid_until),
    })),
  };
}

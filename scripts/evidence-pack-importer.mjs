import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { packSemanticFingerprint } from './italy-comparison-evidence-pack.mjs';
import {
  canonicalizeRegistryUrl,
  loadReconciliationManifest,
  resolveSourceRegistryEntry,
} from './evidence-source-reconciliation.mjs';
import {
  SOURCE_REGISTRY_ONBOARDING_READ_QUERY,
  parseOnboardingRegistryRows,
} from './evidence-source-registry-onboarding.mjs';

const IMPORTER_VERSION = '1.0.1';
const PARSER_INPUT_VERSION = 'evidence-pack-source-v1';
const ALLOWED_COVERAGE_STATES = new Set(['observed', 'partial', 'unknown', 'not_applicable']);
const CANDIDATE_COVERAGE_STATES = new Set(['observed', 'partial']);
const PRODUCT_SOURCE_ROLES = new Set([
  'product_catalog',
  'product_page',
  'regional_store_page',
  'regional_product_page',
]);

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

function hashCanonical(value) {
  return sha256(canonicalJson(value));
}

function requireRepoLocalPath(value, label) {
  if (typeof value !== 'string' || !value || path.isAbsolute(value)) {
    throw new Error(`${label}_must_be_repository_local`);
  }
  const absolute = path.resolve(value);
  const relative = path.relative(process.cwd(), absolute);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`${label}_must_stay_inside_repository`);
  }
  return absolute;
}

function repoRelative(absolute) {
  return path.relative(process.cwd(), absolute).split(path.sep).join('/');
}

function normalizeHash(value, label) {
  if (typeof value !== 'string' || !/^sha256:[0-9a-f]{64}$/.test(value)) {
    throw new Error(`${label}_invalid`);
  }
  return value;
}

function isoDate(value, label) {
  if (typeof value !== 'string' || !Number.isFinite(new Date(value).getTime())) {
    throw new Error(`${label}_invalid`);
  }
  return value;
}

function runWranglerD1(args, errorCode) {
  const result = spawnSync(
    process.execPath,
    ['node_modules/wrangler/bin/wrangler.js', 'd1', ...args],
    {
      encoding: 'utf8',
      env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' },
      maxBuffer: 25 * 1024 * 1024,
    },
  );
  if (result.status !== 0) {
    const diagnostic = (result.stderr || result.stdout || '').trim();
    throw new Error(`${errorCode}${diagnostic ? `:${diagnostic}` : ''}`);
  }
  return result.stdout;
}

function parseJsonOutput(stdout, errorCode) {
  const trimmed = stdout.trim();
  if (!trimmed) throw new Error(`${errorCode}:empty_output`);
  try {
    return JSON.parse(trimmed);
  } catch (error) {
    throw new Error(`${errorCode}:invalid_json:${error.message}`);
  }
}

function collectResultArrays(value, output) {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    for (const item of value) collectResultArrays(item, output);
    return;
  }
  if (Array.isArray(value.results)) {
    output.push(value.results);
    return;
  }
  if (value.result !== undefined) collectResultArrays(value.result, output);
}

function parseD1Rows(payload, errorCode) {
  const arrays = [];
  collectResultArrays(payload, arrays);
  if (arrays.length === 0) throw new Error(`${errorCode}:results_missing`);
  return arrays.flat();
}

function queryLocalRows(persistTo, sql, errorCode) {
  const stdout = runWranglerD1(
    ['execute', 'DB', '--local', '--persist-to', persistTo, '--command', sql, '--json'],
    errorCode,
  );
  return parseD1Rows(parseJsonOutput(stdout, errorCode), errorCode);
}

function queryLocalRegistry(persistTo) {
  const stdout = runWranglerD1(
    [
      'execute', 'DB', '--local', '--persist-to', persistTo,
      '--command', SOURCE_REGISTRY_ONBOARDING_READ_QUERY, '--json',
    ],
    'evidence_import_source_registry_query_failed',
  );
  return parseOnboardingRegistryRows(
    parseJsonOutput(stdout, 'evidence_import_source_registry_query_failed'),
  );
}

function queryLocalEvidenceState(persistTo) {
  return Object.freeze({
    runs: queryLocalRows(
      persistTo,
      'SELECT * FROM evidence_capture_runs ORDER BY id;',
      'evidence_import_runs_query_failed',
    ),
    snapshots: queryLocalRows(
      persistTo,
      'SELECT * FROM evidence_snapshots ORDER BY id;',
      'evidence_import_snapshots_query_failed',
    ),
    observations: queryLocalRows(
      persistTo,
      'SELECT * FROM evidence_field_observations ORDER BY id;',
      'evidence_import_observations_query_failed',
    ),
    candidates: queryLocalRows(
      persistTo,
      'SELECT * FROM evidence_claim_candidates ORDER BY id;',
      'evidence_import_candidates_query_failed',
    ),
  });
}

function requirePackSourceShape(source, index) {
  const prefix = `pack_source_${index}`;
  for (const key of [
    'sourceKey', 'provider', 'role', 'sourceAuditKey', 'snapshotId', 'requestedUrl',
    'canonicalRequestedUrl', 'finalUrl', 'canonicalFinalUrl', 'fetchedAt', 'contentType',
    'bodySha256', 'visibleTextSha256',
  ]) {
    if (typeof source?.[key] !== 'string' || !source[key]) {
      throw new Error(`${prefix}_${key}_invalid`);
    }
  }
  normalizeHash(source.bodySha256, `${prefix}_body_sha256`);
  normalizeHash(source.visibleTextSha256, `${prefix}_visible_text_sha256`);
  if (!/^snapshot:sha256:[0-9a-f]{64}$/.test(source.snapshotId)) {
    throw new Error(`${prefix}_snapshot_id_invalid`);
  }
  if (!Number.isInteger(source.byteLength) || source.byteLength < 1) {
    throw new Error(`${prefix}_byte_length_invalid`);
  }
  if (!Number.isInteger(source.httpStatus) || source.httpStatus < 200 || source.httpStatus >= 300) {
    throw new Error(`${prefix}_http_status_invalid`);
  }
  if (!Array.isArray(source.redirectChain)) throw new Error(`${prefix}_redirect_chain_invalid`);
  isoDate(source.fetchedAt, `${prefix}_fetched_at`);
}

function expectedPackCandidateKey(candidate) {
  return `sha256:${hashCanonical({
    subjectKey: candidate.subjectKey,
    fieldName: candidate.fieldName,
    scope: candidate.scope,
    rawValue: candidate.rawValue,
    normalizedValue: candidate.normalizedValue,
    evidence: candidate.evidence.map((entry) => ({
      sourceKey: entry.sourceKey,
      snapshotId: entry.snapshotId,
    })),
    extractorVersion: candidate.extractorVersion,
  })}`;
}

function validatePackStructure(pack) {
  if (!pack || pack.schemaVersion !== 1) throw new Error('evidence_import_pack_schema_unsupported');
  if (!/^pack:sha256:[0-9a-f]{64}$/.test(pack.packId || '')) {
    throw new Error('evidence_import_pack_id_invalid');
  }
  if (!pack.scenario || typeof pack.scenario.id !== 'string' || !pack.scenario.id) {
    throw new Error('evidence_import_scenario_invalid');
  }
  isoDate(pack.startedAt, 'evidence_import_started_at');
  isoDate(pack.completedAt, 'evidence_import_completed_at');
  if (!Number.isInteger(pack.captureWindowMs) || pack.captureWindowMs < 0) {
    throw new Error('evidence_import_capture_window_invalid');
  }
  if (!Array.isArray(pack.sources) || pack.sources.length === 0) {
    throw new Error('evidence_import_sources_missing');
  }
  if (!Array.isArray(pack.offers) || pack.offers.length === 0) {
    throw new Error('evidence_import_offers_missing');
  }
  if (pack.ranking?.status !== 'not_computed') {
    throw new Error('evidence_import_ranking_must_be_not_computed');
  }
  normalizeHash(pack.semanticFingerprint, 'evidence_import_semantic_fingerprint');
  if (JSON.stringify(pack).includes('price_eur')) throw new Error('evidence_import_price_eur_forbidden');

  const sourceKeys = new Set();
  const snapshotIds = new Set();
  for (const [index, source] of pack.sources.entries()) {
    requirePackSourceShape(source, index);
    if (sourceKeys.has(source.sourceKey)) {
      throw new Error(`evidence_import_source_key_duplicate:${source.sourceKey}`);
    }
    if (snapshotIds.has(source.snapshotId)) {
      throw new Error(`evidence_import_snapshot_id_duplicate:${source.snapshotId}`);
    }
    sourceKeys.add(source.sourceKey);
    snapshotIds.add(source.snapshotId);
  }

  for (const offer of pack.offers) {
    if (!offer || typeof offer.provider !== 'string' || !offer.provider) {
      throw new Error('evidence_import_offer_provider_invalid');
    }
    if (typeof offer.offerKey !== 'string' || !offer.offerKey) {
      throw new Error('evidence_import_offer_key_invalid');
    }
    if (!Array.isArray(offer.candidates) || !offer.coverage || typeof offer.coverage !== 'object') {
      throw new Error(`evidence_import_offer_shape_invalid:${offer.offerKey}`);
    }

    const candidatesByField = new Map();
    for (const candidate of offer.candidates) {
      if (!candidate || candidate.status !== 'pending') {
        throw new Error(`evidence_import_candidate_status_invalid:${offer.offerKey}`);
      }
      if (candidate.subjectType !== 'scenario_offer' || candidate.subjectKey !== offer.offerKey) {
        throw new Error(
          `evidence_import_candidate_subject_invalid:${offer.offerKey}:${candidate.fieldName || 'unknown'}`,
        );
      }
      if (typeof candidate.fieldName !== 'string' || !candidate.fieldName) {
        throw new Error(`evidence_import_candidate_field_invalid:${offer.offerKey}`);
      }
      if (candidate.fieldName === 'price_eur') throw new Error('evidence_import_price_eur_forbidden');
      if (candidatesByField.has(candidate.fieldName)) {
        throw new Error(`evidence_import_candidate_field_duplicate:${offer.offerKey}:${candidate.fieldName}`);
      }
      if (!/^sha256:[0-9a-f]{64}$/.test(candidate.candidateKey || '')) {
        throw new Error(`evidence_import_candidate_key_invalid:${offer.offerKey}:${candidate.fieldName}`);
      }
      if (typeof candidate.rawValue !== 'string' || !candidate.rawValue) {
        throw new Error(`evidence_import_candidate_raw_value_invalid:${offer.offerKey}:${candidate.fieldName}`);
      }
      if (!candidate.scope || typeof candidate.scope !== 'object' || Array.isArray(candidate.scope)) {
        throw new Error(`evidence_import_candidate_scope_invalid:${offer.offerKey}:${candidate.fieldName}`);
      }
      if (!Array.isArray(candidate.evidence) || candidate.evidence.length === 0) {
        throw new Error(`evidence_import_candidate_evidence_missing:${offer.offerKey}:${candidate.fieldName}`);
      }
      if (typeof candidate.extractorId !== 'string' || !candidate.extractorId
          || typeof candidate.extractorVersion !== 'string' || !candidate.extractorVersion) {
        throw new Error(`evidence_import_candidate_extractor_invalid:${offer.offerKey}:${candidate.fieldName}`);
      }
      isoDate(
        candidate.observedAt,
        `evidence_import_candidate_observed_at:${offer.offerKey}:${candidate.fieldName}`,
      );
      if (!Array.isArray(candidate.warnings)) {
        throw new Error(`evidence_import_candidate_warnings_invalid:${offer.offerKey}:${candidate.fieldName}`);
      }

      for (const evidence of candidate.evidence) {
        const source = pack.sources.find((entry) => entry.sourceKey === evidence?.sourceKey);
        if (!source || source.snapshotId !== evidence.snapshotId) {
          throw new Error(
            `evidence_import_candidate_evidence_source_mismatch:${offer.offerKey}:${candidate.fieldName}`,
          );
        }
        if (!evidence.locator || typeof evidence.locator !== 'object' || Array.isArray(evidence.locator)) {
          throw new Error(`evidence_import_candidate_locator_invalid:${offer.offerKey}:${candidate.fieldName}`);
        }
      }

      if (candidate.candidateKey !== expectedPackCandidateKey(candidate)) {
        throw new Error(
          `evidence_import_candidate_identity_mismatch:${offer.offerKey}:${candidate.fieldName}`,
        );
      }
      candidatesByField.set(candidate.fieldName, candidate);
    }

    for (const [fieldName, coverage] of Object.entries(offer.coverage)) {
      if (!coverage || !ALLOWED_COVERAGE_STATES.has(coverage.state)) {
        throw new Error(`evidence_import_coverage_state_invalid:${offer.offerKey}:${fieldName}`);
      }
      const hasCandidate = candidatesByField.has(fieldName);
      if (CANDIDATE_COVERAGE_STATES.has(coverage.state) && !hasCandidate) {
        throw new Error(
          `evidence_import_supported_coverage_missing_candidate:${offer.offerKey}:${fieldName}`,
        );
      }
      if (!CANDIDATE_COVERAGE_STATES.has(coverage.state) && hasCandidate) {
        throw new Error(
          `evidence_import_unsupported_coverage_has_candidate:${offer.offerKey}:${fieldName}`,
        );
      }
    }
    for (const fieldName of candidatesByField.keys()) {
      const coverage = offer.coverage[fieldName];
      if (!coverage || !CANDIDATE_COVERAGE_STATES.has(coverage.state)) {
        throw new Error(`evidence_import_candidate_coverage_invalid:${offer.offerKey}:${fieldName}`);
      }
    }
  }
  return pack;
}

function verifyPackIdentity(pack) {
  const expectedPackId = `pack:sha256:${hashCanonical({
    scenario: pack.scenario,
    sourceSnapshotIds: pack.sources.map((source) => source.snapshotId),
  })}`;
  if (pack.packId !== expectedPackId) throw new Error('evidence_import_pack_identity_mismatch');
  if (pack.semanticFingerprint !== packSemanticFingerprint(pack)) {
    throw new Error('evidence_import_semantic_fingerprint_mismatch');
  }
}

function manifestEntryForPackSource(source, manifestByAuditKey) {
  const entry = manifestByAuditKey.get(source.sourceAuditKey);
  if (!entry) throw new Error(`evidence_import_source_unmapped:${source.sourceAuditKey}`);
  if (entry.provider !== source.provider) {
    throw new Error(`evidence_import_source_provider_mismatch:${source.sourceAuditKey}`);
  }
  if (entry.evidenceRole !== source.role) {
    throw new Error(`evidence_import_source_role_mismatch:${source.sourceAuditKey}`);
  }
  const approvedRequestedUrls = new Set(entry.packRequestedUrls.map(canonicalizeRegistryUrl));
  if (!approvedRequestedUrls.has(canonicalizeRegistryUrl(source.requestedUrl))) {
    throw new Error(`evidence_import_requested_url_unapproved:${source.sourceAuditKey}`);
  }
  return entry;
}

async function verifyArtifacts(pack, packPath) {
  if (typeof pack.artifactLocation !== 'string' || !pack.artifactLocation) {
    throw new Error('evidence_import_artifact_location_missing');
  }
  const artifactDirectory = requireRepoLocalPath(
    pack.artifactLocation,
    'evidence_import_artifact_location',
  );
  if (path.resolve(path.dirname(packPath)) !== path.resolve(artifactDirectory)) {
    throw new Error('evidence_import_artifact_location_pack_directory_mismatch');
  }

  const artifactsBySourceKey = new Map();
  for (const source of pack.sources) {
    const artifactPath = path.join(artifactDirectory, 'sources', `${source.sourceKey}.html`);
    const relative = path.relative(process.cwd(), artifactPath);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      throw new Error(`evidence_import_artifact_path_escape:${source.sourceKey}`);
    }
    const body = await readFile(artifactPath);
    const bodySha256 = `sha256:${sha256(body)}`;
    if (bodySha256 !== source.bodySha256) {
      throw new Error(`evidence_import_artifact_hash_mismatch:${source.sourceKey}`);
    }
    if (body.length !== source.byteLength) {
      throw new Error(`evidence_import_artifact_byte_length_mismatch:${source.sourceKey}`);
    }
    const expectedSnapshotId = `snapshot:sha256:${hashCanonical({
      sourceAuditKey: source.sourceAuditKey,
      finalUrl: source.canonicalFinalUrl,
      bodySha256: bodySha256.replace(/^sha256:/, ''),
    })}`;
    if (source.snapshotId !== expectedSnapshotId) {
      throw new Error(`evidence_import_source_snapshot_identity_mismatch:${source.sourceKey}`);
    }
    artifactsBySourceKey.set(source.sourceKey, Object.freeze({
      path: artifactPath,
      ref: repoRelative(artifactPath),
    }));
  }
  return Object.freeze({ artifactDirectory, artifactsBySourceKey });
}

export async function loadVerifiedEvidencePack(packFilename) {
  const packPath = requireRepoLocalPath(packFilename, 'evidence_import_pack_path');
  if (path.basename(packPath) !== 'pack.json') {
    throw new Error('evidence_import_pack_filename_invalid');
  }
  const packBytes = await readFile(packPath);
  let pack;
  try {
    pack = JSON.parse(packBytes.toString('utf8'));
  } catch (error) {
    throw new Error(`evidence_import_pack_json_invalid:${error.message}`);
  }
  validatePackStructure(pack);
  verifyPackIdentity(pack);
  const artifacts = await verifyArtifacts(pack, packPath);
  return Object.freeze({
    pack,
    packPath,
    packSha256: `sha256:${sha256(packBytes)}`,
    artifacts,
  });
}

function sourcePriority(source) {
  return PRODUCT_SOURCE_ROLES.has(source.role) ? 0 : 1;
}

function providerSources(pack, provider) {
  return pack.sources
    .filter((source) => source.provider === provider)
    .sort((left, right) => sourcePriority(left) - sourcePriority(right)
      || left.sourceKey.localeCompare(right.sourceKey));
}

function buildSourceResolution(pack, reconciliation, registryRows) {
  const manifestByAuditKey = new Map(
    reconciliation.sources.map((entry) => [entry.sourceAuditKey, entry]),
  );
  const resolutions = new Map();
  for (const source of pack.sources) {
    const entry = manifestEntryForPackSource(source, manifestByAuditKey);
    const resolution = resolveSourceRegistryEntry(entry, registryRows);
    if (resolution.status !== 'resolved') {
      throw new Error(
        `evidence_import_source_resolution_failed:${source.sourceAuditKey}:${resolution.reason}`,
      );
    }
    resolutions.set(source.sourceKey, Object.freeze({ entry, resolution }));
  }
  return resolutions;
}

function buildRun(pack, packSha256) {
  const runKey = `run:sha256:${hashCanonical({
    packId: pack.packId,
    startedAt: pack.startedAt,
    completedAt: pack.completedAt,
    captureWindowMs: pack.captureWindowMs,
  })}`;
  return Object.freeze({
    run_key: runKey,
    pack_schema_version: pack.schemaVersion,
    scenario_key: pack.scenario.id,
    scenario_json: canonicalJson(pack.scenario),
    started_at: pack.startedAt,
    completed_at: pack.completedAt,
    capture_window_ms: pack.captureWindowMs,
    source_count: pack.sources.length,
    pack_sha256: packSha256,
    semantic_fingerprint: pack.semanticFingerprint,
    baseline_run_key: null,
  });
}

function buildSnapshots({ pack, run, resolutions, artifacts }) {
  const snapshots = [];
  const bySourceKey = new Map();
  for (const source of pack.sources) {
    const sourceId = resolutions.get(source.sourceKey).resolution.sourceRegistryId;
    const snapshotKey = `snapshot-import:sha256:${hashCanonical({
      runKey: run.run_key,
      packSnapshotId: source.snapshotId,
      sourceAuditKey: source.sourceAuditKey,
      finalUrl: source.canonicalFinalUrl,
      bodySha256: source.bodySha256,
      scenarioKey: pack.scenario.id,
    })}`;
    const snapshot = Object.freeze({
      snapshot_key: snapshotKey,
      source_id: sourceId,
      source_audit_key: source.sourceAuditKey,
      requested_url: source.requestedUrl,
      final_url: source.finalUrl,
      redirect_chain_json: canonicalJson(source.redirectChain || []),
      fetched_at: source.fetchedAt,
      http_status: source.httpStatus,
      content_type: source.contentType,
      capture_method: 'http_html',
      locale: source.locale ?? null,
      currency_context: null,
      country_context: null,
      capture_context_json: canonicalJson({
        packId: pack.packId,
        scenarioKey: pack.scenario.id,
        sourceKey: source.sourceKey,
        provider: source.provider,
        role: source.role,
      }),
      http_etag: source.etag ?? null,
      http_last_modified: source.lastModified ?? null,
      body_sha256: source.bodySha256,
      visible_text_sha256: source.visibleTextSha256 ?? null,
      byte_length: source.byteLength,
      artifact_ref: artifacts.artifactsBySourceKey.get(source.sourceKey).ref,
      parser_input_version: PARSER_INPUT_VERSION,
      capture_warnings_json: '[]',
      pack_source_key: source.sourceKey,
      pack_snapshot_id: source.snapshotId,
      source_role: source.role,
      provider: source.provider,
    });
    snapshots.push(snapshot);
    bySourceKey.set(source.sourceKey, snapshot);
  }
  return Object.freeze({ snapshots: Object.freeze(snapshots), bySourceKey });
}

function buildObservation({
  pack,
  run,
  offer,
  fieldName,
  coverage,
  candidate,
  snapshotsBySourceKey,
}) {
  const inferredCandidate = offer.candidates[0];
  if (!inferredCandidate) {
    throw new Error(`evidence_import_offer_has_no_extractor_context:${offer.offerKey}`);
  }

  const inspectedProviderSources = providerSources(pack, offer.provider);
  if (inspectedProviderSources.length === 0) {
    throw new Error(`evidence_import_offer_sources_missing:${offer.offerKey}`);
  }

  let anchorSource;
  let locatorPayload;
  let rawValue = null;
  let normalizedValue = null;
  let extractorId = inferredCandidate.extractorId;
  let extractorVersion = inferredCandidate.extractorVersion;
  let warnings = [];
  let observedAt = inspectedProviderSources
    .map((source) => source.fetchedAt)
    .sort()
    .at(-1);
  let scope = inferredCandidate.scope;
  let packSubjectType = inferredCandidate.subjectType;

  if (candidate) {
    anchorSource = pack.sources.find(
      (source) => source.sourceKey === candidate.evidence[0].sourceKey,
    );
    rawValue = candidate.rawValue;
    normalizedValue = candidate.normalizedValue;
    extractorId = candidate.extractorId;
    extractorVersion = candidate.extractorVersion;
    warnings = candidate.warnings;
    observedAt = candidate.observedAt;
    scope = candidate.scope;
    packSubjectType = candidate.subjectType;
    locatorPayload = {
      schemaVersion: 1,
      kind: 'pack_candidate',
      packCandidateKey: candidate.candidateKey,
      refs: candidate.evidence.map((entry) => ({
        sourceKey: entry.sourceKey,
        packSnapshotId: entry.snapshotId,
        snapshotKey: snapshotsBySourceKey.get(entry.sourceKey).snapshot_key,
        locator: entry.locator,
      })),
    };
  } else {
    anchorSource = inspectedProviderSources[0];
    locatorPayload = {
      schemaVersion: 1,
      kind: 'coverage_state',
      reason: coverage.reason ?? null,
      inspectedSources: inspectedProviderSources.map((source) => ({
        sourceKey: source.sourceKey,
        packSnapshotId: source.snapshotId,
        snapshotKey: snapshotsBySourceKey.get(source.sourceKey).snapshot_key,
      })),
    };
  }

  if (!anchorSource) throw new Error(`evidence_import_anchor_source_missing:${offer.offerKey}:${fieldName}`);
  const anchorSnapshot = snapshotsBySourceKey.get(anchorSource.sourceKey);
  if (!anchorSnapshot) {
    throw new Error(`evidence_import_anchor_snapshot_missing:${offer.offerKey}:${fieldName}`);
  }

  const scopeJson = canonicalJson({ ...scope, packSubjectType });
  const locatorJson = canonicalJson(locatorPayload);
  const rawValueJson = canonicalJson(rawValue);
  const normalizedValueJson = canonicalJson(normalizedValue);
  const observationKey = `observation:sha256:${hashCanonical({
    runKey: run.run_key,
    anchorSnapshotKey: anchorSnapshot.snapshot_key,
    subjectType: 'plan',
    subjectKey: offer.offerKey,
    fieldName,
    scope: JSON.parse(scopeJson),
    coverageState: coverage.state,
    rawValue,
    normalizedValue,
    extractorId,
    extractorVersion,
    locator: locatorPayload,
  })}`;

  return Object.freeze({
    observation_key: observationKey,
    anchor_snapshot_key: anchorSnapshot.snapshot_key,
    subject_type: 'plan',
    subject_key: offer.offerKey,
    provider_plan_key: null,
    field_name: fieldName,
    scope_json: scopeJson,
    coverage_state: coverage.state,
    raw_value_json: rawValueJson,
    normalized_value_json: normalizedValueJson,
    evidence_locator_json: locatorJson,
    extractor_id: extractorId,
    extractor_version: extractorVersion,
    normalizer_version: null,
    schema_version: 1,
    source_role: anchorSource.role,
    extraction_confidence: null,
    warnings_json: canonicalJson(warnings),
    observed_at: observedAt,
    proposed_valid_until: null,
    pack_candidate_key: candidate?.candidateKey ?? null,
  });
}

function buildObservations(pack, run, snapshotsBySourceKey) {
  const observations = [];
  for (const offer of pack.offers) {
    const candidatesByField = new Map(
      offer.candidates.map((candidate) => [candidate.fieldName, candidate]),
    );
    for (const fieldName of Object.keys(offer.coverage).sort()) {
      observations.push(buildObservation({
        pack,
        run,
        offer,
        fieldName,
        coverage: offer.coverage[fieldName],
        candidate: candidatesByField.get(fieldName) || null,
        snapshotsBySourceKey,
      }));
    }
  }
  const keys = new Set();
  for (const observation of observations) {
    if (keys.has(observation.observation_key)) {
      throw new Error(`evidence_import_observation_key_duplicate:${observation.observation_key}`);
    }
    keys.add(observation.observation_key);
  }
  return Object.freeze(observations);
}

function buildCandidates(observations) {
  return Object.freeze(
    observations
      .filter((observation) => CANDIDATE_COVERAGE_STATES.has(observation.coverage_state))
      .map((observation) => Object.freeze({
        candidate_key: `evidence-candidate:sha256:${hashCanonical({
          observationKey: observation.observation_key,
          packCandidateKey: observation.pack_candidate_key,
        })}`,
        observation_key: observation.observation_key,
        status: 'pending',
        decision_actor: null,
        decision_notes: '',
        decided_at: null,
      })),
  );
}

export function buildEvidenceImportModel({ verifiedPack, reconciliation, registryRows }) {
  const { pack, packSha256, artifacts } = verifiedPack;
  const resolutions = buildSourceResolution(pack, reconciliation, registryRows);
  const run = buildRun(pack, packSha256);
  const snapshotModel = buildSnapshots({ pack, run, resolutions, artifacts });
  const observations = buildObservations(pack, run, snapshotModel.bySourceKey);
  const candidates = buildCandidates(observations);
  return Object.freeze({
    schemaVersion: 1,
    importerVersion: IMPORTER_VERSION,
    packId: pack.packId,
    run,
    snapshots: snapshotModel.snapshots,
    observations,
    candidates,
  });
}

function rowMap(rows, key) {
  return new Map(rows.map((row) => [row[key], row]));
}

function scalarEqual(actual, expected) {
  if (expected === null) return actual === null || actual === undefined;
  if (typeof expected === 'number') return Number(actual) === expected;
  return actual === expected;
}

function assertColumnsExact(row, expected, columns, errorPrefix) {
  for (const column of columns) {
    if (!scalarEqual(row?.[column], expected[column])) {
      throw new Error(`${errorPrefix}:${column}`);
    }
  }
}

const RUN_COLUMNS = [
  'run_key', 'pack_schema_version', 'scenario_key', 'scenario_json', 'started_at',
  'completed_at', 'capture_window_ms', 'source_count', 'pack_sha256',
  'semantic_fingerprint', 'baseline_run_key',
];
const SNAPSHOT_COLUMNS = [
  'snapshot_key', 'source_id', 'source_audit_key', 'requested_url', 'final_url',
  'redirect_chain_json', 'fetched_at', 'http_status', 'content_type', 'capture_method',
  'locale', 'currency_context', 'country_context', 'capture_context_json', 'http_etag',
  'http_last_modified', 'body_sha256', 'visible_text_sha256', 'byte_length', 'artifact_ref',
  'parser_input_version', 'capture_warnings_json',
];
const OBSERVATION_COLUMNS = [
  'observation_key', 'subject_type', 'subject_key', 'provider_plan_key', 'field_name',
  'scope_json', 'coverage_state', 'raw_value_json', 'normalized_value_json',
  'evidence_locator_json', 'extractor_id', 'extractor_version', 'normalizer_version',
  'schema_version', 'source_role', 'extraction_confidence', 'warnings_json', 'observed_at',
  'proposed_valid_until',
];
const CANDIDATE_COLUMNS = [
  'candidate_key', 'status', 'decision_actor', 'decision_notes', 'decided_at',
];

function verifyExistingImport(model, state) {
  const runRows = state.runs.filter((row) => row.run_key === model.run.run_key);
  if (runRows.length !== 1) {
    throw new Error('evidence_import_existing_run_cardinality_invalid');
  }
  const runRow = runRows[0];
  assertColumnsExact(runRow, model.run, RUN_COLUMNS, 'evidence_import_existing_run_mismatch');
  const runId = Number(runRow.id);

  const snapshotsByKey = rowMap(state.snapshots, 'snapshot_key');
  const expectedSnapshotKeys = new Set(
    model.snapshots.map((snapshot) => snapshot.snapshot_key),
  );
  const runSnapshots = state.snapshots.filter((row) => Number(row.capture_run_id) === runId);
  if (runSnapshots.length !== model.snapshots.length
      || runSnapshots.some((row) => !expectedSnapshotKeys.has(row.snapshot_key))) {
    throw new Error('evidence_import_existing_snapshot_set_mismatch');
  }
  for (const snapshot of model.snapshots) {
    const row = snapshotsByKey.get(snapshot.snapshot_key);
    if (!row || Number(row.capture_run_id) !== runId) {
      throw new Error(`evidence_import_existing_snapshot_missing:${snapshot.snapshot_key}`);
    }
    assertColumnsExact(
      row,
      snapshot,
      SNAPSHOT_COLUMNS,
      `evidence_import_existing_snapshot_mismatch:${snapshot.snapshot_key}`,
    );
  }

  const snapshotIdByKey = new Map(model.snapshots.map((snapshot) => [
    snapshot.snapshot_key,
    Number(snapshotsByKey.get(snapshot.snapshot_key).id),
  ]));
  const observationByKey = rowMap(state.observations, 'observation_key');
  const expectedObservationKeys = new Set(
    model.observations.map((observation) => observation.observation_key),
  );
  const runSnapshotIds = new Set(snapshotIdByKey.values());
  const runObservations = state.observations.filter(
    (row) => runSnapshotIds.has(Number(row.snapshot_id)),
  );
  if (runObservations.length !== model.observations.length
      || runObservations.some((row) => !expectedObservationKeys.has(row.observation_key))) {
    throw new Error('evidence_import_existing_observation_set_mismatch');
  }
  for (const observation of model.observations) {
    const row = observationByKey.get(observation.observation_key);
    const expectedSnapshotId = snapshotIdByKey.get(observation.anchor_snapshot_key);
    if (!row || Number(row.snapshot_id) !== expectedSnapshotId) {
      throw new Error(`evidence_import_existing_observation_missing:${observation.observation_key}`);
    }
    assertColumnsExact(
      row,
      observation,
      OBSERVATION_COLUMNS,
      `evidence_import_existing_observation_mismatch:${observation.observation_key}`,
    );
  }

  const observationIdByKey = new Map(model.observations.map((observation) => [
    observation.observation_key,
    Number(observationByKey.get(observation.observation_key).id),
  ]));
  const candidatesByKey = rowMap(state.candidates, 'candidate_key');
  const expectedCandidateKeys = new Set(
    model.candidates.map((candidate) => candidate.candidate_key),
  );
  const runObservationIds = new Set(observationIdByKey.values());
  const runCandidates = state.candidates.filter(
    (row) => runObservationIds.has(Number(row.observation_id)),
  );
  if (runCandidates.length !== model.candidates.length
      || runCandidates.some((row) => !expectedCandidateKeys.has(row.candidate_key))) {
    throw new Error('evidence_import_existing_candidate_set_mismatch');
  }
  for (const candidate of model.candidates) {
    const row = candidatesByKey.get(candidate.candidate_key);
    if (!row || Number(row.observation_id) !== observationIdByKey.get(candidate.observation_key)) {
      throw new Error(`evidence_import_existing_candidate_missing:${candidate.candidate_key}`);
    }
    assertColumnsExact(
      row,
      candidate,
      CANDIDATE_COLUMNS,
      `evidence_import_existing_candidate_mismatch:${candidate.candidate_key}`,
    );
  }
}

export function buildEvidenceImportPlan(model, state) {
  const existingRun = state.runs.find((row) => row.run_key === model.run.run_key) || null;
  if (existingRun) {
    verifyExistingImport(model, state);
    return Object.freeze({
      action: 'existing_exact',
      inserted: Object.freeze({ runs: 0, snapshots: 0, observations: 0, candidates: 0 }),
    });
  }

  const snapshotKeys = new Set(state.snapshots.map((row) => row.snapshot_key));
  const observationKeys = new Set(state.observations.map((row) => row.observation_key));
  const candidateKeys = new Set(state.candidates.map((row) => row.candidate_key));
  for (const snapshot of model.snapshots) {
    if (snapshotKeys.has(snapshot.snapshot_key)) {
      throw new Error(`evidence_import_snapshot_key_collision:${snapshot.snapshot_key}`);
    }
  }
  for (const observation of model.observations) {
    if (observationKeys.has(observation.observation_key)) {
      throw new Error(`evidence_import_observation_key_collision:${observation.observation_key}`);
    }
  }
  for (const candidate of model.candidates) {
    if (candidateKeys.has(candidate.candidate_key)) {
      throw new Error(`evidence_import_candidate_key_collision:${candidate.candidate_key}`);
    }
  }
  return Object.freeze({
    action: 'insert',
    inserted: Object.freeze({
      runs: 1,
      snapshots: model.snapshots.length,
      observations: model.observations.length,
      candidates: model.candidates.length,
    }),
  });
}

function sqlString(value) {
  if (value === null || value === undefined) return 'NULL';
  return `'${String(value).replaceAll("'", "''")}'`;
}

function sqlNumber(value) {
  if (value === null || value === undefined) return 'NULL';
  if (!Number.isFinite(Number(value))) throw new Error('evidence_import_sql_number_invalid');
  return String(Number(value));
}

function buildEvidenceImportStatements(model, plan) {
  if (plan.action !== 'insert') return [];
  const statements = [];
  const run = model.run;
  statements.push([
    'INSERT INTO evidence_capture_runs(',
    '  run_key, pack_schema_version, scenario_key, scenario_json, started_at, completed_at,',
    '  capture_window_ms, source_count, pack_sha256, semantic_fingerprint, baseline_run_key',
    ') VALUES (',
    `  ${sqlString(run.run_key)}, ${sqlNumber(run.pack_schema_version)}, ${sqlString(run.scenario_key)}, ${sqlString(run.scenario_json)},`,
    `  ${sqlString(run.started_at)}, ${sqlString(run.completed_at)}, ${sqlNumber(run.capture_window_ms)}, ${sqlNumber(run.source_count)},`,
    `  ${sqlString(run.pack_sha256)}, ${sqlString(run.semantic_fingerprint)}, ${sqlString(run.baseline_run_key)}`,
    ');',
  ].join('\n'));

  for (const snapshot of model.snapshots) {
    statements.push([
      'INSERT INTO evidence_snapshots(',
      '  snapshot_key, capture_run_id, source_id, source_audit_key, requested_url, final_url,',
      '  redirect_chain_json, fetched_at, http_status, content_type, capture_method, locale,',
      '  currency_context, country_context, capture_context_json, http_etag, http_last_modified,',
      '  body_sha256, visible_text_sha256, byte_length, artifact_ref, parser_input_version, capture_warnings_json',
      ') VALUES (',
      `  ${sqlString(snapshot.snapshot_key)}, (SELECT id FROM evidence_capture_runs WHERE run_key=${sqlString(run.run_key)}),`,
      `  ${sqlNumber(snapshot.source_id)}, ${sqlString(snapshot.source_audit_key)}, ${sqlString(snapshot.requested_url)}, ${sqlString(snapshot.final_url)},`,
      `  ${sqlString(snapshot.redirect_chain_json)}, ${sqlString(snapshot.fetched_at)}, ${sqlNumber(snapshot.http_status)}, ${sqlString(snapshot.content_type)},`,
      `  ${sqlString(snapshot.capture_method)}, ${sqlString(snapshot.locale)}, ${sqlString(snapshot.currency_context)}, ${sqlString(snapshot.country_context)},`,
      `  ${sqlString(snapshot.capture_context_json)}, ${sqlString(snapshot.http_etag)}, ${sqlString(snapshot.http_last_modified)},`,
      `  ${sqlString(snapshot.body_sha256)}, ${sqlString(snapshot.visible_text_sha256)}, ${sqlNumber(snapshot.byte_length)},`,
      `  ${sqlString(snapshot.artifact_ref)}, ${sqlString(snapshot.parser_input_version)}, ${sqlString(snapshot.capture_warnings_json)}`,
      ');',
    ].join('\n'));
  }

  for (const observation of model.observations) {
    statements.push([
      'INSERT INTO evidence_field_observations(',
      '  observation_key, snapshot_id, subject_type, subject_key, provider_plan_key, field_name,',
      '  scope_json, coverage_state, raw_value_json, normalized_value_json, evidence_locator_json,',
      '  extractor_id, extractor_version, normalizer_version, schema_version, source_role,',
      '  extraction_confidence, warnings_json, observed_at, proposed_valid_until',
      ') VALUES (',
      `  ${sqlString(observation.observation_key)}, (SELECT id FROM evidence_snapshots WHERE snapshot_key=${sqlString(observation.anchor_snapshot_key)}),`,
      `  ${sqlString(observation.subject_type)}, ${sqlString(observation.subject_key)}, ${sqlString(observation.provider_plan_key)}, ${sqlString(observation.field_name)},`,
      `  ${sqlString(observation.scope_json)}, ${sqlString(observation.coverage_state)}, ${sqlString(observation.raw_value_json)},`,
      `  ${sqlString(observation.normalized_value_json)}, ${sqlString(observation.evidence_locator_json)}, ${sqlString(observation.extractor_id)},`,
      `  ${sqlString(observation.extractor_version)}, ${sqlString(observation.normalizer_version)}, ${sqlNumber(observation.schema_version)},`,
      `  ${sqlString(observation.source_role)}, ${sqlNumber(observation.extraction_confidence)}, ${sqlString(observation.warnings_json)},`,
      `  ${sqlString(observation.observed_at)}, ${sqlString(observation.proposed_valid_until)}`,
      ');',
    ].join('\n'));
  }

  for (const candidate of model.candidates) {
    statements.push([
      'INSERT INTO evidence_claim_candidates(',
      '  candidate_key, observation_id, status, decision_actor, decision_notes, decided_at',
      ') VALUES (',
      `  ${sqlString(candidate.candidate_key)}, (SELECT id FROM evidence_field_observations WHERE observation_key=${sqlString(candidate.observation_key)}),`,
      `  ${sqlString(candidate.status)}, ${sqlString(candidate.decision_actor)}, ${sqlString(candidate.decision_notes)}, ${sqlString(candidate.decided_at)}`,
      ');',
    ].join('\n'));
  }

  return statements;
}

export function buildEvidenceImportSql(model, plan) {
  const statements = buildEvidenceImportStatements(model, plan);
  if (statements.length === 0) return '';
  return ['BEGIN TRANSACTION;', ...statements, 'COMMIT;'].join('\n');
}

export function buildEvidenceImportBatchSql(entries) {
  if (!Array.isArray(entries) || entries.length < 1) {
    throw new Error('evidence_import_batch_entries_missing');
  }
  const statements = entries.flatMap(({ model, plan }) => buildEvidenceImportStatements(model, plan));
  return statements.join('\n');
}

function executeLocalImportSql(persistTo, sql) {
  if (!sql) return;
  runWranglerD1(
    ['execute', 'DB', '--local', '--persist-to', persistTo, '--command', sql, '--json'],
    'evidence_import_local_mutation_failed',
  );
}

export async function applyLocalEvidencePackImport({ persistTo, packFilename }) {
  if (typeof persistTo !== 'string' || !persistTo) {
    throw new Error('evidence_import_persist_path_required');
  }
  const verifiedPack = await loadVerifiedEvidencePack(packFilename);
  const reconciliation = await loadReconciliationManifest();
  const registryRows = queryLocalRegistry(persistTo);
  const model = buildEvidenceImportModel({ verifiedPack, reconciliation, registryRows });
  const beforeState = queryLocalEvidenceState(persistTo);
  const plan = buildEvidenceImportPlan(model, beforeState);
  executeLocalImportSql(persistTo, buildEvidenceImportSql(model, plan));
  const afterState = queryLocalEvidenceState(persistTo);
  verifyExistingImport(model, afterState);
  return Object.freeze({
    schemaVersion: 1,
    environment: 'local',
    importerVersion: IMPORTER_VERSION,
    packId: model.packId,
    runKey: model.run.run_key,
    action: plan.action,
    inserted: plan.inserted,
    totals: Object.freeze({
      snapshots: model.snapshots.length,
      observations: model.observations.length,
      candidates: model.candidates.length,
      observed: model.observations.filter((entry) => entry.coverage_state === 'observed').length,
      partial: model.observations.filter((entry) => entry.coverage_state === 'partial').length,
      unknown: model.observations.filter((entry) => entry.coverage_state === 'unknown').length,
      notApplicable: model.observations
        .filter((entry) => entry.coverage_state === 'not_applicable').length,
    }),
  });
}

function usage() {
  return [
    'Usage:',
    '  node scripts/evidence-pack-importer.mjs --local --persist-to <path> <pack.json> [pack.json ...]',
    '',
    'Local/fixture only. --remote is forbidden. The importer never onboards sources,',
    'applies remote migrations, writes claim_verifications, ranks providers or deploys.',
  ].join('\n');
}

function parseCli(argv) {
  if (argv.includes('--remote')) throw new Error('remote_evidence_import_forbidden');
  if (argv.includes('--help') || argv.includes('-h')) return { help: true };

  let local = false;
  let persistTo = null;
  const packFilenames = [];
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === '--local') {
      if (local) throw new Error('evidence_import_local_flag_duplicate');
      local = true;
      continue;
    }
    if (value === '--persist-to') {
      if (persistTo !== null) throw new Error('evidence_import_persist_path_duplicate');
      const next = argv[++index];
      if (!next || next.startsWith('--')) throw new Error('evidence_import_persist_path_required');
      persistTo = next;
      continue;
    }
    if (value.startsWith('--')) throw new Error(`evidence_import_unknown_argument:${value}`);
    packFilenames.push(value);
  }

  if (!local || !persistTo) throw new Error(usage());
  if (packFilenames.length === 0) throw new Error('evidence_import_pack_path_required');
  return {
    help: false,
    persistTo: path.resolve(persistTo),
    packFilenames,
  };
}

async function main() {
  const options = parseCli(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
    return;
  }
  const results = [];
  for (const packFilename of options.packFilenames) {
    results.push(await applyLocalEvidencePackImport({
      persistTo: options.persistTo,
      packFilename,
    }));
  }
  process.stdout.write(`${JSON.stringify({ schemaVersion: 1, results }, null, 2)}\n`);
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}

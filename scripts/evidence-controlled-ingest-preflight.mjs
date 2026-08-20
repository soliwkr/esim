import { spawnSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  packEvidenceArtifactDescriptor,
  rawEvidenceArtifactDescriptor,
  verifyArtifactBytes,
} from './evidence-artifact-storage.mjs';
import {
  buildEvidenceImportModel,
  buildEvidenceImportPlan,
} from './evidence-pack-importer.mjs';
import {
  loadProvisioningPolicy,
  readRemoteR2State,
  validateRemoteState,
} from './evidence-r2-provisioning-gate.mjs';
import {
  loadStagingPolicy,
  readRemoteObject,
} from './evidence-r2-staging-gate.mjs';
import { loadReconciliationManifest } from './evidence-source-reconciliation.mjs';
import { queryRemoteSourceRegistry } from './verify-evidence-source-registry-remote.mjs';

const TARGET_D1_DATABASE = 'senza-roaming';
const TARGET_D1_BINDING = 'DB';
const EXPECTED_LATEST_MIGRATION = '0021_evidence_upstream_storage.sql';
const EXPECTED_MIGRATION_COUNT = 21;
const ALLOWED_COVERAGE_STATES = new Set(['observed', 'partial', 'unknown', 'not_applicable']);
const READ_ONLY_TABLES = Object.freeze([
  'evidence_capture_runs',
  'evidence_snapshots',
  'evidence_field_observations',
  'evidence_claim_candidates',
]);

function requireString(value, label) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${label}_invalid`);
  return value.trim();
}

function parseJsonOutput(stdout, errorCode) {
  const value = stdout.trim();
  if (!value) throw new Error(`${errorCode}:empty_output`);
  try {
    return JSON.parse(value);
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

export function parseD1Rows(payload, errorCode = 'controlled_ingest_d1_results_missing') {
  const arrays = [];
  collectResultArrays(payload, arrays);
  if (arrays.length === 0) throw new Error(`${errorCode}:results_missing`);
  return arrays.flat();
}

function runRemoteSelect(sql, errorCode) {
  if (typeof sql !== 'string' || !/^\s*SELECT\b/i.test(sql)) {
    throw new Error('controlled_ingest_remote_query_must_be_select');
  }
  if (/\b(?:INSERT|UPDATE|DELETE|REPLACE|CREATE|DROP|ALTER|PRAGMA|VACUUM|BEGIN|COMMIT)\b/i.test(sql)) {
    throw new Error('controlled_ingest_remote_query_mutation_forbidden');
  }

  const configPath = process.env.EVIDENCE_CONTROLLED_INGEST_WRANGLER_CONFIG;
  const args = [
    'node_modules/wrangler/bin/wrangler.js',
    'd1',
    'execute',
    configPath ? TARGET_D1_BINDING : TARGET_D1_DATABASE,
    '--remote',
    '--command',
    sql,
    '--json',
  ];
  if (configPath) args.push('--config', configPath);

  const result = spawnSync(process.execPath, args, {
    encoding: 'utf8',
    env: process.env,
    maxBuffer: 25 * 1024 * 1024,
  });
  if (result.status !== 0) {
    const diagnostic = (result.stderr || result.stdout || '').trim();
    throw new Error(`${errorCode}${diagnostic ? `:${diagnostic}` : ''}`);
  }
  return parseD1Rows(parseJsonOutput(result.stdout, errorCode), errorCode);
}

export function queryRemoteEvidenceState() {
  const state = {};
  for (const table of READ_ONLY_TABLES) {
    state[table] = runRemoteSelect(
      `SELECT * FROM ${table} ORDER BY id;`,
      `controlled_ingest_${table}_query_failed`,
    );
  }
  return Object.freeze({
    runs: state.evidence_capture_runs,
    snapshots: state.evidence_snapshots,
    observations: state.evidence_field_observations,
    candidates: state.evidence_claim_candidates,
  });
}

export function queryRemoteMigrationState() {
  return runRemoteSelect(
    'SELECT id, name FROM d1_migrations ORDER BY id;',
    'controlled_ingest_migration_query_failed',
  );
}

export function validateRemoteMigrationState(rows) {
  if (!Array.isArray(rows) || rows.length !== EXPECTED_MIGRATION_COUNT) {
    throw new Error(`controlled_ingest_migration_count_invalid:${rows?.length ?? 'unknown'}`);
  }
  const latest = rows.at(-1);
  if (latest?.name !== EXPECTED_LATEST_MIGRATION) {
    throw new Error(`controlled_ingest_latest_migration_invalid:${latest?.name ?? 'missing'}`);
  }
  return Object.freeze({
    count: rows.length,
    latestId: Number(latest.id),
    latestName: latest.name,
  });
}

async function verifyBucketContract({ fetchImpl, accountId, apiToken, stagingPolicy }) {
  const provisioningPolicy = await loadProvisioningPolicy();
  if (provisioningPolicy.bucketName !== stagingPolicy.bucketName) {
    throw new Error('controlled_ingest_bucket_policy_mismatch');
  }
  const state = await readRemoteR2State({
    fetchImpl,
    accountId,
    apiToken,
    policy: provisioningPolicy,
  });
  const issues = validateRemoteState(state, provisioningPolicy);
  if (issues.length > 0) throw new Error(`controlled_ingest_bucket_contract_invalid:${issues.join(',')}`);
  return Object.freeze({
    bucketName: stagingPolicy.bucketName,
    jurisdiction: state.bucket?.jurisdiction ?? null,
    storageClass: state.bucket?.storageClass ?? null,
    managedPublicAccess: state.managedPublicAccess,
    customDomainCount: Array.isArray(state.customDomains) ? state.customDomains.length : null,
    lockRules: Array.isArray(state.lockRules) ? state.lockRules : [],
  });
}

async function readExactR2Object(fetchImpl, { accountId, apiToken, bucketName, descriptor }) {
  const remote = await readRemoteObject(fetchImpl, {
    accountId,
    apiToken,
    bucketName,
    objectKey: descriptor.objectKey,
  });
  if (!remote.exists) throw new Error(`controlled_ingest_r2_object_missing:${descriptor.objectKey}`);
  verifyArtifactBytes(remote.bytes, descriptor);
  return remote.bytes;
}

export function assertNoForbiddenPriceEurKey(value, location = 'pack') {
  if (Array.isArray(value)) {
    for (const [index, item] of value.entries()) assertNoForbiddenPriceEurKey(item, `${location}[${index}]`);
    return true;
  }
  if (!value || typeof value !== 'object') return true;
  for (const [key, nested] of Object.entries(value)) {
    if (key === 'price_eur') throw new Error(`controlled_ingest_price_eur_key_forbidden:${location}.${key}`);
    assertNoForbiddenPriceEurKey(nested, `${location}.${key}`);
  }
  return true;
}

export function validateApprovedPackForControlledIngest(pack, approvedPack) {
  if (!pack || pack.schemaVersion !== 1) throw new Error('controlled_ingest_pack_schema_invalid');
  if (pack.packId !== approvedPack.packId) throw new Error(`controlled_ingest_pack_id_mismatch:${pack?.packId ?? 'missing'}`);
  if (!Array.isArray(pack.sources) || pack.sources.length < 1) throw new Error('controlled_ingest_pack_sources_missing');
  if (!Array.isArray(pack.offers) || pack.offers.length < 1) throw new Error('controlled_ingest_pack_offers_missing');
  if (pack.ranking?.status !== 'not_computed') throw new Error('controlled_ingest_pack_ranking_must_be_not_computed');
  assertNoForbiddenPriceEurKey(pack);

  for (const offer of pack.offers) {
    if (!offer || typeof offer.offerKey !== 'string' || !offer.offerKey) {
      throw new Error('controlled_ingest_offer_shape_invalid');
    }
    if (!offer.coverage || typeof offer.coverage !== 'object' || Array.isArray(offer.coverage)) {
      throw new Error(`controlled_ingest_offer_coverage_invalid:${offer.offerKey}`);
    }
    if (!Array.isArray(offer.candidates)) throw new Error(`controlled_ingest_offer_candidates_invalid:${offer.offerKey}`);
    for (const [fieldName, coverage] of Object.entries(offer.coverage)) {
      if (!coverage || !ALLOWED_COVERAGE_STATES.has(coverage.state)) {
        throw new Error(`controlled_ingest_coverage_state_invalid:${offer.offerKey}:${fieldName}`);
      }
    }
    for (const candidate of offer.candidates) {
      if (candidate?.status !== 'pending') throw new Error(`controlled_ingest_candidate_not_pending:${offer.offerKey}`);
      if (candidate.fieldName === 'price_eur') throw new Error(`controlled_ingest_price_eur_candidate_forbidden:${offer.offerKey}`);
      if (!Array.isArray(candidate.warnings)) throw new Error(`controlled_ingest_candidate_warnings_invalid:${offer.offerKey}`);
    }
  }
  return true;
}

export function materializeProductionArtifactRefs(model, pack) {
  const sources = new Map(pack.sources.map((source) => [source.sourceKey, source]));
  const snapshots = model.snapshots.map((snapshot) => {
    const source = sources.get(snapshot.pack_source_key);
    if (!source) throw new Error(`controlled_ingest_snapshot_source_missing:${snapshot.pack_source_key}`);
    const descriptor = rawEvidenceArtifactDescriptor(source);
    return Object.freeze({ ...snapshot, artifact_ref: descriptor.artifactRef });
  });
  return Object.freeze({ ...model, snapshots: Object.freeze(snapshots) });
}

export function validateCrossModelIdentity(models) {
  const sets = { run: new Set(), snapshot: new Set(), observation: new Set(), candidate: new Set() };
  for (const model of models) {
    if (sets.run.has(model.run.run_key)) throw new Error(`controlled_ingest_cross_pack_run_collision:${model.run.run_key}`);
    sets.run.add(model.run.run_key);
    for (const [kind, rows, key] of [
      ['snapshot', model.snapshots, 'snapshot_key'],
      ['observation', model.observations, 'observation_key'],
      ['candidate', model.candidates, 'candidate_key'],
    ]) {
      for (const row of rows) {
        if (sets[kind].has(row[key])) throw new Error(`controlled_ingest_cross_pack_${kind}_collision:${row[key]}`);
        sets[kind].add(row[key]);
      }
    }
  }
  return true;
}

export function buildControlledIngestPreflight({ models, remoteState }) {
  if (!Array.isArray(models) || models.length < 1) throw new Error('controlled_ingest_models_missing');
  validateCrossModelIdentity(models);
  const plans = models.map((model) => ({
    packId: model.packId,
    runKey: model.run.run_key,
    ...buildEvidenceImportPlan(model, remoteState),
    artifactRefs: model.snapshots.map((snapshot) => snapshot.artifact_ref).sort(),
  }));
  for (const plan of plans) {
    if (!['insert', 'existing_exact'].includes(plan.action)) {
      throw new Error(`controlled_ingest_plan_action_invalid:${plan.action}`);
    }
  }
  return Object.freeze({
    ready: true,
    plans: Object.freeze(plans),
    plannedInsertTotals: Object.freeze(plans.reduce((totals, plan) => ({
      runs: totals.runs + Number(plan.inserted.runs),
      snapshots: totals.snapshots + Number(plan.inserted.snapshots),
      observations: totals.observations + Number(plan.inserted.observations),
      candidates: totals.candidates + Number(plan.inserted.candidates),
    }), { runs: 0, snapshots: 0, observations: 0, candidates: 0 })),
  });
}

export async function loadApprovedEvidenceFromR2({ fetchImpl = fetch, accountId, apiToken, stagingPolicy }) {
  const packs = [];
  const uniqueObjects = new Map();

  for (const approvedPack of stagingPolicy.approvedPacks) {
    const packDescriptor = packEvidenceArtifactDescriptor({
      packSha256: approvedPack.artifactSha256,
      byteLength: approvedPack.byteLength,
    });
    const packBytes = await readExactR2Object(fetchImpl, {
      accountId,
      apiToken,
      bucketName: stagingPolicy.bucketName,
      descriptor: packDescriptor,
    });
    uniqueObjects.set(packDescriptor.objectKey, packDescriptor);

    let pack;
    try {
      pack = JSON.parse(packBytes.toString('utf8'));
    } catch (error) {
      throw new Error(`controlled_ingest_pack_json_invalid:${error.message}`);
    }
    validateApprovedPackForControlledIngest(pack, approvedPack);

    const artifactsBySourceKey = new Map();
    for (const source of pack.sources) {
      const descriptor = rawEvidenceArtifactDescriptor(source);
      await readExactR2Object(fetchImpl, {
        accountId,
        apiToken,
        bucketName: stagingPolicy.bucketName,
        descriptor,
      });
      uniqueObjects.set(descriptor.objectKey, descriptor);
      artifactsBySourceKey.set(source.sourceKey, Object.freeze({ path: null, ref: descriptor.artifactRef }));
    }

    const verifiedPack = Object.freeze({
      pack,
      packPath: null,
      packSha256: packDescriptor.sha256,
      artifacts: Object.freeze({ artifactDirectory: null, artifactsBySourceKey }),
    });
    packs.push(Object.freeze({ approvedPack, pack, verifiedPack, packDescriptor }));
  }

  if (uniqueObjects.size !== stagingPolicy.expectedUniqueObjectCount) {
    throw new Error(`controlled_ingest_r2_object_count_mismatch:${uniqueObjects.size}`);
  }

  return Object.freeze({
    packs: Object.freeze(packs),
    uniqueObjectCount: uniqueObjects.size,
    objects: Object.freeze([...uniqueObjects.values()].map((descriptor) => Object.freeze({
      objectKey: descriptor.objectKey,
      artifactRef: descriptor.artifactRef,
      sha256: descriptor.sha256,
      byteLength: descriptor.byteLength,
    })).sort((left, right) => left.objectKey.localeCompare(right.objectKey))),
  });
}

export async function loadControlledIngestContext(options = {}) {
  const fetchImpl = options.fetchImpl || fetch;
  const accountId = requireString(options.accountId || process.env.CLOUDFLARE_ACCOUNT_ID, 'cloudflare_account_id');
  const apiToken = requireString(options.apiToken || process.env.CLOUDFLARE_API_TOKEN, 'cloudflare_api_token');
  const stagingPolicy = options.stagingPolicy || await loadStagingPolicy();

  const bucket = await verifyBucketContract({ fetchImpl, accountId, apiToken, stagingPolicy });
  const r2 = await loadApprovedEvidenceFromR2({ fetchImpl, accountId, apiToken, stagingPolicy });
  const reconciliation = await loadReconciliationManifest();
  const registryRows = options.registryRows || queryRemoteSourceRegistry();
  const models = r2.packs.map(({ pack, verifiedPack }) => materializeProductionArtifactRefs(
    buildEvidenceImportModel({ verifiedPack, reconciliation, registryRows }),
    pack,
  ));
  const migration = validateRemoteMigrationState(options.migrationRows || queryRemoteMigrationState());
  const remoteState = options.remoteState || queryRemoteEvidenceState();
  const plan = buildControlledIngestPreflight({ models, remoteState });

  return Object.freeze({
    stagingPolicy,
    bucket,
    r2,
    reconciliation,
    registryRows,
    models,
    migration,
    remoteState,
    plan,
  });
}

export async function runControlledIngestPreflight(options = {}) {
  const context = await loadControlledIngestContext(options);
  const {
    stagingPolicy,
    bucket,
    r2,
    reconciliation,
    registryRows,
    migration,
    remoteState,
    plan,
  } = context;

  return Object.freeze({
    schemaVersion: 1,
    mode: 'read_only_preflight',
    checkedAt: new Date().toISOString(),
    ready: true,
    approval: Object.freeze({
      captureRunId: stagingPolicy.captureRunId,
      artifactId: stagingPolicy.artifactId,
      zipSha256: stagingPolicy.zipSha256,
      approvedPackIds: stagingPolicy.approvedPacks.map((entry) => entry.packId).sort(),
    }),
    bucket,
    r2: Object.freeze({ uniqueObjectCount: r2.uniqueObjectCount, objects: r2.objects }),
    d1: Object.freeze({
      databaseName: TARGET_D1_DATABASE,
      migration,
      sourceRegistryRows: registryRows.length,
      sourceIdentitiesResolved: reconciliation.sources.length,
      existingRows: Object.freeze({
        runs: remoteState.runs.length,
        snapshots: remoteState.snapshots.length,
        observations: remoteState.observations.length,
        candidates: remoteState.candidates.length,
      }),
    }),
    importPlan: plan,
    d1Mutated: false,
    claimsVerified: false,
    affiliateEnabled: false,
    published: false,
    deployed: false,
  });
}

async function main() {
  const outputPath = path.resolve(process.argv[2] || 'artifacts/evidence-controlled-ingest-preflight.json');
  const result = await runControlledIngestPreflight();
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

const invokedAsScript = process.argv[1]
  && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (invokedAsScript) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}

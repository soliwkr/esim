import { spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildEvidenceImportBatchSql,
} from './evidence-pack-importer.mjs';
import {
  loadControlledIngestContext,
} from './evidence-controlled-ingest-preflight.mjs';

const AUTHORIZATION_PATH = 'research/evidence/controlled-ingest-authorization-2026-08-20.json';
const TARGET_D1_BINDING = 'DB';
const EXPECTED_LATEST_MIGRATION = '0021_evidence_upstream_storage.sql';
const EXPECTED_MIGRATION_COUNT = 21;
const EXPECTED_R2_OBJECTS = 13;
const EXPECTED_SOURCE_REGISTRY_ROWS = 15;
const EXPECTED_SOURCE_IDENTITIES = 9;
const ALLOWED_WRITE_TABLES = Object.freeze([
  'evidence_capture_runs',
  'evidence_snapshots',
  'evidence_field_observations',
  'evidence_claim_candidates',
]);

export const EXPECTED_AUTHORIZATION = Object.freeze({
  schemaVersion: 1,
  confirmation: 'APPLY_APPROVED_EVIDENCE_CONTROLLED_INGEST',
  authorizedBaseSha: '678cf831e6bd5cbe98a5f3581f0c18a1b02d1374',
  canonicalPreflightHead: '704b50cf82588c6fcde6d288f54e9392c1f64865',
  canonicalPreflightRunId: 32391428886,
  canonicalPreflightArtifactId: 9415005079,
  canonicalPreflightArtifactSha256: 'sha256:b4c09892790c94af2dabf256e882b829cc816f318b7b1c124cad0e2fc6ba24b9',
  captureRunId: 31623841563,
  artifactId: 9152309259,
  zipSha256: 'sha256:f539220dccb16ad5b66b67755f2447127e80b10a4e6697a4161b92b4f1af4d84',
  approvedPackIds: Object.freeze([
    'pack:sha256:90f364863edc735072a7793278f02faa2600ccf441374e6209e4915abc9cf2bf',
    'pack:sha256:fe81e66c376a318b3f3ee35da2f81c49a433d5c141726225dc98e297c09935ae',
  ]),
  expectedExistingRows: Object.freeze({ runs: 0, snapshots: 0, observations: 0, candidates: 0 }),
  expectedInsertTotals: Object.freeze({ runs: 2, snapshots: 12, observations: 72, candidates: 52 }),
  remoteWriteAuthorized: true,
  sourceRegistryWriteAuthorized: false,
  claimVerificationAuthorized: false,
  affiliateActivationAuthorized: false,
  publicationAuthorized: false,
  deployAuthorized: false,
});

function assertExactValue(actual, expected, label) {
  if (Array.isArray(expected)) {
    if (!Array.isArray(actual) || actual.length !== expected.length) throw new Error(`${label}_mismatch`);
    expected.forEach((value, index) => assertExactValue(actual[index], value, `${label}_${index}`));
    return;
  }
  if (expected && typeof expected === 'object') {
    if (!actual || typeof actual !== 'object' || Array.isArray(actual)) throw new Error(`${label}_mismatch`);
    const actualKeys = Object.keys(actual).sort();
    const expectedKeys = Object.keys(expected).sort();
    if (JSON.stringify(actualKeys) !== JSON.stringify(expectedKeys)) throw new Error(`${label}_keys_mismatch`);
    for (const key of expectedKeys) assertExactValue(actual[key], expected[key], `${label}_${key}`);
    return;
  }
  if (actual !== expected) throw new Error(`${label}_mismatch`);
}

export function validateControlledIngestAuthorization(authorization) {
  assertExactValue(authorization, EXPECTED_AUTHORIZATION, 'controlled_ingest_authorization');
  return true;
}

export async function loadControlledIngestAuthorization() {
  const authorization = JSON.parse(await readFile(AUTHORIZATION_PATH, 'utf8'));
  validateControlledIngestAuthorization(authorization);
  return Object.freeze(authorization);
}

function stateCounts(state) {
  return Object.freeze({
    runs: state.runs.length,
    snapshots: state.snapshots.length,
    observations: state.observations.length,
    candidates: state.candidates.length,
  });
}

function assertApprovedContext(context, authorization) {
  assertExactValue(
    context.stagingPolicy.approvedPacks.map((entry) => entry.packId).sort(),
    [...authorization.approvedPackIds].sort(),
    'controlled_ingest_approved_pack_ids',
  );
  if (context.stagingPolicy.captureRunId !== authorization.captureRunId) {
    throw new Error('controlled_ingest_capture_run_mismatch');
  }
  if (context.stagingPolicy.artifactId !== authorization.artifactId) {
    throw new Error('controlled_ingest_artifact_id_mismatch');
  }
  if (context.stagingPolicy.zipSha256 !== authorization.zipSha256) {
    throw new Error('controlled_ingest_zip_sha256_mismatch');
  }
  if (context.r2.uniqueObjectCount !== EXPECTED_R2_OBJECTS) {
    throw new Error('controlled_ingest_r2_object_count_invalid');
  }
  if (context.registryRows.length !== EXPECTED_SOURCE_REGISTRY_ROWS
      || context.reconciliation.sources.length !== EXPECTED_SOURCE_IDENTITIES) {
    throw new Error('controlled_ingest_source_state_invalid');
  }
  if (context.migration.count !== EXPECTED_MIGRATION_COUNT
      || context.migration.latestName !== EXPECTED_LATEST_MIGRATION) {
    throw new Error('controlled_ingest_migration_state_invalid');
  }
}

export function validateControlledIngestPreWrite(context, authorization) {
  validateControlledIngestAuthorization(authorization);
  assertApprovedContext(context, authorization);
  assertExactValue(
    stateCounts(context.remoteState),
    authorization.expectedExistingRows,
    'controlled_ingest_existing_rows',
  );
  assertExactValue(
    context.plan.plannedInsertTotals,
    authorization.expectedInsertTotals,
    'controlled_ingest_insert_totals',
  );
  if (context.plan.plans.length !== authorization.approvedPackIds.length
      || context.plan.plans.some((plan) => plan.action !== 'insert')) {
    throw new Error('controlled_ingest_prewrite_plan_invalid');
  }
  return true;
}

export function validateControlledIngestPostWrite(context, authorization) {
  validateControlledIngestAuthorization(authorization);
  assertApprovedContext(context, authorization);
  assertExactValue(
    stateCounts(context.remoteState),
    authorization.expectedInsertTotals,
    'controlled_ingest_postwrite_rows',
  );
  assertExactValue(
    context.plan.plannedInsertTotals,
    { runs: 0, snapshots: 0, observations: 0, candidates: 0 },
    'controlled_ingest_postwrite_insert_totals',
  );
  if (context.plan.plans.length !== authorization.approvedPackIds.length
      || context.plan.plans.some((plan) => plan.action !== 'existing_exact')) {
    throw new Error('controlled_ingest_postwrite_plan_invalid');
  }
  return true;
}

function countMatches(sql, table) {
  return [...sql.matchAll(new RegExp(`\\bINSERT\\s+INTO\\s+${table}\\b`, 'gi'))].length;
}

export function validateControlledIngestSql(sql, authorization) {
  if (typeof sql !== 'string' || !sql.trim()) throw new Error('controlled_ingest_sql_missing');
  if (/(?:^|\n)\s*(?:UPDATE|DELETE|REPLACE|CREATE|DROP|ALTER|PRAGMA|VACUUM|BEGIN|COMMIT|ATTACH|DETACH)\b/i.test(sql)) {
    throw new Error('controlled_ingest_sql_forbidden_statement');
  }
  const insertTargets = [...sql.matchAll(/\bINSERT\s+INTO\s+([a-z_][a-z0-9_]*)/gi)]
    .map((match) => match[1].toLowerCase());
  if (insertTargets.length < 1 || insertTargets.some((table) => !ALLOWED_WRITE_TABLES.includes(table))) {
    throw new Error('controlled_ingest_sql_target_invalid');
  }
  const counts = Object.freeze({
    runs: countMatches(sql, 'evidence_capture_runs'),
    snapshots: countMatches(sql, 'evidence_snapshots'),
    observations: countMatches(sql, 'evidence_field_observations'),
    candidates: countMatches(sql, 'evidence_claim_candidates'),
  });
  assertExactValue(counts, authorization.expectedInsertTotals, 'controlled_ingest_sql_insert_counts');
  if (insertTargets.length !== Object.values(counts).reduce((sum, count) => sum + count, 0)) {
    throw new Error('controlled_ingest_sql_statement_count_invalid');
  }
  return Object.freeze({ insertTargets: Object.freeze(insertTargets), counts });
}

function buildBatchSql(context) {
  const entries = context.models.map((model, index) => ({
    model,
    plan: context.plan.plans[index],
  }));
  return buildEvidenceImportBatchSql(entries);
}

async function executeRemoteBatch(sql) {
  const configPath = process.env.EVIDENCE_CONTROLLED_INGEST_WRANGLER_CONFIG;
  if (!configPath) throw new Error('controlled_ingest_wrangler_config_required');
  const temporaryDirectory = await mkdtemp(path.join(tmpdir(), 'senza-roaming-controlled-ingest-'));
  const sqlPath = path.join(temporaryDirectory, 'bounded-ingest.sql');
  try {
    await writeFile(sqlPath, `${sql.trim()}\n`, { encoding: 'utf8', mode: 0o600 });
    const result = spawnSync(process.execPath, [
      'node_modules/wrangler/bin/wrangler.js',
      'd1',
      'execute',
      TARGET_D1_BINDING,
      '--remote',
      '--file',
      sqlPath,
      '--json',
      '--config',
      configPath,
    ], {
      encoding: 'utf8',
      env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' },
      maxBuffer: 25 * 1024 * 1024,
    });
    if (result.status !== 0) {
      const diagnostic = (result.stderr || result.stdout || '').trim();
      throw new Error(`controlled_ingest_remote_batch_failed${diagnostic ? `:${diagnostic}` : ''}`);
    }
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
}

function auditBase(mode, authorization, context) {
  return {
    schemaVersion: 1,
    mode,
    checkedAt: new Date().toISOString(),
    authorization: {
      confirmation: authorization.confirmation,
      authorizedBaseSha: authorization.authorizedBaseSha,
      canonicalPreflightHead: authorization.canonicalPreflightHead,
      canonicalPreflightRunId: authorization.canonicalPreflightRunId,
      approvedPackIds: authorization.approvedPackIds,
    },
    r2: { uniqueObjectCount: context.r2.uniqueObjectCount },
    d1: {
      migration: context.migration,
      sourceRegistryRows: context.registryRows.length,
      sourceIdentitiesResolved: context.reconciliation.sources.length,
      rows: stateCounts(context.remoteState),
    },
    plans: context.plan.plans.map((plan) => ({
      packId: plan.packId,
      runKey: plan.runKey,
      action: plan.action,
      inserted: plan.inserted,
    })),
    plannedInsertTotals: context.plan.plannedInsertTotals,
    claimsVerified: false,
    affiliateEnabled: false,
    published: false,
    deployed: false,
  };
}

async function runMode(mode) {
  const authorization = await loadControlledIngestAuthorization();
  const before = await loadControlledIngestContext();
  if (mode === 'preflight') {
    validateControlledIngestPreWrite(before, authorization);
    return Object.freeze({
      ...auditBase('controlled_ingest_authorized_preflight', authorization, before),
      ready: true,
      d1Mutated: false,
    });
  }
  if (mode === 'verify') {
    validateControlledIngestPostWrite(before, authorization);
    return Object.freeze({
      ...auditBase('controlled_ingest_postwrite_verify', authorization, before),
      ready: true,
      d1Mutated: true,
      exactExistingImport: true,
    });
  }
  if (mode !== 'execute') throw new Error('controlled_ingest_mode_invalid');

  validateControlledIngestPreWrite(before, authorization);
  const sql = buildBatchSql(before);
  const sqlContract = validateControlledIngestSql(sql, authorization);
  await executeRemoteBatch(sql);
  const after = await loadControlledIngestContext();
  validateControlledIngestPostWrite(after, authorization);
  return Object.freeze({
    ...auditBase('controlled_ingest_execute', authorization, after),
    ready: true,
    executedAt: new Date().toISOString(),
    executed: true,
    d1Mutated: true,
    inserted: authorization.expectedInsertTotals,
    sqlContract: { statementCount: sqlContract.insertTargets.length, counts: sqlContract.counts },
    exactExistingImport: true,
  });
}

function outputPath(value) {
  const absolute = path.resolve(value || '');
  const relative = path.relative(process.cwd(), absolute).split(path.sep).join('/');
  if (!relative.startsWith('artifacts/') || relative.includes('../')) {
    throw new Error('controlled_ingest_output_must_be_artifacts_path');
  }
  return absolute;
}

async function main() {
  const mode = process.argv[2];
  const target = outputPath(process.argv[3]);
  const result = await runMode(mode);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
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

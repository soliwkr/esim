import assert from 'node:assert/strict';
import { readdir, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const EXPECTED_MIGRATION = '0021_evidence_upstream_storage.sql';
const EXPECTED_TABLES = Object.freeze([
  'evidence_capture_runs',
  'evidence_snapshots',
  'evidence_field_observations',
  'evidence_claim_candidates',
]);
const EXPECTED_INDEXES = Object.freeze([
  'idx_evidence_capture_runs_scenario',
  'idx_evidence_capture_runs_semantic',
  'idx_evidence_snapshots_run_source',
  'idx_evidence_snapshots_source',
  'idx_evidence_field_observations_subject',
  'idx_evidence_field_observations_snapshot',
  'idx_evidence_claim_candidates_status',
]);
const EXPECTED_TRIGGERS = Object.freeze([
  'trg_evidence_claim_candidate_eligible_insert',
  'trg_evidence_claim_candidate_eligible_update',
  'trg_evidence_claim_candidate_identity_immutable',
  'trg_evidence_capture_runs_immutable_update',
  'trg_evidence_capture_runs_immutable_delete',
  'trg_evidence_snapshots_immutable_update',
  'trg_evidence_snapshots_immutable_delete',
  'trg_evidence_field_observations_immutable_update',
  'trg_evidence_field_observations_immutable_delete',
]);

function fail(code, details = {}) {
  const error = new Error(code);
  error.code = code;
  error.details = details;
  throw error;
}

function collectResultRows(value, rows = []) {
  if (!value || typeof value !== 'object') return rows;
  if (Array.isArray(value)) {
    for (const item of value) collectResultRows(item, rows);
    return rows;
  }
  if (Array.isArray(value.results)) rows.push(...value.results);
  for (const nested of Object.values(value)) collectResultRows(nested, rows);
  return rows;
}

function parseWranglerRows(stdout) {
  let parsed;
  try {
    parsed = JSON.parse(stdout);
  } catch {
    fail('wrangler_json_invalid');
  }
  return collectResultRows(parsed);
}

function runWrangler(configPath, sql) {
  const wranglerPath = path.join('node_modules', 'wrangler', 'bin', 'wrangler.js');
  const result = spawnSync(process.execPath, [
    wranglerPath,
    'd1', 'execute', 'DB',
    '--remote',
    '--config', configPath,
    '--command', sql,
    '--json',
  ], {
    encoding: 'utf8',
    env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' },
    maxBuffer: 20 * 1024 * 1024,
  });
  if (result.status !== 0) {
    fail('wrangler_remote_query_failed', {
      status: result.status,
      stderr: result.stderr?.trim() || '',
      stdout: result.stdout?.trim() || '',
    });
  }
  return parseWranglerRows(result.stdout);
}

async function localMigrationNames() {
  const names = (await readdir('migrations'))
    .filter((name) => /^\d{4}_.+\.sql$/.test(name))
    .sort();
  if (!names.includes(EXPECTED_MIGRATION)) fail('expected_migration_missing');
  if (names.at(-1) !== EXPECTED_MIGRATION) {
    fail('unexpected_migration_after_0021', { last: names.at(-1) });
  }
  return names;
}

function normalizeNames(rows, field) {
  return rows
    .map((row) => row?.[field])
    .filter((value) => typeof value === 'string')
    .sort();
}

function assertExact(actual, expected, code) {
  if (actual.length !== expected.length || actual.some((value, index) => value !== expected[index])) {
    fail(code, { actual, expected });
  }
}

export function evaluatePreflight({ localMigrations, appliedMigrations }) {
  const expectedApplied = localMigrations.slice(0, -1);
  const pending = localMigrations.filter((name) => !appliedMigrations.includes(name));
  assertExact([...appliedMigrations].sort(), [...expectedApplied].sort(), 'remote_migration_state_mismatch');
  assertExact(pending, [EXPECTED_MIGRATION], 'remote_pending_migrations_not_exact_0021');
  return {
    targetMigration: EXPECTED_MIGRATION,
    appliedCount: appliedMigrations.length,
    pending,
    readyToApply: true,
  };
}

export function evaluatePostApply({ localMigrations, appliedMigrations, objects }) {
  assertExact([...appliedMigrations].sort(), [...localMigrations].sort(), 'remote_migration_apply_incomplete');
  assertExact([...objects.tables].sort(), [...EXPECTED_TABLES].sort(), 'remote_evidence_tables_mismatch');
  assertExact([...objects.indexes].sort(), [...EXPECTED_INDEXES].sort(), 'remote_evidence_indexes_mismatch');
  assertExact([...objects.triggers].sort(), [...EXPECTED_TRIGGERS].sort(), 'remote_evidence_triggers_mismatch');
  return {
    targetMigration: EXPECTED_MIGRATION,
    appliedCount: appliedMigrations.length,
    tables: objects.tables.length,
    indexes: objects.indexes.length,
    triggers: objects.triggers.length,
    verified: true,
  };
}

async function writeArtifact(outputPath, payload) {
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

async function remoteAppliedMigrations(configPath) {
  const rows = runWrangler(configPath, 'SELECT name FROM d1_migrations ORDER BY id ASC;');
  return normalizeNames(rows, 'name');
}

async function remoteEvidenceObjects(configPath) {
  const quoted = [...EXPECTED_TABLES, ...EXPECTED_INDEXES, ...EXPECTED_TRIGGERS]
    .map((name) => `'${name.replaceAll("'", "''")}'`)
    .join(',');
  const rows = runWrangler(
    configPath,
    `SELECT type, name FROM sqlite_master WHERE name IN (${quoted}) ORDER BY type, name;`,
  );
  return {
    tables: rows.filter((row) => row.type === 'table').map((row) => row.name).sort(),
    indexes: rows.filter((row) => row.type === 'index').map((row) => row.name).sort(),
    triggers: rows.filter((row) => row.type === 'trigger').map((row) => row.name).sort(),
  };
}

async function selfTest() {
  const localMigrations = ['0019_example.sql', '0020_example.sql', EXPECTED_MIGRATION];
  assert.deepEqual(
    evaluatePreflight({ localMigrations, appliedMigrations: ['0019_example.sql', '0020_example.sql'] }),
    {
      targetMigration: EXPECTED_MIGRATION,
      appliedCount: 2,
      pending: [EXPECTED_MIGRATION],
      readyToApply: true,
    },
  );
  assert.throws(
    () => evaluatePreflight({ localMigrations, appliedMigrations: ['0019_example.sql'] }),
    /remote_migration_state_mismatch/,
  );
  assert.throws(
    () => evaluatePreflight({ localMigrations: [...localMigrations, '0022_unexpected.sql'], appliedMigrations: ['0019_example.sql', '0020_example.sql'] }),
    /remote_migration_state_mismatch|remote_pending_migrations_not_exact_0021/,
  );
  const post = evaluatePostApply({
    localMigrations,
    appliedMigrations: localMigrations,
    objects: {
      tables: [...EXPECTED_TABLES],
      indexes: [...EXPECTED_INDEXES],
      triggers: [...EXPECTED_TRIGGERS],
    },
  });
  assert.equal(post.verified, true);
  console.log('Evidence remote 0021 gate self-test: ok');
}

async function main() {
  const [mode, outputPath = 'artifacts/evidence-remote-0021-gate.json'] = process.argv.slice(2);
  if (mode === '--self-test') return selfTest();
  if (!['preflight', 'verify'].includes(mode)) fail('usage_error');
  const configPath = process.env.EVIDENCE_REMOTE_WRANGLER_CONFIG;
  if (!configPath) fail('missing_remote_wrangler_config');
  const localMigrations = await localMigrationNames();
  const appliedMigrations = await remoteAppliedMigrations(configPath);
  const base = {
    checkedAt: new Date().toISOString(),
    repositorySha: process.env.GITHUB_SHA || null,
    localMigrationCount: localMigrations.length,
    appliedMigrations,
  };
  const result = mode === 'preflight'
    ? evaluatePreflight({ localMigrations, appliedMigrations })
    : evaluatePostApply({
      localMigrations,
      appliedMigrations,
      objects: await remoteEvidenceObjects(configPath),
    });
  await writeArtifact(outputPath, { ...base, mode, ...result });
  console.log(JSON.stringify({ ...base, mode, ...result }, null, 2));
}

main().catch((error) => {
  console.error(JSON.stringify({
    ok: false,
    code: error.code || error.message,
    details: error.details || null,
  }, null, 2));
  process.exit(1);
});

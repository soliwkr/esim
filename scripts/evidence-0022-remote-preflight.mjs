import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile, appendFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadControlledIngestContext, parseD1Rows } from './evidence-controlled-ingest-preflight.mjs';
import {
  buildSourceOnboardingPlan,
  loadSourceOnboardingIntents,
} from './evidence-source-registry-onboarding.mjs';

const TARGET_D1_DATABASE = 'senza-roaming';
const TARGET_D1_BINDING = 'DB';
const PRODUCTION_ORIGIN = 'https://senzaroaming.it';
const EXPECTED_REMOTE_MIGRATION = '0021_evidence_upstream_storage.sql';
const EXPECTED_PENDING_MIGRATION = '0022_evidence_verification_provenance.sql';
const EXPECTED_REMOTE_MIGRATION_COUNT = 21;
const EXPECTED_0021_SCHEMA_SHA256 = '5bc83d6bc694dce9c9ecaec6b303365bd0952c49f98232e6c70050ce1f0fd5cb';
const EXPECTED_SOURCE_REGISTRY_ROWS = 15;
const EXPECTED_SOURCE_IDENTITIES = 9;
const EXPECTED_UPSTREAM_COUNTS = Object.freeze({
  runs: 2,
  snapshots: 12,
  observations: 72,
  candidates: 52,
});

const EXPECTED_0021_COLUMNS = Object.freeze({
  evidence_capture_runs: Object.freeze([
    'id', 'run_key', 'pack_schema_version', 'scenario_key', 'scenario_json',
    'started_at', 'completed_at', 'capture_window_ms', 'source_count',
    'pack_sha256', 'semantic_fingerprint', 'baseline_run_key', 'created_at',
  ]),
  evidence_snapshots: Object.freeze([
    'id', 'snapshot_key', 'capture_run_id', 'source_id', 'source_audit_key',
    'requested_url', 'final_url', 'redirect_chain_json', 'fetched_at',
    'http_status', 'content_type', 'capture_method', 'locale',
    'currency_context', 'country_context', 'capture_context_json', 'http_etag',
    'http_last_modified', 'body_sha256', 'visible_text_sha256', 'byte_length',
    'artifact_ref', 'parser_input_version', 'capture_warnings_json', 'created_at',
  ]),
  evidence_field_observations: Object.freeze([
    'id', 'observation_key', 'snapshot_id', 'subject_type', 'subject_key',
    'provider_plan_key', 'field_name', 'scope_json', 'coverage_state',
    'raw_value_json', 'normalized_value_json', 'evidence_locator_json',
    'extractor_id', 'extractor_version', 'normalizer_version', 'schema_version',
    'source_role', 'extraction_confidence', 'warnings_json', 'observed_at',
    'proposed_valid_until', 'created_at',
  ]),
  evidence_claim_candidates: Object.freeze([
    'id', 'candidate_key', 'observation_id', 'status', 'decision_actor',
    'decision_notes', 'decided_at', 'created_at', 'updated_at',
  ]),
});

const PROTECTED_TABLES = Object.freeze([
  'source_registry',
  'plans',
  'claim_verifications',
  'pages',
  'outbound_clicks',
]);

function contract(condition, errorCode) {
  if (!condition) throw new Error(errorCode);
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]),
  );
}

export function stableDigest(value) {
  return createHash('sha256')
    .update(JSON.stringify(canonicalize(value)))
    .digest('hex');
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

export function assertSelectOnly(sql) {
  contract(typeof sql === 'string' && /^\s*SELECT\b/i.test(sql), 'evidence_0022_query_must_be_select');
  contract(!/--|\/\*/.test(sql), 'evidence_0022_query_comment_forbidden');
  contract(
    !/\b(?:INSERT|UPDATE|DELETE|REPLACE|CREATE|DROP|ALTER|VACUUM|BEGIN|COMMIT|ATTACH|DETACH)\b/i.test(sql),
    'evidence_0022_query_mutation_forbidden',
  );
  const statements = sql.split(';').map((part) => part.trim()).filter(Boolean);
  contract(statements.length === 1, 'evidence_0022_query_statement_count_invalid');
  return true;
}

function runRemoteSelect(sql, errorCode) {
  assertSelectOnly(sql);
  const configPath = process.env.EVIDENCE_0022_PREFLIGHT_WRANGLER_CONFIG;
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

export function parseMigrationObjects(sql) {
  const objects = [];
  const pattern = /CREATE\s+(TABLE|INDEX|TRIGGER|VIEW)\s+IF\s+NOT\s+EXISTS\s+([a-z0-9_]+)/gi;
  for (const match of sql.matchAll(pattern)) {
    objects.push(Object.freeze({ type: match[1].toLowerCase(), name: match[2] }));
  }
  return Object.freeze(objects.sort((left, right) => (
    `${left.type}:${left.name}`.localeCompare(`${right.type}:${right.name}`)
  )));
}

export function validateMigrationInventory(remoteRows, localMigrationNames) {
  contract(Array.isArray(remoteRows), 'evidence_0022_remote_migrations_invalid');
  contract(remoteRows.length === EXPECTED_REMOTE_MIGRATION_COUNT, 'evidence_0022_remote_migration_count_invalid');
  contract(remoteRows.at(-1)?.name === EXPECTED_REMOTE_MIGRATION, 'evidence_0022_remote_latest_migration_invalid');
  const remoteNames = remoteRows.map((row) => row.name);
  const pending = localMigrationNames.filter((name) => !remoteNames.includes(name));
  const unexpectedRemote = remoteNames.filter((name) => !localMigrationNames.includes(name));
  contract(unexpectedRemote.length === 0, 'evidence_0022_unexpected_remote_migration');
  contract(pending.length === 1 && pending[0] === EXPECTED_PENDING_MIGRATION, 'evidence_0022_pending_migration_set_invalid');
  contract(
    remoteNames.every((name, index) => localMigrationNames[index] === name),
    'evidence_0022_remote_migration_order_invalid',
  );
  return Object.freeze({
    count: remoteRows.length,
    latestId: Number(remoteRows.at(-1).id),
    latestName: remoteRows.at(-1).name,
    pending: Object.freeze(pending),
  });
}

export function validateSchemaState({
  expected0021Objects,
  remote0021Objects,
  columns,
  provenanceObjects,
  expected0021Digest = EXPECTED_0021_SCHEMA_SHA256,
}) {
  const expectedNames = expected0021Objects.map((entry) => `${entry.type}:${entry.name}`).sort();
  const remoteNames = remote0021Objects.map((entry) => `${entry.type}:${entry.name}`).sort();
  contract(JSON.stringify(remoteNames) === JSON.stringify(expectedNames), 'evidence_0022_remote_0021_objects_invalid');
  contract(stableDigest(remote0021Objects) === expected0021Digest, 'evidence_0022_remote_0021_schema_digest_invalid');
  for (const [table, expectedColumns] of Object.entries(EXPECTED_0021_COLUMNS)) {
    contract(
      JSON.stringify(columns[table]) === JSON.stringify(expectedColumns),
      `evidence_0022_remote_columns_invalid:${table}`,
    );
  }
  contract(provenanceObjects.length === 0, 'evidence_0022_provenance_objects_already_present');
  return true;
}

export function validateUpstreamState(context) {
  const counts = Object.freeze({
    runs: context.remoteState.runs.length,
    snapshots: context.remoteState.snapshots.length,
    observations: context.remoteState.observations.length,
    candidates: context.remoteState.candidates.length,
  });
  contract(JSON.stringify(counts) === JSON.stringify(EXPECTED_UPSTREAM_COUNTS), 'evidence_0022_upstream_counts_invalid');
  contract(
    context.remoteState.candidates.every((candidate) => (
      candidate.status === 'pending'
      && candidate.decision_actor === null
      && candidate.decision_notes === ''
      && candidate.decided_at === null
    )),
    'evidence_0022_candidate_state_invalid',
  );
  contract(context.plan.plans.length === 2, 'evidence_0022_pack_plan_count_invalid');
  contract(context.plan.plans.every((plan) => plan.action === 'existing_exact'), 'evidence_0022_pack_not_existing_exact');
  contract(
    Object.values(context.plan.plannedInsertTotals).every((value) => value === 0),
    'evidence_0022_pending_upstream_inserts_nonzero',
  );
  return counts;
}

function queryObjectState(names, errorCode) {
  const sqlNames = names.map((name) => `'${name.replaceAll("'", "''")}'`).join(',');
  return runRemoteSelect(
    `SELECT type, name, sql FROM sqlite_schema WHERE name IN (${sqlNames}) ORDER BY type, name;`,
    errorCode,
  );
}

function queryColumns(table) {
  return runRemoteSelect(
    `SELECT name FROM pragma_table_info('${table}') ORDER BY cid;`,
    `evidence_0022_${table}_columns_query_failed`,
  ).map((row) => row.name);
}

function queryProtectedTables() {
  return Object.fromEntries(PROTECTED_TABLES.map((table) => [
    table,
    runRemoteSelect(`SELECT * FROM ${table} ORDER BY id;`, `evidence_0022_${table}_query_failed`),
  ]));
}

export function summarizeProtectedTables(tables) {
  return Object.fromEntries(PROTECTED_TABLES.map((table) => [table, Object.freeze({
    rows: tables[table].length,
    sha256: stableDigest(tables[table]),
  })]));
}

export function assertProtectedTablesUnchanged(before, after) {
  for (const table of PROTECTED_TABLES) {
    contract(
      stableDigest(before[table]) === stableDigest(after[table]),
      `evidence_0022_protected_table_changed:${table}`,
    );
  }
  return true;
}

async function validateSourceConfiguration() {
  const source = await readFile('wrangler.jsonc', 'utf8');
  contract(/"AFFILIATE_MODE"\s*:\s*"disabled"/.test(source), 'evidence_0022_source_affiliate_mode_invalid');
  return true;
}

async function snapshotResponse(pathname, options = {}) {
  const response = await fetch(new URL(pathname, `${PRODUCTION_ORIGIN}/`), {
    redirect: 'manual',
    ...options,
  });
  return Object.freeze({
    status: response.status,
    location: response.headers.get('location'),
    cacheControl: response.headers.get('cache-control'),
    robots: response.headers.get('x-robots-tag'),
    body: await response.text(),
  });
}

async function validateLiveBoundary() {
  const [health, canonical, preview, goProbe] = await Promise.all([
    snapshotResponse('/api/health'),
    snapshotResponse('/migliore-esim'),
    snapshotResponse('/astro-foundation/articoli/migliore-esim'),
    snapshotResponse('/go/evidence-0022-preflight-nonexistent'),
  ]);
  let healthJson;
  try {
    healthJson = JSON.parse(health.body);
  } catch (error) {
    throw new Error(`evidence_0022_health_json_invalid:${error.message}`);
  }
  contract(health.status === 200 && healthJson.affiliateMode === 'disabled', 'evidence_0022_live_affiliate_mode_invalid');
  contract(canonical.status === 200, 'evidence_0022_canonical_money_page_unavailable');
  contract(/i link ai provider non sono attualmente remunerati/i.test(canonical.body), 'evidence_0022_canonical_affiliate_disclosure_invalid');
  contract(preview.status === 200, 'evidence_0022_preview_unavailable');
  contract(preview.cacheControl?.toLowerCase().includes('no-store'), 'evidence_0022_preview_cache_invalid');
  contract(preview.robots?.toLowerCase().includes('noindex'), 'evidence_0022_preview_indexability_invalid');
  contract(goProbe.status === 404 && !goProbe.location, 'evidence_0022_go_probe_unexpectedly_live');
  return Object.freeze({
    origin: PRODUCTION_ORIGIN,
    affiliateMode: healthJson.affiliateMode,
    canonicalProviderNeutral: true,
    previewNoindexNoStore: true,
    goNonexistentProbeStatus: goProbe.status,
    goNonexistentProbeRedirected: false,
    moneyReadyDeploymentObserved: false,
  });
}

function objectCounts(objects) {
  const counts = { tables: 0, indexes: 0, triggers: 0, views: 0 };
  for (const object of objects) {
    if (object.type === 'table') counts.tables += 1;
    if (object.type === 'index') counts.indexes += 1;
    if (object.type === 'trigger') counts.triggers += 1;
    if (object.type === 'view') counts.views += 1;
  }
  return Object.freeze(counts);
}

export async function runEvidence0022RemotePreflight() {
  await validateSourceConfiguration();
  const [migration0021Sql, migration0022Sql, migrationFiles] = await Promise.all([
    readFile('migrations/0021_evidence_upstream_storage.sql', 'utf8'),
    readFile('migrations/0022_evidence_verification_provenance.sql', 'utf8'),
    readdir('migrations'),
  ]);
  const localMigrationNames = migrationFiles.filter((name) => /^\d{4}_.+\.sql$/.test(name)).sort();
  const expected0021Objects = parseMigrationObjects(migration0021Sql);
  const expected0022Objects = parseMigrationObjects(migration0022Sql);
  contract(expected0021Objects.length === 20, 'evidence_0022_local_0021_object_count_invalid');
  contract(expected0022Objects.length === 27, 'evidence_0022_local_0022_object_count_invalid');

  const protectedBefore = queryProtectedTables();
  const migrationRows = runRemoteSelect(
    'SELECT id, name FROM d1_migrations ORDER BY id;',
    'evidence_0022_migration_query_failed',
  );
  const migration = validateMigrationInventory(migrationRows, localMigrationNames);
  const remote0021Objects = queryObjectState(
    expected0021Objects.map((entry) => entry.name),
    'evidence_0022_remote_0021_schema_query_failed',
  );
  const provenanceObjects = queryObjectState(
    expected0022Objects.map((entry) => entry.name),
    'evidence_0022_remote_provenance_schema_query_failed',
  );
  const columns = Object.fromEntries(
    Object.keys(EXPECTED_0021_COLUMNS).map((table) => [table, queryColumns(table)]),
  );
  validateSchemaState({ expected0021Objects, remote0021Objects, columns, provenanceObjects });

  const context = await loadControlledIngestContext();
  const counts = validateUpstreamState(context);
  contract(context.registryRows.length === EXPECTED_SOURCE_REGISTRY_ROWS, 'evidence_0022_source_registry_count_invalid');
  contract(context.reconciliation.sources.length === EXPECTED_SOURCE_IDENTITIES, 'evidence_0022_source_identity_count_invalid');
  const onboarding = await loadSourceOnboardingIntents(undefined, context.reconciliation);
  const sourcePlan = buildSourceOnboardingPlan(onboarding, protectedBefore.source_registry);
  contract(
    sourcePlan.counts.existingExact === onboarding.intents.length
      && sourcePlan.counts.insert === 0
      && sourcePlan.counts.blocked === 0,
    'evidence_0022_source_registry_drift',
  );

  const live = await validateLiveBoundary();
  const protectedAfter = queryProtectedTables();
  assertProtectedTablesUnchanged(protectedBefore, protectedAfter);

  const state = Object.freeze({
    migration,
    schema: Object.freeze({
      current0021ObjectCounts: objectCounts(expected0021Objects),
      current0021Sha256: stableDigest(remote0021Objects),
      current0021ColumnsSha256: stableDigest(columns),
      provenanceObjectsPresent: provenanceObjects.length,
    }),
    sourceRegistry: Object.freeze({
      rows: context.registryRows.length,
      sha256: stableDigest(protectedBefore.source_registry),
      onboardingIntents: onboarding.intents.length,
      existingExact: sourcePlan.counts.existingExact,
      identitiesResolved: context.reconciliation.sources.length,
      identitiesExpected: EXPECTED_SOURCE_IDENTITIES,
    }),
    r2: Object.freeze({
      bucketName: context.bucket.bucketName,
      uniqueObjectsVerified: context.r2.uniqueObjectCount,
      objectsSha256: stableDigest(context.r2.objects),
    }),
    upstreamEvidence: Object.freeze({
      ...counts,
      candidateStatus: 'pending',
      candidateDecisionMetadataEmpty: true,
      packActions: context.plan.plans.map((plan) => Object.freeze({ packId: plan.packId, action: plan.action })),
      pendingInserts: context.plan.plannedInsertTotals,
    }),
    protectedTables: Object.freeze({
      before: summarizeProtectedTables(protectedBefore),
      after: summarizeProtectedTables(protectedAfter),
      unchanged: true,
    }),
    live,
  });
  const delta = objectCounts(expected0022Objects);
  const result = Object.freeze({
    schemaVersion: 1,
    mode: 'remote_read_only_preflight',
    ready: true,
    headSha: process.env.EVIDENCE_0022_PREFLIGHT_HEAD_SHA || null,
    stateDigest: stableDigest(state),
    state,
    expectedApplyDelta: Object.freeze({
      migrations: 1,
      migrationLedgerRows: 1,
      ...delta,
      domainRowWrites: 0,
    }),
    expectedApplyWriteScope: Object.freeze({
      migration: EXPECTED_PENDING_MIGRATION,
      schemaOnly: true,
      migrationLedger: 'd1_migrations',
      allowedDomainTables: Object.freeze([]),
    }),
    guardrails: Object.freeze({
      remoteMigrationApplied: false,
      d1Mutated: false,
      r2Mutated: false,
      sourceRegistryMutated: false,
      plansMutated: false,
      claimVerificationsMutated: false,
      pagesMutated: false,
      outboundClicksMutated: false,
      claimsVerified: false,
      affiliateEnabled: false,
      published: false,
      deployed: false,
      applyAuthorized: false,
      nextGate: 'explicit_remote_0022_apply_authorization_required',
    }),
  });
  return result;
}

export function formatSummary(result) {
  return [
    '## Evidence 0022 remote read-only preflight',
    '',
    `- Ready: **${result.ready ? 'yes' : 'no'}**`,
    `- Head: \`${result.headSha ?? 'not provided'}\``,
    `- State digest: \`sha256:${result.stateDigest}\``,
    `- Remote migration: **${result.state.migration.count} / ${result.state.migration.latestName}**`,
    `- Only pending migration: \`${result.state.migration.pending[0]}\``,
    '- Upstream evidence: **2 / 12 / 72 / 52 pending**',
    '- Provenance objects already present: **0**',
    '- Protected tables changed: **no**',
    '- D1/R2 mutation performed: **no**',
    '- Next gate: **explicit remote 0022 apply authorization required**',
    '',
  ].join('\n');
}

async function main() {
  const outputPath = path.resolve(process.argv[2] || 'artifacts/evidence-0022-remote-readonly-preflight.json');
  const result = await runEvidence0022RemotePreflight();
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  const summary = formatSummary(result);
  process.stdout.write(`${summary}\n`);
  if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, summary, 'utf8');
}

const invokedAsScript = process.argv[1]
  && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (invokedAsScript) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}

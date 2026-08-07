import { spawnSync } from 'node:child_process';
import { appendFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  SOURCE_REGISTRY_ONBOARDING_READ_QUERY,
  buildSourceOnboardingPlan,
  loadSourceOnboardingIntents,
  parseOnboardingRegistryRows,
} from './evidence-source-registry-onboarding.mjs';
import {
  canonicalizeRegistryUrl,
  loadReconciliationManifest,
  reconcileManifest,
} from './evidence-source-reconciliation.mjs';

const TARGET_D1_BINDING = 'DB';
const EXPECTED_BRANCH = 'ops/evidence-source-registry-onboarding-remote';
const EXPECTED_ACK = 'AUTHORIZED_8_SOURCE_REGISTRY_INSERTS_2026_08_07';
const EXPECTED_INTENT_COUNT = 8;
const EXPECTED_MANIFEST_IDENTITY_COUNT = 9;
const EXPECTED_BEFORE_REGISTRY_ROWS = 7;
const EXPECTED_AFTER_REGISTRY_ROWS = 15;
const EXPECTED_AUTHORIZATION_SCOPE = 'source_registry_onboarding';

function parseJsonOutput(stdout, errorCode) {
  const value = stdout.trim();
  if (!value) throw new Error(`${errorCode}:empty_output`);
  try {
    return JSON.parse(value);
  } catch (error) {
    throw new Error(`${errorCode}:invalid_json:${error.message}`);
  }
}

function runWranglerD1(args, errorCode) {
  const result = spawnSync(
    process.execPath,
    ['node_modules/wrangler/bin/wrangler.js', 'd1', ...args],
    {
      encoding: 'utf8',
      env: process.env,
      maxBuffer: 10 * 1024 * 1024,
    },
  );
  if (result.status !== 0) {
    const diagnostic = (result.stderr || result.stdout || '').trim();
    throw new Error(`${errorCode}${diagnostic ? `:${diagnostic}` : ''}`);
  }
  return result.stdout;
}

function requireExecutionGuards() {
  if (process.env.GITHUB_ACTIONS !== 'true') throw new Error('remote_onboarding_requires_github_actions');
  if (process.env.GITHUB_REF_NAME !== EXPECTED_BRANCH) throw new Error('remote_onboarding_branch_mismatch');
  if (process.env.SOURCE_REGISTRY_REMOTE_MUTATION_ACK !== EXPECTED_ACK) {
    throw new Error('remote_onboarding_ack_missing_or_invalid');
  }
  if (!process.env.EVIDENCE_SOURCE_REGISTRY_WRANGLER_CONFIG) {
    throw new Error('remote_onboarding_wrangler_config_required');
  }
}

export function validateRemoteAuthorizationMarker(marker) {
  if (!marker || marker.schemaVersion !== 1) throw new Error('remote_onboarding_authorization_schema_invalid');
  if (marker.scope !== EXPECTED_AUTHORIZATION_SCOPE) throw new Error('remote_onboarding_authorization_scope_invalid');
  if (marker.remoteMutationAuthorized !== true) throw new Error('remote_onboarding_not_authorized');
  if (marker.expectedIntentCount !== EXPECTED_INTENT_COUNT) throw new Error('remote_onboarding_authorization_intent_count_invalid');
  if (marker.expectedManifestIdentityCount !== EXPECTED_MANIFEST_IDENTITY_COUNT) {
    throw new Error('remote_onboarding_authorization_manifest_count_invalid');
  }
  if (marker.expectedBeforeRegistryRows !== EXPECTED_BEFORE_REGISTRY_ROWS) {
    throw new Error('remote_onboarding_authorization_before_row_count_invalid');
  }
  if (marker.expectedAfterRegistryRows !== EXPECTED_AFTER_REGISTRY_ROWS) {
    throw new Error('remote_onboarding_authorization_after_row_count_invalid');
  }
  if (marker.forbidRemoteMigration !== true || marker.forbidImporter !== true || marker.forbidDeploy !== true) {
    throw new Error('remote_onboarding_authorization_guardrails_invalid');
  }
  return marker;
}

function queryRemoteRegistry() {
  const configPath = process.env.EVIDENCE_SOURCE_REGISTRY_WRANGLER_CONFIG;
  const stdout = runWranglerD1(
    [
      'execute', TARGET_D1_BINDING,
      '--remote',
      '--command', SOURCE_REGISTRY_ONBOARDING_READ_QUERY,
      '--json',
      '--config', configPath,
    ],
    'remote_source_registry_onboarding_query_failed',
  );
  return parseOnboardingRegistryRows(parseJsonOutput(stdout, 'remote_source_registry_onboarding_query'));
}

function executeRemoteInsertSql(sql) {
  if (!sql) throw new Error('remote_source_registry_onboarding_sql_empty');
  const configPath = process.env.EVIDENCE_SOURCE_REGISTRY_WRANGLER_CONFIG;
  runWranglerD1(
    [
      'execute', TARGET_D1_BINDING,
      '--remote',
      '--command', sql,
      '--json',
      '--config', configPath,
    ],
    'remote_source_registry_onboarding_mutation_failed',
  );
}

function reconciliationCounts(results) {
  return results.reduce((counts, result) => {
    if (result.status === 'resolved') counts.resolved += 1;
    if (result.reason === 'source_not_registered') counts.sourceNotRegistered += 1;
    if (result.reason === 'source_registry_ambiguous') counts.sourceRegistryAmbiguous += 1;
    return counts;
  }, { resolved: 0, sourceNotRegistered: 0, sourceRegistryAmbiguous: 0 });
}

function sqlString(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

export function buildAtomicRemoteInsertSql(onboarding, plan) {
  if (plan.counts.blocked !== 0 || plan.counts.existingExact !== 0 || plan.counts.insert !== EXPECTED_INTENT_COUNT) {
    throw new Error('remote_onboarding_atomic_sql_plan_invalid');
  }
  const insertKeys = new Set(
    plan.items.filter((item) => item.action === 'insert').map((item) => item.intentKey),
  );
  const intents = onboarding.intents.filter((intent) => insertKeys.has(intent.intentKey));
  if (intents.length !== EXPECTED_INTENT_COUNT) throw new Error('remote_onboarding_atomic_sql_intent_count_invalid');

  const rows = intents.map((intent) => [
    sqlString(intent.entityType),
    sqlString(intent.entityKey),
    sqlString(intent.sourceKind),
    sqlString(intent.label),
    sqlString(canonicalizeRegistryUrl(intent.canonicalUrl)),
    String(intent.trustLevel),
    String(intent.freshnessDays),
    sqlString(intent.status),
    sqlString(intent.notes),
  ].join(', '));

  return [
    'INSERT INTO source_registry (',
    '  entity_type, entity_key, source_kind, label, url, trust_level, freshness_days, status, notes',
    ') VALUES',
    ...rows.map((row, index) => `  (${row})${index === rows.length - 1 ? ';' : ','}`),
  ].join('\n');
}

export function assertRemotePreflight({ onboarding, reconciliation, registryRows }) {
  if (onboarding.intents.length !== EXPECTED_INTENT_COUNT) throw new Error('remote_onboarding_intent_count_drift');
  if (reconciliation.sources.length !== EXPECTED_MANIFEST_IDENTITY_COUNT) {
    throw new Error('remote_onboarding_manifest_identity_count_drift');
  }
  if (registryRows.length !== EXPECTED_BEFORE_REGISTRY_ROWS) throw new Error('remote_onboarding_registry_row_count_drift');

  const plan = buildSourceOnboardingPlan(onboarding, registryRows);
  if (plan.counts.insert !== EXPECTED_INTENT_COUNT || plan.counts.existingExact !== 0 || plan.counts.blocked !== 0) {
    throw new Error('remote_onboarding_preflight_plan_drift');
  }

  const reconciled = reconcileManifest(reconciliation, registryRows);
  const counts = reconciliationCounts(reconciled);
  if (counts.resolved !== 0
      || counts.sourceNotRegistered !== EXPECTED_MANIFEST_IDENTITY_COUNT
      || counts.sourceRegistryAmbiguous !== 0) {
    throw new Error('remote_onboarding_preflight_reconciliation_drift');
  }

  return { plan, reconciliationCounts: counts };
}

export function assertRemotePostcondition({ onboarding, reconciliation, registryRows }) {
  if (registryRows.length !== EXPECTED_AFTER_REGISTRY_ROWS) throw new Error('remote_onboarding_post_row_count_invalid');
  const plan = buildSourceOnboardingPlan(onboarding, registryRows);
  if (plan.counts.insert !== 0 || plan.counts.existingExact !== EXPECTED_INTENT_COUNT || plan.counts.blocked !== 0) {
    throw new Error('remote_onboarding_post_plan_invalid');
  }
  const reconciled = reconcileManifest(reconciliation, registryRows);
  const counts = reconciliationCounts(reconciled);
  if (counts.resolved !== EXPECTED_MANIFEST_IDENTITY_COUNT
      || counts.sourceNotRegistered !== 0
      || counts.sourceRegistryAmbiguous !== 0) {
    throw new Error('remote_onboarding_post_reconciliation_invalid');
  }
  return { plan, reconciliationCounts: counts, reconciled };
}

function formatSummary(result) {
  return [
    '## Remote evidence source registry onboarding',
    '',
    `- Registry rows before: **${result.registryRowsBefore}**`,
    `- Approved inserts executed: **${result.inserted}**`,
    `- Registry rows after: **${result.registryRowsAfter}**`,
    `- Manifest identities resolved after: **${result.after.resolved}/${result.manifestIdentityCount}**`,
    `- Missing after: **${result.after.sourceNotRegistered}**`,
    `- Ambiguous after: **${result.after.sourceRegistryAmbiguous}**`,
    `- Ready for importer source gate: **${result.readyForImporterSourceGate ? 'yes' : 'no'}**`,
    '',
    '> Scope: source_registry onboarding only. No remote migration, evidence importer, claim write or deploy.',
    '',
  ].join('\n');
}

export async function applyRemoteSourceOnboarding({ authorizationPath, outputPath }) {
  requireExecutionGuards();
  const marker = validateRemoteAuthorizationMarker(JSON.parse(await readFile(authorizationPath, 'utf8')));
  const reconciliation = await loadReconciliationManifest();
  const onboarding = await loadSourceOnboardingIntents(undefined, reconciliation);

  const beforeRows = queryRemoteRegistry();
  const before = assertRemotePreflight({ onboarding, reconciliation, registryRows: beforeRows });

  const sql = buildAtomicRemoteInsertSql(onboarding, before.plan);
  executeRemoteInsertSql(sql);

  const afterRows = queryRemoteRegistry();
  const after = assertRemotePostcondition({ onboarding, reconciliation, registryRows: afterRows });

  const result = Object.freeze({
    schemaVersion: 1,
    databaseName: 'senza-roaming',
    executedAt: new Date().toISOString(),
    authorization: {
      scope: marker.scope,
      authorizedOn: marker.authorizedOn,
      expectedIntentCount: marker.expectedIntentCount,
    },
    registryRowsBefore: beforeRows.length,
    registryRowsAfter: afterRows.length,
    inserted: before.plan.counts.insert,
    intentCount: onboarding.intents.length,
    manifestIdentityCount: reconciliation.sources.length,
    before: before.reconciliationCounts,
    after: after.reconciliationCounts,
    readyForImporterSourceGate: after.reconciliationCounts.resolved === reconciliation.sources.length,
    intentResults: after.plan.items.map((item) => ({ intentKey: item.intentKey, action: item.action })),
    reconciliationResults: after.reconciled.map((item) => ({
      sourceAuditKey: item.sourceAuditKey,
      status: item.status,
      reason: item.reason,
      matchCount: item.matchCount ?? (item.status === 'resolved' ? 1 : 0),
    })),
  });

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  const summary = formatSummary(result);
  process.stdout.write(`${summary}\n`);
  if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, summary, 'utf8');
  return result;
}

async function main() {
  const authorizationPath = path.resolve(process.argv[2] || 'ops/evidence-source-registry-onboarding-remote-authorization.json');
  const outputPath = path.resolve(process.argv[3] || 'artifacts/evidence-source-registry-onboarding-remote.json');
  await applyRemoteSourceOnboarding({ authorizationPath, outputPath });
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}

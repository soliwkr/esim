import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  canonicalizeRegistryUrl,
  loadReconciliationManifest,
  reconcileManifest,
} from './evidence-source-reconciliation.mjs';

const ALLOWED_ENTITY_TYPES = new Set(['provider', 'destination', 'plan', 'device', 'page', 'policy']);
const ALLOWED_SOURCE_KINDS = new Set([
  'official_provider', 'official_help', 'official_terms', 'regulator',
  'manufacturer', 'first_party_test', 'editorial_reference',
]);
const ONBOARDING_ROW_COLUMNS = [
  'id', 'entity_type', 'entity_key', 'source_kind', 'label', 'url',
  'trust_level', 'freshness_days', 'status', 'notes',
];

export const DEFAULT_ONBOARDING_INTENTS_PATH = 'research/evidence/source-registry-onboarding-intents.json';
export const SOURCE_REGISTRY_ONBOARDING_READ_QUERY = [
  'SELECT',
  '  id, entity_type, entity_key, source_kind, label, url,',
  '  trust_level, freshness_days, status, notes',
  'FROM source_registry',
  'ORDER BY id',
].join('\n');

function dbKey(entityType, entityKey, url) {
  return `${entityType}\u0000${entityKey}\u0000${canonicalizeRegistryUrl(url)}`;
}

function manifestIdentity(entry) {
  return [entry.entityType, entry.entityKey, entry.sourceKind, canonicalizeRegistryUrl(entry.registryCanonicalUrl)].join('\u0000');
}

function intentIdentity(intent) {
  return [intent.entityType, intent.entityKey, intent.sourceKind, canonicalizeRegistryUrl(intent.canonicalUrl)].join('\u0000');
}

export function validateSourceOnboardingIntents(onboarding, reconciliationManifest) {
  if (!onboarding || onboarding.schemaVersion !== 1 || onboarding.mappingVersion !== 1) {
    throw new Error('source_onboarding_schema_unsupported');
  }
  if (!reconciliationManifest || reconciliationManifest.mappingVersion !== onboarding.mappingVersion) {
    throw new Error('source_onboarding_mapping_version_mismatch');
  }
  if (!Array.isArray(onboarding.intents) || onboarding.intents.length === 0) {
    throw new Error('source_onboarding_intents_missing');
  }
  if (onboarding.rules?.targetStatus !== 'active'
      || onboarding.rules?.allowRemoteMutation !== false
      || onboarding.rules?.allowMetadataOverwrite !== false
      || onboarding.rules?.allowProviderRootFallback !== false
      || onboarding.rules?.allowRedirectAutoRemap !== false
      || onboarding.rules?.hardcodeEnvironmentSourceRegistryIds !== false) {
    throw new Error('source_onboarding_rules_invalid');
  }

  const reconciliationByAuditKey = new Map(
    reconciliationManifest.sources.map((entry) => [entry.sourceAuditKey, entry]),
  );
  const intentKeys = new Set();
  const auditKeys = new Set();
  const dbKeys = new Set();

  for (const intent of onboarding.intents) {
    if (!intent || typeof intent.intentKey !== 'string' || !intent.intentKey) {
      throw new Error('source_onboarding_intent_key_invalid');
    }
    if (intentKeys.has(intent.intentKey)) throw new Error(`source_onboarding_intent_key_duplicate:${intent.intentKey}`);
    intentKeys.add(intent.intentKey);

    for (const forbiddenKey of ['sourceRegistryId', 'source_registry_id', 'sourceId', 'source_id']) {
      if (Object.hasOwn(intent, forbiddenKey)) throw new Error(`environment_source_id_forbidden:${intent.intentKey}`);
    }
    if (!Array.isArray(intent.sourceAuditKeys) || intent.sourceAuditKeys.length === 0) {
      throw new Error(`source_onboarding_audit_keys_missing:${intent.intentKey}`);
    }
    if (!ALLOWED_ENTITY_TYPES.has(intent.entityType)) throw new Error(`source_onboarding_entity_type_invalid:${intent.intentKey}`);
    if (typeof intent.entityKey !== 'string' || !intent.entityKey) throw new Error(`source_onboarding_entity_key_invalid:${intent.intentKey}`);
    if (!ALLOWED_SOURCE_KINDS.has(intent.sourceKind)) throw new Error(`source_onboarding_source_kind_invalid:${intent.intentKey}`);
    if (typeof intent.label !== 'string' || !intent.label.trim()) throw new Error(`source_onboarding_label_invalid:${intent.intentKey}`);
    if (!Number.isInteger(intent.trustLevel) || intent.trustLevel < 1 || intent.trustLevel > 5) {
      throw new Error(`source_onboarding_trust_invalid:${intent.intentKey}`);
    }
    if (!Number.isInteger(intent.freshnessDays) || intent.freshnessDays < 1 || intent.freshnessDays > 365) {
      throw new Error(`source_onboarding_freshness_invalid:${intent.intentKey}`);
    }
    if (intent.status !== 'active') throw new Error(`source_onboarding_status_invalid:${intent.intentKey}`);
    if (typeof intent.notes !== 'string' || !intent.notes.trim()) throw new Error(`source_onboarding_notes_invalid:${intent.intentKey}`);
    canonicalizeRegistryUrl(intent.canonicalUrl);

    const uniqueDbKey = dbKey(intent.entityType, intent.entityKey, intent.canonicalUrl);
    if (dbKeys.has(uniqueDbKey)) throw new Error(`source_onboarding_db_identity_duplicate:${intent.intentKey}`);
    dbKeys.add(uniqueDbKey);

    for (const sourceAuditKey of intent.sourceAuditKeys) {
      if (auditKeys.has(sourceAuditKey)) throw new Error(`source_onboarding_audit_key_duplicate:${sourceAuditKey}`);
      auditKeys.add(sourceAuditKey);
      const entry = reconciliationByAuditKey.get(sourceAuditKey);
      if (!entry) throw new Error(`source_onboarding_unknown_audit_key:${sourceAuditKey}`);
      if (intentIdentity(intent) !== manifestIdentity(entry)) {
        throw new Error(`source_onboarding_identity_mismatch:${sourceAuditKey}`);
      }
    }
  }

  const uncovered = reconciliationManifest.sources
    .map((entry) => entry.sourceAuditKey)
    .filter((sourceAuditKey) => !auditKeys.has(sourceAuditKey));
  if (uncovered.length > 0) throw new Error(`source_onboarding_audit_keys_uncovered:${uncovered.sort().join(',')}`);
  if (auditKeys.size !== reconciliationManifest.sources.length) throw new Error('source_onboarding_audit_key_cardinality_invalid');
  return onboarding;
}

function isOnboardingRow(value) {
  return value && typeof value === 'object' && !Array.isArray(value)
    && ONBOARDING_ROW_COLUMNS.every((column) => Object.hasOwn(value, column));
}

function collectResultArrays(value, output) {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    if (value.length === 0 || value.every(isOnboardingRow)) {
      output.push(value);
      return;
    }
    for (const item of value) collectResultArrays(item, output);
    return;
  }
  if (Array.isArray(value.results)) {
    if (value.results.length === 0 || value.results.every(isOnboardingRow)) output.push(value.results);
    else collectResultArrays(value.results, output);
  }
  if (value.result !== undefined) collectResultArrays(value.result, output);
}

export function parseOnboardingRegistryRows(payload) {
  const arrays = [];
  collectResultArrays(payload, arrays);
  if (arrays.length === 0) throw new Error('source_onboarding_registry_results_missing');
  return arrays.flat().map((row, index) => {
    const id = Number(row.id);
    const trustLevel = Number(row.trust_level);
    const freshnessDays = Number(row.freshness_days);
    if (!Number.isSafeInteger(id) || id < 1) throw new Error(`source_onboarding_row_id_invalid:${index}`);
    if (!Number.isInteger(trustLevel) || trustLevel < 1 || trustLevel > 5) throw new Error(`source_onboarding_row_trust_invalid:${index}`);
    if (!Number.isInteger(freshnessDays) || freshnessDays < 1 || freshnessDays > 365) throw new Error(`source_onboarding_row_freshness_invalid:${index}`);
    for (const column of ['entity_type', 'entity_key', 'source_kind', 'label', 'url', 'status', 'notes']) {
      if (typeof row[column] !== 'string') throw new Error(`source_onboarding_row_column_invalid:${index}:${column}`);
    }
    return Object.freeze({ ...row, id, trust_level: trustLevel, freshness_days: freshnessDays });
  });
}

function metadataMismatches(intent, row) {
  const mismatches = [];
  if (row.source_kind !== intent.sourceKind) mismatches.push('source_kind');
  if (row.label !== intent.label) mismatches.push('label');
  if (row.trust_level !== intent.trustLevel) mismatches.push('trust_level');
  if (row.freshness_days !== intent.freshnessDays) mismatches.push('freshness_days');
  if (row.status !== intent.status) mismatches.push('status');
  if (row.notes !== intent.notes) mismatches.push('notes');
  return mismatches;
}

export function buildSourceOnboardingPlan(onboarding, registryRows) {
  if (!Array.isArray(registryRows)) throw new Error('source_onboarding_registry_rows_invalid');
  const rowsByDbKey = new Map();
  for (const row of registryRows) {
    const key = dbKey(row.entity_type, row.entity_key, row.url);
    const rows = rowsByDbKey.get(key) || [];
    rows.push(row);
    rowsByDbKey.set(key, rows);
  }

  const items = onboarding.intents.map((intent) => {
    const matches = rowsByDbKey.get(dbKey(intent.entityType, intent.entityKey, intent.canonicalUrl)) || [];
    if (matches.length === 0) return Object.freeze({ intentKey: intent.intentKey, action: 'insert', reason: null, mismatches: [] });
    if (matches.length > 1) {
      return Object.freeze({ intentKey: intent.intentKey, action: 'blocked', reason: 'source_registry_db_identity_ambiguous', mismatches: [], matchCount: matches.length });
    }
    const mismatches = metadataMismatches(intent, matches[0]);
    if (mismatches.length > 0) {
      return Object.freeze({ intentKey: intent.intentKey, action: 'blocked', reason: 'source_registry_metadata_conflict', mismatches: Object.freeze(mismatches) });
    }
    return Object.freeze({ intentKey: intent.intentKey, action: 'existing_exact', reason: null, mismatches: [] });
  });

  const counts = items.reduce((accumulator, item) => {
    if (item.action === 'insert') accumulator.insert += 1;
    if (item.action === 'existing_exact') accumulator.existingExact += 1;
    if (item.action === 'blocked') accumulator.blocked += 1;
    return accumulator;
  }, { insert: 0, existingExact: 0, blocked: 0 });
  return Object.freeze({ schemaVersion: 1, intentCount: onboarding.intents.length, counts: Object.freeze(counts), items: Object.freeze(items) });
}

function sqlString(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

export function buildSourceOnboardingInsertSql(onboarding, plan) {
  if (plan.counts.blocked > 0) throw new Error('source_onboarding_plan_blocked');
  const insertKeys = new Set(plan.items.filter((item) => item.action === 'insert').map((item) => item.intentKey));
  const inserts = onboarding.intents.filter((intent) => insertKeys.has(intent.intentKey));
  if (inserts.length === 0) return '';
  return [
    'BEGIN TRANSACTION;',
    ...inserts.map((intent) => [
      'INSERT OR IGNORE INTO source_registry(',
      '  entity_type, entity_key, source_kind, label, url, trust_level, freshness_days, status, notes',
      ') VALUES (',
      `  ${sqlString(intent.entityType)}, ${sqlString(intent.entityKey)}, ${sqlString(intent.sourceKind)},`,
      `  ${sqlString(intent.label)}, ${sqlString(canonicalizeRegistryUrl(intent.canonicalUrl))},`,
      `  ${intent.trustLevel}, ${intent.freshnessDays}, ${sqlString(intent.status)}, ${sqlString(intent.notes)}`,
      ');',
    ].join('\n')),
    'COMMIT;',
  ].join('\n');
}

export async function loadSourceOnboardingIntents(pathname = DEFAULT_ONBOARDING_INTENTS_PATH, reconciliationManifest = null) {
  const reconciliation = reconciliationManifest || await loadReconciliationManifest();
  const onboarding = JSON.parse(await readFile(pathname, 'utf8'));
  return validateSourceOnboardingIntents(onboarding, reconciliation);
}

function runWranglerD1(args, errorCode) {
  const result = spawnSync(process.execPath, ['node_modules/wrangler/bin/wrangler.js', 'd1', ...args], {
    encoding: 'utf8', env: process.env, maxBuffer: 10 * 1024 * 1024,
  });
  if (result.status !== 0) {
    const diagnostic = (result.stderr || result.stdout || '').trim();
    throw new Error(`${errorCode}${diagnostic ? `:${diagnostic}` : ''}`);
  }
  return result.stdout;
}

function queryLocalRegistry(persistTo) {
  const stdout = runWranglerD1(
    ['execute', 'DB', '--local', '--persist-to', persistTo, '--command', SOURCE_REGISTRY_ONBOARDING_READ_QUERY, '--json'],
    'local_source_registry_query_failed',
  );
  return parseOnboardingRegistryRows(JSON.parse(stdout));
}

function executeLocalInsertSql(persistTo, sql) {
  if (!sql) return;
  runWranglerD1(['execute', 'DB', '--local', '--persist-to', persistTo, '--command', sql, '--json'], 'local_source_registry_onboarding_failed');
}

export async function applyLocalSourceOnboarding({ persistTo }) {
  if (typeof persistTo !== 'string' || !persistTo) throw new Error('local_source_onboarding_persist_path_required');
  const reconciliation = await loadReconciliationManifest();
  const onboarding = await loadSourceOnboardingIntents(DEFAULT_ONBOARDING_INTENTS_PATH, reconciliation);
  const beforeRows = queryLocalRegistry(persistTo);
  const beforePlan = buildSourceOnboardingPlan(onboarding, beforeRows);
  if (beforePlan.counts.blocked > 0) throw new Error('local_source_onboarding_preflight_blocked');

  executeLocalInsertSql(persistTo, buildSourceOnboardingInsertSql(onboarding, beforePlan));

  const afterRows = queryLocalRegistry(persistTo);
  const afterPlan = buildSourceOnboardingPlan(onboarding, afterRows);
  if (afterPlan.counts.blocked > 0 || afterPlan.counts.insert > 0) throw new Error('local_source_onboarding_postcondition_failed');
  const reconciliationResults = reconcileManifest(reconciliation, afterRows);
  if (reconciliationResults.some((result) => result.status !== 'resolved')) {
    throw new Error('local_source_onboarding_reconciliation_incomplete');
  }

  return Object.freeze({
    schemaVersion: 1,
    environment: 'local',
    intentCount: onboarding.intents.length,
    manifestIdentityCount: reconciliation.sources.length,
    inserted: beforePlan.counts.insert,
    existingExactBefore: beforePlan.counts.existingExact,
    existingExactAfter: afterPlan.counts.existingExact,
    resolvedManifestIdentities: reconciliationResults.length,
    readyForImporter: true,
  });
}

async function cli() {
  const args = process.argv.slice(2);
  if (args.includes('--remote')) throw new Error('remote_source_onboarding_forbidden');
  const persistIndex = args.indexOf('--persist-to');
  if (!args.includes('--local') || persistIndex === -1 || !args[persistIndex + 1]) {
    throw new Error('Usage: node scripts/evidence-source-registry-onboarding.mjs --local --persist-to <path>');
  }
  const result = await applyLocalSourceOnboarding({ persistTo: path.resolve(args[persistIndex + 1]) });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  cli().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}

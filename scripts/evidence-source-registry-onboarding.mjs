import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  canonicalizeRegistryUrl,
  loadReconciliationManifest,
  reconcileManifest,
} from './evidence-source-reconciliation.mjs';
import { parseWranglerD1ExecuteJson } from './verify-evidence-source-registry-remote.mjs';

const ALLOWED_ENTITY_TYPES = new Set(['provider', 'destination', 'plan', 'device', 'page', 'policy']);
const ALLOWED_SOURCE_KINDS = new Set([
  'official_provider',
  'official_help',
  'official_terms',
  'regulator',
  'manufacturer',
  'first_party_test',
  'editorial_reference',
]);

export const DEFAULT_ONBOARDING_INTENTS_PATH = 'research/evidence/source-registry-onboarding-intents.json';
export const SOURCE_REGISTRY_ONBOARDING_READ_QUERY = [
  'SELECT',
  '  id,',
  '  entity_type,',
  '  entity_key,',
  '  source_kind,',
  '  label,',
  '  url,',
  '  trust_level,',
  '  freshness_days,',
  '  status,',
  '  notes',
  'FROM source_registry',
  'ORDER BY id',
].join('\n');

function registryDbKeyFromIntent(intent) {
  return `${intent.entityType}\u0000${intent.entityKey}\u0000${canonicalizeRegistryUrl(intent.canonicalUrl)}`;
}

function registryDbKeyFromRow(row) {
  return `${row.entity_type}\u0000${row.entity_key}\u0000${canonicalizeRegistryUrl(row.url)}`;
}

function identityFromManifestEntry(entry) {
  return {
    entityType: entry.entityType,
    entityKey: entry.entityKey,
    sourceKind: entry.sourceKind,
    canonicalUrl: canonicalizeRegistryUrl(entry.registryCanonicalUrl),
  };
}

function identityFromIntent(intent) {
  return {
    entityType: intent.entityType,
    entityKey: intent.entityKey,
    sourceKind: intent.sourceKind,
    canonicalUrl: canonicalizeRegistryUrl(intent.canonicalUrl),
  };
}

function sameIdentity(left, right) {
  return left.entityType === right.entityType
    && left.entityKey === right.entityKey
    && left.sourceKind === right.sourceKind
    && left.canonicalUrl === right.canonicalUrl;
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
  const seenIntentKeys = new Set();
  const seenAuditKeys = new Set();
  const seenDbKeys = new Set();

  for (const intent of onboarding.intents) {
    if (!intent || typeof intent.intentKey !== 'string' || !intent.intentKey) {
      throw new Error('source_onboarding_intent_key_invalid');
    }
    if (seenIntentKeys.has(intent.intentKey)) {
      throw new Error(`source_onboarding_intent_key_duplicate:${intent.intentKey}`);
    }
    seenIntentKeys.add(intent.intentKey);

    for (const forbiddenKey of ['sourceRegistryId', 'source_registry_id', 'sourceId', 'source_id']) {
      if (Object.hasOwn(intent, forbiddenKey)) {
        throw new Error(`environment_source_id_forbidden:${intent.intentKey}`);
      }
    }

    if (!Array.isArray(intent.sourceAuditKeys) || intent.sourceAuditKeys.length === 0) {
      throw new Error(`source_onboarding_audit_keys_missing:${intent.intentKey}`);
    }
    if (!ALLOWED_ENTITY_TYPES.has(intent.entityType)) {
      throw new Error(`source_onboarding_entity_type_invalid:${intent.intentKey}`);
    }
    if (typeof intent.entityKey !== 'string' || !intent.entityKey) {
      throw new Error(`source_onboarding_entity_key_invalid:${intent.intentKey}`);
    }
    if (!ALLOWED_SOURCE_KINDS.has(intent.sourceKind)) {
      throw new Error(`source_onboarding_source_kind_invalid:${intent.intentKey}`);
    }
    if (typeof intent.label !== 'string' || !intent.label.trim()) {
      throw new Error(`source_onboarding_label_invalid:${intent.intentKey}`);
    }
    if (!Number.isInteger(intent.trustLevel) || intent.trustLevel < 1 || intent.trustLevel > 5) {
      throw new Error(`source_onboarding_trust_invalid:${intent.intentKey}`);
    }
    if (!Number.isInteger(intent.freshnessDays) || intent.freshnessDays < 1 || intent.freshnessDays > 365) {
      throw new Error(`source_onboarding_freshness_invalid:${intent.intentKey}`);
    }
    if (intent.status !== 'active') {
      throw new Error(`source_onboarding_status_invalid:${intent.intentKey}`);
    }
    if (typeof intent.notes !== 'string' || !intent.notes.trim()) {
      throw new Error(`source_onboarding_notes_invalid:${intent.intentKey}`);
    }
    canonicalizeRegistryUrl(intent.canonicalUrl);

    const dbKey = registryDbKeyFromIntent(intent);
    if (seenDbKeys.has(dbKey)) {
      throw new Error(`source_onboarding_db_identity_duplicate:${intent.intentKey}`);
    }
    seenDbKeys.add(dbKey);

    const intentIdentity = identityFromIntent(intent);
    for (const sourceAuditKey of intent.sourceAuditKeys) {
      if (typeof sourceAuditKey !== 'string' || !sourceAuditKey) {
        throw new Error(`source_onboarding_audit_key_invalid:${intent.intentKey}`);
      }
      if (seenAuditKeys.has(sourceAuditKey)) {
        throw new Error(`source_onboarding_audit_key_duplicate:${sourceAuditKey}`);
      }
      seenAuditKeys.add(sourceAuditKey);
      const reconciliationEntry = reconciliationByAuditKey.get(sourceAuditKey);
      if (!reconciliationEntry) {
        throw new Error(`source_onboarding_unknown_audit_key:${sourceAuditKey}`);
      }
      if (!sameIdentity(intentIdentity, identityFromManifestEntry(reconciliationEntry))) {
        throw new Error(`source_onboarding_identity_mismatch:${sourceAuditKey}`);
      }
    }
  }

  const missingAuditKeys = reconciliationManifest.sources
    .map((entry) => entry.sourceAuditKey)
    .filter((sourceAuditKey) => !seenAuditKeys.has(sourceAuditKey));
  if (missingAuditKeys.length > 0) {
    throw new Error(`source_onboarding_audit_keys_uncovered:${missingAuditKeys.sort().join(',')}`);
  }
  if (seenAuditKeys.size !== reconciliationManifest.sources.length) {
    throw new Error('source_onboarding_audit_key_cardinality_invalid');
  }

  return onboarding;
}

function compareExistingRow(intent, row) {
  const mismatches = [];
  if (row.source_kind !== intent.sourceKind) mismatches.push('source_kind');
  if (row.label !== intent.label) mismatches.push('label');
  if (Number(row.trust_level) !== intent.trustLevel) mismatches.push('trust_level');
  if (Number(row.freshness_days) !== intent.freshnessDays) mismatches.push('freshness_days');
  if (row.status !== intent.status) mismatches.push('status');
  if (row.notes !== intent.notes) mismatches.push('notes');
  return mismatches;
}

export function buildSourceOnboardingPlan(onboarding, registryRows) {
  if (!Array.isArray(registryRows)) throw new Error('source_onboarding_registry_rows_invalid');

  const rowsByDbKey = new Map();
  for (const row of registryRows) {
    const dbKey = registryDbKeyFromRow(row);
    const list = rowsByDbKey.get(dbKey) || [];
    list.push(row);
    rowsByDbKey.set(dbKey, list);
  }

  const items = onboarding.intents.map((intent) => {
    const matches = rowsByDbKey.get(registryDbKeyFromIntent(intent)) || [];
    if (matches.length === 0) {
      return Object.freeze({ intentKey: intent.intentKey, action: 'insert', reason: null, mismatches: [] });
    }
    if (matches.length > 1) {
      return Object.freeze({
        intentKey: intent.intentKey,
        action: 'blocked',
        reason: 'source_registry_db_identity_ambiguous',
        mismatches: [],
        matchCount: matches.length,
      });
    }

    const mismatches = compareExistingRow(intent, matches[0]);
    if (mismatches.length > 0) {
      return Object.freeze({
        intentKey: intent.intentKey,
        action: 'blocked',
        reason: 'source_registry_metadata_conflict',
        mismatches: Object.freeze(mismatches),
      });
    }
    return Object.freeze({ intentKey: intent.intentKey, action: 'existing_exact', reason: null, mismatches: [] });
  });

  const counts = items.reduce(
    (accumulator, item) => {
      if (item.action === 'insert') accumulator.insert += 1;
      if (item.action === 'existing_exact') accumulator.existingExact += 1;
      if (item.action === 'blocked') accumulator.blocked += 1;
      return accumulator;
    },
    { insert: 0, existingExact: 0, blocked: 0 },
  );

  return Object.freeze({
    schemaVersion: 1,
    intentCount: onboarding.intents.length,
    counts: Object.freeze(counts),
    items: Object.freeze(items),
  });
}

function sqlString(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

export function buildSourceOnboardingInsertSql(onboarding, plan) {
  if (plan.counts.blocked > 0) throw new Error('source_onboarding_plan_blocked');
  const insertKeys = new Set(plan.items.filter((item) => item.action === 'insert').map((item) => item.intentKey));
  const intents = onboarding.intents.filter((intent) => insertKeys.has(intent.intentKey));
  if (intents.length === 0) return '';

  const statements = intents.map((intent) => [
    'INSERT OR IGNORE INTO source_registry(',
    '  entity_type, entity_key, source_kind, label, url, trust_level, freshness_days, status, notes',
    ') VALUES (',
    `  ${sqlString(intent.entityType)}, ${sqlString(intent.entityKey)}, ${sqlString(intent.sourceKind)},`,
    `  ${sqlString(intent.label)}, ${sqlString(canonicalizeRegistryUrl(intent.canonicalUrl))},`,
    `  ${intent.trustLevel}, ${intent.freshnessDays}, ${sqlString(intent.status)}, ${sqlString(intent.notes)}`,
    ');',
  ].join('\n'));

  return ['BEGIN TRANSACTION;', ...statements, 'COMMIT;'].join('\n');
}

export async function loadSourceOnboardingIntents(
  pathname = DEFAULT_ONBOARDING_INTENTS_PATH,
  reconciliationManifest = null,
) {
  const reconciliation = reconciliationManifest || await loadReconciliationManifest();
  const onboarding = JSON.parse(await readFile(pathname, 'utf8'));
  return validateSourceOnboardingIntents(onboarding, reconciliation);
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

function queryLocalRegistry(persistTo) {
  const stdout = runWranglerD1(
    ['execute', 'DB', '--local', '--persist-to', persistTo, '--command', SOURCE_REGISTRY_ONBOARDING_READ_QUERY, '--json'],
    'local_source_registry_query_failed',
  );
  return parseWranglerD1ExecuteJson(JSON.parse(stdout));
}

function executeLocalInsertSql(persistTo, sql) {
  if (!sql) return;
  runWranglerD1(
    ['execute', 'DB', '--local', '--persist-to', persistTo, '--command', sql, '--json'],
    'local_source_registry_onboarding_failed',
  );
}

export async function applyLocalSourceOnboarding({ persistTo }) {
  if (typeof persistTo !== 'string' || !persistTo) throw new Error('local_source_onboarding_persist_path_required');
  const reconciliation = await loadReconciliationManifest();
  const onboarding = await loadSourceOnboardingIntents(DEFAULT_ONBOARDING_INTENTS_PATH, reconciliation);

  const beforeRows = queryLocalRegistry(persistTo);
  const beforePlan = buildSourceOnboardingPlan(onboarding, beforeRows);
  if (beforePlan.counts.blocked > 0) throw new Error('local_source_onboarding_preflight_blocked');

  const sql = buildSourceOnboardingInsertSql(onboarding, beforePlan);
  executeLocalInsertSql(persistTo, sql);

  const afterRows = queryLocalRegistry(persistTo);
  const afterPlan = buildSourceOnboardingPlan(onboarding, afterRows);
  if (afterPlan.counts.blocked > 0 || afterPlan.counts.insert > 0) {
    throw new Error('local_source_onboarding_postcondition_failed');
  }

  const reconciliationResults = reconcileManifest(reconciliation, afterRows);
  const unresolved = reconciliationResults.filter((result) => result.status !== 'resolved');
  if (unresolved.length > 0) throw new Error('local_source_onboarding_reconciliation_incomplete');

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
  const localIndex = args.indexOf('--local');
  const persistIndex = args.indexOf('--persist-to');
  if (localIndex === -1 || persistIndex === -1 || !args[persistIndex + 1]) {
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

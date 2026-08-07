import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  SOURCE_REGISTRY_ONBOARDING_READ_QUERY,
  applyLocalSourceOnboarding,
  buildSourceOnboardingInsertSql,
  buildSourceOnboardingPlan,
  loadSourceOnboardingIntents,
  validateSourceOnboardingIntents,
} from './evidence-source-registry-onboarding.mjs';
import { loadReconciliationManifest } from './evidence-source-reconciliation.mjs';

function run(command, args) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    env: process.env,
    maxBuffer: 10 * 1024 * 1024,
  });
  if (result.status !== 0) {
    throw new Error(`Command failed: ${command} ${args.join(' ')}\n${result.stderr || result.stdout}`);
  }
  return result;
}

const reconciliation = await loadReconciliationManifest();
const onboarding = await loadSourceOnboardingIntents(undefined, reconciliation);
validateSourceOnboardingIntents(onboarding, reconciliation);

assert.equal(reconciliation.sources.length, 9);
assert.equal(onboarding.intents.length, 8);
assert.equal(JSON.stringify(onboarding).includes('sourceRegistryId'), false);
assert.equal(onboarding.rules.allowRemoteMutation, false);
assert.equal(onboarding.rules.allowMetadataOverwrite, false);
assert.equal(onboarding.intents.reduce((total, intent) => total + intent.sourceAuditKeys.length, 0), 9);
assert.equal(onboarding.intents.find((intent) => intent.intentKey === 'ubigi-commerce').sourceAuditKeys.length, 2);

assert.match(SOURCE_REGISTRY_ONBOARDING_READ_QUERY, /^SELECT\b/);
assert.doesNotMatch(
  SOURCE_REGISTRY_ONBOARDING_READ_QUERY,
  /\b(?:INSERT|UPDATE|DELETE|REPLACE|CREATE|ALTER|DROP|PRAGMA|ATTACH|DETACH|VACUUM)\b/i,
);

const emptyPlan = buildSourceOnboardingPlan(onboarding, []);
assert.deepEqual(emptyPlan.counts, { insert: 8, existingExact: 0, blocked: 0 });
const insertSql = buildSourceOnboardingInsertSql(onboarding, emptyPlan);
assert.equal((insertSql.match(/INSERT OR IGNORE INTO source_registry/g) || []).length, 8);
assert.doesNotMatch(insertSql, /\bUPDATE\b|\bDELETE\b/i);

const firstIntent = onboarding.intents[0];
const exactRow = {
  id: 100,
  entity_type: firstIntent.entityType,
  entity_key: firstIntent.entityKey,
  source_kind: firstIntent.sourceKind,
  label: firstIntent.label,
  url: firstIntent.canonicalUrl,
  trust_level: firstIntent.trustLevel,
  freshness_days: firstIntent.freshnessDays,
  status: firstIntent.status,
  notes: firstIntent.notes,
};
assert.deepEqual(buildSourceOnboardingPlan(onboarding, [exactRow]).counts, {
  insert: 7,
  existingExact: 1,
  blocked: 0,
});

const conflictPlan = buildSourceOnboardingPlan(onboarding, [{ ...exactRow, label: 'Conflicting label' }]);
assert.equal(conflictPlan.counts.blocked, 1);
assert.equal(conflictPlan.items[0].reason, 'source_registry_metadata_conflict');
assert.deepEqual(conflictPlan.items[0].mismatches, ['label']);
assert.throws(() => buildSourceOnboardingInsertSql(onboarding, conflictPlan), /source_onboarding_plan_blocked/);

const missingCoverage = structuredClone(onboarding);
missingCoverage.intents[0].sourceAuditKeys = [];
assert.throws(
  () => validateSourceOnboardingIntents(missingCoverage, reconciliation),
  /source_onboarding_audit_keys_missing/,
);

const forbiddenId = structuredClone(onboarding);
forbiddenId.intents[0].sourceRegistryId = 99;
assert.throws(
  () => validateSourceOnboardingIntents(forbiddenId, reconciliation),
  /environment_source_id_forbidden/,
);

const remoteAttempt = spawnSync(
  process.execPath,
  ['scripts/evidence-source-registry-onboarding.mjs', '--remote'],
  { encoding: 'utf8' },
);
assert.notEqual(remoteAttempt.status, 0);
assert.match(remoteAttempt.stderr, /remote_source_onboarding_forbidden/);

const persistTo = await mkdtemp(path.join(os.tmpdir(), 'senza-roaming-source-onboarding-'));
try {
  run(process.execPath, [
    'node_modules/wrangler/bin/wrangler.js',
    'd1',
    'migrations',
    'apply',
    'DB',
    '--local',
    '--persist-to',
    persistTo,
  ]);

  const first = await applyLocalSourceOnboarding({ persistTo });
  assert.deepEqual(first, {
    schemaVersion: 1,
    environment: 'local',
    intentCount: 8,
    manifestIdentityCount: 9,
    inserted: 8,
    existingExactBefore: 0,
    existingExactAfter: 8,
    resolvedManifestIdentities: 9,
    readyForImporter: true,
  });

  const second = await applyLocalSourceOnboarding({ persistTo });
  assert.deepEqual(second, {
    schemaVersion: 1,
    environment: 'local',
    intentCount: 8,
    manifestIdentityCount: 9,
    inserted: 0,
    existingExactBefore: 8,
    existingExactAfter: 8,
    resolvedManifestIdentities: 9,
    readyForImporter: true,
  });

  const rawIntents = JSON.parse(await readFile('research/evidence/source-registry-onboarding-intents.json', 'utf8'));
  assert.equal(rawIntents.intents.length, 8);
} finally {
  await rm(persistTo, { recursive: true, force: true });
}

console.log('Evidence source registry onboarding smoke passed: 8 unique local rows resolve 9/9 manifest identities idempotently.');

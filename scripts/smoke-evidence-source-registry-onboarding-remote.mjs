import assert from 'node:assert/strict';
import {
  assertRemotePostcondition,
  assertRemotePreflight,
  validateRemoteAuthorizationMarker,
} from './evidence-source-registry-onboarding-remote.mjs';
import { loadSourceOnboardingIntents } from './evidence-source-registry-onboarding.mjs';
import { loadReconciliationManifest } from './evidence-source-reconciliation.mjs';

const reconciliation = await loadReconciliationManifest();
const onboarding = await loadSourceOnboardingIntents(undefined, reconciliation);

const marker = {
  schemaVersion: 1,
  scope: 'source_registry_onboarding',
  authorizedOn: '2026-08-07',
  remoteMutationAuthorized: true,
  expectedIntentCount: 8,
  expectedManifestIdentityCount: 9,
  expectedBeforeRegistryRows: 7,
  expectedAfterRegistryRows: 15,
  forbidRemoteMigration: true,
  forbidImporter: true,
  forbidDeploy: true,
};
assert.equal(validateRemoteAuthorizationMarker(marker), marker);
assert.throws(
  () => validateRemoteAuthorizationMarker({ ...marker, remoteMutationAuthorized: false }),
  /remote_onboarding_not_authorized/,
);
assert.throws(
  () => validateRemoteAuthorizationMarker({ ...marker, expectedIntentCount: 7 }),
  /remote_onboarding_authorization_intent_count_invalid/,
);

const beforeRows = Array.from({ length: 7 }, (_, index) => ({
  id: index + 1,
  entity_type: 'policy',
  entity_key: `unrelated-${index + 1}`,
  source_kind: 'editorial_reference',
  label: `Unrelated ${index + 1}`,
  url: `https://example.com/unrelated-${index + 1}`,
  trust_level: 3,
  freshness_days: 30,
  status: 'active',
  notes: 'Fixture row unrelated to approved onboarding identities.',
}));

const preflight = assertRemotePreflight({ onboarding, reconciliation, registryRows: beforeRows });
assert.deepEqual(preflight.plan.counts, { insert: 8, existingExact: 0, blocked: 0 });
assert.deepEqual(preflight.reconciliationCounts, {
  resolved: 0,
  sourceNotRegistered: 9,
  sourceRegistryAmbiguous: 0,
});

const insertedRows = onboarding.intents.map((intent, index) => ({
  id: 100 + index,
  entity_type: intent.entityType,
  entity_key: intent.entityKey,
  source_kind: intent.sourceKind,
  label: intent.label,
  url: intent.canonicalUrl,
  trust_level: intent.trustLevel,
  freshness_days: intent.freshnessDays,
  status: intent.status,
  notes: intent.notes,
}));

const afterRows = [...beforeRows, ...insertedRows];
const postcondition = assertRemotePostcondition({ onboarding, reconciliation, registryRows: afterRows });
assert.deepEqual(postcondition.plan.counts, { insert: 0, existingExact: 8, blocked: 0 });
assert.deepEqual(postcondition.reconciliationCounts, {
  resolved: 9,
  sourceNotRegistered: 0,
  sourceRegistryAmbiguous: 0,
});

const conflictingRows = afterRows.map((row) => ({ ...row }));
conflictingRows[7] = { ...conflictingRows[7], freshness_days: conflictingRows[7].freshness_days + 1 };
assert.throws(
  () => assertRemotePostcondition({ onboarding, reconciliation, registryRows: conflictingRows }),
  /remote_onboarding_post_plan_invalid/,
);

assert.throws(
  () => assertRemotePreflight({ onboarding, reconciliation, registryRows: [...beforeRows, insertedRows[0]] }),
  /remote_onboarding_registry_row_count_drift/,
);

console.log('remote source registry onboarding smoke: ok');

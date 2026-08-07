import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  canonicalizeRegistryUrl,
  reconcileManifest,
  resolveSourceRegistryEntry,
  validateReconciliationManifest,
} from './evidence-source-reconciliation.mjs';

const manifestPath = 'research/evidence/source-reconciliation-map.json';
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
validateReconciliationManifest(manifest);

assert.equal(manifest.sources.length, 9);
assert.equal(new Set(manifest.sources.map((entry) => entry.sourceAuditKey)).size, 9);
assert.equal(JSON.stringify(manifest).includes('sourceRegistryId'), false);
assert.equal(manifest.rules.allowProviderRootFallback, false);
assert.equal(manifest.rules.allowRedirectAutoRemap, false);
assert.equal(manifest.rules.allowImporterAutoRegistration, false);

const byKey = new Map(manifest.sources.map((entry) => [entry.sourceAuditKey, entry]));
const airaloItaly = byKey.get('candidate-airalo-italy-catalog');
const ubigiCommerce = byKey.get('provider-ubigi-commerce');
const airaloEurope = byKey.get('candidate-airalo-europe-store-unlimited-15d');
assert.ok(airaloItaly && ubigiCommerce && airaloEurope);

const providerRootsOnly = [
  {
    id: 1,
    entity_type: 'provider',
    entity_key: 'airalo',
    source_kind: 'official_provider',
    url: 'https://www.airalo.com/',
    status: 'active',
  },
];
assert.deepEqual(resolveSourceRegistryEntry(airaloItaly, providerRootsOnly), {
  sourceAuditKey: 'candidate-airalo-italy-catalog',
  status: 'blocked',
  reason: 'source_not_registered',
  sourceRegistryId: null,
});

const registeredCommerce = [
  {
    id: 42,
    entity_type: 'provider',
    entity_key: 'ubigi',
    source_kind: 'official_provider',
    url: 'https://cellulardata.ubigi.com/',
    status: 'active',
  },
];
assert.equal(resolveSourceRegistryEntry(ubigiCommerce, registeredCommerce).status, 'resolved');
assert.equal(resolveSourceRegistryEntry(ubigiCommerce, registeredCommerce).sourceRegistryId, 42);

const exactAiralo = {
  id: 9,
  entity_type: 'provider',
  entity_key: 'airalo',
  source_kind: 'official_provider',
  url: 'https://www.airalo.com/it/italy-esim/',
  status: 'active',
};
assert.equal(resolveSourceRegistryEntry(airaloItaly, [exactAiralo]).status, 'resolved');
assert.equal(
  resolveSourceRegistryEntry(airaloItaly, [exactAiralo, { ...exactAiralo, id: 10 }]).reason,
  'source_registry_ambiguous',
);
assert.equal(
  resolveSourceRegistryEntry(airaloItaly, [{ ...exactAiralo, status: 'blocked' }]).reason,
  'source_not_registered',
);

// A redirect destination observed in a snapshot cannot silently replace the approved
// registry canonical identity. Only the manifest identity participates in resolution.
const historicDeepLinkRow = {
  id: 17,
  entity_type: 'provider',
  entity_key: 'airalo',
  source_kind: 'official_provider',
  url: 'https://www.airalo.com/italy-esim/mamma-mia-in-10days-unlimited',
  status: 'active',
};
assert.equal(
  resolveSourceRegistryEntry(airaloEurope, [historicDeepLinkRow]).reason,
  'source_not_registered',
);

assert.equal(
  canonicalizeRegistryUrl('https://CELLULARDATA.UBIGI.COM/'),
  'https://cellulardata.ubigi.com/',
);
assert.throws(() => canonicalizeRegistryUrl('http://example.com/'), /registry_url_invalid/);
assert.throws(() => canonicalizeRegistryUrl('https://user:pass@example.com/'), /registry_url_invalid/);

const forbiddenIdManifest = structuredClone(manifest);
forbiddenIdManifest.sources[0].sourceRegistryId = 123;
assert.throws(
  () => validateReconciliationManifest(forbiddenIdManifest),
  /environment_source_id_forbidden/,
);

const duplicateManifest = structuredClone(manifest);
duplicateManifest.sources.push(structuredClone(duplicateManifest.sources[0]));
assert.throws(() => validateReconciliationManifest(duplicateManifest), /source_audit_key_duplicate/);

const initialRows = structuredClone(registeredCommerce);
const results = reconcileManifest(manifest, registeredCommerce);
assert.equal(results.filter((result) => result.status === 'resolved').length, 2);
assert.equal(results.filter((result) => result.reason === 'source_not_registered').length, 7);
assert.deepEqual(registeredCommerce, initialRows, 'resolver must not mutate or auto-register registry rows');

console.log('Evidence source reconciliation smoke passed.');

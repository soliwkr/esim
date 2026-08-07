import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  SOURCE_REGISTRY_READ_QUERY,
  buildVerificationResult,
  formatVerificationSummary,
  parseWranglerD1ExecuteJson,
} from './verify-evidence-source-registry-remote.mjs';
import { validateReconciliationManifest } from './evidence-source-reconciliation.mjs';

assert.match(SOURCE_REGISTRY_READ_QUERY, /^SELECT\b/);
assert.doesNotMatch(
  SOURCE_REGISTRY_READ_QUERY,
  /\b(?:INSERT|UPDATE|DELETE|REPLACE|CREATE|ALTER|DROP|PRAGMA|ATTACH|DETACH|VACUUM)\b/i,
);
assert.match(SOURCE_REGISTRY_READ_QUERY, /FROM source_registry/);

const wrappedPayload = [
  {
    results: [
      {
        id: 42,
        entity_type: 'provider',
        entity_key: 'ubigi',
        source_kind: 'official_provider',
        url: 'https://cellulardata.ubigi.com/',
        status: 'active',
      },
    ],
    success: true,
    meta: { served_by: 'fixture' },
  },
];
const rows = parseWranglerD1ExecuteJson(wrappedPayload);
assert.deepEqual(rows, [
  {
    id: 42,
    entity_type: 'provider',
    entity_key: 'ubigi',
    source_kind: 'official_provider',
    url: 'https://cellulardata.ubigi.com/',
    status: 'active',
  },
]);

assert.throws(
  () => parseWranglerD1ExecuteJson({ success: true }),
  /wrangler_d1_source_registry_results_missing/,
);
assert.throws(
  () => parseWranglerD1ExecuteJson([{ results: [{ ...rows[0], id: 'not-an-id' }] }]),
  /source_registry_row_id_invalid/,
);

const manifest = validateReconciliationManifest(
  JSON.parse(await readFile('research/evidence/source-reconciliation-map.json', 'utf8')),
);
const result = buildVerificationResult(manifest, rows, '2026-08-07T00:00:00.000Z');
assert.equal(result.schemaVersion, 1);
assert.equal(result.databaseName, 'senza-roaming');
assert.equal(result.manifestSourceCount, 9);
assert.equal(result.registryRowCount, 1);
assert.deepEqual(result.counts, {
  resolved: 2,
  sourceNotRegistered: 7,
  sourceRegistryAmbiguous: 0,
});
assert.equal(result.readyForImporter, false);
assert.equal(JSON.stringify(result).includes('sourceRegistryId'), false);
assert.equal(result.results.filter((entry) => entry.status === 'resolved').length, 2);

const summary = formatVerificationSummary(result);
assert.match(summary, /Read-only verification/);
assert.match(summary, /Resolved: \*\*2\*\*/);
assert.match(summary, /Not registered: \*\*7\*\*/);
assert.match(summary, /Ready for importer: \*\*no\*\*/);
assert.equal(summary.includes('42'), false, 'environment-specific numeric registry IDs must not be emitted');

console.log('Evidence source registry verification smoke passed.');

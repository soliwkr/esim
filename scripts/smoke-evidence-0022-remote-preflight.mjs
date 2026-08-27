import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import {
  assertProtectedTablesUnchanged,
  assertSelectOnly,
  parseMigrationObjects,
  stableDigest,
  summarizeProtectedTables,
  validateMigrationInventory,
  validateSchemaState,
  validateUpstreamState,
} from './evidence-0022-remote-preflight.mjs';

assert.equal(assertSelectOnly('SELECT id FROM plans ORDER BY id;'), true);
assert.equal(assertSelectOnly("SELECT name FROM pragma_table_info('plans') ORDER BY cid;"), true);
for (const forbidden of [
  'UPDATE plans SET active=0;',
  'DELETE FROM plans;',
  'SELECT 1; SELECT 2;',
  'SELECT 1; -- comment',
]) {
  assert.throws(() => assertSelectOnly(forbidden), /evidence_0022_query_/);
}

const [migration0021Sql, migration0022Sql, migrationFiles] = await Promise.all([
  readFile('migrations/0021_evidence_upstream_storage.sql', 'utf8'),
  readFile('migrations/0022_evidence_verification_provenance.sql', 'utf8'),
  readdir('migrations'),
]);
const objects0021 = parseMigrationObjects(migration0021Sql);
const objects0022 = parseMigrationObjects(migration0022Sql);
assert.deepEqual(
  objects0021.reduce((counts, object) => ({ ...counts, [object.type]: (counts[object.type] || 0) + 1 }), {}),
  { index: 7, table: 4, trigger: 9 },
);
assert.deepEqual(
  objects0022.reduce((counts, object) => ({ ...counts, [object.type]: (counts[object.type] || 0) + 1 }), {}),
  { index: 4, table: 3, trigger: 19, view: 1 },
);

const localNames = migrationFiles.filter((name) => /^\d{4}_.+\.sql$/.test(name)).sort();
const remoteMigrations = localNames.slice(0, 21).map((name, index) => ({ id: index + 1, name }));
assert.deepEqual(validateMigrationInventory(remoteMigrations, localNames), {
  count: 21,
  latestId: 21,
  latestName: '0021_evidence_upstream_storage.sql',
  pending: ['0022_evidence_verification_provenance.sql'],
});
assert.throws(
  () => validateMigrationInventory([...remoteMigrations, { id: 22, name: localNames[21] }], localNames),
  /remote_migration_count_invalid/,
);

const columns = {
  evidence_capture_runs: [
    'id', 'run_key', 'pack_schema_version', 'scenario_key', 'scenario_json', 'started_at',
    'completed_at', 'capture_window_ms', 'source_count', 'pack_sha256', 'semantic_fingerprint',
    'baseline_run_key', 'created_at',
  ],
  evidence_snapshots: [
    'id', 'snapshot_key', 'capture_run_id', 'source_id', 'source_audit_key', 'requested_url',
    'final_url', 'redirect_chain_json', 'fetched_at', 'http_status', 'content_type',
    'capture_method', 'locale', 'currency_context', 'country_context', 'capture_context_json',
    'http_etag', 'http_last_modified', 'body_sha256', 'visible_text_sha256', 'byte_length',
    'artifact_ref', 'parser_input_version', 'capture_warnings_json', 'created_at',
  ],
  evidence_field_observations: [
    'id', 'observation_key', 'snapshot_id', 'subject_type', 'subject_key', 'provider_plan_key',
    'field_name', 'scope_json', 'coverage_state', 'raw_value_json', 'normalized_value_json',
    'evidence_locator_json', 'extractor_id', 'extractor_version', 'normalizer_version',
    'schema_version', 'source_role', 'extraction_confidence', 'warnings_json', 'observed_at',
    'proposed_valid_until', 'created_at',
  ],
  evidence_claim_candidates: [
    'id', 'candidate_key', 'observation_id', 'status', 'decision_actor', 'decision_notes',
    'decided_at', 'created_at', 'updated_at',
  ],
};
assert.equal(validateSchemaState({
  expected0021Objects: objects0021,
  remote0021Objects: objects0021.map((entry) => ({ ...entry, sql: 'fixture' })),
  columns,
  provenanceObjects: [],
  expected0021Digest: stableDigest(objects0021.map((entry) => ({ ...entry, sql: 'fixture' }))),
}), true);
assert.throws(() => validateSchemaState({
  expected0021Objects: objects0021,
  remote0021Objects: objects0021.slice(1),
  columns,
  provenanceObjects: [],
  expected0021Digest: stableDigest(objects0021.slice(1)),
}), /remote_0021_objects_invalid/);
assert.throws(() => validateSchemaState({
  expected0021Objects: objects0021,
  remote0021Objects: objects0021,
  columns,
  provenanceObjects: [{ type: 'table', name: 'evidence_claim_candidate_events' }],
  expected0021Digest: stableDigest(objects0021),
}), /provenance_objects_already_present/);
assert.throws(() => validateSchemaState({
  expected0021Objects: objects0021,
  remote0021Objects: objects0021.map((entry, index) => ({ ...entry, sql: index === 0 ? 'drift' : 'fixture' })),
  columns,
  provenanceObjects: [],
  expected0021Digest: stableDigest(objects0021.map((entry) => ({ ...entry, sql: 'fixture' }))),
}), /remote_0021_schema_digest_invalid/);

const candidates = Array.from({ length: 52 }, (_, index) => ({
  id: index + 1,
  status: 'pending',
  decision_actor: null,
  decision_notes: '',
  decided_at: null,
}));
const context = {
  remoteState: {
    runs: Array(2).fill({}),
    snapshots: Array(12).fill({}),
    observations: Array(72).fill({}),
    candidates,
  },
  plan: {
    plans: [{ action: 'existing_exact' }, { action: 'existing_exact' }],
    plannedInsertTotals: { runs: 0, snapshots: 0, observations: 0, candidates: 0 },
  },
};
assert.deepEqual(validateUpstreamState(context), { runs: 2, snapshots: 12, observations: 72, candidates: 52 });
assert.throws(
  () => validateUpstreamState({ ...context, remoteState: { ...context.remoteState, candidates: [{ ...candidates[0], status: 'accepted_for_verification' }, ...candidates.slice(1)] } }),
  /candidate_state_invalid/,
);

const protectedFixture = {
  source_registry: [{ id: 1 }],
  plans: [],
  claim_verifications: [],
  pages: [{ id: 1 }],
  outbound_clicks: [],
};
assert.equal(assertProtectedTablesUnchanged(protectedFixture, structuredClone(protectedFixture)), true);
assert.throws(
  () => assertProtectedTablesUnchanged(protectedFixture, { ...structuredClone(protectedFixture), plans: [{ id: 1 }] }),
  /protected_table_changed:plans/,
);
assert.equal(summarizeProtectedTables(protectedFixture).plans.rows, 0);
assert.equal(stableDigest({ b: 2, a: 1 }), stableDigest({ a: 1, b: 2 }));

const implementation = await readFile('scripts/evidence-0022-remote-preflight.mjs', 'utf8');
assert.doesNotMatch(implementation, /d1\s+migrations\s+apply/i);
assert.doesNotMatch(implementation, /wrangler\s+deploy/i);
assert.doesNotMatch(implementation, /buildEvidenceImportSql\s*\(/);
assert.match(implementation, /remoteMigrationApplied:\s*false/);
assert.match(implementation, /applyAuthorized:\s*false/);
assert.match(implementation, /domainRowWrites:\s*0/);

const workflow = await readFile('.github/workflows/evidence-0022-remote-preflight.yml', 'utf8');
assert.match(workflow, /permissions:\s*\n\s*contents:\s*read/);
assert.doesNotMatch(workflow, /d1\s+migrations\s+apply/i);
assert.doesNotMatch(workflow, /wrangler\s+deploy/i);
assert.doesNotMatch(workflow, /evidence-controlled-ingest\.mjs/);
assert.doesNotMatch(workflow, /evidence-source-registry-onboarding\.mjs\s+--remote/);

console.log('Evidence 0022 remote read-only preflight smoke: ok');

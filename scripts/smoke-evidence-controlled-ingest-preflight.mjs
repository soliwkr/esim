import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  buildControlledIngestPreflight,
  materializeProductionArtifactRefs,
  parseD1Rows,
  validateCrossModelIdentity,
  validateRemoteMigrationState,
} from './evidence-controlled-ingest-preflight.mjs';
import { rawEvidenceArtifactDescriptor } from './evidence-artifact-storage.mjs';

const source = Object.freeze({
  sourceKey: 'source-a',
  bodySha256: `sha256:${'a'.repeat(64)}`,
  byteLength: 123,
  contentType: 'text/html',
});

const baseModel = Object.freeze({
  packId: `pack:sha256:${'b'.repeat(64)}`,
  run: Object.freeze({ run_key: `run:sha256:${'c'.repeat(64)}` }),
  snapshots: Object.freeze([Object.freeze({
    snapshot_key: `snapshot-import:sha256:${'d'.repeat(64)}`,
    pack_source_key: 'source-a',
    artifact_ref: 'local/should/not/survive.html',
  })]),
  observations: Object.freeze([Object.freeze({ observation_key: `observation:sha256:${'e'.repeat(64)}` })]),
  candidates: Object.freeze([Object.freeze({ candidate_key: `candidate:sha256:${'f'.repeat(64)}` })]),
});

const productionModel = materializeProductionArtifactRefs(baseModel, { sources: [source] });
assert.equal(
  productionModel.snapshots[0].artifact_ref,
  rawEvidenceArtifactDescriptor(source).artifactRef,
);
assert.match(productionModel.snapshots[0].artifact_ref, /^r2:\/\/evidence-artifacts\/v1\/raw\/sha256\//);

assert.equal(validateCrossModelIdentity([productionModel]), true);
assert.throws(
  () => validateCrossModelIdentity([productionModel, productionModel]),
  /controlled_ingest_cross_pack_run_collision/,
);

const emptyState = Object.freeze({ runs: [], snapshots: [], observations: [], candidates: [] });
const plan = buildControlledIngestPreflight({ models: [productionModel], remoteState: emptyState });
assert.equal(plan.ready, true);
assert.equal(plan.plans[0].action, 'insert');
assert.deepEqual(plan.plannedInsertTotals, {
  runs: 1,
  snapshots: 1,
  observations: 1,
  candidates: 1,
});
assert.equal(plan.plans[0].artifactRefs[0], productionModel.snapshots[0].artifact_ref);

const migrations = Array.from({ length: 21 }, (_, index) => ({
  id: index + 1,
  name: index === 20
    ? '0021_evidence_upstream_storage.sql'
    : `${String(index + 1).padStart(4, '0')}_fixture.sql`,
}));
assert.deepEqual(validateRemoteMigrationState(migrations), {
  count: 21,
  latestId: 21,
  latestName: '0021_evidence_upstream_storage.sql',
});
assert.throws(() => validateRemoteMigrationState(migrations.slice(0, 20)), /migration_count_invalid/);

assert.deepEqual(
  parseD1Rows([{ results: [{ id: 1 }] }]),
  [{ id: 1 }],
);

const implementation = await readFile('scripts/evidence-controlled-ingest-preflight.mjs', 'utf8');
assert.doesNotMatch(implementation, /buildEvidenceImportSql\s*\(/);
assert.doesNotMatch(implementation, /stageApprovedEvidence\s*\(/);
assert.doesNotMatch(implementation, /putRemoteObjectCreateOnly\s*\(/);
assert.match(implementation, /controlled_ingest_remote_query_must_be_select/);
assert.match(implementation, /d1Mutated:\s*false/);

const workflow = await readFile('.github/workflows/evidence-controlled-ingest-preflight.yml', 'utf8');
assert.match(workflow, /permissions:\s*\n\s*contents:\s*read/);
assert.doesNotMatch(workflow, /STAGE_APPROVED_EVIDENCE_R2/);
assert.doesNotMatch(workflow, /PROVISION_EVIDENCE_R2/);
assert.doesNotMatch(workflow, /d1\s+migrations\s+apply/i);
assert.doesNotMatch(workflow, /evidence-pack-importer\.mjs\s+--remote/);

console.log('Evidence controlled ingest read-only preflight smoke: ok');

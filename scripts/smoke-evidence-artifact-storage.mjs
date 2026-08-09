import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as storage from './evidence-artifact-storage.mjs';

const policy = JSON.parse(await readFile('research/evidence/artifact-storage-policy.json', 'utf8'));

assert.equal(policy.schemaVersion, 1);
assert.equal(policy.provider, 'cloudflare_r2');
assert.equal(policy.logicalStore, storage.EVIDENCE_ARTIFACT_STORE);
assert.equal(policy.artifactRefScheme, storage.EVIDENCE_ARTIFACT_REF_SCHEME);
assert.equal(policy.objectKeyVersion, storage.EVIDENCE_ARTIFACT_KEY_VERSION);
assert.equal(policy.writePolicy, 'create_only_content_addressed');
assert.equal(policy.conditionalCreate, 'If-None-Match: *');
assert.equal(policy.overwriteAllowed, false);
assert.equal(policy.deleteInOperationalPath, false);
assert.equal(policy.objectLockSupported, false);
assert.equal(policy.remoteProvisioningAuthorized, false);

const body = Buffer.from('<!doctype html><html><body>fixture</body></html>');
const bodySha256 = storage.sha256Bytes(body);
const source = {
  bodySha256,
  byteLength: body.length,
  contentType: 'text/html; charset=utf-8',
};
const raw = storage.rawEvidenceArtifactDescriptor(source);

assert.match(raw.objectKey, /^v1\/raw\/sha256\/[0-9a-f]{2}\/[0-9a-f]{64}\.html$/);
assert.equal(raw.artifactRef, `r2://evidence-artifacts/${raw.objectKey}`);
assert.equal(raw.sha256, bodySha256);
assert.equal(raw.createOnly, true);
assert.deepEqual(raw.conditionalWrite, { ifNoneMatch: '*' });
assert.equal(storage.verifyArtifactBytes(body, raw), true);
assert.equal(raw.objectKey.includes('provider'), false);
assert.equal(raw.objectKey.includes('http'), false);

const same = storage.rawEvidenceArtifactDescriptor(source);
assert.equal(same.objectKey, raw.objectKey);
assert.equal(same.artifactRef, raw.artifactRef);

const differentBody = Buffer.from('<!doctype html><html><body>different</body></html>');
const different = storage.rawEvidenceArtifactDescriptor({
  bodySha256: storage.sha256Bytes(differentBody),
  byteLength: differentBody.length,
  contentType: 'text/html',
});
assert.notEqual(different.objectKey, raw.objectKey);

const packBytes = Buffer.from('{"schemaVersion":1}\n');
const pack = storage.packEvidenceArtifactDescriptor({
  packSha256: storage.sha256Bytes(packBytes),
  byteLength: packBytes.length,
});
assert.match(pack.objectKey, /^v1\/packs\/sha256\/[0-9a-f]{2}\/[0-9a-f]{64}\.json$/);
assert.equal(pack.artifactRef, `r2://evidence-artifacts/${pack.objectKey}`);
assert.equal(storage.verifyArtifactBytes(packBytes, pack), true);

assert.throws(
  () => storage.rawEvidenceArtifactDescriptor({ bodySha256: 'sha256:nope', byteLength: 1, contentType: 'text/html' }),
  /artifact_body_sha256_invalid/,
);
assert.throws(
  () => storage.rawEvidenceArtifactDescriptor({ bodySha256, byteLength: body.length, contentType: 'text/plain' }),
  /artifact_content_type_unsupported/,
);
assert.throws(
  () => storage.verifyArtifactBytes(Buffer.from('tampered'), raw),
  /artifact_integrity_mismatch/,
);
assert.throws(
  () => storage.evidenceArtifactRef('../escape'),
  /artifact_object_key_invalid/,
);

for (const forbiddenExport of ['deleteArtifact', 'overwriteArtifact', 'replaceArtifact']) {
  assert.equal(forbiddenExport in storage, false, `${forbiddenExport} must not exist in storage foundation`);
}

console.log('Evidence artifact storage contract smoke: ok');

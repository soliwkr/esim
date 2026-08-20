import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { sha256Bytes } from './evidence-artifact-storage.mjs';
import {
  inventoryApprovedEvidence,
  putRemoteObjectCreateOnly,
  readRemoteObject,
  validateStagingPolicy,
} from './evidence-r2-staging-gate.mjs';

const root = await mkdtemp(path.join(os.tmpdir(), 'evidence-r2-staging-smoke-'));

function sourceRecord(sourceKey, bytes) {
  return {
    schemaVersion: 1,
    sourceKey,
    provider: 'fixture',
    role: 'official_policy',
    sourceAuditKey: `fixture-${sourceKey}`,
    snapshotId: `snapshot:sha256:${'1'.repeat(64)}`,
    requestedUrl: 'https://example.com/',
    canonicalRequestedUrl: 'https://example.com/',
    finalUrl: 'https://example.com/',
    canonicalFinalUrl: 'https://example.com/',
    redirectChain: [],
    fetchedAt: '2026-08-12T00:00:00.000Z',
    httpStatus: 200,
    contentType: 'text/html;charset=utf-8',
    locale: 'en',
    etag: null,
    lastModified: null,
    bodySha256: sha256Bytes(bytes),
    byteLength: bytes.length,
    visibleTextSha256: `sha256:${'2'.repeat(64)}`,
  };
}

async function writePack(name, packId, sharedBytes) {
  const dir = path.join(root, 'research', 'evidence', 'replacement', name, 'capture');
  const sourcesDir = path.join(dir, 'sources');
  await mkdir(sourcesDir, { recursive: true });
  const sources = [];
  for (let index = 0; index < 6; index += 1) {
    const sourceKey = index === 3 ? 'shared-policy' : `${name}-source-${index}`;
    const bytes = index === 3 ? sharedBytes : Buffer.from(`<html>${name}-${index}</html>`);
    await writeFile(path.join(sourcesDir, `${sourceKey}.html`), bytes);
    sources.push(sourceRecord(sourceKey, bytes));
  }
  const pack = {
    schemaVersion: 1,
    packId,
    scenario: { id: `${name}-fixture` },
    startedAt: '2026-08-12T00:00:00.000Z',
    completedAt: '2026-08-12T00:00:01.000Z',
    captureWindowMs: 1000,
    sources,
    offers: [],
    ranking: { status: 'not_computed' },
    semanticFingerprint: `sha256:${'3'.repeat(64)}`,
    artifactLocation: null,
  };
  const bytes = Buffer.from(`${JSON.stringify(pack, null, 2)}\n`);
  await writeFile(path.join(dir, 'pack.json'), bytes);
  return { pack, bytes };
}

try {
  const sharedBytes = Buffer.from('<html>shared</html>');
  const italyId = `pack:sha256:${'a'.repeat(64)}`;
  const europeId = `pack:sha256:${'b'.repeat(64)}`;
  const italy = await writePack('italy', italyId, sharedBytes);
  const europe = await writePack('europe', europeId, sharedBytes);
  await mkdir(path.join(root, 'artifacts'), { recursive: true });
  await writeFile(path.join(root, 'artifacts', 'evidence-replacement-capture-summary.json'), '{}\n');

  const policy = {
    schemaVersion: 1,
    logicalStore: 'evidence-artifacts',
    bucketName: 'fixture-evidence-bucket',
    authorizedBaseSha: '9'.repeat(40),
    captureRunId: 1,
    captureHeadSha: '8'.repeat(40),
    artifactId: 2,
    artifactName: 'fixture',
    artifactSizeBytes: 123,
    zipSha256: `sha256:${'4'.repeat(64)}`,
    expectedFileCount: 15,
    expectedRawHtmlCount: 12,
    expectedPackJsonCount: 2,
    expectedSummaryCount: 1,
    expectedUniqueRawObjectCount: 11,
    expectedUniquePackObjectCount: 2,
    expectedUniqueObjectCount: 13,
    approvedPacks: [
      { packId: italyId, artifactSha256: sha256Bytes(italy.bytes), byteLength: italy.bytes.length },
      { packId: europeId, artifactSha256: sha256Bytes(europe.bytes), byteLength: europe.bytes.length },
    ],
    writePolicy: 'create_only_content_addressed',
    conditionalCreate: 'If-None-Match: *',
    requireNativeBucketLock: true,
    bucketLockRuleId: 'evidence-v1-indefinite',
    protectedPrefix: 'v1/',
    stageSummary: false,
    authorizationConfirmation: 'STAGE_APPROVED_EVIDENCE_R2',
  };

  assert.equal(validateStagingPolicy(policy), true);
  const inventory = await inventoryApprovedEvidence(root, policy);
  assert.equal(inventory.logicalRawReferenceCount, 12);
  assert.equal(inventory.uniqueRawObjectCount, 11);
  assert.equal(inventory.uniquePackObjectCount, 2);
  assert.equal(inventory.uniqueObjectCount, 13);

  const packEntries = inventory.objects.filter((entry) => entry.kind === 'pack_json');
  assert.equal(packEntries.length, 2);
  for (const entry of packEntries) {
    assert.match(entry.descriptor.objectKey, /^v1\/packs\/sha256\/[0-9a-f]{2}\/[0-9a-f]{64}\.json$/);
    assert.equal(entry.descriptor.sha256.startsWith('sha256:'), true);
    assert.equal(entry.descriptor.sha256.replace('sha256:', 'pack:sha256:') === entry.packId, false);
  }

  const rawEntry = inventory.objects.find((entry) => entry.kind === 'raw_source');
  let capturedRequest = null;
  const putFetch = async (url, init) => {
    capturedRequest = { url, init };
    return new Response(JSON.stringify({
      success: true,
      result: {
        key: rawEntry.descriptor.objectKey,
        size: String(rawEntry.descriptor.byteLength),
        etag: 'fixture-etag',
        version: 'fixture-version',
      },
    }), { status: 200, headers: { 'content-type': 'application/json' } });
  };
  const putResult = await putRemoteObjectCreateOnly(putFetch, {
    accountId: 'account',
    apiToken: 'token',
    bucketName: policy.bucketName,
    entry: rawEntry,
  });
  assert.equal(putResult.key, rawEntry.descriptor.objectKey);
  assert.equal(capturedRequest.init.method, 'PUT');
  assert.equal(capturedRequest.init.headers['If-None-Match'], '*');
  assert.equal(capturedRequest.init.headers['cf-r2-storage-class'], 'Standard');
  assert.equal(capturedRequest.init.body instanceof FormData, true);

  const missing = await readRemoteObject(
    async () => new Response('', { status: 404 }),
    { accountId: 'account', apiToken: 'token', bucketName: policy.bucketName, objectKey: rawEntry.descriptor.objectKey },
  );
  assert.equal(missing.exists, false);

  const present = await readRemoteObject(
    async () => new Response(rawEntry.bytes, { status: 200 }),
    { accountId: 'account', apiToken: 'token', bucketName: policy.bucketName, objectKey: rawEntry.descriptor.objectKey },
  );
  assert.equal(present.exists, true);
  assert.equal(sha256Bytes(present.bytes), rawEntry.descriptor.sha256);

  const rawPath = inventory.files.find((file) => file.endsWith('italy-source-0.html'));
  const absoluteRaw = path.join(root, ...rawPath.split('/'));
  const original = await readFile(absoluteRaw);
  await writeFile(absoluteRaw, Buffer.from('tampered'));
  await assert.rejects(() => inventoryApprovedEvidence(root, policy), /artifact_integrity_mismatch/);
  await writeFile(absoluteRaw, original);

  assert.throws(
    () => validateStagingPolicy({ ...policy, stageSummary: true }),
    /r2_staging_summary_must_not_be_staged/,
  );
  assert.throws(
    () => validateStagingPolicy({ ...policy, conditionalCreate: 'none' }),
    /r2_staging_conditional_create_invalid/,
  );

  console.log('Evidence R2 staging gate smoke: ok');
} finally {
  await rm(root, { recursive: true, force: true });
}

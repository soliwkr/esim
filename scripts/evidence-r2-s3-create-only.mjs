import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifyArtifactBytes } from './evidence-artifact-storage.mjs';
import {
  inventoryApprovedEvidence,
  loadStagingPolicy,
  preflightEvidenceStaging,
  readRemoteObject,
  verifyEvidenceStaging,
} from './evidence-r2-staging-gate.mjs';

function requireString(value, label) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${label}_invalid`);
  return value.trim();
}

function safeCreatedObject(entry, result) {
  return {
    kind: entry.kind,
    objectKey: entry.descriptor.objectKey,
    artifactRef: entry.descriptor.artifactRef,
    sha256: entry.descriptor.sha256,
    byteLength: entry.descriptor.byteLength,
    contentType: entry.descriptor.contentType,
    logicalReferences: [...entry.logicalReferences].sort(),
    ...(entry.packId ? { packId: entry.packId } : {}),
    transport: 'r2-s3-sigv4',
    conditionalCreate: 'If-None-Match: *',
    etag: result.etag,
  };
}

export function buildPutObjectArgs({ accountId, bucketName, entry, bodyPath }) {
  const account = requireString(accountId, 'cloudflare_account_id');
  const bucket = requireString(bucketName, 'r2_bucket_name');
  const objectKey = requireString(entry?.descriptor?.objectKey, 'r2_object_key');
  const contentType = requireString(entry?.descriptor?.contentType, 'r2_content_type');
  const body = requireString(bodyPath, 'r2_body_path');
  return [
    's3api',
    'put-object',
    '--endpoint-url', `https://${account}.r2.cloudflarestorage.com`,
    '--region', 'auto',
    '--bucket', bucket,
    '--key', objectKey,
    '--body', body,
    '--if-none-match', '*',
    '--content-type', contentType,
    '--storage-class', 'STANDARD',
    '--output', 'json',
    '--no-cli-pager',
  ];
}

export function putObjectS3CreateOnly(spawnImpl, options) {
  const { accountId, bucketName, entry, bodyPath } = options;
  const args = buildPutObjectArgs({ accountId, bucketName, entry, bodyPath });
  const result = spawnImpl('aws', args, {
    env: process.env,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024,
  });
  if (result?.error) {
    throw new Error(`r2_s3_object_create_process_failed:${entry.descriptor.objectKey}`);
  }
  if (result?.status !== 0) {
    throw new Error(`r2_s3_object_create_failed:${result?.status ?? 'unknown'}:${entry.descriptor.objectKey}`);
  }
  let payload = {};
  if (typeof result.stdout === 'string' && result.stdout.trim()) {
    try {
      payload = JSON.parse(result.stdout);
    } catch {
      throw new Error(`r2_s3_object_create_response_not_json:${entry.descriptor.objectKey}`);
    }
  }
  return {
    etag: typeof payload.ETag === 'string' ? payload.ETag : null,
  };
}

async function stageApprovedEvidenceS3({ rootDir, outputPath }) {
  const accountId = requireString(process.env.CLOUDFLARE_ACCOUNT_ID, 'cloudflare_account_id');
  const apiToken = requireString(process.env.CLOUDFLARE_API_TOKEN, 'cloudflare_api_token');
  requireString(process.env.AWS_ACCESS_KEY_ID, 'aws_access_key_id');
  requireString(process.env.AWS_SECRET_ACCESS_KEY, 'aws_secret_access_key');

  const policy = await loadStagingPolicy();
  const inventory = await inventoryApprovedEvidence(rootDir, policy);
  const options = { accountId, apiToken, policy, inventory };

  const preflight = await preflightEvidenceStaging(options);
  if (preflight.ready !== true || preflight.targetObjectCount !== inventory.uniqueObjectCount) {
    throw new Error('r2_s3_staging_preflight_not_ready');
  }

  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), 'evidence-r2-s3-stage-'));
  const created = [];
  try {
    for (const [index, entry] of inventory.objects.entries()) {
      const bodyPath = path.join(temporaryRoot, `${String(index).padStart(2, '0')}.bin`);
      await writeFile(bodyPath, entry.bytes);
      const result = putObjectS3CreateOnly(spawnSync, {
        accountId,
        bucketName: policy.bucketName,
        entry,
        bodyPath,
      });

      const remote = await readRemoteObject(fetch, {
        accountId,
        apiToken,
        bucketName: policy.bucketName,
        objectKey: entry.descriptor.objectKey,
      });
      if (!remote.exists) throw new Error(`r2_s3_post_create_missing:${entry.descriptor.objectKey}`);
      verifyArtifactBytes(remote.bytes, entry.descriptor);
      created.push(safeCreatedObject(entry, result));
    }
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }

  const verification = await verifyEvidenceStaging(options);
  const audit = {
    checkedAt: new Date().toISOString(),
    mode: 'stage',
    transport: 'r2-s3-sigv4',
    conditionalCreate: 'If-None-Match: *',
    approval: {
      authorizedBaseSha: policy.authorizedBaseSha,
      captureRunId: policy.captureRunId,
      captureHeadSha: policy.captureHeadSha,
      artifactId: policy.artifactId,
      artifactName: policy.artifactName,
      artifactSizeBytes: policy.artifactSizeBytes,
      zipSha256: policy.zipSha256,
      approvedPackIds: policy.approvedPacks.map((pack) => pack.packId).sort(),
    },
    inventory: {
      fileCount: inventory.files.length,
      logicalRawReferenceCount: inventory.logicalRawReferenceCount,
      uniqueRawObjectCount: inventory.uniqueRawObjectCount,
      uniquePackObjectCount: inventory.uniquePackObjectCount,
      uniqueObjectCount: inventory.uniqueObjectCount,
    },
    preflight,
    createdObjectCount: created.length,
    created,
    verification,
    d1Mutated: false,
    claimsVerified: false,
    affiliateEnabled: false,
    published: false,
    deployed: false,
  };
  await writeFile(outputPath, `${JSON.stringify(audit, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify(audit, null, 2));
  return audit;
}

async function main() {
  const [mode, rootDir, outputPath] = process.argv.slice(2);
  if (mode !== 'stage' || !rootDir || !outputPath) {
    throw new Error('Usage: node scripts/evidence-r2-s3-create-only.mjs stage <artifact-root> <output.json>');
  }
  await stageApprovedEvidenceS3({ rootDir, outputPath });
}

const invokedAsScript = process.argv[1]
  && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (invokedAsScript) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}

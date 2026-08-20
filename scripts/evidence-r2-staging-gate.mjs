import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  packEvidenceArtifactDescriptor,
  rawEvidenceArtifactDescriptor,
  sha256Bytes,
  verifyArtifactBytes,
} from './evidence-artifact-storage.mjs';
import {
  loadProvisioningPolicy,
  readRemoteR2State,
  validateRemoteState,
} from './evidence-r2-provisioning-gate.mjs';

const API_BASE = 'https://api.cloudflare.com/client/v4';
const DEFAULT_STAGING_POLICY_PATH = 'research/evidence/r2-staging-policy.json';

function requireString(value, label) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${label}_invalid`);
  return value.trim();
}

function normalizeSha256(value, label) {
  const normalized = requireString(value, label);
  if (!/^sha256:[0-9a-f]{64}$/.test(normalized)) throw new Error(`${label}_invalid`);
  return normalized;
}

function normalizePackId(value, label) {
  const normalized = requireString(value, label);
  if (!/^pack:sha256:[0-9a-f]{64}$/.test(normalized)) throw new Error(`${label}_invalid`);
  return normalized;
}

function sortedUnique(values) {
  return [...new Set(values)].sort();
}

export function validateStagingPolicy(policy) {
  if (!policy || typeof policy !== 'object') throw new Error('r2_staging_policy_invalid');
  if (policy.schemaVersion !== 1) throw new Error('r2_staging_policy_schema_unsupported');
  if (policy.logicalStore !== 'evidence-artifacts') throw new Error('r2_staging_policy_logical_store_invalid');
  if (!/^[a-z0-9][a-z0-9-]{1,62}$/.test(requireString(policy.bucketName, 'r2_staging_bucket'))) {
    throw new Error('r2_staging_bucket_invalid');
  }
  if (!/^[0-9a-f]{40}$/.test(requireString(policy.authorizedBaseSha, 'r2_staging_authorized_base_sha'))) {
    throw new Error('r2_staging_authorized_base_sha_invalid');
  }
  if (!Number.isInteger(policy.captureRunId) || policy.captureRunId < 1) throw new Error('r2_staging_capture_run_invalid');
  if (!/^[0-9a-f]{40}$/.test(requireString(policy.captureHeadSha, 'r2_staging_capture_head_sha'))) {
    throw new Error('r2_staging_capture_head_sha_invalid');
  }
  if (!Number.isInteger(policy.artifactId) || policy.artifactId < 1) throw new Error('r2_staging_artifact_id_invalid');
  requireString(policy.artifactName, 'r2_staging_artifact_name');
  if (!Number.isInteger(policy.artifactSizeBytes) || policy.artifactSizeBytes < 1) throw new Error('r2_staging_artifact_size_invalid');
  normalizeSha256(policy.zipSha256, 'r2_staging_zip_sha256');
  for (const key of [
    'expectedFileCount',
    'expectedRawHtmlCount',
    'expectedPackJsonCount',
    'expectedSummaryCount',
    'expectedUniqueRawObjectCount',
    'expectedUniquePackObjectCount',
    'expectedUniqueObjectCount',
  ]) {
    if (!Number.isInteger(policy[key]) || policy[key] < 0) throw new Error(`r2_staging_${key}_invalid`);
  }
  if (!Array.isArray(policy.approvedPacks) || policy.approvedPacks.length !== policy.expectedPackJsonCount) {
    throw new Error('r2_staging_approved_packs_invalid');
  }
  const approvedIds = [];
  for (const [index, pack] of policy.approvedPacks.entries()) {
    approvedIds.push(normalizePackId(pack?.packId, `r2_staging_approved_pack_${index}_id`));
    normalizeSha256(pack?.artifactSha256, `r2_staging_approved_pack_${index}_artifact_sha256`);
    if (!Number.isInteger(pack?.byteLength) || pack.byteLength < 1) {
      throw new Error(`r2_staging_approved_pack_${index}_byte_length_invalid`);
    }
  }
  if (sortedUnique(approvedIds).length !== approvedIds.length) throw new Error('r2_staging_approved_pack_duplicate');
  if (policy.writePolicy !== 'create_only_content_addressed') throw new Error('r2_staging_write_policy_invalid');
  if (policy.conditionalCreate !== 'If-None-Match: *') throw new Error('r2_staging_conditional_create_invalid');
  if (policy.requireNativeBucketLock !== true) throw new Error('r2_staging_bucket_lock_required');
  if (policy.bucketLockRuleId !== 'evidence-v1-indefinite') throw new Error('r2_staging_bucket_lock_rule_invalid');
  if (policy.protectedPrefix !== 'v1/') throw new Error('r2_staging_protected_prefix_invalid');
  if (policy.stageSummary !== false) throw new Error('r2_staging_summary_must_not_be_staged');
  if (policy.authorizationConfirmation !== 'STAGE_APPROVED_EVIDENCE_R2') {
    throw new Error('r2_staging_confirmation_invalid');
  }
  return true;
}

export async function loadStagingPolicy(policyPath = DEFAULT_STAGING_POLICY_PATH) {
  const policy = JSON.parse(await readFile(policyPath, 'utf8'));
  validateStagingPolicy(policy);
  return policy;
}

async function walkFiles(root) {
  const output = [];
  async function visit(current) {
    const entries = await readdir(current, { withFileTypes: true });
    entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) await visit(absolute);
      else if (entry.isFile()) output.push(absolute);
    }
  }
  await visit(root);
  return output;
}

function relativePosix(root, absolute) {
  return path.relative(root, absolute).split(path.sep).join('/');
}

function approvedPackById(policy) {
  return new Map(policy.approvedPacks.map((pack) => [pack.packId, pack]));
}

function serializableObject(entry) {
  return {
    kind: entry.kind,
    objectKey: entry.descriptor.objectKey,
    artifactRef: entry.descriptor.artifactRef,
    sha256: entry.descriptor.sha256,
    byteLength: entry.descriptor.byteLength,
    contentType: entry.descriptor.contentType,
    logicalReferences: [...entry.logicalReferences].sort(),
    ...(entry.packId ? { packId: entry.packId } : {}),
  };
}

export async function inventoryApprovedEvidence(rootDir, policy) {
  validateStagingPolicy(policy);
  const root = path.resolve(rootDir);
  const files = await walkFiles(root);
  const relativeFiles = files.map((file) => relativePosix(root, file));
  const rawFiles = relativeFiles.filter((file) => file.endsWith('.html'));
  const packFiles = relativeFiles.filter((file) => file.endsWith('/pack.json'));
  const summaryFiles = relativeFiles.filter((file) => file === 'artifacts/evidence-replacement-capture-summary.json');

  if (relativeFiles.length !== policy.expectedFileCount) {
    throw new Error(`r2_staging_file_count_mismatch:${relativeFiles.length}`);
  }
  if (rawFiles.length !== policy.expectedRawHtmlCount) {
    throw new Error(`r2_staging_raw_count_mismatch:${rawFiles.length}`);
  }
  if (packFiles.length !== policy.expectedPackJsonCount) {
    throw new Error(`r2_staging_pack_count_mismatch:${packFiles.length}`);
  }
  if (summaryFiles.length !== policy.expectedSummaryCount) {
    throw new Error(`r2_staging_summary_count_mismatch:${summaryFiles.length}`);
  }
  const allowedFiles = new Set([...rawFiles, ...packFiles, ...summaryFiles]);
  const extras = relativeFiles.filter((file) => !allowedFiles.has(file));
  if (extras.length > 0) throw new Error(`r2_staging_unexpected_files:${extras.join(',')}`);

  const approved = approvedPackById(policy);
  const observedPackIds = [];
  const objectMap = new Map();
  let logicalRawReferenceCount = 0;
  const referencedRawFiles = new Set();

  function addObject(entry) {
    const existing = objectMap.get(entry.descriptor.objectKey);
    if (!existing) {
      objectMap.set(entry.descriptor.objectKey, entry);
      return;
    }
    if (
      existing.descriptor.sha256 !== entry.descriptor.sha256
      || existing.descriptor.byteLength !== entry.descriptor.byteLength
      || !existing.bytes.equals(entry.bytes)
    ) {
      throw new Error(`r2_staging_content_address_collision:${entry.descriptor.objectKey}`);
    }
    for (const reference of entry.logicalReferences) existing.logicalReferences.add(reference);
  }

  for (const packFile of packFiles.sort()) {
    const absolutePack = path.join(root, ...packFile.split('/'));
    const packBytes = await readFile(absolutePack);
    const pack = JSON.parse(packBytes.toString('utf8'));
    const packId = normalizePackId(pack?.packId, 'r2_staging_pack_id');
    const approvedPack = approved.get(packId);
    if (!approvedPack) throw new Error(`r2_staging_pack_not_approved:${packId}`);
    observedPackIds.push(packId);

    const actualPackSha = sha256Bytes(packBytes);
    if (actualPackSha !== approvedPack.artifactSha256) {
      throw new Error(`r2_staging_pack_artifact_sha_mismatch:${packId}`);
    }
    if (packBytes.length !== approvedPack.byteLength) {
      throw new Error(`r2_staging_pack_artifact_size_mismatch:${packId}`);
    }
    const packDescriptor = packEvidenceArtifactDescriptor({
      packSha256: actualPackSha,
      byteLength: packBytes.length,
    });
    verifyArtifactBytes(packBytes, packDescriptor);
    addObject({
      kind: 'pack_json',
      packId,
      descriptor: packDescriptor,
      bytes: packBytes,
      logicalReferences: new Set([packFile]),
    });

    if (!Array.isArray(pack.sources) || pack.sources.length < 1) {
      throw new Error(`r2_staging_pack_sources_invalid:${packId}`);
    }
    const packDir = path.posix.dirname(packFile);
    for (const source of pack.sources) {
      const sourceKey = requireString(source?.sourceKey, 'r2_staging_source_key');
      const relativeRaw = `${packDir}/sources/${sourceKey}.html`;
      if (!rawFiles.includes(relativeRaw)) {
        throw new Error(`r2_staging_raw_missing:${relativeRaw}`);
      }
      if (referencedRawFiles.has(relativeRaw)) throw new Error(`r2_staging_raw_referenced_twice:${relativeRaw}`);
      referencedRawFiles.add(relativeRaw);
      const rawBytes = await readFile(path.join(root, ...relativeRaw.split('/')));
      const descriptor = rawEvidenceArtifactDescriptor(source);
      verifyArtifactBytes(rawBytes, descriptor);
      logicalRawReferenceCount += 1;
      addObject({
        kind: 'raw_source',
        descriptor,
        bytes: rawBytes,
        logicalReferences: new Set([`${packId}:${sourceKey}:${relativeRaw}`]),
      });
    }
  }

  const expectedPackIds = sortedUnique([...approved.keys()]);
  if (JSON.stringify(sortedUnique(observedPackIds)) !== JSON.stringify(expectedPackIds)) {
    throw new Error('r2_staging_pack_identity_set_mismatch');
  }
  if (logicalRawReferenceCount !== policy.expectedRawHtmlCount) {
    throw new Error(`r2_staging_raw_reference_count_mismatch:${logicalRawReferenceCount}`);
  }
  if (JSON.stringify([...referencedRawFiles].sort()) !== JSON.stringify([...rawFiles].sort())) {
    throw new Error('r2_staging_raw_reference_set_mismatch');
  }

  const objects = [...objectMap.values()].sort((a, b) => a.descriptor.objectKey.localeCompare(b.descriptor.objectKey));
  const uniqueRaw = objects.filter((entry) => entry.kind === 'raw_source').length;
  const uniquePacks = objects.filter((entry) => entry.kind === 'pack_json').length;
  if (uniqueRaw !== policy.expectedUniqueRawObjectCount) {
    throw new Error(`r2_staging_unique_raw_count_mismatch:${uniqueRaw}`);
  }
  if (uniquePacks !== policy.expectedUniquePackObjectCount) {
    throw new Error(`r2_staging_unique_pack_count_mismatch:${uniquePacks}`);
  }
  if (objects.length !== policy.expectedUniqueObjectCount) {
    throw new Error(`r2_staging_unique_object_count_mismatch:${objects.length}`);
  }

  return {
    root,
    files: relativeFiles.sort(),
    observedPackIds: sortedUnique(observedPackIds),
    logicalRawReferenceCount,
    uniqueRawObjectCount: uniqueRaw,
    uniquePackObjectCount: uniquePacks,
    uniqueObjectCount: objects.length,
    objects,
  };
}

function objectApiUrl(accountId, bucketName, objectKey) {
  const safeAccount = encodeURIComponent(requireString(accountId, 'cloudflare_account_id'));
  const safeBucket = encodeURIComponent(requireString(bucketName, 'r2_bucket_name'));
  const safeKey = objectKey.split('/').map((segment) => encodeURIComponent(segment)).join('/');
  return `${API_BASE}/accounts/${safeAccount}/r2/buckets/${safeBucket}/objects/${safeKey}`;
}

async function parseJsonResponse(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`cloudflare_object_response_not_json:${response.status}`);
  }
}

export async function readRemoteObject(fetchImpl, { accountId, apiToken, bucketName, objectKey }) {
  const response = await fetchImpl(objectApiUrl(accountId, bucketName, objectKey), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${requireString(apiToken, 'cloudflare_api_token')}`,
    },
  });
  if (response.status === 404) return { exists: false, status: 404, bytes: null };
  if (!response.ok) throw new Error(`cloudflare_object_get_failed:${response.status}:${objectKey}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  return { exists: true, status: response.status, bytes };
}

export async function putRemoteObjectCreateOnly(fetchImpl, { accountId, apiToken, bucketName, entry }) {
  const form = new FormData();
  form.set('body', new Blob([entry.bytes], { type: entry.descriptor.contentType }), path.posix.basename(entry.descriptor.objectKey));
  const response = await fetchImpl(objectApiUrl(accountId, bucketName, entry.descriptor.objectKey), {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${requireString(apiToken, 'cloudflare_api_token')}`,
      Accept: 'application/json',
      'If-None-Match': '*',
      'cf-r2-storage-class': 'Standard',
    },
    body: form,
  });
  const payload = await parseJsonResponse(response);
  if (!response.ok || payload?.success === false) {
    const code = payload?.errors?.[0]?.code ?? response.status;
    throw new Error(`cloudflare_object_create_failed:${code}:${entry.descriptor.objectKey}`);
  }
  const result = payload?.result ?? {};
  if (result.key !== entry.descriptor.objectKey) {
    throw new Error(`cloudflare_object_create_key_mismatch:${entry.descriptor.objectKey}`);
  }
  if (Number(result.size) !== entry.descriptor.byteLength) {
    throw new Error(`cloudflare_object_create_size_mismatch:${entry.descriptor.objectKey}`);
  }
  return {
    key: result.key,
    size: Number(result.size),
    etag: result.etag ?? null,
    version: result.version ?? null,
    uploaded: result.uploaded ?? null,
  };
}

async function verifyBucketContract({ fetchImpl, accountId, apiToken, policy }) {
  const provisioningPolicy = await loadProvisioningPolicy();
  if (provisioningPolicy.bucketName !== policy.bucketName) throw new Error('r2_staging_bucket_policy_mismatch');
  const state = await readRemoteR2State({
    fetchImpl,
    accountId,
    apiToken,
    policy: provisioningPolicy,
  });
  const issues = validateRemoteState(state, provisioningPolicy);
  if (issues.length > 0) throw new Error(`r2_staging_bucket_contract_invalid:${issues.join(',')}`);
  return {
    bucketName: policy.bucketName,
    jurisdiction: state.bucket?.jurisdiction ?? null,
    storageClass: state.bucket?.storageClass ?? null,
    managedPublicAccess: state.managedPublicAccess,
    customDomainCount: Array.isArray(state.customDomains) ? state.customDomains.length : null,
    lockRules: Array.isArray(state.lockRules) ? state.lockRules : [],
  };
}

export async function preflightEvidenceStaging(options) {
  const { fetchImpl = fetch, accountId, apiToken, policy, inventory } = options;
  const bucket = await verifyBucketContract({ fetchImpl, accountId, apiToken, policy });
  const collisions = [];
  for (const entry of inventory.objects) {
    const remote = await readRemoteObject(fetchImpl, {
      accountId,
      apiToken,
      bucketName: policy.bucketName,
      objectKey: entry.descriptor.objectKey,
    });
    if (remote.exists) {
      collisions.push({
        objectKey: entry.descriptor.objectKey,
        expectedSha256: entry.descriptor.sha256,
        expectedByteLength: entry.descriptor.byteLength,
        actualSha256: sha256Bytes(remote.bytes),
        actualByteLength: remote.bytes.length,
      });
    }
  }
  if (collisions.length > 0) {
    throw new Error(`r2_staging_collision:${collisions.map((item) => item.objectKey).join(',')}`);
  }
  return {
    mode: 'preflight',
    ready: true,
    bucket,
    targetObjectCount: inventory.uniqueObjectCount,
    collisions: [],
  };
}

export async function verifyEvidenceStaging(options) {
  const { fetchImpl = fetch, accountId, apiToken, policy, inventory } = options;
  const bucket = await verifyBucketContract({ fetchImpl, accountId, apiToken, policy });
  const verified = [];
  for (const entry of inventory.objects) {
    const remote = await readRemoteObject(fetchImpl, {
      accountId,
      apiToken,
      bucketName: policy.bucketName,
      objectKey: entry.descriptor.objectKey,
    });
    if (!remote.exists) throw new Error(`r2_staging_verify_missing:${entry.descriptor.objectKey}`);
    verifyArtifactBytes(remote.bytes, entry.descriptor);
    verified.push(serializableObject(entry));
  }
  return {
    mode: 'verify',
    verified: true,
    bucket,
    objectCount: verified.length,
    objects: verified,
  };
}

export async function stageApprovedEvidence(options) {
  const { fetchImpl = fetch, accountId, apiToken, policy, inventory } = options;
  const preflight = await preflightEvidenceStaging(options);
  const created = [];
  for (const entry of inventory.objects) {
    const result = await putRemoteObjectCreateOnly(fetchImpl, {
      accountId,
      apiToken,
      bucketName: policy.bucketName,
      entry,
    });
    const remote = await readRemoteObject(fetchImpl, {
      accountId,
      apiToken,
      bucketName: policy.bucketName,
      objectKey: entry.descriptor.objectKey,
    });
    if (!remote.exists) throw new Error(`r2_staging_post_create_missing:${entry.descriptor.objectKey}`);
    verifyArtifactBytes(remote.bytes, entry.descriptor);
    created.push({ ...serializableObject(entry), remote: result });
  }
  const verification = await verifyEvidenceStaging(options);
  return {
    mode: 'stage',
    staged: true,
    preflight,
    createdObjectCount: created.length,
    created,
    verification,
  };
}

function auditEnvelope(policy, inventory, result) {
  return {
    checkedAt: new Date().toISOString(),
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
      objects: inventory.objects.map(serializableObject),
    },
    result,
    d1Mutated: false,
    claimsVerified: false,
    affiliateEnabled: false,
    published: false,
    deployed: false,
  };
}

async function writeAudit(outputPath, payload) {
  if (!outputPath) return;
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

async function main() {
  const [mode, rootDir, outputPath] = process.argv.slice(2);
  if (!['preflight', 'stage', 'verify'].includes(mode) || !rootDir) {
    throw new Error('Usage: node scripts/evidence-r2-staging-gate.mjs <preflight|stage|verify> <artifact-root> [output.json]');
  }
  const policy = await loadStagingPolicy();
  const inventory = await inventoryApprovedEvidence(rootDir, policy);
  const accountId = requireString(process.env.CLOUDFLARE_ACCOUNT_ID, 'cloudflare_account_id');
  const apiToken = requireString(process.env.CLOUDFLARE_API_TOKEN, 'cloudflare_api_token');
  const options = { accountId, apiToken, policy, inventory };
  const result = mode === 'preflight'
    ? await preflightEvidenceStaging(options)
    : mode === 'stage'
      ? await stageApprovedEvidence(options)
      : await verifyEvidenceStaging(options);
  const audit = auditEnvelope(policy, inventory, result);
  await writeAudit(outputPath, audit);
  console.log(JSON.stringify(audit, null, 2));
}

const invokedAsScript = process.argv[1]
  && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (invokedAsScript) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}

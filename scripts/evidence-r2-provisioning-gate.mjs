import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const API_BASE = 'https://api.cloudflare.com/client/v4';
const DEFAULT_POLICY_PATH = 'research/evidence/r2-provisioning-policy.json';

function deepSort(value) {
  if (Array.isArray(value)) return value.map(deepSort);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, deepSort(value[key])]));
  }
  return value;
}

function stableJson(value) {
  return JSON.stringify(deepSort(value));
}

function requireString(value, label) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${label}_invalid`);
  return value.trim();
}

export async function loadProvisioningPolicy(policyPath = DEFAULT_POLICY_PATH) {
  const policy = JSON.parse(await readFile(policyPath, 'utf8'));
  validateProvisioningPolicy(policy);
  return policy;
}

export function validateProvisioningPolicy(policy) {
  if (!policy || typeof policy !== 'object') throw new Error('r2_policy_invalid');
  if (policy.schemaVersion !== 1) throw new Error('r2_policy_schema_unsupported');
  if (policy.logicalStore !== 'evidence-artifacts') throw new Error('r2_policy_logical_store_invalid');
  if (!/^[a-z0-9][a-z0-9-]{1,62}$/.test(requireString(policy.bucketName, 'r2_bucket_name'))) {
    throw new Error('r2_bucket_name_invalid');
  }
  if (policy.jurisdiction !== 'default') throw new Error('r2_policy_jurisdiction_invalid');
  if (policy.storageClass !== 'Standard') throw new Error('r2_policy_storage_class_invalid');
  if (policy.managedPublicAccess !== false) throw new Error('r2_policy_managed_public_access_invalid');
  if (policy.customDomainsAllowed !== 0) throw new Error('r2_policy_custom_domains_invalid');
  if (policy.protectedPrefix !== 'v1/') throw new Error('r2_policy_prefix_invalid');
  if (policy.lifecycleDeleteOnProtectedPrefixAllowed !== false) throw new Error('r2_policy_lifecycle_delete_invalid');
  if (policy.objectUploadInProvisioningGate !== false) throw new Error('r2_policy_object_upload_invalid');
  if (policy.remoteProvisioningAuthorized !== false) throw new Error('r2_policy_remote_authorization_invalid');
  if (policy.authorizationConfirmation !== 'PROVISION_EVIDENCE_R2') {
    throw new Error('r2_policy_confirmation_invalid');
  }
  const expectedLock = {
    id: 'evidence-v1-indefinite',
    prefix: 'v1/',
    enabled: true,
    condition: { type: 'Indefinite' },
  };
  if (stableJson(policy.bucketLockRule) !== stableJson(expectedLock)) {
    throw new Error('r2_policy_bucket_lock_invalid');
  }
  return true;
}

function jurisdictionHeaders(policy) {
  return policy.jurisdiction && policy.jurisdiction !== 'default'
    ? { 'cf-r2-jurisdiction': policy.jurisdiction }
    : {};
}

function endpoint(accountId, suffix) {
  return `${API_BASE}/accounts/${encodeURIComponent(accountId)}/r2/buckets${suffix}`;
}

async function parseResponse(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`cloudflare_response_not_json:${response.status}`);
  }
}

export async function cloudflareRequest(fetchImpl, { accountId, apiToken, method = 'GET', suffix = '', body, headers = {}, allowStatus = [] }) {
  const response = await fetchImpl(endpoint(accountId, suffix), {
    method,
    headers: {
      Authorization: `Bearer ${apiToken}`,
      Accept: 'application/json',
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...headers,
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const payload = await parseResponse(response);
  if (allowStatus.includes(response.status)) return { status: response.status, payload };
  if (!response.ok || payload?.success === false) {
    const code = payload?.errors?.[0]?.code ?? response.status;
    throw new Error(`cloudflare_api_error:${method}:${suffix || '/'}:${code}`);
  }
  return { status: response.status, payload };
}

function normalizeBucket(bucket, policy) {
  if (!bucket || typeof bucket !== 'object') return null;
  return {
    name: bucket.name ?? null,
    jurisdiction: bucket.jurisdiction ?? 'default',
    storageClass: bucket.storage_class ?? bucket.storageClass ?? 'Standard',
    location: bucket.location ?? null,
    expectedName: policy.bucketName,
  };
}

function normalizeLockRule(rule) {
  if (!rule || typeof rule !== 'object') return null;
  return {
    id: rule.id ?? null,
    prefix: rule.prefix ?? '',
    enabled: rule.enabled === true,
    condition: rule.condition && typeof rule.condition === 'object'
      ? { ...rule.condition }
      : null,
  };
}

function lifecycleDeleteTransition(rule) {
  return rule?.deleteObjectsTransition ?? rule?.delete_objects_transition ?? null;
}

function lifecyclePrefix(rule) {
  return rule?.conditions?.prefix ?? rule?.condition?.prefix ?? '';
}

export function prefixesOverlap(left, right) {
  const a = typeof left === 'string' ? left : '';
  const b = typeof right === 'string' ? right : '';
  return a === '' || b === '' || a.startsWith(b) || b.startsWith(a);
}

export function protectedLifecycleDeletes(lifecycleRules, protectedPrefix) {
  return (Array.isArray(lifecycleRules) ? lifecycleRules : [])
    .filter((rule) => rule?.enabled !== false)
    .filter((rule) => lifecycleDeleteTransition(rule))
    .filter((rule) => prefixesOverlap(lifecyclePrefix(rule), protectedPrefix))
    .map((rule) => ({
      id: rule.id ?? null,
      prefix: lifecyclePrefix(rule),
    }));
}

export function validateRemoteState(state, policy, { requireLock = true } = {}) {
  const issues = [];
  if (!state?.exists) {
    issues.push('bucket_absent');
    return issues;
  }
  if (state.bucket?.name !== policy.bucketName) issues.push('bucket_name_mismatch');
  if (state.bucket?.jurisdiction !== policy.jurisdiction) issues.push('bucket_jurisdiction_mismatch');
  if (state.bucket?.storageClass !== policy.storageClass) issues.push('bucket_storage_class_mismatch');
  if (state.managedPublicAccess !== false) issues.push('r2_dev_must_be_disabled');
  if (!Array.isArray(state.customDomains) || state.customDomains.length !== 0) issues.push('custom_domains_must_be_empty');

  const protectedDeletes = protectedLifecycleDeletes(state.lifecycleRules, policy.protectedPrefix);
  if (protectedDeletes.length > 0) issues.push('protected_prefix_lifecycle_delete_present');

  if (requireLock) {
    const locks = Array.isArray(state.lockRules) ? state.lockRules.map(normalizeLockRule) : [];
    if (locks.length !== 1 || stableJson(locks[0]) !== stableJson(policy.bucketLockRule)) {
      issues.push('bucket_lock_mismatch');
    }
  }
  return issues;
}

function resultArray(payload, key) {
  const result = payload?.result;
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.[key])) return result[key];
  return [];
}

export async function readRemoteR2State({ fetchImpl = fetch, accountId, apiToken, policy }) {
  requireString(accountId, 'cloudflare_account_id');
  requireString(apiToken, 'cloudflare_api_token');
  validateProvisioningPolicy(policy);

  const bucketSuffix = `/${encodeURIComponent(policy.bucketName)}`;
  const bucketResponse = await cloudflareRequest(fetchImpl, {
    accountId,
    apiToken,
    suffix: bucketSuffix,
    headers: jurisdictionHeaders(policy),
    allowStatus: [404],
  });
  if (bucketResponse.status === 404) {
    return {
      exists: false,
      bucket: null,
      managedPublicAccess: null,
      customDomains: [],
      lockRules: [],
      lifecycleRules: [],
    };
  }

  const bucket = normalizeBucket(bucketResponse.payload?.result, policy);
  const common = { accountId, apiToken, headers: jurisdictionHeaders(policy) };
  const [managed, custom, locks, lifecycle] = await Promise.all([
    cloudflareRequest(fetchImpl, { ...common, suffix: `${bucketSuffix}/domains/managed` }),
    cloudflareRequest(fetchImpl, { ...common, suffix: `${bucketSuffix}/domains/custom` }),
    cloudflareRequest(fetchImpl, { ...common, suffix: `${bucketSuffix}/lock` }),
    cloudflareRequest(fetchImpl, { ...common, suffix: `${bucketSuffix}/lifecycle` }),
  ]);

  return {
    exists: true,
    bucket,
    managedPublicAccess: managed.payload?.result?.enabled === true,
    customDomains: resultArray(custom.payload, 'domains'),
    lockRules: resultArray(locks.payload, 'rules'),
    lifecycleRules: resultArray(lifecycle.payload, 'rules'),
  };
}

export function summarizeRemoteState(state, policy) {
  return {
    exists: state.exists === true,
    bucketName: state.bucket?.name ?? policy.bucketName,
    jurisdiction: state.bucket?.jurisdiction ?? null,
    storageClass: state.bucket?.storageClass ?? null,
    managedPublicAccess: state.managedPublicAccess,
    customDomainCount: Array.isArray(state.customDomains) ? state.customDomains.length : null,
    lockRules: Array.isArray(state.lockRules)
      ? state.lockRules.map((rule) => ({ id: rule.id ?? null, prefix: rule.prefix ?? '', enabled: rule.enabled === true, condition: rule.condition ?? null }))
      : [],
    protectedLifecycleDeletes: protectedLifecycleDeletes(state.lifecycleRules, policy.protectedPrefix),
  };
}

export async function preflightR2Provisioning(options) {
  const { policy } = options;
  const state = await readRemoteR2State(options);
  if (!state.exists) {
    return {
      mode: 'preflight',
      target: policy.bucketName,
      status: 'absent',
      readyToProvision: true,
      alreadyProvisioned: false,
      issues: [],
      state: summarizeRemoteState(state, policy),
    };
  }
  const issues = validateRemoteState(state, policy);
  return {
    mode: 'preflight',
    target: policy.bucketName,
    status: issues.length === 0 ? 'compatible' : 'blocked_existing_state',
    readyToProvision: false,
    alreadyProvisioned: issues.length === 0,
    issues,
    state: summarizeRemoteState(state, policy),
  };
}

async function createBucket({ fetchImpl, accountId, apiToken, policy }) {
  return cloudflareRequest(fetchImpl, {
    accountId,
    apiToken,
    method: 'POST',
    suffix: '',
    headers: jurisdictionHeaders(policy),
    body: {
      name: policy.bucketName,
      storageClass: policy.storageClass,
    },
  });
}

async function setBucketLock({ fetchImpl, accountId, apiToken, policy }) {
  return cloudflareRequest(fetchImpl, {
    accountId,
    apiToken,
    method: 'PUT',
    suffix: `/${encodeURIComponent(policy.bucketName)}/lock`,
    headers: jurisdictionHeaders(policy),
    body: { rules: [policy.bucketLockRule] },
  });
}

export async function provisionR2(options) {
  const { policy } = options;
  const before = await preflightR2Provisioning(options);
  if (before.status === 'compatible') {
    return {
      mode: 'provision',
      target: policy.bucketName,
      mutation: 'none_already_compatible',
      verified: true,
      before,
      after: before,
    };
  }
  if (before.status !== 'absent') {
    throw new Error(`r2_provisioning_blocked:${before.issues.join(',')}`);
  }

  await createBucket(options);
  const createdState = await readRemoteR2State(options);
  const createdIssues = validateRemoteState(createdState, policy, { requireLock: false });
  if (createdIssues.length > 0) {
    throw new Error(`r2_created_bucket_prelock_invalid:${createdIssues.join(',')}`);
  }

  await setBucketLock(options);
  const afterState = await readRemoteR2State(options);
  const afterIssues = validateRemoteState(afterState, policy);
  if (afterIssues.length > 0) {
    throw new Error(`r2_post_provision_verify_failed:${afterIssues.join(',')}`);
  }

  return {
    mode: 'provision',
    target: policy.bucketName,
    mutation: 'created_bucket_and_set_lock',
    verified: true,
    before,
    after: {
      status: 'compatible',
      issues: [],
      state: summarizeRemoteState(afterState, policy),
    },
  };
}

export async function verifyR2Provisioning(options) {
  const { policy } = options;
  const state = await readRemoteR2State(options);
  const issues = validateRemoteState(state, policy);
  if (issues.length > 0) throw new Error(`r2_verify_failed:${issues.join(',')}`);
  return {
    mode: 'verify',
    target: policy.bucketName,
    verified: true,
    issues: [],
    state: summarizeRemoteState(state, policy),
  };
}

async function writeResult(outputPath, result) {
  if (!outputPath) return;
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify({ checkedAt: new Date().toISOString(), ...result }, null, 2)}\n`, 'utf8');
}

async function main() {
  const [mode, outputPath] = process.argv.slice(2);
  if (!['preflight', 'provision', 'verify'].includes(mode)) {
    throw new Error('Usage: node scripts/evidence-r2-provisioning-gate.mjs <preflight|provision|verify> [output.json]');
  }
  const policy = await loadProvisioningPolicy();
  const accountId = requireString(process.env.CLOUDFLARE_ACCOUNT_ID, 'cloudflare_account_id');
  const apiToken = requireString(process.env.CLOUDFLARE_API_TOKEN, 'cloudflare_api_token');
  const options = { accountId, apiToken, policy };
  const result = mode === 'preflight'
    ? await preflightR2Provisioning(options)
    : mode === 'provision'
      ? await provisionR2(options)
      : await verifyR2Provisioning(options);
  await writeResult(outputPath, result);
  console.log(JSON.stringify(result, null, 2));
}

const invokedAsScript = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);
if (invokedAsScript) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}

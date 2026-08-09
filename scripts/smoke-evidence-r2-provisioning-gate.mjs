import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  loadProvisioningPolicy,
  preflightR2Provisioning,
  prefixesOverlap,
  protectedLifecycleDeletes,
  provisionR2,
  validateProvisioningPolicy,
  validateRemoteState,
  verifyR2Provisioning,
} from './evidence-r2-provisioning-gate.mjs';

const policy = await loadProvisioningPolicy();
assert.equal(validateProvisioningPolicy(policy), true);
assert.equal(policy.bucketName, 'senza-roaming-evidence-artifacts');
assert.equal(policy.logicalStore, 'evidence-artifacts');
assert.equal(policy.remoteProvisioningAuthorized, false);
assert.equal(policy.objectUploadInProvisioningGate, false);
assert.equal(policy.authorizationConfirmation, 'PROVISION_EVIDENCE_R2');

assert.equal(prefixesOverlap('', 'v1/'), true);
assert.equal(prefixesOverlap('v1/raw/', 'v1/'), true);
assert.equal(prefixesOverlap('other/', 'v1/'), false);
assert.deepEqual(protectedLifecycleDeletes([
  { id: 'other-delete', enabled: true, conditions: { prefix: 'other/' }, deleteObjectsTransition: { condition: { type: 'Age', maxAge: 10 } } },
  { id: 'v1-delete', enabled: true, conditions: { prefix: 'v1/raw/' }, deleteObjectsTransition: { condition: { type: 'Age', maxAge: 10 } } },
], 'v1/'), [{ id: 'v1-delete', prefix: 'v1/raw/' }]);

function success(result) {
  return { success: true, errors: [], messages: [], result };
}

function errorPayload(code, message) {
  return { success: false, errors: [{ code, message }], messages: [], result: null };
}

function baseState(overrides = {}) {
  return {
    exists: true,
    bucket: {
      name: policy.bucketName,
      jurisdiction: policy.jurisdiction,
      storage_class: policy.storageClass,
      location: 'weur',
    },
    managedPublicAccess: false,
    customDomains: [],
    lockRules: [structuredClone(policy.bucketLockRule)],
    lifecycleRules: [],
    ...structuredClone(overrides),
  };
}

function fakeCloudflare(initialState) {
  const state = structuredClone(initialState);
  const calls = [];

  const fetchImpl = async (url, init = {}) => {
    const parsed = new URL(url);
    const method = init.method ?? 'GET';
    const prefix = `/client/v4/accounts/test-account/r2/buckets`;
    assert.ok(parsed.pathname.startsWith(prefix), `unexpected API path ${parsed.pathname}`);
    const suffix = parsed.pathname.slice(prefix.length);
    const body = init.body ? JSON.parse(init.body) : null;
    calls.push({ method, suffix, body });

    const target = `/${policy.bucketName}`;
    let status = 200;
    let payload;

    if (method === 'GET' && suffix === target) {
      if (!state.exists) {
        status = 404;
        payload = errorPayload(10006, 'bucket not found');
      } else {
        payload = success(state.bucket);
      }
    } else if (method === 'POST' && suffix === '') {
      assert.equal(state.exists, false, 'create should only run for absent bucket');
      assert.deepEqual(body, { name: policy.bucketName, storageClass: policy.storageClass });
      state.exists = true;
      state.bucket = {
        name: policy.bucketName,
        jurisdiction: policy.jurisdiction,
        storage_class: policy.storageClass,
        location: 'weur',
      };
      state.managedPublicAccess = false;
      state.customDomains = [];
      state.lockRules = [];
      state.lifecycleRules = [];
      payload = success(state.bucket);
    } else if (method === 'GET' && suffix === `${target}/domains/managed`) {
      payload = success({ bucketId: 'fixture-bucket-id', domain: 'fixture.r2.dev', enabled: state.managedPublicAccess });
    } else if (method === 'GET' && suffix === `${target}/domains/custom`) {
      payload = success({ domains: state.customDomains });
    } else if (method === 'GET' && suffix === `${target}/lock`) {
      payload = success({ rules: state.lockRules });
    } else if (method === 'PUT' && suffix === `${target}/lock`) {
      assert.deepEqual(body, { rules: [policy.bucketLockRule] });
      state.lockRules = structuredClone(body.rules);
      payload = success({ rules: state.lockRules });
    } else if (method === 'GET' && suffix === `${target}/lifecycle`) {
      payload = success({ rules: state.lifecycleRules });
    } else {
      throw new Error(`unexpected fake Cloudflare request: ${method} ${suffix}`);
    }

    return new Response(JSON.stringify(payload), {
      status,
      headers: { 'content-type': 'application/json' },
    });
  };

  return { fetchImpl, calls, state };
}

const options = (fake) => ({
  fetchImpl: fake.fetchImpl,
  accountId: 'test-account',
  apiToken: 'test-token',
  policy,
});

// Absent target is the only state allowed to enter the create path.
{
  const fake = fakeCloudflare({ exists: false });
  const result = await preflightR2Provisioning(options(fake));
  assert.equal(result.status, 'absent');
  assert.equal(result.readyToProvision, true);
  assert.equal(result.alreadyProvisioned, false);
  assert.deepEqual(result.issues, []);
  assert.deepEqual(fake.calls.map(({ method, suffix }) => [method, suffix]), [
    ['GET', `/${policy.bucketName}`],
  ]);
}

// Exact compatible existing target is a verified no-op.
{
  const fake = fakeCloudflare(baseState());
  const result = await provisionR2(options(fake));
  assert.equal(result.mutation, 'none_already_compatible');
  assert.equal(result.verified, true);
  assert.equal(fake.calls.some((call) => call.method !== 'GET'), false);
}

// Existing public, custom-domain, missing-lock, extra-lock and protected-delete states block before writes.
for (const [label, state, expectedIssue] of [
  ['public', baseState({ managedPublicAccess: true }), 'r2_dev_must_be_disabled'],
  ['custom-domain', baseState({ customDomains: [{ domain: 'evidence.example.com', enabled: true }] }), 'custom_domains_must_be_empty'],
  ['missing-lock', baseState({ lockRules: [] }), 'bucket_lock_mismatch'],
  ['extra-lock', baseState({ lockRules: [structuredClone(policy.bucketLockRule), { id: 'extra', prefix: 'other/', enabled: true, condition: { type: 'Indefinite' } }] }), 'bucket_lock_mismatch'],
  ['wrong-jurisdiction', baseState({ bucket: { name: policy.bucketName, jurisdiction: 'eu', storage_class: 'Standard', location: 'weur' } }), 'bucket_jurisdiction_mismatch'],
  ['wrong-storage', baseState({ bucket: { name: policy.bucketName, jurisdiction: 'default', storage_class: 'InfrequentAccess', location: 'weur' } }), 'bucket_storage_class_mismatch'],
  ['protected-delete', baseState({ lifecycleRules: [{ id: 'delete-v1', enabled: true, conditions: { prefix: 'v1/' }, deleteObjectsTransition: { condition: { type: 'Age', maxAge: 3600 } } }] }), 'protected_prefix_lifecycle_delete_present'],
]) {
  const fake = fakeCloudflare(state);
  const preflight = await preflightR2Provisioning(options(fake));
  assert.equal(preflight.status, 'blocked_existing_state', label);
  assert.ok(preflight.issues.includes(expectedIssue), `${label}: expected ${expectedIssue}`);
  await assert.rejects(() => provisionR2(options(fake)), /r2_provisioning_blocked/);
  assert.equal(fake.calls.some((call) => call.method !== 'GET'), false, `${label}: existing drift must remain read-only`);
}

// A delete lifecycle outside v1/ does not weaken the evidence namespace.
{
  const state = baseState({
    lifecycleRules: [{ id: 'delete-other', enabled: true, conditions: { prefix: 'other/' }, deleteObjectsTransition: { condition: { type: 'Age', maxAge: 3600 } } }],
  });
  assert.deepEqual(validateRemoteState(state, policy), []);
}

// Authorized provision logic for an absent bucket has exactly two mutation classes:
// create the bucket and set the canonical lock. It never uploads objects or changes domains.
{
  const fake = fakeCloudflare({ exists: false });
  const result = await provisionR2(options(fake));
  assert.equal(result.mutation, 'created_bucket_and_set_lock');
  assert.equal(result.verified, true);
  const mutations = fake.calls.filter((call) => call.method !== 'GET');
  assert.deepEqual(mutations.map(({ method, suffix }) => [method, suffix]), [
    ['POST', ''],
    ['PUT', `/${policy.bucketName}/lock`],
  ]);
  assert.equal(fake.calls.some((call) => call.method === 'DELETE'), false);
  assert.equal(fake.calls.some((call) => call.suffix.includes('/domains/managed') && call.method !== 'GET'), false);
  assert.equal(fake.calls.some((call) => call.suffix.includes('/domains/custom') && call.method !== 'GET'), false);
  assert.equal(fake.calls.some((call) => /object/i.test(call.suffix)), false);

  const verify = await verifyR2Provisioning(options(fake));
  assert.equal(verify.verified, true);
  assert.equal(verify.state.managedPublicAccess, false);
  assert.equal(verify.state.customDomainCount, 0);
  assert.deepEqual(verify.state.lockRules, [policy.bucketLockRule]);
}

// If the newly created bucket is unexpectedly public before the lock write, fail closed.
{
  const fake = fakeCloudflare({ exists: false });
  const originalFetch = fake.fetchImpl;
  let created = false;
  fake.fetchImpl = async (url, init = {}) => {
    const response = await originalFetch(url, init);
    if ((init.method ?? 'GET') === 'POST') {
      created = true;
      fake.state.managedPublicAccess = true;
    }
    return response;
  };
  await assert.rejects(() => provisionR2(options(fake)), /r2_created_bucket_prelock_invalid:r2_dev_must_be_disabled/);
  assert.equal(created, true);
  assert.equal(fake.calls.some((call) => call.method === 'PUT' && call.suffix.endsWith('/lock')), false);
}

// Workflow is manual-only and has no object/delete/public-enable surface.
const workflow = await readFile('.github/workflows/evidence-r2-provisioning.yml', 'utf8');
assert.match(workflow, /workflow_dispatch:/);
assert.doesNotMatch(workflow, /^\s*push:/m);
assert.match(workflow, /PROVISION_EVIDENCE_R2/);
assert.match(workflow, /expected_main_sha/);
assert.doesNotMatch(workflow, /r2 object/i);
assert.doesNotMatch(workflow, /\bDELETE\b/);
assert.doesNotMatch(workflow, /domains\/managed.*PUT/i);

console.log('Evidence R2 provisioning gate smoke: ok');

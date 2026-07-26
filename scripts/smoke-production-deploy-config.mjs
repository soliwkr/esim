import assert from 'node:assert/strict';
import {
  D1_DATABASE_ID_PLACEHOLDER,
  applyProductionD1Binding,
  resolveProductionD1DatabaseId,
} from './prepare-production-d1-binding.mjs';

const databaseId = '11111111-2222-3333-4444-555555555555';
const otherDatabaseId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

assert.equal(
  resolveProductionD1DatabaseId([
    { name: 'another-database', uuid: otherDatabaseId },
    { name: 'senza-roaming', uuid: databaseId },
  ]),
  databaseId,
);

assert.equal(
  resolveProductionD1DatabaseId({ result: [{ name: 'senza-roaming', uuid: databaseId }] }),
  databaseId,
);

assert.throws(() => resolveProductionD1DatabaseId([]), /found 0/);
assert.throws(
  () =>
    resolveProductionD1DatabaseId([
      { name: 'senza-roaming', uuid: databaseId },
      { name: 'senza-roaming', uuid: otherDatabaseId },
    ]),
  /found 2/,
);
assert.throws(
  () => resolveProductionD1DatabaseId([{ name: 'senza-roaming', uuid: 'not-a-uuid' }]),
  /valid UUID/,
);

const original = {
  name: 'senza-roaming',
  vars: { CMP_PROVIDER: 'iubenda', GTM_ID: '' },
  d1_databases: [
    {
      binding: 'DB',
      database_name: 'senza-roaming',
      database_id: D1_DATABASE_ID_PLACEHOLDER,
      migrations_dir: 'migrations',
    },
  ],
};

const configured = applyProductionD1Binding(original, databaseId);
assert.equal(configured.d1_databases[0].database_id, databaseId);
assert.equal(original.d1_databases[0].database_id, D1_DATABASE_ID_PLACEHOLDER);
assert.notEqual(configured, original);
assert.deepEqual(configured.vars, original.vars);

assert.equal(
  applyProductionD1Binding(
    {
      ...original,
      d1_databases: [{ ...original.d1_databases[0], database_id: databaseId }],
    },
    databaseId,
  ).d1_databases[0].database_id,
  databaseId,
);

assert.throws(() => applyProductionD1Binding(original, 'invalid'), /valid UUID/);
assert.throws(
  () =>
    applyProductionD1Binding(
      {
        ...original,
        d1_databases: [{ ...original.d1_databases[0], database_id: otherDatabaseId }],
      },
      databaseId,
    ),
  /unexpected database_id/,
);
assert.throws(
  () => applyProductionD1Binding({ ...original, d1_databases: [] }, databaseId),
  /found 0/,
);
assert.throws(
  () =>
    applyProductionD1Binding(
      {
        ...original,
        d1_databases: [original.d1_databases[0], structuredClone(original.d1_databases[0])],
      },
      databaseId,
    ),
  /found 2/,
);

console.log('Production deploy configuration smoke passed.');

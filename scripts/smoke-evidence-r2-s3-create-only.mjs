import assert from 'node:assert/strict';
import {
  buildPutObjectArgs,
  putObjectS3CreateOnly,
} from './evidence-r2-s3-create-only.mjs';

const entry = {
  kind: 'pack_json',
  descriptor: {
    objectKey: 'v1/packs/sha256/47/474dc8ca79c84c69eca24ef100a0292ac6b29a5279935f8ce13482c0b0314759.json',
    artifactRef: 'r2://evidence-artifacts/v1/packs/sha256/47/474dc8ca79c84c69eca24ef100a0292ac6b29a5279935f8ce13482c0b0314759.json',
    sha256: 'sha256:474dc8ca79c84c69eca24ef100a0292ac6b29a5279935f8ce13482c0b0314759',
    byteLength: 55827,
    contentType: 'application/json',
  },
  bytes: Buffer.from('{}\n'),
  logicalReferences: new Set(['fixture/pack.json']),
};

const args = buildPutObjectArgs({
  accountId: '0123456789abcdef0123456789abcdef',
  bucketName: 'senza-roaming-evidence-artifacts',
  entry,
  bodyPath: '/tmp/fixture.json',
});

assert.deepEqual(args.slice(0, 2), ['s3api', 'put-object']);
assert.equal(args[args.indexOf('--endpoint-url') + 1], 'https://0123456789abcdef0123456789abcdef.r2.cloudflarestorage.com');
assert.equal(args[args.indexOf('--region') + 1], 'auto');
assert.equal(args[args.indexOf('--bucket') + 1], 'senza-roaming-evidence-artifacts');
assert.equal(args[args.indexOf('--key') + 1], entry.descriptor.objectKey);
assert.equal(args[args.indexOf('--body') + 1], '/tmp/fixture.json');
assert.equal(args[args.indexOf('--if-none-match') + 1], '*');
assert.equal(args[args.indexOf('--content-type') + 1], 'application/json');
assert.equal(args[args.indexOf('--storage-class') + 1], 'STANDARD');
assert.ok(args.includes('--no-cli-pager'));

let captured = null;
const success = putObjectS3CreateOnly((command, commandArgs, options) => {
  captured = { command, commandArgs, options };
  return { status: 0, stdout: '{"ETag":"fixture-etag"}\n', stderr: '' };
}, {
  accountId: '0123456789abcdef0123456789abcdef',
  bucketName: 'senza-roaming-evidence-artifacts',
  entry,
  bodyPath: '/tmp/fixture.json',
});
assert.equal(captured.command, 'aws');
assert.equal(captured.commandArgs[captured.commandArgs.indexOf('--if-none-match') + 1], '*');
assert.equal(success.etag, 'fixture-etag');

assert.throws(
  () => putObjectS3CreateOnly(() => ({ status: 1, stdout: '', stderr: 'precondition failed' }), {
    accountId: '0123456789abcdef0123456789abcdef',
    bucketName: 'senza-roaming-evidence-artifacts',
    entry,
    bodyPath: '/tmp/fixture.json',
  }),
  /r2_s3_object_create_failed:1:/,
);

assert.throws(
  () => putObjectS3CreateOnly(() => ({ status: 0, stdout: 'not-json', stderr: '' }), {
    accountId: '0123456789abcdef0123456789abcdef',
    bucketName: 'senza-roaming-evidence-artifacts',
    entry,
    bodyPath: '/tmp/fixture.json',
  }),
  /r2_s3_object_create_response_not_json:/,
);

console.log('Evidence R2 S3 create-only smoke: ok');

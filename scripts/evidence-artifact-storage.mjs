import { createHash } from 'node:crypto';

export const EVIDENCE_ARTIFACT_STORE = 'evidence-artifacts';
export const EVIDENCE_ARTIFACT_REF_SCHEME = `r2://${EVIDENCE_ARTIFACT_STORE}/`;
export const EVIDENCE_ARTIFACT_KEY_VERSION = 'v1';
export const EVIDENCE_ARTIFACT_WRITE_CONDITION = Object.freeze({ ifNoneMatch: '*' });

const SHA256_PATTERN = /^sha256:([0-9a-f]{64})$/;
const CONTENT_TYPE_EXTENSION = Object.freeze({
  'text/html': 'html',
  'application/xhtml+xml': 'html',
  'application/json': 'json',
  'application/pdf': 'pdf',
});

export function sha256Bytes(bytes) {
  return `sha256:${createHash('sha256').update(bytes).digest('hex')}`;
}

export function normalizeSha256(value, label = 'sha256') {
  if (typeof value !== 'string') throw new Error(`${label}_invalid`);
  const match = value.match(SHA256_PATTERN);
  if (!match) throw new Error(`${label}_invalid`);
  return match[1];
}

function baseContentType(value) {
  if (typeof value !== 'string' || !value.trim()) throw new Error('artifact_content_type_invalid');
  return value.split(';', 1)[0].trim().toLowerCase();
}

export function artifactExtensionForContentType(contentType) {
  const normalized = baseContentType(contentType);
  const extension = CONTENT_TYPE_EXTENSION[normalized];
  if (!extension) throw new Error(`artifact_content_type_unsupported:${normalized}`);
  return extension;
}

function contentAddressedKey(kind, digest, extension) {
  const prefix = digest.slice(0, 2);
  return `${EVIDENCE_ARTIFACT_KEY_VERSION}/${kind}/sha256/${prefix}/${digest}.${extension}`;
}

export function rawEvidenceObjectKey({ bodySha256, contentType }) {
  const digest = normalizeSha256(bodySha256, 'artifact_body_sha256');
  const extension = artifactExtensionForContentType(contentType);
  return contentAddressedKey('raw', digest, extension);
}

export function packEvidenceObjectKey(packSha256) {
  const digest = normalizeSha256(packSha256, 'artifact_pack_sha256');
  return contentAddressedKey('packs', digest, 'json');
}

export function evidenceArtifactRef(objectKey) {
  if (typeof objectKey !== 'string' || !objectKey.startsWith(`${EVIDENCE_ARTIFACT_KEY_VERSION}/`)) {
    throw new Error('artifact_object_key_invalid');
  }
  if (objectKey.includes('..') || objectKey.startsWith('/')) throw new Error('artifact_object_key_invalid');
  return `${EVIDENCE_ARTIFACT_REF_SCHEME}${objectKey}`;
}

export function rawEvidenceArtifactDescriptor(source) {
  if (!source || typeof source !== 'object') throw new Error('artifact_source_invalid');
  if (!Number.isInteger(source.byteLength) || source.byteLength < 1) {
    throw new Error('artifact_raw_byte_length_invalid');
  }
  const objectKey = rawEvidenceObjectKey({
    bodySha256: source.bodySha256,
    contentType: source.contentType,
  });
  return Object.freeze({
    schemaVersion: 1,
    kind: 'raw_source',
    logicalStore: EVIDENCE_ARTIFACT_STORE,
    objectKey,
    artifactRef: evidenceArtifactRef(objectKey),
    sha256: `sha256:${normalizeSha256(source.bodySha256, 'artifact_body_sha256')}`,
    byteLength: source.byteLength,
    contentType: baseContentType(source.contentType),
    createOnly: true,
    conditionalWrite: EVIDENCE_ARTIFACT_WRITE_CONDITION,
  });
}

export function packEvidenceArtifactDescriptor({ packSha256, byteLength }) {
  if (!Number.isInteger(byteLength) || byteLength < 1) throw new Error('artifact_pack_byte_length_invalid');
  const objectKey = packEvidenceObjectKey(packSha256);
  return Object.freeze({
    schemaVersion: 1,
    kind: 'pack_json',
    logicalStore: EVIDENCE_ARTIFACT_STORE,
    objectKey,
    artifactRef: evidenceArtifactRef(objectKey),
    sha256: `sha256:${normalizeSha256(packSha256, 'artifact_pack_sha256')}`,
    byteLength,
    contentType: 'application/json',
    createOnly: true,
    conditionalWrite: EVIDENCE_ARTIFACT_WRITE_CONDITION,
  });
}

export function verifyArtifactBytes(bytes, descriptor) {
  if (!descriptor || typeof descriptor !== 'object') throw new Error('artifact_descriptor_invalid');
  const actual = sha256Bytes(bytes);
  if (actual !== descriptor.sha256) {
    throw new Error(`artifact_integrity_mismatch:${descriptor.kind || 'unknown'}`);
  }
  if (!Number.isInteger(descriptor.byteLength) || descriptor.byteLength < 1) {
    throw new Error(`artifact_byte_length_invalid:${descriptor.kind || 'unknown'}`);
  }
  if (Buffer.byteLength(bytes) !== descriptor.byteLength) {
    throw new Error(`artifact_byte_length_mismatch:${descriptor.kind || 'unknown'}`);
  }
  return true;
}

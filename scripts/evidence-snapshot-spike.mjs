import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const UBIGI_ITALY_50GB_URL = 'https://cellulardata.ubigi.com/rates-and-coverage/italy-data-plans/italy-50gb-30-days/';
export const EVIDENCE_SCHEMA_VERSION = 1;
export const EXTRACTOR_ID = 'ubigi-product-h1';
export const EXTRACTOR_VERSION = '1.0.0';
export const NORMALIZER_VERSION = '1.0.0';
export const MAX_RESPONSE_BYTES = 2_000_000;
export const MAX_REDIRECTS = 5;
export const DEFAULT_OUTPUT_DIRECTORY = path.join('research', 'evidence', 'snapshots');

const ALLOWED_HOST = 'cellulardata.ubigi.com';
const HTML_CONTENT_TYPE = /^(?:text\/html|application\/xhtml\+xml)(?:\s*;|$)/i;
const H1_PATTERN = /<h1\b[^>]*>([\s\S]*?)<\/h1\s*>/gi;
const TAG_PATTERN = /<[^>]+>/g;
const SPACE_PATTERN = /\s+/g;
const DATA_PATTERN = /\b(\d+(?:[.,]\d+)?)\s*(GB|MB)\b/i;
const VALIDITY_PATTERN = /\b(\d+)\s*(day|days)\b/i;
const PRICE_PATTERN = /\b(US\$|CA\$|AU\$)\s*(\d+(?:[.,]\d{1,2})?)\b|([€£])\s*(\d+(?:[.,]\d{1,2})?)\b/g;
const LOCALE_PATTERN = /<html\b[^>]*\blang\s*=\s*["']([^"']+)["']/i;
const ENTITY_PATTERN = /&(#\d+|#x[0-9a-f]+|amp|lt|gt|quot|apos|nbsp);/gi;
const TRACKING_QUERY_KEYS = new Set(['gclid', 'fbclid', 'msclkid']);
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);
const VALID_OUTPUT_FILE = /^[A-Za-z0-9._/-]+$/;

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function hashCanonical(value) {
  return sha256(canonicalJson(value));
}

function decodeEntity(match, entity) {
  const lower = entity.toLowerCase();
  if (lower === 'amp') return '&';
  if (lower === 'lt') return '<';
  if (lower === 'gt') return '>';
  if (lower === 'quot') return '"';
  if (lower === 'apos') return "'";
  if (lower === 'nbsp') return ' ';
  if (lower.startsWith('#x')) {
    const codePoint = Number.parseInt(lower.slice(2), 16);
    return Number.isInteger(codePoint) ? String.fromCodePoint(codePoint) : match;
  }
  if (lower.startsWith('#')) {
    const codePoint = Number.parseInt(lower.slice(1), 10);
    return Number.isInteger(codePoint) ? String.fromCodePoint(codePoint) : match;
  }
  return match;
}

export function normalizeVisibleText(value) {
  return value
    .replace(ENTITY_PATTERN, decodeEntity)
    .replace(TAG_PATTERN, ' ')
    .replace(SPACE_PATTERN, ' ')
    .trim();
}

function requireAllowedUrl(value, label) {
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${label} must be a valid URL.`);
  }
  if (parsed.protocol !== 'https:') throw new Error(`${label} must use HTTPS.`);
  if (parsed.hostname !== ALLOWED_HOST) throw new Error(`${label} must stay on ${ALLOWED_HOST}.`);
  if (parsed.username || parsed.password) throw new Error(`${label} must not contain credentials.`);
  return parsed;
}

export function canonicalizeEvidenceUrl(value) {
  const parsed = requireAllowedUrl(value, 'Evidence URL');
  const kept = new URLSearchParams();
  for (const [key, entryValue] of parsed.searchParams) {
    const lower = key.toLowerCase();
    if (lower.startsWith('utm_') || TRACKING_QUERY_KEYS.has(lower)) continue;
    kept.append(key, entryValue);
  }
  parsed.search = kept.toString();
  parsed.hash = '';
  return parsed.toString();
}

function parseNumber(value) {
  const normalized = value.replace(',', '.');
  const number = Number(normalized);
  if (!Number.isFinite(number) || number < 0) throw new Error(`Invalid numeric value: ${value}`);
  return number;
}

function uniqueMatch(pattern, text, label) {
  const matches = [...text.matchAll(pattern)];
  if (matches.length !== 1) {
    throw new Error(`Expected exactly one ${label} in product heading; found ${matches.length}.`);
  }
  return matches[0];
}

function extractSingleH1(html) {
  const matches = [...html.matchAll(H1_PATTERN)];
  if (matches.length !== 1) throw new Error(`Expected exactly one h1; found ${matches.length}.`);
  const text = normalizeVisibleText(matches[0][1]);
  if (!text) throw new Error('Product h1 is empty.');
  return text;
}

function extractLocale(html) {
  const match = html.match(LOCALE_PATTERN);
  if (!match) return null;
  const locale = match[1].trim();
  return locale || null;
}

function priceFromHeading(heading) {
  const match = uniqueMatch(PRICE_PATTERN, heading, 'price');
  const symbol = match[1] ?? match[3];
  const amountText = match[2] ?? match[4];
  const currency = new Map([
    ['US$', 'USD'],
    ['CA$', 'CAD'],
    ['AU$', 'AUD'],
    ['€', 'EUR'],
    ['£', 'GBP'],
  ]).get(symbol);
  if (!currency) throw new Error(`Unsupported or ambiguous price symbol: ${symbol}`);
  return {
    rawValue: match[0],
    normalizedValue: { amount: parseNumber(amountText), currency },
    matchIndex: match.index,
  };
}

function dataFromHeading(heading) {
  const match = uniqueMatch(new RegExp(DATA_PATTERN.source, DATA_PATTERN.flags), heading, 'data allowance');
  const amount = parseNumber(match[1]);
  const unit = match[2].toUpperCase();
  return {
    rawValue: match[0],
    normalizedValue: unit === 'GB'
      ? { quantity: amount, unit: 'GB' }
      : { quantity: amount / 1024, unit: 'GB', sourceQuantity: amount, sourceUnit: 'MB' },
    matchIndex: match.index,
  };
}

function validityFromHeading(heading) {
  const match = uniqueMatch(new RegExp(VALIDITY_PATTERN.source, VALIDITY_PATTERN.flags), heading, 'validity period');
  return {
    rawValue: match[0],
    normalizedValue: { duration: Number.parseInt(match[1], 10), unit: 'day' },
    matchIndex: match.index,
  };
}

function locatorForHeading(heading, rawValue, matchIndex) {
  const start = Number.isInteger(matchIndex) ? matchIndex : heading.indexOf(rawValue);
  if (start < 0) throw new Error(`Unable to locate ${rawValue} inside product heading.`);
  return Object.freeze({
    type: 'html',
    selector: 'h1',
    visibleTextSha256: sha256(heading),
    start,
    end: start + rawValue.length,
    textAnchor: rawValue,
  });
}

function isoPlusDays(iso, days) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) throw new Error(`Invalid observation timestamp: ${iso}`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

function candidateKey(candidate) {
  return `sha256:${hashCanonical({
    snapshotId: candidate.snapshotId,
    subjectType: candidate.subjectType,
    subjectKey: candidate.subjectKey,
    fieldName: candidate.fieldName,
    scope: candidate.scope,
    rawValue: candidate.rawValue,
    normalizedValue: candidate.normalizedValue,
    extractorVersion: candidate.extractorVersion,
  })}`;
}

function buildCandidate({ snapshotId, observedAt, fieldName, rawValue, normalizedValue, locator, validDays, warnings = [] }) {
  const scope = Object.freeze({
    provider: 'ubigi',
    plan: 'italy-50gb-30-days',
    destination: 'italy',
    deviceModel: null,
    deviceRegion: null,
  });
  const candidate = {
    candidateKey: '',
    snapshotId,
    subjectType: 'plan',
    subjectKey: 'ubigi:italy-50gb-30-days',
    fieldName,
    scope,
    rawValue,
    normalizedValue,
    evidenceLocator: locator,
    observedAt,
    proposedValidUntil: isoPlusDays(observedAt, validDays),
    extractorId: EXTRACTOR_ID,
    extractorVersion: EXTRACTOR_VERSION,
    normalizerVersion: NORMALIZER_VERSION,
    sourceRole: 'product_page',
    warnings: Object.freeze([...warnings]),
    status: 'pending',
  };
  candidate.candidateKey = candidateKey(candidate);
  return Object.freeze(candidate);
}

export function extractUbigiPlanCandidates({ html, snapshotId, observedAt }) {
  if (typeof html !== 'string' || !html.trim()) throw new Error('HTML input is required.');
  const heading = extractSingleH1(html);
  if (!/^eSIM\s*[•·]\s*ITALY\b/i.test(heading)) {
    throw new Error(`Unexpected product heading scope: ${heading}`);
  }

  const data = dataFromHeading(heading);
  const validity = validityFromHeading(heading);
  const price = priceFromHeading(heading);

  const candidates = [
    buildCandidate({
      snapshotId,
      observedAt,
      fieldName: 'data_gb',
      rawValue: data.rawValue,
      normalizedValue: data.normalizedValue,
      locator: locatorForHeading(heading, data.rawValue, data.matchIndex),
      validDays: 7,
    }),
    buildCandidate({
      snapshotId,
      observedAt,
      fieldName: 'validity_days',
      rawValue: validity.rawValue,
      normalizedValue: validity.normalizedValue,
      locator: locatorForHeading(heading, validity.rawValue, validity.matchIndex),
      validDays: 7,
      warnings: ['activation_trigger_out_of_scope'],
    }),
    buildCandidate({
      snapshotId,
      observedAt,
      fieldName: 'price',
      rawValue: price.rawValue,
      normalizedValue: price.normalizedValue,
      locator: locatorForHeading(heading, price.rawValue, price.matchIndex),
      validDays: 3,
      warnings: price.normalizedValue.currency === 'EUR'
        ? []
        : ['downstream_price_eur_mapping_required'],
    }),
  ];

  const fieldNames = candidates.map((candidate) => candidate.fieldName);
  if (new Set(fieldNames).size !== 3) throw new Error('Spike must emit exactly three unique fields.');
  return Object.freeze({ heading, candidates: Object.freeze(candidates) });
}

export function semanticProjection(candidates) {
  return Object.freeze(candidates
    .map((candidate) => ({
      subjectType: candidate.subjectType,
      subjectKey: candidate.subjectKey,
      fieldName: candidate.fieldName,
      scope: candidate.scope,
      normalizedValue: candidate.normalizedValue,
    }))
    .sort((left, right) => left.fieldName.localeCompare(right.fieldName)));
}

export function semanticFingerprint(candidates) {
  return `sha256:${hashCanonical(semanticProjection(candidates))}`;
}

export function semanticDiff(previousCandidates, currentCandidates) {
  const previous = new Map(semanticProjection(previousCandidates).map((entry) => [entry.fieldName, entry]));
  const current = new Map(semanticProjection(currentCandidates).map((entry) => [entry.fieldName, entry]));
  const fieldNames = [...new Set([...previous.keys(), ...current.keys()])].sort();
  const changes = [];
  for (const fieldName of fieldNames) {
    const before = previous.get(fieldName) ?? null;
    const after = current.get(fieldName) ?? null;
    if (canonicalJson(before) !== canonicalJson(after)) changes.push({ fieldName, before, after });
  }
  return Object.freeze(changes);
}

export function buildEvidenceSnapshot({
  requestedUrl = UBIGI_ITALY_50GB_URL,
  finalUrl = requestedUrl,
  redirectChain = [],
  fetchedAt,
  httpStatus = 200,
  contentType = 'text/html; charset=UTF-8',
  etag = null,
  lastModified = null,
  body,
}) {
  if (!Buffer.isBuffer(body)) throw new Error('Snapshot body must be a Buffer.');
  if (body.byteLength === 0) throw new Error('Snapshot body is empty.');
  if (body.byteLength > MAX_RESPONSE_BYTES) throw new Error(`Snapshot body exceeds ${MAX_RESPONSE_BYTES} bytes.`);
  if (!HTML_CONTENT_TYPE.test(contentType || '')) throw new Error(`Unsupported content type: ${contentType || '(missing)'}`);
  if (httpStatus < 200 || httpStatus >= 300) throw new Error(`Snapshot requires a successful HTTP status; received ${httpStatus}.`);

  const canonicalRequestedUrl = canonicalizeEvidenceUrl(requestedUrl);
  const canonicalFinalUrl = canonicalizeEvidenceUrl(finalUrl);
  const html = body.toString('utf8');
  const bodySha256 = sha256(body);
  const snapshotId = `snapshot:sha256:${hashCanonical({
    sourceAuditKey: 'provider-ubigi-commerce',
    finalUrl: canonicalFinalUrl,
    bodySha256,
  })}`;
  const extraction = extractUbigiPlanCandidates({ html, snapshotId, observedAt: fetchedAt });
  const currencyContext = extraction.candidates.find((candidate) => candidate.fieldName === 'price').normalizedValue.currency;

  return Object.freeze({
    schemaVersion: EVIDENCE_SCHEMA_VERSION,
    snapshotId,
    sourceAuditKey: 'provider-ubigi-commerce',
    requestedUrl,
    canonicalRequestedUrl,
    finalUrl,
    canonicalFinalUrl,
    redirectChain: Object.freeze(redirectChain.map((entry) => Object.freeze({ ...entry }))),
    fetchedAt,
    httpStatus,
    contentType,
    captureMethod: 'http_html',
    locale: extractLocale(html),
    currencyContext,
    countryContext: 'IT',
    etag,
    lastModified,
    bodySha256: `sha256:${bodySha256}`,
    byteLength: body.byteLength,
    parserInputVersion: 'raw-http-body-v1',
    extractor: Object.freeze({ id: EXTRACTOR_ID, version: EXTRACTOR_VERSION, normalizerVersion: NORMALIZER_VERSION }),
    evidenceHeading: extraction.heading,
    candidates: extraction.candidates,
    semanticFingerprint: semanticFingerprint(extraction.candidates),
    captureWarnings: Object.freeze([]),
  });
}

async function fetchWithRedirects(url, fetchImpl) {
  const redirectChain = [];
  let current = requireAllowedUrl(url, 'Requested URL');
  for (let index = 0; index <= MAX_REDIRECTS; index += 1) {
    const response = await fetchImpl(current, {
      method: 'GET',
      redirect: 'manual',
      headers: {
        accept: 'text/html,application/xhtml+xml;q=0.9',
        'user-agent': 'SenzaRoamingEvidenceSpike/1.0 (+https://senzaroaming.it/metodo)',
      },
    });
    if (REDIRECT_STATUSES.has(response.status)) {
      if (index === MAX_REDIRECTS) throw new Error(`Evidence fetch exceeded ${MAX_REDIRECTS} redirects.`);
      const location = response.headers.get('location');
      if (!location) throw new Error(`Redirect ${response.status} is missing Location header.`);
      const next = requireAllowedUrl(new URL(location, current).toString(), 'Redirect URL');
      redirectChain.push(Object.freeze({ status: response.status, from: current.toString(), to: next.toString() }));
      current = next;
      continue;
    }
    return { response, finalUrl: current.toString(), redirectChain };
  }
  throw new Error('Unreachable redirect loop state.');
}

export async function captureUbigiEvidence({
  fetchImpl = fetch,
  now = () => new Date(),
} = {}) {
  const fetchedAt = now().toISOString();
  const { response, finalUrl, redirectChain } = await fetchWithRedirects(UBIGI_ITALY_50GB_URL, fetchImpl);
  const contentType = response.headers.get('content-type') || '';
  const declaredLength = Number(response.headers.get('content-length'));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_RESPONSE_BYTES) {
    throw new Error(`Evidence response declares ${declaredLength} bytes, above the ${MAX_RESPONSE_BYTES} byte limit.`);
  }
  const body = Buffer.from(await response.arrayBuffer());
  return buildEvidenceSnapshot({
    requestedUrl: UBIGI_ITALY_50GB_URL,
    finalUrl,
    redirectChain,
    fetchedAt,
    httpStatus: response.status,
    contentType,
    etag: response.headers.get('etag'),
    lastModified: response.headers.get('last-modified'),
    body,
  });
}

function artifactDirectoryName(snapshot) {
  const timestamp = snapshot.fetchedAt.replace(/[:.]/g, '-');
  const shortHash = snapshot.bodySha256.replace('sha256:', '').slice(0, 12);
  return `${timestamp}-${shortHash}`;
}

function outputPath(value) {
  if (!value || !VALID_OUTPUT_FILE.test(value) || value.includes('..')) {
    throw new Error('--out must be a relative repository-local path without .. segments.');
  }
  return path.resolve(value);
}

export async function writeEvidenceArtifact({
  snapshot,
  rawBody,
  outputDirectory = DEFAULT_OUTPUT_DIRECTORY,
  mkdirImpl = mkdir,
  writeFileImpl = writeFile,
}) {
  if (!Buffer.isBuffer(rawBody)) throw new Error('rawBody must be a Buffer.');
  const root = outputPath(outputDirectory);
  await mkdirImpl(root, { recursive: true });
  const artifactDirectory = path.join(root, artifactDirectoryName(snapshot));
  await mkdirImpl(artifactDirectory, { recursive: false });
  const rawPath = path.join(artifactDirectory, 'raw.html');
  const metadataPath = path.join(artifactDirectory, 'snapshot.json');
  const artifactLocation = path.relative(process.cwd(), artifactDirectory).split(path.sep).join('/');
  const persistedSnapshot = { ...snapshot, artifactLocation };
  await writeFileImpl(rawPath, rawBody, { flag: 'wx' });
  await writeFileImpl(metadataPath, `${JSON.stringify(persistedSnapshot, null, 2)}\n`, { encoding: 'utf8', flag: 'wx' });
  return Object.freeze({ artifactDirectory, rawPath, metadataPath, snapshot: Object.freeze(persistedSnapshot) });
}

export function parseArgs(argv) {
  const options = { out: DEFAULT_OUTPUT_DIRECTORY, compare: null, help: false };
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    if (flag === '--out') {
      const value = argv[++index];
      if (!value || value.startsWith('--')) throw new Error('--out requires a value.');
      options.out = value;
    } else if (flag === '--compare') {
      const value = argv[++index];
      if (!value || value.startsWith('--')) throw new Error('--compare requires a snapshot.json path.');
      options.compare = value;
    } else if (flag === '--help' || flag === '-h') {
      options.help = true;
    } else {
      throw new Error(`Unknown argument: ${flag}`);
    }
  }
  outputPath(options.out);
  if (options.compare && (!VALID_OUTPUT_FILE.test(options.compare) || options.compare.includes('..'))) {
    throw new Error('--compare must be a relative repository-local path without .. segments.');
  }
  return Object.freeze(options);
}

async function loadSnapshot(filename) {
  const absolute = path.resolve(filename);
  const payload = JSON.parse(await readFile(absolute, 'utf8'));
  if (!Array.isArray(payload.candidates) || typeof payload.semanticFingerprint !== 'string') {
    throw new Error(`Invalid evidence snapshot metadata: ${filename}`);
  }
  return payload;
}

function usage() {
  return `Usage: npm run evidence:snapshot-spike -- [options]\n\n` +
    `Captures exactly one allowlisted public Ubigi product page.\n\n` +
    `Options:\n` +
    `  --out <directory>          Local artifact root (default: ${DEFAULT_OUTPUT_DIRECTORY})\n` +
    `  --compare <snapshot.json>  Compare semantic candidate values with a previous capture\n` +
    `  -h, --help                 Show this help\n`;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(usage());
    return;
  }

  const fetchedAt = new Date();
  let capturedBody = null;
  const fetchImpl = async (...args) => {
    const response = await fetch(...args);
    const originalArrayBuffer = response.arrayBuffer.bind(response);
    response.arrayBuffer = async () => {
      const result = await originalArrayBuffer();
      capturedBody = Buffer.from(result);
      return result;
    };
    return response;
  };
  const snapshot = await captureUbigiEvidence({ fetchImpl, now: () => fetchedAt });
  if (!capturedBody) throw new Error('Evidence body was not captured.');
  const artifact = await writeEvidenceArtifact({ snapshot, rawBody: capturedBody, outputDirectory: options.out });

  console.log(`Evidence snapshot: ${artifact.snapshot.snapshotId}`);
  console.log(`Artifact: ${path.relative(process.cwd(), artifact.artifactDirectory)}`);
  console.log(`Semantic fingerprint: ${artifact.snapshot.semanticFingerprint}`);
  for (const candidate of artifact.snapshot.candidates) {
    console.log(`${candidate.fieldName}: ${JSON.stringify(candidate.normalizedValue)} [${candidate.status}]`);
  }

  if (options.compare) {
    const previous = await loadSnapshot(options.compare);
    const changes = semanticDiff(previous.candidates, artifact.snapshot.candidates);
    console.log(`Semantic changes: ${changes.length}`);
    for (const change of changes) console.log(`- ${change.fieldName}`);
  }
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  await main();
}

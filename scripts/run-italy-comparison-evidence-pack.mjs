import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  SOURCE_CONFIG,
  buildComparisonPack,
  captureSource,
  packSemanticDiff,
  parseArgs,
  writeComparisonArtifact,
} from './italy-comparison-evidence-pack.mjs';

export const AIRALO_EXACT_PACKAGE_URL =
  'https://www.airalo.com/it/italy-esim/mamma-mia-in-10days-unlimited';

export const LIVE_SOURCE_CONFIG = Object.freeze(
  SOURCE_CONFIG.map((source) =>
    source.key === 'airalo-italy-plan'
      ? Object.freeze({
          ...source,
          url: AIRALO_EXACT_PACKAGE_URL,
        })
      : source,
  ),
);

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

function hashCanonical(value) {
  return createHash('sha256').update(canonicalJson(value)).digest('hex');
}

function applyLiveSourceProvenance(source, snapshot) {
  const bodyHash = snapshot.bodySha256.replace(/^sha256:/, '');
  const snapshotId = `snapshot:sha256:${hashCanonical({
    sourceAuditKey: source.sourceAuditKey,
    finalUrl: snapshot.canonicalFinalUrl,
    bodySha256: bodyHash,
  })}`;

  return Object.freeze({
    ...snapshot,
    provider: source.provider,
    role: source.role,
    sourceAuditKey: source.sourceAuditKey,
    snapshotId,
  });
}

export async function captureLiveSource(
  source,
  { fetchImpl = fetch, now = () => new Date() } = {},
) {
  const captured = await captureSource(source, { fetchImpl, now });
  return Object.freeze({
    snapshot: applyLiveSourceProvenance(source, captured.snapshot),
    body: captured.body,
  });
}

export async function captureLiveComparisonPack({
  fetchImpl = fetch,
  now = () => new Date(),
} = {}) {
  const startedAt = now().toISOString();
  const snapshots = new Map();
  const bodies = new Map();

  for (const source of LIVE_SOURCE_CONFIG) {
    const captured = await captureLiveSource(source, { fetchImpl, now });
    snapshots.set(source.key, captured.snapshot);
    bodies.set(source.key, captured.body);
  }

  const completedAt = now().toISOString();
  return Object.freeze({
    pack: buildComparisonPack({ snapshots, startedAt, completedAt }),
    snapshots,
    bodies,
  });
}

async function loadPack(filename) {
  const absolute = path.resolve(filename);
  const relative = path.relative(process.cwd(), absolute);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('--compare must stay inside the repository.');
  }
  const payload = JSON.parse(await readFile(absolute, 'utf8'));
  if (!Array.isArray(payload.offers) || payload.ranking?.status !== 'not_computed') {
    throw new Error(`Invalid comparison pack: ${filename}`);
  }
  return payload;
}

function printPack(artifact) {
  console.log(`Evidence pack: ${artifact.pack.packId}`);
  console.log(`Artifact: ${path.relative(process.cwd(), artifact.artifactDirectory)}`);
  console.log(`Capture window: ${artifact.pack.captureWindowMs} ms`);
  console.log(`Semantic fingerprint: ${artifact.pack.semanticFingerprint}`);

  for (const offer of artifact.pack.offers) {
    console.log(`${offer.provider}: ${offer.label}`);
    for (const candidate of offer.candidates) {
      console.log(
        `  ${candidate.fieldName}: ${JSON.stringify(candidate.normalizedValue)} [${candidate.status}]`,
      );
    }
    for (const [fieldName, state] of Object.entries(offer.coverage)) {
      if (state.state !== 'observed') {
        console.log(
          `  ${fieldName}: ${state.state}${state.reason ? ` — ${state.reason}` : ''}`,
        );
      }
    }
  }

  console.log(`Ranking: ${artifact.pack.ranking.status}`);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log('Usage: npm run evidence:italy-pack -- [--out <directory>] [--compare <pack.json>]');
    console.log('Captures six fixed official sources; Airalo uses the exact 10-day unlimited package page.');
    console.log('No dependency installation, ranking, FX conversion, D1 write or deploy is performed.');
    return;
  }

  const captured = await captureLiveComparisonPack();
  const artifact = await writeComparisonArtifact({
    captured,
    outputDirectory: options.out,
  });
  printPack(artifact);

  if (options.compare) {
    const previous = await loadPack(options.compare);
    const changes = packSemanticDiff(previous, artifact.pack);
    console.log(`Provider semantic changes: ${changes.length}`);
    for (const change of changes) console.log(`- ${change.provider}`);
  }
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) await main();
import { spawnSync } from 'node:child_process';
import { appendFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  loadReconciliationManifest,
  reconcileManifest,
} from './evidence-source-reconciliation.mjs';

export const TARGET_D1_DATABASE = 'senza-roaming';
export const SOURCE_REGISTRY_READ_QUERY = [
  'SELECT',
  '  id,',
  '  entity_type,',
  '  entity_key,',
  '  source_kind,',
  '  url,',
  '  status',
  'FROM source_registry',
  'ORDER BY id',
].join('\n');

const EXPECTED_COLUMNS = ['id', 'entity_type', 'entity_key', 'source_kind', 'url', 'status'];

function looksLikeRegistryRow(value) {
  return value
    && typeof value === 'object'
    && !Array.isArray(value)
    && EXPECTED_COLUMNS.every((column) => Object.hasOwn(value, column));
}

function collectResultArrays(value, output) {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    if (value.length === 0 || value.every(looksLikeRegistryRow)) {
      output.push(value);
      return;
    }
    for (const item of value) collectResultArrays(item, output);
    return;
  }

  if (Array.isArray(value.results)) {
    if (value.results.length === 0 || value.results.every(looksLikeRegistryRow)) {
      output.push(value.results);
    } else {
      collectResultArrays(value.results, output);
    }
  }
  if (value.result !== undefined) collectResultArrays(value.result, output);
}

export function parseWranglerD1ExecuteJson(payload) {
  const resultArrays = [];
  collectResultArrays(payload, resultArrays);
  if (resultArrays.length === 0) {
    throw new Error('wrangler_d1_source_registry_results_missing');
  }

  const rows = resultArrays.flat();
  return rows.map((row, index) => {
    const id = Number(row.id);
    if (!Number.isSafeInteger(id) || id < 1) {
      throw new Error(`source_registry_row_id_invalid:${index}`);
    }
    for (const column of EXPECTED_COLUMNS.slice(1)) {
      if (typeof row[column] !== 'string') {
        throw new Error(`source_registry_row_column_invalid:${index}:${column}`);
      }
    }
    return Object.freeze({
      id,
      entity_type: row.entity_type,
      entity_key: row.entity_key,
      source_kind: row.source_kind,
      url: row.url,
      status: row.status,
    });
  });
}

export function buildVerificationResult(manifest, registryRows, verifiedAt = new Date().toISOString()) {
  const reconciled = reconcileManifest(manifest, registryRows);
  const results = reconciled.map((entry) => Object.freeze({
    sourceAuditKey: entry.sourceAuditKey,
    status: entry.status,
    reason: entry.reason,
    matchCount: entry.matchCount ?? (entry.status === 'resolved' ? 1 : 0),
  }));

  const counts = results.reduce(
    (accumulator, entry) => {
      if (entry.status === 'resolved') accumulator.resolved += 1;
      if (entry.reason === 'source_not_registered') accumulator.sourceNotRegistered += 1;
      if (entry.reason === 'source_registry_ambiguous') accumulator.sourceRegistryAmbiguous += 1;
      return accumulator;
    },
    { resolved: 0, sourceNotRegistered: 0, sourceRegistryAmbiguous: 0 },
  );

  return Object.freeze({
    schemaVersion: 1,
    databaseName: TARGET_D1_DATABASE,
    verifiedAt,
    queryContract: 'source_registry_selected_columns_read_only',
    mappingVersion: manifest.mappingVersion,
    manifestSourceCount: manifest.sources.length,
    registryRowCount: registryRows.length,
    counts,
    readyForImporter: counts.resolved === manifest.sources.length,
    results,
  });
}

function parseJsonOutput(stdout) {
  const value = stdout.trim();
  if (!value) throw new Error('wrangler_d1_execute_empty_output');
  try {
    return JSON.parse(value);
  } catch (error) {
    throw new Error(`wrangler_d1_execute_invalid_json:${error.message}`);
  }
}

export function queryRemoteSourceRegistry() {
  const result = spawnSync(
    process.execPath,
    [
      'node_modules/wrangler/bin/wrangler.js',
      'd1',
      'execute',
      TARGET_D1_DATABASE,
      '--remote',
      '--command',
      SOURCE_REGISTRY_READ_QUERY,
      '--json',
    ],
    {
      encoding: 'utf8',
      env: process.env,
      maxBuffer: 10 * 1024 * 1024,
    },
  );

  if (result.status !== 0) {
    const diagnostic = (result.stderr || result.stdout || '').trim();
    throw new Error(`remote_source_registry_query_failed${diagnostic ? `:${diagnostic}` : ''}`);
  }
  return parseWranglerD1ExecuteJson(parseJsonOutput(result.stdout));
}

export function formatVerificationSummary(result) {
  const lines = [
    '## Evidence source registry verification',
    '',
    `- Database: \`${result.databaseName}\``,
    `- Verified at: \`${result.verifiedAt}\``,
    `- Manifest identities: **${result.manifestSourceCount}**`,
    `- Registry rows inspected: **${result.registryRowCount}**`,
    `- Resolved: **${result.counts.resolved}**`,
    `- Not registered: **${result.counts.sourceNotRegistered}**`,
    `- Ambiguous: **${result.counts.sourceRegistryAmbiguous}**`,
    `- Ready for importer: **${result.readyForImporter ? 'yes' : 'no'}**`,
    '',
    '| sourceAuditKey | status | reason |',
    '|---|---|---|',
    ...result.results.map((entry) => `| ${entry.sourceAuditKey} | ${entry.status} | ${entry.reason ?? ''} |`),
    '',
    '> Read-only verification. No source_registry mutation, migration apply, importer or claim write is performed.',
    '',
  ];
  return lines.join('\n');
}

async function main() {
  const outputPath = path.resolve(
    process.argv[2] || 'artifacts/evidence-source-registry-verification.json',
  );
  const manifest = await loadReconciliationManifest();
  const registryRows = queryRemoteSourceRegistry();
  const result = buildVerificationResult(manifest, registryRows);

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`, 'utf8');

  const summary = formatVerificationSummary(result);
  process.stdout.write(`${summary}\n`);
  if (process.env.GITHUB_STEP_SUMMARY) {
    await appendFile(process.env.GITHUB_STEP_SUMMARY, summary, 'utf8');
  }
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}

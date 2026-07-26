import { spawnSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const PRODUCTION_D1_BINDING = 'DB';
export const PRODUCTION_D1_DATABASE_NAME = 'senza-roaming';
export const D1_DATABASE_ID_PLACEHOLDER = 'REPLACE_WITH_D1_DATABASE_ID';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function asDatabaseRecords(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === 'object') {
    if (Array.isArray(payload.result)) return payload.result;
    if (Array.isArray(payload.databases)) return payload.databases;
  }
  throw new TypeError('Wrangler D1 list output must contain an array of databases.');
}

function databaseIdentifier(record) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) return '';
  for (const key of ['uuid', 'id', 'database_id']) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

export function resolveProductionD1DatabaseId(payload) {
  const matches = asDatabaseRecords(payload).filter(
    (record) => record && typeof record === 'object' && record.name === PRODUCTION_D1_DATABASE_NAME,
  );

  if (matches.length !== 1) {
    throw new Error(
      `Expected exactly one remote D1 database named ${PRODUCTION_D1_DATABASE_NAME}; found ${matches.length}.`,
    );
  }

  const databaseId = databaseIdentifier(matches[0]);
  if (!UUID_PATTERN.test(databaseId)) {
    throw new Error(`Remote D1 database ${PRODUCTION_D1_DATABASE_NAME} did not return a valid UUID.`);
  }
  return databaseId;
}

export function applyProductionD1Binding(input, databaseId) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new TypeError('Compiled Wrangler configuration must be an object.');
  }
  if (!UUID_PATTERN.test(databaseId)) {
    throw new Error('Production D1 database ID must be a valid UUID.');
  }

  const config = structuredClone(input);
  if (!Array.isArray(config.d1_databases)) {
    throw new TypeError('Compiled Wrangler configuration must contain d1_databases.');
  }

  const matches = config.d1_databases.filter(
    (binding) =>
      binding &&
      typeof binding === 'object' &&
      binding.binding === PRODUCTION_D1_BINDING &&
      binding.database_name === PRODUCTION_D1_DATABASE_NAME,
  );

  if (matches.length !== 1) {
    throw new Error(
      `Expected exactly one compiled ${PRODUCTION_D1_BINDING} binding for ${PRODUCTION_D1_DATABASE_NAME}; found ${matches.length}.`,
    );
  }

  const currentId = matches[0].database_id;
  if (currentId !== D1_DATABASE_ID_PLACEHOLDER && currentId !== databaseId) {
    throw new Error('Compiled production D1 binding contains an unexpected database_id.');
  }

  matches[0].database_id = databaseId;
  return config;
}

function parseWranglerJson(output) {
  const trimmed = output.trim();
  if (!trimmed) throw new Error('Wrangler D1 list returned no JSON output.');
  try {
    return JSON.parse(trimmed);
  } catch (error) {
    throw new Error(`Wrangler D1 list returned invalid JSON: ${error.message}`);
  }
}

function loadRemoteD1Databases() {
  const result = spawnSync(
    process.execPath,
    ['node_modules/wrangler/bin/wrangler.js', 'd1', 'list', '--json'],
    {
      encoding: 'utf8',
      env: process.env,
      maxBuffer: 10 * 1024 * 1024,
    },
  );

  if (result.status !== 0) {
    const diagnostic = (result.stderr || result.stdout || '').trim();
    throw new Error(`Unable to list remote D1 databases with Wrangler.${diagnostic ? ` ${diagnostic}` : ''}`);
  }
  return parseWranglerJson(result.stdout);
}

async function main() {
  const configPath = path.resolve(process.argv[2] ?? 'apps/web/dist/server/wrangler.json');
  const payload = loadRemoteD1Databases();
  const databaseId = resolveProductionD1DatabaseId(payload);
  const source = await readFile(configPath, 'utf8');
  const configured = applyProductionD1Binding(JSON.parse(source), databaseId);
  await writeFile(configPath, `${JSON.stringify(configured, null, 2)}\n`, 'utf8');
  console.log('Prepared the production D1 binding in the compiled Wrangler configuration.');
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  await main();
}

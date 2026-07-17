import { readFile, writeFile } from 'node:fs/promises';

const databaseId = process.env.D1_DATABASE_ID?.trim();
if (!databaseId) {
  console.error('D1_DATABASE_ID is required.');
  process.exit(1);
}

const sourcePath = process.argv[2] || 'wrangler.jsonc';
const outputPath = process.argv[3] || 'wrangler.production.jsonc';

const raw = await readFile(sourcePath, 'utf8');
const config = JSON.parse(raw);

if (!Array.isArray(config.d1_databases) || !config.d1_databases.length) {
  console.error('No D1 binding found in Wrangler config.');
  process.exit(1);
}

const database = config.d1_databases.find((item) => item?.binding === 'DB');
if (!database) {
  console.error('D1 binding DB was not found.');
  process.exit(1);
}

database.database_id = databaseId;

if (process.env.SENZA_ROAMING_SITE_URL?.trim()) {
  config.vars = config.vars || {};
  config.vars.SITE_URL = process.env.SENZA_ROAMING_SITE_URL.trim();
}

await writeFile(outputPath, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
console.log(`Generated ${outputPath} for D1 database ${databaseId}.`);

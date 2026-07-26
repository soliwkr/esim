import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const PRODUCTION_CONSENT_PROVIDER = 'iubenda';
export const PRODUCTION_CONSENT_EMBED_ID = 'f8ebd840-9f82-427c-a9b7-1425cb627a87';

const LEGACY_KEYS = ['CMP_SITE_ID', 'CMP_COOKIE_POLICY_ID'];

export function applyProductionConsentConfig(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new TypeError('Compiled Wrangler configuration must be an object.');
  }

  const config = structuredClone(input);
  if (!config.vars || typeof config.vars !== 'object' || Array.isArray(config.vars)) {
    throw new TypeError('Compiled Wrangler configuration must contain a vars object.');
  }
  if (config.vars.GTM_ID !== '') {
    throw new Error('CMP-only deploy requires GTM_ID to remain empty.');
  }
  for (const key of LEGACY_KEYS) {
    if (key in config.vars) throw new Error(`Legacy consent variable ${key} must not be present.`);
  }

  config.vars.CMP_PROVIDER = PRODUCTION_CONSENT_PROVIDER;
  config.vars.CMP_EMBED_ID = PRODUCTION_CONSENT_EMBED_ID;
  return config;
}

async function main() {
  const configPath = path.resolve(process.argv[2] ?? 'apps/web/dist/server/wrangler.json');
  const source = await readFile(configPath, 'utf8');
  const parsed = JSON.parse(source);
  const configured = applyProductionConsentConfig(parsed);
  await writeFile(configPath, `${JSON.stringify(configured, null, 2)}\n`, 'utf8');
  console.log(`Prepared CMP-only production configuration at ${configPath}.`);
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  await main();
}

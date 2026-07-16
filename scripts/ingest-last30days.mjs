#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import process from 'node:process';

const inputPath = process.argv[2];
const baseUrl = (process.env.SENZA_ROAMING_MAINTENANCE_URL || '').replace(/\/$/, '');
const token = process.env.MAINTENANCE_TOKEN || '';

if (!inputPath) {
  console.error('Uso: npm run research:ingest -- path/to/last30days.json');
  process.exit(1);
}
if (!baseUrl) {
  console.error('Manca SENZA_ROAMING_MAINTENANCE_URL, per esempio https://senzaroaming.it');
  process.exit(1);
}
if (!token) {
  console.error('Manca MAINTENANCE_TOKEN. Non inserirlo nel repository.');
  process.exit(1);
}

let payload;
try {
  payload = JSON.parse(await readFile(inputPath, 'utf8'));
} catch (error) {
  console.error(`Impossibile leggere JSON da ${inputPath}:`, error instanceof Error ? error.message : error);
  process.exit(1);
}

const response = await fetch(`${baseUrl}/api/maintenance/research-ingest`, {
  method: 'POST',
  headers: {
    authorization: `Bearer ${token}`,
    'content-type': 'application/json'
  },
  body: JSON.stringify(payload)
});

const body = await response.text();
let output;
try { output = JSON.parse(body); } catch { output = body; }

if (!response.ok) {
  console.error(`Ingest fallito (${response.status}):`, output);
  process.exit(1);
}

console.log(JSON.stringify(output, null, 2));

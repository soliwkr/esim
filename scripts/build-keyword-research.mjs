#!/usr/bin/env node
/**
 * Converte export Google Keyword Planner CSV o UTF-16 TSV in NDJSON normalizzato.
 *
 * Uso:
 *   node scripts/build-keyword-research.mjs export.csv > keywords.ndjson
 */
import fs from 'node:fs';

const files = process.argv.slice(2);
if (!files.length) {
  console.error('Indica almeno un export Keyword Planner.');
  process.exit(1);
}

function decode(file) {
  const data = fs.readFileSync(file);
  if (data[0] === 0xff && data[1] === 0xfe) return data.subarray(2).toString('utf16le');
  return data.toString('utf8').replace(/^\uFEFF/, '');
}

function parseLine(line, separator) {
  const cells = [];
  let value = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') { value += '"'; index += 1; }
      else quoted = !quoted;
    } else if (character === separator && !quoted) {
      cells.push(value); value = '';
    } else value += character;
  }
  cells.push(value);
  return cells;
}

const rows = new Map();
for (const file of files) {
  const lines = decode(file).split(/\r?\n/).filter(Boolean);
  const headerIndex = lines.findIndex((line) => /Keyword|Parola chiave/i.test(line));
  if (headerIndex < 0) throw new Error(`Intestazione non trovata in ${file}`);
  const separator = lines[headerIndex].includes('\t') ? '\t' : ',';
  const headers = parseLine(lines[headerIndex], separator);
  for (const line of lines.slice(headerIndex + 1)) {
    const values = parseLine(line, separator);
    const row = Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']));
    const rawKeyword = row.Keyword ?? row['Parola chiave'] ?? '';
    const keyword = String(rawKeyword).trim().toLowerCase().replace(/\s+/g, ' ');
    if (!keyword) continue;
    const rawVolume = row['Avg. monthly searches'] ?? row['Ricerche medie mensili'] ?? '0';
    const volume = Number(String(rawVolume).replace(/[.,]/g, '')) || 0;
    const previous = rows.get(keyword);
    if (!previous || volume > previous.avg_monthly_searches) {
      rows.set(keyword, {
        keyword,
        avg_monthly_searches: volume,
        competition: row.Competition ?? row.Concorrenza ?? '',
        competition_index: Number(row['Competition (indexed value)'] ?? row['Concorrenza (valore indicizzato)'] ?? 0) || 0,
        source_file: file
      });
    }
  }
}

for (const row of [...rows.values()].sort((a, b) => b.avg_monthly_searches - a.avg_monthly_searches || a.keyword.localeCompare(b.keyword, 'it'))) {
  process.stdout.write(`${JSON.stringify(row)}\n`);
}

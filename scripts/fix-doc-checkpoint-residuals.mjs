import { readFile, writeFile } from 'node:fs/promises';

async function replace(path, before, after) {
  const source = await readFile(path, 'utf8');
  if (source.includes(after)) return;
  if (!source.includes(before)) throw new Error(`Missing expected text in ${path}`);
  await writeFile(path, source.replace(before, after), 'utf8');
}

await replace(
  'docs/STATUS.md',
  '| Topic-mismatch gate | Mergiato, verifica remota aperta | PR #46, CI #188; migrazione `0019` da attestare |',
  '| Topic-mismatch gate | Mergiato, verifica funzionale aperta | PR #46, CI #188; stack remoto allineato, primo nuovo run ancora da osservare |',
);
await replace(
  'docs/NEXT.md',
  '- applicazione remota della migrazione `0019`;\n- normalizzatore con anchor attivo sui nuovi run;',
  '- conferma del normalizzatore con anchor attivo sui nuovi run;\n- osservazione del primo nuovo run autorizzato;',
);
await replace(
  'docs/NEXT.md',
  '- PR #46 — topic-mismatch gate mergiato, verifica remota aperta;',
  '- PR #46 — topic-mismatch gate mergiato; stack remoto allineato, verifica funzionale sul prossimo run aperta;',
);
await replace(
  'docs/NEXT.md',
  '## Checkpoint in review\n\n- draft PR #54 — decisione brief controllata, CI #230 verde.\n\n',
  '',
);

console.log('Documentation residuals fixed.');

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const repo = new URL('../../..', import.meta.url).pathname;
const worker = readFileSync(join(root, 'src/entrypoints/worker.ts'), 'utf8');
const page = readFileSync(join(root, 'src/pages/_spike/control-room/index.astro'), 'utf8');
const backend = readFileSync(join(repo, 'src/index.ts'), 'utf8');

const checks = [
  ['custom entrypoint delegates maintenance API', worker.includes("pathname.startsWith('/api/')")],
  ['Last30DaysContainer export preserved', worker.includes('export { Last30DaysContainer') && backend.includes('Last30DaysContainer')],
  ['RecentDemandWorkflow export preserved', worker.includes('RecentDemandWorkflow') && backend.includes('RecentDemandWorkflow')],
  ['Control Room route is noindex', page.includes('noindex,nofollow')],
  ['no publication API route introduced in apps/web', !contains(join(root, 'src/pages'), /api\/.*publish|readyForPublication/i)],
  ['no token literal in HTML', !page.includes('MAINTENANCE_TOKEN') && !page.includes('AI_GATEWAY_TOKEN')]
];

let failed = 0;
for (const [name, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`);
  if (!ok) failed++;
}
process.exitCode = failed ? 1 : 0;

function contains(dir, pattern) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const stat = statSync(path);
    if (stat.isDirectory()) { if (contains(path, pattern)) return true; continue; }
    if (/\.(tsx?|astro|mjs|css)$/.test(name) && pattern.test(readFileSync(path, 'utf8'))) return true;
  }
  return false;
}

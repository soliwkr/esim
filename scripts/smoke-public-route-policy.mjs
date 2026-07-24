import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

const temporaryDirectory = await mkdtemp(path.join(tmpdir(), 'senza-roaming-route-policy-'));
const compiledModulePath = path.join(temporaryDirectory, 'public-route-policy.mjs');

try {
  const source = await readFile('src/public-route-policy.ts', 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
      strict: true,
    },
    fileName: 'src/public-route-policy.ts',
    reportDiagnostics: true,
  });

  const errors = (compiled.diagnostics || []).filter(
    (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error,
  );
  assert.deepEqual(
    errors.map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')),
    [],
    'The route policy must transpile without TypeScript diagnostics.',
  );

  await writeFile(compiledModulePath, compiled.outputText, 'utf8');
  const policy = await import(`${pathToFileURL(compiledModulePath).href}?v=${Date.now()}`);

  const {
    activePublicRouteDecision,
    currentPublicRouteDecision,
    isControlRoomFoundationPath,
    isPublicPreviewPath,
    looksLikePublicFileProbe,
    normalizePublicPathname,
    publicArticleSlugCandidate,
    targetPublicRouteDecision,
  } = policy;

  assert.equal(normalizePublicPathname('/'), '/');
  assert.equal(normalizePublicPathname('guide/'), '/guide');
  assert.equal(normalizePublicPathname('//astro-foundation///guide/?from=smoke#top'), '/astro-foundation/guide');
  assert.equal(normalizePublicPathname('/control-room-foundation/'), '/control-room-foundation');

  assert.equal(isPublicPreviewPath('/astro-foundation'), true);
  assert.equal(isPublicPreviewPath('/astro-foundation/guide'), true);
  assert.equal(isPublicPreviewPath('/astro-foundation-x'), false);
  assert.equal(isPublicPreviewPath('//astro-foundation'), false);
  assert.equal(isControlRoomFoundationPath('/control-room-foundation'), true);
  assert.equal(isControlRoomFoundationPath('/control-room-foundation/api/snapshot'), true);
  assert.equal(isControlRoomFoundationPath('/control-room-foundation-x'), false);
  assert.equal(isControlRoomFoundationPath('//control-room-foundation'), false);

  for (const value of [
    '/.env',
    '/config.json',
    '/backup.sql',
    '/nested/.git/config',
    '/scripts/debug.py',
  ]) {
    assert.equal(looksLikePublicFileProbe(value), true, `${value} must be treated as a file probe.`);
  }
  for (const value of ['/migliore-esim', '/esim-estero', '/guide-pratiche']) {
    assert.equal(looksLikePublicFileProbe(value), false, `${value} must remain a normal public path.`);
  }

  assert.equal(publicArticleSlugCandidate('/migliore-esim'), 'migliore-esim');
  assert.equal(publicArticleSlugCandidate('esim-estero/'), 'esim-estero');
  for (const value of [
    '/',
    '/404',
    '/guide',
    '/api',
    '/go',
    '/robots.txt',
    '/sitemap.xml',
    '/favicon.svg',
    '/two/segments',
    '/Migliore-esim',
    '/migliore_esim',
    '/config.json',
    '/.env',
  ]) {
    assert.equal(publicArticleSlugCandidate(value), null, `${value} must not become an article slug.`);
  }

  const currentAstroPaths = [
    '/astro-foundation',
    '/astro-foundation/guide',
    '/astro-foundation/articoli/migliore-esim',
    '/control-room-foundation',
    '/control-room-foundation/api/snapshot',
  ];
  for (const pathname of currentAstroPaths) {
    const decision = currentPublicRouteDecision(pathname);
    assert.equal(decision.owner, 'astro', `${pathname} belongs to Astro in the pre-cutover matrix.`);
    assert.equal(Object.isFrozen(decision), true, 'Route decisions must be immutable.');
  }

  const currentBackendExpectations = new Map([
    ['/', 'canonical-static'],
    ['/destinazioni', 'canonical-static'],
    ['/guide', 'canonical-static'],
    ['/confronti', 'canonical-static'],
    ['/metodo', 'canonical-static'],
    ['/trasparenza', 'canonical-static'],
    ['/privacy', 'canonical-static'],
    ['/404', 'public-404'],
    ['/migliore-esim', 'canonical-article'],
    ['/sitemap.xml', 'seo-endpoint'],
    ['/robots.txt', 'seo-endpoint'],
    ['/go/airalo', 'provider-redirect'],
    ['/api/health', 'api'],
    ['/control-room', 'legacy-control-room'],
    ['/control-room.js', 'legacy-control-room'],
    ['/favicon.svg', 'technical-asset'],
    ['/_astro/app.js', 'technical-asset'],
    ['/missing/path', 'public-404'],
    ['/.env', 'public-404'],
    ['/config.json', 'public-404'],
    ['//astro-foundation', 'public-404'],
    ['//control-room-foundation', 'public-404'],
    ['//control-room-foundation/api/snapshot', 'public-404'],
  ]);
  for (const [pathname, kind] of currentBackendExpectations) {
    const decision = currentPublicRouteDecision(pathname);
    assert.equal(decision.owner, 'backend', `${pathname} belongs to the backend in the pre-cutover matrix.`);
    assert.equal(decision.kind, kind, `${pathname} has an unexpected route kind.`);
  }

  for (const pathname of [
    '/',
    '/destinazioni',
    '/guide',
    '/confronti',
    '/metodo',
    '/trasparenza',
    '/privacy',
    '/404',
    '/migliore-esim',
    '/sitemap.xml',
    '/robots.txt',
    '/missing/path',
  ]) {
    assert.equal(
      targetPublicRouteDecision(pathname).owner,
      'astro',
      `${pathname} must be Astro-owned in the target matrix.`,
    );
  }

  for (const pathname of [
    '/api/health',
    '/api/maintenance/control-room',
    '/go/airalo',
    '/control-room',
    '/control-room.js',
    '/favicon.svg',
    '/_astro/app.js',
  ]) {
    assert.equal(
      targetPublicRouteDecision(pathname).owner,
      'backend',
      `${pathname} must remain backend-owned after cutover.`,
    );
  }

  const comparisonPaths = [
    '/',
    '/404',
    '/guide',
    '/migliore-esim',
    '/sitemap.xml',
    '/robots.txt',
    '/go/airalo',
    '/api/health',
    '/control-room',
    '/astro-foundation',
    '/control-room-foundation',
    '/missing/path',
    '/config.json',
    '//astro-foundation',
    '//control-room-foundation',
  ];
  for (const pathname of comparisonPaths) {
    assert.deepEqual(
      activePublicRouteDecision(pathname),
      targetPublicRouteDecision(pathname),
      `The active matrix must equal the target matrix for ${pathname}.`,
    );
  }

  console.log('Public route policy smoke passed: target ownership is active and backend boundaries are preserved.');
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}

import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

const temporaryDirectory = await mkdtemp(path.join(tmpdir(), 'senza-roaming-m7-hubs-'));

async function importTypeScriptModule(sourcePath, outputName) {
  const source = await readFile(sourcePath, 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
      strict: true,
    },
    fileName: sourcePath,
    reportDiagnostics: true,
  });
  const errors = (compiled.diagnostics || []).filter(
    (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error,
  );
  assert.deepEqual(
    errors.map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')),
    [],
    `${sourcePath} must transpile without TypeScript diagnostics.`,
  );

  const outputPath = path.join(temporaryDirectory, outputName);
  await writeFile(outputPath, compiled.outputText, 'utf8');
  return import(`${pathToFileURL(outputPath).href}?v=${Date.now()}`);
}

try {
  const seo = await importTypeScriptModule('src/public-seo.ts', 'public-seo.mjs');
  const listings = await importTypeScriptModule('src/public-listing-routes.ts', 'public-listing-routes.mjs');
  const homepageSource = await readFile(
    'apps/web/src/components/public/PublicHomepagePage.astro',
    'utf8',
  );

  const homepageSeo = seo.publicHomepageSeo('Senza Roaming', 'https://senzaroaming.it/');
  assert.equal(
    homepageSeo.title,
    'eSIM da viaggio: destinazioni, guide e confronti | Senza Roaming',
  );
  assert.equal(
    homepageSeo.description,
    'Scegli la eSIM da viaggio partendo da destinazione, compatibilità e criteri di confronto, con guide italiane e informazioni verificate.',
  );
  assert.match(
    homepageSource,
    /<h1 id="hero-title">Scegli la eSIM giusta per il tuo viaggio\.<\/h1>/,
  );
  assert.doesNotMatch(homepageSource, /<h1[^>]*>.*migliore eSIM/is);
  assert.doesNotMatch(homepageSource, /href=["']\/esim-viaggio["']/);

  const definitions = listings.PUBLIC_LISTING_DEFINITIONS;
  assert.equal(definitions.length, 3);
  assert.deepEqual(
    definitions.map((definition) => definition.canonicalPath),
    ['/destinazioni', '/guide', '/confronti'],
  );
  assert.equal(new Set(definitions.map((definition) => definition.type)).size, 3);

  const destination = listings.publicListingDefinition('destination');
  assert.equal(destination.seoTitle, 'eSIM per destinazione: guide per Paese');
  assert.equal(destination.title, 'eSIM per destinazione: scegli il Paese');
  assert.deepEqual(destination.curatedLinks, []);

  const guide = listings.publicListingDefinition('guide');
  assert.equal(guide.seoTitle, 'Guide eSIM: compatibilità, attivazione e uso');
  assert.equal(guide.title, 'Guide eSIM: come funzionano, si installano e si usano');
  assert.deepEqual(
    guide.curatedLinks.map((item) => item.slug),
    ['esim-come-funziona', 'esim-telefoni-compatibili', 'esim-estero'],
  );

  const comparison = listings.publicListingDefinition('comparison');
  assert.equal(comparison.seoTitle, 'Confronti eSIM e provider: differenze e criteri');
  assert.equal(comparison.title, 'Confronti eSIM: provider, piani e limiti');
  assert.deepEqual(
    comparison.curatedLinks.map((item) => item.slug),
    ['migliore-esim'],
  );
  assert.match(comparison.criteriaItems.join(' '), /remunerazione.*giudizio editoriale/i);

  console.log('M7 public homepage and listing hub contract smoke passed.');
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}

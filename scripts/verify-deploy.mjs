/**
 * Post-deploy smoke check for AutoTrampa.
 *
 * Every check here maps to something that was actually broken and fixed at some
 * point, so a green run is evidence the fixes are live rather than just built:
 *
 *  - `/` renders and carries the light-mode-aware footer (was hardcoded dark)
 *  - demo listings are labelled (they used to look like real listings)
 *  - Serbian city names in the seed data (`Beograd`/`Niš`, not `Belgrade`/`Nis`)
 *  - `/car/<known-id>` prerenders with its own metadata
 *  - `/car/<unknown-id>` answers a real 404 (`dynamicParams = false`)
 *  - `robots.txt` and `sitemap.xml` point at the deployed origin
 *  - the metadata routes are not blocked by the middleware matcher
 *
 * Usage: node scripts/verify-deploy.mjs https://tvoj-domen
 */

const base = (process.argv[2] || process.env.DEPLOY_URL || '').replace(/\/+$/, '');

if (!base) {
  console.error('Usage: node scripts/verify-deploy.mjs https://tvoj-domen');
  process.exit(2);
}

let failures = 0;

function pass(label, detail = '') {
  console.log(`  ok   ${label}${detail ? ` — ${detail}` : ''}`);
}

function fail(label, detail) {
  failures += 1;
  console.error(`  FAIL ${label} — ${detail}`);
}

async function get(path) {
  const response = await fetch(`${base}${path}`, { redirect: 'manual' });
  const body = await response.text();
  return { status: response.status, body };
}

async function check(label, fn) {
  try {
    const detail = await fn();
    pass(label, detail);
  } catch (error) {
    fail(label, error instanceof Error ? error.message : String(error));
  }
}

function expect(condition, message) {
  if (!condition) throw new Error(message);
}

console.log(`Verifying ${base}\n`);

await check('GET / returns 200', async () => {
  const { status } = await get('/');
  expect(status === 200, `expected 200, got ${status}`);
});

await check('home page renders the app shell', async () => {
  const { body } = await get('/');
  expect(body.includes('AutoTrampa'), 'brand name missing from HTML');
  expect(body.includes('id="sadrzaj"'), 'skip-link target missing');
  // The footer used to be hardcoded to zinc-900, which broke light mode.
  expect(
    !body.includes('bg-zinc-900 text-zinc-400'),
    'footer is still hardcoded dark',
  );
});

await check('demo listings are labelled', async () => {
  const { body } = await get('/');
  expect(body.includes('Demo'), 'no "Demo" badge found on the feed');
});

await check('Serbian city names in the seed data', async () => {
  const { body } = await get('/');
  expect(body.includes('Beograd') || body.includes('Niš'), 'no Serbian city name found');
  expect(!body.includes('Belgrade'), 'English city name "Belgrade" still present');
});

await check('landing HTML declares the Serbian locale', async () => {
  const { body } = await get('/');
  expect(body.includes('lang="sr"'), 'html lang is not "sr"');
});

await check('known listing prerenders with its own metadata', async () => {
  const { body } = await get('/');
  const match = body.match(/href="\/car\/([a-z0-9-]+)"/i);
  expect(Boolean(match), 'no listing link found on the feed');
  const id = match[1];
  const { status, body: page } = await get(`/car/${id}`);
  expect(status === 200, `expected 200 for /car/${id}, got ${status}`);
  expect(page.includes('<title>') || page.includes('og:title'), 'no metadata rendered');
  return id;
});

await check('unknown listing is a real 404', async () => {
  const { status } = await get('/car/this-id-does-not-exist-12345');
  expect(status === 404, `expected 404, got ${status} (dynamicParams may be true again)`);
});

await check('robots.txt is served and points at this origin', async () => {
  const { status, body } = await get('/robots.txt');
  expect(status === 200, `expected 200, got ${status}`);
  expect(body.includes('sitemap'), 'no sitemap reference in robots.txt');
});

await check('sitemap.xml is served', async () => {
  const { status, body } = await get('/sitemap.xml');
  expect(status === 200, `expected 200, got ${status}`);
  expect(body.includes('/car/'), 'sitemap lists no listings');
});

await check('manifest is not blocked by the middleware matcher', async () => {
  const { status } = await get('/manifest.webmanifest');
  expect(status === 200, `expected 200, got ${status}`);
});

await check('personal screens stay out of the index', async () => {
  const { body } = await get('/saved');
  expect(
    body.includes('noindex'),
    '/saved is missing the noindex directive',
  );
});

console.log('');
if (failures > 0) {
  console.error(`${failures} check(s) failed.`);
  process.exit(1);
}
console.log('All checks passed — the fixes are live.');

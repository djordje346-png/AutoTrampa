import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
const ts = require('typescript');
function load(relative) {
  const source = readFileSync(new URL(relative, import.meta.url), 'utf8');
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const exports = {};
  vm.runInNewContext(output, { exports, URL });
  return exports;
}

const { getAuthRedirect } = load('../lib/auth-redirect.ts');
const origin = 'https://www.autotrampa.rs';
for (const path of ['//example.com', '/\\example.com', '/\\\\example.com', 'https://example.com', 'javascript:alert(1)', null]) {
  const target = getAuthRedirect(`${origin}/auth/callback`, path);
  assert.equal(target.origin, origin);
  assert.equal(target.pathname, '/');
}
for (const path of ['/?intent=add-car', '/messages?tab=offers', '/car/example#photos']) {
  assert.equal(getAuthRedirect(`${origin}/auth/callback`, path).href, origin + path);
}
console.log('PASS OAuth next paths reject foreign origins and preserve internal pending actions');

const base = process.argv[2];
if (base) {
  const host = new URL(base);
  for (const path of ['/terms', '/privacy']) {
    const response = await fetch(new URL(path, host));
    assert.equal(response.status, 200, path);
    assert.equal(response.headers.get('x-frame-options'), 'DENY');
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
    assert.match(response.headers.get('content-security-policy'), /frame-ancestors 'none'/);
    const body = await response.text();
    assert.ok(body.includes('djordje346@gmail.com'));
    assert.ok(body.includes('Đorđe Radovanović'));
  }
  for (const path of ['//example.com', '/\\example.com', '/?intent=add-car']) {
    const callback = new URL('/auth/callback', host);
    callback.searchParams.set('next', path);
    const response = await fetch(callback, { redirect: 'manual' });
    assert.equal(response.status, 307);
    assert.equal(new URL(response.headers.get('location')).origin, host.origin);
    assert.match(response.headers.get('cache-control'), /no-store/);
  }
  console.log('PASS legal pages, contact data, security headers and actual callback redirects');
}

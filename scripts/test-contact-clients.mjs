import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

// Dependencies are deliberately loaded outside the application. This runner
// exercises the actual TS/TSX modules and React hooks without changing its lockfile.
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const runtimeArg = process.argv.indexOf('--runtime-directory');
if (runtimeArg < 0 || !process.argv[runtimeArg + 1]) {
  throw new Error('Usage: node scripts/test-contact-clients.mjs --runtime-directory <isolated-runtime>');
}
const runtimeRequire = createRequire(path.join(path.resolve(process.argv[runtimeArg + 1]), 'package.json'));
const appRequire = createRequire(path.join(repo, 'package.json'));
const ts = appRequire('typescript');
const React = runtimeRequire('react');
const { act, create } = runtimeRequire('react-test-renderer');

const A = '10000000-0000-4000-8000-000000000001';
const B = '20000000-0000-4000-8000-000000000002';
const CAR_A = '30000000-0000-4000-8000-000000000003';
const CAR_B = '40000000-0000-4000-8000-000000000004';
const CONVERSATION = '50000000-0000-4000-8000-000000000005';
const PHONE = '+381641234567';
const OTHER_PHONE = '+381651234567';

function deferred() {
  let resolve, reject;
  const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

function authFor(id) {
  return {
    userId: id,
    user: id ? { id, email: `${id[0]}@example.test`, user_metadata: {} } : null,
    mounted: true,
    isLoggedIn: Boolean(id),
    requireAuth: () => Boolean(id),
  };
}

function installBrowser() {
  const entries = new Map();
  const dialed = [];
  const localStorage = {
    get length() { return entries.size; },
    key: (index) => [...entries.keys()][index] ?? null,
    getItem: (key) => entries.get(key) ?? null,
    setItem: (key, value) => entries.set(key, String(value)),
    removeItem: (key) => entries.delete(key),
  };
  const windowTarget = new EventTarget();
  const documentTarget = new EventTarget();
  Object.assign(windowTarget, {
    localStorage,
    location: { assign: (href) => dialed.push(href), href: 'https://example.test/' },
    setInterval: () => 1,
    clearInterval: () => {},
    matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
  });
  Object.assign(documentTarget, { visibilityState: 'visible', body: { style: {} } });
  globalThis.window = windowTarget;
  globalThis.document = documentTarget;
  return { entries, dialed, window: windowTarget, document: documentTarget };
}

function harness(extraStubs = {}) {
  const browser = installBrowser();
  const ctx = {
    ...browser,
    auth: authFor(A),
    rpcCalls: [],
    toasts: [],
    rpc: async () => ({ data: { status: 'hidden' }, error: null }),
    profileRead: async () => ({ data: null, error: null }),
    profileInsert: async () => ({ error: null }),
    profileUpdate: async (id, values) => ({ data: { id, ...values }, error: null }),
  };
  const client = {
    rpc(name, args) { ctx.rpcCalls.push({ name, args }); return ctx.rpc(name, args); },
    from(table) {
      assert.equal(table, 'profiles', 'Unexpected direct table access in client regression');
      let id, values;
      const query = {
        select() { return query; },
        eq(column, value) { assert.equal(column, 'id'); id = value; return query; },
        update(patch) { values = patch; return query; },
        maybeSingle() { return ctx.profileRead(id); },
        single() { return ctx.profileUpdate(id, values); },
        insert(row) { return ctx.profileInsert(row); },
      };
      return query;
    },
  };
  const icon = (props) => React.createElement('svg', props);
  const stubs = {
    react: React,
    'react/jsx-runtime': runtimeRequire('react/jsx-runtime'),
    '@/hooks/use-auth': { useAuth: () => ctx.auth },
    '@/lib/supabase': { getSupabase: () => client },
    'next/link': { default: ({ children, ...props }) => React.createElement('a', props, children), __esModule: true },
    'next/navigation': { useRouter: () => ({ back() {}, push() {}, replace() {} }) },
    'lucide-react': new Proxy({}, { get: (_target, key) => key === '__esModule' ? false : icon }),
    sonner: { toast: new Proxy({}, { get: (_target, kind) => (...args) => ctx.toasts.push({ kind, args }) }) },
    ...extraStubs,
  };
  const cache = new Map();
  function load(specifier, parent = path.join(repo, 'index.ts')) {
    if (Object.hasOwn(stubs, specifier)) return stubs[specifier];
    if (!specifier.startsWith('@/') && !specifier.startsWith('.') && !path.isAbsolute(specifier)) {
      return appRequire(specifier);
    }
    const candidate = specifier.startsWith('@/')
      ? path.join(repo, specifier.slice(2))
      : path.resolve(path.dirname(parent), specifier);
    const filename = [candidate, `${candidate}.ts`, `${candidate}.tsx`, `${candidate}.json`, path.join(candidate, 'index.ts')]
      .find((name) => fs.existsSync(name) && fs.statSync(name).isFile());
    if (!filename) throw new Error(`Cannot resolve ${specifier} from ${parent}`);
    if (cache.has(filename)) return cache.get(filename).exports;
    const module = { exports: {} };
    cache.set(filename, module);
    if (filename.endsWith('.json')) module.exports = JSON.parse(fs.readFileSync(filename, 'utf8'));
    else {
      const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
        fileName: filename,
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
      }).outputText;
      new vm.Script(`(function(require,module,exports,__filename,__dirname){${compiled}\n})`, { filename })
        .runInThisContext()((name) => load(name, filename), module, module.exports, filename, path.dirname(filename));
    }
    return module.exports;
  }
  return { ctx, load };
}

async function hookMount(hook, initialProps = {}) {
  let value, renderer;
  function Probe(props) { value = hook(props); return null; }
  await act(async () => { renderer = create(React.createElement(Probe, initialProps)); });
  return {
    get value() { return value; },
    async update(props = initialProps) { await act(async () => { renderer.update(React.createElement(Probe, props)); }); },
    async unmount() { await act(async () => renderer.unmount()); },
  };
}

const tests = [];
const test = (name, run) => tests.push({ name, run });

test('contact response validates numbers and strips phones from denied or malformed responses', async () => {
  const { load } = harness();
  const { parseContactPhone } = load('@/lib/contact-phone');
  assert.equal(parseContactPhone({ status: 'available', phone: '00381 (64) 123-4567' }).href, `tel:${PHONE}`);
  assert.equal(parseContactPhone({ status: 'available', phone: '\t+381 (64) 123/4567\n' }).phone, PHONE);
  for (const status of ['hidden', 'missing', 'not_found', 'unknown']) {
    const result = parseContactPhone({ status, phone: PHONE });
    assert.equal(result.phone, null);
    assert.equal(result.href, null);
  }
  for (const phone of ['javascript:alert(1)', '+3811234567;ext=4', '+123', '', null]) {
    assert.equal(parseContactPhone({ status: 'available', phone }).href, null);
  }
});

test('listing hook revalidates privacy before dialing and uses the latest normalized number', async () => {
  const { ctx, load } = harness();
  ctx.rpc = async () => ({ data: { status: 'available', phone: PHONE }, error: null });
  const { useContactPhone } = load('@/hooks/use-contact-phone');
  const probe = await hookMount(() => useContactPhone({ carId: CAR_B }));
  assert.equal(probe.value.href, `tel:${PHONE}`);
  assert.deepEqual(ctx.rpcCalls[0], { name: 'get_listing_contact', args: { p_car_id: CAR_B } });
  ctx.rpc = async () => ({ data: { status: 'hidden', phone: PHONE }, error: null });
  await act(async () => { assert.equal((await probe.value.dial()).status, 'hidden'); });
  assert.deepEqual(ctx.dialed, []);
  assert.equal(probe.value.href, null);
  ctx.rpc = async () => ({ data: { status: 'available', phone: '00381 65 123 4567' }, error: null });
  await act(async () => { await probe.value.dial(); });
  assert.deepEqual(ctx.dialed, [`tel:${OTHER_PHONE}`]);
  await probe.unmount();
});

test('newer hidden response supersedes an older available click response without dialing', async () => {
  const { ctx, load } = harness();
  ctx.rpc = async () => ({ data: { status: 'available', phone: PHONE }, error: null });
  const { useContactPhone } = load('@/hooks/use-contact-phone');
  const probe = await hookMount(() => useContactPhone({ carId: CAR_B }));
  const older = deferred();
  ctx.rpc = () => older.promise;
  let click;
  await act(async () => { click = probe.value.dial(); });
  ctx.rpc = async () => ({ data: { status: 'hidden' }, error: null });
  await act(async () => { await probe.value.refresh(); });
  await act(async () => { older.resolve({ data: { status: 'available', phone: PHONE }, error: null }); await click; });
  assert.equal(probe.value.status, 'hidden');
  assert.deepEqual(ctx.dialed, []);
  await probe.unmount();
});

test('account and target changes reject in-flight contact responses from the previous screen', async () => {
  const { ctx, load } = harness();
  const pending = deferred();
  ctx.rpc = () => pending.promise;
  const { useContactPhone } = load('@/hooks/use-contact-phone');
  const probe = await hookMount(({ id }) => useContactPhone({ carId: id }), { id: CAR_A });
  ctx.auth = authFor(B);
  ctx.rpc = async () => ({ data: { status: 'hidden' }, error: null });
  await probe.update({ id: CAR_A });
  await act(async () => { pending.resolve({ data: { status: 'available', phone: PHONE }, error: null }); await pending.promise; });
  assert.equal(probe.value.status, 'hidden');
  assert.equal(probe.value.phone, null);
  const oldTarget = deferred();
  ctx.rpc = () => oldTarget.promise;
  let click;
  await act(async () => { click = probe.value.dial(); });
  ctx.rpc = async () => ({ data: { status: 'missing' }, error: null });
  await probe.update({ id: CAR_B });
  await act(async () => { oldTarget.resolve({ data: { status: 'available', phone: PHONE }, error: null }); await click; });
  assert.equal(probe.value.status, 'missing');
  assert.deepEqual(ctx.dialed, []);
  await probe.unmount();
});

test('unmounting cancels a pending dial and signed-out sessions never call the contact RPC', async () => {
  const { ctx, load } = harness();
  const { useContactPhone } = load('@/hooks/use-contact-phone');
  const probe = await hookMount(() => useContactPhone({ conversationId: CONVERSATION }));
  const pending = deferred();
  ctx.rpc = () => pending.promise;
  let click;
  await act(async () => { click = probe.value.dial(); });
  await probe.unmount();
  await act(async () => { pending.resolve({ data: { status: 'available', phone: PHONE }, error: null }); await click; });
  assert.deepEqual(ctx.dialed, []);
  assert.equal(ctx.rpcCalls[0].name, 'get_conversation_contact');
  assert.deepEqual(ctx.rpcCalls[0].args, { p_conversation_id: CONVERSATION });
  const previousCalls = ctx.rpcCalls.length;
  ctx.auth = authFor(null);
  const guest = await hookMount(() => useContactPhone({ carId: CAR_B }));
  assert.equal(guest.value.status, 'signed_out');
  await act(async () => { await guest.value.dial(); });
  assert.equal(ctx.rpcCalls.length, previousCalls);
  await guest.unmount();
});

test('RPC denial and network rejection remove any previously available number', async () => {
  const { ctx, load } = harness();
  const { useContactPhone } = load('@/hooks/use-contact-phone');
  ctx.rpc = async () => ({ data: { status: 'available', phone: PHONE }, error: null });
  const probe = await hookMount(() => useContactPhone({ carId: CAR_B }));
  ctx.rpc = async () => ({ data: { status: 'available', phone: PHONE }, error: { code: '42501' } });
  await act(async () => { await probe.value.dial(); });
  assert.equal(probe.value.status, 'unavailable');
  assert.equal(probe.value.href, null);
  ctx.rpc = async () => { throw new Error('offline'); };
  await act(async () => { await probe.value.dial(); });
  assert.equal(probe.value.phone, null);
  assert.deepEqual(ctx.dialed, []);
  await probe.unmount();
});

function conversationRow() {
  return {
    id: CONVERSATION, car_id: CAR_B, offered_car_id: CAR_A, buyer_id: A, seller_id: B,
    buyer_name: 'Owner A', trade_summary: 'Razlika 500 €', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-02T00:00:00Z',
    car: { brand: 'Audi', model: 'A4', generation: 'B8', year: 2010, image: 'b.jpg', owner_name: 'Owner B' },
    offered_car: { brand: 'BMW', model: '525d', generation: 'E60', year: 2008, image: 'a.jpg', owner_name: 'Owner A' },
    messages: [
      { id: 'm3', sender_id: A, kind: 'text', body: 'Third', created_at: '2026-01-01T10:00:00Z', read_at: null },
      { id: 'm2', sender_id: B, kind: 'text', body: 'Second', created_at: '2026-01-01T10:00:00Z', read_at: '2026-01-01T11:00:00Z' },
      { id: 'm1', sender_id: null, kind: 'match', body: 'First', created_at: '2026-01-01T09:00:00Z', read_at: null },
    ],
  };
}

test('conversation mapper shows the counterparty vehicle in both directions with stable message/read state', async () => {
  const { load } = harness();
  const { mapConversation } = load('@/hooks/use-messages');
  const row = conversationRow();
  const original = structuredClone(row);
  const buyer = mapConversation(row, A);
  const seller = mapConversation(row, B);
  assert.equal(buyer.carId, CAR_B);
  assert.match(buyer.carTitle, /Audi A4/);
  assert.equal(buyer.ownerName, 'Owner B');
  assert.equal(seller.carId, CAR_A);
  assert.match(seller.carTitle, /BMW 525d/);
  assert.equal(seller.ownerName, 'Owner A');
  assert.deepEqual(buyer.messages.map((item) => [item.id, item.sender]), [['m1', 'system'], ['m2', 'them'], ['m3', 'me']]);
  assert.equal(buyer.unread, 1);
  assert.equal(seller.unread, 2);
  assert.deepEqual(row, original, 'Mapping must preserve persisted messages and read_at values');
  const legacy = mapConversation({ ...row, offered_car_id: null, offered_car: null }, B);
  assert.equal(legacy.carId, CAR_B);
  assert.equal(legacy.ownerName, 'Owner A');
  const deleted = mapConversation({ ...row, car: null, offered_car: null }, A);
  assert.equal(deleted.carTitle, 'Oglas više nije dostupan');
  assert.equal(deleted.messages.length, 3);
});

function profileRow(phone, privatePhone = true) {
  return { name: 'Test account', city: 'Beograd', phone, rating: 5, trade_count: 0, verified: false, budget: 500, search_radius_km: 50, no_top_up: false, phone_after_match: privatePhone };
}

test('slow previous-account profile response cannot overwrite the current account and reload fetches fresh privacy', async () => {
  const { ctx, load } = harness();
  const pendingA = deferred();
  let reads = 0;
  ctx.profileRead = (id) => { reads += 1; return id === A ? pendingA.promise : Promise.resolve({ data: profileRow(OTHER_PHONE), error: null }); };
  const { useUser, userStore } = load('@/hooks/use-user');
  const probe = await hookMount(() => useUser());
  ctx.auth = authFor(B);
  await probe.update();
  assert.equal(probe.value.user.id, B);
  assert.equal(probe.value.user.phone, OTHER_PHONE);
  await act(async () => { pendingA.resolve({ data: profileRow(PHONE, false), error: null }); await pendingA.promise; });
  assert.equal(userStore.get().id, B);
  assert.equal(probe.value.user.phone, OTHER_PHONE);
  const beforeReload = reads;
  ctx.profileRead = async () => { reads += 1; return { data: profileRow(OTHER_PHONE, false), error: null }; };
  await act(async () => { probe.value.reloadProfile(); });
  assert.equal(reads, beforeReload + 1, 'Explicit reload must not return the loadedProfiles cache');
  assert.equal(probe.value.user.phoneAfterMatch, false);
  await probe.unmount();
});

test('profile creation completion for an old account cannot replace a new account', async () => {
  const { ctx, load } = harness();
  const insertA = deferred();
  ctx.profileRead = async (id) => ({ data: id === A ? null : profileRow(OTHER_PHONE), error: null });
  ctx.profileInsert = (row) => { assert.equal(row.id, A); return insertA.promise; };
  const { useUser, userStore } = load('@/hooks/use-user');
  const probe = await hookMount(() => useUser());
  ctx.auth = authFor(B);
  await probe.update();
  await act(async () => { insertA.resolve({ error: null }); await insertA.promise; });
  assert.equal(userStore.get().id, B);
  assert.equal(probe.value.user.phone, OTHER_PHONE);
  await probe.unmount();
});

test('account preferences ignore legacy local privacy opt-outs and persist explicit changes to Supabase', async () => {
  const { ctx, load } = harness();
  ctx.entries.set(`autotrampa_preferences_user_${A}`, JSON.stringify({ bodyPrefs: ['SUV'], phoneAfterMatch: false }));
  let saved = profileRow(PHONE, true);
  const writes = [];
  ctx.profileRead = async () => ({ data: saved, error: null });
  ctx.profileUpdate = async (id, values) => { writes.push({ id, values }); saved = { ...saved, ...values }; return { data: { id, ...saved }, error: null }; };
  const { usePreferences } = load('@/hooks/use-preferences');
  const probe = await hookMount(() => usePreferences());
  assert.equal(probe.value.preferences.phoneAfterMatch, true);
  assert.deepEqual(probe.value.preferences.bodyPrefs, ['SUV']);
  await act(async () => { assert.equal((await probe.value.update({ phoneAfterMatch: false })).ok, true); });
  assert.deepEqual(writes, [{ id: A, values: { phone_after_match: false } }]);
  assert.equal(probe.value.preferences.phoneAfterMatch, false);
  ctx.profileRead = async () => ({ data: profileRow(OTHER_PHONE, true), error: null });
  ctx.auth = authFor(B);
  await probe.update();
  assert.equal(probe.value.preferences.phoneAfterMatch, true);
  assert.notDeepEqual(probe.value.preferences.bodyPrefs, ['SUV']);
  await probe.unmount();
});

test('a privacy save rejected by Supabase leaves the restrictive server value active', async () => {
  const { ctx, load } = harness();
  ctx.profileRead = async () => ({ data: profileRow(PHONE, true), error: null });
  ctx.profileUpdate = async () => ({ data: null, error: { code: '42501', message: 'Denied by test policy' } });
  const { usePreferences } = load('@/hooks/use-preferences');
  const probe = await hookMount(() => usePreferences());
  const previousError = console.error;
  let result;
  try {
    console.error = () => {};
    await act(async () => { result = await probe.value.update({ phoneAfterMatch: false }); });
  } finally { console.error = previousError; }
  assert.equal(result.ok, false);
  assert.equal(probe.value.preferences.phoneAfterMatch, true);
  await probe.unmount();
});

test('actual listing detail uses authorized tel links in desktop and mobile branches and reports revocation', async () => {
  const car = {
    id: CAR_B, ownerId: B, brand: 'Audi', model: 'A4', generation: 'B8', year: 2010, bodyType: 'Sedan', color: 'Siva', mileage: 100000, price: 5000,
    city: 'Beograd', country: 'Srbija', image: 'b.jpg', images: ['b.jpg'], description: 'Test listing',
    owner: { name: 'Owner B', phone: '+381669999999', city: 'Beograd', rating: 5 },
    specs: { engine: '-', displacement: '-', cylinders: 4, power: '100 KS', torque: '-', fuelType: 'Diesel', transmission: 'Manual', drivetrain: '-', topSpeed: '-', acceleration: '-' },
  };
  const { ctx, load } = harness({
    '@/hooks/use-garage': { useGarage: () => ({ cars: [], selectedCar: null, mounted: true }), garageErrorMessage: () => '' },
    '@/hooks/use-saved': { useSaved: () => ({ save() {} }) },
    '@/hooks/use-swipes': { useSwipes: () => ({ recordSwipe() {} }) },
    '@/hooks/use-match-like': { useMatchLike: () => ({ likeCar() {}, isLiking: () => false }) },
    '@/hooks/use-phone-gate': { requestPhoneAction() {} },
    '@/components/ImageLightbox': { ImageLightbox: () => null },
    '@/components/TradeOfferSheet': { TradeOfferSheet: () => null },
    '@/components/CarForm': { default: () => null, __esModule: true },
  });
  ctx.rpc = async () => ({ data: { status: 'available', phone: PHONE }, error: null });
  const CarDetail = load('@/app/car/[id]/CarDetail').default;
  let renderer;
  await act(async () => { renderer = create(React.createElement(CarDetail, { car })); });
  const links = renderer.root.findAll((node) => node.type === 'a' && node.props.href?.startsWith('tel:'));
  assert.equal(links.length, 3, 'Desktop CTA, owner card and mobile action must share authorized contact');
  assert.ok(links.every((node) => node.props.href === `tel:${PHONE}`), 'Denormalized listing owner.phone must never be used');
  for (const node of links) {
    await act(async () => { node.props.onClick({ preventDefault() {} }); });
  }
  assert.deepEqual(ctx.dialed, Array(3).fill(`tel:${PHONE}`));
  ctx.rpc = async () => ({ data: { status: 'hidden' }, error: null });
  await act(async () => { links[0].props.onClick({ preventDefault() {} }); });
  assert.equal(ctx.dialed.length, 3);
  assert.equal(renderer.root.findAll((node) => node.type === 'a' && node.props.href?.startsWith('tel:')).length, 0);
  assert.ok(ctx.toasts.some((item) => String(item.args[0]).includes('Potvrda zamene')));
  await act(async () => renderer.unmount());
});

test('actual messages desktop and mobile call controls resolve contact for the active conversation', async () => {
  const { ctx, load } = harness({
    '@/hooks/use-messages': {
      useMessages: () => ({ conversations: [{ id: CONVERSATION, carId: CAR_B, carTitle: 'Audi A4', carImage: 'b.jpg', ownerName: 'Owner B', ownerPhone: '+381669999999', tradeSummary: 'Razlika 500 €', messages: [], unread: 0, lastUpdated: Date.now(), isBuyer: true }],
        sendMessage: async () => true, markRead: async () => {}, deleteConversation: async () => true, totalUnread: 0, mounted: true }),
    },
    '@/components/SignedOut': { SignedOutPage: () => null },
  });
  ctx.rpc = async () => ({ data: { status: 'available', phone: PHONE }, error: null });
  const MessagesClient = load('@/app/messages/MessagesClient').default;
  let renderer;
  await act(async () => { renderer = create(React.createElement(MessagesClient)); });
  const conversationButton = renderer.root.findAll((node) => node.type === 'button' && node.props['aria-pressed'] === false)[0];
  await act(async () => conversationButton.props.onClick());
  const links = renderer.root.findAll((node) => node.type === 'a' && node.props.href?.startsWith('tel:'));
  assert.equal(links.length, 2, 'Both responsive thread branches must use the same resolved phone');
  assert.ok(links.every((node) => node.props.href === `tel:${PHONE}`));
  assert.deepEqual(ctx.rpcCalls.at(-1), { name: 'get_conversation_contact', args: { p_conversation_id: CONVERSATION } });
  ctx.rpc = async () => ({ data: { status: 'hidden' }, error: null });
  await act(async () => { links[1].props.onClick({ preventDefault() {} }); });
  assert.deepEqual(ctx.dialed, []);
  assert.equal(renderer.root.findAll((node) => node.type === 'a' && node.props.href?.startsWith('tel:')).length, 0);
  assert.equal(renderer.root.findAll((node) => node.props.role === 'status' && String(node.props.children).includes('Potvrda zamene')).length, 2);
  await act(async () => renderer.unmount());
});

let failed = 0;
for (const { name, run } of tests) {
  try { await run(); console.log(`PASS ${name}`); }
  catch (error) { failed += 1; console.error(`FAIL ${name}\n${error.stack}`); }
}
console.log(`${tests.length - failed}/${tests.length} client regression tests passed (actual TypeScript modules + React renderer; no browser visual assertions).`);
if (failed) process.exitCode = 1;

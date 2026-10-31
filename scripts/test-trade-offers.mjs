// Integration tests use an isolated PostgreSQL WASM database, NEVER Supabase
// credentials. Connections are serialized; production uniqueness uses an index and advisory lock.
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { startTestDb } from "./test-offer-runtime.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const runtime = process.argv[process.argv.indexOf("--runtime-directory") + 1];
if (!process.argv.includes("--runtime-directory") || !runtime)
  throw new Error("Pass --runtime-directory <isolated test runtime folder>.");
const db = await startTestDb(runtime);
assert.ok(
  ["127.0.0.1", "localhost"].includes(new URL(db.connectionString).hostname),
  "Tests must use the disposable localhost cluster.",
);
const admin = new db.Client({ connectionString: db.connectionString });
await admin.connect();
const passed = [];
const uuid = (group, number) =>
  `${group}0000000-0000-4000-8000-${String(number).padStart(12, "0")}`;
const A = uuid("0", 1),
  B = uuid("0", 2),
  C = uuid("0", 3);
const a = [1, 2, 3].map((n) => uuid("1", n));
const b = [1, 2, 3].map((n) => uuid("2", n));
const c = [1, 2, 3].map((n) => uuid("3", n));
const old = [1, 2, 3, 4, 5, 6, 7].map((n) => uuid("4", n));

async function asUser(user, sql, values = [], role = "authenticated") {
  const client = new db.Client({ connectionString: db.connectionString });
  await client.connect();
  try {
    await client.query("begin");
    await client.query(
      `set local role ${role === "anon" ? "anon" : "authenticated"}`,
    );
    await client.query("select set_config('request.jwt.claim.sub', $1, true)", [
      user ?? "",
    ]);
    const result = await client.query(sql, values);
    await client.query("commit");
    return result;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    await client.end();
  }
}
const one = (result) => result.rows[0]?.result;
const offer = (user, target, offered, message = "") =>
  asUser(user, "select public.send_trade_offer($1,$2,$3) as result", [
    target,
    offered,
    message,
  ]).then(one);
const swipe = (user, target, offered) =>
  asUser(user, "select public.swipe_car($1,$2,true) as result", [
    target,
    offered,
  ]).then(one);
const contact = (user, car) =>
  asUser(user, "select public.get_listing_contact($1) as result", [car]).then(
    one,
  );
const chatContact = (user, id) =>
  asUser(user, "select public.get_conversation_contact($1) as result", [
    id,
  ]).then(one);
const archive = (user, id) =>
  asUser(user, "select public.archive_conversation($1) as result", [id]).then(
    one,
  );
async function check(name, run) {
  await run();
  passed.push(name);
  console.log(`PASS ${name}`);
}
const denied = (run, code = "42501") =>
  assert.rejects(run, (error) => error.code === code);

try {
  await admin.query(`
    create role anon nologin; create role authenticated nologin; create role supabase_auth_admin nologin;
    create schema auth; create schema storage;
    grant usage on schema public, auth to anon, authenticated;
    create table auth.users(id uuid primary key, email text, raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as
      $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);
    alter table storage.objects enable row level security;
    create function storage.foldername(text) returns text[] language sql immutable as
      $$ select string_to_array(regexp_replace($1,'/[^/]*$',''),'/') $$;
  `);
  const migrations = (await readdir(join(root, "supabase/migrations")))
    .filter((name) => name.endsWith(".sql"))
    .sort();
  for (const name of migrations) {
    await admin.query("begin");
    try {
      await admin.query(
        await readFile(join(root, "supabase/migrations", name), "utf8"),
      );
      await admin.query("commit");
    } catch (error) {
      await admin.query("rollback");
      throw new Error(`Baseline ${name}: ${error.message}`);
    }
  }
  // Match the live database's nullable phone column, without copying user data.
  await admin.query(
    "alter table public.profiles alter column phone drop not null",
  );
  for (const [id, name] of [
    [A, "Test A"],
    [B, "Test B"],
    [C, "Test C"],
  ]) {
    await admin.query(
      "insert into auth.users(id,email,raw_user_meta_data) values($1,$2,$3)",
      [id, `${name.replace(" ", "")}@example.invalid`, { name }],
    );
  }
  await admin.query("update public.profiles set phone=$1 where id=$2", [
    " 00381 (64) 123-4567 ",
    A,
  ]);
  await admin.query("update public.profiles set phone=$1 where id=$2", [
    "+381 65 765 4321",
    B,
  ]);
  for (const [owner, ids, name] of [
    [A, a, "Alpha"],
    [B, b, "Beta"],
    [C, c, "Gamma"],
  ]) {
    for (let n = 0; n < ids.length; n++) {
      await admin.query(
        `insert into public.cars(id,user_id,brand,model,year,body_type,city,image,images,specs,price,owner_name)
        values($1,$2,'Test',$3,2020,'Sedan','Beograd','/test.jpg',array['/test.jpg'],'{"fuelType":"Diesel","transmission":"Manual"}',5000,$4)`,
        [ids[n], owner, `${name}${n + 1}`, name],
      );
    }
  }

  const createOffer = (user, target, offered, note = "") =>
    asUser(user, "select public.create_trade_offer($1,$2,$3) as result", [
      target,
      offered,
      note,
    ]).then(one);
  const action = (user, id, kind) =>
    asUser(user, "select public.update_trade_offer($1,$2) as result", [
      id,
      kind,
    ]).then(one);
  const openChat = (user, id) =>
    asUser(user, "select public.open_offer_conversation($1) as result", [
      id,
    ]).then(one);
  let primary, thread;
  await check(
    "offer stores the exact pair and note without creating messages or conversations",
    async () => {
      primary = await createOffer(A, b[0], a[0], "Test note");
      assert.equal(primary.already_exists, false);
      const row = (
        await admin.query("select * from public.trade_offers where id=$1", [
          primary.offer_id,
        ])
      ).rows[0];
      assert.equal(row.sender_id, A);
      assert.equal(row.recipient_id, B);
      assert.equal(row.note, "Test note");
      assert.equal(row.offered_car_id, a[0]);
      assert.equal(row.target_car_id, b[0]);
      assert.ok(!JSON.stringify(row.offered_car).includes("phone"));
      assert.equal(
        (await admin.query("select count(*)::int n from public.messages"))
          .rows[0].n,
        0,
      );
      assert.equal(
        (await admin.query("select count(*)::int n from public.conversations"))
          .rows[0].n,
        0,
      );
    },
  );
  await check(
    "participants can read offers and outsider/anonymous cannot",
    async () => {
      for (const user of [A, B])
        assert.equal(
          (await asUser(user, "select id from public.trade_offers")).rowCount,
          1,
        );
      assert.equal(
        (await asUser(C, "select id from public.trade_offers")).rowCount,
        0,
      );
      await denied(
        asUser(null, "select id from public.trade_offers", [], "anon"),
      );
      await denied(
        asUser(C, "select public.open_offer_conversation($1)", [
          primary.offer_id,
        ]),
      );
    },
  );
  await check(
    "anonymous, own listing and someone else's offered car are rejected",
    async () => {
      await denied(
        asUser(
          null,
          "select public.create_trade_offer($1,$2,$3)",
          [b[0], a[0], ""],
          "anon",
        ),
      );
      await denied(createOffer(A, b[0], c[0]));
      await denied(createOffer(A, a[1], a[0]), "22023");
      await denied(createOffer(A, b[0], a[0], "x".repeat(501)), "22023");
    },
  );
  await check(
    "duplicate and reverse offers share one pending pair",
    async () => {
      const results = await Promise.all([
        createOffer(A, b[0], a[0]),
        createOffer(B, a[0], b[0]),
        createOffer(A, b[0], a[0]),
      ]);
      for (const r of results) {
        assert.equal(r.offer_id, primary.offer_id);
        assert.equal(r.already_exists, true);
      }
      assert.equal(
        (await admin.query("select count(*)::int n from public.trade_offers"))
          .rows[0].n,
        1,
      );
    },
  );
  await check(
    "clients cannot alter ownership, note, status or read receipts directly",
    async () => {
      await denied(
        asUser(
          A,
          "update public.trade_offers set status='declined' where id=$1",
          [primary.offer_id],
        ),
      );
      await denied(
        asUser(
          A,
          "insert into public.trade_offers(sender_id,recipient_id,offered_car,target_car,sender_name,recipient_name) values($1,$2,'{}','{}','x','y')",
          [A, B],
        ),
      );
      await denied(action(A, primary.offer_id, "decline"), "22023");
      await denied(action(B, primary.offer_id, "withdraw"), "22023");
      await denied(action(C, primary.offer_id, "read"));
    },
  );
  await check("only recipient marks incoming offer read", async () => {
    await denied(action(A, primary.offer_id, "read"), "22023");
    assert.equal(await action(B, primary.offer_id, "read"), true);
    assert.ok(
      (
        await admin.query(
          "select recipient_read_at from public.trade_offers where id=$1",
          [primary.offer_id],
        )
      ).rows[0].recipient_read_at,
    );
  });
  await check(
    "either participant opens the same conversation without a fake first message",
    async () => {
      thread = await openChat(B, primary.offer_id);
      assert.equal(await openChat(A, primary.offer_id), thread);
      assert.equal(
        (await admin.query("select count(*)::int n from public.messages"))
          .rows[0].n,
        0,
      );
      assert.equal(
        (
          await admin.query(
            "select conversation_id from public.trade_offers where id=$1",
            [primary.offer_id],
          )
        ).rows[0].conversation_id,
        thread,
      );
      await asUser(
        B,
        "insert into public.messages(conversation_id,sender_id,body) values($1,$2,$3)",
        [thread, B, "Can we arrange a viewing?"],
      );
      assert.equal(
        (
          await asUser(
            A,
            "select body from public.messages where conversation_id=$1",
            [thread],
          )
        ).rows[0].body,
        "Can we arrange a viewing?",
      );
      assert.equal(
        (
          await asUser(
            C,
            "select body from public.messages where conversation_id=$1",
            [thread],
          )
        ).rowCount,
        0,
      );
    },
  );
  await check(
    "direct message reuses pair thread and creates no offer",
    async () => {
      const before = (
        await admin.query("select count(*)::int n from public.trade_offers")
      ).rows[0].n;
      assert.equal(
        one(
          await asUser(
            A,
            "select public.open_listing_conversation($1,$2) as result",
            [b[0], a[0]],
          ),
        ),
        thread,
      );
      const direct = one(
        await asUser(
          C,
          "select public.open_listing_conversation($1) as result",
          [b[0]],
        ),
      );
      assert.equal(
        one(
          await asUser(
            C,
            "select public.open_listing_conversation($1) as result",
            [b[0]],
          ),
        ),
        direct,
      );
      assert.equal(
        (await admin.query("select count(*)::int n from public.trade_offers"))
          .rows[0].n,
        before,
      );
    },
  );
  await check(
    "archived pair reopens from offer without duplicate conversation",
    async () => {
      await archive(A, thread);
      await archive(B, thread);
      assert.equal(await openChat(A, primary.offer_id), thread);
      const row = (
        await admin.query(
          "select buyer_archived,seller_archived from public.conversations where id=$1",
          [thread],
        )
      ).rows[0];
      assert.equal(row.buyer_archived, false);
      assert.equal(row.seller_archived, false);
    },
  );
  await check(
    "withdrawal is sender-only, preserves messages and permits a new offer",
    async () => {
      assert.equal(await action(A, primary.offer_id, "withdraw"), true);
      await denied(openChat(B, primary.offer_id), "22023");
      const next = await createOffer(A, b[0], a[0]);
      assert.notEqual(next.offer_id, primary.offer_id);
      assert.equal(
        (
          await admin.query(
            "select count(*)::int n from public.messages where conversation_id=$1",
            [thread],
          )
        ).rows[0].n,
        1,
      );
      assert.equal(await action(B, next.offer_id, "decline"), true);
      await denied(action(B, next.offer_id, "decline"), "22023");
    },
  );
  await check(
    "deleted vehicle preserves snapshot but prevents opening an obsolete offer",
    async () => {
      const removed = await createOffer(A, b[1], a[1]);
      await asUser(A, "delete from public.cars where id=$1", [a[1]]);
      const row = (
        await admin.query("select * from public.trade_offers where id=$1", [
          removed.offer_id,
        ])
      ).rows[0];
      assert.equal(row.offered_car_id, null);
      assert.equal(row.offered_car.model, "Alpha2");
      await denied(openChat(B, removed.offer_id), "22023");
    },
  );
  await check(
    "mutual likes remain separate and reuse the pair conversation",
    async () => {
      await swipe(A, b[0], a[0]);
      const matched = await swipe(B, a[0], b[0]);
      assert.equal(matched.conversation_id, thread);
      assert.equal(
        (
          await admin.query(
            "select count(*)::int n from public.messages where kind='match' and conversation_id=$1",
            [thread],
          )
        ).rows[0].n,
        1,
      );
    },
  );
  console.log(`\n${passed.length} trade offer integration checks passed.`);
} finally {
  await admin.end();
  await db.close();
}

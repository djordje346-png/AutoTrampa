// Integration tests use a disposable native PostgreSQL cluster, NEVER Supabase
// credentials. See docs/contact-conversation-fixes.md for the local runtime.
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { startTestDb } from './test-runtime.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const runtime = process.argv[process.argv.indexOf('--runtime-directory') + 1];
if (!process.argv.includes('--runtime-directory') || !runtime) throw new Error('Pass --runtime-directory <isolated test runtime folder>.');
const db = await startTestDb(runtime);
assert.ok(['127.0.0.1', 'localhost'].includes(new URL(db.connectionString).hostname), 'Tests must use the disposable localhost cluster.');
const admin = new db.Client({ connectionString: db.connectionString });
await admin.connect();
const passed = [];
const uuid = (group, number) => `${group}0000000-0000-4000-8000-${String(number).padStart(12, '0')}`;
const A = uuid('0', 1), B = uuid('0', 2), C = uuid('0', 3);
const a = [1, 2, 3].map(n => uuid('1', n));
const b = [1, 2, 3].map(n => uuid('2', n));
const c = [1, 2, 3].map(n => uuid('3', n));
const old = [1, 2, 3, 4, 5, 6, 7].map(n => uuid('4', n));

async function asUser(user, sql, values = [], role = 'authenticated') {
  const client = new db.Client({ connectionString: db.connectionString });
  await client.connect();
  try {
    await client.query('begin');
    await client.query(`set local role ${role === 'anon' ? 'anon' : 'authenticated'}`);
    await client.query("select set_config('request.jwt.claim.sub', $1, true)", [user ?? '']);
    const result = await client.query(sql, values);
    await client.query('commit');
    return result;
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally { await client.end(); }
}
const one = result => result.rows[0]?.result;
const offer = (user, target, offered, message = '') => asUser(user, 'select public.send_trade_offer($1,$2,$3) as result', [target, offered, message]).then(one);
const swipe = (user, target, offered) => asUser(user, 'select public.swipe_car($1,$2,true) as result', [target, offered]).then(one);
const contact = (user, car) => asUser(user, 'select public.get_listing_contact($1) as result', [car]).then(one);
const chatContact = (user, id) => asUser(user, 'select public.get_conversation_contact($1) as result', [id]).then(one);
const archive = (user, id) => asUser(user, 'select public.archive_conversation($1) as result', [id]).then(one);
async function check(name, run) { await run(); passed.push(name); console.log(`PASS ${name}`); }
const denied = (run, code = '42501') => assert.rejects(run, error => error.code === code);

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
  const migrations = (await readdir(join(root, 'supabase/migrations'))).filter(name => name.endsWith('.sql')).sort();
  for (const name of migrations.filter(name => name < '20261024091050')) {
    await admin.query('begin');
    try { await admin.query(await readFile(join(root, 'supabase/migrations', name), 'utf8')); await admin.query('commit'); }
    catch (error) { await admin.query('rollback'); throw new Error(`Baseline ${name}: ${error.message}`); }
  }
  // Match the live database's nullable phone column, without copying user data.
  await admin.query('alter table public.profiles alter column phone drop not null');
  for (const [id, name] of [[A, 'Test A'], [B, 'Test B'], [C, 'Test C']]) {
    await admin.query('insert into auth.users(id,email,raw_user_meta_data) values($1,$2,$3)', [id, `${name.replace(' ', '')}@example.invalid`, { name }]);
  }
  await admin.query('update public.profiles set phone=$1 where id=$2', [' 00381 (64) 123-4567 ', A]);
  await admin.query('update public.profiles set phone=$1 where id=$2', ['+381 65 765 4321', B]);
  for (const [owner, ids, name] of [[A,a,'Alpha'], [B,b,'Beta'], [C,c,'Gamma']]) {
    for (let n = 0; n < ids.length; n++) {
      await admin.query(`insert into public.cars(id,user_id,brand,model,year,body_type,city,image,images,specs,price,owner_name)
        values($1,$2,'Test',$3,2020,'Sedan','Beograd','/test.jpg',array['/test.jpg'],'{"fuelType":"Diesel","transmission":"Manual"}',5000,$4)`,
      [ids[n],owner,`${name}${n+1}`,name]);
    }
  }
  await check('pristine schema upgrade creates nullable legacy pair and private phone default', async () => {
    await admin.query('begin');
    try {
      for (const name of migrations.filter(name => name.startsWith('20261024091050') || name.startsWith('20261024091121'))) {
        await admin.query(await readFile(join(root,'supabase/migrations',name),'utf8'));
      }
      assert.equal((await admin.query("select count(*)::int n from pg_constraint where conrelid='public.conversations'::regclass and conname='conversations_offered_car_id_fkey'")).rows[0].n,1);
      assert.equal((await admin.query('select bool_and(phone_after_match) as private from public.profiles')).rows[0].private,true);
    } finally { await admin.query('rollback'); }
  });
  // Synthetic known reverse duplicates exercise the cautious merge path. The
  // production audit currently has no two independently proven duplicates.
  await admin.query('alter table public.conversations add column offered_car_id uuid references public.cars(id) on delete set null');
  const fixtures = [
    [old[0],b[0],A,B,a[0]], [old[1],a[0],B,A,b[0]],
    [old[2],b[1],A,B,null], [old[3],a[1],B,A,null],
    [old[4],b[2],A,B,null], [old[5],b[0],C,B,null], [old[6],a[1],C,A,null],
  ];
  for (let n = 0; n < fixtures.length; n++) {
    await admin.query(`insert into public.conversations(id,car_id,buyer_id,seller_id,offered_car_id,buyer_name,trade_summary,created_at)
      values($1,$2,$3,$4,$5,'Test','Legacy', $6)`, [...fixtures[n], `2026-01-${String(n+1).padStart(2,'0')}T00:00:00Z`]);
    await admin.query(`insert into public.messages(id,conversation_id,sender_id,body,created_at,read_at)
      values($1,$2,$3,$4,$5,$6)`, [uuid('5',n+1),fixtures[n][0],fixtures[n][2],`Preserved message ${n+1}`,
      `2026-02-${String(n+1).padStart(2,'0')}T00:00:00Z`, n%2 ? '2026-03-01T00:00:00Z' : null]);
  }
  await admin.query('update public.conversations set buyer_archived=true,seller_archived=true where id=$1', [old[0]]);
  await admin.query('update public.conversations set buyer_archived=true,seller_archived=false where id=$1', [old[1]]);
  for (const values of [[A,B,a[0],b[0],old[1]], [A,B,a[2],b[2],old[4]],
    [B,C,b[0],c[0],old[5]], [B,C,b[0],c[1],old[5]], [A,C,a[0],c[2],old[6]]]) {
    await admin.query('insert into public.matches(user_a_id,user_b_id,car_a_id,car_b_id,conversation_id) values($1,$2,$3,$4,$5)', values);
  }
  const originalMessages = (await admin.query('select id,sender_id,body,created_at,read_at from public.messages order by id')).rows;
  const originalCount = originalMessages.length;
  for (const name of migrations.filter(name => name.startsWith('20261024091050') || name.startsWith('20261024091121'))) {
    await admin.query('begin');
    try { await admin.query(await readFile(join(root,'supabase/migrations',name),'utf8')); await admin.query('commit'); }
    catch (error) { await admin.query('rollback'); throw new Error(`New migration ${name}: ${error.message}`); }
  }

  await check('migration preserves all message fields and participant archive/read state', async () => {
    assert.deepEqual((await admin.query('select id,sender_id,body,created_at,read_at from public.messages order by id')).rows, originalMessages);
    const kept = (await admin.query('select buyer_id,seller_id,buyer_archived,seller_archived from public.conversations where id=$1',[old[0]])).rows[0];
    assert.deepEqual(kept,{buyer_id:A,seller_id:B,buyer_archived:false,seller_archived:true});
    assert.equal((await admin.query('select count(*)::int as n from autotrampa_private.conversation_merge_audit')).rows[0].n,2);
    assert.equal((await admin.query('select conversation_id from public.matches where car_a_id=$1 and car_b_id=$2',[a[0],b[0]])).rows[0].conversation_id,old[0]);
  });
  await check('unknown, ambiguous and mismatched legacy pairs stay separate', async () => {
    const unknown = (await admin.query('select id,offered_car_id,car_pair_low from public.conversations where id=any($1::uuid[]) order by id',[[old[2],old[3],old[5],old[6]]])).rows;
    assert.equal(unknown.length,4); assert.ok(unknown.every(row=>row.offered_car_id===null && row.car_pair_low===null));
    assert.equal((await admin.query('select offered_car_id from public.conversations where id=$1',[old[4]])).rows[0].offered_car_id,a[2]);
  });
  let primary;
  await check('A to B, B to A and repeat offers append into one existing pair', async () => {
    primary=(await offer(A,b[0],a[0],'Offer A')).conversation_id;
    assert.equal(primary,old[0]);
    assert.equal((await offer(B,a[0],b[0],'Offer B')).conversation_id,primary);
    assert.equal((await offer(A,b[0],a[0],'Offer A again')).conversation_id,primary);
    assert.equal((await admin.query('select count(*)::int n from public.messages where conversation_id=$1',[primary])).rows[0].n,5);
  });
  await check('same users can have distinct conversations for distinct car pairs', async () => {
    const ids = [(await offer(A,b[0],a[1])).conversation_id,(await offer(A,b[1],a[1])).conversation_id,(await offer(A,b[1],a[0])).conversation_id];
    assert.equal(new Set([primary,...ids]).size,4);
    assert.ok(!ids.includes(old[2]),'Unknown legacy conversation must not be guessed into this pair.');
  });
  await check('six real concurrent reverse requests create one pair and six messages', async () => {
    const ids=await Promise.all(Array.from({length:6},(_,n)=>n%2?offer(B,a[1],b[2],`Race ${n}`):offer(A,b[2],a[1],`Race ${n}`)));
    assert.equal(new Set(ids.map(row=>row.conversation_id)).size,1);
    assert.equal((await admin.query('select count(*)::int n from public.messages where conversation_id=$1',[ids[0].conversation_id])).rows[0].n,6);
  });
  await check('manual first then mutual match reuses pair and emits match once', async () => {
    const id=(await offer(A,b[1],a[2])).conversation_id;
    assert.equal((await swipe(A,b[1],a[2])).matched,false);
    const matched=await swipe(B,a[2],b[1]); assert.equal(matched.conversation_id,id); assert.equal(matched.new_match,true);
    assert.equal((await swipe(A,b[1],a[2])).new_match,false);
    assert.equal((await offer(B,a[2],b[1])).conversation_id,id);
    assert.equal((await admin.query("select count(*)::int n from public.messages where conversation_id=$1 and kind='match'",[id])).rows[0].n,1);
  });
  await check('concurrent mutual likes first then manual offers share the same pair', async () => {
    const result=await Promise.all([swipe(A,b[0],a[2]),swipe(B,a[2],b[0])]);
    const match=result.find(row=>row.matched); assert.ok(match);
    assert.equal((await offer(A,b[0],a[2])).conversation_id,match.conversation_id);
    assert.equal((await offer(B,a[2],b[0])).conversation_id,match.conversation_id);
  });
  await check('archive is per participant; reoffer reopens both without duplication', async () => {
    assert.equal(await archive(A,primary),true); assert.equal(await archive(B,primary),true);
    assert.equal((await asUser(A,'select id from public.conversations where id=$1',[primary])).rowCount,0);
    assert.equal((await asUser(B,'select id from public.conversations where id=$1',[primary])).rowCount,0);
    assert.equal(await archive(C,primary),false);
    assert.equal((await offer(B,a[0],b[0],'Reopen')).conversation_id,primary);
    assert.equal((await asUser(A,'select id from public.conversations where id=$1',[primary])).rowCount,1);
    assert.equal((await asUser(B,'select id from public.conversations where id=$1',[primary])).rowCount,1);
    await archive(A,primary);
    await asUser(B,'insert into public.messages(conversation_id,sender_id,body) values($1,$2,$3)',[primary,B,'Direct reply after other side archived']);
    assert.equal((await asUser(A,'select id from public.conversations where id=$1',[primary])).rowCount,1);
  });
  await check('ownership, authentication and direct-write permissions reject spoofing', async () => {
    await denied(()=>offer(C,b[0],a[0]));
    await denied(()=>offer(A,a[1],a[0]),'22023');
    await denied(()=>offer(A,uuid('9',999),a[0]),'P0002');
    await denied(()=>offer(null,b[0],a[0]));
    await denied(()=>asUser(A,'insert into public.conversations(car_id,offered_car_id,buyer_id,seller_id) values($1,$2,$3,$4)',[b[0],a[0],A,B]));
    await denied(()=>asUser(A,'update public.conversations set seller_archived=true where id=$1',[primary]));
    await denied(()=>asUser(C,'insert into public.messages(conversation_id,sender_id,body) values($1,$2,$3)',[primary,C,'Outsider']));
    await denied(()=>asUser(A,"insert into public.messages(conversation_id,sender_id,kind,body) values($1,$2,'match','Fake match')",[primary,A]));
    await denied(()=>offer(A,b[0],a[0],'x'.repeat(1001)),'22023');
  });
  await check('unique index rejects a duplicate pair even through an administrative insert', async () => {
    await denied(()=>admin.query('insert into public.conversations(car_id,offered_car_id,buyer_id,seller_id) values($1,$2,$3,$4)',[a[0],b[0],B,A]),'23505');
  });
  await check('recipient read_at survives merging and sender cannot mark own message read', async () => {
    const unread=uuid('5',1);
    assert.equal((await asUser(A,'update public.messages set read_at=now() where id=$1',[unread])).rowCount,0);
    assert.equal((await asUser(B,'update public.messages set read_at=now() where id=$1',[unread])).rowCount,1);
    assert.ok((await admin.query('select read_at from public.messages where id=$1',[unread])).rows[0].read_at);
    assert.ok((await admin.query('select read_at from public.messages where id=$1',[uuid('5',2)])).rows[0].read_at);
  });
  await check('phone private by default including existing mutual matches', async () => {
    assert.deepEqual(await contact(B,a[0]),{status:'hidden'});
    assert.deepEqual(await chatContact(B,primary),{status:'hidden'});
    assert.equal((await contact(A,a[0])).phone,'+381641234567');
    assert.equal((await asUser(B,'select phone from public.profiles where id=$1',[A])).rowCount,0);
    await denied(()=>asUser(null,'select public.get_listing_contact($1)',[a[0]],'anon'));
    await denied(()=>contact(null,a[0]));
    assert.deepEqual(await chatContact(C,primary),{status:'not_found'});
  });
  await check('only explicit owner opt-out reveals normalized phone and persists on a new connection', async () => {
    assert.equal((await asUser(B,'update public.profiles set phone_after_match=false where id=$1',[A])).rowCount,0);
    await asUser(A,'update public.profiles set phone_after_match=false where id=$1',[A]);
    assert.deepEqual(await contact(B,a[0]),{status:'available',phone:'+381641234567'});
    assert.deepEqual(await chatContact(B,primary),{status:'available',phone:'+381641234567'});
    assert.equal((await asUser(A,'select phone_after_match from public.profiles where id=$1',[A])).rows[0].phone_after_match,false);
    await denied(()=>asUser(A,'update public.profiles set verified=true where id=$1',[A]));
    await asUser(A,'update public.profiles set phone_after_match=true where id=$1',[A]);
    assert.deepEqual(await contact(B,a[0]),{status:'hidden'});
  });
  await check('invalid, missing and absent listing phone responses never contain phone', async () => {
    await asUser(A,'update public.profiles set phone_after_match=false,phone=$2 where id=$1',[A,'not-a-phone']);
    assert.deepEqual(await contact(B,a[0]),{status:'missing'});
    await asUser(A,'update public.profiles set phone=$2 where id=$1',[A,null]);
    assert.deepEqual(await contact(B,a[0]),{status:'missing'});
    assert.deepEqual(await contact(B,uuid('9',999)),{status:'not_found'});
    await asUser(A,'update public.profiles set phone=$2 where id=$1',[A,'\t00381 (64) 123-4567\n']);
    assert.deepEqual(await contact(B,a[0]),{status:'available',phone:'+381641234567'});
  });
  console.log(JSON.stringify({passed:passed.length,originalMessagesPreserved:originalCount,postgres:17,productionTouched:false}));
} finally {
  await admin.end();
  await db.close();
}

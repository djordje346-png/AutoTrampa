# Phone visibility and vehicle-pair conversations

Status: user approved production release on 24 October 2026. Both migrations
were applied successfully, using the exact versions in the filenames below.
Frontend publication follows the verified database changes.

## Findings

- Public listing projections deliberately set `owner.phone` to an empty string.
  `CarDetail` used that projection for its call links; messages did the same.
  Reading all profiles publicly would bypass the intended privacy boundary.
- `phoneAfterMatch` was stored only in browser preferences. Other accounts and
  the database could not enforce it.
- A `matches` row means reciprocal likes. There is no accepted/confirmed exchange
  status. It is therefore insufficient authorization to disclose a private phone.
- Manual conversation identity used only `(car_id, buyer_id, seller_id)` and did
  not store the offered car. Reverse offers created different threads; multiple
  offered vehicles could incorrectly share a thread. Match creation used yet
  another orientation of those fields.
- Archive SELECT policies hide an actor's archived rows from client lookups.
  A new-message trigger tried to reopen both sides, while another trigger forbade
  changing the other participant's archive flag. Those rules conflicted.

## Migrations, in order

1. `20261024091050_secure_profile_phone_visibility.sql`
   - Adds private `profiles.phone_after_match`, default `true`, with an own-row
     update grant and the existing profiles RLS.
   - Never imports an old browser-local opt-out. Explicit account-level saving
     is required before other signed-in users can obtain a phone.
   - Adds targeted `get_listing_contact(car_id)` and
     `get_conversation_contact(conversation_id)` RPCs. Public wrappers are
     SECURITY INVOKER; privileged reads are in the non-exposed private schema.
   - Resolves the owner server-side, validates the authenticated caller/resource,
     checks owner privacy and only then returns a valid normalized phone.
   - Does not grant public profile reads or include phones in public car rows.
   - While confirmation is unsupported, `true` always keeps the phone hidden
     from other accounts, including mutual matches. The UI explains this.
2. `20261024091121_canonical_vehicle_pair_conversations.sql`
   - Stores the original offered car and generated lower/higher UUID pair keys.
     A database unique index makes direction irrelevant.
   - Both `send_trade_offer` and `swipe_car` use the same server helper and lock
     order. Ownership is validated server-side. Conversation/message creation
     is atomic; a repeat offer appends a message.
   - Replaces direct client conversation writes with validated RPCs. Archive
     stays per participant; a new message reopens both participants.
   - Backfills only an unambiguous match-backed pair with consistent owners and
     participants. Does not infer a vehicle from current garage contents or text.
   - Merges only fully known equal pairs with the same participants. Message IDs,
     sender, body, created time and `read_at` remain unchanged. Match references
     move to the survivor. Archive state is translated by participant identity:
     a user keeps access if any previous copy was active for that user.
   - Saves original conversation metadata in the private, RLS-protected
     `conversation_merge_audit`, with no frontend grants.

The old `car_id` remains the initial target and buyer/seller keep their original
roles; a reverse offer does not swap them. The messages UI chooses the other
participant's car for either side.

## Read-only production preflight (23 October 2026)

Observed: 3 conversations, 7 messages, 1 conversation with exactly one match-backed
pair, 2 without a provable offered vehicle, 0 with multiple match-backed pairs.
Neither migration column exists in production. No production rows were changed.

The two unknown threads must stay separate. They can be archived normally; any
manual consolidation requires reliable confirmation of the original offered car.
Do not guess it from the only car currently in someone's garage.

Run a fresh audit immediately before approved migration; production may have changed:

```sql
with pairs as (
  select conversation_id,
    count(distinct (least(car_a_id, car_b_id), greatest(car_a_id, car_b_id))) as pair_count
  from public.matches group by conversation_id
)
select c.id, c.car_id, c.buyer_id, c.seller_id,
  coalesce(p.pair_count, 0) as recorded_pairs,
  c.buyer_archived, c.seller_archived
from public.conversations c left join pairs p on p.conversation_id = c.id
order by c.created_at, c.id;
```

Known existing limitations are preserved: `read_at` is a shared field for system
match announcements, so historical per-user system-message receipts cannot be
reconstructed. Existing target-car deletion still cascades conversation deletion;
offered-car deletion clears that display reference. Durable history after deleting
a vehicle would require a separate change to deletion semantics and ID snapshots.

## Repeatable local tests

The test scripts create only disposable PostgreSQL on loopback with synthetic
users, vehicles and phone numbers. They accept no production connection string.
Application dependencies and its lockfile are unchanged. On Windows:

```powershell
$testRuntime = Join-Path $env:TEMP 'AutoTrampa-db-tests'
New-Item -ItemType Directory -Force -Path $testRuntime
npm install --prefix $testRuntime --save-exact embedded-postgres@17.10.0-beta.17 react@18.2.0 react-test-renderer@18.2.0
node scripts/test-contact-conversations.mjs --runtime-directory $testRuntime
node scripts/test-contact-clients.mjs --runtime-directory $testRuntime
npm run typecheck
npm run lint
npm run build
```

`test-runtime.mjs` uses a random port/password and a separate cluster directory.
It stops its own instance on completion and registers an exit cleanup fallback.
The test data is retained locally for inspection; no service or OS user is installed.

The database suite covers pristine migration, cautious legacy handling and message
preservation, both offer directions, different car pairs for the same users,
six actual concurrent reverse requests, manual/match ordering, archive/reopen,
unique-index enforcement, ownership/RLS/column grants, read timestamps, private
defaults, explicit preference persistence, normalization and denied contact access.

Client tests use the actual TypeScript modules and React renderer with controlled
Auth/RPC boundaries. They do not constitute a browser-to-production Supabase test.
That final network check must follow approved migrations in a test environment or
the coordinated release.

## Verification results (24 October 2026)

- 15/15 database regression groups passed against isolated PostgreSQL 17,
  including six concurrent reverse offers and preservation of seven fixture messages.
- 13/13 client regression groups passed using actual TypeScript modules and
  React renderer, including desktop/mobile contact branches, revoked access,
  account-switch races, profile reload and Supabase preference failures.
- `npm run typecheck`, `npm run lint`, `npm run build` and `git diff --check` passed.
  Build retains dependency warnings for outdated Browserslist data and Supabase
  Realtime dynamic dependency resolution. No application errors were reported.
- Production migrations were subsequently approved and applied. Authenticated
  database checks passed for preference persistence, phone privacy, reverse offers,
  archive and reopen in a transaction that rolled back every test write.
  All seven existing messages retained the same content checksum after migration.
  One legacy vehicle pair was backfilled; two unknown pairs remained untouched.
- Real browser layout and live Supabase end-to-end verification are still pending
  approved migration; renderer tests do not assert pixel layout or device dialer behavior.

## Release order after approval

Take a database backup, repeat the preflight, and apply both migrations atomically
per file. Then publish the matching frontend promptly and verify with two test
accounts. Cached old frontends need a refresh: direct conversation creation is now
intentionally rejected because old clients omit the offered vehicle.

Verify phone opt-out/opt-in across refresh and another session, both directions
of the same offer, a different pair, archive/reoffer and a mutual like. Confirm
desktop and mobile call controls use the same authorized result. If the migration
or runtime verification fails, do not promote the frontend.

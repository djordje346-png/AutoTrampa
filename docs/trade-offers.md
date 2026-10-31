# Standalone trade offers

Offers identify the two vehicles; the participants agree any cash difference in chat.

- The shared `TradeOfferSheet` selects an owned garage vehicle and an optional note.
- `create_trade_offer` stores an offer without creating a conversation or message.
- `/messages?tab=offers` contains received/sent offers, selection links, read receipts,
  sender withdrawal and recipient rejection. `/messages?conversation=<uuid>` opens chat.
- `open_offer_conversation` resolves the existing canonical vehicle-pair conversation,
  reopens it for its participants and links the offer. It never fabricates a first message.
- Listing details also expose a separate message action. It works without a garage vehicle
  through `open_listing_conversation`; it creates no trade offer.
- There is no accepted/confirmed trade state. A conversation is not a completed swap.
- Match records/messages remain stored. Their UI is an 'Obostrano interesovanje' label
  rather than a chat bubble. Existing unread activity behavior is preserved.

## Data and access

Migration `20261029203957_standalone_trade_offers.sql` matches the migration version
already applied to project `gkujjlflpdrahbdgpzoj`. It is additive: existing conversations,
messages and matches were not rewritten. New offers start empty in production.

`trade_offers` has participant-only SELECT RLS and no direct client write grants. The
private-schema functions validate identity, car ownership, participant membership,
status transitions and note length. Public wrappers run as security invoker. One pending
offer per unordered car pair is enforced with a unique partial index and an advisory lock.
Public-only vehicle snapshots preserve the context when a listing is deleted. There is
no snapshot of phone numbers, private valuation, or other private profile/car data.

Decline and withdrawal retain history and messages. Deleted vehicles make an offer
inactive. A new proposal can be sent after the previous one was declined or withdrawn.
Legacy send_trade_offer remains for old already-loaded clients; the current UI uses the
new separate offer RPC.

## Verification

```sh
npm run build
npm run lint
node scripts/test-trade-offers.mjs --runtime-directory /path/to/isolated-runtime
node scripts/test-contact-clients.mjs --runtime-directory /path/to/isolated-runtime
```

The external test runtime needs `@electric-sql/pglite`, React 18.2.0 and
react-test-renderer 18.2.0. It is not a production dependency. The 12 offer integration
checks exercise the real schema, RLS and PL/pgSQL in PostgreSQL WASM. Its connections are
serialized: this does not claim a multi-process production concurrency stress test.
The 15 client regressions exercise the real TypeScript modules and React components.

Browser verification used the real changed components against an isolated HTTP adapter
and the same PostgreSQL migrations, with synthetic accounts. It covered selecting a
vehicle, sending a note, sent/received views, withdrawal confirmation, chat linking,
mobile chat/send controls, match labels and light/dark themes. No test offers or messages
were sent to production users. The browser harness substitutes auth and transport adapters; production retains its
existing Supabase auth/client integration. Post-deployment smoke checks cover public
routes. No claim is made of logging into two real production accounts.

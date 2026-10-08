# AutoTrampa

Serbian-language mobile-first web app for **swapping cars** (trampa/zamena), not selling them.
The whole product revolves around the price gap between your car and someone else's:
`diff = other.price - myCar.price` → *Ravna zamena* (even), *Vlasnik doplaćuje X* (they add cash),
or *Tvoja doplata X* (you add cash). Feed, search and the listing page all filter and label on
that number, and it comes from one place: `lib/trade.ts`.

## Status: Supabase core connected

Supabase Auth (email/password), profiles, user-owned cars, public listings, saved cars,
conversations/messages and car-image Storage are live integrations. `NEXT_PUBLIC_SUPABASE_URL`
and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are
required at runtime; the client is lazy so static pages can still build without them. Never put a
service-role or secret key in a `NEXT_PUBLIC_*` variable. Demo listing saves and feed preferences
remain local state.

## Public vs. signed-in

Browsing is public and server-rendered: the feed, Pretraga, Sačuvano and every `/car/[id]` render
real HTML so listings can be shared and indexed (`app/sitemap.ts`, `app/robots.ts`). A listing page
resolves its car on the server, so a shared link carries that listing's own title and preview
image. Both depend on `NEXT_PUBLIC_SITE_URL` being set — without it the sitemap and every
`og:url`/canonical point at the fallback domain instead of the live one.

Sign-in is asked for at the moment an action needs an identity, never as a wall. `useAuth()`
exposes `requireAuth(reason)`: it returns true when the caller may proceed, otherwise it opens
`AuthOverlay` with that reason and returns false. Garaža, Poruke and Profil render `SignedOutPage`
instead of their content, and each of their page shells sets `robots: { index: false }` in
`metadata` (there are no per-route `layout.tsx` files).

Trade maths (the doplata label, the trade filters, the "best trade" sort) only appear when signed
in — without a car in the garage there is nothing to compare against. Signed-out visitors get a
CTA explaining what they are missing. Note these are gated on `authReady && isLoggedIn`, so the
server render is always the public variant.

New accounts start with an empty Supabase garage. `useGarage().selectedCar` is **null** in that
state — it deliberately does not fall back to the demo cars in `DEFAULT_GARAGE_CARS`. Those are
unreferenced seed data kept as a yardstick for realistic listings; using one as the comparison car
made every listing show a confident "Tvoja doplata 2.000 €" derived from a car the user does not
own. Consumers must guard instead: `tradeAware` in the feed, `showTrade` on Pretraga/Sačuvano, and
a "dodaj svoj auto" prompt where the comparison would have been.

## Stack

Next.js 13.5.1 App Router · React 18 · TypeScript strict · Tailwind + shadcn/ui (47 primitives in
`components/ui`, all unused except `sonner`) · lucide-react · sonner for toasts. Generated from the
bolt.new `nextjs-shadcn` template (`.bolt/`), deployed to **Vercel** (Next.js is auto-detected;
`netlify.toml` and `@netlify/plugin-nextjs` are leftovers from an earlier host).

Commands: `npm run dev` · `npm run build` · `npm run build:check` · `npm run typecheck` ·
`npm run lint`. No test suite. `build` runs `typecheck` first via `prebuild`, and
`next.config.js` no longer ignores ESLint during builds, so a type or lint error fails the deploy
instead of shipping.

## State: one store per concern

`lib/persistent-store.ts` is the spine. `createPersistentStore(key, initial, revive?)` returns a
module-level value plus a subscriber set; `usePersistentStore(store)` subscribes a component and
returns `[value, ready]`. Every screen that reads the same store sees the same value — that is the
point, because the app used to keep three separate copies of the saved-listing list.

Hydration rule: `get()` returns the SSR-safe `initial` until a mounted component calls `hydrate()`
from an effect, so the first client render always matches the server. Screens gate
localStorage-dependent UI on the `ready`/`mounted` flag.

| Hook | Key(s) | Holds |
|---|---|---|
| `use-auth` | Supabase Auth | email/password session; sign-in prompt uses `createMemoryStore` |
| `use-user` | Supabase `profiles` | current account profile; phone is private by RLS |
| `use-garage` | Supabase `cars`, `autotrampa_selected_car` | own cars + selected car; RLS and a database trigger enforce ownership and the three-car limit |
| `use-marketplace` | Supabase `cars` + `lib/cars.ts` | public DB listings (newest 300) mixed with demo listings; phone numbers are never selected |
| `use-saved` | Supabase `saved_cars` + `autotrampa_saved` | authenticated real listings; demo listing ids stay local |
| `use-messages` | Supabase `conversations`, `messages` | participant-only conversations and messages; per-user archive. Polls only where `{ poll: true }` is passed (Poruke); the footer subscribes for the badge without a timer |
| `use-preferences` | `autotrampa_preferences` | radius, body prefs, privacy, feed trade filter |
| `use-search-prefs` | `autotrampa_search_prefs` | body type + sort on Pretraga |
| `use-theme` | `autotrampa_theme` | light/dark (also set pre-paint by an inline script) |

`lib/storage.ts` wraps localStorage for demo preferences/messages/saves. `lib/image.ts` downsizes
photos in the browser; `lib/car-images.ts` uploads them into the owner's folder in the public
`car-images` bucket. The SQL migration grants owners upload/delete access to that folder only.

`lib/car-row.ts` is the single mapper from a `public.cars` row to an app object (`rowToCar` for
public listings, `rowToGarageCar` for the owner's own car, plus `CAR_ROW_COLUMNS`). Both hooks used
to carry their own copy, so every new column had to be added twice. Anything not in the row — the
signed-in user's own phone number, for instance — is layered on by the hook that queried.

Invariants worth keeping:
- `selectedCar` is `null` when the garage is empty, and the UI must say "add your car" rather than
  compute a doplata. Never substitute a demo car.
- Any screen that subtracts `selectedCar.price` must run only when `selectedCar` exists.
- `GARAGE_LIMIT` is enforced in `use-garage`, not by hiding a button.
- Garage listings copy only public owner name/city/rating. Phone numbers stay in `profiles` and are
  not returned to anonymous clients.
- Garage mutations return a typed result; callers surface failures to the user.

## Layout

```
app/layout.tsx            metadata, viewport, manifest, pre-paint theme script
middleware.ts             refreshes the Supabase auth cookie, fails open
components/AppShell.tsx   children + Footer + Toaster + on-demand AuthOverlay
components/AuthOverlay.tsx  sign-in as an interruption, opened by requireAuth
components/SignedOut.tsx    placeholder for the personal screens
app/page.tsx              feed: grid + Tinder-style swipe, trade filters
app/<route>/page.tsx      server shell: metadata + robots, renders the client view
app/<route>/*Client.tsx   the client view (SearchClient, GarageClient, …)
app/car/[id]/page.tsx     server shell: resolve the listing (demo seed OR Supabase),
                          generateStaticParams + per-listing metadata + 404
app/car/[id]/CarDetail.tsx  the client view, receives an already-resolved car
components/CarForm.tsx    add/edit form — renders its own full-screen portal,
                          so never wrap it in a sheet
components/BottomSheet.tsx    Escape, backdrop, scroll lock, focus
components/TradeOfferSheet.tsx  the offer flow, shared by feed/search/saved/detail
components/ProfileEditSheet.tsx  edits private profile fields and refreshes public owner labels
lib/cars.ts | car-brands.ts | equipment.ts | labels.ts   seed and reference data
```

Every route is a small server `page.tsx` (metadata + `robots`) rendering a `'use client'` view. Do
**not** add a pass-through nested `layout.tsx` for this — on Next 13.5 a layout that merely
returns `children` breaks the RSC client manifest and the route fails to prerender, which is why
the metadata lives on the page shells. The demo listings are statically generated from
`MARKETPLACE_CARS`.

`app/car/[id]` has two kinds of listing and must serve both: seeded demo cars, and real cars in
Supabase that users add at any moment. So it keeps `dynamicParams` **true** and decides the 404
itself — [`lib/listings.ts`](./lib/listings.ts) looks the id up on the server (demo seed first,
then an anonymous read-only Supabase client using the same public `CAR_ROW_COLUMNS` projection),
and the page calls `notFound()` when nothing matches. Setting `dynamicParams = false` here would
404 every listing that is not in the seed, i.e. every link a user shares to their own car, because
a user-created id can never appear in `generateStaticParams` at build time. `revalidate = 60` is
what makes a brand-new listing shareable without a rebuild.

`components/AppShell.tsx` owns the app's single `<main id="sadrzaj">` (the skip-link target), so
route views must use `<section>`/`<div>` and must not repeat that id.

## Conventions

- **Styling**: use the semantic utilities from `app/globals.css` — `bg-app`, `bg-card-surface`,
  `bg-elevated`, `hover:bg-hover-surface`, `border-surface`, `text-app-primary/-secondary/-muted`,
  `text-brand-text`, `text-tone-positive/-negative/-info/-warn`, `.glass`,
  `.safe-top/.safe-bottom`. They are backed by `--surface-*` / `--text-*` / `--tone-*` vars and are
  what makes light mode work; hardcoded `zinc-*`/`slate-*` (and adding `dark:text-zinc-*` on top of
  a semantic token) breaks it. The accent is **yellow** `#FAEB00` (`brand-300/500`, `--primary`)
  with `--brand-hover` for hover; `brand-400` is an alias of `--brand-text`, which is dark olive in
  light mode and the brand yellow in dark, so never use `brand-500` for text on a light surface.
  The 400-level state colours
  (`emerald-400`, `rose-400`, `sky-400`) wash out on white — use the `.text-tone-*` helpers instead,
  which swap to a readable value per theme. `text-white` is fine on an image overlay, nowhere else.
- **Language**: everything the user reads is Serbian (Latin). Data keeps English keys
  (`BodyType`, `FuelType`, `Transmission`) because they are identifiers used in filters and
  storage — render them through `lib/labels.ts`.
- **Numbers**: `formatEuro` and `formatKm` from `lib/cars.ts`. Never call a bare
  `toLocaleString()` — it resolves differently on the Node server than in the browser and shows up
  as a hydration mismatch.
- **Layout width**: every page header and every page body uses `.app-container` (and sticky headers
  use `.app-page-header` with the container inside it, so the background stays full-bleed while the
  title lines up with the content below). Never re-state `max-w-*` or horizontal `px-*` per screen —
  a divergence there is what makes a header look off-centre against its cards. Vertical padding
  stays per screen. The grid in `app/page.tsx` is the reference implementation.
- **No context providers**: state is module-level stores, by design.

## Supabase setup

Copy `.env.example` to `.env.local`, set the Supabase URL and publishable key, and configure Auth
URL Configuration with the site URL plus the `/auth/update-password` redirect for localhost and
production. Apply the SQL in `supabase/migrations/` before using the app. The live database schema
already has `profiles`, `cars`, `saved_cars` and `conversations`; the migration aligns its policies,
adds car display/image fields and configures Storage. Don't reintroduce public profile reads because
the profile table contains phone numbers.

`middleware.ts` is the only server-side session code: it refreshes the Supabase auth cookie on
navigation so a stale cookie cannot make the first server render look anonymous. It fails open (any
error just serves the request) because the client-side session is what every screen actually reads,
and it runs on all routes except static assets. Nothing may be inserted between
`createServerClient` and `getUser()` in it — the refreshed cookies have to reach the response first —
and `config.matcher` must keep excluding `_next/static`, `_next/image` and the metadata routes.

`profiles` is written only through the column grants (`id, name, city, phone` for insert;
`name, city, phone` for update) restored by
`20261002120000_restrict_profiles_write_columns.sql`. `rating`, `trade_count` and `verified` are
server-owned: RLS restricts which row a client may write but never which columns, so a table-level
`grant update` would let a user award themselves a 5.0 rating and the verified badge. Keep any new
profile write inside that column list.

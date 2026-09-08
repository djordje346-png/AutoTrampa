# AutoTrampa

Serbian-language mobile-first web app for **swapping cars** (trampa/zamena), not selling them.
The whole product revolves around the price gap between your car and someone else's:
`diff = other.price - myCar.price` → *Ravna zamena* (even), *Vlasnik doplaćuje X* (they add cash),
or *Tvoja doplata X* (you add cash). Feed, search and the listing page all filter and label on
that number, and it comes from one place: `lib/trade.ts`.

## Status: front-end complete, backend not wired yet

There is **no server and no database**. `@supabase/supabase-js` is in `package.json` but is
imported nowhere — Supabase is planned as the last step, deliberately. Until then every write
goes through `lib/persistent-store.ts` into `localStorage`; see "Swapping in a backend" below.

## Public vs. signed-in

Browsing is public and server-rendered: the feed, Pretraga, Sačuvano and every `/car/[id]` render
real HTML so listings can be shared and indexed (`app/sitemap.ts`, `app/robots.ts`).

Sign-in is asked for at the moment an action needs an identity, never as a wall. `useAuth()`
exposes `requireAuth(reason)`: it returns true when the caller may proceed, otherwise it opens
`AuthOverlay` with that reason and returns false. Garaža, Poruke and Profil render `SignedOutPage`
instead of their content; each has a `layout.tsx` marking it `noindex`.

Trade maths (the doplata label, the trade filters, the "best trade" sort) only appear when signed
in — without a car in the garage there is nothing to compare against. Signed-out visitors get a
CTA explaining what they are missing. Note these are gated on `authReady && isLoggedIn`, so the
server render is always the public variant.

A fresh account still inherits `DEFAULT_GARAGE_CARS`. That is deliberate for the demo — the trade
feature needs a reference car — and is one of the things a real backend replaces.

## Stack

Next.js 13.5.1 App Router · React 18 · TypeScript strict · Tailwind + shadcn/ui (47 primitives in
`components/ui`, mostly unused) · lucide-react · sonner for toasts. Generated from the bolt.new
`nextjs-shadcn` template (`.bolt/`), deployed to Netlify (`netlify.toml`).

Commands: `npm run dev` · `npm run build` · `npm run typecheck` · `npm run lint`. No test suite.

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
| `use-auth` | `autotrampa_auth` | session flag (there is no real auth); the sign-in prompt itself uses `createMemoryStore` so it never survives a reload |
| `use-user` | `autotrampa_user` | profile: name, email, phone, city, rating |
| `use-garage` | `autotrampa_garage`, `autotrampa_selected_car` | own cars + the one used for comparisons |
| `use-saved` | `autotrampa_saved` | saved listing ids |
| `use-messages` | `autotrampa_messages`, `..._seeded` | conversations; seeds once, client-side |
| `use-preferences` | `autotrampa_preferences` | radius, body prefs, privacy, feed trade filter |
| `use-search-prefs` | `autotrampa_search_prefs` | body type + sort on Pretraga |
| `use-theme` | `autotrampa_theme` | light/dark (also set pre-paint by an inline script) |

`lib/storage.ts` wraps localStorage and **reports** failures (`quota` / `unavailable`) rather than
swallowing them — writes that can fail surface a toast. Photos are downscaled by `lib/image.ts`
before they are stored, because base64 images against a ~5 MB origin budget was the fastest way to
break the app; Profil shows a usage meter.

Invariants worth keeping:
- The garage is never empty (`removeCar` refuses the last car) — every screen compares against
  `selectedCar`.
- `GARAGE_LIMIT` is enforced in `use-garage`, not by hiding a button.
- Mutations return a result (`GarageResult`, `StorageResult`); callers show a toast on failure.

## Layout

```
app/layout.tsx            metadata, manifest, pre-paint theme script
components/AppShell.tsx   children + Footer + Toaster + on-demand AuthOverlay
components/AuthOverlay.tsx  sign-in as an interruption, opened by requireAuth
components/SignedOut.tsx    placeholder for the personal screens
app/page.tsx              feed: grid + Tinder-style swipe, trade filters
app/<route>/page.tsx      server shell: metadata + robots, renders the client view
app/<route>/*Client.tsx   the client view (SearchClient, GarageClient, …)
app/car/[id]/page.tsx     server shell: generateStaticParams + per-listing metadata
app/car/[id]/CarDetail.tsx  the client view
components/CarForm.tsx    add/edit form — renders its own full-screen portal,
                          so never wrap it in a sheet
components/BottomSheet.tsx    Escape, backdrop, scroll lock, focus
components/TradeOfferSheet.tsx  the offer flow, shared by feed/search/detail
lib/cars.ts | car-brands.ts | equipment.ts | labels.ts   seed and reference data
```

Every route is a small server `page.tsx` (metadata + `robots`) rendering a `'use client'` view.
Do **not** add a pass-through nested `layout.tsx` for this — on Next 13.5 a layout that merely
returns `children` breaks the RSC client manifest and the route fails to prerender, which is why
the metadata lives on the page shells. Every listing is statically generated; `dynamicParams =
false` makes an unknown id a real 404.

## Conventions

- **Styling**: use the semantic utilities from `app/globals.css` — `bg-app`, `bg-card-surface`,
  `bg-elevated`, `border-surface`, `text-app-primary/-secondary/-muted`, `.glass`,
  `.safe-top/.safe-bottom`. They are backed by `--surface-*` / `--text-*` vars and are what makes
  light mode work; hardcoded `zinc-*`/`slate-*` breaks it. Accent is orange (`orange-400/500`).
  `text-white` is fine on an orange badge or an image overlay, nowhere else.
- **Language**: everything the user reads is Serbian (Latin). Data keeps English keys
  (`BodyType`, `FuelType`, `Transmission`) because they are identifiers used in filters and
  storage — render them through `lib/labels.ts`.
- **Numbers**: `formatEuro` and `formatKm` from `lib/cars.ts`. Never call a bare
  `toLocaleString()` — it resolves differently on the Node server than in the browser and shows up
  as a hydration mismatch.
- **No context providers**: state is module-level stores, by design.

## Swapping in a backend

The seam is deliberate and narrow. `createPersistentStore` is the only thing that touches
`localStorage`, and every hook already returns typed results for failed writes. Replacing the
`readJSON`/`writeJSON` calls in `lib/persistent-store.ts` with Supabase reads/writes (plus a real
session in `use-auth`) moves the whole app over without touching a screen. `MARKETPLACE_CARS` in
`lib/cars.ts` is the one place listings are read from.

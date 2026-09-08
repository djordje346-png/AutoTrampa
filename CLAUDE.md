# AutoTrampa

Serbian-language mobile-first web app for **swapping cars** (trampa/zamena), not selling them.
The whole product revolves around the price gap between your car and someone else's:
`diff = other.price - myCar.price` → *Ravna zamena* (even), *Vlasnik doplaćuje X* (they add cash),
or *Tvoja doplata X* (you add cash). Feed, search and detail pages all filter/label on that number.

## Status: front-end prototype, no backend

There is **no server, no database, no real auth**. `@supabase/supabase-js` is in `package.json`
but is imported nowhere — don't assume it is wired up.

All state lives in `localStorage` under `autotrampa_*` keys:

| Key | Written by | Holds |
|---|---|---|
| `autotrampa_auth` | `hooks/use-auth.ts` | `"true"`/`"false"` — the entire login system |
| `autotrampa_theme` | `hooks/use-theme.ts` | `"dark"` \| `"light"` |
| `autotrampa_garage` | `hooks/use-garage.ts` | user's `MyGarageCar[]` |
| `autotrampa_selected_car` | `hooks/use-garage.ts` | id of the car used for trade comparisons |
| `autotrampa_saved` | inline in `app/page.tsx`, `app/saved/page.tsx`, `app/car/[id]/page.tsx` | saved car ids (no hook — duplicated logic) |
| `autotrampa_messages` | `hooks/use-messages.ts` | conversations, seeded with 3 fake chats + canned auto-replies |

Marketplace listings are a hardcoded array (`MARKETPLACE_CARS` in `lib/cars.ts`, 6 cars) with
Pexels image URLs. Uploaded images are stored as **base64 data URLs** (`components/image-upload.tsx`)
straight into the garage array in localStorage — quota is a real risk when touching that path.

## Stack

Next.js 13.5.1 App Router · React 18 · TypeScript strict · Tailwind + shadcn/ui (47 primitives in
`components/ui`, mostly unused) · lucide-react icons. Generated from the bolt.new `nextjs-shadcn`
template (`.bolt/`), deployed to Netlify (`netlify.toml`, `@netlify/plugin-nextjs`).
`next.config.js` sets `images.unoptimized` and `eslint.ignoreDuringBuilds`.

Commands: `npm run dev` · `npm run build` · `npm run typecheck` · `npm run lint`.
No test suite. `node_modules` may not be installed — run `npm install` first.

## Layout

```
app/layout.tsx        blocking inline script sets .dark before paint; wraps everything in AppShell
components/AppShell.tsx   gate: !mounted → blank, !isLoggedIn → AuthScreen, else children + Footer
app/page.tsx          feed — grid + Tinder-style swipe mode, trade filters, offer modal (708 lines)
app/search/page.tsx   text/body-type search, sorting incl. sort-by-trade-fit
app/saved/page.tsx    saved listings
app/garage/page.tsx   own cars: add/edit/delete, specs, mods, equipment, lightbox
app/car/[id]/page.tsx listing detail + offer flow
app/messages/page.tsx chat UI over the fake conversation store
app/profile/page.tsx  settings, theme toggle, logout, garage limit UI
components/CarForm.tsx  852-line add/edit form (brands, equipment picker, image upload)
lib/cars.ts | car-brands.ts | equipment.ts   all seed/reference data
```

Every page is `'use client'`. Routing is `next/link` + `usePathname`; there is no server-side data
fetching anywhere.

## Conventions

- **Styling**: prefer the semantic utilities defined in `app/globals.css` — `bg-app`,
  `bg-card-surface`, `bg-elevated`, `border-surface`, `text-app-primary/-secondary/-muted`,
  `.glass`, `.safe-top/.safe-bottom` — over raw shadcn tokens or hardcoded `slate-*`/`zinc-*`.
  They are backed by `--surface-*` / `--text-*` CSS vars and are what makes light mode work.
  Accent colour is orange (`orange-400/500`).
- **Global state without context**: `use-auth` and `use-theme` use a module-level variable plus a
  `Set` of listeners, so every mounted component re-renders on change. Follow that pattern rather
  than adding a provider, and keep the `mounted` flag — it exists to avoid hydration mismatch.
- **Language**: user-facing copy is Serbian (Latin). Seed data, chat messages and code comments are
  a mix of English and Serbian; new UI strings should be Serbian.

## Known rough edges

- `getTradeLabel` is copy-pasted verbatim in `app/page.tsx`, `app/search/page.tsx` and
  `app/car/[id]/page.tsx`. Change one → change all three (or lift it into `lib/cars.ts`).
- `components/BottomNav.tsx` is dead code: an older English nav superseded by
  `components/Footer.tsx`, which is the one `AppShell` renders.
- The 3-car garage limit is only enforced in `app/profile/page.tsx`; `useGarage.addCar` and
  `app/garage/page.tsx` let you add more.
- `localStorage` reads are wrapped in bare `try {} catch {}` throughout — failures are silent.

# AutoTrampa

Platforma za **zamenu (trampu) automobila** — ne za prodaju. Umesto cene, u centru je razlika:
koliko ko doplaćuje kada zameni svoj auto za tuđi.

## Pokretanje

```bash
npm install
npm run build:check   # typecheck + lint + build — pokreni pre deploya
npm run dev           # http://localhost:3000
```

Pre razvoja kopiraj `.env.example` u `.env.local` i unesi Supabase Project URL i **publishable**
ključ. Publishable ključ je namenjen browseru; nikada nemoj koristiti `service_role` ili secret
ključ u `NEXT_PUBLIC_*`.

| Komanda | Šta radi |
|---|---|
| `npm run dev` | razvojni server |
| `npm run build` | produkcijski build (prethodno pokreće `typecheck`) |
| `npm run build:check` | typecheck + lint + build |
| `npm run start` | pokreće build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint (`next/core-web-vitals`) |

## Šta aplikacija ima

- **Početna** — feed oglasa sa oznakom doplate, filteri po vrednosti zamene i svajp režim
- **Pretraga** — po marki, modelu i gradu, sa sortiranjem po najboljoj zameni; čuvanje i slanje
  ponude direktno iz rezultata
- **Oglas** (`/car/[id]`) — server ga razrešava (demo seed **ili** Supabase), pa svaki oglas ima
  svoje metapodatke za deljenje, a nepostojeći id vraća pravi 404
- **Sačuvano** — lista želja
- **Garaža** — do 3 vozila, sa specifikacijama, opremom, galerijom i izborom aktivnog vozila
- **Poruke** — privatni razgovori po oglasu i poruke sa Supabase sinhronizacijom
- **Profil** — identitet, preferencije zamene, tamna/svetla tema, pregled zauzeća memorije

## Nalog

Pregled oglasa je javan — feed, pretraga i stranice oglasa rade bez prijave i mogu se deliti i
indeksirati. Prijava se traži tek kada je potrebna: za garažu, poruke, profil i slanje ponude.
Oznaka doplate i filteri po vrednosti zamene pojavljuju se tek kada imaš auto u garaži.

## Supabase

Email prijava/registracija, profil, korisnička garaža i javni oglasi koriste Supabase. Oglasi se
ograničavaju vlasniku za izmene kroz RLS, a telefonski brojevi ostaju u privatnoj tabeli profila —
`profiles` se klijentu nikad ne čita preko javnog upita. Reputacija (`rating`, `trade_count`,
`verified`) je serverska: kolonski grantovi u `20261002120000_restrict_profiles_write_columns.sql`
sprečavaju klijenta da ih upiše.

Fotografije se otpremaju u javni `car-images` Storage bucket; vlasnik može da otprema i briše
objekte samo u svom UID folderu. Migracija uključuje i serversko ograničenje garaže na tri auta.

Otvori Supabase Dashboard → Authentication → URL Configuration. Postavi Site URL na domen sajta,
pa dodaj dozvoljene redirect URL-ove `http://localhost:3000/auth/update-password` i
`https://TVOJ-DOMEN/auth/update-password`. Uključi email/password provider. Potvrda email adrese
može ostati uključena; aplikacija prikazuje poruku da proveriš poštu.

Feed sadrži lokalne demo oglase iz `lib/cars.ts` i stvarne oglase iz Supabase-a (najviše 300,
najnoviji prvi). Demo oglasi su označeni sa **Demo** i nemaju vlasnika za razgovor. Sačuvani
stvarni oglasi i razgovori/poruke sinhronizuju se po nalogu uz RLS. Razgovori se arhiviraju samo
za trenutno prijavljenog korisnika.

## Deploy (Vercel + Git)

Projekat se hostuje na **Vercelu** i objavljuje se automatski na svaki `git push`. Next.js se
detektuje sam, pa je build komanda `npm run build` (koja prvo pokreće `typecheck`), a izlaz `.next`.

Jednom, u folderu projekta:

```bash
# 1. prvi commit (projekat trenutno nije git repozitorijum)
git init -b main
git add -A
git commit -m "AutoTrampa: security, theme tokens, shared row mapper, CI gates"

# 2. napravi prazan repozitorijum na GitHub-u, pa ga poveži
git remote add origin https://github.com/KORISNIK/autotrampa.git
git push -u origin main
```

Zatim u Vercelu: **Add New → Project → Import Git Repository → autotrampa → Deploy**.

- **Framework preset:** Next.js (auto-detektovano)
- **Build command:** `npm run build` · **Output:** `.next`
- **Environment Variables** (Production i Preview):
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  - `NEXT_PUBLIC_SITE_URL` (npr. `https://tvoj-domen`) — koristi se za Open Graph, sitemap i robots

Posle prvog deploya dodaj domen u Supabase → Authentication → URL Configuration, zajedno sa
`https://TVOJ-DOMEN/auth/update-password`.

Od tog trenutka svaki push na `main` ide u produkciju, a svaki PR dobija preview URL.

### Provera posle deploya

Skripta proverava da su izmene stvarno žive, a ne samo da je build prošao:

```bash
npm run verify:deploy -- https://www.autotrampa.rs
```

Pokriva: da se feed renderuje, da je footer prestao da bude hardkodiran na tamno, da demo oglasi
imaju oznaku, da su imena gradova na srpskom, da poznat oglas ima svoje metapodatke, da **nepoznat
oglas vraća 404**, da `robots.txt`/`sitemap.xml`/`manifest` rade (middleware ih ne blokira) i da
`/saved` ostaje `noindex`.

> **Bitno:** `NEXT_PUBLIC_SITE_URL` mora biti postavljen na pravi domen. Bez njega `robots.txt`,
> `sitemap.xml` i svaki `og:url` pokazuju na rezervni domen — u jednom trenutku je u produkciji
> stajalo `Sitemap: https://autotrampa.netlify.app/sitemap.xml`.

> `netlify.toml` i `@netlify/plugin-nextjs` su ostaci ranijeg hosta i mogu se obrisati; Vercel ih
> ignoriše.

### Alternativa: deploy bez Gita

```bash
npm run build:check     # obavezno: bez env varijabli build neće proći
npx vercel --prod
```


## Struktura

Detaljan opis arhitekture, konvencija i mesta na koje se kači backend nalazi se u
[`CLAUDE.md`](./CLAUDE.md).

# AutoTrampa

Platforma za **zamenu (trampu) automobila** — ne za prodaju. Umesto cene, u centru je razlika:
koliko ko doplaćuje kada zameni svoj auto za tuđi.

[![Open in Bolt](https://bolt.new/static/open-in-bolt.svg)](https://bolt.new/~/sb1-akg61tpz)

## Pokretanje

```bash
npm install
npm run dev      # http://localhost:3000
```

Pre razvoja kopiraj `.env.example` u `.env.local` i unesi Supabase Project URL i **publishable**
ključ. Iste promenljive podesi i u Netlify Site settings → Environment variables. Publishable ključ
je namenjen browseru; nikada nemoj koristiti `service_role` ili secret ključ u `NEXT_PUBLIC_*`.

| Komanda | Šta radi |
|---|---|
| `npm run dev` | razvojni server |
| `npm run build` | produkcijski build |
| `npm run start` | pokreće build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |

## Šta aplikacija ima

- **Početna** — feed oglasa sa oznakom doplate, filteri po vrednosti zamene i svajp režim
- **Pretraga** — po marki, modelu i gradu, sa sortiranjem po najboljoj zameni; čuvanje i slanje
  ponude direktno iz rezultata
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
ograničavaju vlasniku za izmene kroz RLS, a telefonski brojevi ostaju u privatnoj tabeli profila.
Fotografije se otpremaju u javni `car-images` Storage bucket; vlasnik može da otprema i briše
objekte samo u svom UID folderu. Migracija uključuje i serversko ograničenje garaže na tri auta.

Otvori Supabase Dashboard → Authentication → URL Configuration. Postavi Site URL na domen sajta,
pa dodaj dozvoljene redirect URL-ove `http://localhost:3000/auth/update-password` i
`https://TVOJ-DOMEN/auth/update-password`. Uključi email/password provider. Potvrda email adrese
može ostati uključena; aplikacija prikazuje poruku da proveriš poštu.

Feed sadrži lokalne demo oglase iz `lib/cars.ts` i stvarne oglase iz Supabase-a. Sačuvani stvarni
oglasi i razgovori/poruke sinhronizuju se po nalogu uz RLS. Demo oglasi i podešavanja feeda ostaju
lokalni. Razgovori se arhiviraju samo za trenutno prijavljenog korisnika.

## Deploy

Netlify, preko `netlify.toml` i `@netlify/plugin-nextjs`. Build komanda je `npx next build`,
publish direktorijum `.next`.

Opciono podesi `NEXT_PUBLIC_SITE_URL` na pravi domen da bi Open Graph slike i linkovi za deljenje
pokazivali na produkciju umesto na podrazumevanu vrednost.

## Struktura

Detaljan opis arhitekture, konvencija i mesta na koje se kači backend nalazi se u
[`CLAUDE.md`](./CLAUDE.md).

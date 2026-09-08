# AutoTrampa

Platforma za **zamenu (trampu) automobila** — ne za prodaju. Umesto cene, u centru je razlika:
koliko ko doplaćuje kada zameni svoj auto za tuđi.

[![Open in Bolt](https://bolt.new/static/open-in-bolt.svg)](https://bolt.new/~/sb1-akg61tpz)

## Pokretanje

```bash
npm install
npm run dev      # http://localhost:3000
```

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
- **Poruke** — razgovori po oglasu, sa simuliranim odgovorom druge strane
- **Profil** — identitet, preferencije zamene, tamna/svetla tema, pregled zauzeća memorije

## Podaci

Aplikacija trenutno radi **potpuno lokalno**. Nema servera ni baze — garaža, sačuvani oglasi,
poruke i podešavanja žive u `localStorage` pregledača, pod ključevima `autotrampa_*`.

Praktične posledice:

- brisanje podataka pregledača briše i garažu, poruke i sačuvane oglase;
- fotografije se čuvaju kao base64 i troše deo od ~5 MB koje pregledač daje po sajtu, pa se
  automatski smanjuju na 1600 px pre čuvanja. Profil prikazuje koliko je zauzeto;
- oglasi na tržištu su fiksni skup podataka u `lib/cars.ts`.

Supabase je već u zavisnostima ali namerno nije povezan — to je poslednji korak.

## Deploy

Netlify, preko `netlify.toml` i `@netlify/plugin-nextjs`. Build komanda je `npx next build`,
publish direktorijum `.next`.

Opciono podesi `NEXT_PUBLIC_SITE_URL` na pravi domen da bi Open Graph slike i linkovi za deljenje
pokazivali na produkciju umesto na podrazumevanu vrednost.

## Struktura

Detaljan opis arhitekture, konvencija i mesta na koje se kači backend nalazi se u
[`CLAUDE.md`](./CLAUDE.md).

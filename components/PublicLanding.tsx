'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeftRight,
  ArrowRight,
  CarFront,
  ChevronRight,
  Coins,
  MapPin,
  Menu,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  UsersRound,
  X,
} from 'lucide-react';
import type { Car } from '@/types';
import { carSubtitle } from '@/lib/car-row';
import { formatEuro, formatKm } from '@/lib/cars';
import { fuelLabel, transmissionLabel } from '@/lib/labels';

interface PublicLandingProps {
  cars: Car[];
  listingsReady: boolean;
  onAddCar: () => void;
  onSignIn: () => void;
}

const HOW_IT_WORKS = [
  { number: '01', icon: CarFront, title: 'Dodaj svoj auto', description: 'Unesi osnovne informacije i fotografije svog vozila.' },
  { number: '02', icon: Search, title: 'Pronađi zamenu', description: 'Pregledaj oglase i vidi kakva doplata ti odgovara.' },
  { number: '03', icon: Send, title: 'Pošalji ponudu', description: 'Dogovori zamenu direktno sa vlasnikom.' },
] as const;

const MATCH_STEPS = [
  { icon: CarFront, title: 'Tvoj auto', description: 'Početna tačka preporuke' },
  { icon: Coins, title: 'Budžet', description: 'Koliko želiš da doplatiš' },
  { icon: MapPin, title: 'Radijus', description: 'Grad i udaljenost oglasa' },
  { icon: Sparkles, title: 'Preporuke', description: 'Zamene za tebe' },
] as const;

function BrandMark() {
  return (
    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-black">
      <CarFront size={20} strokeWidth={2.2} />
    </span>
  );
}

function CarPhoto({
  src,
  alt,
  className,
  fallbackClassName,
}: {
  src: string;
  alt: string;
  className: string;
  fallbackClassName: string;
}) {
  const [failedImage, setFailedImage] = useState<{ src: string; failed: boolean } | null>(null);
  const failed = !src || (failedImage?.src === src && failedImage.failed);

  if (failed) {
    return (
      <div
        className={fallbackClassName}
        role={alt ? 'img' : undefined}
        aria-label={alt || undefined}
        aria-hidden={!alt}
      >
        <CarFront size={34} strokeWidth={1.5} aria-hidden="true" />
      </div>
    );
  }

  return <img src={src} alt={alt} className={className} onError={() => setFailedImage({ src, failed: true })} />;
}

function CarPreview({ car, label }: { car?: Car; label: string }) {
  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-white/70 bg-white shadow-lg shadow-black/10">
      <div className="relative aspect-[4/3] overflow-hidden bg-zinc-200">
        {car ? (
          <CarPhoto
            src={car.image}
            alt={`${car.brand} ${car.model}`}
            className="h-full w-full object-cover"
            fallbackClassName="flex h-full w-full items-center justify-center bg-zinc-200 text-zinc-400"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-zinc-400"><CarFront size={42} /></div>
        )}
      </div>
      <div className="px-3 py-2.5 sm:px-4 sm:py-3">
        <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-zinc-500 sm:text-[10px]">{label}</p>
        <p className="mt-0.5 truncate text-xs font-bold text-zinc-950 sm:text-sm">
          {car ? `${car.brand} ${car.model}` : label === 'Tvoj auto' ? 'Tvoj automobil' : 'Moguća zamena'}
        </p>
        <p className="mt-0.5 truncate text-[10px] text-zinc-500 sm:text-xs">
          {car
            ? `${car.year} · ${fuelLabel(car.specs.fuelType)}`
            : label === 'Tvoj auto'
              ? 'Dodaj auto da pronađeš zamenu'
              : 'Prikazujemo stvarne oglase vlasnika'}
        </p>
      </div>
    </div>
  );
}

function SwapVisual({ cars }: { cars: Car[] }) {
  const first = cars[0];
  const second = cars[1];

  return (
    <div className="relative overflow-hidden rounded-[1.75rem] border border-zinc-200 bg-gradient-to-br from-zinc-100 via-white to-zinc-200 p-3 shadow-xl shadow-zinc-900/10 sm:p-5 lg:p-6">
      <div aria-hidden="true" className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand-500/20 blur-3xl" />
      <div className="relative mb-3 flex items-center justify-between px-1 sm:mb-4">
        <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500 sm:text-xs">Primer zamene</span>
        <span className="rounded-full border border-zinc-200 bg-white/80 px-2.5 py-1 text-[10px] font-medium text-zinc-600 sm:text-xs">Uz doplatu ili bez nje</span>
      </div>
      <div className="relative grid grid-cols-[minmax(0,1fr)_2.5rem_minmax(0,1fr)] items-center gap-1.5 sm:grid-cols-[minmax(0,1fr)_3.25rem_minmax(0,1fr)] sm:gap-2">
        <CarPreview car={first} label="Tvoj auto" />
        <div className="z-10 flex h-9 w-9 items-center justify-center rounded-full bg-brand-500 text-zinc-950 shadow-md shadow-brand-500/30 sm:h-12 sm:w-12">
          <ArrowLeftRight size={20} strokeWidth={2.4} className="sm:hidden" />
          <ArrowLeftRight size={25} strokeWidth={2.4} className="hidden sm:block" />
        </div>
        <CarPreview car={second} label="Moguća zamena" />
      </div>
      <div className="relative mx-auto mt-3 w-fit rounded-full border border-brand-500/50 bg-brand-500/20 px-3 py-1.5 text-[10px] font-bold text-zinc-900 sm:mt-4 sm:px-4 sm:text-xs">
        Doplata se dogovara direktno
      </div>
    </div>
  );
}

function ListingCard({ car }: { car: Car }) {
  return (
    <Link
      href={`/car/${car.id}`}
      className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-shadow hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
    >
      <div className="aspect-[16/10] overflow-hidden bg-zinc-100">
        <CarPhoto
          src={car.image}
          alt={`${car.brand} ${car.model}`}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          fallbackClassName="flex h-full w-full items-center justify-center bg-zinc-200 text-zinc-400"
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col p-3.5 sm:p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-bold text-zinc-950 sm:text-base">{car.year} {car.brand} {car.model}</h3>
            <p className="mt-0.5 truncate text-xs text-zinc-500">{carSubtitle(car)}</p>
          </div>
          <span className="shrink-0 text-sm font-bold text-zinc-950 sm:text-base">{formatEuro(car.price)}</span>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-zinc-500">
          <span>{formatKm(car.mileage)}</span>
          <span>{fuelLabel(car.specs.fuelType)}</span>
          <span>{transmissionLabel(car.specs.transmission)}</span>
          {car.city && <span className="truncate">{car.city}</span>}
        </div>
      </div>
    </Link>
  );
}

export default function PublicLanding({ cars, listingsReady, onAddCar, onSignIn }: PublicLandingProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  // The shared marketplace hook also includes demo seed cars for signed-in
  // browsing. Public examples should always be real owner listings.
  const publicCars = cars.filter((car) => Boolean(car.ownerId));
  const popularCars = publicCars.slice(0, 3);
  const heroCar = publicCars[0];

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <div className="min-h-screen overflow-hidden bg-white text-zinc-950">
      <header className="relative z-30 border-b border-zinc-200 bg-white">
        <div className="mx-auto flex h-[4.25rem] w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:h-[4.75rem] lg:px-8">
          <Link href="/" aria-label="AutoTrampa — početna" className="flex shrink-0 items-center gap-2 text-zinc-950">
            <BrandMark />
            <span className="text-base font-bold tracking-tight sm:text-lg">AutoTrampa</span>
          </Link>

          <nav aria-label="Glavni meni" className="hidden items-center gap-7 desktop:flex">
            <a href="#kako-funkcionise" className="text-sm font-semibold text-zinc-600 transition-colors hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">Kako funkcioniše</a>
            <Link href="/search" className="text-sm font-semibold text-zinc-600 transition-colors hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">Oglasi</Link>
            <a href="#smart-match" className="text-sm font-semibold text-zinc-600 transition-colors hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">Zašto AutoTrampa</a>
          </nav>

          <div className="hidden items-center gap-3 desktop:flex">
            <button type="button" onClick={onSignIn} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-950">Prijavi se</button>
            <button type="button" onClick={onAddCar} className="btn-primary whitespace-nowrap text-sm">Dodaj svoj auto <ArrowRight size={16} /></button>
          </div>

          <div className="flex items-center gap-2 desktop:hidden">
            <button type="button" onClick={onSignIn} className="rounded-lg px-2.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 sm:text-sm">Prijavi se</button>
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label={menuOpen ? 'Zatvori meni' : 'Otvori meni'}
              aria-expanded={menuOpen}
              aria-controls="public-mobile-menu"
              className="flex h-10 w-10 items-center justify-center rounded-xl text-zinc-800 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              {menuOpen ? <X size={21} /> : <Menu size={21} />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <nav id="public-mobile-menu" aria-label="Mobilni meni" className="absolute inset-x-0 top-full border-b border-zinc-200 bg-white p-4 shadow-lg desktop:hidden">
            <div className="mx-auto flex max-w-7xl flex-col gap-1">
              <a href="#kako-funkcionise" onClick={closeMenu} className="rounded-xl px-3 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">Kako funkcioniše</a>
              <Link href="/search" onClick={closeMenu} className="rounded-xl px-3 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">Oglasi</Link>
              <a href="#smart-match" onClick={closeMenu} className="rounded-xl px-3 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">Zašto AutoTrampa</a>
              <button type="button" onClick={() => { closeMenu(); onAddCar(); }} className="btn-primary mt-2 w-full text-sm">Dodaj svoj auto <ArrowRight size={16} /></button>
            </div>
          </nav>
        )}
      </header>

      <main>
        <section className="relative border-b border-zinc-200 bg-gradient-to-b from-zinc-50 to-white">
          <div className="mx-auto grid w-full max-w-7xl items-center gap-8 px-4 py-8 sm:px-6 sm:py-12 lg:gap-10 lg:py-16 desktop:grid-cols-[0.92fr_1.08fr] desktop:px-8 desktop:py-20">
            <div className="max-w-2xl">
              <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-zinc-600 shadow-sm sm:text-xs">
                <span className="h-2 w-2 rounded-full bg-brand-500" /> Pametnija zamena automobila
              </p>
              <h1 className="max-w-[12ch] text-[2.6rem] font-bold leading-[0.98] tracking-tight text-zinc-950 sm:text-5xl lg:text-6xl desktop:max-w-none desktop:text-[3.75rem]">
                Zameni auto.<br />Ne prodaj ga prvo.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-zinc-600 sm:text-lg">
                Dodaj svoj auto i pronađi vlasnike koji žele baš tvoje vozilo — uz doplatu ili bez nje.
              </p>
              <div className="mt-7 flex flex-col gap-3 min-[420px]:flex-row min-[420px]:items-center">
                <button type="button" onClick={onAddCar} className="btn-primary w-full text-sm sm:w-auto sm:text-base">Dodaj svoj auto <ArrowRight size={17} /></button>
                <Link href="/search" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-5 py-3 text-sm font-semibold text-zinc-800 transition-colors hover:border-zinc-400 hover:bg-zinc-50 sm:text-base">
                  <Search size={17} /> Pogledaj oglase
                </Link>
              </div>
              <div className="mt-7 hidden flex-wrap gap-x-5 gap-y-3 text-xs font-medium text-zinc-600 sm:flex">
                <span className="inline-flex items-center gap-2"><ShieldCheck size={17} className="text-zinc-800" /> Provereni oglasi</span>
                <span className="inline-flex items-center gap-2"><UsersRound size={17} className="text-zinc-800" /> Direktno sa vlasnicima</span>
                <span className="inline-flex items-center gap-2"><MapPin size={17} className="text-zinc-800" /> Širom Srbije</span>
              </div>
            </div>
            <SwapVisual cars={publicCars} />
          </div>
        </section>

        <section id="kako-funkcionise" className="scroll-mt-20 mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:py-16 desktop:px-8">
          <div className="mb-5 flex items-end justify-between gap-4 sm:mb-7">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">Jednostavno od početka do ponude</p>
              <h2 className="mt-1.5 text-2xl font-bold tracking-tight sm:text-3xl">Kako funkcioniše?</h2>
              <span className="mt-2 block h-1 w-12 rounded-full bg-brand-500" />
            </div>
          </div>
          <div className="grid gap-2.5 sm:gap-4 md:grid-cols-3">
            {HOW_IT_WORKS.map(({ number, icon: Icon, title, description }) => (
              <article key={number} className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-3.5 shadow-sm sm:gap-4 sm:p-5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-sm font-bold text-zinc-700 sm:h-10 sm:w-10">{number}</span>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-50 text-zinc-900 sm:h-12 sm:w-12"><Icon size={21} /></span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-zinc-950 sm:text-base">{title}</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-zinc-500 sm:text-sm">{description}</span>
                </span>
              </article>
            ))}
          </div>
        </section>

        <section id="popularne-zamene" className="hidden border-y border-zinc-200 bg-zinc-50/80 md:block">
          <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:py-14 desktop:px-8">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">Oglasi za istraživanje</p>
                <h2 className="mt-1.5 text-2xl font-bold tracking-tight sm:text-3xl">Popularne zamene</h2>
                <span className="mt-2 block h-1 w-12 rounded-full bg-brand-500" />
              </div>
              <Link href="/search" className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-zinc-700 transition-colors hover:text-zinc-950">
                Pogledaj sve oglase <ArrowRight size={16} />
              </Link>
            </div>
            {!listingsReady && popularCars.length === 0 ? (
              <div className="grid gap-4 md:grid-cols-2 desktop:grid-cols-3">
                {[0, 1, 2].map((index) => <div key={index} className="aspect-[16/10] animate-pulse rounded-2xl bg-zinc-200" />)}
              </div>
            ) : popularCars.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 desktop:grid-cols-3">
                {popularCars.map((car) => <ListingCard key={car.id} car={car} />)}
              </div>
            ) : (
              <p className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-500">Novi oglasi uskoro stižu.</p>
            )}
          </div>
        </section>

        <section id="smart-match" className="scroll-mt-20 mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:py-16 desktop:px-8">
          <div className="rounded-[1.75rem] border border-zinc-200 bg-white p-4 shadow-sm sm:p-6 lg:p-8">
            <div className="flex items-start gap-3 sm:gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-500 text-zinc-950 sm:h-14 sm:w-14"><Sparkles size={25} /></span>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">Preporuke po tvojoj meri</p>
                <h2 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">Smart Match</h2>
                <p className="mt-1 max-w-2xl text-sm leading-relaxed text-zinc-600">AutoTrampa uzima u obzir tvoj auto, budžet i radijus pretrage da bi ti istakla relevantnije zamene.</p>
              </div>
            </div>
            <div className="mt-5 grid gap-2 sm:grid-cols-2 desktop:grid-cols-4">
              {MATCH_STEPS.map(({ icon: Icon, title, description }, index) => (
                <div key={title} className={`relative flex min-w-0 items-center gap-3 rounded-xl border p-3.5 ${index === MATCH_STEPS.length - 1 ? 'border-brand-500/60 bg-brand-500/10' : 'border-zinc-200 bg-zinc-50'}`}>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-zinc-800 shadow-sm"><Icon size={19} /></span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-zinc-900">{title}</span>
                    <span className="mt-0.5 block truncate text-xs text-zinc-500">{description}</span>
                  </span>
                  {index < MATCH_STEPS.length - 1 && <ChevronRight size={16} className="ml-auto hidden shrink-0 text-zinc-400 desktop:block" />}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 pb-8 sm:px-6 sm:pb-12 desktop:px-8">
          <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[1.75rem] bg-zinc-950 text-white">
            {heroCar && (
              <CarPhoto
                src={heroCar.image}
                alt=""
                className="absolute inset-0 h-full w-full object-cover opacity-35"
                fallbackClassName="absolute inset-0 bg-zinc-900"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/85 to-zinc-950/45" />
            <div className="relative flex flex-col items-start gap-5 px-5 py-8 sm:px-8 sm:py-10 desktop:flex-row desktop:items-center desktop:justify-between desktop:px-14 desktop:py-12">
              <div>
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Koji auto trenutno voziš?</h2>
                <p className="mt-2 text-sm text-zinc-200 sm:text-base">Dodaj svoj auto i pronađi pravu zamenu.</p>
              </div>
              <button type="button" onClick={onAddCar} className="btn-primary w-full whitespace-nowrap text-sm sm:w-auto sm:text-base">Dodaj svoj auto <ArrowRight size={17} /></button>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t border-zinc-800 bg-zinc-900 text-zinc-400">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-7 sm:flex-row sm:items-center sm:justify-between sm:px-6 desktop:px-8">
          <Link href="/" aria-label="AutoTrampa — početna" className="flex w-fit items-center gap-2 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
            <BrandMark />
            <span className="font-bold tracking-tight">AutoTrampa</span>
          </Link>
          <nav aria-label="Linkovi u podnožju" className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <a href="#kako-funkcionise" className="hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">Kako funkcioniše</a>
            <Link href="/search" className="hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">Oglasi</Link>
            <a href="#smart-match" className="hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">Smart Match</a>
          </nav>
          <p className="text-xs">AutoTrampa · Platforma za zamenu automobila</p>
        </div>
      </footer>
    </div>
  );
}

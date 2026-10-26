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
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from 'lucide-react';
import type { Car } from '@/types';
import BrandLockup from '@/components/BrandLockup';
import PublicHeader from '@/components/PublicHeader';
import { carSubtitle } from '@/lib/car-row';
import { carTitle, formatEuro, formatKm, formatYear } from '@/lib/cars';
import { fuelLabel, transmissionLabel } from '@/lib/labels';

interface PublicLandingProps {
  cars: Car[];
  listingsReady: boolean;
  onAddCar: () => void;
  onSignIn: () => void;
  onRegister: () => void;
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
    <div className="min-w-0 overflow-hidden rounded-2xl border border-surface bg-card-surface shadow-lg shadow-black/10">
      <div className="relative aspect-[4/3] overflow-hidden bg-elevated">
        {car ? (
          <CarPhoto
            src={car.image}
            alt={`${car.brand} ${car.model}`}
            className="h-full w-full object-cover"
            fallbackClassName="flex h-full w-full items-center justify-center bg-elevated text-app-muted"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-app-muted"><CarFront size={42} /></div>
        )}
      </div>
      <div className="px-3 py-2.5 sm:px-4 sm:py-3">
        <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-app-muted sm:text-[10px]">{label}</p>
        <p className="mt-0.5 truncate text-xs font-bold text-app-primary sm:text-sm">
          {car ? `${car.brand} ${car.model}` : label === 'Tvoj auto' ? 'Tvoj automobil' : 'Moguća zamena'}
        </p>
        <p className="mt-0.5 truncate text-[10px] text-app-muted sm:text-xs">
          {car
            ? `${formatYear(car.year)} · ${fuelLabel(car.specs.fuelType)}`
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
      <div className="relative overflow-hidden rounded-[1.75rem] border border-surface bg-gradient-to-br from-card via-card to-elevated p-3 shadow-xl shadow-zinc-900/10 sm:p-5 lg:p-6">
      <div aria-hidden="true" className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand-500/20 blur-3xl" />
      <div className="relative mb-3 flex items-center justify-between px-1 sm:mb-4">
        <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-app-muted sm:text-xs">Primer zamene</span>
        <span className="rounded-full border border-surface bg-card/80 px-2.5 py-1 text-[10px] font-medium text-app-secondary sm:text-xs">Uz doplatu ili bez nje</span>
      </div>
      <div className="relative grid grid-cols-[minmax(0,1fr)_2.5rem_minmax(0,1fr)] items-center gap-1.5 sm:grid-cols-[minmax(0,1fr)_3.25rem_minmax(0,1fr)] sm:gap-2">
        <CarPreview car={first} label="Tvoj auto" />
        <div className="z-10 flex h-9 w-9 items-center justify-center rounded-full bg-brand-500 text-on-accent shadow-md shadow-brand-500/30 sm:h-12 sm:w-12">
          <ArrowLeftRight size={20} strokeWidth={2.4} className="sm:hidden" />
          <ArrowLeftRight size={25} strokeWidth={2.4} className="hidden sm:block" />
        </div>
        <CarPreview car={second} label="Moguća zamena" />
      </div>
      <div className="relative mx-auto mt-3 w-fit rounded-full border border-brand-500/50 bg-brand-500/20 px-3 py-1.5 text-[10px] font-bold text-app-primary sm:mt-4 sm:px-4 sm:text-xs">
        Doplata se dogovara direktno
      </div>
    </div>
  );
}

function ListingCard({ car }: { car: Car }) {
  return (
    <Link
      href={`/car/${car.id}`}
      className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-surface bg-card-surface shadow-sm transition-shadow hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
    >
      <div className="aspect-[16/10] overflow-hidden bg-elevated">
        <CarPhoto
          src={car.image}
          alt={`${car.brand} ${car.model}`}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          fallbackClassName="flex h-full w-full items-center justify-center bg-elevated text-app-muted"
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col p-3.5 sm:p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-app-primary sm:text-lg">{carTitle(car)}</h3>
            <p className="mt-0.5 truncate text-xs text-app-secondary">{carSubtitle(car)}</p>
          </div>
          <span className="shrink-0 font-sans text-[22px] font-bold tabular-nums text-app-primary">{formatEuro(car.price)}</span>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-app-secondary">
          <span>{formatKm(car.mileage)}</span>
          <span>{fuelLabel(car.specs.fuelType)}</span>
          <span>{transmissionLabel(car.specs.transmission)}</span>
          {car.city && <span className="truncate">{car.city}</span>}
        </div>
      </div>
    </Link>
  );
}

export default function PublicLanding({ cars, listingsReady, onAddCar, onSignIn, onRegister }: PublicLandingProps) {
  // The shared marketplace hook also includes demo seed cars for signed-in
  // browsing. Public examples should always be real owner listings.
  const publicCars = cars.filter((car) => Boolean(car.ownerId));
  const popularCars = publicCars.slice(0, 3);
  const heroCar = publicCars[0];

  return (
    <div className="theme-atmosphere public-landing-carbon min-h-screen overflow-hidden text-app-primary">
      <PublicHeader onAddCar={onAddCar} onSignIn={onSignIn} onRegister={onRegister} />

      <main>
        <section className="public-landing-carbon-hero relative border-b border-surface bg-gradient-to-b from-app to-card">
          <div className="mx-auto grid w-full max-w-7xl items-center gap-8 px-4 py-8 sm:px-6 sm:py-12 lg:gap-10 lg:py-16 desktop:grid-cols-[0.92fr_1.08fr] desktop:px-8 desktop:py-20">
            <div className="max-w-2xl">
              <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-surface bg-card-surface px-3 py-1.5 text-[11px] font-semibold text-app-secondary shadow-sm sm:text-xs">
                <span className="h-2 w-2 rounded-full bg-brand-500" /> Pametnija zamena automobila
              </p>
              <h1 className="max-w-[12ch] text-[2.6rem] font-bold leading-[0.98] tracking-tight text-app-primary sm:text-5xl lg:text-6xl desktop:max-w-none desktop:text-[3.75rem]">
                Zameni auto.<br />Ne prodaj ga prvo.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-app-secondary sm:text-lg">
                Dodaj svoj auto i pronađi vlasnike koji žele baš tvoje vozilo — uz doplatu ili bez nje.
              </p>
              <div className="mt-7 flex flex-col gap-3 min-[420px]:flex-row min-[420px]:items-center">
                <button type="button" onClick={onAddCar} className="btn-primary w-full text-sm sm:w-auto sm:text-base">Dodaj svoj auto <ArrowRight size={17} /></button>
                <Link href="/search" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-surface bg-card-surface px-5 py-3 text-sm font-semibold text-secondary-accent transition-colors hover:border-surface hover:bg-elevated sm:text-base">
                  <Search size={17} /> Pogledaj oglase
                </Link>
              </div>
              <div className="mt-7 hidden flex-wrap gap-x-5 gap-y-3 text-xs font-medium text-app-secondary sm:flex">
                <span className="inline-flex items-center gap-2"><ShieldCheck size={17} className="text-secondary-accent" /> Provereni oglasi</span>
                <span className="inline-flex items-center gap-2"><UsersRound size={17} className="text-secondary-accent" /> Direktno sa vlasnicima</span>
                <span className="inline-flex items-center gap-2"><MapPin size={17} className="text-secondary-accent" /> Širom Srbije</span>
              </div>
            </div>
            <SwapVisual cars={publicCars} />
          </div>
        </section>

        <section id="kako-funkcionise" className="scroll-mt-20 mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:py-16 desktop:px-8">
          <div className="mb-5 flex items-end justify-between gap-4 sm:mb-7">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-app-muted">Jednostavno od početka do ponude</p>
              <h2 className="mt-1.5 text-2xl font-bold tracking-tight sm:text-3xl">Kako funkcioniše?</h2>
              <span className="mt-2 block h-1 w-12 rounded-full bg-brand-500" />
            </div>
          </div>
          <div className="grid gap-2.5 sm:gap-4 md:grid-cols-3">
            {HOW_IT_WORKS.map(({ number, icon: Icon, title, description }) => (
              <article key={number} className="flex items-center gap-3 rounded-2xl border border-surface bg-card-surface p-3.5 shadow-sm sm:gap-4 sm:p-5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-elevated text-sm font-bold text-app-secondary sm:h-10 sm:w-10">{number}</span>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-elevated text-app-primary sm:h-12 sm:w-12"><Icon size={21} /></span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-app-primary sm:text-base">{title}</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-app-muted sm:text-sm">{description}</span>
                </span>
              </article>
            ))}
          </div>
        </section>

        <section id="popularne-zamene" className="hidden border-y border-surface bg-elevated/80 md:block">
          <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:py-14 desktop:px-8">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-app-muted">Oglasi za istraživanje</p>
                <h2 className="mt-1.5 text-2xl font-bold tracking-tight sm:text-3xl">Popularne zamene</h2>
                <span className="mt-2 block h-1 w-12 rounded-full bg-brand-500" />
              </div>
              <Link href="/search" className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-app-secondary transition-colors hover:text-app-primary">
                Pogledaj sve oglase <ArrowRight size={16} />
              </Link>
            </div>
            {!listingsReady && popularCars.length === 0 ? (
              <div className="grid gap-4 md:grid-cols-2 desktop:grid-cols-3">
                {[0, 1, 2].map((index) => <div key={index} className="aspect-[16/10] animate-pulse rounded-2xl bg-elevated" />)}
              </div>
            ) : popularCars.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 desktop:grid-cols-3">
                {popularCars.map((car) => <ListingCard key={car.id} car={car} />)}
              </div>
            ) : (
              <p className="rounded-2xl border border-surface bg-card-surface p-6 text-sm text-app-muted">Novi oglasi uskoro stižu.</p>
            )}
          </div>
        </section>

        <section id="smart-match" className="scroll-mt-20 mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:py-16 desktop:px-8">
          <div className="rounded-[1.75rem] border border-surface bg-card-surface p-4 shadow-sm sm:p-6 lg:p-8">
            <div className="flex items-start gap-3 sm:gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-500 text-on-accent sm:h-14 sm:w-14"><Sparkles size={25} /></span>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-app-muted">Preporuke po tvojoj meri</p>
                <h2 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">Smart Match</h2>
                <p className="mt-1 max-w-2xl text-sm leading-relaxed text-app-secondary">AutoTrampa uzima u obzir tvoj auto, budžet i radijus pretrage da bi ti istakla relevantnije zamene.</p>
              </div>
            </div>
            <div className="mt-5 grid gap-2 sm:grid-cols-2 desktop:grid-cols-4">
              {MATCH_STEPS.map(({ icon: Icon, title, description }, index) => (
                <div key={title} className={`relative flex min-w-0 items-center gap-3 rounded-xl border p-3.5 ${index === MATCH_STEPS.length - 1 ? 'border-brand-500/60 bg-brand-500/10' : 'border-surface bg-elevated'}`}>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-card-surface text-secondary-accent shadow-sm"><Icon size={19} /></span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-app-primary">{title}</span>
                    <span className="mt-0.5 block truncate text-xs text-app-muted">{description}</span>
                  </span>
                  {index < MATCH_STEPS.length - 1 && <ChevronRight size={16} className="ml-auto hidden shrink-0 text-app-muted desktop:block" />}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 pb-8 sm:px-6 sm:pb-12 desktop:px-8">
          <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[1.75rem] bg-brand-dark text-brand-dark-primary">
            {heroCar && (
              <CarPhoto
                src={heroCar.image}
                alt=""
                className="absolute inset-0 h-full w-full object-cover opacity-35"
                fallbackClassName="absolute inset-0 bg-brand-dark"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-brand-dark via-brand-dark/85 to-brand-dark/45" />
            <div className="relative flex flex-col items-start gap-5 px-5 py-8 sm:px-8 sm:py-10 desktop:flex-row desktop:items-center desktop:justify-between desktop:px-14 desktop:py-12">
              <div>
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Koji auto trenutno voziš?</h2>
                <p className="mt-2 text-sm text-brand-dark-secondary sm:text-base">Dodaj svoj auto i pronađi pravu zamenu.</p>
              </div>
              <button type="button" onClick={onAddCar} className="btn-primary w-full whitespace-nowrap text-sm sm:w-auto sm:text-base">Dodaj svoj auto <ArrowRight size={17} /></button>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t border-brand-dark bg-brand-dark text-brand-dark-secondary">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-7 sm:flex-row sm:items-center sm:justify-between sm:px-6 desktop:px-8">
          <Link href="/" aria-label="AutoTrampa — početna" className="flex w-fit items-center gap-2 text-brand-dark-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
            <BrandLockup />
          </Link>
          <nav aria-label="Linkovi u podnožju" className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <a href="#kako-funkcionise" className="hover:text-brand-dark-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">Kako funkcioniše</a>
            <Link href="/search" className="hover:text-brand-dark-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">Oglasi</Link>
            <a href="#smart-match" className="hover:text-brand-dark-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">Smart Match</a>
          </nav>
          <p className="text-xs">AutoTrampa · Platforma za zamenu automobila</p>
        </div>
      </footer>
    </div>
  );
}

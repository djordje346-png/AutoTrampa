'use client';

import { useState } from 'react';
import Link from 'next/link';
import { TrendingUp, Settings, Gauge, MapPin, Plus, CreditCard as Edit3, Trash2, Check, Fuel, TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';
import { carTitle, formatEuro, formatKm } from '@/lib/cars';
import { fuelLabel, transmissionLabel } from '@/lib/labels';
import { carSubtitle } from '@/lib/car-row';
import { MyGarageCar, getCarImages } from '@/types';
import { garageErrorMessage, useGarage } from '@/hooks/use-garage';
import { useAuth } from '@/hooks/use-auth';
import { useUser } from '@/hooks/use-user';
import { requestPhoneAction } from '@/hooks/use-phone-gate';
import { SignedOutPage } from '@/components/SignedOut';
import CarForm from '@/components/CarForm';

export default function GarageClient() {
  const { cars, selectedId, selectCar, addCar, updateCar, removeCar, canAddCar, limit, mounted, ownerPhone } = useGarage();
  const { isLoggedIn, userId, mounted: authReady } = useAuth();
  const { user: profile, profileReady } = useUser();
  const [showForm, setShowForm] = useState(false);
  const [editingCar, setEditingCar] = useState<MyGarageCar | null>(null);
  const [pendingDelete, setPendingDelete] = useState<MyGarageCar | null>(null);

  function openAddForm() {
    if (!canAddCar) {
      toast.error(`Dostignut limit od ${limit} vozila u garaži.`, {
        description: 'Obriši neko vozilo da bi dodao novo.',
      });
      return;
    }
    setEditingCar(null);
    requestPhoneAction(() => setShowForm(true), profileReady && profile.id === userId ? profile.phone : null);
  }

  function openEditForm(car: MyGarageCar) {
    setEditingCar(car);
    setShowForm(true);
  }

  async function handleSave(car: MyGarageCar) {
    const result = editingCar ? await updateCar(car) : await addCar(car);

    if (!result.ok) {
      toast.error(garageErrorMessage(result.error, editingCar ? 'update' : 'add', limit));
      return;
    }

    if (!editingCar) selectCar(result.id ?? car.id);
    toast.success(editingCar ? 'Izmene sačuvane.' : 'Vozilo dodato u garažu.');
    setShowForm(false);
    setEditingCar(null);
  }

  async function confirmRemove() {
    if (!pendingDelete) return;
    const result = await removeCar(pendingDelete.id);
    if (!result.ok) {
      toast.error(garageErrorMessage(result.error, 'remove', limit));
    } else {
      toast.success(`${pendingDelete.brand} ${pendingDelete.model} obrisan iz garaže.`);
    }
    setPendingDelete(null);
  }

  if (authReady && !isLoggedIn) {
    return (
      <SignedOutPage
        heading="Garaža"
        title="Garaža je vezana za nalog"
        description="Prijavi se da dodaš svoja vozila i vidiš koliko je doplata na svakom oglasu."
        reason="Prijavi se da otvoriš svoju garažu"
      />
    );
  }

  if (!mounted || !authReady) {
    return (
      <div className="flex flex-col">
        <header className="app-page-header safe-top">
          <div className="app-container py-4">
            <h1 className="text-xl font-bold tracking-tight text-app-primary dark:text-app-primary">Garaža</h1>
            <p className="text-xs text-app-muted mt-0.5">Tvoja kolekcija vozila</p>
          </div>
        </header>
        {/* Same grid as the loaded state, so nothing jumps when cars arrive. */}
        <div className="app-container grid grid-cols-1 gap-4 pt-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-72 animate-pulse rounded-2xl border border-surface bg-card-surface dark:border-surface dark:bg-card-surface" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <header className="app-page-header safe-top">
        <div className="app-container flex items-center justify-between py-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-app-primary dark:text-app-primary">Garaža</h1>
            <p className="text-xs text-app-muted mt-0.5">{cars.length} / {limit} vozila u garaži</p>
          </div>
          <button
            onClick={openAddForm}
            aria-disabled={!canAddCar}
              className={`btn-primary btn-primary-compact flex-shrink-0 text-xs ${
              canAddCar ? 'bg-brand-500 hover:bg-brand-600' : 'bg-brand-500/40'
            }`}
          >
            <Plus size={14} strokeWidth={2.5} className="flex-shrink-0" />
            <span className="whitespace-nowrap">Dodaj auto</span>
          </button>
        </div>
      </header>

      <div className="app-container pt-4 space-y-4 pb-4">
        {/*
          * Listings deliberately do not carry a phone number (it lives in the
          * private `profiles` row), so an account without one is invisible to
          * buyers: their "Pozovi" button is disabled everywhere. Only worth
          * saying once there is a listing to be unreachable about.
        */}
        {cars.length > 0 && !ownerPhone.trim() && (
          <div className="flex flex-col gap-2 rounded-2xl border border-tone-warn-surface bg-tone-warn-surface p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-2.5">
              <TriangleAlert size={16} className="mt-0.5 shrink-0 text-tone-warn" />
              <div>
                <p className="text-sm font-bold text-app-primary dark:text-app-primary">Kupci ne mogu da te pozovu</p>
                <p className="mt-0.5 text-xs leading-relaxed text-app-secondary dark:text-app-secondary">
                  Broj telefona nije unet, pa na tvojim oglasima stoji onemogućeno dugme „Pozovi“.
                  Dodaj broj u profilu da te dobiju jednim klikom.
                </p>
              </div>
            </div>
            <Link
              href="/profile"
              className="btn-primary btn-primary-compact flex-shrink-0 text-xs"
            >
              Dodaj broj
            </Link>
          </div>
        )}

        {cars.length === 0 && (
          <div className="rounded-2xl border border-surface dark:border-surface bg-card-surface dark:bg-card-surface px-5 py-8 text-center">
            <h2 className="text-base font-bold text-app-primary dark:text-app-primary">Garaža je prazna</h2>
            <p className="mt-1 text-sm text-app-muted">Dodaj auto da bi pratio njegovu vrednost i specifikacije.</p>
            <button onClick={openAddForm} className="btn-primary mt-5">Dodaj auto</button>
          </div>
        )}
        {/*
          * Same card as the feed: 16:9 image, title, one spec row, then the
          * figures. Garage-specific controls replace the feed's single link —
          * "Izaberi" only where the car is not already the active one, plus
          * uredi/obriši. Opening the photo or title goes to the same listing
          * page visitors see for every other car.
          */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
        {cars.map(car => {
          const isSelected = car.id === selectedId;
          const images = getCarImages(car);

          return (
            <article key={car.id} className="flex h-full min-w-0 flex-col overflow-hidden rounded-[22px] border border-surface bg-card-surface shadow-[0_14px_30px_rgba(0,0,0,.10)] transition-shadow duration-200 hover:shadow-xl dark:border-white/10 dark:shadow-[0_14px_30px_rgba(0,0,0,.16)]">
              <Link
                href={`/car/${car.id}`}
                aria-label={`Otvori oglas: ${car.brand} ${car.model}`}
                className="group relative block aspect-[16/10] w-full flex-shrink-0 sm:aspect-[16/9] overflow-hidden text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500"
              >
                <img src={car.image} alt={`${car.brand} ${car.model}`} className="absolute inset-0 h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                {images.length > 1 && (
                  <span className="absolute left-3 top-3 rounded-full bg-black/70 px-2 py-1 text-[10px] font-bold text-white backdrop-blur-sm">
                    {images.length} slika
                  </span>
                )}
                {isSelected && (
                  <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-brand-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-app-primary">
                    <Check size={11} strokeWidth={3} />
                    Aktivno
                  </span>
                )}
                <span className="sr-only">Pogledaj oglas</span>
              </Link>

              <div className="flex min-w-0 flex-1 flex-col bg-card-surface p-3.5 sm:p-4">
                <div className="min-w-0">
                  <h2 className="line-clamp-2 min-h-10 font-heading text-[19px] font-extrabold leading-tight text-app-primary dark:text-app-primary">
                    <Link href={`/car/${car.id}`} className="rounded-sm transition-colors hover:text-brand-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
                    {carTitle(car)}
                    </Link>
                  </h2>
                  <p className="mt-0.5 min-h-4 truncate text-xs text-app-muted">{carSubtitle(car)}</p>

                  <div className="mt-2.5 flex min-h-5 flex-wrap content-start items-center gap-x-2 gap-y-1.5 text-[11px] text-app-secondary dark:text-app-secondary">
                    <span className="flex min-w-0 items-center gap-1"><Gauge size={12} className="shrink-0 text-app-muted" /><span className="truncate">{formatKm(car.mileage)}</span></span>
                    <span className="text-app-muted/60" aria-hidden="true">·</span>
                    <span className="flex min-w-0 items-center gap-1"><Fuel size={12} className="shrink-0 text-app-muted" /><span className="truncate">{fuelLabel(car.specs.fuelType)}</span></span>
                    <span className="text-app-muted/60" aria-hidden="true">·</span>
                    <span className="flex min-w-0 items-center gap-1"><Settings size={12} className="shrink-0 text-app-muted" /><span className="truncate">{transmissionLabel(car.specs.transmission)}</span></span>
                    <span className="text-app-muted/60" aria-hidden="true">·</span>
                    <span className="flex min-w-0 items-center gap-1"><MapPin size={12} className="shrink-0 text-app-muted" /><span className="truncate">{car.city}</span></span>
                  </div>
                </div>

                <div className="mt-auto border-t border-surface pt-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="shrink-0 text-[23px] font-extrabold tracking-tight text-app-primary dark:text-app-primary">{formatEuro(car.price)}</p>
                    <span className="inline-flex min-w-0 items-center gap-1 truncate text-[11px] font-semibold text-app-muted">
                      <TrendingUp size={12} className="shrink-0 text-brand-text" />
                      <span className="truncate">{formatEuro(car.estimatedValue)}</span>
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => openEditForm(car)}
                      className="inline-flex h-10 min-w-0 items-center justify-center gap-2 rounded-xl border border-surface bg-elevated px-3 text-sm font-semibold text-app-secondary transition-colors hover:border-brand-500/40 hover:bg-hover-surface hover:text-app-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 focus-visible:ring-offset-2 dark:border-surface"
                    >
                      <Edit3 size={14} className="shrink-0" />
                      Uredi
                    </button>
                    <button
                      onClick={() => setPendingDelete(car)}
                      aria-label={`Obriši ${car.brand} ${car.model} iz garaže`}
                      className="inline-flex h-10 min-w-0 items-center justify-center gap-2 rounded-xl border border-tone-negative-surface bg-tone-negative-surface px-3 text-sm font-semibold text-tone-negative transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <Trash2 size={14} className="shrink-0" />
                      Obriši
                    </button>
                  </div>

                  {!isSelected && (
                    <button
                      onClick={() => selectCar(car.id)}
                      className="mt-2 flex min-h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-brand-500/35 bg-brand-500/10 px-4 text-sm font-semibold text-brand-text transition-colors hover:bg-brand-500/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 focus-visible:ring-offset-2"
                    >
                      <Check size={15} className="shrink-0" />
                      Postavi kao aktivno
                    </button>
                  )}
                </div>
              </div>
            </article>
          );
        })}
        </div>
      </div>

      {pendingDelete && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center p-4"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="delete-title"
        >
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setPendingDelete(null)} />
          <div className="relative w-full max-w-sm rounded-2xl border border-surface dark:border-surface bg-card-surface dark:bg-card-surface p-6 shadow-2xl">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-tone-negative-surface">
              <TriangleAlert size={22} className="text-tone-negative" />
            </div>
            <h3 id="delete-title" className="text-center text-base font-bold text-app-primary dark:text-app-primary">
              Obrisati vozilo?
            </h3>
            <p className="mt-2 text-center text-sm leading-relaxed text-app-secondary dark:text-app-secondary">
              {pendingDelete.brand} {pendingDelete.model} {pendingDelete.generation} će biti trajno
              uklonjen iz garaže, zajedno sa fotografijama.
            </p>
            <div className="mt-6 flex gap-2">
              <button
                onClick={() => setPendingDelete(null)}
                className="flex-1 rounded-xl bg-elevated py-3 text-sm font-semibold text-app-primary dark:text-app-primary transition-colors hover:bg-hover-surface"
              >
                Odustani
              </button>
              <button
                onClick={confirmRemove}
                className="flex-1 rounded-xl bg-tone-negative py-3 text-sm font-bold text-on-tone-negative transition-opacity hover:opacity-90"
              >
                Obriši
              </button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <CarForm
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditingCar(null); }}
          editingCar={editingCar}
        />
      )}
    </div>
  );
}

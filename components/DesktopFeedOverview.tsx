'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { CarFront, Check, ChevronDown, Flame, Pencil, Plus, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { usePreferences } from '@/hooks/use-preferences';
import { formatEuro, formatKm } from '@/lib/cars';
import { fuelLabel } from '@/lib/labels';
import { displayValue } from '@/lib/car-row';
import type { MyGarageCar } from '@/types';

interface DesktopFeedOverviewProps {
  cars: MyGarageCar[];
  selectedCar: MyGarageCar;
  selectedId: string;
  selectCar: (id: string) => void;
  canAddCar: boolean;
  onAddCar: () => void;
  onOpenSwipe: () => void;
}

const SEGMENT = 'min-w-0 px-4 py-3 sm:px-5 desktop:px-5 desktop:py-3.5';

export function DesktopFeedOverview({
  cars,
  selectedCar,
  selectedId,
  selectCar,
  canAddCar,
  onAddCar,
  onOpenSwipe,
}: DesktopFeedOverviewProps) {
  const { preferences, update, mounted: preferencesReady } = usePreferences();
  const [carPickerOpen, setCarPickerOpen] = useState(false);
  const [budgetEditorOpen, setBudgetEditorOpen] = useState(false);
  const [budgetDraft, setBudgetDraft] = useState('');
  const carPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setBudgetDraft(preferences.budget == null ? '' : String(preferences.budget));
  }, [preferences.budget]);

  useEffect(() => {
    if (!carPickerOpen) return;

    function closeOnOutsideClick(event: MouseEvent) {
      if (carPickerRef.current && !carPickerRef.current.contains(event.target as Node)) {
        setCarPickerOpen(false);
      }
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setCarPickerOpen(false);
    }

    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [carPickerOpen]);

  async function saveBudget(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const raw = budgetDraft.trim();
    const value = raw === '' ? null : Number(raw);
    if (value !== null && (!Number.isFinite(value) || value < 0 || value > 100000)) {
      toast.error('Unesi iznos između 0 i 100.000 €.');
      return;
    }

    const result = await update({ budget: value });
    if (!result.ok) {
      toast.error(result.message || 'Budžet nije sačuvan. Pokušaj ponovo.');
      return;
    }
    setBudgetEditorOpen(false);
  }

  const estimatedValue = selectedCar.estimatedValue || selectedCar.price;

  return (
    <section className="relative z-20 grid min-w-0 grid-cols-1 overflow-visible rounded-2xl border border-surface bg-card-surface shadow-sm dark:border-zinc-800 dark:bg-zinc-900 desktop:grid-cols-[minmax(0,1.25fr)_minmax(0,.75fr)_minmax(0,1fr)_minmax(190px,.8fr)]">
      <div className={`${SEGMENT} relative min-w-0`} ref={carPickerRef}>
        <p className="mb-2 text-xs font-semibold text-app-secondary dark:text-zinc-400">Tvoj auto za zamenu</p>
        <button
          type="button"
          onClick={() => setCarPickerOpen((open) => !open)}
          aria-expanded={carPickerOpen}
          aria-label={`Izabrano vozilo: ${selectedCar.brand} ${selectedCar.model}. Promeni vozilo`}
          className="flex w-full min-w-0 items-center gap-3 rounded-xl text-left transition-colors hover:bg-elevated/70 dark:hover:bg-zinc-800/70"
        >
          <span className="h-14 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-elevated dark:bg-zinc-950">
            {selectedCar.image ? (
              <img src={selectedCar.image} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full items-center justify-center text-app-muted"><CarFront size={22} /></span>
            )}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-bold text-app-primary dark:text-zinc-100">
              {selectedCar.brand} {selectedCar.model} {displayValue(selectedCar.generation)}
            </span>
            <span className="mt-1 block truncate text-xs text-app-secondary dark:text-zinc-400">
              {selectedCar.year} · {fuelLabel(selectedCar.specs.fuelType)} · {formatKm(selectedCar.mileage)}
            </span>
          </span>
          <ChevronDown size={17} className={`mr-1 flex-shrink-0 text-app-muted transition-transform ${carPickerOpen ? 'rotate-180' : ''}`} />
        </button>

        {carPickerOpen && (
          <div className="absolute left-4 right-4 top-full z-50 mt-2 max-h-72 overflow-y-auto rounded-2xl border border-surface bg-card-surface p-2 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 sm:left-5 sm:right-5 desktop:left-6 desktop:right-6">
            <p className="px-2 pb-1 pt-1 text-xs font-semibold text-app-secondary dark:text-zinc-400">Moja vozila</p>
            {cars.map((car) => {
              const active = car.id === selectedId;
              return (
                <button
                  key={car.id}
                  type="button"
                  onClick={() => {
                    selectCar(car.id);
                    setCarPickerOpen(false);
                  }}
                  className={`flex w-full min-w-0 items-center gap-2.5 rounded-xl p-2 text-left transition-colors ${active ? 'bg-brand-500/10' : 'hover:bg-elevated dark:hover:bg-zinc-800'}`}
                >
                  <span className="h-10 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-elevated dark:bg-zinc-950">
                    {car.image && <img src={car.image} alt="" className="h-full w-full object-cover" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-semibold text-app-primary dark:text-zinc-100">
                      {car.brand} {car.model} {displayValue(car.generation)}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-app-muted">{car.year} · {formatEuro(car.price)}</span>
                  </span>
                  {active && <Check size={16} className="flex-shrink-0 text-brand-text" />}
                </button>
              );
            })}
            {canAddCar && (
              <button
                type="button"
                onClick={() => {
                  setCarPickerOpen(false);
                  onAddCar();
                }}
                className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-surface px-3 py-2.5 text-xs font-semibold text-brand-text transition-colors hover:bg-brand-500/5 dark:border-zinc-800"
              >
                <Plus size={15} /> Dodaj auto
              </button>
            )}
          </div>
        )}
      </div>

      <div className={`${SEGMENT} relative flex min-w-0 flex-col justify-center border-t border-surface dark:border-zinc-800 desktop:border-t-0`}>
        <span aria-hidden="true" className="absolute left-0 top-1/2 hidden h-10 w-px -translate-y-1/2 bg-surface dark:bg-zinc-800 desktop:block" />
        <p className="text-xs font-medium text-app-secondary dark:text-zinc-400">Vrednost mog auta</p>
        <p className="mt-1 truncate text-xl font-bold tracking-tight text-app-primary dark:text-zinc-100">{formatEuro(estimatedValue)}</p>
        <p className="mt-1 text-[11px] text-app-muted">Vrednost iz oglasa</p>
      </div>

      <div className={`${SEGMENT} relative flex min-w-0 flex-col justify-center border-t border-surface dark:border-zinc-800 desktop:border-t-0`}>
        <span aria-hidden="true" className="absolute left-0 top-1/2 hidden h-10 w-px -translate-y-1/2 bg-surface dark:bg-zinc-800 desktop:block" />
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-medium text-app-secondary dark:text-zinc-400">Budžet za doplatu</p>
            <p className="mt-1 truncate text-lg font-bold tracking-tight text-app-primary dark:text-zinc-100">
              {!preferencesReady
                ? 'Učitavanje…'
                : preferences.noTopUp
                  ? 'Bez doplate'
                  : preferences.budget == null
                    ? 'Nije postavljen'
                    : `do ${formatEuro(preferences.budget)}`}
            </p>
          </div>
          {preferencesReady && !preferences.noTopUp && (
            <button
              type="button"
              onClick={() => setBudgetEditorOpen((open) => !open)}
              aria-label={budgetEditorOpen ? 'Zatvori izmenu budžeta' : 'Izmeni budžet za doplatu'}
              aria-expanded={budgetEditorOpen}
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-app-muted transition-colors hover:bg-elevated hover:text-brand-text dark:hover:bg-zinc-950"
            >
              <Pencil size={14} />
            </button>
          )}
        </div>
        <p className="mt-1 text-[11px] leading-relaxed text-app-muted">Koristi se za preporuke</p>
        {budgetEditorOpen && (
          <form onSubmit={saveBudget} className="mt-2 flex items-center gap-2">
            <input
              type="number"
              min={0}
              max={100000}
              step={500}
              inputMode="numeric"
              value={budgetDraft}
              onChange={(event) => setBudgetDraft(event.target.value)}
              placeholder="Iznos u €"
              aria-label="Budžet za doplatu u evrima"
              className="h-9 min-w-0 flex-1 rounded-xl border border-surface bg-elevated px-2.5 text-xs text-app-primary outline-none focus:border-brand-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
            />
            <button type="submit" aria-label="Sačuvaj budžet" className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-brand-500 text-black transition-colors hover:bg-brand-400">
              <Check size={16} />
            </button>
          </form>
        )}
      </div>

      <div className={`${SEGMENT} relative flex flex-col justify-center border-t border-surface dark:border-zinc-800 desktop:border-t-0`}>
        <span aria-hidden="true" className="absolute left-0 top-1/2 hidden h-10 w-px -translate-y-1/2 bg-surface dark:bg-zinc-800 desktop:block" />
        <button
          type="button"
          onClick={onOpenSwipe}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-zinc-950 px-4 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-zinc-800 hover:shadow-md dark:bg-brand-500 dark:text-black dark:hover:bg-brand-400"
        >
          <Sparkles size={17} />
          Smart Match
          <Flame size={16} className="ml-auto" />
        </button>
        <p className="mt-2 text-center text-[11px] leading-snug text-app-muted">Pregledaj predloge jedan po jedan</p>
      </div>
    </section>
  );
}

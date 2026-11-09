'use client';

import { useEffect, useRef, useState } from 'react';
import { CarFront, Check, ChevronDown, Plus, Sparkles } from 'lucide-react';
import { MobilePreferences } from '@/components/MobilePreferences';
import { formatEuro, formatKm, formatYear } from '@/lib/cars';
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

const SEGMENT = 'min-w-0 px-4 py-3 sm:px-5 desktop:px-5 desktop:py-2.5';

export function DesktopFeedOverview({
  cars,
  selectedCar,
  selectedId,
  selectCar,
  canAddCar,
  onAddCar,
  onOpenSwipe,
}: DesktopFeedOverviewProps) {
  const [carPickerOpen, setCarPickerOpen] = useState(false);
  const carPickerRef = useRef<HTMLDivElement>(null);

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

  return (
    <section className="relative z-20 grid min-w-0 grid-cols-1 overflow-visible rounded-2xl border border-surface bg-card-surface shadow-sm dark:border-surface dark:bg-card-surface desktop:grid-cols-[minmax(0,1fr)_minmax(165px,220px)]">
      <div className={`${SEGMENT} relative min-w-0`} ref={carPickerRef}>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <p className="text-xs font-semibold text-app-secondary dark:text-app-secondary">Tvoj auto za zamenu</p>
          <MobilePreferences key={selectedCar.id} hasGarageCar compactTrigger />
        </div>
        <button
          type="button"
          onClick={() => setCarPickerOpen((open) => !open)}
          aria-expanded={carPickerOpen}
          aria-label={`Izabrano vozilo: ${selectedCar.brand} ${selectedCar.model}. Promeni vozilo`}
          className="flex w-full min-w-0 items-center gap-3 rounded-xl p-0 text-left transition-opacity hover:opacity-80"
        >
          <span className="h-12 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-elevated dark:bg-app">
            {selectedCar.image ? (
              <img src={selectedCar.image} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full items-center justify-center text-app-muted"><CarFront size={22} /></span>
            )}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-bold text-app-primary dark:text-app-primary">
              {selectedCar.brand} {selectedCar.model} {displayValue(selectedCar.generation)}
            </span>
            <span className="mt-1 block truncate text-xs text-app-secondary dark:text-app-secondary">
              {formatYear(selectedCar.year)} · {fuelLabel(selectedCar.specs.fuelType)} · {formatKm(selectedCar.mileage)}
            </span>
          </span>
          <ChevronDown size={17} className={`mr-1 flex-shrink-0 text-app-muted transition-transform ${carPickerOpen ? 'rotate-180' : ''}`} />
        </button>

        {carPickerOpen && (
          <div className="absolute left-4 right-4 top-full z-50 mt-2 max-h-72 overflow-y-auto rounded-2xl border border-surface bg-card-surface p-2 shadow-xl dark:border-surface dark:bg-card-surface sm:left-5 sm:right-5 desktop:left-6 desktop:right-6">
            <p className="px-2 pb-1 pt-1 text-xs font-semibold text-app-secondary dark:text-app-secondary">Moja vozila</p>
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
                  className={`flex w-full min-w-0 items-center gap-2.5 rounded-xl p-2 text-left transition-colors ${active ? 'bg-brand-500/10' : 'hover:bg-elevated dark:hover:bg-elevated'}`}
                >
                  <span className="h-10 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-elevated dark:bg-app">
                    {car.image && <img src={car.image} alt="" className="h-full w-full object-cover" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-semibold text-app-primary dark:text-app-primary">
                      {car.brand} {car.model} {displayValue(car.generation)}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-app-muted">{formatYear(car.year)} · {formatEuro(car.price)}</span>
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
                className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-surface px-3 py-2.5 text-xs font-semibold text-brand-text transition-colors hover:bg-brand-500/5 dark:border-surface"
              >
                <Plus size={15} /> Dodaj auto
              </button>
            )}
          </div>
        )}
      </div>

      <div className={`${SEGMENT} relative flex flex-col justify-center border-t border-surface dark:border-surface desktop:border-t-0`}>
        <span aria-hidden="true" className="absolute left-0 top-1/2 hidden h-14 w-px -translate-y-1/2 bg-surface-border dark:bg-surface-border desktop:block" />
        <button
          type="button"
          onClick={onOpenSwipe}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-dark px-4 py-3 text-sm font-semibold text-brand-dark-primary transition-all duration-200 hover:bg-brand-dark/90 hover:shadow-md"
        >
          <Sparkles size={17} />
          Swipe režim
        </button>

      </div>
    </section>
  );
}

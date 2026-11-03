'use client';

import { CarFront, ChevronDown, Plus } from 'lucide-react';
import { carTitle, formatEuro, formatYear } from '@/lib/cars';
import type { MyGarageCar } from '@/types';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuRadioGroup, DropdownMenuRadioItem } from '@/components/ui/dropdown-menu';

interface HeaderCarSelectorProps {
  cars: MyGarageCar[];
  selectedCar: MyGarageCar | null;
  ready: boolean;
  canAddCar: boolean;
  selectCar: (id: string) => void;
  onAddCar: () => void;
}

export default function HeaderCarSelector({ cars, selectedCar, ready, canAddCar, selectCar, onAddCar }: HeaderCarSelectorProps) {
  const selectedLabel = selectedCar ? `${selectedCar.brand} ${selectedCar.model}` : '';
  if (!ready) return <span className="app-header-car animate-pulse lg:hidden" role="status" aria-label="Učitavanje vozila" />;

  if (!selectedCar) return (
    <button type="button" onClick={onAddCar} className="app-header-car app-header-car-empty lg:hidden">
      <Plus size={17} aria-hidden="true" /><span>Dodaj auto</span>
    </button>
  );

  return (
    <div className="min-w-0 lg:hidden">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" className="app-header-car" aria-label={`Moj auto: ${selectedLabel}. Izaberi vozilo`}>
            <span className="app-header-car-photo" aria-hidden="true">
              {selectedCar.image ? <img src={selectedCar.image} alt="" /> : <CarFront size={20} />}
            </span>
            <span className="min-w-0 flex-1 text-left"><small>Moj auto</small><strong>{selectedLabel}</strong></span>
            <ChevronDown size={12} className="shrink-0" aria-hidden="true" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={12} className="app-header-menu w-72 max-w-[calc(100vw-24px)] rounded-2xl p-2">
          <div className="px-3 py-2"><strong className="block text-sm">Moja vozila</strong><span className="text-xs text-app-secondary">Izaberi auto za zamenu</span></div>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup value={selectedCar.id} onValueChange={selectCar}>
            {cars.map(car => <DropdownMenuRadioItem key={car.id} value={car.id} className="min-h-[60px] gap-3 rounded-xl py-2 pr-3">
              {car.image ? <img src={car.image} alt="" className="h-9 w-9 shrink-0 rounded-lg object-cover" /> : <CarFront size={24} className="shrink-0 text-app-muted" />}
              <span className="min-w-0"><strong className="block truncate text-xs">{carTitle(car)}</strong><span className="text-[11px] text-app-secondary">{formatYear(car.year)} · {formatEuro(car.price)}</span></span>
            </DropdownMenuRadioItem>)}
          </DropdownMenuRadioGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled={!canAddCar} onSelect={onAddCar} className="min-h-[44px] justify-center gap-2 rounded-xl font-semibold text-brand-text">
            <Plus size={16} aria-hidden="true" />{canAddCar ? 'Dodaj vozilo' : 'Garaža je popunjena'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

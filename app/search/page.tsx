'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, MapPin, Gauge, Fuel, SlidersHorizontal, X, ArrowRight, TrendingUp } from 'lucide-react';
import { MARKETPLACE_CARS, formatEuro } from '@/lib/cars';
import { useGarage } from '@/hooks/use-garage';
import { BodyType, Car, MyGarageCar } from '@/types';

const BODY_TYPES: BodyType[] = ['Sedan', 'Caravan', 'Hatchback', 'SUV'];

function getTradeLabel(myCar: MyGarageCar, other: Car) {
  const diff = other.price - myCar.price;
  if (Math.abs(diff) < 200) return { label: 'Ravna zamena', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' };
  if (diff > 0) return { label: `Vlasnik doplaćuje ${formatEuro(diff)}`, color: 'text-sky-400', bg: 'bg-sky-500/10 border-sky-500/30' };
  return { label: `Tvoja doplata ${formatEuro(Math.abs(diff))}`, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/30' };
}

export default function SearchPage() {
  const { selectedCar, mounted } = useGarage();
  const [query, setQuery] = useState('');
  const [activeType, setActiveType] = useState<BodyType | null>(null);
  const [sortBy, setSortBy] = useState<'price-asc' | 'price-desc' | 'year-desc' | 'trade'>('trade');

  const results = useMemo(() => {
    const q = query.toLowerCase().trim();
    const filtered = MARKETPLACE_CARS.filter(car => {
      const matchesQuery =
        !q ||
        car.brand.toLowerCase().includes(q) ||
        car.model.toLowerCase().includes(q) ||
        car.city.toLowerCase().includes(q) ||
        car.generation.toLowerCase().includes(q);
      const matchesType = !activeType || car.bodyType === activeType;
      return matchesQuery && matchesType;
    });

    const sorted = [...filtered];
    switch (sortBy) {
      case 'price-asc':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        sorted.sort((a, b) => b.price - a.price);
        break;
      case 'year-desc':
        sorted.sort((a, b) => b.year - a.year);
        break;
      case 'trade':
        sorted.sort((a, b) => Math.abs(a.price - selectedCar.price) - Math.abs(b.price - selectedCar.price));
        break;
    }
    return sorted;
  }, [query, activeType, sortBy, selectedCar]);

  const hasFilters = query || activeType;

  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-40 bg-app border-b border-surface px-4 pt-4 pb-3 safe-top">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold tracking-tight text-app-primary">Pretraga</h1>
          {mounted && (
            <Link
              href="/garage"
              className="flex items-center gap-1.5 text-xs text-app-muted hover:text-orange-400 transition-colors"
            >
              <TrendingUp size={13} className="text-orange-400" />
              {selectedCar.brand} {selectedCar.model}
            </Link>
          )}
        </div>

        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-app-muted" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Marka, model, grad..."
            className="w-full bg-elevated border border-surface rounded-xl pl-9 pr-9 py-2.5 text-sm text-app-primary placeholder:text-app-muted focus:outline-none focus:border-orange-500 transition-colors"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-app-muted hover:text-app-secondary transition-colors"
            >
              <X size={15} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 mt-3 overflow-x-auto scrollbar-hide pb-0.5">
          <button
            onClick={() => setActiveType(null)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150 ${
              !activeType
                ? 'bg-orange-500 border-orange-500 text-white'
                : 'bg-elevated border-surface text-app-secondary hover:border-orange-500/40'
            }`}
          >
            <SlidersHorizontal size={11} />
            Sve
          </button>
          {BODY_TYPES.map(type => (
            <button
              key={type}
              onClick={() => setActiveType(prev => (prev === type ? null : type))}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150 ${
                activeType === type
                  ? 'bg-orange-500 border-orange-500 text-white'
                  : 'bg-elevated border-surface text-app-secondary hover:border-orange-500/40'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 mt-2.5">
          <span className="text-[10px] text-app-muted font-medium uppercase tracking-wider flex-shrink-0">Sortiraj:</span>
          {([
            { key: 'trade', label: 'Najbolja zamena' },
            { key: 'price-asc', label: 'Cena ↑' },
            { key: 'price-desc', label: 'Cena ↓' },
            { key: 'year-desc', label: 'Najnovije' },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setSortBy(key)}
              className={`text-[11px] font-semibold px-2 py-1 rounded-lg transition-all ${
                sortBy === key ? 'text-orange-400 bg-orange-500/10' : 'text-app-muted hover:text-app-secondary'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <p className="text-xs text-app-muted">
          {results.length === 0 ? 'Nema rezultata' : `${results.length} rezultata`}
        </p>
        {hasFilters && (
          <button
            onClick={() => { setQuery(''); setActiveType(null); }}
            className="text-xs text-orange-400 hover:text-orange-300 transition-colors flex items-center gap-1"
          >
            <X size={12} />
            Očisti
          </button>
        )}
      </div>

      <div className="px-4 space-y-3 pb-4">
        {results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-elevated flex items-center justify-center mb-4">
              <Search size={28} className="text-app-muted" />
            </div>
            <p className="text-app-secondary font-medium">Nema pronađenih vozila</p>
            <p className="text-app-muted text-sm mt-1">Pokušaj sa drugim terminom</p>
          </div>
        ) : (
          results.map(car => {
            const tl = getTradeLabel(selectedCar, car);
            return (
              <Link
                key={car.id}
                href={`/car/${car.id}`}
                className="block bg-card-surface rounded-2xl overflow-hidden border border-surface hover:border-orange-500/30 transition-all duration-200"
              >
                <div className="flex">
                  <div className="w-28 flex-shrink-0 relative">
                    <img src={car.image} alt={`${car.brand} ${car.model}`} className="w-full h-full object-cover" />
                    <div className={`absolute bottom-1 left-1 px-1.5 py-0.5 rounded-full border text-[9px] font-bold ${tl.bg} ${tl.color}`}>
                      {tl.label}
                    </div>
                  </div>
                  <div className="flex-1 p-3 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[10px] text-orange-400 font-bold uppercase tracking-widest">{car.bodyType}</p>
                        <h3 className="text-sm font-bold text-app-primary leading-tight truncate">
                          {car.year} {car.brand} {car.model}
                        </h3>
                        <p className="text-xs text-app-muted">{car.generation}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-orange-400 font-bold text-sm">{formatEuro(car.price)}</p>
                        <ArrowRight size={12} className="text-app-muted ml-auto mt-1" />
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 mt-2 flex-wrap">
                      <span className="flex items-center gap-1 text-[11px] text-app-secondary">
                        <Gauge size={11} className="text-app-muted" />
                        {car.mileage.toLocaleString()} km
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-app-secondary">
                        <Fuel size={11} className="text-app-muted" />
                        {car.specs.displacement} {car.specs.fuelType}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-app-secondary">
                        <MapPin size={11} className="text-app-muted" />
                        {car.city}
                      </span>
                    </div>

                    <p className="text-[11px] text-app-muted mt-1.5 line-clamp-1">{car.description}</p>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}

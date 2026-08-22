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
  if (Math.abs(diff) < 200) return { label: 'Straight Swap', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' };
  if (diff > 0) return { label: `They add ${formatEuro(diff)}`, color: 'text-sky-400', bg: 'bg-sky-500/10 border-sky-500/30' };
  return { label: `You add ${formatEuro(Math.abs(diff))}`, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' };
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
      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold tracking-tight text-white">Pretraga</h1>
          {mounted && (
            <Link
              href="/garage"
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-amber-400 transition-colors"
            >
              <TrendingUp size={13} className="text-amber-400" />
              {selectedCar.brand} {selectedCar.model}
            </Link>
          )}
        </div>

        {/* Search input */}
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Marka, model, grad..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-9 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 transition-colors"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Body type filter chips */}
        <div className="flex items-center gap-2 mt-3 overflow-x-auto scrollbar-hide pb-0.5">
          <button
            onClick={() => setActiveType(null)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150 ${
              !activeType
                ? 'bg-amber-500 border-amber-500 text-slate-950'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
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
                  ? 'bg-amber-500 border-amber-500 text-slate-950'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Sort row */}
        <div className="flex items-center gap-2 mt-2.5">
          <span className="text-[10px] text-slate-600 font-medium uppercase tracking-wider flex-shrink-0">Sort:</span>
          {([
            { key: 'trade', label: 'Best Trade' },
            { key: 'price-asc', label: 'Price ↑' },
            { key: 'price-desc', label: 'Price ↓' },
            { key: 'year-desc', label: 'Newest' },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setSortBy(key)}
              className={`text-[11px] font-semibold px-2 py-1 rounded-lg transition-all ${
                sortBy === key ? 'text-amber-400 bg-amber-500/10' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      {/* Results count */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <p className="text-xs text-slate-500">
          {results.length === 0 ? 'No results' : `${results.length} result${results.length !== 1 ? 's' : ''}`}
        </p>
        {hasFilters && (
          <button
            onClick={() => { setQuery(''); setActiveType(null); }}
            className="text-xs text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1"
          >
            <X size={12} />
            Clear
          </button>
        )}
      </div>

      {/* Results */}
      <div className="px-4 space-y-3 pb-4">
        {results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
              <Search size={28} className="text-slate-600" />
            </div>
            <p className="text-slate-400 font-medium">No cars found</p>
            <p className="text-slate-600 text-sm mt-1">Try a different search term</p>
          </div>
        ) : (
          results.map(car => {
            const tl = getTradeLabel(selectedCar, car);
            return (
              <Link
                key={car.id}
                href={`/car/${car.id}`}
                className="block bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 hover:border-slate-700 transition-all duration-200"
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
                        <p className="text-[10px] text-amber-400 font-bold uppercase tracking-widest">{car.bodyType}</p>
                        <h3 className="text-sm font-bold text-white leading-tight truncate">
                          {car.year} {car.brand} {car.model}
                        </h3>
                        <p className="text-xs text-slate-500">{car.generation}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-amber-400 font-bold text-sm">{formatEuro(car.price)}</p>
                        <ArrowRight size={12} className="text-slate-600 ml-auto mt-1" />
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 mt-2 flex-wrap">
                      <span className="flex items-center gap-1 text-[11px] text-slate-400">
                        <Gauge size={11} className="text-slate-600" />
                        {car.mileage.toLocaleString()} km
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-slate-400">
                        <Fuel size={11} className="text-slate-600" />
                        {car.specs.displacement} {car.specs.fuelType}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-slate-400">
                        <MapPin size={11} className="text-slate-600" />
                        {car.city}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 mt-1.5 line-clamp-1">{car.description}</p>
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

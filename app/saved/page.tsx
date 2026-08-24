'use client';

import { useState, useEffect } from 'react';
import { Heart, X, MapPin, Gauge, Fuel, Phone, BookmarkX, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { MARKETPLACE_CARS, formatEuro } from '@/lib/cars';
import { Car } from '@/types';

export default function SavedPage() {
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem('autotrampa_saved');
      if (stored) setSavedIds(JSON.parse(stored));
    } catch {}
  }, []);

  function remove(id: string) {
    setSavedIds(prev => {
      const next = prev.filter(x => x !== id);
      localStorage.setItem('autotrampa_saved', JSON.stringify(next));
      return next;
    });
  }

  const savedCars: Car[] = MARKETPLACE_CARS.filter(c => savedIds.includes(c.id));

  if (!mounted) return null;

  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800 px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">Sačuvano</h1>
            <p className="text-xs text-zinc-500 mt-0.5">Tvoja lista želja</p>
          </div>
          {savedCars.length > 0 && (
            <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center">
              <span className="text-xs font-bold text-zinc-950">{savedCars.length}</span>
            </div>
          )}
        </div>
      </header>

      <div className="px-4 pt-4 pb-4 space-y-3">
        {savedCars.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-full bg-zinc-800/60 flex items-center justify-center mb-5">
              <BookmarkX size={36} className="text-zinc-600" />
            </div>
            <p className="text-zinc-300 font-semibold text-base">Nema sačuvanih oglasa</p>
            <p className="text-zinc-500 text-sm mt-2 max-w-xs leading-relaxed">
              Pritisni <Heart size={13} className="inline text-rose-400 mx-0.5" /> ikonu na bilo kom oglasu na Početnoj da ga sačuvaš ovde.
            </p>
          </div>
        ) : (
          <>
            <p className="text-xs text-zinc-600 pb-1">{savedCars.length} sačuvanih oglasa</p>
            {savedCars.map(car => (
              <div key={car.id} className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800">
                <Link href={`/car/${car.id}`} className="block relative h-40">
                  <img src={car.image} alt={`${car.brand} ${car.model}`} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/80 to-transparent" />
                  <button
                    onClick={() => remove(car.id)}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-zinc-900/70 backdrop-blur-sm flex items-center justify-center text-zinc-400 hover:text-rose-400 transition-colors"
                    aria-label="Ukloni iz sačuvanih"
                  >
                    <X size={15} />
                  </button>
                  <div className="absolute bottom-3 left-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-orange-400">{car.bodyType}</p>
                    <h3 className="text-base font-bold text-white">
                      {car.year} {car.brand} {car.model}
                    </h3>
                  </div>
                </Link>

                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3 text-xs text-zinc-400">
                      <span className="flex items-center gap-1">
                        <Gauge size={12} className="text-zinc-500" />
                        {car.mileage.toLocaleString()} km
                      </span>
                      <span className="flex items-center gap-1">
                        <Fuel size={12} className="text-zinc-500" />
                        {car.specs.fuelType}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin size={12} className="text-zinc-500" />
                        {car.city}
                      </span>
                    </div>
                    <p className="text-orange-400 font-bold">{formatEuro(car.price)}</p>
                  </div>

                  <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed mb-3">{car.description}</p>

                  <div className="flex gap-2">
                    <Link
                      href={`/car/${car.id}`}
                      className="flex-1 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 text-zinc-950 text-sm font-bold rounded-xl py-2.5 transition-all duration-200 active:scale-95"
                    >
                      Pogledaj detalje
                      <ArrowRight size={14} />
                    </Link>
                    <a
                      href={`tel:${car.owner.phone}`}
                      className="w-11 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition-all duration-200"
                    >
                      <Phone size={14} />
                    </a>
                    <button
                      onClick={() => remove(car.id)}
                      className="flex items-center justify-center gap-1.5 px-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-sm font-semibold rounded-xl py-2.5 border border-rose-500/20 transition-all duration-200"
                    >
                      <Heart size={14} fill="currentColor" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

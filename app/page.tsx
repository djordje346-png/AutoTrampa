'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { Heart, ArrowLeftRight, X, CircleCheck as CheckCircle, Phone, MapPin, Gauge, Fuel, Settings2, ChevronDown, Check, Plus, LayoutGrid, Flame, ArrowLeft, ArrowRight, SlidersHorizontal } from 'lucide-react';
import { MARKETPLACE_CARS, formatEuro } from '@/lib/cars';
import { Car, MyGarageCar } from '@/types';
import { useGarage } from '@/hooks/use-garage';
import { useMessages } from '@/hooks/use-messages';
import CarForm from '@/components/CarForm';

function getTradeLabel(myCar: MyGarageCar, other: Car) {
  const diff = other.price - myCar.price;
  if (Math.abs(diff) < 200) return { label: 'Ravna zamena', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' };
  if (diff > 0) return { label: `Vlasnik doplaćuje ${formatEuro(diff)}`, color: 'text-sky-400', bg: 'bg-sky-500/10 border-sky-500/30' };
  return { label: `Tvoja doplata ${formatEuro(Math.abs(diff))}`, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/30' };
}

type ModalState = 'closed' | 'offer' | 'success';
type ViewMode = 'grid' | 'swipe';
type TradeFilter = 'all' | 'similar' | 'cheaper' | 'expensive';

const TRADE_FILTERS: { key: TradeFilter; label: string }[] = [
  { key: 'all', label: 'Sve' },
  { key: 'similar', label: 'Slična vrednost' },
  { key: 'cheaper', label: 'Vlasnik doplaćuje' },
  { key: 'expensive', label: 'Ja doplaćujem' },
];

const COMING_SOON_FILTERS = ['Gorivo', 'Marka', 'Godište', 'Kilometraža', 'Menjač'];

export default function FeedPage() {
  const { cars, selectedCar, selectedId, selectCar, addCar, mounted } = useGarage();
  const { createConversation } = useMessages();
  const [saved, setSaved] = useState<string[]>([]);
  const [modal, setModal] = useState<{ state: ModalState; car: Car | null }>({ state: 'closed', car: null });
  const [message, setMessage] = useState('');
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [swipeIndex, setSwipeIndex] = useState(0);
  const [tradeFilter, setTradeFilter] = useState<TradeFilter>('all');
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const selectorRef = useRef<HTMLDivElement>(null);
  const touchStart = useRef<number | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('autotrampa_saved');
      if (stored) setSaved(JSON.parse(stored));
    } catch {}
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (selectorRef.current && !selectorRef.current.contains(e.target as Node)) {
        setSelectorOpen(false);
      }
    }
    if (selectorOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [selectorOpen]);

  const filteredCars = useMemo(() => MARKETPLACE_CARS.filter(car => {
    if (tradeFilter === 'all') return true;
    const diff = car.price - selectedCar.price;
    if (tradeFilter === 'similar') return Math.abs(diff) < 200;
    if (tradeFilter === 'cheaper') return diff > 200;
    if (tradeFilter === 'expensive') return diff < -200;
    return true;
  }), [tradeFilter, selectedCar]);

  useEffect(() => {
    if (swipeIndex >= filteredCars.length) setSwipeIndex(0);
  }, [swipeIndex, filteredCars.length]);

  function toggleSave(id: string) {
    setSaved(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      localStorage.setItem('autotrampa_saved', JSON.stringify(next));
      return next;
    });
  }

  function openOffer(car: Car) {
    setMessage('');
    setModal({ state: 'offer', car });
  }

  function sendOffer() {
    if (modal.car) {
      const tl = getTradeLabel(selectedCar, modal.car);
      createConversation({
        id: `conv-${modal.car.id}-${Date.now()}`,
        carId: modal.car.id,
        carTitle: `${modal.car.year} ${modal.car.brand} ${modal.car.model} ${modal.car.generation}`,
        carImage: modal.car.image,
        ownerName: modal.car.owner.name,
        tradeSummary: tl.label,
      });
    }
    setModal(prev => ({ ...prev, state: 'success' }));
  }

  function closeModal() {
    setModal({ state: 'closed', car: null });
  }

  function handleAddCar(form: MyGarageCar) {
    addCar(form);
    selectCar(form.id);
    setShowAddForm(false);
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStart.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStart.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStart.current;
    if (Math.abs(delta) > 60) {
      if (delta < 0 && swipeIndex < filteredCars.length - 1) {
        setSwipeIndex(i => i + 1);
      } else if (delta > 0 && swipeIndex > 0) {
        setSwipeIndex(i => i - 1);
      }
    }
    touchStart.current = null;
  }

  const trade = modal.car ? getTradeLabel(selectedCar, modal.car) : null;
  const swipeCar = filteredCars[swipeIndex] || filteredCars[0];
  const swipeTl = swipeCar ? getTradeLabel(selectedCar, swipeCar) : null;

  return (
    <div className="flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800 px-4 py-3 safe-top">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-shrink-0">
            <h1 className="text-xl font-bold tracking-tight text-white">AutoTrampa</h1>
            <p className="text-[11px] text-zinc-500 mt-0.5">Pronađi sledeću zamenu</p>
          </div>

          <div className="flex items-center gap-2">
            {/* View mode toggle */}
            <div className="flex bg-zinc-800 rounded-lg p-0.5 border border-zinc-700">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center justify-center w-8 h-7 rounded-md transition-all duration-200 ${
                  viewMode === 'grid' ? 'bg-orange-500 text-zinc-950' : 'text-zinc-500 hover:text-zinc-300'
                }`}
                aria-label="Prikaz mreže"
              >
                <LayoutGrid size={14} />
              </button>
              <button
                onClick={() => setViewMode('swipe')}
                className={`flex items-center justify-center w-8 h-7 rounded-md transition-all duration-200 ${
                  viewMode === 'swipe' ? 'bg-orange-500 text-zinc-950' : 'text-zinc-500 hover:text-zinc-300'
                }`}
                aria-label="Svajp režim"
              >
                <Flame size={14} />
              </button>
            </div>

            {/* Tvoje Vozilo dropdown */}
            <div className="relative flex-shrink-0" ref={selectorRef}>
              <button
                onClick={() => setSelectorOpen(p => !p)}
                className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl pl-2 pr-2.5 py-1.5 transition-all duration-200 border border-zinc-700"
                aria-label="Izaberi vozilo"
              >
                {mounted ? (
                  <>
                    <div className="w-7 h-7 rounded-lg overflow-hidden flex-shrink-0 bg-zinc-700">
                      {selectedCar.image && (
                        <img src={selectedCar.image} alt={selectedCar.model} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="text-left min-w-0 max-w-[80px]">
                      <p className="text-[8px] text-zinc-500 font-medium uppercase tracking-widest leading-none mb-0.5">Moj auto</p>
                      <p className="text-[11px] font-bold text-white truncate leading-tight">
                        {selectedCar.brand} {selectedCar.model}
                      </p>
                    </div>
                    <ChevronDown size={14} className={`text-zinc-500 transition-transform duration-200 ${selectorOpen ? 'rotate-180' : ''}`} />
                  </>
                ) : (
                  <>
                    <div className="w-7 h-7 rounded-lg bg-zinc-700 animate-pulse" />
                    <div className="h-3 w-14 bg-zinc-700 rounded animate-pulse" />
                  </>
                )}
              </button>

              {selectorOpen && mounted && (
                <div className="absolute right-0 top-full mt-2 w-72 max-w-[calc(100vw-2rem)] bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-zinc-800">
                    <p className="text-xs font-bold text-white">Moja vozila</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">Izaberi vozilo za trampu</p>
                  </div>
                  <div className="max-h-64 overflow-y-auto p-2 space-y-1">
                    {cars.map(car => {
                      const isActive = car.id === selectedId;
                      return (
                        <button
                          key={car.id}
                          onClick={() => { selectCar(car.id); setSelectorOpen(false); }}
                          className={`w-full flex items-center gap-2.5 rounded-xl p-2 transition-all duration-150 text-left ${
                            isActive ? 'bg-orange-500/10' : 'hover:bg-zinc-800'
                          }`}
                        >
                          <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-zinc-700">
                            {car.image && <img src={car.image} alt={car.model} className="w-full h-full object-cover" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-white truncate">{car.brand} {car.model} {car.generation}</p>
                            <p className="text-[10px] text-zinc-500">{car.year} · {formatEuro(car.price)}</p>
                          </div>
                          {isActive && (
                            <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
                              <Check size={12} className="text-zinc-950" strokeWidth={3} />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <div className="border-t border-zinc-800 p-2">
                    <button
                      onClick={() => { setSelectorOpen(false); setShowAddForm(true); }}
                      className="w-full flex items-center justify-center gap-2 text-orange-400 text-xs font-semibold rounded-xl py-2.5 border border-dashed border-zinc-600 hover:bg-zinc-800 transition-all"
                    >
                      <Plus size={15} />
                      Dodaj vozilo
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Trade filter bar */}
      <div className="sticky top-[57px] z-30 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/50">
        <div className="flex items-center gap-1.5 px-4 py-2 overflow-x-auto scrollbar-hide">
          {TRADE_FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => { setTradeFilter(key); setSwipeIndex(0); }}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all duration-150 ${
                tradeFilter === key
                  ? 'bg-orange-500 text-zinc-950'
                  : 'bg-zinc-800/70 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
              }`}
            >
              {label}
            </button>
          ))}
          <button
            onClick={() => setShowMoreFilters(true)}
            className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-semibold bg-zinc-800/70 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 transition-all duration-150"
            aria-label="Više filtera"
          >
            <SlidersHorizontal size={11} />
          </button>
        </div>
      </div>

      {/* No results */}
      {filteredCars.length === 0 && (
        <div className="px-4 pt-8 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-full bg-zinc-800 flex items-center justify-center mb-3">
            <SlidersHorizontal size={24} className="text-zinc-600" />
          </div>
          <p className="text-zinc-400 font-semibold text-sm">Nema vozila po ovom filteru</p>
          <button onClick={() => { setTradeFilter('all'); setSwipeIndex(0); }} className="mt-2 text-orange-400 text-xs font-semibold">Poništi filtere</button>
        </div>
      )}

      {/* More Filters bottom-sheet */}
      {showMoreFilters && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm" onClick={() => setShowMoreFilters(false)} />
          <div className="relative w-full max-w-md bg-zinc-900 rounded-t-3xl border-t border-zinc-700 p-6 pb-8 max-h-[85vh] overflow-y-auto safe-bottom">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-lg font-bold text-white">Više filtera</h3>
              <button onClick={() => setShowMoreFilters(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-800 text-zinc-400 hover:text-white transition-colors" aria-label="Zatvori">
                <X size={16} />
              </button>
            </div>
            <p className="text-xs text-zinc-500 mb-5">Napredne opcije filtera uskoro dolaze.</p>
            <div className="space-y-2">
              {COMING_SOON_FILTERS.map(label => (
                <div key={label} className="flex items-center justify-between rounded-xl bg-zinc-800/50 border border-zinc-800 px-4 py-3 cursor-not-allowed">
                  <span className="text-sm font-medium text-zinc-400">{label}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400/80 bg-orange-500/10 px-2 py-1 rounded-md">Uskoro</span>
                </div>
              ))}
            </div>
            <button onClick={() => setShowMoreFilters(false)} className="w-full mt-6 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-3 rounded-xl text-sm transition-colors">
              Gotovo
            </button>
          </div>
        </div>
      )}

      {/* SWIPE MODE */}
      {viewMode === 'swipe' && swipeCar && filteredCars.length > 0 && (
        <div className="flex flex-col items-center px-4 mt-4 pb-4">
          <div className="flex gap-1.5 mb-3 flex-wrap justify-center">
            {filteredCars.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === swipeIndex ? 'w-6 bg-orange-400' : 'w-1.5 bg-zinc-700'}`} />
            ))}
          </div>

          <div className="w-full max-w-sm bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-800 shadow-xl" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
            <Link href={`/car/${swipeCar.id}`} className="block">
              <div className="relative h-72 sm:h-80">
                <img src={swipeCar.image} alt={`${swipeCar.brand} ${swipeCar.model}`} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/10 to-transparent" />
                <button
                  onClick={(e) => { e.preventDefault(); toggleSave(swipeCar.id); }}
                  className={`absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm transition-all duration-200 ${
                    saved.includes(swipeCar.id) ? 'bg-rose-500 text-white' : 'bg-zinc-900/60 text-zinc-400 hover:text-rose-400'
                  }`}
                  aria-label="Sačuvaj"
                >
                  <Heart size={18} fill={saved.includes(swipeCar.id) ? 'currentColor' : 'none'} />
                </button>
                {swipeTl && (
                  <div className={`absolute bottom-3 left-3 px-3 py-1.5 rounded-full border text-sm font-bold ${swipeTl.bg} ${swipeTl.color}`}>
                    {swipeTl.label}
                  </div>
                )}
              </div>
            </Link>

            <div className="p-5">
              <div className="flex items-start justify-between mb-2 gap-2">
                <div className="min-w-0">
                  <h2 className="text-lg font-black text-white tracking-tight truncate">{swipeCar.year} {swipeCar.brand} {swipeCar.model}</h2>
                  <p className="text-xs text-zinc-500 mt-0.5">{swipeCar.generation} · {swipeCar.color}</p>
                </div>
                <p className="text-orange-400 font-black text-xl flex-shrink-0">{formatEuro(swipeCar.price)}</p>
              </div>

              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <div className="flex items-center gap-1.5 text-[11px] text-zinc-400"><Gauge size={12} className="text-zinc-500" />{swipeCar.mileage.toLocaleString()} km</div>
                <div className="flex items-center gap-1.5 text-[11px] text-zinc-400"><Fuel size={12} className="text-zinc-500" />{swipeCar.specs.fuelType}</div>
                <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 ml-auto"><MapPin size={12} className="text-zinc-500" />{swipeCar.city}</div>
              </div>

              <p className="text-xs text-zinc-400 mt-3 line-clamp-2 leading-relaxed">{swipeCar.description}</p>

              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-zinc-800">
                <button onClick={() => openOffer(swipeCar)} className="flex-1 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 text-zinc-950 text-sm font-bold rounded-xl py-2.5 transition-all duration-200 active:scale-95">
                  <ArrowLeftRight size={15} /> Pošalji ponudu
                </button>
                <Link href={`/car/${swipeCar.id}`} className="flex items-center justify-center gap-1.5 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-semibold rounded-xl py-2.5 transition-all">
                  Detalji
                </Link>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-4">
            <button onClick={() => { if (swipeIndex > 0) setSwipeIndex(i => i - 1); }} disabled={swipeIndex === 0} className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all" aria-label="Prethodno">
              <ArrowLeft size={18} />
            </button>
            <span className="text-xs text-zinc-500 font-medium">{swipeIndex + 1} / {filteredCars.length}</span>
            <button onClick={() => { if (swipeIndex < filteredCars.length - 1) setSwipeIndex(i => i + 1); }} disabled={swipeIndex === filteredCars.length - 1} className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all" aria-label="Sledeće">
              <ArrowRight size={18} />
            </button>
          </div>
          <p className="text-[10px] text-zinc-600 mt-2">Prevuci levo/desno za pregled</p>
        </div>
      )}

      {/* GRID/LIST MODE — vertical list on all screens, horizontal layout on md+ */}
      {viewMode === 'grid' && (
        <div className="px-4 mt-3 space-y-3 pb-4 md:px-6 lg:px-8">
          {filteredCars.map(car => {
            const tl = getTradeLabel(selectedCar, car);
            const isSaved = saved.includes(car.id);
            return (
              <article key={car.id} className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 hover:border-zinc-700 transition-all duration-200 md:flex md:flex-row md:max-h-[200px]">
                {/* Image */}
                <Link href={`/car/${car.id}`} className="block relative h-44 sm:h-48 md:w-72 md:h-auto md:flex-shrink-0">
                  <img src={car.image} alt={`${car.brand} ${car.model}`} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent md:bg-gradient-to-r" />
                  <button
                    onClick={(e) => { e.preventDefault(); toggleSave(car.id); }}
                    className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-sm transition-all duration-200 ${
                      isSaved ? 'bg-rose-500 text-white' : 'bg-zinc-900/60 text-zinc-400 hover:text-rose-400'
                    }`}
                    aria-label={isSaved ? 'Ukloni iz sačuvanih' : 'Sačuvaj oglas'}
                  >
                    <Heart size={16} fill={isSaved ? 'currentColor' : 'none'} />
                  </button>
                </Link>

                {/* Info */}
                <div className="p-4 md:flex-1 md:flex md:flex-row md:items-center md:gap-4 md:p-4">
                  {/* Left: title + specs */}
                  <div className="md:flex-1 md:min-w-0">
                    <Link href={`/car/${car.id}`}>
                      <h2 className="font-bold text-white text-base leading-tight hover:text-orange-400 transition-colors">
                        {car.year} {car.brand} {car.model}
                      </h2>
                    </Link>
                    <p className="text-xs text-zinc-500 mt-0.5">{car.generation} · {car.color}</p>

                    <div className="flex items-center gap-3 mt-2 text-xs text-zinc-400 flex-wrap">
                      <span className="flex items-center gap-1"><Gauge size={13} className="text-zinc-500" />{car.mileage.toLocaleString()} km</span>
                      <span className="flex items-center gap-1"><Fuel size={13} className="text-zinc-500" />{car.specs.fuelType}</span>
                      <span className="flex items-center gap-1"><Settings2 size={13} className="text-zinc-500" />{car.specs.transmission}</span>
                      <span className="flex items-center gap-1"><MapPin size={13} className="text-zinc-500" />{car.city}</span>
                    </div>

                    <p className="text-xs text-zinc-400 mt-2 line-clamp-1 leading-relaxed hidden md:block">{car.description}</p>
                  </div>

                  {/* Right: price + match + CTA */}
                  <div className="mt-3 md:mt-0 md:flex md:flex-col md:items-end md:justify-center md:gap-2 md:flex-shrink-0 md:min-w-[200px]">
                    <div className="flex items-center justify-between gap-2 md:block md:text-right">
                      <p className="text-orange-400 font-bold text-lg md:text-xl">{formatEuro(car.price)}</p>
                      <div className={`md:mt-1 inline-block px-2.5 py-1 rounded-full border text-xs font-semibold ${tl.bg} ${tl.color}`}>
                        {tl.label}
                      </div>
                    </div>

                    <div className="flex gap-2 mt-2 md:mt-3 md:w-full">
                      <button
                        onClick={() => openOffer(car)}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-orange-500 hover:bg-orange-400 text-zinc-950 text-xs font-bold rounded-lg py-2 md:py-2.5 transition-all duration-200 active:scale-95 whitespace-nowrap"
                      >
                        <ArrowLeftRight size={14} />
                        Pošalji ponudu
                      </button>
                      <Link href={`/car/${car.id}`} className="px-3 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-lg transition-all duration-200 whitespace-nowrap">
                        Detalji
                      </Link>
                      <a href={`tel:${car.owner.phone}`} className="w-9 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-all duration-200" aria-label="Pozovi vlasnika">
                        <Phone size={15} />
                      </a>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Add New Car Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm" onClick={() => setShowAddForm(false)} />
          <div className="relative w-full max-w-md bg-zinc-900 rounded-t-3xl border-t border-zinc-700 p-6 max-h-[85vh] overflow-y-auto safe-bottom">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white">Dodaj novo vozilo</h3>
              <button onClick={() => setShowAddForm(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-800 text-zinc-400 hover:text-white transition-colors" aria-label="Zatvori">
                <X size={16} />
              </button>
            </div>
            <CarForm onSave={handleAddCar} onCancel={() => setShowAddForm(false)} />
          </div>
        </div>
      )}

      {/* Trade Offer Modal */}
      {modal.state !== 'closed' && modal.car && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative w-full max-w-md bg-zinc-900 rounded-t-3xl border-t border-zinc-700 p-6 max-h-[85vh] overflow-y-auto safe-bottom">
            {modal.state === 'offer' ? (
              <>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-bold text-white">Ponuda za trampu</h3>
                  <button onClick={closeModal} className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-800 text-zinc-400 hover:text-white transition-colors" aria-label="Zatvori">
                    <X size={16} />
                  </button>
                </div>
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex-1 rounded-xl bg-zinc-800 p-3 text-center min-w-0">
                    <p className="text-xs text-zinc-500 mb-1">Tvoj auto</p>
                    <p className="text-sm font-semibold text-white truncate">{selectedCar.brand} {selectedCar.model}</p>
                    <p className="text-orange-400 font-bold text-sm">{formatEuro(selectedCar.price)}</p>
                  </div>
                  <ArrowLeftRight size={20} className="text-zinc-500 flex-shrink-0" />
                  <div className="flex-1 rounded-xl bg-zinc-800 p-3 text-center min-w-0">
                    <p className="text-xs text-zinc-500 mb-1">Njegov auto</p>
                    <p className="text-sm font-semibold text-white truncate">{modal.car.brand} {modal.car.model}</p>
                    <p className="text-orange-400 font-bold text-sm">{formatEuro(modal.car.price)}</p>
                  </div>
                </div>
                {trade && (
                  <div className={`rounded-xl border px-4 py-2.5 text-center text-sm font-semibold mb-5 ${trade.bg} ${trade.color}`}>
                    {trade.label}
                  </div>
                )}
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Dodaj poruku uz ponudu... (opciono)"
                  className="w-full h-24 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 resize-none focus:outline-none focus:border-orange-500 transition-colors"
                />
                <button onClick={sendOffer} className="w-full mt-4 bg-orange-500 hover:bg-orange-400 text-zinc-950 font-bold py-3 rounded-xl text-sm transition-all duration-200 active:scale-95">
                  Pošalji ponudu
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center py-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center mb-4">
                  <CheckCircle size={36} className="text-emerald-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Ponuda poslata!</h3>
                <p className="text-sm text-zinc-400 text-center mb-1">
                  Tvoja ponuda za <span className="text-white font-medium">{modal.car.brand} {modal.car.model}</span> je poslata korisniku {modal.car.owner.name}.
                </p>
                <p className="text-xs text-zinc-500 mb-6">Otvori Poruke da nastaviš razgovor.</p>
                <button onClick={closeModal} className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-3 rounded-xl text-sm transition-colors">
                  Zatvori
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

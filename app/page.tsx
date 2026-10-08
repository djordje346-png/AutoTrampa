'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { Heart, ArrowLeftRight, X, CircleCheck as CheckCircle, Phone, MapPin, Gauge, Fuel, Settings2, ChevronDown, Check, Plus, LayoutGrid, Flame, RotateCcw, SlidersHorizontal, Wallet } from 'lucide-react';
import { formatEuro, formatKm } from '@/lib/cars';
import { getTradeLabel, TRADE_TOLERANCE, sortByBudget, isWithinBudget } from '@/lib/trade';
import { fuelLabel, transmissionLabel } from '@/lib/labels';
import { carSubtitle, displayValue } from '@/lib/car-row';
import { Car, MyGarageCar } from '@/types';
import { useGarage } from '@/hooks/use-garage';
import { useMarketplace } from '@/hooks/use-marketplace';
import { useSaved } from '@/hooks/use-saved';
import { usePreferences, type TradeFilter } from '@/hooks/use-preferences';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import CarForm from '@/components/CarForm';
import { BottomSheet } from '@/components/BottomSheet';
import { TradeOfferSheet } from '@/components/TradeOfferSheet';

type ViewMode = 'grid' | 'swipe';

const TRADE_FILTERS: { key: TradeFilter; label: string }[] = [
  { key: 'all', label: 'Sve' },
  { key: 'similar', label: 'Slična vrednost' },
  { key: 'cheaper', label: 'Vlasnik doplaćuje' },
  { key: 'expensive', label: 'Ja doplaćujem' },
];

const COMING_SOON_FILTERS = ['Gorivo', 'Marka', 'Godište', 'Kilometraža', 'Menjač'];

export default function FeedPage() {
  const { cars, selectedCar, selectedId, selectCar, addCar, canAddCar, limit, mounted } = useGarage();
  const { cars: marketplaceCars } = useMarketplace();
  const { saved, isSaved, toggleSave, save: saveCar } = useSaved();
  const { isLoggedIn, mounted: authReady, requireAuth } = useAuth();
  const [offerCar, setOfferCar] = useState<Car | null>(null);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [swipeIndex, setSwipeIndex] = useState(0);
  const { preferences, update: updatePreferences } = usePreferences();
  const tradeFilter = preferences.tradeFilter;
  const budget = preferences.budget;
  const noTopUp = preferences.noTopUp;
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showSwipeHint, setShowSwipeHint] = useState(false);
  const selectorRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef<{ x: number } | null>(null);

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

  const tradeAware = authReady && isLoggedIn;

  const baseFiltered = useMemo(() => marketplaceCars.filter(car => {
    // Without a garage car the trade filter has no meaning — show everything.
    if (!tradeAware || tradeFilter === 'all') return true;
    const diff = car.price - selectedCar.price;
    if (tradeFilter === 'similar') return Math.abs(diff) < TRADE_TOLERANCE;
    if (tradeFilter === 'cheaper') return diff < -TRADE_TOLERANCE;
    if (tradeFilter === 'expensive') return diff > TRADE_TOLERANCE;
    return true;
  }), [marketplaceCars, tradeFilter, selectedCar, tradeAware]);

  const filteredCars = useMemo(() => {
    if (!tradeAware || (!budget && !noTopUp)) return baseFiltered;
    return sortByBudget(baseFiltered, selectedCar, budget, noTopUp);
  }, [baseFiltered, tradeAware, selectedCar, budget, noTopUp]);

  useEffect(() => {
    if (viewMode === 'swipe') {
      setShowSwipeHint(true);
      const t = setTimeout(() => setShowSwipeHint(false), 2800);
      return () => clearTimeout(t);
    } else {
      setShowSwipeHint(false);
    }
  }, [viewMode]);

  function openOffer(car: Car) {
    if (!requireAuth('Prijavi se da pošalješ ponudu za zamenu', () => setOfferCar(car))) return;
    setOfferCar(car);
  }

  async function handleAddCar(form: MyGarageCar) {
    const result = await addCar(form);
    if (!result.ok) {
      toast.error(
        result.error === 'limit'
          ? `Dostignut limit od ${limit} vozila u garaži.`
          : 'Vozilo nije sačuvano.',
      );
      return;
    }
    selectCar(result.id ?? form.id);
    setShowAddForm(false);
    toast.success('Vozilo dodato u garažu.');
  }

  function flyAway(dir: 'left' | 'right') {
    setIsAnimating(true);
    setDragX(dir === 'right' ? 500 : -500);
    setTimeout(() => {
      setSwipeIndex(i => i + 1);
      setDragX(0);
      setIsAnimating(false);
    }, 300);
  }

  function handleSwipeLike() {
    if (swipeCar) saveCar(swipeCar.id);
    flyAway('right');
  }

  function handleSwipeSkip() {
    flyAway('left');
  }

  function handlePointerDown(e: React.PointerEvent) {
    if (isAnimating) return;
    const target = e.target as HTMLElement;
    if (target.closest('button, a')) return;
    dragStart.current = { x: e.clientX };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!dragStart.current || isAnimating) return;
    setDragX(e.clientX - dragStart.current.x);
  }

  function handlePointerUp(e: React.PointerEvent) {
    if (!dragStart.current || isAnimating) return;
    const dx = e.clientX - dragStart.current.x;
    dragStart.current = null;
    if (dx > 100) {
      handleSwipeLike();
    } else if (dx < -100) {
      handleSwipeSkip();
    } else {
      setDragX(0);
    }
  }

  function exitSwipeMode() {
    setViewMode('grid');
    setSwipeIndex(0);
    setDragX(0);
  }

  const showTrade = tradeAware;
  const swipeCar = filteredCars[swipeIndex];
  const swipeTl = swipeCar && showTrade ? getTradeLabel(selectedCar, swipeCar) : null;

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-surface dark:border-zinc-800 bg-app dark:bg-zinc-950 safe-top">
        <header className="px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold tracking-tight text-app-primary dark:text-zinc-100">AutoTrampa</h1>
              <p className="text-[11px] text-app-muted mt-0.5">Pronađi sledeću zamenu</p>
            </div>

            <div className="flex items-center gap-2">
              {/* View mode toggle */}
              <div className="flex bg-elevated rounded-lg p-0.5 border border-surface dark:border-zinc-800">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`flex items-center justify-center w-8 h-7 rounded-md transition-all duration-200 ${
                    viewMode === 'grid' ? 'bg-brand-500 text-black' : 'text-app-muted hover:text-app-secondary dark:text-zinc-400'
                  }`}
                  aria-label="Prikaz mreže"
                >
                  <LayoutGrid size={14} />
                </button>
                <button
                  onClick={() => setViewMode('swipe')}
                  className={`flex items-center justify-center w-8 h-7 rounded-md transition-all duration-200 ${
                    viewMode === 'swipe' ? 'bg-brand-500 text-black' : 'text-app-muted hover:text-app-secondary dark:text-zinc-400'
                  }`}
                  aria-label="Svajp režim"
                >
                  <Flame size={14} />
                </button>
              </div>

              {/* Tvoje Vozilo dropdown */}
              {showTrade && cars.length === 0 ? (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="flex flex-shrink-0 items-center gap-2 rounded-xl border border-brand-500/30 bg-brand-500/10 px-3 py-2 text-xs font-semibold text-brand-text transition-all hover:bg-brand-500/15"
                  aria-label="Dodaj auto u svoju garažu"
                >
                  <Plus size={15} />
                  Dodaj auto
                </button>
              ) : showTrade && (
              <div className="relative flex-shrink-0" ref={selectorRef}>
                <button
                  onClick={() => setSelectorOpen(p => !p)}
                  className="flex items-center gap-2 bg-elevated hover:bg-hover-surface rounded-xl pl-2 pr-2.5 py-1.5 transition-all duration-200 border border-surface dark:border-zinc-800"
                  aria-label="Izaberi vozilo"
                >
                  {mounted ? (
                    <>
                      <div className="w-7 h-7 rounded-lg overflow-hidden flex-shrink-0 bg-hover-surface">
                        {selectedCar.image && (
                          <img src={selectedCar.image} alt={selectedCar.model} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="text-left min-w-0 max-w-[80px]">
                        <p className="text-[8px] text-app-muted font-medium uppercase tracking-widest leading-none mb-0.5">Moj auto</p>
                        <p className="text-[11px] font-bold text-app-primary dark:text-zinc-100 truncate leading-tight">
                          {selectedCar.brand} {selectedCar.model}
                        </p>
                      </div>
                      <ChevronDown size={14} className={`text-app-muted transition-transform duration-200 ${selectorOpen ? 'rotate-180' : ''}`} />
                    </>
                  ) : (
                    <>
                      <div className="w-7 h-7 rounded-lg bg-hover-surface animate-pulse" />
                      <div className="h-3 w-14 bg-hover-surface rounded animate-pulse" />
                    </>
                  )}
                </button>

                {selectorOpen && mounted && (
                  <div className="absolute right-0 top-full mt-2 w-72 max-w-[calc(100vw-2rem)] bg-card-surface dark:bg-zinc-900 border border-surface dark:border-zinc-800 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-surface dark:border-zinc-800">
                      <p className="text-xs font-bold text-app-primary dark:text-zinc-100">Moja vozila</p>
                      <p className="text-[10px] text-app-muted mt-0.5">Izaberi vozilo za trampu</p>
                    </div>
                    <div className="max-h-64 overflow-y-auto p-2 space-y-1">
                      {cars.map(car => {
                        const isActive = car.id === selectedId;
                        return (
                          <button
                            key={car.id}
                            onClick={() => { selectCar(car.id); setSelectorOpen(false); }}
                            className={`w-full flex items-center gap-2.5 rounded-xl p-2 transition-all duration-150 text-left ${
                              isActive ? 'bg-brand-500/10' : 'hover:bg-hover-surface'
                            }`}
                          >
                            <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-hover-surface">
                              {car.image && <img src={car.image} alt={car.model} className="w-full h-full object-cover" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-app-primary dark:text-zinc-100 truncate">{[car.brand, car.model, displayValue(car.generation)].filter(Boolean).join(' ')}</p>
                              <p className="text-[10px] text-app-muted dark:text-zinc-400">{car.year} · {formatEuro(car.price)}</p>
                            </div>
                            {isActive && (
                              <div className="w-5 h-5 rounded-full bg-brand-500 flex items-center justify-center flex-shrink-0">
                                <Check size={12} className="text-white" strokeWidth={3} />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    <div className="border-t border-surface dark:border-zinc-800 p-2">
                      <button
                        onClick={() => { setSelectorOpen(false); setShowAddForm(true); }}
                        className="w-full flex items-center justify-center gap-2 text-brand-text text-xs font-semibold rounded-xl py-2.5 border border-dashed border-surface dark:border-zinc-800 hover:bg-hover-surface transition-all"
                      >
                        <Plus size={15} />
                        Dodaj vozilo
                      </button>
                    </div>
                  </div>
                )}
              </div>
              )}
            </div>
          </div>
        </header>

        {/* Trade filter bar */}
        {showTrade && (
        <div className="border-t border-surface dark:border-zinc-800/50">
          <div className="flex items-center gap-1.5 px-4 py-2 overflow-x-auto scrollbar-hide">
            {TRADE_FILTERS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => { updatePreferences({ tradeFilter: key }); setSwipeIndex(0); }}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all duration-150 ${
                  tradeFilter === key
                    ? 'bg-brand-500 text-black'
                    : 'bg-elevated/70 text-app-secondary hover:bg-hover-surface hover:text-app-primary'
                }`}
              >
                {label}
              </button>
            ))}
            <button
              onClick={() => setShowMoreFilters(true)}
              className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-semibold bg-elevated/70 text-app-secondary hover:bg-hover-surface hover:text-app-primary transition-all duration-150"
              aria-label="Više filtera"
            >
              <SlidersHorizontal size={11} />
            </button>
          </div>
        </div>
        )}
      </div>

      {authReady && !isLoggedIn && (
        <div className="mx-4 mt-3 flex flex-col gap-2 rounded-2xl border border-brand-500/30 bg-brand-500/10 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold text-brand-text">Koliko je doplata za tebe?</p>
            <p className="mt-0.5 text-xs text-app-secondary dark:text-zinc-400">
              Dodaj svoj auto u garažu i svaki oglas ti pokazuje razliku u ceni.
            </p>
          </div>
          <button
            onClick={() => requireAuth('Prijavi se i dodaj svoj auto')}
            className="btn-primary flex-shrink-0 text-xs"
          >
            Prijavi se
          </button>
        </div>
      )}

      {/* No results */}
      {filteredCars.length === 0 && (
        <div className="px-4 pt-8 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-full bg-elevated flex items-center justify-center mb-3">
            <SlidersHorizontal size={24} className="text-app-muted" />
          </div>
          <p className="text-app-secondary dark:text-zinc-400 font-semibold text-sm">Nema vozila po ovom filteru</p>
          <button onClick={() => { updatePreferences({ tradeFilter: 'all' }); setSwipeIndex(0); }} className="mt-2 text-brand-text text-xs font-semibold">Poništi filtere</button>
        </div>
      )}

      <BottomSheet
        open={showMoreFilters}
        onClose={() => setShowMoreFilters(false)}
        title="Više filtera"
      >
        <p className="-mt-3 mb-5 text-xs text-app-muted">Napredne opcije filtera uskoro dolaze.</p>
        <div className="space-y-2">
          {COMING_SOON_FILTERS.map(label => (
            <div
              key={label}
              className="flex cursor-not-allowed items-center justify-between rounded-xl border border-surface dark:border-zinc-800 bg-elevated/50 px-4 py-3"
            >
              <span className="text-sm font-medium text-app-secondary dark:text-zinc-400">{label}</span>
              <span className="rounded-md bg-brand-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-text">
                Uskoro
              </span>
            </div>
          ))}
        </div>
        <button
          onClick={() => setShowMoreFilters(false)}
          className="mt-6 w-full rounded-xl bg-elevated py-3 text-sm font-semibold text-app-primary dark:text-zinc-100 transition-colors hover:bg-hover-surface"
        >
          Gotovo
        </button>
      </BottomSheet>

      {/* SWIPE MODE — FULLSCREEN */}
      {viewMode === 'swipe' && filteredCars.length > 0 && (
        <div className="fixed inset-0 z-[60] bg-app dark:bg-zinc-950 flex flex-col safe-top safe-bottom">
          {/* Swipe header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-surface dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <Flame size={18} className="text-brand-text" />
              <span className="text-sm font-bold text-app-primary dark:text-zinc-100">Svajp režim</span>
            </div>
            <button
              onClick={exitSwipeMode}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-elevated hover:bg-hover-surface text-app-secondary hover:text-app-primary transition-all duration-200"
              aria-label="Izađi iz svajp režima"
            >
              <X size={18} />
            </button>
          </div>

          {/* Swipe content */}
          <div className="flex-1 flex flex-col items-center justify-center px-4 py-4 overflow-hidden">
            {swipeIndex < filteredCars.length && swipeCar ? (
              <>
                {/* Progress dots */}
                <div className="flex gap-1.5 mb-4 flex-wrap justify-center max-w-sm">
                  {filteredCars.map((_, i) => (
                    <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === swipeIndex ? 'w-6 bg-brand-400' : i < swipeIndex ? 'w-1.5 bg-brand-400/40' : 'w-1.5 bg-elevated'
                    }`} />
                  ))}
                </div>

                {/* Card stack */}
                <div className="relative w-full max-w-sm">
                  {/* Next card peeking behind */}
                  {filteredCars[swipeIndex + 1] && (
                    <div className="absolute inset-0 bg-card-surface dark:bg-zinc-900 rounded-3xl overflow-hidden border border-surface dark:border-zinc-800 shadow-lg" style={{ transform: 'translateY(10px) scale(0.95)', opacity: 0.5 }}>
                      <div className="relative h-72 sm:h-80">
                        <img src={filteredCars[swipeIndex + 1].image} alt="" className="w-full h-full object-cover opacity-60" draggable={false} />
                      </div>
                    </div>
                  )}

                  {/* Active card */}
                  <div
                    className="relative bg-card-surface dark:bg-zinc-900 rounded-3xl overflow-hidden border border-surface dark:border-zinc-800 shadow-xl select-none touch-none"
                    style={{
                      transform: `translateX(${dragX}px) rotate(${dragX * 0.08}deg)`,
                      transition: isAnimating ? 'transform 0.3s ease-out, opacity 0.3s ease-out' : 'none',
                      opacity: isAnimating ? 0 : 1,
                      zIndex: 10,
                    }}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                  >
                    {/* Image */}
                    <div className="relative h-72 sm:h-80">
                      <img src={swipeCar.image} alt={`${swipeCar.brand} ${swipeCar.model}`} className="w-full h-full object-cover pointer-events-none" draggable={false} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent pointer-events-none" />

                      {/* LIKE badge */}
                      <div
                        className="absolute top-8 left-6 -rotate-12 border-4 border-emerald-400 text-tone-positive font-black text-3xl px-4 py-1.5 rounded-xl pointer-events-none"
                        style={{ opacity: Math.max(0, Math.min(1, dragX / 100)) }}
                      >
                        LIKE
                      </div>

                      {/* SKIP badge */}
                      <div
                        className="absolute top-8 right-6 rotate-12 border-4 border-rose-500 text-rose-500 font-black text-3xl px-4 py-1.5 rounded-xl pointer-events-none"
                        style={{ opacity: Math.max(0, Math.min(1, -dragX / 100)) }}
                      >
                        PRESKOK
                      </div>

                      {/* Save button */}
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleSave(swipeCar.id); }}
                        className={`absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm transition-all duration-200 ${
                          isSaved(swipeCar.id) ? 'bg-rose-500 text-white' : 'bg-black/60 text-white hover:text-tone-negative'
                        }`}
                        aria-label="Sačuvaj"
                      >
                        <Heart size={18} fill={isSaved(swipeCar.id) ? 'currentColor' : 'none'} />
                      </button>

                      {/* Trade label */}
                      {swipeTl && (
                        <div className="absolute bottom-3 left-3 flex items-center gap-2">
                          <div className={`px-3 py-1.5 rounded-full border text-sm font-bold ${swipeTl.bg} ${swipeTl.color}`}>
                            {swipeTl.label}
                          </div>
                          {tradeAware && budget != null && isWithinBudget(swipeCar, selectedCar, budget) && swipeCar.price > selectedCar.price && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold uppercase tracking-wider text-tone-positive bg-emerald-500/10 border border-emerald-500/30 rounded-full px-2 py-1">
                              <Wallet size={10} /> U budžetu
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-2 gap-2">
                        <div className="min-w-0">
                          <h2 className="text-lg font-black text-app-primary dark:text-zinc-100 tracking-tight truncate">{swipeCar.year} {swipeCar.brand} {swipeCar.model}</h2>
                          <p className="text-xs text-app-muted mt-0.5">{swipeCar.generation} · {swipeCar.color}</p>
                        </div>
                        <p className="text-app-primary font-black text-xl flex-shrink-0">{formatEuro(swipeCar.price)}</p>
                      </div>

                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        <div className="flex items-center gap-1.5 text-[11px] text-app-secondary dark:text-zinc-400"><Gauge size={12} className="text-app-muted" />{formatKm(swipeCar.mileage)}</div>
                        <div className="flex items-center gap-1.5 text-[11px] text-app-secondary dark:text-zinc-400"><Fuel size={12} className="text-app-muted" />{fuelLabel(swipeCar.specs.fuelType)}</div>
                        <div className="flex items-center gap-1.5 text-[11px] text-app-secondary dark:text-zinc-400 ml-auto"><MapPin size={12} className="text-app-muted" />{swipeCar.city}</div>
                      </div>

                      <p className="text-xs text-app-secondary dark:text-zinc-400 mt-3 line-clamp-2 leading-relaxed">{swipeCar.description}</p>

                      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-surface dark:border-zinc-800">
                        <button onClick={() => openOffer(swipeCar)} className="btn-primary btn-primary-compact flex-1 text-sm">
                          <ArrowLeftRight size={15} /> Pošalji ponudu
                        </button>
                        <Link href={`/car/${swipeCar.id}`} className="flex items-center justify-center gap-1.5 px-3 bg-elevated hover:bg-hover-surface text-app-secondary dark:text-zinc-400 text-sm font-semibold rounded-xl py-2.5 transition-all">
                          Detalji
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-5 mt-6">
                  <button
                    onClick={handleSwipeSkip}
                    className="w-14 h-14 rounded-full bg-rose-500/10 border-2 border-rose-500/30 flex items-center justify-center text-rose-500 hover:bg-rose-500/20 hover:scale-110 active:scale-95 transition-all duration-200"
                    aria-label="Preskoči"
                  >
                    <X size={28} strokeWidth={3} />
                  </button>
                  <span className="text-xs text-app-muted font-medium min-w-[50px] text-center">{swipeIndex + 1} / {filteredCars.length}</span>
                  <button
                    onClick={handleSwipeLike}
                    className="w-14 h-14 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center text-tone-positive hover:bg-emerald-500/20 hover:scale-110 active:scale-95 transition-all duration-200"
                    aria-label="Sviđa mi se"
                  >
                    <Heart size={28} strokeWidth={3} fill={isSaved(swipeCar.id) ? 'currentColor' : 'none'} />
                  </button>
                </div>
                <p className="text-[10px] text-app-muted mt-3 opacity-70">Prevuci desno = LIKE · levo = PRESKOK</p>
              </>
            ) : (
              /* All done screen */
              <div className="flex flex-col items-center text-center py-8">
                <div className="w-20 h-20 rounded-full bg-emerald-500/15 flex items-center justify-center mb-4">
                  <CheckCircle size={40} className="text-tone-positive" />
                </div>
                <h2 className="text-xl font-bold text-app-primary dark:text-zinc-100 mb-2">Sve pregledano!</h2>
                <p className="text-sm text-app-secondary dark:text-zinc-400 mb-1">Pregledao si sve oglase.</p>
                <p className="text-xs text-app-muted mb-6">Sačuvano: {saved.length} oglasa</p>
                <div className="flex gap-3">
                  <button onClick={() => setSwipeIndex(0)} className="flex items-center gap-2 bg-elevated hover:bg-hover-surface text-app-primary dark:text-zinc-100 font-semibold px-4 py-2.5 rounded-xl text-sm transition-all">
                    <RotateCcw size={15} /> Ispočetka
                  </button>
                  <button onClick={exitSwipeMode} className="btn-primary text-sm">
                    Nazad na feed
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Swipe hint overlay */}
          {showSwipeHint && swipeIndex < filteredCars.length && (
            <div className="absolute inset-0 z-[70] flex items-center justify-center pointer-events-none">
              <div className="flex items-center gap-10">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-16 h-16 rounded-full bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center animate-pulse">
                    <X size={32} className="text-rose-500" strokeWidth={3} />
                  </div>
                  <p className="text-xs font-bold text-tone-negative uppercase tracking-wider">← Preskoči</p>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center animate-pulse">
                    <Heart size={32} className="text-tone-positive" fill="currentColor" />
                  </div>
                  <p className="text-xs font-bold text-tone-positive uppercase tracking-wider">Like →</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* GRID/LIST MODE */}
      {viewMode === 'grid' && (
        <div className="mx-auto mt-3 grid w-full max-w-7xl grid-cols-1 gap-4 px-4 pb-4 sm:grid-cols-2 sm:gap-4 sm:px-5 lg:grid-cols-3 lg:gap-5 lg:px-6">
          {filteredCars.map(car => {
            const tl = showTrade ? getTradeLabel(selectedCar, car) : null;
            const carSaved = isSaved(car.id);
            return (
              <article key={car.id} className="flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-surface bg-card-surface transition-all duration-200 hover:border-brand-500/30 dark:border-zinc-800 dark:bg-zinc-900">
                {/* Image */}
                <Link href={`/car/${car.id}`} className="relative block aspect-[16/9] w-full flex-shrink-0 overflow-hidden">
                  <img src={car.image} alt={`${car.brand} ${car.model}`} className="absolute inset-0 h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                  {!car.ownerId && (
                    <span className="absolute left-3 top-3 rounded-full bg-black/70 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
                      Demo
                    </span>
                  )}
                  <button
                    onClick={(e) => { e.preventDefault(); toggleSave(car.id); }}
                    className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-sm transition-all duration-200 ${
                      carSaved ? 'bg-rose-500 text-white' : 'bg-black/60 text-white hover:text-tone-negative'
                    }`}
                    aria-label={carSaved ? 'Ukloni iz sačuvanih' : 'Sačuvaj oglas'}
                  >
                    <Heart size={16} fill={carSaved ? 'currentColor' : 'none'} />
                  </button>
                </Link>

                {/* Info */}
                <div className="flex min-w-0 flex-1 flex-col p-3 sm:p-4">
                  {/* Title and specs reserve consistent space so cards align in each row. */}
                  <div className="min-w-0">
                    <Link href={`/car/${car.id}`}>
                      <h2 className="line-clamp-2 min-h-10 font-bold text-base leading-tight text-app-primary transition-colors hover:text-brand-text dark:text-zinc-100">
                        {car.year} {car.brand} {car.model}
                      </h2>
                    </Link>
                    <p className="mt-0.5 min-h-4 truncate text-xs text-app-muted">{carSubtitle(car)}</p>

                    <div className="mt-2 flex min-h-9 flex-wrap content-start items-center gap-x-3 gap-y-1.5 text-xs text-app-secondary dark:text-zinc-400">
                      <span className="flex min-w-0 items-center gap-1"><Gauge size={13} className="shrink-0 text-app-muted" /><span className="truncate">{formatKm(car.mileage)}</span></span>
                      <span className="flex min-w-0 items-center gap-1"><Fuel size={13} className="shrink-0 text-app-muted" /><span className="truncate">{fuelLabel(car.specs.fuelType)}</span></span>
                      <span className="flex min-w-0 items-center gap-1"><Settings2 size={13} className="shrink-0 text-app-muted" /><span className="truncate">{transmissionLabel(car.specs.transmission)}</span></span>
                      <span className="flex min-w-0 items-center gap-1"><MapPin size={13} className="shrink-0 text-app-muted" /><span className="truncate">{car.city}</span></span>
                    </div>

                    <p className="mt-2 hidden min-h-[1.25rem] line-clamp-1 text-xs leading-relaxed text-app-secondary dark:text-zinc-400 sm:block">{car.description}</p>
                  </div>

                  {/* Price, status and actions stay at the bottom of cards in the same row. */}
                  <div className="mt-auto pt-3">
                    <div className="flex min-h-8 items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <p className="truncate text-lg font-bold text-app-primary dark:text-zinc-100">{formatEuro(car.price)}</p>
                        {tradeAware && budget != null && isWithinBudget(car, selectedCar, budget) && car.price > selectedCar.price && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wider text-tone-positive bg-emerald-500/10 border border-emerald-500/30 rounded-full px-1.5 py-0.5">
                            <Wallet size={9} /> U budžetu
                          </span>
                        )}
                      </div>
                      {tl && (
                        <div className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${tl.bg} ${tl.color}`}>
                          {tl.label}
                        </div>
                      )}
                    </div>

                    <div className="mt-2 flex min-w-0 gap-2">
                      <button
                        onClick={() => openOffer(car)}
                        className="btn-primary btn-primary-compact flex-1 min-w-0 whitespace-nowrap text-xs xl:text-sm"
                      >
                        <ArrowLeftRight size={14} className="shrink-0" />
                        <span className="truncate">Pošalji ponudu</span>
                      </button>
                      <Link href={`/car/${car.id}`} className="flex shrink-0 items-center justify-center whitespace-nowrap rounded-lg bg-elevated px-3 py-2 text-xs font-semibold text-app-secondary transition-all duration-200 hover:bg-hover-surface dark:text-zinc-400 sm:py-3 sm:text-xs xl:px-4 xl:text-sm">
                        Detalji
                      </Link>
                      {car.owner.phone && <a href={`tel:${car.owner.phone}`} className="flex w-9 shrink-0 items-center justify-center rounded-lg bg-elevated py-2 text-app-secondary transition-all duration-200 hover:bg-hover-surface dark:text-zinc-400 sm:w-11 sm:py-3" aria-label="Pozovi vlasnika">
                        <Phone size={15} />
                      </a>}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* CarForm renders its own full-screen portal — no sheet wrapper. */}
      {showAddForm && (
        <CarForm onSave={handleAddCar} onCancel={() => setShowAddForm(false)} />
      )}

      <TradeOfferSheet car={offerCar} myCar={selectedCar} onClose={() => setOfferCar(null)} />
    </div>
  );
}

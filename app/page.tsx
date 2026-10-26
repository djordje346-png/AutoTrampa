'use client';

import { useCallback, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, HeartHandshake, ArrowLeft, ArrowRight, ArrowUpRight, ArrowLeftRight, X, CircleCheck as CheckCircle, MapPin, Gauge, Fuel, Settings2, CalendarDays, ChevronDown, Check, Plus, LayoutGrid, Flame, RotateCcw, SlidersHorizontal } from 'lucide-react';
import { carTitle, formatEuro, formatKm, formatYear } from '@/lib/cars';
import { getTradeLabel } from '@/lib/trade';
import { fuelLabel, transmissionLabel } from '@/lib/labels';
import { carSubtitle, displayValue } from '@/lib/car-row';
import { Car, MyGarageCar } from '@/types';
import { garageErrorMessage, useGarage } from '@/hooks/use-garage';
import { useMarketplace } from '@/hooks/use-marketplace';
import { useSaved } from '@/hooks/use-saved';
import { useSwipes } from '@/hooks/use-swipes';
import { useMatchLike } from '@/hooks/use-match-like';
import { usePreferences } from '@/hooks/use-preferences';
import { useFilteredCars } from '@/hooks/use-filtered-cars';
import { countActiveFilters, useSearchPrefs, type SearchFilters } from '@/hooks/use-search-prefs';
import { useAuth } from '@/hooks/use-auth';
import { useUser } from '@/hooks/use-user';
import { toast } from 'sonner';
import CarForm from '@/components/CarForm';
import { BottomSheet } from '@/components/BottomSheet';
import { TradeOfferSheet } from '@/components/TradeOfferSheet';
import TradeBadge from '@/components/TradeBadge';
import { requestPhoneAction } from '@/hooks/use-phone-gate';
import { FilterSheetBody } from '@/components/FilterPanel';
import { DesktopFeedSidebar } from '@/components/DesktopFeedSidebar';
import { DesktopFeedOverview } from '@/components/DesktopFeedOverview';
import { DesktopRadiusControl } from '@/components/DesktopRadiusControl';
import { FeedCardPhoto } from '@/components/FeedCardPhoto';
import ListingCardSpecs from '@/components/ListingCardSpecs';
import PublicLanding from '@/components/PublicLanding';

type ViewMode = 'grid' | 'swipe';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Quick trade filter in the feed header; the full set lives in the sidebar. */
const TRADE_FILTERS: { key: SearchFilters['trade']; label: string }[] = [
  { key: 'all', label: 'Sve' },
  { key: 'similar', label: 'Slična vrednost' },
  { key: 'cheaper', label: 'Vlasnik doplaćuje' },
  { key: 'expensive', label: 'Ja doplaćujem' },
];

export default function FeedPage() {
  const router = useRouter();
  const { isLoggedIn, mounted: authReady, requireAuth } = useAuth();
  const { cars: marketplaceCars, ready: marketplaceReady } = useMarketplace(authReady);
  const [pendingAddCar, setPendingAddCar] = useState(false);

  const resumeAddCar = useCallback(() => setPendingAddCar(true), []);
  const handlePublicAddCar = useCallback(() => {
    if (requireAuth('Prijavi se i dodaj svoj oglas', resumeAddCar, '/?intent=add-car')) resumeAddCar();
  }, [requireAuth, resumeAddCar]);
  const handlePendingAddCarHandled = useCallback(() => setPendingAddCar(false), []);

  useEffect(() => {
    if (!authReady || typeof window === 'undefined') return;

    const url = new URL(window.location.href);
    const pendingIntent = url.searchParams.get('intent');
    const hasCallbackStatus = url.searchParams.has('auth');
    if (pendingIntent !== 'add-car' && !hasCallbackStatus) return;

    if (pendingIntent === 'add-car' && isLoggedIn) setPendingAddCar(true);
    url.searchParams.delete('intent');
    url.searchParams.delete('auth');
    const cleanUrl = `${url.pathname}${url.search}${url.hash}`;
    router.replace(cleanUrl, { scroll: false });
  }, [authReady, isLoggedIn, router]);

  if (!authReady) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-card-surface" role="status" aria-label="Učitavanje početne stranice">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-surface border-t-brand-500" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <PublicLanding
        cars={marketplaceCars}
        listingsReady={marketplaceReady}
        onAddCar={handlePublicAddCar}
        onSignIn={() => requireAuth('Prijavi se na AutoTrampu')}
        onRegister={() => requireAuth('Napravi AutoTrampa nalog', undefined, undefined, 'register')}
      />
    );
  }

  return (
    <AuthenticatedFeed
      marketplaceCars={marketplaceCars}
      marketplaceReady={marketplaceReady}
      pendingAddCar={pendingAddCar}
      onPendingAddCarHandled={handlePendingAddCarHandled}
    />
  );
}

function AuthenticatedFeed({
  marketplaceCars,
  marketplaceReady,
  pendingAddCar,
  onPendingAddCarHandled,
}: {
  marketplaceCars: Car[];
  marketplaceReady: boolean;
  pendingAddCar: boolean;
  onPendingAddCarHandled: () => void;
}) {
  const router = useRouter();
  const { cars, selectedCar, selectedId, selectCar, addCar, canAddCar, limit, mounted } = useGarage();
  const { saved, save } = useSaved();
  const { isLoggedIn, userId, mounted: authReady, requireAuth } = useAuth();
  const { user: profile, profileReady } = useUser();
  const { likedCarIds, recordSwipe, refresh: refreshSwipes } = useSwipes();
  const { likeCar, isLiking } = useMatchLike(recordSwipe, save);
  const [offerCar, setOfferCar] = useState<Car | null>(null);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [desktopFiltersOpen, setDesktopFiltersOpen] = useState(false);
  const [swipeIndex, setSwipeIndex] = useState(0);
  const { preferences } = usePreferences();
  const budget = preferences.budget;
  const noTopUp = preferences.noTopUp;
  const { filters, update: updateFilters, reset: resetFilters, filtersOpen, setFiltersOpen } = useSearchPrefs();
  const [dragX, setDragX] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showSwipeHint, setShowSwipeHint] = useState(false);
  const [sessionReviewedIds, setSessionReviewedIds] = useState<Set<string>>(new Set());
  const selectorRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef<{ x: number } | null>(null);
  const pendingAddCarHandled = useRef(false);

  useEffect(() => {
    if (!pendingAddCar) {
      pendingAddCarHandled.current = false;
      return;
    }
    if (pendingAddCarHandled.current || !profileReady || profile.id !== userId) return;

    pendingAddCarHandled.current = true;
    onPendingAddCarHandled();
    requestPhoneAction(() => setShowAddForm(true), profile.phone);
  }, [pendingAddCar, profile.id, profile.phone, profileReady, userId, onPendingAddCarHandled]);

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

  /**
   * Trade maths needs BOTH a signed-in user and a car of their own to compare
   * against. Without the car there is no "doplata" to speak of, so the trade
   * label and the value filters stay off rather than inventing one.
   */
  const tradeAware = authReady && isLoggedIn && selectedCar !== null;

  /**
   * All filtering and ordering lives in one hook, shared with Pretraga, so a
   * filter means the same thing on both screens. `selectedCar` is passed as
   * null when the garage is empty, which switches the trade filter off.
   */
  const filteredCars = useFilteredCars(
    marketplaceCars,
    filters,
    tradeAware ? selectedCar : null,
    budget,
    noTopUp,
    selectedCar?.city ?? '',
    preferences.radius,
  );

  const activeFilters = countActiveFilters(filters);
  const advancedFilterCount = countActiveFilters({ ...filters, trade: 'all' });
  const activeCarName = selectedCar
    ? [selectedCar.brand, selectedCar.model].filter(Boolean).join(' ')
    : '';

  useEffect(() => {
    if (viewMode === 'swipe') {
      setShowSwipeHint(true);
      const t = setTimeout(() => setShowSwipeHint(false), 2800);
      return () => clearTimeout(t);
    } else {
      setShowSwipeHint(false);
    }
  }, [viewMode]);

  useEffect(() => {
    setSwipeIndex(0);
    setSessionReviewedIds(new Set());
  }, [selectedId, filters]);

  function openOffer(car: Car) {
    if (!requireAuth('Prijavi se da pošalješ ponudu za zamenu', () => requestPhoneAction(() => setOfferCar(car)))) return;
    requestPhoneAction(() => setOfferCar(car));
  }

  function handleAddListing() {
    const continueToListing = () => {
      const savedPhone = profileReady && profile.id === userId ? profile.phone : null;
      requestPhoneAction(() => setShowAddForm(true), savedPhone);
    };
    if (!requireAuth('Prijavi se i dodaj svoj oglas', continueToListing)) return;
    continueToListing();
  }

  async function handleAddCar(form: MyGarageCar) {
    const result = await addCar(form);
    if (!result.ok) {
      toast.error(garageErrorMessage(result.error, 'add', limit));
      return;
    }
    selectCar(result.id ?? form.id);
    setShowAddForm(false);
    toast.success('Vozilo dodato u garažu.');
  }

  function enterSwipeMode() {
    setSwipeIndex(0);
    setSessionReviewedIds(new Set());
    setDragX(0);
    setViewMode('swipe');
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

  async function handleSwipeLike() {
    if (!swipeCar || isAnimating) return;
    // Demo listings are browse-only: never attempt the database match RPC.
    if (!swipeCar.ownerId || !UUID_RE.test(swipeCar.id)) {
      toast.message('Demo oglas služi za pregled — nije moguće napraviti match.');
      flyAway('right');
      return;
    }
    // Replaying a previously liked listing must not create another match or
    // overwrite a saved positive swipe with a negative one.
    if (likedCarIds.has(swipeCar.id)) {
      toast.message('Ovaj oglas je već lajkovan.');
      flyAway('right');
      return;
    }
    setIsAnimating(true);
    setSessionReviewedIds((previous) => new Set(previous).add(swipeCar.id));
    const liked = await likeCar(swipeCar);
    if (!liked) {
      setIsAnimating(false);
      setSessionReviewedIds((previous) => {
        const next = new Set(previous);
        next.delete(swipeCar.id);
        return next;
      });
      return;
    }
    flyAway('right');
  }

  async function handleSwipeSkip() {
    if (isAnimating || !swipeCar) return;
    // Skipping an already liked car during replay only advances the card.
    // Do not overwrite its saved like, existing match or conversation.
    if (likedCarIds.has(swipeCar.id)) {
      flyAway('left');
      return;
    }
    if (userId && UUID_RE.test(swipeCar.id)) {
      setIsAnimating(true);
      setSessionReviewedIds((previous) => new Set(previous).add(swipeCar.id));
      const result = await recordSwipe(
        swipeCar.id,
        selectedCar && UUID_RE.test(selectedCar.id) ? selectedCar.id : null,
        false,
      );
      if (!result.ok) {
        setIsAnimating(false);
        setSessionReviewedIds((previous) => {
          const next = new Set(previous);
          next.delete(swipeCar.id);
          return next;
        });
        toast.error('Oglas nije preskočen. Pokušaj ponovo.');
        return;
      }
    }
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
      void handleSwipeLike();
    } else if (dx < -100) {
      void handleSwipeSkip();
    } else {
      setDragX(0);
    }
  }

  function exitSwipeMode() {
    void refreshSwipes();
    setSessionReviewedIds(new Set());
    setViewMode('grid');
    setSwipeIndex(0);
    setDragX(0);
  }

  const showTrade = tradeAware;
  // Swipe is another view of the same feed. Do not silently remove demo
  // listings or previously reviewed cars; replay should always work.
  const swipeCars = filteredCars;
  const swipeCar = swipeCars[swipeIndex];
  const swipeTl = swipeCar && showTrade ? getTradeLabel(selectedCar, swipeCar) : null;
  const keyboardSwipeActions = useRef<{ skip: () => void; like: () => void }>({
    skip: () => undefined,
    like: () => undefined,
  });
  keyboardSwipeActions.current = {
    skip: () => { void handleSwipeSkip(); },
    like: () => { void handleSwipeLike(); },
  };

  useEffect(() => {
    if (viewMode !== 'swipe' || !swipeCar || offerCar || showAddForm || filtersOpen || selectorOpen) return;

    function handleSwipeKeyDown(event: KeyboardEvent) {
      if (window.innerWidth < 1024 || event.altKey || event.ctrlKey || event.metaKey || event.defaultPrevented) return;
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable || target.closest('input, textarea, select, [role="dialog"]'))
      ) return;

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        keyboardSwipeActions.current.skip();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        keyboardSwipeActions.current.like();
      }
    }

    window.addEventListener('keydown', handleSwipeKeyDown);
    return () => window.removeEventListener('keydown', handleSwipeKeyDown);
  }, [viewMode, swipeCar, offerCar, showAddForm, filtersOpen, selectorOpen]);

  if (!mounted) {
    return (
      <div className="app-container py-6" role="status" aria-label="Učitavam garažu">
        <div className="h-24 animate-pulse rounded-2xl border border-surface bg-card-surface desktop:h-32" />
        <div className="mt-4 grid grid-cols-1 gap-4 desktop:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="aspect-[16/10] animate-pulse rounded-2xl border border-surface bg-card-surface" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="relative z-10 border-b border-surface bg-app safe-top lg:static lg:border-0 lg:bg-transparent lg:shadow-none">
        <header className="app-container py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-shrink-0 lg:hidden">
              <h1 className="text-xl font-bold tracking-tight text-app-primary dark:text-app-primary">AutoTrampa</h1>
              <p className="text-[11px] text-app-muted mt-0.5">Pronađi sledeću zamenu</p>
            </div>

            <div className="flex min-w-0 w-full items-center justify-between gap-2 sm:w-auto sm:justify-end">
              {/* View mode toggle */}
              <div className="flex shrink-0 bg-elevated rounded-lg p-0.5 border border-surface dark:border-surface lg:hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`flex items-center justify-center w-8 h-7 rounded-md transition-all duration-200 ${
                    viewMode === 'grid' ? 'bg-brand-500 text-on-accent' : 'text-app-muted hover:text-app-secondary dark:text-app-secondary'
                  }`}
                  aria-label="Prikaz mreže"
                >
                  <LayoutGrid size={14} />
                </button>
                <button
                  onClick={() => enterSwipeMode()}
                  className={`flex items-center justify-center w-8 h-7 rounded-md transition-all duration-200 ${
                    viewMode === 'swipe' ? 'bg-brand-500 text-on-accent' : 'text-app-muted hover:text-app-secondary dark:text-app-secondary'
                  }`}
                  aria-label="Svajp režim"
                >
                  <Flame size={14} />
                </button>
              </div>

              {/* Tvoje Vozilo dropdown */}
              {showTrade && cars.length === 0 ? (
                <button
                  onClick={handleAddListing}
                  className="flex flex-shrink-0 items-center gap-2 rounded-xl border border-brand-500/30 bg-brand-500/10 px-3 py-2 text-xs font-semibold text-brand-text transition-all hover:bg-brand-500/15"
                  aria-label="Dodaj auto u svoju garažu"
                >
                  <Plus size={15} />
                  Dodaj auto
                </button>
              ) : showTrade && (
              <div className={`relative min-w-0 max-w-[calc(100%-5.5rem)] shrink-0 ${viewMode === 'grid' ? 'lg:hidden' : ''}`} ref={selectorRef}>
                <button
                  onClick={() => setSelectorOpen(p => !p)}
                  className="flex max-w-full min-w-0 items-center gap-2 bg-elevated hover:bg-hover-surface rounded-xl pl-2 pr-2.5 py-1.5 transition-all duration-200 border border-surface dark:border-surface"
                  aria-label="Izaberi vozilo"
                >
                  {mounted && selectedCar ? (
                    <>
                      <div className="w-7 h-7 rounded-lg overflow-hidden flex-shrink-0 bg-hover-surface">
                        {selectedCar.image && (
                          <img src={selectedCar.image} alt={selectedCar.model} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="text-left min-w-0 max-w-[120px]">
                        <p className="text-[8px] text-app-muted font-medium uppercase tracking-widest leading-none mb-0.5">Moj auto</p>
                        <p className="text-[11px] font-bold text-app-primary dark:text-app-primary truncate leading-tight">
                          {selectedCar.brand} {selectedCar.model}
                        </p>
                      </div>
                      <ChevronDown size={14} className={`shrink-0 text-app-muted transition-transform duration-200 ${selectorOpen ? 'rotate-180' : ''}`} />
                    </>
                  ) : (
                    <>
                      <div className="w-7 h-7 rounded-lg bg-hover-surface animate-pulse" />
                      <div className="h-3 w-14 bg-hover-surface rounded animate-pulse" />
                    </>
                  )}
                </button>

                {selectorOpen && mounted && selectedCar && (
                  <div className="absolute right-0 top-full mt-2 w-72 max-w-[calc(100vw-2rem)] bg-card-surface dark:bg-card-surface border border-surface dark:border-surface rounded-2xl shadow-2xl shadow-black/50 overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-surface dark:border-surface">
                      <p className="text-xs font-bold text-app-primary dark:text-app-primary">Moja vozila</p>
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
                              <p className="text-xs font-bold text-app-primary dark:text-app-primary truncate">{[car.brand, car.model, displayValue(car.generation)].filter(Boolean).join(' ')}</p>
                              <p className="text-[10px] text-app-muted dark:text-app-secondary">{formatYear(car.year)} · {formatEuro(car.price)}</p>
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
                    <div className="border-t border-surface dark:border-surface p-2">
                      <button
                        onClick={() => { setSelectorOpen(false); handleAddListing(); }}
                        className="w-full flex items-center justify-center gap-2 text-brand-text text-xs font-semibold rounded-xl py-2.5 border border-dashed border-surface dark:border-surface hover:bg-hover-surface transition-all"
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
        <div className={`border-t border-surface dark:border-surface/50 ${viewMode === 'grid' ? 'lg:hidden' : ''}`}>
          <div className="app-container flex items-center gap-1.5 py-2 overflow-x-auto scrollbar-hide">
            {TRADE_FILTERS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => { updateFilters({ trade: key }); setSwipeIndex(0); }}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all duration-150 ${
                  filters.trade === key
                    ? 'bg-brand-500 text-on-accent'
                    : 'bg-elevated/70 text-app-secondary hover:bg-hover-surface hover:text-app-primary'
                }`}
              >
                {label}
              </button>
            ))}
            {/* Below lg the sidebar is hidden, so the sheet is the only way in. */}
            <button
              onClick={() => setFiltersOpen(true)}
              className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-semibold bg-elevated/70 text-app-secondary hover:bg-hover-surface hover:text-app-primary transition-all duration-150 lg:hidden"
              aria-label={`Filteri${activeFilters > 0 ? ` (${activeFilters} aktivnih)` : ''}`}
            >
              <SlidersHorizontal size={11} />
              Filteri
              {activeFilters > 0 && (
                <span className="rounded-full bg-brand-500 px-1.5 text-[10px] font-bold text-on-accent">{activeFilters}</span>
              )}
            </button>
          </div>
        </div>
        )}
      </div>

      {authReady && isLoggedIn && cars.length === 0 && (
        <div className="app-container mt-3 flex flex-col gap-2 rounded-2xl border border-brand-500/30 bg-brand-500/10 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold text-brand-text">Dodaj svoj auto da vidiš doplatu</p>
            <p className="mt-0.5 text-xs text-app-secondary dark:text-app-secondary">
              Doplata je razlika između tvog i tuđeg vozila. Bez auta u garaži nemamo sa čime da je
              uporedimo, pa je trenutno ne prikazujemo.
            </p>
          </div>
          <button
            onClick={handleAddListing}
            className="btn-primary flex-shrink-0 text-xs"
          >
            Dodaj auto
          </button>
        </div>
      )}

      {authReady && !isLoggedIn && (
        <div className="app-container mt-3 flex flex-col gap-2 rounded-2xl border border-brand-500/30 bg-brand-500/10 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold text-brand-text">Koliko je doplata za tebe?</p>
            <p className="mt-0.5 text-xs text-app-secondary dark:text-app-secondary">
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

      {viewMode === 'grid' && (
        <section className="app-container mt-4 hidden space-y-2 desktop:block" aria-label="Podešavanja oglasa">
          {isLoggedIn && selectedCar && (
            <DesktopFeedOverview
              cars={cars}
              selectedCar={selectedCar}
              selectedId={selectedId}
              selectCar={selectCar}
              canAddCar={canAddCar}
              onAddCar={handleAddListing}
              onOpenSwipe={() => enterSwipeMode()}
            />
          )}

          <div className="flex min-w-0 flex-wrap items-center gap-2 border-b border-surface pb-2 dark:border-surface">
            <button
              type="button"
              onClick={() => setDesktopFiltersOpen(true)}
              aria-label={`Otvori napredne filtere${advancedFilterCount > 0 ? `, ${advancedFilterCount} aktivnih filtera` : ''}`}
              className="inline-flex h-9 flex-shrink-0 items-center gap-1.5 rounded-xl border border-surface bg-card-surface px-3 text-[13px] font-semibold text-app-primary shadow-sm transition-colors hover:border-brand-500/40 hover:bg-elevated dark:border-surface dark:bg-card-surface dark:text-app-primary"
            >
              <SlidersHorizontal size={15} />
              Filteri
              {advancedFilterCount > 0 && (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1.5 text-[11px] font-bold text-on-accent">
                  {advancedFilterCount}
                </span>
              )}
            </button>

            <span className="hidden h-6 w-px bg-surface dark:bg-elevated sm:block" aria-hidden="true" />

            {showTrade && (
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5" aria-label="Tip zamene">
                {TRADE_FILTERS.map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => { updateFilters({ trade: key }); setSwipeIndex(0); }}
                    aria-pressed={filters.trade === key}
                    className={`inline-flex h-9 items-center rounded-full border px-3.5 text-[13px] font-semibold transition-all duration-150 ${
                      filters.trade === key
                        ? 'border-brand-500 bg-brand-500 text-on-accent shadow-sm shadow-brand-500/20'
                        : 'border-surface bg-card-surface text-app-secondary hover:-translate-y-px hover:border-brand-500/40 hover:bg-elevated hover:shadow-sm dark:border-surface dark:bg-card-surface dark:text-app-secondary'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            {activeFilters > 0 && (
              <button
                type="button"
                onClick={() => { resetFilters(); setSwipeIndex(0); }}
                className="flex-shrink-0 px-2 py-2 text-xs font-semibold text-app-muted transition-colors hover:text-brand-text"
              >
                Očisti sve
              </button>
            )}

            {isLoggedIn && selectedCar && (
              <div className="ml-auto flex flex-shrink-0 items-center border-l border-surface pl-3 dark:border-surface">
                <DesktopRadiusControl selectedCar={selectedCar} />
              </div>
            )}
          </div>
        </section>
      )}

      {/* No results */}
      {filteredCars.length === 0 && (
        <div className="app-container pt-8 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-full bg-elevated flex items-center justify-center mb-3">
            <SlidersHorizontal size={24} className="text-app-muted" />
          </div>
          <p className="text-app-secondary dark:text-app-secondary font-semibold text-sm">Nema vozila po ovom filteru</p>
          <button onClick={() => { resetFilters(); setSwipeIndex(0); }} className="mt-2 text-brand-text text-xs font-semibold">Poništi filtere</button>
        </div>
      )}

      {/* Mobile/tablet filter sheet — the desktop column lives beside the grid. */}
      <BottomSheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Filteri"
        className="sm:max-w-lg"
      >
        <FilterSheetBody
          filters={filters}
          update={updateFilters}
          onReset={resetFilters}
          showTrade={showTrade}
        />
        <button
          onClick={() => setFiltersOpen(false)}
          className="mt-6 w-full rounded-xl bg-elevated py-3 text-sm font-semibold text-app-primary dark:text-app-primary transition-colors hover:bg-hover-surface"
        >
          Prikaži {filteredCars.length} {filteredCars.length === 1 ? 'oglas' : 'oglasa'}
        </button>
      </BottomSheet>

      <BottomSheet
        open={desktopFiltersOpen}
        onClose={() => setDesktopFiltersOpen(false)}
        title="Napredni filteri"
        className="sm:max-w-4xl"
      >
        <FilterSheetBody
          filters={filters}
          update={updateFilters}
          onReset={() => { resetFilters(); setSwipeIndex(0); }}
          showTrade={false}
          className="grid gap-x-8 gap-y-5 sm:grid-cols-2 sm:space-y-0"
        />
        <button
          type="button"
          onClick={() => setDesktopFiltersOpen(false)}
          className="mt-6 w-full rounded-xl bg-brand-500 py-3 text-sm font-semibold text-on-accent transition-colors hover:bg-brand-600"
        >
          Prikaži {filteredCars.length} {filteredCars.length === 1 ? 'oglas' : 'oglasa'}
        </button>
      </BottomSheet>

      {/* SWIPE MODE — FULLSCREEN */}
      {viewMode === 'swipe' && filteredCars.length > 0 && (
        <div className="fixed inset-0 z-[60] bg-app dark:bg-app flex flex-col safe-top safe-bottom">
          {/* Swipe header */}
          <div className="relative flex items-center justify-between px-4 py-3 border-b border-surface dark:border-surface lg:px-8">
            <button
              onClick={exitSwipeMode}
              className="hidden h-10 items-center gap-2 rounded-xl border border-surface bg-elevated px-4 text-app-secondary transition-colors hover:bg-hover-surface hover:text-app-primary lg:inline-flex dark:border-surface"
              aria-label="Nazad na oglase"
            >
              <ArrowLeft size={17} />
              <span className="text-sm font-semibold">Nazad na oglase</span>
            </button>
            <div className="flex items-center gap-2 lg:absolute lg:left-1/2 lg:-translate-x-1/2">
              <Flame size={18} className="text-brand-text" />
              <span className="text-sm font-bold text-app-primary dark:text-app-primary">Svajp režim</span>
            </div>
            <button
              onClick={exitSwipeMode}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-elevated hover:bg-hover-surface text-app-secondary hover:text-app-primary transition-all duration-200 lg:hidden"
              aria-label="Izađi iz svajp režima"
            >
              <X size={18} />
            </button>
          </div>

          {/* Swipe content */}
          <div className="flex-1 flex flex-col items-center justify-center px-4 py-4 overflow-hidden lg:py-3">
            {swipeIndex < swipeCars.length && swipeCar ? (
              <>
                {/* Progress dots */}
                <div className="flex gap-1.5 mb-4 flex-wrap justify-center max-w-sm lg:mb-3 lg:max-w-2xl">
                  {swipeCars.map((_, i) => (
                    <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === swipeIndex ? 'w-6 bg-brand-400' : i < swipeIndex ? 'w-1.5 bg-brand-400/40' : 'w-1.5 bg-elevated'
                    }`} />
                  ))}
                </div>

                {/* Card stack */}
                <div className="relative w-full max-w-sm lg:max-w-2xl">
                  {/* Next card peeking behind */}
                  {swipeCars[swipeIndex + 1] && (
                    <div className="absolute inset-0 overflow-hidden rounded-3xl border border-surface bg-card-surface shadow-lg dark:border-surface dark:bg-card-surface" style={{ transform: 'translateY(10px) scale(0.95)', opacity: 0.5 }}>
                      <div className="relative h-72 sm:h-80 lg:h-[min(40vh,380px)]">
                        <img src={swipeCars[swipeIndex + 1].image} alt="" className="w-full h-full object-cover opacity-60" draggable={false} />
                      </div>
                    </div>
                  )}

                  {/* Active card */}
                  <div
                    className="relative w-full overflow-hidden rounded-3xl border border-surface bg-card-surface shadow-xl select-none touch-none dark:border-surface dark:bg-card-surface lg:max-w-2xl"
                    style={{
                      transform: `translateX(${dragX}px) rotate(${dragX * 0.08}deg)`,
                      transition: isAnimating ? 'transform 0.3s ease-out, opacity 0.3s ease-out' : 'none',
                      opacity: isAnimating ? 0 : 1,
                      zIndex: 10,
                    }}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={() => { dragStart.current = null; setDragX(0); }}
                  >
                    {/* Image */}
                    <div className="relative h-72 sm:h-80 lg:h-[min(40vh,380px)]">
                      <img src={swipeCar.image} alt={`${swipeCar.brand} ${swipeCar.model}`} className="w-full h-full object-cover pointer-events-none" draggable={false} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent pointer-events-none" />

                      {/* LIKE badge */}
                      <div
                        className="absolute top-8 left-6 -rotate-12 border-4 border-tone-positive text-tone-positive font-black text-3xl px-4 py-1.5 rounded-xl pointer-events-none"
                        style={{ opacity: Math.max(0, Math.min(1, dragX / 100)) }}
                      >
                        LIKE
                      </div>

                      {/* SKIP badge */}
                      <div
                        className="absolute top-8 right-6 rotate-12 border-4 border-tone-negative text-tone-negative font-black text-3xl px-4 py-1.5 rounded-xl pointer-events-none"
                        style={{ opacity: Math.max(0, Math.min(1, -dragX / 100)) }}
                      >
                        PRESKOK
                      </div>

                      {/* Trade label */}
                      {swipeTl && (
                        <TradeBadge trade={swipeTl} className="absolute bottom-3 left-3 px-3 py-2 text-sm" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-5 lg:p-6">
                      <div className="flex items-start justify-between mb-2 gap-2">
                        <div className="min-w-0">
                          <h2 className="text-lg font-black text-app-primary dark:text-app-primary tracking-tight truncate">{carTitle(swipeCar)}</h2>
                          <p className="text-xs text-app-muted mt-0.5">{swipeCar.generation} · {swipeCar.color}</p>
                        </div>
                        <p className="text-app-primary font-black text-xl flex-shrink-0">{formatEuro(swipeCar.price)}</p>
                      </div>

                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        <div className="flex items-center gap-1.5 text-[11px] text-app-secondary dark:text-app-secondary"><Gauge size={12} className="text-app-muted" />{formatKm(swipeCar.mileage)}</div>
                        <div className="flex items-center gap-1.5 text-[11px] text-app-secondary dark:text-app-secondary"><Fuel size={12} className="text-app-muted" />{fuelLabel(swipeCar.specs.fuelType)}</div>
                        <div className="flex items-center gap-1.5 text-[11px] text-app-secondary dark:text-app-secondary ml-auto"><MapPin size={12} className="text-app-muted" />{swipeCar.city}</div>
                      </div>

                      <p className="text-xs text-app-secondary dark:text-app-secondary mt-3 line-clamp-2 leading-relaxed">{swipeCar.description}</p>

                      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-surface dark:border-surface">
                        <button onClick={() => openOffer(swipeCar)} className="btn-primary btn-primary-compact flex-1 text-sm">
                          <ArrowLeftRight size={15} /> Pošalji ponudu
                        </button>
                        <Link href={`/car/${swipeCar.id}`} className="flex items-center justify-center gap-1.5 px-3 bg-elevated hover:bg-hover-surface text-app-secondary dark:text-app-secondary text-sm font-semibold rounded-xl py-2.5 transition-all">
                          Detalji
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-5 mt-6 lg:mt-4 lg:gap-7">
                  <button
                    onClick={() => void handleSwipeSkip()}
                    disabled={isAnimating}
                    className="w-14 h-14 rounded-full bg-tone-negative-surface border-2 border-tone-negative flex items-center justify-center text-tone-negative-ring hover:opacity-80 hover:scale-110 active:scale-95 transition-all duration-200 lg:h-16 lg:w-16"
                    aria-label="Preskoči"
                  >
                    <X size={28} strokeWidth={3} />
                  </button>
                  <span className="text-xs text-app-muted font-medium min-w-[50px] text-center">{swipeIndex + 1} / {swipeCars.length}</span>
                  <button
                    onClick={() => void handleSwipeLike()}
                    disabled={isAnimating}
                    className="w-14 h-14 rounded-full bg-tone-positive-surface border-2 border-tone-positive flex items-center justify-center text-tone-positive-ring hover:opacity-80 hover:scale-110 active:scale-95 transition-all duration-200 lg:h-16 lg:w-16"
                    aria-label="Sviđa mi se"
                  >
                    <Heart size={28} strokeWidth={3} />
                  </button>
                </div>
                <p className="text-[10px] text-app-muted mt-3 opacity-70 lg:hidden">Prevuci desno = LIKE · levo = PRESKOK</p>
                <p className="hidden items-center gap-2 text-xs text-app-muted opacity-80 lg:flex">
                  <kbd className="rounded-md border border-surface bg-elevated px-2 py-1 font-semibold dark:border-surface">←</kbd>
                  Preskoči
                  <span className="mx-1">·</span>
                  <kbd className="rounded-md border border-surface bg-elevated px-2 py-1 font-semibold dark:border-surface">→</kbd>
                  Sviđa mi se
                </p>
              </>
            ) : (
              /* All done screen */
              <div className="flex flex-col items-center text-center py-8">
                <div className="w-20 h-20 rounded-full bg-tone-positive-surface flex items-center justify-center mb-4">
                  <CheckCircle size={40} className="text-tone-positive" />
                </div>
                <h2 className="text-xl font-bold text-app-primary dark:text-app-primary mb-2">Sve pregledano!</h2>
                <p className="text-sm text-app-secondary dark:text-app-secondary mb-1">Pregledao si sve oglase koji odgovaraju trenutnim filterima.</p>
                <p className="text-xs text-app-muted mb-6">Sačuvano: {saved.length} oglasa</p>
                <div className="flex gap-3">
                  <button onClick={() => {
                    // Restart this browsing session without deleting swipe history.
                    // Previously liked listings remain liked and cannot create duplicate matches.
                    setSwipeIndex(0);
                    setSessionReviewedIds(new Set());
                    setDragX(0);
                    toast.success('Ponovo prikazujemo sve oglase.');
                  }} className="flex items-center gap-2 bg-elevated hover:bg-hover-surface text-app-primary dark:text-app-primary font-semibold px-4 py-2.5 rounded-xl text-sm transition-all">
                    <RotateCcw size={15} /> Ponovi sve oglase
                  </button>
                  <button onClick={exitSwipeMode} className="btn-primary text-sm">
                    Nazad na feed
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Swipe hint overlay */}
          {showSwipeHint && swipeIndex < swipeCars.length && (
            <div className="absolute inset-0 z-[70] flex items-center justify-center pointer-events-none">
              <div className="flex items-center gap-10">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-16 h-16 rounded-full bg-tone-negative-surface border-2 border-tone-negative flex items-center justify-center animate-pulse">
                    <X size={32} className="text-tone-negative-ring" strokeWidth={3} />
                  </div>
                  <p className="text-xs font-bold text-tone-negative uppercase tracking-wider">← Preskoči</p>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-16 h-16 rounded-full bg-tone-positive-surface border-2 border-tone-positive flex items-center justify-center animate-pulse">
                    <Heart size={32} className="text-tone-positive" fill="currentColor" />
                  </div>
                  <p className="text-xs font-bold text-tone-positive uppercase tracking-wider">Like →</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {viewMode === 'grid' && (
        <div className="app-container flex flex-col gap-5 pt-3 lg:flex-row lg:items-start desktop:flex-col desktop:items-stretch">
          {isLoggedIn && (
            <DesktopFeedSidebar
              cars={cars}
              selectedCar={selectedCar}
              selectedId={selectedId}
              selectCar={selectCar}
              canAddCar={canAddCar}
              onAddCar={handleAddListing}
              filters={filters}
              updateFilters={updateFilters}
              onTradeChange={(trade) => { updateFilters({ trade }); setSwipeIndex(0); }}
              onResetFilters={resetFilters}
              tradeOptions={TRADE_FILTERS}
              showTrade={showTrade}
            />
          )}

          <div className="min-w-0 flex-1">
            <div className="mb-3 min-w-0">
              <h1 className="truncate text-base font-bold leading-tight text-app-primary dark:text-app-primary sm:text-lg">
                {activeCarName ? `Zamene za ${activeCarName}` : 'Istraži oglase'}
              </h1>
              <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-app-muted">
                <span>{marketplaceReady
                  ? `Pronađeno ${filteredCars.length} ${filteredCars.length === 1 ? 'oglas' : 'oglasa'}`
                  : 'Oglasi se učitavaju…'}</span>
                {selectedCar && (
                  <>
                    <span className="hidden text-app-muted/60 sm:inline" aria-hidden="true">·</span>
                    <span className="basis-full sm:basis-auto">Prikazane doplate su procenjene prema vrednosti tvog vozila.</span>
                  </>
                )}
              </div>
            </div>

            {!marketplaceReady && (
              /* Placeholder cards while the first request is in flight: real
                 listings arrive after the demo seed and sort to the front, so
                 without this the grid visibly jumps under the reader. */
              <div className="grid grid-cols-1 gap-4 pb-4 sm:grid-cols-2 lg:gap-5 desktop:grid-cols-3 desktop:gap-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex h-full min-w-0 animate-pulse flex-col overflow-hidden rounded-2xl border border-surface bg-card-surface dark:border-surface dark:bg-card-surface"
                  >
                    <div className="aspect-[16/9] w-full bg-hover-surface" />
                    <div className="flex flex-1 flex-col gap-2 p-3 sm:p-4 desktop:px-4 desktop:py-3">
                      <div className="h-5 w-3/4 rounded bg-hover-surface" />
                      <div className="h-3 w-1/2 rounded bg-hover-surface" />
                      <div className="mt-1 h-3 w-2/3 rounded bg-hover-surface" />
                      <div className="mt-auto flex items-center justify-between gap-2 pt-3 desktop:pt-2.5">
                        <div className="h-5 w-20 rounded bg-hover-surface" />
                        <div className="h-5 w-24 rounded-full bg-hover-surface" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          {marketplaceReady && (
            <div className="grid grid-cols-1 gap-4 pb-4 sm:grid-cols-2 desktop:grid-cols-2 desktop:gap-6">
          {filteredCars.map(car => {
            const tl = showTrade ? getTradeLabel(selectedCar, car) : null;
            return (
              <article key={car.id} className="group/card flex h-full min-w-0 flex-col overflow-hidden rounded-[22px] border border-surface bg-card-surface shadow-lg shadow-black/10 transition-all duration-300 desktop:hover:-translate-y-1 desktop:hover:border-brand-500/35 desktop:hover:shadow-xl dark:shadow-black/20">
                {/* The photo stays inside its own top section; the details never sit over it. */}
                <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-elevated">
                  <FeedCardPhoto car={car} />
                  {tl && <TradeBadge trade={tl} variant="photo" className="absolute bottom-3 right-3 z-20 max-w-[calc(100%-6rem)] sm:bottom-4 sm:right-4" />}
                  {car.city && <span className="absolute left-3 top-3 z-20 inline-flex max-w-[calc(100%-5rem)] items-center gap-1.5 rounded-full border border-white/20 bg-black/65 px-3 py-1.5 text-[11px] font-medium text-white backdrop-blur-sm sm:left-4 sm:top-4">
                    <MapPin size={13} className="shrink-0 text-brand-300" aria-hidden="true" /><span className="truncate">{car.city}</span>
                  </span>}
                  <button type="button"
                    onClick={() => void likeCar(car)}
                    disabled={isLiking(car.id)}
                    className="absolute right-3 top-3 z-30 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/65 text-white backdrop-blur-sm transition-colors hover:text-brand-300 disabled:opacity-60 sm:right-4 sm:top-4"
                    aria-label={'Lajkuj i sačuvaj ' + car.brand + ' ' + car.model}
                    title="Lajkuj i sačuvaj za match">
                    <Heart size={20} strokeWidth={1.8} />
                  </button>
                </div>

                <div className="flex min-w-0 flex-1 flex-col px-4 pb-4 pt-4 sm:px-5 sm:pb-5">
                  <div className="min-w-0">
                    <h2 className="line-clamp-2 font-heading text-[19px] font-bold leading-tight tracking-tight text-app-primary sm:text-[22px]">{car.brand} {car.model}</h2>
                    {carSubtitle(car) && <p className="mt-1 truncate text-xs text-app-secondary sm:text-[13px]">{carSubtitle(car)}</p>}
                  </div>
                  <ListingCardSpecs car={car} />
                  <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-surface pt-4 first:mt-4">
                    <p className="min-w-0 font-sans text-[25px] font-bold leading-none tracking-tight tabular-nums text-app-primary sm:text-[29px]">{formatEuro(car.price)}</p>
                    <Link href={'/car/' + car.id} className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-xs font-bold text-on-accent transition-colors hover:bg-brand-400 sm:px-5 sm:text-sm">
                      Pogledaj oglas <ArrowRight size={16} aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
            </div>
          )}
          </div>
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


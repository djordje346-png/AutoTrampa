'use client';

import { Suspense, useCallback, useMemo, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Heart, HeartHandshake, ArrowLeft, ChevronRight, Search, X, CircleCheck as CheckCircle, MapPin, Gauge, CalendarDays, Settings2, ChevronDown, Check, Plus, Flame, RotateCcw, SlidersHorizontal } from 'lucide-react';
import { carTitle, formatEuro, formatKm, formatYear } from '@/lib/cars';
import { getTradeLabel } from '@/lib/trade';
import { transmissionLabel } from '@/lib/labels';
import { carSubtitle, displayValue } from '@/lib/car-row';
import { Car, MyGarageCar } from '@/types';
import { garageErrorMessage, useGarage } from '@/hooks/use-garage';
import { useMarketplace } from '@/hooks/use-marketplace';
import { useSaved } from '@/hooks/use-saved';
import { useSwipes } from '@/hooks/use-swipes';
import { useMatchLike } from '@/hooks/use-match-like';
import { useActiveOfferIds } from '@/hooks/use-offers';
import { usePreferences } from '@/hooks/use-preferences';
import { getAlternativeCars, useFilteredCars } from '@/hooks/use-filtered-cars';
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
import PublicLanding from '@/components/PublicLanding';
import MarketplaceV13Card from '@/components/MarketplaceV13Card';
import { MobilePreferences } from '@/components/MobilePreferences';
import { useSmartSwaps } from '@/hooks/use-smart-swaps';
import { useListingMessage } from '@/hooks/use-listing-message';
import ListingPagination from '@/components/ListingPagination';
import { LISTINGS_PER_PAGE, useListingPagination } from '@/hooks/use-listing-pagination';
import { useFeedView } from '@/hooks/use-feed-view';
import { useMessages } from '@/hooks/use-messages';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Quick trade filter in the feed header; the full set lives in the sidebar. */
const TRADE_FILTERS: { key: SearchFilters['trade']; label: string }[] = [
  { key: 'all', label: 'Sve' },
  { key: 'similar', label: 'Slična vrednost' },
  { key: 'cheaper', label: 'Doplata tebi' },
  { key: 'expensive', label: 'Ja doplaćujem' },
];

export default function FeedPage() {
  return <Suspense fallback={<div className="app-container py-8" role="status">Učitavanje oglasa…</div>}><FeedPageContent /></Suspense>;
}

function FeedPageContent() {
  const router = useRouter();
  const params = useSearchParams();
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
  }, [authReady, isLoggedIn, params, router]);

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
  const { reviewedCarIds, likedCarIds, recordSwipe, resetPasses, refresh: refreshSwipes } = useSwipes();
  const { likeCar, isLiking } = useMatchLike(recordSwipe, save);
  const [offerCar, setOfferCar] = useState<Car | null>(null);
  const activeOfferIds = useActiveOfferIds(selectedCar?.id);
  const { openMessage, messagingId } = useListingMessage();
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCarPreferencesId, setNewCarPreferencesId] = useState<string | null>(null);
  const { viewMode, setViewMode } = useFeedView();
  const { unreadMatches } = useMessages({ poll: viewMode === 'swipe' });
  const [swipeIndex, setSwipeIndex] = useState(0);
  const [mobileQuickFilter, setMobileQuickFilter] = useState<'all' | 'diesel' | 'petrol' | 'automatic' | 'suv' | 'newer'>('all');
  const { preferences, mounted: preferencesMounted } = usePreferences();
  const budget = preferences.budget;
  const noTopUp = preferences.noTopUp;
  const { scoreById: smartSwapScores } = useSmartSwaps(selectedCar, preferences, userId, preferencesMounted && mounted && authReady && isLoggedIn);
  const { filters, update: updateFilters, reset: resetFilters, filtersOpen, setFiltersOpen, mounted: filtersMounted } = useSearchPrefs();
  const [dragX, setDragX] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showSwipeHint, setShowSwipeHint] = useState(false);
  const [sessionReviewedIds, setSessionReviewedIds] = useState<Set<string>>(new Set());
  const [replaySkippedIds, setReplaySkippedIds] = useState<string[] | null>(null);
  const selectorRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef<{ x: number } | null>(null);
  const pendingAddCarHandled = useRef(false);
  const gridScrollTop = useRef(0);
  const previousView = useRef(viewMode);

  useEffect(() => {
    const restore = viewMode === 'grid' && previousView.current === 'swipe';
    previousView.current = viewMode;
    if (viewMode !== 'grid') return;
    const frame = restore ? window.requestAnimationFrame(() => window.scrollTo(0, gridScrollTop.current)) : null;
    const rememberPosition = () => { gridScrollTop.current = window.scrollY; };
    window.addEventListener('scroll', rememberPosition, { passive: true });
    return () => {
      if (frame !== null) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', rememberPosition);
    };
  }, [viewMode]);

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
  const quickCars = useMemo(() => marketplaceCars.filter(car => {
    switch (mobileQuickFilter) {
      case 'diesel': return car.specs.fuelType === 'Diesel';
      case 'petrol': return car.specs.fuelType === 'Petrol';
      case 'automatic': return /auto|dsg|cvt|tiptronic|steptronic/i.test(car.specs.transmission ?? '');
      case 'suv': return car.bodyType === 'SUV';
      case 'newer': return car.year != null && car.year >= 2015;
      default: return true;
    }
  }), [marketplaceCars, mobileQuickFilter]);
  const filteredCars = useFilteredCars(
    quickCars,
    filters,
    tradeAware ? selectedCar : null,
    budget,
    noTopUp,
    selectedCar?.city ?? '',
    preferences.radius,
    preferences.bodyPrefs,
    preferences.favoriteModels,
    preferences.prioritizeFavoriteModels,
    preferences.tradePreference,
  );

  const hasSearchCriteria = countActiveFilters(filters, true) > 0;
  const showAlternatives = hasSearchCriteria && filteredCars.length < LISTINGS_PER_PAGE;
  const alternativeCars = useMemo(
    () => showAlternatives
      ? getAlternativeCars(
          quickCars, filteredCars, filters, tradeAware ? selectedCar : null,
          budget, noTopUp, selectedCar?.city ?? '', preferences.radius, preferences.bodyPrefs,
          preferences.favoriteModels, preferences.prioritizeFavoriteModels, preferences.tradePreference,
        )
      : [],
    [showAlternatives, quickCars, filteredCars, filters, tradeAware, selectedCar, budget, noTopUp, preferences.radius, preferences.bodyPrefs, preferences.favoriteModels, preferences.prioritizeFavoriteModels, preferences.tradePreference],
  );
  // Reciprocal candidates are shown separately, before the ordinary feed.
  // Neither a recommendation nor a star creates a confirmed Match.
  const allDisplayCars = useMemo(
    () => showAlternatives ? [...filteredCars, ...alternativeCars] : filteredCars,
    [showAlternatives, filteredCars, alternativeCars],
  );
  const smartSwapCars = useMemo(
    () => allDisplayCars.filter(car => smartSwapScores.has(car.id))
      .sort((a, b) => (smartSwapScores.get(b.id) ?? 0) - (smartSwapScores.get(a.id) ?? 0))
      .slice(0, 3),
    [allDisplayCars, smartSwapScores],
  );
  const displayCars = useMemo(
    () => allDisplayCars.filter(car => !smartSwapCars.some(smart => smart.id === car.id)),
    [allDisplayCars, smartSwapCars],
  );
  const ordinaryExactCount = filteredCars.filter(car => !smartSwapCars.some(smart => smart.id === car.id)).length;
  const pagination = useListingPagination(displayCars, JSON.stringify([smartSwapCars.map(car => car.id), filters, selectedCar?.id, selectedCar?.price, selectedCar?.city, budget, noTopUp, preferences.radius, preferences.bodyPrefs, preferences.favoriteModels, preferences.prioritizeFavoriteModels, preferences.tradePreference, mobileQuickFilter, userId]), marketplaceReady && filtersMounted && mounted && preferencesMounted);

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
    setReplaySkippedIds(null);
  }, [selectedId, filters]);

  function openOffer(car: Car) {
    if (!UUID_RE.test(car.id) || !car.ownerId) {
      toast.message('Demo oglasi služe za pregled. Ponudu možeš poslati za stvarni oglas.');
      return;
    }
    if (!selectedCar) {
      toast.error('Prvo dodaj svoj auto u garažu.', {
        action: { label: 'Garaža', onClick: () => router.push('/garage') },
      });
      return;
    }
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
    const createdId = result.id ?? form.id;
    selectCar(createdId);
    setShowAddForm(false);
    setNewCarPreferencesId(createdId);
    toast.success('Vozilo dodato. Sada izaberi šta želiš u zamenu.');
  }

  function enterSwipeMode() {
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
    setViewMode('grid');
    setDragX(0);
  }

  const showTrade = tradeAware;
  // Demo listings are browsable in swipe; their actions stay local and cannot match.
  // Swipe replay must not be constrained by the current feed filters.
  // A skipped listing can be excluded by price, trade direction or radius,
  // even while it remains available in the marketplace.
  const swipeEligibleCars = marketplaceCars;
  const swipeCars = replaySkippedIds !== null
    ? replaySkippedIds.map(id => swipeEligibleCars.find(car => car.id === id)).filter((car): car is Car => Boolean(car))
    : userId
      ? filteredCars.filter((car) => !reviewedCarIds.has(car.id) || sessionReviewedIds.has(car.id))
      : filteredCars;
  const swipeCar = swipeCars[swipeIndex];
  const noSwipeResults = replaySkippedIds === null && filteredCars.length === 0;
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
      <div hidden={viewMode === 'swipe'} className="app-page-header safe-top lg:static lg:border-0 lg:bg-transparent lg:shadow-none">
        <header className="app-container hidden py-3 lg:block">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 w-full items-center justify-between gap-2 sm:w-auto sm:justify-end">
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
        {viewMode === 'swipe' && showTrade && (
        <div className="border-t border-surface dark:border-surface/50">
          <div className="app-container flex items-center gap-1.5 py-2 overflow-x-auto scrollbar-hide">
            {TRADE_FILTERS.map(({ key, label }) => (
              <button
                key={key}
                aria-pressed={filters.trade === key}
                disabled={!showTrade && key !== 'all'}
                title={!showTrade && key !== 'all' ? 'Dodaj svoj auto da koristiš filtere doplate' : undefined}
                onClick={() => { updateFilters({ trade: key }); setSwipeIndex(0); }}
                className={`control-focus flex-shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-semibold whitespace-nowrap transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-45 ${
                  filters.trade === key
                    ? 'border-control bg-control text-control-foreground hover:bg-control-hover'
                    : 'border-surface bg-elevated text-app-secondary hover:bg-hover-surface hover:border-control/40 hover:text-app-primary dark:border-[#2C3B51] dark:bg-[#19263B] dark:text-[#C4CDDA] dark:hover:bg-[#22344F]'
                }`}
              >
                {label}
              </button>
            ))}

          </div>
        </div>
        )}
      </div>

      {viewMode === 'grid' && isLoggedIn && selectedCar && (
        <div className="app-container mt-4 hidden desktop:block">
          <DesktopFeedOverview
            cars={cars}
            selectedCar={selectedCar}
            selectedId={selectedId}
            selectCar={selectCar}
            canAddCar={canAddCar}
            onAddCar={handleAddListing}
            onOpenSwipe={() => enterSwipeMode()}
          />
        </div>
      )}

      {viewMode === 'grid' && authReady && isLoggedIn && (
        <section className="app-container mt-3 space-y-3" aria-label="Moje preferencije i brzi filteri">
          {selectedCar && (
            <div className="desktop:hidden flex min-w-0 items-center justify-between gap-2 rounded-xl border border-surface bg-card-surface px-3 py-2 dark:border-surface">
              <div className="flex min-w-0 items-center gap-2">
                {selectedCar.image && <img src={selectedCar.image} alt="" className="h-9 w-11 shrink-0 rounded-lg object-cover" />}
                <div className="min-w-0">
                  <p className="text-[10px] font-medium text-app-muted">Izabrani automobil</p>
                  <p className="truncate text-xs font-bold text-app-primary">{selectedCar.brand} {selectedCar.model}</p>
                </div>
              </div>
              <MobilePreferences key={selectedCar.id} hasGarageCar compactTrigger />
            </div>
          )}
          <div className="min-w-0 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-xs font-bold text-app-primary dark:text-app-primary">Brzi filteri</h2>
              <button type="button" onClick={() => setFiltersOpen(true)} className="inline-flex items-center gap-1 text-xs font-semibold text-brand-text"><SlidersHorizontal size={13}/> Svi filteri</button>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide" aria-label="Privremeni filteri">
              {([
                ['all','Svi oglasi'],['diesel','Dizel'],['petrol','Benzin'],['automatic','Automatik'],['suv','SUV'],['newer','Noviji']
              ] as const).map(([key,label]) => (
                <button key={key} type="button" aria-pressed={mobileQuickFilter===key} onClick={() => { setMobileQuickFilter(key); setSwipeIndex(0); }} className={`control-focus shrink-0 rounded-full border px-3 py-2 text-xs font-semibold transition-colors ${mobileQuickFilter===key ? 'border-control bg-control text-control-foreground' : 'border-surface bg-elevated text-app-secondary dark:border-surface'}`}>{label}</button>
              ))}
            </div>
          </div>
        </section>
      )}

      {viewMode === 'grid' && authReady && isLoggedIn && cars.length === 0 && (
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

      {/* No results */}
      {filteredCars.length === 0 && alternativeCars.length === 0 && marketplaceReady && (
        <div className="app-container pt-8 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-full bg-elevated flex items-center justify-center mb-3">
            <SlidersHorizontal size={24} className="text-app-muted" />
          </div>
          <p className="text-app-secondary dark:text-app-secondary font-semibold text-sm">Nema vozila po ovom filteru</p>
          <button onClick={() => { resetFilters(); setSwipeIndex(0); }} className="mt-2 text-brand-text text-xs font-semibold">Poništi filtere</button>
        </div>
      )}

      {/* Focused search modal. Filters remain shared with /search and the home feed. */}
      <BottomSheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Pretraži automobile"
        bare
        className="flex !max-h-[min(92dvh,840px)] flex-col !overflow-hidden !p-0 sm:max-w-xl sm:!max-h-[min(88dvh,800px)]"
      >
        <div className="mx-auto mt-2 h-1 w-9 shrink-0 rounded-full bg-surface sm:hidden" aria-hidden="true" />
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-surface px-4 pb-3 pt-3 dark:border-surface sm:px-5 sm:pt-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-[17px] font-bold leading-6 tracking-tight text-app-primary dark:text-app-primary sm:text-lg">Pretraži automobile</h2>
              {advancedFilterCount > 0 && (
                <span className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-control/15 px-1.5 text-[11px] font-bold text-control">
                  {advancedFilterCount}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-[11px] leading-4 text-app-muted">Pronađi vozilo po svojim kriterijumima.</p>
          </div>
          <button type="button" onClick={() => setFiltersOpen(false)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-surface bg-elevated text-app-secondary transition-colors hover:bg-hover-surface hover:text-app-primary focus-visible:outline-2 focus-visible:outline-control"
            aria-label="Zatvori pretragu">
            <X size={16} />
          </button>
        </div>
        <div className="scrollbar-hide min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain px-4 py-3.5 sm:px-5 sm:py-4">
          <FilterSheetBody
            filters={filters}
            update={updateFilters}
            onReset={() => { resetFilters(); setSwipeIndex(0); }}
            showTrade={false}
            hideInlineReset
            className="min-w-0 space-y-3.5 [&>section]:min-w-0 [&>section:not(:last-child)]:border-b [&>section:not(:last-child)]:border-surface [&>section:not(:last-child)]:pb-3.5"
          />
        </div>
        <div className="flex shrink-0 items-center gap-2 border-t border-surface bg-card-surface px-4 pb-[max(10px,env(safe-area-inset-bottom))] pt-2.5 shadow-[0_-6px_24px_rgba(0,0,0,0.06)] dark:border-surface dark:bg-card-surface sm:px-5">
          <button type="button" onClick={() => { resetFilters(); setSwipeIndex(0); }}
            className="shrink-0 rounded-xl px-2 py-2.5 text-[12px] font-semibold text-app-secondary transition-colors hover:bg-elevated hover:text-app-primary">
            Poništi sve
          </button>
          <button type="button" onClick={() => setFiltersOpen(false)}
            className="min-h-11 min-w-0 flex-1 rounded-xl bg-brand-500 px-3 py-2.5 text-[13px] font-bold text-on-accent transition-colors hover:bg-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500">
            Prikaži {filteredCars.length} {filteredCars.length === 1 ? 'oglas' : 'oglasa'}
          </button>
        </div>
      </BottomSheet>

      {/* Mobile swipe keeps the shared header and bottom navigation available. */}
      {viewMode === 'swipe' && (
        <div className="app-swipe-view fixed inset-x-0 bg-app dark:bg-app flex flex-col" aria-label="Svajp oglasi">
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
              <h1 className="text-sm font-bold text-app-primary dark:text-app-primary">Svajp</h1>
            </div>
            <button
              onClick={() => { updateFilters({ query: '' }); setFiltersOpen(true); }}
              className="flex min-h-[44px] items-center gap-2 rounded-xl bg-elevated px-3 text-xs font-semibold text-app-secondary hover:bg-hover-surface"
              aria-label={`Filteri${activeFilters > 0 ? ` (${activeFilters} aktivnih)` : ''}`}
            >
              <SlidersHorizontal size={16} />Filteri
            </button>
          </div>

          {unreadMatches.length > 0 && <Link href={`/messages?conversation=${unreadMatches[0].id}`} className="mx-4 mt-3 flex shrink-0 items-center justify-between gap-3 rounded-xl border border-control/30 bg-control/10 px-3 py-3 text-sm font-semibold text-app-primary">
            <span className="flex items-center gap-2"><HeartHandshake size={18} className="text-brand-text" />{unreadMatches.length === 1 ? 'Novo poklapanje!' : `${unreadMatches.length} novih poklapanja`}</span><span className="text-xs">Pogledaj →</span>
          </Link>}
          {/* Scroll on short phones rather than hiding the actions behind navigation. */}
          <div className="app-swipe-content min-h-0 flex-1 flex flex-col items-center px-4 py-4 overflow-y-auto lg:justify-center lg:overflow-hidden lg:py-3">
            {swipeIndex < swipeCars.length && swipeCar ? (
              <>
                {/* Compact progress bar replaces the long row of dots. */}
                <div
                  className="mb-4 h-1 w-full max-w-sm overflow-hidden rounded-full bg-elevated lg:mb-3 lg:max-w-2xl"
                  role="progressbar"
                  aria-label="Pregledani oglasi"
                  aria-valuemin={0}
                  aria-valuemax={swipeCars.length}
                  aria-valuenow={swipeIndex + 1}
                >
                  <div
                    className="h-full rounded-full bg-brand-500 transition-[width] duration-300"
                    style={{ width: `${((swipeIndex + 1) / swipeCars.length) * 100}%` }}
                  />
                </div>

                {/* Card stack */}
                <div className="app-swipe-card relative w-full max-w-sm lg:max-w-2xl">
                  {/* Next card peeking behind */}
                  {swipeCars[swipeIndex + 1] && (
                    <div className="absolute inset-0 overflow-hidden rounded-[14px] border border-surface bg-card-surface shadow-lg dark:border-surface dark:bg-card-surface" style={{ transform: 'translateY(10px) scale(0.95)', opacity: 0.5 }}>
                      <div className="relative aspect-[4/3] w-full sm:aspect-[16/10]">
                        <img src={swipeCars[swipeIndex + 1].image} alt="" className="w-full h-full object-cover opacity-60" draggable={false} />
                      </div>
                    </div>
                  )}

                  {/* Active card */}
                  <div
                    className="listing-card listing-card-minimal group/card relative w-full overflow-hidden rounded-[14px] border border-surface bg-card-surface shadow-xl select-none touch-pan-y dark:border-surface lg:max-w-2xl lg:touch-none"
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
                    <div className="relative aspect-[4/3] w-full sm:aspect-[16/10]">
                      <img src={swipeCar.image} alt={`${swipeCar.brand} ${swipeCar.model}`} className="w-full h-full object-cover pointer-events-none" draggable={false} />
                      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/35 pointer-events-none" />

                      {!swipeCar.ownerId && <span className="pointer-events-none absolute bottom-3 left-3 text-[10px] font-bold uppercase tracking-wide text-white drop-shadow">Demo</span>}

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
                        <TradeBadge trade={swipeTl} variant="photo" className="absolute left-3 top-3 !max-w-[calc(100%-24px)]" />
                      )}
                    </div>

                    {/* Same information hierarchy as the main feed; swipe controls remain below the card. */}
                    <div className="relative flex min-w-0 flex-col px-4 pb-4 pt-3.5 sm:px-[18px] sm:pb-[18px]">
                      <h2 title={carTitle(swipeCar)} className="truncate font-heading text-[19px] font-bold leading-[1.3] tracking-[-0.025em] text-app-primary sm:text-[20px]">
                        {carTitle(swipeCar)}
                      </h2>
                      {carSubtitle(swipeCar) && (
                        <p className="mt-1 truncate text-[12px] leading-[1.5] text-app-secondary">{carSubtitle(swipeCar)}</p>
                      )}
                      <div className="mt-3 grid min-w-0 grid-cols-[0.76fr_1.26fr_1.08fr_1.17fr] items-center text-[11px] leading-[1.5] text-app-secondary">
                        {[
                          { Icon: CalendarDays, text: formatYear(swipeCar.year), label: 'Godište' },
                          { Icon: Gauge, text: formatKm(swipeCar.mileage), label: 'Kilometraža' },
                          { Icon: Settings2, text: transmissionLabel(swipeCar.specs.transmission), label: 'Menjač' },
                          { Icon: MapPin, text: swipeCar.city || 'Nije navedeno', label: 'Lokacija' },
                        ].map(({ Icon, text, label }, index) => (
                          <span key={label} title={`${label}: ${text}`}
                            className={`flex min-w-0 items-center justify-start gap-1 px-1.5 first:pl-0 last:pr-0 ${index > 0 ? 'border-l border-surface' : ''}`}>
                            <Icon size={12} strokeWidth={1.7} className="shrink-0 text-app-muted" aria-hidden="true" />
                            <span className="min-w-0 truncate tabular-nums">{text}</span>
                          </span>
                        ))}
                      </div>
                      <div className="mt-4 flex min-h-[42px] items-center justify-between gap-3 border-t border-surface pt-3.5">
                        <strong className="min-w-0 shrink-0 whitespace-nowrap font-sans text-[22px] font-bold leading-none tracking-tight tabular-nums text-app-primary sm:text-[24px]">
                          {formatEuro(swipeCar.price)}
                        </strong>
                        <Link href={`/car/${swipeCar.id}`} className="inline-flex shrink-0 items-center gap-[3px] whitespace-nowrap text-[12px] font-medium leading-[18px] text-[#B45309] dark:text-[#F58A38] sm:text-[13px]"
                          onPointerDown={(event) => event.stopPropagation()}
                          onPointerUp={(event) => event.stopPropagation()}>
                          <span className="leading-[18px]">Pogledaj oglas</span>
                          <ChevronRight size={14} className="block shrink-0 self-center" aria-hidden="true" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex shrink-0 items-center gap-5 mt-3 lg:mt-4 lg:gap-7">
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
                <h2 className="text-xl font-bold text-app-primary dark:text-app-primary mb-2">{noSwipeResults ? 'Nema oglasa za ove filtere' : 'Sve pregledano!'}</h2>
                <p className="text-sm text-app-secondary dark:text-app-secondary mb-1">{noSwipeResults ? 'Promeni filtere da vidiš više vozila.' : swipeEligibleCars.length === 0 ? 'Trenutno nema dostupnih oglasa za svajp.' : 'Pregledao si sve dostupne oglase za svajp.'}</p>
                <p className="text-xs text-app-muted mb-6">Sačuvano: {saved.length} oglasa</p>
                <div className="flex gap-3">
                  {noSwipeResults ? <button onClick={resetFilters} className="rounded-xl bg-elevated px-4 py-2.5 text-sm font-semibold text-app-primary hover:bg-hover-surface">Resetuj filtere</button> : <button onClick={async () => {
                    const reset = await resetPasses();
                    if (!reset.ok) {
                      toast.error(reset.message || 'Preskočeni oglasi nisu vraćeni. Pokušaj ponovo.');
                      return;
                    }
                    // Earlier versions deleted pass rows without reopening the
                    // cards. If that already happened, there is no pass history
                    // left to fetch. Recover from the current marketplace feed,
                    // but never replay cars the user liked.
                    const storedPassIds = new Set(reset.restoredIds);
                    // Primary queue: exact skipped cars that still exist.
                    // If older resets erased the pass records, recover every
                    // available unliked car, independent of search filters.
                    const preferredIds = swipeEligibleCars
                      .filter(car => !likedCarIds.has(car.id))
                      .filter(car => storedPassIds.size === 0 || storedPassIds.has(car.id))
                      .map(car => car.id);
                    // When every available listing is already liked or prior
                    // resets removed all passes, still let the user replay the
                    // deck. Replaying does NOT reset any likes in the database.
                    const replayIds = preferredIds.length > 0
                      ? preferredIds
                      : swipeEligibleCars.map(car => car.id);
                    if (replayIds.length === 0) {
                      toast.message('Trenutno nema dostupnih oglasa za ponovno pregledanje.');
                      return;
                    }
                    setSessionReviewedIds(new Set());
                    setReplaySkippedIds(replayIds);
                    setSwipeIndex(0);
                    setDragX(0);
                    setIsAnimating(false);
                    toast.success(storedPassIds.size > 0 && preferredIds.length > 0
                      ? `Vraćeno ${replayIds.length} preskočenih oglasa.`
                      : `Ponovo prikazano ${replayIds.length} dostupnih oglasa. Postojeći lajkovi su sačuvani.`);
                  }} className="flex items-center gap-2 bg-elevated hover:bg-hover-surface text-app-primary dark:text-app-primary font-semibold px-4 py-2.5 rounded-xl text-sm transition-all">
                    <RotateCcw size={15} /> Ponovi preskočene
                  </button>}
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
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h1 className="text-base font-bold leading-snug text-app-primary dark:text-app-primary sm:text-lg">
                    {activeCarName ? `Zamene za ${activeCarName}` : 'Istraži automobile'}
                  </h1>
                </div>

              </div>
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

            {marketplaceReady && smartSwapCars.length > 0 && (
              <section aria-label="Predložene obostrane zamene" className="mb-6">
                <div className="mb-3 flex items-center gap-2">
                  <HeartHandshake size={19} className="text-brand-text" aria-hidden="true" />
                  <div>
                    <h2 className="text-base font-bold text-app-primary">Predložene zamene za tebe</h2>
                    <p className="text-xs text-app-secondary">Oba vlasnika traže model koji drugi nudi. Ovo još nije potvrđen Match.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 desktop:grid-cols-3 desktop:gap-5">
                  {smartSwapCars.map(car => (
                    <MarketplaceV13Card
                      key={car.id}
                      minimalHome
                      car={car}
                      trade={showTrade ? getTradeLabel(selectedCar, car) : null}
                      favoriteModel={preferences.favoriteModels.some(key => key.toLocaleLowerCase('sr').trim() === `${car.brand}::${car.model}`.toLocaleLowerCase('sr').trim())}
                      onLike={listing => { void likeCar(listing); }}
                      liking={isLiking(car.id)}
                      liked={saved.includes(car.id) || likedCarIds.has(car.id)}
                      onMessage={isLoggedIn ? listing => { void openMessage(listing); } : undefined}
                      messaging={messagingId === car.id}
                      onOffer={openOffer}
                      offerId={activeOfferIds.get(car.id)}
                    />
                  ))}
                </div>
              </section>
            )}

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
            <div id="listing-results" className="grid scroll-mt-24 grid-cols-1 gap-4 pb-4 sm:grid-cols-2 desktop:grid-cols-3 desktop:gap-5">
          {pagination.items.map((car, index) => {
            const tl = showTrade ? getTradeLabel(selectedCar, car) : null;
            const globalIndex = (pagination.page - 1) * LISTINGS_PER_PAGE + index;
            const startsAlternatives = showAlternatives && alternativeCars.length > 0
              && globalIndex === ordinaryExactCount;
            return (
              <div key={car.id} className="contents">
                {startsAlternatives && (
                  <div className="col-span-full rounded-xl border border-surface bg-elevated/50 px-4 py-3 dark:border-[#35465E] dark:bg-[#19263B]/70" role="status">
                    <p className="text-[13px] font-semibold text-app-primary">
                      {filteredCars.length === 0
                        ? 'Trenutno nema vozila koja ispunjavaju sve tvoje kriterijume.'
                        : `Pronašli smo samo ${filteredCars.length} ${filteredCars.length === 1 ? 'oglas' : 'oglasa'} po tvojim kriterijumima.`}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-app-secondary">
                      Ispod su druga vozila koja bi te mogla zanimati, poređana po postojećim pravilima sortiranja.
                    </p>
                  </div>
                )}
                <MarketplaceV13Card
                  minimalHome
                  car={car}
                  favoriteModel={preferences.favoriteModels.some(key => key.toLocaleLowerCase('sr').trim() === `${car.brand}::${car.model}`.toLocaleLowerCase('sr').trim())}
                  trade={tl}
                  onLike={(listing) => { void likeCar(listing); }}
                  liking={isLiking(car.id)}
                  liked={saved.includes(car.id) || likedCarIds.has(car.id)}
                  onMessage={isLoggedIn ? (listing) => { void openMessage(listing); } : undefined}
                  messaging={messagingId === car.id}
                  onOffer={openOffer}
                  offerId={activeOfferIds.get(car.id)}
                />
              </div>
            );
          })}
              <ListingPagination page={pagination.page} total={displayCars.length} onChange={pagination.changePage} />
            </div>
          )}
          </div>
        </div>
      )}

      {/* CarForm renders its own full-screen portal — no sheet wrapper. */}
      {showAddForm && (
        <CarForm onSave={handleAddCar} onCancel={() => setShowAddForm(false)} />
      )}

      {newCarPreferencesId && selectedCar?.id === newCarPreferencesId && (
        <MobilePreferences key={newCarPreferencesId} hasGarageCar autoOpen hideTrigger onDismiss={() => setNewCarPreferencesId(null)} />
      )}

      <TradeOfferSheet car={offerCar} myCar={selectedCar} onClose={() => setOfferCar(null)} />
    </div>
  );
}


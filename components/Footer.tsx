'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { House as Home, Heart, Warehouse, MessageCircle, Plus, Flame, LayoutGrid, User } from 'lucide-react';
import BrandLockup from '@/components/BrandLockup';
import HeaderCarSelector from '@/components/HeaderCarSelector';
import { useFeedView } from '@/hooks/use-feed-view';
import { useOffers } from '@/hooks/use-offers';
import { useMessages } from '@/hooks/use-messages';
import { useSaved } from '@/hooks/use-saved';
import { useAuth } from '@/hooks/use-auth';
import { useUser } from '@/hooks/use-user';
import { useGarage } from '@/hooks/use-garage';

const DESKTOP_NAV_ITEMS = [
  { href: '/', label: 'Početna', icon: Home },
  { href: '/saved', label: 'Sačuvano', icon: Heart },
  { href: '/garage', label: 'Garaža', icon: Warehouse },
  { href: '/messages', label: 'Poruke', icon: MessageCircle },
] as const;

const MOBILE_NAV_ITEMS = [
  { href: '/', label: 'Oglasi', icon: LayoutGrid, view: 'grid' },
  { href: '/saved', label: 'Sačuvano', icon: Heart },
  { href: '/?view=swipe', label: 'Svajp', icon: Flame, view: 'swipe' },
  { href: '/messages', label: 'Poruke', icon: MessageCircle },
  { href: '/profile', label: 'Profil', icon: User },
] as const;

function Badge({ count, desktop = false }: { count: number; desktop?: boolean }) {
  if (count <= 0) return null;
  return (
    <span aria-hidden="true" className={desktop ? 'ml-0.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-white/10 px-1 text-[10px] font-semibold leading-none text-brand-dark-primary tabular-nums' : 'absolute -right-1 top-0 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-brand-500 px-1 text-[9px] font-bold leading-none text-on-accent ring-2 ring-[hsl(var(--surface-brand-dark))]'}>
      {count > 9 ? '9+' : count}
    </span>
  );
}

export default function Footer({ hideDesktopHeader = false }: { hideDesktopHeader?: boolean }) {
  const pathname = usePathname();
  const { unread: offerUnread, mounted: offersReady } = useOffers({ poll: true });
  const { totalUnread, unreadMatches, mounted: messagesReady } = useMessages({ poll: true });
  const { viewMode, setViewMode, hrefForView } = useFeedView();
  const { count: savedCount, mounted: savedReady } = useSaved();
  const { isLoggedIn, mounted: authReady, userId, requireAuth } = useAuth();
  const { user: profile } = useUser();
  const { cars, selectedCar, selectCar, canAddCar, mounted: garageReady } = useGarage();
  const router = useRouter();
  const name = profile.id === userId ? profile.name.trim() || 'Moj nalog' : 'Moj nalog';
  const initials = name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  function addVehicle() {
    const url = new URL(window.location.href);
    if (pathname !== '/') {
      url.pathname = '/';
      url.search = '';
    }
    url.searchParams.set('intent', 'add-car');
    router.push(url.pathname + url.search, { scroll: false });
  }

  function editVehicle() {
    if (selectedCar) router.push(`/garage?edit=${encodeURIComponent(selectedCar.id)}`);
  }

  function badgeFor(href: string): number {
    // Unread messages sit behind sign-in; badging them for a visitor who would
    // only hit the sign-in prompt is noise.
    if (href === '/messages') return authReady && isLoggedIn
      ? (messagesReady ? totalUnread : 0) + (offersReady ? offerUnread : 0)
      : 0;
    if (href === '/saved') return savedReady ? savedCount : 0;
    return 0;
  }

  return (
    <>
      <header className={`carbon-header app-account-header fixed inset-x-0 top-0 z-50 ${isLoggedIn ? '' : 'hidden lg:block'} ${hideDesktopHeader ? 'lg:hidden' : ''}`}>
        <div className="app-container flex h-16 items-center justify-between gap-2 lg:grid lg:h-[79px] lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:gap-5">
          <Link href="/" aria-label="AutoTrampa — početna" className="carbon-brand app-account-brand"><BrandLockup header /></Link>
          <nav aria-label="Glavna navigacija" className="hidden h-full min-w-0 items-center justify-center gap-1 lg:flex xl:gap-2">
            {DESKTOP_NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
              const count = badgeFor(href);
              return <Link key={href} href={href} aria-current={active ? 'page' : undefined}
                aria-label={count > 0 ? `${label}, ${count} ${href === '/saved' ? 'sačuvanih oglasa' : 'nepročitanih poruka i ponuda'}` : undefined}
                className="app-header-link">
                <Icon size={18} strokeWidth={1.8} aria-hidden="true" />{label}<Badge count={count} desktop />
              </Link>;
            })}
          </nav>
          <div className="flex shrink-0 items-center gap-2 lg:gap-3">
            <Link href="/?intent=add-car" aria-label="Dodaj oglas" className="hidden h-9 w-9 items-center justify-center gap-1.5 rounded-lg bg-brand-500 font-semibold text-on-accent hover:bg-brand-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 lg:inline-flex lg:h-10 lg:w-auto lg:px-3.5 lg:text-xs">
              <Plus size={19} aria-hidden="true" /><span className="hidden lg:inline">Dodaj oglas</span>
            </Link>
            {isLoggedIn ? <>
              <HeaderCarSelector cars={cars} selectedCar={selectedCar} ready={garageReady} canAddCar={canAddCar} selectCar={selectCar} onAddCar={addVehicle} onEditCar={editVehicle} />
              <div className="hidden lg:block lg:border-l lg:border-white/10 lg:pl-3">
                <Link href="/profile" aria-label="Moj profil" aria-current={pathname === '/profile' ? 'page' : undefined} className="app-header-icon !h-11 !w-11 gap-2 lg:!h-9 lg:!w-auto lg:px-1">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/10 text-[10px] font-bold text-brand-dark-primary">{initials}</span>
                  <span className="hidden max-w-[110px] truncate text-xs text-brand-dark-primary xl:inline">{name}</span>
                </Link>
              </div>
            </> : <button className="carbon-nav-link" onClick={() => requireAuth('Prijavi se na AutoTrampu')}>Prijavi se</button>}
          </div>
        </div>
      </header>
      <nav
        data-app-bottom-nav
        aria-label="Glavna navigacija"
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-brand-dark bg-brand-dark text-brand-dark-secondary safe-bottom lg:hidden"
      >
        <div className="mx-auto flex w-full max-w-md h-16 items-center justify-around px-1 md:max-w-2xl lg:max-w-5xl">
          {MOBILE_NAV_ITEMS.map((item) => {
            const { label, icon: Icon } = item;
            const view = 'view' in item ? item.view : null;
            const href = view ? hrefForView(view) : item.href;
            const active = view ? pathname === '/' && viewMode === view : pathname.startsWith(item.href) || (item.href === '/profile' && pathname.startsWith('/garage'));
            const count = view === 'swipe' ? (isLoggedIn && messagesReady ? unreadMatches.length : 0) : badgeFor(item.href);
            const badgeLabel = view === 'swipe' ? 'novih poklapanja' : item.href === '/saved' ? 'sačuvanih oglasa' : 'nepročitanih poruka i ponuda';
            return (
              <Link
                key={item.href}
                href={href}
                onClick={event => {
                  if (!view || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                  event.preventDefault();
                  setViewMode(view);
                }}
                aria-label={count > 0 ? `${label}, ${count} ${badgeLabel}` : label}
                aria-current={active ? 'page' : undefined}
                className={`relative flex min-h-[44px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1.5 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                  active ? 'text-brand-500' : 'text-brand-dark-secondary hover:text-brand-dark-primary'
                }`}
              >
                <span className="relative">
                  <Icon size={22} strokeWidth={active ? 2.5 : 1.8} className={`transition-transform duration-200 ${active ? 'scale-110' : ''}`} />
                  <Badge count={count} />
                </span>
                <span className={`text-[10px] font-medium tracking-tight ${active ? 'text-brand-500' : ''}`}>
                  {label}
                </span>
                {active && <span className="absolute -top-0.5 h-1 w-1 rounded-full bg-brand-500" />}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

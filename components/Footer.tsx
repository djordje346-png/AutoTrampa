'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { House as Home, Heart, Warehouse, MessageCircle, User } from 'lucide-react';
import BrandLockup from '@/components/BrandLockup';
import { useMessages } from '@/hooks/use-messages';
import { useSaved } from '@/hooks/use-saved';
import { useAuth } from '@/hooks/use-auth';

const NAV_ITEMS = [
  { href: '/', label: 'Početna', icon: Home },
  { href: '/saved', label: 'Sačuvano', icon: Heart },
  { href: '/garage', label: 'Garaža', icon: Warehouse },
  { href: '/messages', label: 'Poruke', icon: MessageCircle },
  { href: '/profile', label: 'Profil', icon: User },
] as const;

function Badge({ count, desktop = false }: { count: number; desktop?: boolean }) {
  if (count <= 0) return null;
  return (
    <span aria-hidden={desktop || undefined} className={desktop ? 'ml-0.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-white/10 px-1 text-[10px] font-semibold leading-none text-brand-dark-primary tabular-nums' : 'absolute -right-1 top-0 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-brand-500 px-1 text-[9px] font-bold leading-none text-on-accent ring-2 ring-[hsl(var(--surface-brand-dark))]'}>
      {count > 9 ? '9+' : count}
    </span>
  );
}

export default function Footer({ hideDesktopHeader = false }: { hideDesktopHeader?: boolean }) {
  const pathname = usePathname();
  const { totalUnread, mounted: messagesReady } = useMessages({ poll: false });
  const { count: savedCount, mounted: savedReady } = useSaved();
  const { isLoggedIn, mounted: authReady } = useAuth();

  function badgeFor(href: string): number {
    // Unread messages sit behind sign-in; badging them for a visitor who would
    // only hit the sign-in prompt is noise.
    if (href === '/messages') return messagesReady && authReady && isLoggedIn ? totalUnread : 0;
    if (href === '/saved') return savedReady ? savedCount : 0;
    return 0;
  }

  return (
    <>
      <nav
        aria-label="Glavna navigacija"
        className={`carbon-header fixed inset-x-0 top-0 z-50 hidden ${hideDesktopHeader ? 'lg:hidden' : 'lg:block'}`}
      >
        <div className="app-container grid h-[71px] grid-cols-[auto_minmax(0,1fr)] items-center gap-6">
          <Link href="/" aria-label="AutoTrampa — početna" className="carbon-brand">
            <BrandLockup header />
          </Link>
          <div className="flex min-w-0 items-center justify-end gap-1 xl:gap-2">
            {NAV_ITEMS.filter(({ href }) => href !== '/profile').map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              const count = badgeFor(href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  aria-label={count > 0 ? `${label}, ${count} ${href === '/saved' ? 'sačuvanih oglasa' : 'nepročitanih poruka'}` : undefined}
                  className="carbon-nav-link"
                >
                  <span className="relative flex">
                    <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
                  </span>
                  {label}
                  <Badge count={count} desktop />
                </Link>
              );
            })}
            <Link
              href="/profile"
              aria-label="Profil"
              aria-current={pathname === '/profile' ? 'page' : undefined}
              className="carbon-nav-link ml-3 !w-11 !px-0 xl:ml-5"
            >
              <User size={19} strokeWidth={1.8} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </nav>
      <nav
        data-app-bottom-nav
        aria-label="Glavna navigacija"
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-brand-dark bg-brand-dark text-brand-dark-secondary safe-bottom lg:hidden"
      >
        <div className="mx-auto flex w-full max-w-md items-center justify-around px-1 py-2 md:max-w-2xl lg:max-w-5xl">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            const count = badgeFor(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`relative flex min-w-[44px] flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                  active ? 'text-brand-500' : 'text-brand-dark-secondary hover:text-brand-dark-primary'
                }`}
              >
                <span className="relative">
                  <Icon size={22} strokeWidth={active ? 2.5 : 1.8} className={`transition-transform duration-200 ${active ? 'scale-110' : ''}`} />
                  <Badge count={count} />
                </span>
                <span className={`text-[9px] font-medium tracking-tight ${active ? 'text-brand-500' : ''}`}>
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

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CarFront, Chrome as Home, Heart, Warehouse, MessageCircle, User } from 'lucide-react';
import { useMessages } from '@/hooks/use-messages';
import { useSaved } from '@/hooks/use-saved';
import { useAuth } from '@/hooks/use-auth';
import { useDesktopHeaderActions } from '@/components/DesktopHeaderActions';

const NAV_ITEMS = [
  { href: '/', label: 'Početna', icon: Home },
  { href: '/saved', label: 'Sačuvano', icon: Heart },
  { href: '/garage', label: 'Garaža', icon: Warehouse },
  { href: '/messages', label: 'Poruke', icon: MessageCircle },
  { href: '/profile', label: 'Profil', icon: User },
] as const;

function Badge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="absolute -right-1 top-0 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-brand-500 px-1 text-[9px] font-bold leading-none text-on-accent ring-2 ring-[hsl(var(--surface-card))]">
      {count > 9 ? '9+' : count}
    </span>
  );
}

export default function Footer() {
  const pathname = usePathname();
  const { totalUnread, mounted: messagesReady } = useMessages({ poll: false });
  const { count: savedCount, mounted: savedReady } = useSaved();
  const { isLoggedIn, mounted: authReady } = useAuth();
  const { action: desktopAction } = useDesktopHeaderActions();

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
        className="sticky top-0 z-40 hidden border-b border-[#3A2A42] bg-[#24172E] text-zinc-200 shadow-sm lg:block"
      >
        <div className="mx-auto grid h-16 w-full max-w-7xl grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 px-8">
          <Link href="/" aria-label="AutoTrampa — početna" className="flex w-fit items-center gap-2 text-white">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-black"><CarFront size={20} strokeWidth={2.2} /></span>
            <span className="text-base font-bold tracking-tight">AutoTrampa</span>
          </Link>
          <div className="flex items-center justify-center gap-2">
            {NAV_ITEMS.filter(({ href }) => href !== '/profile').map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              const count = badgeFor(href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={`relative flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                    active ? 'bg-white/10 text-[#FAEB00]' : 'text-zinc-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span className="relative flex">
                    <Icon size={18} strokeWidth={active ? 2.5 : 1.9} />
                    <Badge count={count} />
                  </span>
                  {label}
                </Link>
              );
            })}
          </div>
          <div className="flex items-center justify-end gap-2">
            {desktopAction}
            <Link
              href="/profile"
              aria-label="Profil"
              aria-current={pathname === '/profile' ? 'page' : undefined}
              className={`flex h-10 w-10 items-center justify-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FAEB00] ${pathname === '/profile' ? 'border-[#FAEB00]/50 bg-white/10 text-[#FAEB00]' : 'border-white/15 bg-white/5 text-zinc-200 hover:border-[#FAEB00]/50 hover:text-[#FAEB00]'}`}
            >
              <User size={19} />
            </Link>
          </div>
        </div>
      </nav>
      <nav
        aria-label="Glavna navigacija"
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-surface bg-card-surface text-app-secondary safe-bottom lg:hidden"
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
                  active ? 'text-brand-text' : 'text-app-muted hover:text-app-primary'
                }`}
              >
                <span className="relative">
                  <Icon size={22} strokeWidth={active ? 2.5 : 1.8} className={`transition-transform duration-200 ${active ? 'scale-110' : ''}`} />
                  <Badge count={count} />
                </span>
                <span className={`text-[9px] font-medium tracking-tight ${active ? 'text-brand-text' : ''}`}>
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

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Chrome as Home, Heart, Warehouse, MessageCircle, User } from 'lucide-react';
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

  function badgeFor(href: string): number {
    // Unread messages sit behind sign-in; badging them for a visitor who would
    // only hit the sign-in prompt is noise.
    if (href === '/messages') return messagesReady && authReady && isLoggedIn ? totalUnread : 0;
    if (href === '/saved') return savedReady ? savedCount : 0;
    return 0;
  }

  return (
    <nav
      aria-label="Glavna navigacija"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-surface bg-card-surface text-app-secondary safe-bottom"
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
                <Icon
                  size={22}
                  strokeWidth={active ? 2.5 : 1.8}
                  className={`transition-transform duration-200 ${active ? 'scale-110' : ''}`}
                />
                <Badge count={count} />
              </span>
              <span className={`text-[9px] font-medium tracking-tight ${active ? 'text-brand-text' : ''}`}>
                {label}
              </span>
              {active && (
                <span className={`absolute -top-0.5 h-1 w-1 rounded-full ${active ? 'bg-brand-500' : 'bg-transparent'}`} />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

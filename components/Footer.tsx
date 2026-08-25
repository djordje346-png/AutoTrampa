'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Chrome as Home, Heart, Warehouse, MessageCircle, User } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/', label: 'Početna', icon: Home },
  { href: '/saved', label: 'Sačuvano', icon: Heart },
  { href: '/garage', label: 'Garaža', icon: Warehouse },
  { href: '/messages', label: 'Poruke', icon: MessageCircle },
  { href: '/profile', label: 'Profil', icon: User },
];

export default function Footer() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-app border-t border-surface safe-bottom">
      <div className="mx-auto flex w-full max-w-md items-center justify-around px-1 py-2 md:max-w-2xl lg:max-w-5xl">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`relative flex min-w-[44px] flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 transition-all duration-200 ${
                active ? 'text-orange-400' : 'text-app-muted hover:text-app-secondary'
              }`}
              aria-label={label}
            >
              <Icon
                size={22}
                strokeWidth={active ? 2.5 : 1.8}
                className={`transition-transform duration-200 ${active ? 'scale-110' : ''}`}
              />
              <span className={`text-[9px] font-medium tracking-tight ${active ? 'text-orange-400' : ''}`}>
                {label}
              </span>
              {active && (
                <span className="absolute -top-0.5 w-1 h-1 rounded-full bg-orange-400" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

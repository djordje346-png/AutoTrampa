'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Heart, Wrench, User } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/', label: 'Feed', icon: Home },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/saved', label: 'Saved', icon: Heart },
  { href: '/garage', label: 'Garage', icon: Wrench },
  { href: '/profile', label: 'Profile', icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-md border-t border-slate-800">
      <div className="max-w-md mx-auto flex items-center justify-around px-2 py-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 ${
                active
                  ? 'text-amber-400'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Icon
                size={22}
                strokeWidth={active ? 2.5 : 1.8}
                className={`transition-transform duration-200 ${active ? 'scale-110' : ''}`}
              />
              <span className={`text-[10px] font-medium tracking-wide ${active ? 'text-amber-400' : ''}`}>
                {label}
              </span>
              {active && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-amber-400" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Heart, Warehouse, MessageCircle, User } from 'lucide-react';

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
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-md border-t border-slate-800">
      <div className="max-w-md mx-auto flex items-center justify-around px-1 py-1.5">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`relative flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-all duration-200 ${
                active ? 'text-amber-400' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Icon
                size={20}
                strokeWidth={active ? 2.5 : 1.8}
                className={`transition-transform duration-200 ${active ? 'scale-110' : ''}`}
              />
              <span className={`text-[9px] font-medium tracking-tight ${active ? 'text-amber-400' : ''}`}>
                {label}
              </span>
              {active && (
                <span className="absolute -top-0.5 w-1 h-1 rounded-full bg-amber-400" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

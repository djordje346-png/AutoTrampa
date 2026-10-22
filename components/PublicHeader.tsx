'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowRight, Menu, X } from 'lucide-react';
import BrandLockup from '@/components/BrandLockup';

interface PublicHeaderProps {
  onAddCar: () => void;
  onSignIn: () => void;
  onRegister: () => void;
}

const navClass = (active: boolean) =>
  `relative flex items-center gap-2 rounded-lg px-1.5 py-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 xl:px-3 xl:text-sm ${
    active ? 'bg-white/10 text-brand-500' : 'text-brand-dark-secondary hover:bg-white/10 hover:text-brand-dark-primary'
  }`;

export default function PublicHeader({ onAddCar, onSignIn, onRegister }: PublicHeaderProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const howHref = pathname === '/' ? '#kako-funkcionise' : '/#kako-funkcionise';
  const whyHref = pathname === '/' ? '#smart-match' : '/#smart-match';
  const isSearch = pathname === '/search';

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-brand-dark bg-brand-dark text-brand-dark-primary shadow-sm">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:grid lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:gap-4 lg:px-8">
        <div className="flex min-w-0 items-center">
          <Link href="/" aria-label="AutoTrampa — početna" className="flex shrink-0 items-center gap-2 text-brand-dark-primary">
            <BrandLockup />
          </Link>
        </div>

        <nav aria-label="Glavni meni" className="hidden items-center justify-center gap-0 lg:flex xl:gap-1">
          <a href={howHref} onClick={() => setActiveSection('how')} aria-current={activeSection === 'how' ? 'location' : undefined} className={navClass(activeSection === 'how')}>Kako funkcioniše</a>
          <Link href="/search" aria-current={isSearch ? 'page' : undefined} className={navClass(isSearch)}>Oglasi</Link>
          <a href={whyHref} onClick={() => setActiveSection('why')} aria-current={activeSection === 'why' ? 'location' : undefined} className={navClass(activeSection === 'why')}>Zašto AutoTrampa</a>
        </nav>

        <div className="hidden items-center justify-self-end gap-1 lg:flex xl:gap-2">
          <button type="button" onClick={onSignIn} className={navClass(false)}>Prijavi se</button>
          <button type="button" onClick={onRegister} className="btn-primary btn-primary-compact !rounded-xl ml-1 whitespace-nowrap text-xs">Registruj se</button>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <button type="button" onClick={onSignIn} className="rounded-lg px-2.5 py-2 text-xs font-semibold text-brand-dark-secondary transition-colors hover:bg-white/10 hover:text-brand-dark-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 sm:text-sm">Prijavi se</button>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? 'Zatvori meni' : 'Otvori meni'}
            aria-expanded={menuOpen}
            aria-controls="public-mobile-menu"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-brand-dark-primary transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            {menuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav id="public-mobile-menu" aria-label="Mobilni meni" className="absolute inset-x-0 top-full border-b border-brand-dark bg-brand-dark p-4 shadow-lg lg:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1">
            <a href={howHref} onClick={() => { setActiveSection('how'); closeMenu(); }} className="rounded-xl px-3 py-3 text-sm font-semibold text-brand-dark-secondary transition-colors hover:bg-white/10 hover:text-brand-dark-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">Kako funkcioniše</a>
            <Link href="/search" onClick={closeMenu} className="rounded-xl px-3 py-3 text-sm font-semibold text-brand-dark-secondary transition-colors hover:bg-white/10 hover:text-brand-dark-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">Oglasi</Link>
            <a href={whyHref} onClick={() => { setActiveSection('why'); closeMenu(); }} className="rounded-xl px-3 py-3 text-sm font-semibold text-brand-dark-secondary transition-colors hover:bg-white/10 hover:text-brand-dark-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">Zašto AutoTrampa</a>
            <button type="button" onClick={() => { closeMenu(); onAddCar(); }} className="btn-primary mt-2 w-full text-sm">Dodaj svoj auto <ArrowRight size={16} /></button>
          </div>
        </nav>
      )}
    </header>
  );
}

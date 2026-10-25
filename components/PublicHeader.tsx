'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import BrandLockup from '@/components/BrandLockup';

interface PublicHeaderProps {
  onAddCar: () => void;
  onSignIn: () => void;
  onRegister: () => void;
}

export default function PublicHeader({ onSignIn, onRegister }: PublicHeaderProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const headerRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const mobileMenuRef = useRef<HTMLElement>(null);
  const howHref = pathname === '/' ? '#kako-funkcionise' : '/#kako-funkcionise';
  const whyHref = pathname === '/' ? '#smart-match' : '/#smart-match';
  const isSearch = pathname === '/search' || pathname.startsWith('/car/');

  useEffect(() => {
    setMenuOpen(false);
    setActiveSection(null);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    mobileMenuRef.current?.querySelector<HTMLAnchorElement>('a')?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    }
    function onPointerDown(event: PointerEvent) {
      if (event.target instanceof Node && !headerRef.current?.contains(event.target)) setMenuOpen(false);
    }
    const desktop = window.matchMedia('(min-width: 1024px)');
    const closeOnDesktop = () => { if (desktop.matches) setMenuOpen(false); };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    desktop.addEventListener('change', closeOnDesktop);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
      desktop.removeEventListener('change', closeOnDesktop);
    };
  }, [menuOpen]);

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <header ref={headerRef} className="carbon-header sticky top-0 z-50">
      <div className="app-container flex h-[63px] items-center justify-between gap-3 lg:grid lg:h-[71px] lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:gap-3">
        <div className="flex min-w-0 items-center">
          <Link href="/" aria-label="AutoTrampa — početna" className="carbon-brand">
            <BrandLockup header />
          </Link>
        </div>

        <nav aria-label="Glavni meni" className="hidden items-center justify-center gap-1 lg:flex xl:gap-2">
          <a href={howHref} onClick={() => setActiveSection('how')} aria-current={!isSearch && activeSection === 'how' ? 'location' : undefined} className="carbon-nav-link">Kako funkcioniše</a>
          <Link href="/search" aria-current={isSearch ? 'page' : undefined} className="carbon-nav-link">Oglasi</Link>
          <a href={whyHref} onClick={() => setActiveSection('why')} aria-current={!isSearch && activeSection === 'why' ? 'location' : undefined} className="carbon-nav-link">Zašto AutoTrampa</a>
        </nav>

        <div className="hidden items-center justify-self-end gap-2 lg:flex xl:gap-3">
          <button type="button" onClick={onSignIn} className="carbon-nav-link">Prijavi se</button>
          <button type="button" onClick={onRegister} className="carbon-header-cta">Registruj se</button>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <button type="button" onClick={onSignIn} className="carbon-nav-link !px-2">Prijavi se</button>
          <button
            type="button"
            ref={menuButtonRef}
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? 'Zatvori meni' : 'Otvori meni'}
            aria-expanded={menuOpen}
            aria-controls="public-mobile-menu"
            className="carbon-nav-link !w-11 !px-0"
          >
            {menuOpen ? <X size={19} strokeWidth={1.8} aria-hidden="true" /> : <Menu size={19} strokeWidth={1.8} aria-hidden="true" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav ref={mobileMenuRef} id="public-mobile-menu" aria-label="Mobilni meni" className="absolute inset-x-0 top-full max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain border-b border-brand-dark bg-brand-dark p-4 lg:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1">
            <a href={howHref} aria-current={!isSearch && activeSection === 'how' ? 'location' : undefined} onClick={() => { setActiveSection('how'); closeMenu(); }} className="carbon-nav-link">Kako funkcioniše</a>
            <Link href="/search" aria-current={isSearch ? 'page' : undefined} onClick={closeMenu} className="carbon-nav-link">Oglasi</Link>
            <a href={whyHref} aria-current={!isSearch && activeSection === 'why' ? 'location' : undefined} onClick={() => { setActiveSection('why'); closeMenu(); }} className="carbon-nav-link">Zašto AutoTrampa</a>
            <button type="button" onClick={() => { closeMenu(); onRegister(); }} className="carbon-header-cta mt-3 w-full">Registruj se</button>
          </div>
        </nav>
      )}
    </header>
  );
}

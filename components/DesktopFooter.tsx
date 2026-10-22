import Link from 'next/link';
import { CarFront } from 'lucide-react';

const DISCOVERY_LINKS = [
  { href: '/', label: 'Oglasi' },
  { href: '/search', label: 'Pretraga' },
  { href: '/saved', label: 'Sačuvano' },
] as const;

const ACCOUNT_LINKS = [
  { href: '/garage', label: 'Garaža' },
  { href: '/messages', label: 'Poruke' },
  { href: '/profile', label: 'Profil' },
] as const;

const LINK_CLASS = 'w-fit text-sm text-brand-dark-secondary transition-colors hover:text-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500';

export function DesktopFooter() {
  return (
    <footer className="mt-auto hidden border-t border-brand-dark bg-brand-dark text-brand-dark-secondary lg:block">
      <div className="mx-auto max-w-7xl px-8">
        <div className="grid gap-8 py-9 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr]">
          <div className="max-w-sm">
            <Link href="/" aria-label="AutoTrampa — početna" className="inline-flex items-center gap-2 text-brand-dark-primary">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-on-accent">
                <CarFront size={20} strokeWidth={2.2} />
              </span>
              <span className="text-base font-bold tracking-tight">AutoTrampa</span>
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-brand-dark-secondary">
              Pronađi automobil za zamenu i dogovori se direktno sa vlasnikom.
            </p>
          </div>

          <nav aria-label="Oglasi i pretraga" className="flex flex-col items-start gap-3">
            <h2 className="mb-1 text-xs font-bold uppercase tracking-wider text-brand-dark-primary">Istraži</h2>
            {DISCOVERY_LINKS.map(({ href, label }) => <Link key={href} href={href} className={LINK_CLASS}>{label}</Link>)}
          </nav>

          <nav aria-label="Nalog" className="flex flex-col items-start gap-3">
            <h2 className="mb-1 text-xs font-bold uppercase tracking-wider text-brand-dark-primary">Moj nalog</h2>
            {ACCOUNT_LINKS.map(({ href, label }) => <Link key={href} href={href} className={LINK_CLASS}>{label}</Link>)}
          </nav>
        </div>

        <div className="border-t border-brand-dark py-4 text-xs text-brand-dark-secondary">
          AutoTrampa · Platforma za zamenu automobila
        </div>
      </div>
    </footer>
  );
}

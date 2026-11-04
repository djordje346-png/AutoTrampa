import Link from 'next/link';
import BrandLockup from '@/components/BrandLockup';
import { LEGAL } from '@/lib/legal';

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

export function DesktopFooter({ showOnMobile = false }: { showOnMobile?: boolean }) {
  return (
    <footer className={`mt-auto ${showOnMobile ? 'block' : 'hidden lg:block'} border-t border-brand-dark bg-brand-dark text-brand-dark-secondary`}>
      <div className="mx-auto max-w-7xl px-8">
        <div className="grid gap-8 py-9 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr]">
          <div className="max-w-sm">
            <Link href="/" aria-label="AutoTrampa — početna" className="inline-flex items-center gap-2 text-brand-dark-primary">
              <BrandLockup />
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

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-brand-dark py-4 text-xs text-brand-dark-secondary">
          <span>AutoTrampa · Platforma za zamenu automobila</span>
          <nav aria-label="Pravila u podnožju" className="flex flex-wrap gap-x-5 gap-y-3">
            <Link href={LEGAL.termsPath} className={LINK_CLASS}>Uslovi korišćenja</Link>
            <Link href={LEGAL.privacyPath} className={LINK_CLASS}>Politika privatnosti</Link>
            <a href={`mailto:${LEGAL.email}`} className={LINK_CLASS}>Kontakt</a>
          </nav>
        </div>
      </div>
    </footer>
  );
}

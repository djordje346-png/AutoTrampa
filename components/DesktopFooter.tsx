'use client';

import Link from 'next/link';
import BrandLockup from '@/components/BrandLockup';
import { useAuth } from '@/hooks/use-auth';
import { LEGAL } from '@/lib/legal';

type FooterLink = { href: string; label: string };
type FooterGroup = { heading: string; links: FooterLink[] };

const VISITOR_GROUPS: FooterGroup[] = [
  {
    heading: 'AutoTrampa',
    links: [
      { href: '/#kako-funkcionise', label: 'Kako funkcioniše' },
      { href: '/#zasto-autotrampa', label: 'Zašto AutoTrampa' },
      { href: '/#zasto-autotrampa', label: 'O platformi' },
    ],
  },
  {
    heading: 'Istraži',
    links: [
      { href: '/search', label: 'Svi oglasi' },
      { href: '/?view=swipe', label: 'Swipe režim' },
      { href: '/?intent=add-car', label: 'Dodaj svoj auto' },
    ],
  },
  {
    heading: 'Podrška',
    links: [
      { href: '/help', label: 'Česta pitanja' },
      { href: '/safety', label: 'Bezbedna zamena' },
      { href: `mailto:${LEGAL.email}`, label: 'Kontakt' },
    ],
  },
  {
    heading: 'Pravne informacije',
    links: [
      { href: LEGAL.termsPath, label: 'Uslovi korišćenja' },
      { href: LEGAL.privacyPath, label: 'Politika privatnosti' },
      { href: '/privacy#kolacici', label: 'Kolačići i lokalno čuvanje' },
    ],
  },
];

const MEMBER_GROUPS: FooterGroup[] = [
  {
    heading: 'Moj nalog',
    links: [
      { href: '/profile', label: 'Moj profil' },
      { href: '/garage', label: 'Moja garaža' },
      { href: '/saved', label: 'Sačuvani oglasi' },
      { href: '/messages', label: 'Poruke' },
    ],
  },
  {
    heading: 'Zamene i oglasi',
    links: [
      { href: '/search', label: 'Svi oglasi' },
      { href: '/?view=swipe', label: 'Swipe režim' },
      { href: '/messages?tab=offers', label: 'Moje ponude' },
      { href: '/?intent=add-car', label: 'Dodaj automobil' },
    ],
  },
  {
    heading: 'Podrška',
    links: [
      { href: '/help', label: 'Centar za pomoć' },
      { href: '/safety', label: 'Bezbedna zamena' },
      { href: `mailto:${LEGAL.email}`, label: 'Kontakt' },
    ],
  },
  {
    heading: 'Pravne informacije',
    links: [
      { href: LEGAL.termsPath, label: 'Uslovi korišćenja' },
      { href: LEGAL.privacyPath, label: 'Politika privatnosti' },
      { href: '/privacy#kolacici', label: 'Kolačići i lokalno čuvanje' },
    ],
  },
];

const LINK_CLASS =
  'block w-fit rounded text-[13px] leading-6 text-[#9AAAC1] transition-colors hover:text-[#F58A38] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F58A38]';

export function DesktopFooter({ showOnMobile = false }: { showOnMobile?: boolean }) {
  const { isLoggedIn, mounted } = useAuth();
  const groups = mounted && isLoggedIn ? MEMBER_GROUPS : VISITOR_GROUPS;

  return (
    <footer className={`${showOnMobile ? 'block' : 'hidden lg:block'} mt-auto border-t border-[#263348] bg-[#0B1628] text-[#9AAAC1]`}>
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
        <div className="grid gap-9 py-10 lg:grid-cols-[minmax(200px,1.3fr)_minmax(0,3fr)] lg:gap-14 lg:py-14">
          <div className="max-w-[290px]">
            <Link href="/" aria-label="AutoTrampa — početna" className="inline-flex rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F58A38]">
              <BrandLockup />
            </Link>
            <p className="mt-3 max-w-[250px] text-[13px] leading-6 text-[#9AAAC1]">
              Pronađi svoj sledeći automobil. Ponudi svoj u zamenu — uz doplatu ili bez nje.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-5 gap-y-8 md:grid-cols-4 md:gap-6">
            {groups.map(({ heading, links }) => (
              <nav key={heading} aria-label={heading} className="min-w-0">
                <h2 className="mb-4 font-[var(--font-manrope)] text-xs font-extrabold tracking-wide text-white">{heading}</h2>
                <ul className="space-y-2.5">
                  {links.map(({ href, label }) => (
                    <li key={href + label}>
                      {href.startsWith('mailto:') ? (
                        <a href={href} className={LINK_CLASS}>{label}</a>
                      ) : (
                        <Link href={href} className={LINK_CLASS}>{label}</Link>
                      )}
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#263348] py-5 text-xs text-[#8493AB]">
          <span>© {new Date().getFullYear()} AutoTrampa.rs</span>
          <span>Platforma za zamenu automobila</span>
        </div>
      </div>
    </footer>
  );
}

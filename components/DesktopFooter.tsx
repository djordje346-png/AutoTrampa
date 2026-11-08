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
      { href: '/#zasto-autotrampa', label: 'Swipe i Match' },
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
  'block w-fit rounded text-xs leading-[21px] lg:text-[13px] lg:leading-6 text-[#9AAAC1] transition-colors hover:text-[#F58A38] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F58A38]';

export function DesktopFooter({ showOnMobile = false }: { showOnMobile?: boolean }) {
  const { isLoggedIn, mounted } = useAuth();
  const groups = mounted && isLoggedIn ? MEMBER_GROUPS : VISITOR_GROUPS;

  return (
    <footer className={`${showOnMobile ? 'block' : 'hidden lg:block'} mt-auto border-t border-[#263348] bg-[#0B1628] text-[#9AAAC1]`}>
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
        <div className="grid gap-5 py-7 sm:gap-7 sm:py-9 lg:grid-cols-[minmax(200px,1.3fr)_minmax(0,3fr)] lg:gap-14 lg:py-14">
          <div className="max-w-[290px]">
            <Link href="/" aria-label="AutoTrampa — početna" className="inline-flex origin-left scale-[.82] rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F58A38] lg:scale-100">
              <BrandLockup />
            </Link>
            <p className="mt-0 max-w-[290px] text-xs leading-5 text-[#9AAAC1] lg:mt-3 lg:text-[13px] lg:leading-6">
              Pronađi svoj sledeći automobil. Ponudi svoj u zamenu — uz doplatu ili bez nje.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-6 md:grid-cols-4 md:gap-6">
            {groups.map(({ heading, links }) => (
              <nav key={heading} aria-label={heading} className="min-w-0">
                <h3 className="mb-2 font-[var(--font-manrope)] text-[13px] font-extrabold tracking-normal text-white lg:mb-4 lg:text-sm">{heading}</h3>
                <ul className="space-y-1 lg:space-y-2.5">
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
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 border-t border-[#263348] py-3 text-[11px] text-[#8493AB] lg:py-5 lg:text-xs">
          <span>© {new Date().getFullYear()} AutoTrampa.rs</span>
          <span>Platforma za zamenu automobila</span>
        </div>
      </div>
    </footer>
  );
}

'use client';

import { useAuth } from '@/hooks/use-auth';
import { usePathname } from 'next/navigation';
import AuthOverlay from '@/components/AuthOverlay';
import Footer from '@/components/Footer';
import { DesktopFooter } from '@/components/DesktopFooter';
import { Toaster } from '@/components/ui/sonner';
import PhoneGateHost from '@/components/PhoneGateHost';
import PublicHeader from '@/components/PublicHeader';

/**
 * Browsing is public: listings render on the server so they can be shared and
 * indexed. Sign-in is asked for at the moment an action needs an identity —
 * see `requireAuth` in use-auth — not as a wall in front of the app.
 */
export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { promptOpen, isLoggedIn, mounted: authReady, requireAuth } = useAuth();
  const isPublicLanding = pathname === '/' && !isLoggedIn;
  const isPublicSearch = pathname === '/search' && !isLoggedIn;
  const isListing = pathname.startsWith('/car/');
  const isPublicListing = isListing && !isLoggedIn;
  const hasPublicHeader = authReady && (isPublicSearch || isPublicListing);
  const hasDesktopAppNavigation = authReady && !isPublicLanding && !hasPublicHeader;

  return (
    <div className="theme-atmosphere flex min-h-screen w-full flex-col text-app-primary dark:text-app-primary">
      <a
        href="#sadrzaj"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[200] focus:rounded-lg focus:bg-brand-500 focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-on-accent"
      >
        Preskoči na sadržaj
      </a>

      {hasDesktopAppNavigation && <Footer />}
      {!authReady && (isListing || pathname === '/search') && <div aria-label="Učitavanje navigacije" className="h-16 border-b border-brand-dark bg-brand-dark lg:h-[72px]" />}
      {hasPublicHeader && (
          <PublicHeader
            onAddCar={() => requireAuth('Prijavi se i dodaj svoj oglas', undefined, '/?intent=add-car')}
            onSignIn={() => requireAuth('Prijavi se na AutoTrampu')}
            onRegister={() => requireAuth('Napravi AutoTrampa nalog', undefined, undefined, 'register')}
          />
      )}
      <main id="sadrzaj" className={`w-full flex-1 ${isPublicLanding ? 'pb-0' : isPublicSearch || isPublicListing ? 'pb-8' : 'pb-28 md:pb-24 lg:pb-8'} ${hasDesktopAppNavigation ? 'lg:pt-[72px]' : ''} ${isPublicSearch ? 'public-search-content' : ''}`}>
        {children}
      </main>

      {!isPublicLanding && <DesktopFooter />}

      {promptOpen && <AuthOverlay />}
      <PhoneGateHost />
      <Toaster />
    </div>
  );
}

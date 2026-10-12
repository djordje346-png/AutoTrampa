'use client';

import { useAuth } from '@/hooks/use-auth';
import AuthOverlay from '@/components/AuthOverlay';
import Footer from '@/components/Footer';
import { DesktopFooter } from '@/components/DesktopFooter';
import { Toaster } from '@/components/ui/sonner';
import PhoneGateHost from '@/components/PhoneGateHost';
import { DesktopHeaderActionsProvider } from '@/components/DesktopHeaderActions';

/**
 * Browsing is public: listings render on the server so they can be shared and
 * indexed. Sign-in is asked for at the moment an action needs an identity —
 * see `requireAuth` in use-auth — not as a wall in front of the app.
 */
export default function AppShell({ children }: { children: React.ReactNode }) {
  const { promptOpen } = useAuth();

  return (
    <DesktopHeaderActionsProvider>
      <div className="flex min-h-screen w-full flex-col bg-app text-app-primary dark:bg-zinc-950 dark:text-zinc-100">
        <a
          href="#sadrzaj"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[200] focus:rounded-lg focus:bg-brand-500 focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-black"
        >
          Preskoči na sadržaj
        </a>

        <Footer />
        <main id="sadrzaj" className="w-full flex-1 pb-28 md:pb-24 lg:pb-8">
          {children}
        </main>

        <DesktopFooter />

        {promptOpen && <AuthOverlay />}
        <PhoneGateHost />
        <Toaster />
      </div>
    </DesktopHeaderActionsProvider>
  );
}

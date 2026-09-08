'use client';

import { useAuth } from '@/hooks/use-auth';
import AuthOverlay from '@/components/AuthOverlay';
import Footer from '@/components/Footer';
import { Toaster } from '@/components/ui/sonner';

/**
 * Browsing is public: listings render on the server so they can be shared and
 * indexed. Sign-in is asked for at the moment an action needs an identity —
 * see `requireAuth` in use-auth — not as a wall in front of the app.
 */
export default function AppShell({ children }: { children: React.ReactNode }) {
  const { promptOpen } = useAuth();

  return (
    <div className="min-h-screen w-full bg-app text-app-primary">
      <a
        href="#sadrzaj"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[200] focus:rounded-lg focus:bg-orange-500 focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-white"
      >
        Preskoči na sadržaj
      </a>

      <main
        id="sadrzaj"
        className="
          mx-auto
          min-h-screen
          w-full
          max-w-[1600px]
          px-4
          pb-28
          sm:px-5
          md:px-8
          md:pb-24
          lg:px-10
          xl:px-12
        "
      >
        {children}
      </main>

      <Footer />
      {promptOpen && <AuthOverlay />}
      <Toaster />
    </div>
  );
}

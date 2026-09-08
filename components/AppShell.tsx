'use client';

import { ArrowLeftRight } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import AuthScreen from '@/components/AuthScreen';
import Footer from '@/components/Footer';
import { Toaster } from '@/components/ui/sonner';

/** Shown for the one frame before localStorage tells us who is logged in. */
function Splash() {
  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-app">
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500 shadow-lg shadow-orange-500/20">
          <ArrowLeftRight size={26} className="text-white" strokeWidth={2.5} />
        </div>
        <p className="text-sm font-bold tracking-tight text-app-primary">AutoTrampa</p>
        <span className="sr-only">Učitavanje…</span>
      </div>
    </main>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, mounted } = useAuth();

  if (!mounted) {
    return <Splash />;
  }

  if (!isLoggedIn) {
    return (
      <main className="min-h-screen w-full bg-app text-app-primary">
        <div className="mx-auto min-h-screen w-full max-w-[1600px]">
          <AuthScreen />
        </div>
        <Toaster />
      </main>
    );
  }

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
      <Toaster />
    </div>
  );
}

'use client';

import { useAuth } from '@/hooks/use-auth';
import AuthScreen from '@/components/AuthScreen';
import Footer from '@/components/Footer';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, mounted } = useAuth();

  if (!mounted) {
    return <main className="mx-auto min-h-screen w-full max-w-md md:max-w-2xl lg:max-w-5xl" style={{ backgroundColor: '#0a0a0a' }} />;
  }

  if (!isLoggedIn) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-md md:max-w-2xl lg:max-w-5xl">
        <AuthScreen />
      </main>
    );
  }

  return (
    <>
      <main className="mx-auto min-h-screen w-full max-w-md pb-28 md:max-w-2xl md:pb-24 lg:max-w-5xl">
        {children}
      </main>
      <Footer />
    </>
  );
}

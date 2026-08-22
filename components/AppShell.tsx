'use client';

import { useAuth } from '@/hooks/use-auth';
import AuthScreen from '@/components/AuthScreen';
import Footer from '@/components/Footer';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, mounted } = useAuth();

  if (!mounted) {
    return <main className="max-w-md mx-auto min-h-screen bg-slate-950" />;
  }

  if (!isLoggedIn) {
    return (
      <main className="max-w-md mx-auto min-h-screen">
        <AuthScreen />
      </main>
    );
  }

  return (
    <>
      <main className="max-w-md mx-auto min-h-screen pb-24">{children}</main>
      <Footer />
    </>
  );
}

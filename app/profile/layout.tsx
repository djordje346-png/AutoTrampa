import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Profil',
  description: 'Podešavanja naloga i preferencije zamene.',
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

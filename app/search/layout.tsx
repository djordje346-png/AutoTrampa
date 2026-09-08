import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pretraga',
  description: 'Pretraži oglase za zamenu po marki, modelu i gradu.',
  robots: { index: true, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

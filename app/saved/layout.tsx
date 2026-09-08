import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sačuvano',
  description: 'Oglasi koje si sačuvao.',
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

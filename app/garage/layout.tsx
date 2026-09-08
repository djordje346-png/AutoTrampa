import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Garaža',
  description: 'Tvoja vozila na AutoTrampi.',
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

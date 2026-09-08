import type { Metadata } from 'next';
import SearchClient from './SearchClient';

export const metadata: Metadata = {
  title: 'Pretraga',
  description: 'Pretraži oglase za zamenu po marki, modelu i gradu.',
  robots: { index: true, follow: true },
};

export default function Page() {
  return <SearchClient />;
}

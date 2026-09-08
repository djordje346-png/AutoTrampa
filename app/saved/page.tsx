import type { Metadata } from 'next';
import SavedClient from './SavedClient';

export const metadata: Metadata = {
  title: 'Sačuvano',
  description: 'Oglasi koje si sačuvao.',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <SavedClient />;
}

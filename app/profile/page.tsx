import type { Metadata } from 'next';
import ProfileClient from './ProfileClient';

export const metadata: Metadata = {
  title: 'Profil',
  description: 'Podešavanja naloga i preferencije zamene.',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <ProfileClient />;
}

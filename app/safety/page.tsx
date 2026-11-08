import type { Metadata } from 'next';
import LegalPage from '@/components/LegalPage';

export const metadata: Metadata = {
  title: 'Bezbedna zamena automobila',
  description: 'Praktične preporuke za proveru automobila, dokumenata, doplate i bezbedan dogovor o zameni.',
};

export default function SafetyPage() {
  return (
    <LegalPage title="Bezbedna zamena" intro="Pre dogovora o zameni proveri vozilo, dokumentaciju i uslove razmene. AutoTrampa povezuje vlasnike, ali ne potvrđuje tehničko stanje ili vlasništvo vozila.">
      <section><h2>Proveri identitet i vlasništvo</h2><p>Uveri se da osoba koja nudi vozilo ima pravo da njime raspolaže. Uporedi podatke sa saobraćajnom dozvolom i proveri identifikacioni broj vozila (VIN). Ako prodavac ili vlasnik nije prisutan, proveri da li postoji odgovarajuće ovlašćenje.</p></section>
      <section><h2>Pregledaj automobil pre dogovora</h2><p>Organizuj pregled uživo, probnu vožnju kada je bezbedna i po mogućnosti nezavisni pregled kod majstora. Proveri servisnu istoriju, poznate nedostatke, kilometražu i eventualna ograničenja raspolaganja vozilom.</p></section>
      <section><h2>Jasno dogovorite doplatu</h2><p>Prikazana razlika oglašenih vrednosti samo je informativna. Precizirajte iznos, valutu, trenutak i bezbedan način plaćanja. Ne šalji avans nepoznatoj osobi samo na osnovu poruka i fotografija.</p></section>
      <section><h2>Bezbedno mesto i dokumentacija</h2><p>Za sastanak biraj javno i bezbedno mesto. Pre predaje ključeva dogovorite pisani dokument o zameni, prenos vlasništva, eventualne poreze i ostale obaveze prema propisima koji važe za vozila i učesnike.</p></section>
      <section><h2>Zaštiti lične podatke</h2><p>Ne objavljuj fotografije lične karte, matične brojeve, podatke kartice, lozinke ni druge osetljive podatke u oglasu ili porukama. Sumnjive zahteve i prevare prijavi kontaktu podrške.</p></section>
      <section><h2>Šta AutoTrampa ne garantuje?</h2><p>AutoTrampa nije posrednik u plaćanju ili ugovaranju i ne potvrđuje izvršenje razmene, ispravnost vozila ni vlasništvo. Za sva prava i obaveze učesnici treba da provere odgovarajuće propise i dokumentaciju.</p></section>
    </LegalPage>
  );
}

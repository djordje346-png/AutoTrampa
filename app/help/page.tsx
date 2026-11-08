import type { Metadata } from 'next';
import Link from 'next/link';
import LegalPage from '@/components/LegalPage';

export const metadata: Metadata = {
  title: 'Česta pitanja',
  description: 'Odgovori na česta pitanja o oglasima, Swipe režimu, ponudama, doplati i AutoTrampa nalogu.',
};

export default function HelpPage() {
  return (
    <LegalPage title="Česta pitanja" intro="Kratki odgovori na pitanja o korišćenju AutoTrampe.">
      <section><h2>Da li mogu da gledam oglase bez prijave?</h2><p>Da. Oglase i pretragu možeš pregledati bez naloga. Za dodavanje vozila, slanje ponuda i pojedine druge akcije potrebna je prijava.</p></section>
      <section><h2>Kako da dodam svoj automobil?</h2><p>Izaberi <Link href="/?intent=add-car">Dodaj svoj auto</Link>, prijavi se i unesi podatke i fotografije. Vozilima upravljaš u <Link href="/garage">Garaži</Link>.</p></section>
      <section><h2>Kako radi Swipe i Match?</h2><p>U <Link href="/?view=swipe">Swipe režimu</Link> pregledavaš vozila i možeš da iskažeš interesovanje ili preskočiš oglas. Kada postoji obostrano interesovanje za stvarna vozila, može se pojaviti Match i omogućiti dalji razgovor. Lajk nije potvrda izvršene zamene.</p></section>
      <section><h2>Kako se šalje ponuda za zamenu?</h2><p>Otvori oglas, izaberi opciju za ponudu i odaberi svoje vozilo. Primljene i poslate ponude dostupne su u <Link href="/messages?tab=offers">Mojim ponudama</Link>. Demo oglasi ne prihvataju stvarne ponude.</p></section>
      <section><h2>Da li je doplata koju prikazuje sajt obavezna?</h2><p>Ne. Iznos doplate koji se prikazuje je orijentaciona razlika oglašenih vrednosti. Konačnu doplatu, način plaćanja i uslove zamene ugovaraju sami vlasnici.</p></section>
      <section><h2>Kako funkcioniše pametno sortiranje?</h2><p>Budžet, radijus, izabrano vozilo i druge preference pomažu u određivanju redosleda rezultata. Zavisno od pretrage, mogu se prikazati i alternativni oglasi koji ne ispunjavaju sve izabrane kriterijume.</p></section>
      <section><h2>Kako mogu da prijavim problem?</h2><p>Za problem sa nalogom, sumnjiv oglas ili neprimerenu poruku koristi kontakt naveden ispod. Pošalji link oglasa i kratak opis problema, bez slanja nepotrebnih ličnih dokumenata.</p></section>
    </LegalPage>
  );
}

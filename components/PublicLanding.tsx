'use client';

import Link from 'next/link';
import { ArrowLeftRight, ArrowRight, CarFront, CheckCircle2, Search } from 'lucide-react';
import { formatEuro, formatYear } from '@/lib/cars';
import type { Car } from '@/types';
import BrandLockup from '@/components/BrandLockup';
import PublicHeader from '@/components/PublicHeader';
import MarketplaceV13Card from '@/components/MarketplaceV13Card';
import styles from './PublicLanding.module.css';

interface PublicLandingProps {
  cars: Car[];
  listingsReady: boolean;
  onAddCar: () => void;
  onSignIn: () => void;
  onRegister: () => void;
}

const STEPS = [
  { number: '01', icon: CarFront, title: 'Predstavi svoj auto', description: 'Dodaj fotografije i osnovne podatke o svom vozilu.' },
  { number: '02', icon: Search, title: 'Pronađi vozilo', description: 'Pregledaj oglase i izaberi automobil koji želiš.' },
  { number: '03', icon: ArrowLeftRight, title: 'Ponudi zamenu', description: 'Kontaktiraj vlasnika i dogovorite uslove zamene.' },
] as const;

export default function PublicLanding({ cars, listingsReady, onAddCar, onSignIn, onRegister }: PublicLandingProps) {
  // Real and clearly labelled demo listings share the public showcase.
  const realCars = cars.filter(car => Boolean(car.ownerId));
  const demoCars = cars.filter(car => !car.ownerId);
  const publicCars = [...realCars.slice(0, 3), ...demoCars.filter(car => car.id.startsWith('demo-dodatni-')).slice(0, 3), ...demoCars.filter(car => !car.id.startsWith('demo-dodatni-')).slice(0, 3)];

  return (
    <div className={styles.landing}>
      <PublicHeader landing onAddCar={onAddCar} onSignIn={onSignIn} onRegister={onRegister} />
      <section className={styles.heroNew} aria-labelledby="landing-title">
        <picture className={styles.heroBackdrop}>
          <source media="(max-width: 767px)" srcSet="/images/landing/hero-swap-mobile.webp" />
          <img src="/images/landing/hero-swap.webp" alt="" fetchPriority="high" width={1774} height={887} />
        </picture>
        <div className={`app-container ${styles.heroNewInner}`}>
          <div className={styles.heroNewCopy}>
            <div className={styles.heroLogo}><BrandLockup variant="light" /></div>
            <p className={styles.heroNewEyebrow}>Platforma za zamenu automobila</p>
            <h1 id="landing-title">Pronađi auto koji želiš.<span>Ponudi svoj u zamenu.</span></h1>
            <p>Pregledaj oglase, pronađi vozilo koje ti odgovara i predloži zamenu. Uz doplatu ili bez nje — dogovarate se direktno.</p>
            <div className={styles.heroNewActions}>
              <button type="button" onClick={onAddCar} className={styles.primary}>Dodaj svoj auto <ArrowRight size={17} aria-hidden="true" /></button>
              <Link href="/search" className={styles.secondary}><Search size={17} aria-hidden="true" /> Pogledaj oglase</Link>
            </div>
          </div>
        </div>
      </section>

      <section id="kako-funkcionise" className={styles.howNew} aria-labelledby="how-title">
        <div className="app-container">
          <div className={styles.howNewHead}>
            <p className={styles.howEyebrow}>Kako funkcioniše</p>
            <h2 id="how-title">Od tvog auta do nove zamene.</h2>
            <p>Tri jednostavna koraka do automobila koji želiš.</p>
          </div>
          <ol className={styles.howNewGrid}>
            {STEPS.map(({ number, icon: Icon, title, description }, index) => (
              <li className={styles.howNewStep} key={number}>
                <div className={styles.howNewVisual}>
                  {publicCars[index]?.image ? (
                    <img src={publicCars[index].image} alt="" loading="lazy" />
                  ) : (
                    <Icon size={52} strokeWidth={1.4} aria-hidden="true" />
                  )}
                </div>
                <div className={styles.howNewNumber}>KORAK {number}</div>
                <h3>{title}</h3>
                <p>{description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="popularne-zamene" className={styles.activity} aria-labelledby="listings-title">
        <div className="app-container">
          <div className={styles.activityHeading}>
            <p className={styles.howEyebrow}>Aktuelni oglasi</p>
            <h2 id="listings-title">Pogledaj šta se nudi za zamenu.</h2>
            <p>Istraži automobile drugih vlasnika i pronađi svoj sledeći auto.</p>
          </div>
        </div>
        {!listingsReady && publicCars.length === 0 ? (
          <div className={`app-container ${styles.activityLoading}`} role="status" aria-label="Učitavanje oglasa">Oglasi se učitavaju…</div>
        ) : publicCars.length ? (
          <div className={styles.activityViewport} aria-label="Izdvojeni oglasi u dva reda">
            {[publicCars.filter((_, i) => i % 2 === 0), publicCars.filter((_, i) => i % 2 === 1)].map((row, i) => (
              <div key={i} className={`${styles.activityRow} ${i === 1 ? styles.activityRowShifted : ''}`}>
                {row.map((car) => (
                  <Link key={car.id} href={`/car/${car.id}`} className={styles.activityCard} aria-label={`Pogledaj oglas ${car.brand} ${car.model}`}>
                    <span className={styles.activityPhoto}><img src={car.image} alt="" loading="lazy" /></span>
                    <span className={styles.activityDetails}>
                      <strong>{car.brand} {car.model}</strong>
                      <span>{formatYear(car.year)} · {car.city}</span>
                      <b>{formatEuro(car.price)}</b>
                      {!car.ownerId && <small>Demo oglas</small>}
                    </span>
                  </Link>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className={`app-container ${styles.activityLoading}`}>Novi oglasi uskoro stižu.</div>
        )}
        <div className={`app-container ${styles.activityFooter}`}>
          <p><strong>Tvoj sledeći auto možda je već u oglasima.</strong> Pogledaj ponudu i pronađi vozilo za zamenu.</p>
          <Link className={styles.activityCta} href="/search">Pogledaj sve oglase <ArrowRight size={17} aria-hidden="true" /></Link>
        </div>
      </section>

      <section id="smart-match" className={styles.closing} aria-labelledby="closing-title">
        <img className={styles.closingImage} src="/images/landing/drive-cta.webp" alt="" loading="lazy" width={1942} height={809} />
        <div className={`app-container ${styles.closingInner}`}>
          <p className={styles.eyebrow}>Nova vožnja je bliže nego što misliš</p>
          <h2 id="closing-title">Dodaj svoj auto<br />i pronađi zamenu već danas.</h2>
          <div className={styles.actions}>
            <button type="button" className={styles.primary} onClick={onAddCar}>Dodaj svoj auto <ArrowRight size={18} aria-hidden="true" /></button>
            <Link href="/search" className={`${styles.secondary} ${styles.secondaryDark}`}><Search size={18} aria-hidden="true" /> Pogledaj oglase</Link>
          </div>
          <ul className={styles.closingBenefits} aria-label="Prednosti zamene">
            {['Brzo i jednostavno', 'Direktno sa vlasnicima', 'Uz doplatu ili bez nje'].map((text) => <li key={text}><CheckCircle2 size={18} aria-hidden="true" />{text}</li>)}
          </ul>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={`app-container ${styles.footerInner}`}>
          <Link href="/" aria-label="AutoTrampa — početna"><BrandLockup /></Link>
          <nav aria-label="Linkovi u podnožju" className="flex-wrap"><a href="#kako-funkcionise">Kako funkcioniše</a><Link href="/search">Oglasi</Link><button type="button" onClick={onSignIn}>Prijavi se</button><Link href="/terms">Uslovi korišćenja</Link><Link href="/privacy">Politika privatnosti</Link></nav>
          <p>© {new Date().getFullYear()} AutoTrampa</p>
        </div>
      </footer>
    </div>
  );
}

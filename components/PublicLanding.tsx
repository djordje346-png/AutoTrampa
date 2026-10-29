'use client';

import Link from 'next/link';
import { ArrowLeftRight, ArrowRight, CarFront, CheckCircle2, ChevronRight, MapPin, Search, Tag, UsersRound } from 'lucide-react';
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
  { number: '01', icon: CarFront, title: 'Dodaj auto', description: 'Unesi osnovne informacije i fotografije svog vozila.' },
  { number: '02', icon: Search, title: 'Pronađi zamenu', description: 'Pregledaj oglase i vidi kakva doplata ti odgovara.' },
  { number: '03', icon: ArrowLeftRight, title: 'Dogovori doplatu', description: 'Kontaktiraj vlasnika direktno i dogovorite zamenu.' },
] as const;

export default function PublicLanding({ cars, listingsReady, onAddCar, onSignIn, onRegister }: PublicLandingProps) {
  // The marketplace hook includes demo seeds. Only real owner listings belong here.
  const publicCars = cars.filter((car) => Boolean(car.ownerId)).slice(0, 3);

  return (
    <div className={styles.landing}>
      <PublicHeader landing onAddCar={onAddCar} onSignIn={onSignIn} onRegister={onRegister} />
      <section className={styles.hero} aria-labelledby="landing-title">
        <picture><source media="(max-width: 1023px)" srcSet="/images/landing/hero-swap-mobile.webp" /><img className={styles.heroImage} src="/images/landing/hero-swap.webp" alt="" fetchPriority="high" width={1774} height={887} /></picture>
        <div className={`app-container ${styles.heroInner}`}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>Jasna zamena</p>
            <h1 id="landing-title">Zameni auto.<br />Ne prodaj ga prvo.</h1>
            <p className={styles.intro}>Dodaj svoj auto i pronađi vlasnike koji žele baš tvoje vozilo — uz doplatu ili bez nje.</p>
            <div className={styles.actions}>
              <button type="button" onClick={onAddCar} className={styles.primary}>Dodaj svoj auto <ArrowRight size={18} aria-hidden="true" /></button>
              <Link href="/search" className={styles.secondary}><Search size={18} aria-hidden="true" /> Pogledaj oglase</Link>
            </div>
            <ul className={styles.benefits} aria-label="Prednosti AutoTrampe">
              <li><Tag size={18} aria-hidden="true" /> Stvarni oglasi</li>
              <li><UsersRound size={18} aria-hidden="true" /> Direktno sa vlasnicima</li>
              <li><MapPin size={18} aria-hidden="true" /> Širom Srbije</li>
            </ul>
          </div>
          <span className={styles.swapMark} aria-hidden="true"><ArrowLeftRight size={30} strokeWidth={2.3} /></span>
        </div>
      </section>

      <section id="kako-funkcionise" className={`app-container ${styles.how}`} aria-labelledby="how-title">
        <div className={styles.sectionHeading}>
          <div><p className={styles.eyebrow}>Kako funkcioniše</p><h2 id="how-title">Tri koraka do nove vožnje</h2></div>
          <p className={styles.sectionIntro}>AutoTrampa povezuje vlasnike koji žele zamenu vozila, uz mogućnost doplate ili bez nje. Jednostavno, direktno i bez nepotrebnog čekanja.</p>
        </div>
        <ol className={styles.steps}>
          {STEPS.map(({ number, icon: Icon, title, description }, index) => (
            <li key={number} className={styles.step}>
              <div className={styles.stepIcons}><span className={styles.number}>{number}</span><span className={styles.stepIcon}><Icon size={27} strokeWidth={1.7} aria-hidden="true" /></span></div>
              <div className={styles.stepCopy}><h3>{title}</h3><p>{description}</p></div>
              {index < STEPS.length - 1 && <ChevronRight className={styles.stepArrow} size={20} aria-hidden="true" />}
            </li>
          ))}
        </ol>
      </section>

      <section id="popularne-zamene" className={styles.listings} aria-labelledby="listings-title">
        <div className="app-container">
          <div className={styles.listingHeading}>
            <div><p className={styles.eyebrow}>Aktuelni oglasi</p><h2 id="listings-title">Vozila spremna za zamenu</h2></div>
            <Link className={styles.allListings} href="/search">Pogledaj sve oglase <ArrowRight size={19} aria-hidden="true" /></Link>
          </div>
          {!listingsReady && publicCars.length === 0 ? (
            <div className={styles.listingGrid} role="status" aria-label="Učitavanje oglasa">{[0, 1, 2].map((n) => <div key={n} className={styles.skeleton} />)}</div>
          ) : publicCars.length ? (
            <div className={styles.listingGrid}>{publicCars.map((car) => <MarketplaceV13Card key={car.id} car={car} />)}</div>
          ) : (
            <div className={styles.empty}><CarFront size={30} aria-hidden="true" /><p>Novi oglasi uskoro stižu.</p><button className={styles.primary} type="button" onClick={onAddCar}>Dodaj svoj auto <ArrowRight size={18} aria-hidden="true" /></button></div>
          )}
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
          <nav aria-label="Linkovi u podnožju"><a href="#kako-funkcionise">Kako funkcioniše</a><Link href="/search">Oglasi</Link><button type="button" onClick={onSignIn}>Prijavi se</button></nav>
          <p>© {new Date().getFullYear()} AutoTrampa</p>
        </div>
      </footer>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { ArrowLeftRight, ArrowRight, Camera, CheckCircle2, Heart, Search, Sparkles, Wallet, RefreshCw, Upload, X } from 'lucide-react';
import { formatEuro, formatYear } from '@/lib/cars';
import type { Car } from '@/types';
import BrandLockup from '@/components/BrandLockup';
import { DesktopFooter } from '@/components/DesktopFooter';
import PublicHeader from '@/components/PublicHeader';
import styles from './PublicLanding.module.css';

interface PublicLandingProps {
  cars: Car[];
  listingsReady: boolean;
  onAddCar: () => void;
  onSignIn: () => void;
  onRegister: () => void;
}

const STEPS = [
  { number: '01', title: 'Predstavi svoj auto', description: 'Dodaj fotografije i osnovne podatke o svom vozilu.' },
  { number: '02', title: 'Pronađi vozilo', description: 'Pregledaj automobile kroz Swipe i pametno sortirane oglase.' },
  { number: '03', title: 'Ponudi zamenu', description: 'Pošalji ponudu za zamenu, a kada se dopadnete jedno drugom — povežite se.' },
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
        <div className={styles.heroSideCars} aria-hidden="true">
          <div className={`${styles.heroSideCar} ${styles.heroSideCarLeft}`} />
          <div className={`${styles.heroSideCar} ${styles.heroSideCarRight}`} />
        </div>
        <div className={`app-container ${styles.heroNewInner}`}>
          <div className={styles.heroNewCopy}>
            <div className={styles.heroLogo}><BrandLockup variant="light" /></div>
            <p className={styles.heroNewEyebrow}>Platforma za zamenu automobila</p>
            <h1 id="landing-title">Pronađi auto koji želiš.<span>Ponudi svoj u zamenu.</span></h1>
            <p>Pronađi vozilo koje ti odgovara i ponudi svoj auto u zamenu — uz doplatu ili bez nje.</p>
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
            {STEPS.map(({ number, title, description }, index) => (
              <li className={styles.howNewStep} key={number}>
                <div className={styles.howNewVisual} aria-hidden="true">
                  {index === 0 ? (
                    <div className={styles.stepMockupAdd}>
                      <div className={styles.stepMockupTop}><span className={styles.stepMockupDot} /> Dodaj vozilo <span className={styles.stepMockupCount}>Korak 1/3</span></div>
                      <div className={styles.stepUploadLayout}>
                        <div className={styles.stepUploadImage}>
                          {publicCars[0]?.image ? <img src={publicCars[0].image} alt="" loading="lazy" /> : <Camera size={27} />}
                          <span className={styles.stepUploadBadge}><Upload size={10}/> Dodaj slike</span>
                        </div>
                        <div className={styles.stepFormFields}>
                          <span>Marka i model</span><strong>Moje vozilo</strong>
                          <span>Godište</span><strong>Izaberi godište <span>⌄</span></strong>
                          <span className={styles.stepFormAction}>Nastavi <ArrowRight size={11}/></span>
                        </div>
                      </div>
                    </div>
                  ) : index === 1 ? (
                    <div className={styles.stepMockupSwipe}>
                      <div className={styles.stepSwipeCard}>
                        <div className={styles.stepSwipePicture}>{publicCars[1]?.image ? <img src={publicCars[1].image} alt="" loading="lazy" /> : <Camera size={34}/>}</div>
                        <div className={styles.stepSwipeCaption}><strong>{publicCars[1]?.brand ?? 'Pronađi'} {publicCars[1]?.model ?? 'svoj auto'}</strong><span>Swipe režim</span></div>
                        <div className={styles.stepSwipeButtons}><span><X size={14}/></span><span><Heart size={14}/></span></div>
                      </div>
                      <span className={styles.stepSwipeMini}><ArrowLeftRight size={15}/></span>
                    </div>
                  ) : (
                    <div className={styles.stepMockupMatch}>
                      <div className={styles.stepMatchImages}>
                        <div>{publicCars[0]?.image ? <img src={publicCars[0].image} alt="" loading="lazy" /> : <Camera size={26}/>}</div>
                        <span><ArrowLeftRight size={16}/></span>
                        <div>{publicCars[2]?.image ? <img src={publicCars[2].image} alt="" loading="lazy" /> : <Camera size={26}/>}</div>
                      </div>
                      <div className={styles.stepMatchPanel}>
                        <strong>Nova ponuda za zamenu</strong>
                        <span>Vozila su povezana</span>
                        <span className={styles.stepMatchAction}><CheckCircle2 size={12}/> Pogledaj ponudu</span>
                      </div>
                    </div>
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

      <section id="zasto-autotrampa" className={styles.why} aria-labelledby="why-title">
        <div className={`app-container ${styles.whyInner}`}>
          <div className={styles.whyIntro}>
            <p className={styles.howEyebrow}>Zašto AutoTrampa?</p>
            <h2 id="why-title">Promeni auto.<br /><span>Ne moraš prvo da ga prodaš.</span></h2>
            <p>Umesto da posebno tražiš kupca za svoj automobil, pronađi drugo vozilo i direktno predloži zamenu njegovom vlasniku.</p>
            <Link href="/search" className={styles.whyLink}>Istraži vozila <ArrowRight size={17} aria-hidden="true" /></Link>
          </div>
          <div className={styles.whyFeatures}>
            <article className={styles.whyFeature}>
              <div className={styles.whyIcon}><RefreshCw size={22} strokeWidth={1.8} aria-hidden="true" /></div>
              <div><h3>Zamena bez prethodne prodaje</h3><p>Ponudi automobil koji već voziš i pronađi vozilo koje želiš.</p></div>
            </article>
            <article className={styles.whyFeature}>
              <div className={styles.whyIcon}><Wallet size={22} strokeWidth={1.8} aria-hidden="true" /></div>
              <div><h3>Uz doplatu ili bez nje</h3><p>Uporedi vrednosti vozila i dogovori doplatu koja odgovara obema stranama.</p></div>
            </article>
            <article className={styles.whyFeature}>
              <div className={styles.whyIcon}><Sparkles size={22} strokeWidth={1.8} aria-hidden="true" /></div>
              <div><h3>Swipe, Match i pametno sortiranje</h3><p>Listaj automobile u Swipe režimu, pronađi Match i lakše otkrij oglase koji ti odgovaraju.</p></div>
            </article>
          </div>
        </div>
      </section>

      <section id="smart-match" className={styles.closing} aria-labelledby="closing-title">
        <img className={styles.closingImage} src="/images/landing/drive-cta.webp" alt="" loading="lazy" width={1942} height={809} />
        <div className={`app-container ${styles.closingInner}`}>
          <p className={styles.eyebrow}>Spreman za sledeći automobil?</p>
          <h2 id="closing-title">Tvoj sledeći auto počinje<br />jednom ponudom.</h2>
          <p className={styles.closingDescription}>Dodaj svoje vozilo, pronađi automobil koji ti se dopada i predloži zamenu. Dalji dogovor je između vas.</p>
          <div className={styles.actions}>
            <button type="button" className={styles.primary} onClick={onAddCar}>Dodaj svoj auto <ArrowRight size={18} aria-hidden="true" /></button>
            <Link href="/search" className={`${styles.secondary} ${styles.secondaryDark}`}><Search size={18} aria-hidden="true" /> Pogledaj oglase</Link>
          </div>
          <ul className={styles.closingBenefits} aria-label="Prednosti zamene">
            {['Besplatno pregledanje oglasa', 'Direktan dogovor', 'Zamena uz doplatu ili bez nje'].map((text) => <li key={text}><CheckCircle2 size={18} aria-hidden="true" />{text}</li>)}
          </ul>
        </div>
      </section>

      <DesktopFooter showOnMobile />
    </div>
  );
}

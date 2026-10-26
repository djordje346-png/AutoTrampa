'use client';

import { useState } from 'react';
import { CarFront, ChevronLeft, ChevronRight, ImageOff } from 'lucide-react';
import { carTitle } from '@/lib/cars';
import { getCarImages, type Car } from '@/types';

interface FeedCardPhotoProps {
  car: Car;
}

/** Compact feed gallery; the first saved image remains the cover. */
export function FeedCardPhoto({ car }: FeedCardPhotoProps) {
  const images = getCarImages(car).filter(Boolean);
  const [activeIndex, setActiveIndex] = useState(0);
  const [imageFailed, setImageFailed] = useState(false);
  const title = carTitle(car);
  const hasMultipleImages = images.length > 1;
  const image = images[activeIndex];

  function changeImage(direction: -1 | 1) {
    if (!hasMultipleImages) return;
    setImageFailed(false);
    setActiveIndex((index) => (index + direction + images.length) % images.length);
  }

  return (
    <div className="group/photo relative h-full w-full overflow-hidden bg-elevated">
      {image && !imageFailed ? (
        <img
          key={image}
          src={image}
          alt={`${title}, fotografija ${activeIndex + 1}`}
          loading="lazy"
          decoding="async"
          onError={() => setImageFailed(true)}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out desktop:group-hover/card:scale-[1.025]"
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-elevated via-app to-elevated text-app-muted dark:from-elevated dark:via-app dark:to-elevated">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/80 text-app-secondary shadow-sm dark:bg-elevated dark:text-app-secondary">
            {image ? <ImageOff size={21} aria-hidden="true" /> : <CarFront size={23} aria-hidden="true" />}
          </span>
          <span className="text-xs font-medium">{image ? 'Fotografija nije dostupna' : 'Vozilo bez fotografije'}</span>
        </div>
      )}

      <div className="photo-to-card-fade" aria-hidden="true" />

      {!car.ownerId && (
        <span className="pointer-events-none absolute bottom-3 left-3 z-10 rounded-full bg-black/70 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
          Demo
        </span>
      )}

      {hasMultipleImages && (
        <>
          <button
            type="button"
            onClick={(event) => { event.preventDefault(); event.stopPropagation(); changeImage(-1); }}
            aria-label={`Prethodna fotografija vozila ${title}`}
            className="pointer-events-auto absolute left-3 top-1/2 z-20 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/50 bg-black/55 text-white opacity-0 shadow-sm backdrop-blur-sm transition-all duration-150 hover:bg-black/75 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 desktop:flex desktop:group-hover/card:opacity-100"
          >
            <ChevronLeft size={19} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={(event) => { event.preventDefault(); event.stopPropagation(); changeImage(1); }}
            aria-label={`Sledeća fotografija vozila ${title}`}
            className="pointer-events-auto absolute right-3 top-1/2 z-20 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/50 bg-black/55 text-white opacity-0 shadow-sm backdrop-blur-sm transition-all duration-150 hover:bg-black/75 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 desktop:flex desktop:group-hover/card:opacity-100"
          >
            <ChevronRight size={19} aria-hidden="true" />
          </button>
        </>
      )}
    </div>
  );
}

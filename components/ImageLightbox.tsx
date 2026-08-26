'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageLightboxProps {
  images: string[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
  altPrefix?: string;
}

export function ImageLightbox({
  images,
  index,
  onIndexChange,
  onClose,
  altPrefix = 'Automobil',
}: ImageLightboxProps) {
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const goPrev = useCallback(() => {
    if (images.length <= 1) return;
    onIndexChange(index === 0 ? images.length - 1 : index - 1);
  }, [images.length, index, onIndexChange]);

  const goNext = useCallback(() => {
    if (images.length <= 1) return;
    onIndexChange(index === images.length - 1 ? 0 : index + 1);
  }, [images.length, index, onIndexChange]);

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    },
    [onClose, goPrev, goNext],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [handleKey]);

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    setIsDragging(true);
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const deltaX = e.touches[0].clientX - touchStartX.current;
    setDragOffset(deltaX);
  }

  function handleTouchEnd() {
    const threshold = 50;
    if (dragOffset > threshold) {
      goPrev();
    } else if (dragOffset < -threshold) {
      goNext();
    }
    setDragOffset(0);
    setIsDragging(false);
    touchStartX.current = null;
    touchStartY.current = null;
  }

  function handleMouseDown(e: React.MouseEvent) {
    touchStartX.current = e.clientX;
    setIsDragging(true);
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (touchStartX.current === null || !isDragging) return;
    const deltaX = e.clientX - touchStartX.current;
    setDragOffset(deltaX);
  }

  function handleMouseUp() {
    const threshold = 80;
    if (dragOffset > threshold) {
      goPrev();
    } else if (dragOffset < -threshold) {
      goNext();
    }
    setDragOffset(0);
    setIsDragging(false);
    touchStartX.current = null;
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black select-none"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-colors"
        aria-label="Zatvori"
      >
        <X size={20} />
      </button>

      {images.length > 1 && (
        <>
          <div
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20"
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
          >
            <button
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/5 backdrop-blur-sm flex items-center justify-center text-white/60 hover:text-white hover:bg-white/15 transition-all"
              aria-label="Prethodna slika"
            >
              <ChevronLeft size={20} />
            </button>
          </div>
          <div
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20"
            onClick={(e) => { e.stopPropagation(); goNext(); }}
          >
            <button
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/5 backdrop-blur-sm flex items-center justify-center text-white/60 hover:text-white hover:bg-white/15 transition-all"
              aria-label="Sledeća slika"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </>
      )}

      <div
        className="relative w-full h-full flex items-center justify-center overflow-hidden touch-pan-y"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <img
          src={images[index]}
          alt={`${altPrefix} - slika ${index + 1}`}
          className="max-w-full max-h-full object-contain transition-transform duration-150 ease-out"
          style={{
            transform: `translateX(${dragOffset}px)`,
            cursor: isDragging ? 'grabbing' : 'grab',
          }}
          draggable={false}
        />
      </div>

      {images.length > 1 && (
        <div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20"
          onClick={(e) => e.stopPropagation()}
        >
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => onIndexChange(i)}
              className={`h-2 rounded-full transition-all ${
                i === index ? 'w-6 bg-orange-500' : 'w-2 bg-white/50'
              }`}
            />
          ))}
        </div>
      )}

      {images.length > 1 && (
        <div
          className="absolute top-4 left-4 z-20 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="text-xs font-bold text-white">
            {index + 1} / {images.length}
          </span>
        </div>
      )}
    </div>
  );
}

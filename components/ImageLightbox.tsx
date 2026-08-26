'use client';

import { useEffect, useCallback } from 'react';
import { X } from 'lucide-react';

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
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && images.length > 1) {
        onIndexChange(index === 0 ? images.length - 1 : index - 1);
      }
      if (e.key === 'ArrowRight' && images.length > 1) {
        onIndexChange(index === images.length - 1 ? 0 : index + 1);
      }
    },
    [onClose, images.length, index, onIndexChange],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [handleKey]);

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-colors"
        aria-label="Zatvori"
      >
        <X size={20} />
      </button>

      <div
        className="relative w-full h-full flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={images[index]}
          alt={`${altPrefix} - slika ${index + 1}`}
          className="max-w-full max-h-full object-contain"
        />
      </div>

      {images.length > 1 && (
        <div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10"
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
          className="absolute top-4 left-4 z-10 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1"
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

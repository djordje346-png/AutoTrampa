'use client';

import { useState, ChangeEvent } from 'react';
import { UploadCloud, X } from 'lucide-react';

interface ImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
}

export function ImageUpload({ images, onChange, maxImages = 5 }: ImageUploadProps) {
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const fileArray = Array.from(files);
    
    fileArray.forEach((file) => {
      if (images.length >= maxImages) return;

      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          onChange([...images, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (indexToRemove: number) => {
    onChange(images.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-zinc-400">Fotografije vozila</label>
        <span className="text-xs text-zinc-500">
          {images.length}/{maxImages} dodato
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {images.map((imgUrl, index) => (
          <div
            key={index}
            className="relative aspect-square rounded-xl overflow-hidden bg-[#1A1A1A] border border-[#383838] group"
          >
            <img
              src={imgUrl}
              alt={`Slika vozila ${index + 1}`}
              className="w-full h-full object-cover"
            />
            {index === 0 && (
              <span className="absolute bottom-1.5 left-1.5 bg-amber-500 text-black font-extrabold text-[9px] px-1.5 py-0.5 rounded shadow">
                GLAVNA
              </span>
            )}
            <button
              type="button"
              onClick={() => removeImage(index)}
              className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 text-zinc-300 hover:text-white flex items-center justify-center backdrop-blur-sm transition"
            >
              <X size={14} />
            </button>
          </div>
        ))}

        {images.length < maxImages && (
          <label className="aspect-square rounded-xl border border-dashed border-[#383838] hover:border-amber-500/50 bg-[#1A1A1A] hover:bg-amber-500/5 transition cursor-pointer flex flex-col items-center justify-center p-2 text-center group">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-8 h-8 rounded-full bg-[#262626] flex items-center justify-center text-zinc-400 group-hover:text-amber-400 transition mb-1">
              <UploadCloud size={16} />
            </div>
            <span className="text-[11px] font-semibold text-zinc-300 group-hover:text-amber-400 transition">
              Dodaj sliku
            </span>
            <span className="text-[9px] text-zinc-500 mt-0.5">PNG, JPG do 5MB</span>
          </label>
        )}
      </div>
    </div>
  );
}
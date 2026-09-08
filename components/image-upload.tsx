'use client';

import { useRef, useState, ChangeEvent } from 'react';
import { CloudUpload as UploadCloud, X, Star, Loader as Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  processImageFile,
  dataUrlBytes,
  formatBytes,
  IMAGE_ERROR_MESSAGES,
  MAX_IMAGE_DIMENSION,
} from '@/lib/image';

interface ImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
}

export function ImageUpload({ images, onChange, maxImages = 20 }: ImageUploadProps) {
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    // Let the same file be picked again after a removal.
    e.target.value = '';
    if (files.length === 0) return;

    const room = maxImages - images.length;
    if (room <= 0) {
      toast.error(`Maksimalno ${maxImages} fotografija.`);
      return;
    }

    const accepted = files.slice(0, room);
    if (files.length > room) {
      toast.warning(`Dodato je prvih ${room} — limit je ${maxImages} fotografija.`);
    }

    setBusy(true);
    const added: string[] = [];
    const failures = new Set<string>();

    // Sequential: parallel canvas decoding of many phone photos stalls mobile.
    for (const file of accepted) {
      const result = await processImageFile(file);
      if (result.ok) {
        added.push(result.image.dataUrl);
      } else {
        failures.add(IMAGE_ERROR_MESSAGES[result.error]);
      }
    }
    setBusy(false);

    // One state update for the whole batch — updating per file would drop all
    // but the last image, since `images` is captured per render.
    if (added.length > 0) onChange([...images, ...added]);
    failures.forEach((message) => toast.error(message));
  }

  function removeImage(index: number) {
    onChange(images.filter((_, i) => i !== index));
  }

  function makeCover(index: number) {
    if (index === 0) return;
    const next = [...images];
    const [picked] = next.splice(index, 1);
    onChange([picked, ...next]);
  }

  const totalBytes = images.reduce((sum, img) => sum + dataUrlBytes(img), 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-medium text-app-muted">Fotografije vozila</label>
        <span className="text-xs text-app-muted">
          {images.length}/{maxImages}
          {images.length > 0 && ` · ${formatBytes(totalBytes)}`}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {images.map((imgUrl, index) => (
          <div
            key={`${index}-${imgUrl.slice(-24)}`}
            className="group relative aspect-square overflow-hidden rounded-xl border border-surface bg-elevated"
          >
            <img
              src={imgUrl}
              alt={`Slika vozila ${index + 1}`}
              className="h-full w-full object-cover"
            />

            {index === 0 ? (
              <span className="absolute bottom-1.5 left-1.5 rounded bg-orange-500 px-1.5 py-0.5 text-[9px] font-extrabold text-white shadow">
                GLAVNA
              </span>
            ) : (
              <button
                type="button"
                onClick={() => makeCover(index)}
                title="Postavi kao glavnu"
                aria-label={`Postavi sliku ${index + 1} kao glavnu`}
                className="absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded bg-black/70 px-1.5 py-0.5 text-[9px] font-bold text-white backdrop-blur-sm transition hover:bg-orange-500"
              >
                <Star size={9} />
                GLAVNA
              </button>
            )}

            <button
              type="button"
              onClick={() => removeImage(index)}
              aria-label={`Ukloni sliku ${index + 1}`}
              className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white backdrop-blur-sm transition hover:text-rose-400"
            >
              <X size={14} />
            </button>
          </div>
        ))}

        {images.length < maxImages && (
          <label
            className={`group flex aspect-square cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-surface bg-elevated p-2 text-center transition hover:border-orange-500/50 hover:bg-orange-500/5 ${
              busy ? 'pointer-events-none opacity-60' : ''
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              disabled={busy}
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="mb-1 flex h-8 w-8 items-center justify-center rounded-full bg-hover-surface text-app-muted transition group-hover:text-orange-400">
              {busy ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
            </div>
            <span className="text-[11px] font-semibold text-app-secondary transition group-hover:text-orange-400">
              {busy ? 'Obrada…' : 'Dodaj sliku'}
            </span>
            <span className="mt-0.5 text-[9px] text-app-muted">JPG, PNG, WebP</span>
          </label>
        )}
      </div>

      <p className="text-[11px] leading-relaxed text-app-muted">
        Slike se automatski smanjuju na {MAX_IMAGE_DIMENSION} px i čuvaju lokalno u pregledaču.
        Prva slika je naslovna.
      </p>
    </div>
  );
}

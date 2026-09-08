/**
 * Client-side image downscaling.
 *
 * Photos are persisted as base64 inside localStorage (~5 MB per origin), so a
 * raw 4 MB phone photo would blow the whole budget on its own. Everything is
 * resized and re-encoded before it ever reaches the store.
 */

export const MAX_IMAGE_DIMENSION = 1600;
export const IMAGE_QUALITY = 0.82;
export const MAX_SOURCE_BYTES = 15 * 1024 * 1024;

export type ImageError = 'type' | 'size' | 'decode';

export const IMAGE_ERROR_MESSAGES: Record<ImageError, string> = {
  type: 'Podržane su samo slike (JPG, PNG, WebP).',
  size: 'Slika je prevelika (maksimalno 15 MB).',
  decode: 'Sliku nije moguće učitati.',
};

export interface ProcessedImage {
  dataUrl: string;
  bytes: number;
  width: number;
  height: number;
}

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('read'));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('decode'));
    img.src = src;
  });
}

/** Bytes a base64 data URL occupies once stored. */
export function dataUrlBytes(dataUrl: string): number {
  const comma = dataUrl.indexOf(',');
  const payload = comma === -1 ? dataUrl : dataUrl.slice(comma + 1);
  return Math.round((payload.length * 3) / 4);
}

export async function processImageFile(
  file: File,
  maxDimension = MAX_IMAGE_DIMENSION,
): Promise<{ ok: true; image: ProcessedImage } | { ok: false; error: ImageError }> {
  if (!file.type.startsWith('image/')) return { ok: false, error: 'type' };
  if (file.size > MAX_SOURCE_BYTES) return { ok: false, error: 'size' };

  try {
    const source = await readAsDataURL(file);
    const img = await loadImage(source);

    const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
    const width = Math.max(1, Math.round(img.width * scale));
    const height = Math.max(1, Math.round(img.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return { ok: false, error: 'decode' };

    ctx.drawImage(img, 0, 0, width, height);
    const dataUrl = canvas.toDataURL('image/jpeg', IMAGE_QUALITY);

    return {
      ok: true,
      image: { dataUrl, bytes: dataUrlBytes(dataUrl), width, height },
    };
  } catch {
    return { ok: false, error: 'decode' };
  }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

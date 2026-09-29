import { getSupabase } from '@/lib/supabase';

function publicObjectPath(url: string): string | null {
  const marker = '/storage/v1/object/public/car-images/';
  const position = url.indexOf(marker);
  if (position < 0) return null;
  return decodeURIComponent(url.slice(position + marker.length));
}

export function storedCarImagePaths(images: string[]): string[] {
  return images.map(publicObjectPath).filter((path): path is string => Boolean(path));
}

export async function uploadCarImages(userId: string, images: string[]) {
  const supabase = getSupabase();
  const uploaded: string[] = [];
  const results = await Promise.allSettled(images.map(async (image, index) => {
      if (!image.startsWith('data:image/')) return image;

      const blob = await fetch(image).then((response) => response.blob());
      const extension = blob.type === 'image/png' ? 'png' : blob.type === 'image/webp' ? 'webp' : 'jpg';
      const path = `${userId}/${crypto.randomUUID()}-${index}.${extension}`;
      const { error } = await supabase.storage.from('car-images').upload(path, blob, {
        cacheControl: '31536000',
        contentType: blob.type || 'image/jpeg',
        upsert: false,
      });
      if (error) throw error;
      uploaded.push(path);
      return supabase.storage.from('car-images').getPublicUrl(path).data.publicUrl;
  }));

  const failed = results.find((result) => result.status === 'rejected');
  if (failed?.status === 'rejected') {
    if (uploaded.length > 0) await supabase.storage.from('car-images').remove(uploaded);
    throw failed.reason;
  }
  return { images: results.map((result) => (result as PromiseFulfilledResult<string>).value), uploaded };
}

export async function removeCarImages(images: string[]) {
  const paths = storedCarImagePaths(images);
  if (paths.length === 0) return;
  const { error } = await getSupabase().storage.from('car-images').remove(paths);
  if (error) throw error;
}

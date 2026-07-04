import { supabase } from '@/lib/supabase';

export async function uploadPropertyImage(file: File, propertyId: string): Promise<{ url: string; path: string } | null> {
  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `${propertyId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('property-images').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) return null;
  const { data: { publicUrl } } = supabase.storage.from('property-images').getPublicUrl(path);
  return { url: publicUrl, path };
}

export async function deletePropertyImage(path: string): Promise<void> {
  await supabase.storage.from('property-images').remove([path]);
}

export async function uploadPropertyVideo(file: File, propertyId: string): Promise<{ url: string; path: string } | null> {
  const ext = file.name.split('.').pop() ?? 'mp4';
  const path = `${propertyId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('property-videos').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) return null;
  const { data: { publicUrl } } = supabase.storage.from('property-videos').getPublicUrl(path);
  return { url: publicUrl, path };
}

export async function deletePropertyVideo(path: string): Promise<void> {
  await supabase.storage.from('property-videos').remove([path]);
}

export async function uploadAvatar(file: File, userId: string): Promise<string | null> {
  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `${userId}/avatar.${ext}`;
  const { error } = await supabase.storage.from('avatars').upload(path, file, {
    cacheControl: '3600',
    upsert: true,
  });
  if (error) return null;
  const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
  return publicUrl;
}

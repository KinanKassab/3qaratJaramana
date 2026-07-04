import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ============================================================
// Telegram channel → draft property importer
//
// Receives channel_post updates from a Telegram Bot API webhook,
// parses the site's fixed listing format (numbered fields: الموقع،
// المساحة، الطابق، التقسيم، الكسوة، السعر), and inserts a draft
// property for admin review — never publishes automatically.
// ============================================================

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN') ?? '';
const TELEGRAM_WEBHOOK_SECRET = Deno.env.get('TELEGRAM_WEBHOOK_SECRET') ?? '';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const LABELS = ['الموقع', 'المساحة', 'الطابق', 'التقسيم', 'الكسوة', 'السعر'];

interface TelegramPhoto {
  file_id: string;
  width: number;
  height: number;
}

interface TelegramChannelPost {
  message_id: number;
  text?: string;
  caption?: string;
  media_group_id?: string;
  photo?: TelegramPhoto[];
}

function extractField(text: string, label: string): string | null {
  const idx = text.indexOf(label);
  if (idx === -1) return null;
  const rest = text.slice(idx + label.length).replace(/^[\s:：]+/, '');

  let cutoff = rest.length;
  for (const other of LABELS) {
    if (other === label) continue;
    const otherIdx = rest.indexOf(other);
    if (otherIdx !== -1 && otherIdx < cutoff) cutoff = otherIdx;
  }
  const contactIdx = rest.indexOf('للتواصل');
  if (contactIdx !== -1 && contactIdx < cutoff) cutoff = contactIdx;

  const value = rest.slice(0, cutoff).trim();
  return value || null;
}

function parseArea(text: string | null): number | null {
  if (!text) return null;
  const m = text.match(/(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1]) : null;
}

function parseFloorNumber(text: string | null): number | null {
  if (!text) return null;
  const m = text.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : null;
}

function parseBedrooms(text: string | null): number | null {
  if (!text) return null;
  const digitMatch = text.match(/(\d+)\s*غرف/);
  if (digitMatch) return parseInt(digitMatch[1], 10);
  if (/غرفتين/.test(text)) return 2;

  const wordMap: Record<string, number> = {
    ثلاثة: 3, ثلاث: 3,
    أربعة: 4, اربعة: 4, أربع: 4, اربع: 4,
    خمسة: 5, خمس: 5,
    ستة: 6, ست: 6,
  };
  for (const [word, num] of Object.entries(wordMap)) {
    if (text.includes(word)) return num;
  }
  if (/غرفة/.test(text)) return 1;
  return null;
}

function parseBathrooms(text: string | null): number | null {
  if (!text) return null;
  if (/حمامين/.test(text)) return 2;
  if (/حمام/.test(text)) return 1;
  return null;
}

function parsePrice(text: string | null): { price: number; currency: 'SYP' | 'USD' } | null {
  if (!text) return null;
  const m = text.match(/(\d+(?:[.,]\d+)?)/);
  if (!m) return null;
  const num = parseFloat(m[1].replace(',', '.'));
  if (Number.isNaN(num) || num <= 0) return null;

  if (/الف|ألف/.test(text)) return { price: Math.round(num * 1000), currency: 'USD' };
  if (/مليون/.test(text)) return { price: Math.round(num * 1_000_000), currency: 'SYP' };
  // No unit word found — guess by magnitude: large raw numbers are SYP, small ones USD
  return { price: Math.round(num), currency: num >= 100_000 ? 'SYP' : 'USD' };
}

function detectListingType(text: string): 'sale' | 'rent' {
  return /للإيجار|للايجار/.test(text) ? 'rent' : 'sale';
}

const CATEGORY_LABELS: Record<string, string> = {
  apartments: 'شقة', villas: 'فيلا', houses: 'بيت',
  land: 'أرض', commercial: 'محل', offices: 'مكتب',
};

function detectCategorySlug(text: string): string {
  if (/أرض|قطعة\s*ارض/.test(text)) return 'land';
  if (/محل|معرض\s*تجاري|مستودع/.test(text)) return 'commercial';
  if (/مكتب/.test(text)) return 'offices';
  if (/فيلا|قصر/.test(text)) return 'villas';
  if (/بيت|منزل\s*مستقل/.test(text)) return 'houses';
  return 'apartments';
}

async function matchNeighborhood(locationText: string | null): Promise<{ id: string; name: string } | null> {
  if (!locationText) return null;
  const { data } = await supabase
    .from('locations')
    .select('id, name_ar')
    .eq('type', 'district')
    .eq('is_active', true);

  for (const d of data ?? []) {
    if (locationText.includes(d.name_ar)) return { id: d.id, name: d.name_ar };
  }
  return null;
}

async function getJaramanaCityId(): Promise<string | null> {
  const { data } = await supabase.from('locations').select('id').eq('slug', 'jaramana').maybeSingle();
  return data?.id ?? null;
}

async function downloadTelegramFile(fileId: string): Promise<{ blob: Blob; ext: string; contentType: string } | null> {
  const fileRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getFile?file_id=${fileId}`);
  const fileJson = await fileRes.json();
  const filePath: string | undefined = fileJson?.result?.file_path;
  if (!filePath) return null;

  const fileUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${filePath}`;
  const res = await fetch(fileUrl);
  if (!res.ok) return null;

  const blob = await res.blob();
  const ext = filePath.split('.').pop() || 'jpg';
  return { blob, ext, contentType: blob.type || `image/${ext === 'jpg' ? 'jpeg' : ext}` };
}

async function attachPhoto(propertyId: string, fileId: string, messageId: number): Promise<void> {
  const { data: existing } = await supabase
    .from('property_images')
    .select('id')
    .eq('telegram_message_id', messageId)
    .maybeSingle();
  if (existing) return;

  const file = await downloadTelegramFile(fileId);
  if (!file) return;

  const { count } = await supabase
    .from('property_images')
    .select('id', { count: 'exact', head: true })
    .eq('property_id', propertyId);
  const sortOrder = count ?? 0;

  const path = `telegram/${propertyId}/${Date.now()}-${sortOrder}.${file.ext}`;
  const { error: uploadError } = await supabase.storage
    .from('property-images')
    .upload(path, file.blob, { contentType: file.contentType });
  if (uploadError) {
    console.error('image upload error', uploadError);
    return;
  }

  const { data: publicUrlData } = supabase.storage.from('property-images').getPublicUrl(path);

  await supabase.from('property_images').insert({
    property_id: propertyId,
    url: publicUrlData.publicUrl,
    storage_path: path,
    is_cover: sortOrder === 0,
    sort_order: sortOrder,
    telegram_message_id: messageId,
  });
}

async function createPropertyFromText(text: string, messageId: number): Promise<string | null> {
  const { data: existing } = await supabase
    .from('properties')
    .select('id')
    .eq('telegram_message_id', messageId)
    .maybeSingle();
  if (existing) return existing.id;

  const listingType = detectListingType(text);
  const locationText = extractField(text, 'الموقع');
  const areaText = extractField(text, 'المساحة');
  const floorText = extractField(text, 'الطابق');
  const layoutText = extractField(text, 'التقسيم');
  const finishText = extractField(text, 'الكسوة');
  const priceText = extractField(text, 'السعر');

  const area = parseArea(areaText);
  const floorNumber = parseFloorNumber(floorText);
  const bedrooms = parseBedrooms(layoutText);
  const bathrooms = parseBathrooms(layoutText);
  const priceInfo = parsePrice(priceText);
  const categorySlug = detectCategorySlug(text);

  const neighborhood = await matchNeighborhood(locationText);
  const locationId = neighborhood?.id ?? (await getJaramanaCityId());

  const title_ar = `${CATEGORY_LABELS[categorySlug] ?? 'عقار'} ${
    listingType === 'rent' ? 'للإيجار' : 'للبيع'
  } في ${neighborhood?.name ?? 'جرمانا'}`;

  const descriptionParts = [
    floorText ? `الطابق: ${floorText}` : null,
    layoutText ? `التقسيم: ${layoutText}` : null,
    finishText ? `الكسوة: ${finishText}` : null,
  ].filter(Boolean);

  const slug = `telegram-${messageId}-${Date.now().toString().slice(-6)}`;

  const { data: category } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', categorySlug)
    .maybeSingle();

  const { data: inserted, error } = await supabase
    .from('properties')
    .insert({
      title_ar,
      description_ar: descriptionParts.join('\n') || null,
      address_ar: locationText,
      slug,
      category_id: category?.id ?? null,
      location_id: locationId,
      listing_type: listingType,
      status: 'draft',
      price: priceInfo?.price ?? 0,
      currency: priceInfo?.currency ?? 'SYP',
      area,
      bedrooms,
      bathrooms,
      floor_number: floorNumber,
      source: 'telegram',
      telegram_message_id: messageId,
    })
    .select('id')
    .single();

  if (error) {
    console.error('property insert error', error);
    return null;
  }
  return inserted.id;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok');

  if (TELEGRAM_WEBHOOK_SECRET) {
    const header = req.headers.get('x-telegram-bot-api-secret-token');
    if (header !== TELEGRAM_WEBHOOK_SECRET) {
      return new Response('unauthorized', { status: 401 });
    }
  }

  try {
    const update = await req.json();
    const post: TelegramChannelPost | undefined = update.channel_post ?? update.edited_channel_post;
    // Always 200 on anything we don't handle so Telegram doesn't disable the webhook after retries
    if (!post) return new Response('ok');

    const text = post.text ?? post.caption ?? '';
    const messageId = post.message_id;
    const mediaGroupId = post.media_group_id ?? null;
    const photos = post.photo;
    const largestPhoto = photos?.[photos.length - 1]; // Telegram sorts ascending by size
    const hasListingPattern = /السعر/.test(text);

    if (mediaGroupId) {
      const { data: album } = await supabase
        .from('telegram_albums')
        .select('property_id')
        .eq('media_group_id', mediaGroupId)
        .maybeSingle();

      if (album?.property_id) {
        if (largestPhoto) await attachPhoto(album.property_id, largestPhoto.file_id, messageId);
        return new Response('ok');
      }

      if (hasListingPattern) {
        const propertyId = await createPropertyFromText(text, messageId);
        if (propertyId) {
          await supabase.from('telegram_albums').insert({ media_group_id: mediaGroupId, property_id: propertyId });
          if (largestPhoto) await attachPhoto(propertyId, largestPhoto.file_id, messageId);

          const { data: pending } = await supabase
            .from('telegram_pending_media')
            .select('*')
            .eq('media_group_id', mediaGroupId);
          for (const p of pending ?? []) {
            await attachPhoto(propertyId, p.file_id, p.message_id);
          }
          if (pending?.length) {
            await supabase.from('telegram_pending_media').delete().eq('media_group_id', mediaGroupId);
          }
        }
        return new Response('ok');
      }

      // Caption hasn't arrived yet — buffer this photo for when it does
      if (largestPhoto) {
        await supabase.from('telegram_pending_media').insert({
          media_group_id: mediaGroupId,
          file_id: largestPhoto.file_id,
          message_id: messageId,
        });
      }
      return new Response('ok');
    }

    // Not part of an album — skip separators/promo posts with no price field
    if (!hasListingPattern) return new Response('ok');

    const propertyId = await createPropertyFromText(text, messageId);
    if (propertyId && largestPhoto) {
      await attachPhoto(propertyId, largestPhoto.file_id, messageId);
    }

    return new Response('ok');
  } catch (err) {
    console.error('telegram-webhook error', err);
    return new Response('ok');
  }
});

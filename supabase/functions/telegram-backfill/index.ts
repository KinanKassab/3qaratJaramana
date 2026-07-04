import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ============================================================
// One-time backfill: imports historical posts from the public
// Telegram channel preview (t.me/s/<channel>) as draft properties.
// Reuses the same listing-format parser as telegram-webhook, but
// reads photos straight from the preview's CDN links instead of
// the Bot API (no bot token needed for this one-off migration).
//
// Invoke with POST { "before"?: number } — omit "before" to start
// from the newest page. Response includes next_before to continue;
// call again with that value until "done": true.
// ============================================================

const CHANNEL = 'jaramana_grand_real_estate';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const LABELS = ['الموقع', 'المساحة', 'الطابق', 'التقسيم', 'الكسوة', 'السعر'];

// Strips a trailing line that's just the next field's leading marker
// (emoji/digit/underscore, no Arabic letters) left over from cutting
// the text off right before the next label word.
function stripTrailingMarkerLine(value: string): string {
  const lines = value.split('\n');
  while (lines.length > 1 && /^[^؀-ۿ]*$/.test(lines[lines.length - 1].trim())) {
    lines.pop();
  }
  return lines.join('\n').trim();
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

  const value = stripTrailingMarkerLine(rest.slice(0, cutoff).trim());
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

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function htmlToText(html: string): string {
  return decodeHtmlEntities(html.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '')).trim();
}

interface ParsedBlock {
  messageId: number;
  text: string;
  photoUrls: string[];
  videoThumbUrls: string[];
}

function parseBlocks(html: string): ParsedBlock[] {
  const blocks: ParsedBlock[] = [];
  const postRegex = new RegExp(`data-post="${CHANNEL}/(\\d+)"`, 'g');
  const matches = [...html.matchAll(postRegex)];

  for (let i = 0; i < matches.length; i++) {
    const messageId = parseInt(matches[i][1], 10);
    const start = matches[i].index!;
    const end = i + 1 < matches.length ? matches[i + 1].index! : html.length;
    const block = html.slice(start, end);

    const textMatch = block.match(/tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/);
    const text = textMatch ? htmlToText(textMatch[1]) : '';

    const photoUrls: string[] = [];
    const photoRegex = /class="tgme_widget_message_photo_wrap[^"]*"[^>]*style="[^"]*background-image:url\('([^']+)'\)/g;
    let pm;
    while ((pm = photoRegex.exec(block))) {
      photoUrls.push(pm[1]);
    }

    // Fallback cover when a listing only has a video attached — the
    // preview's blurred thumbnail beats no image at all; the admin can
    // swap in a real photo during review.
    const videoThumbUrls: string[] = [];
    const videoThumbRegex = /class="tgme_widget_message_video_thumb"[^>]*style="[^"]*background-image:url\('([^']+)'\)/g;
    let vm;
    while ((vm = videoThumbRegex.exec(block))) {
      videoThumbUrls.push(vm[1]);
    }

    blocks.push({ messageId, text, photoUrls, videoThumbUrls });
  }
  return blocks;
}

function findPrevBefore(html: string): number | null {
  const m = html.match(/rel="prev"\s+href="\/s\/[^"?]+\?before=(\d+)"/);
  return m ? parseInt(m[1], 10) : null;
}

async function attachPhotoFromUrl(propertyId: string, photoUrl: string, messageId: number, index: number): Promise<void> {
  const dedupeKey = messageId * 100 + index; // unique per photo within a backfilled post
  const { data: existing } = await supabase
    .from('property_images')
    .select('id')
    .eq('telegram_message_id', dedupeKey)
    .maybeSingle();
  if (existing) return;

  const res = await fetch(photoUrl);
  if (!res.ok) return;
  const blob = await res.blob();

  const { count } = await supabase
    .from('property_images')
    .select('id', { count: 'exact', head: true })
    .eq('property_id', propertyId);
  const sortOrder = count ?? 0;

  const path = `telegram/${propertyId}/${Date.now()}-${sortOrder}.jpg`;
  const { error: uploadError } = await supabase.storage
    .from('property-images')
    .upload(path, blob, { contentType: 'image/jpeg' });
  if (uploadError) {
    console.error('backfill image upload error', uploadError);
    return;
  }

  const { data: publicUrlData } = supabase.storage.from('property-images').getPublicUrl(path);
  await supabase.from('property_images').insert({
    property_id: propertyId,
    url: publicUrlData.publicUrl,
    storage_path: path,
    is_cover: sortOrder === 0,
    sort_order: sortOrder,
    telegram_message_id: dedupeKey,
  });
}

async function createPropertyFromBlock(block: ParsedBlock): Promise<string | null> {
  const { data: existing } = await supabase
    .from('properties')
    .select('id')
    .eq('telegram_message_id', block.messageId)
    .maybeSingle();
  if (existing) return existing.id;

  const text = block.text;
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

  const slug = `telegram-${block.messageId}-${Date.now().toString().slice(-6)}`;

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
      telegram_message_id: block.messageId,
    })
    .select('id')
    .single();

  if (error) {
    console.error('backfill property insert error', error);
    return null;
  }
  return inserted.id;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok');

  try {
    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
    const before: number | undefined = body?.before;

    const pageUrl = before
      ? `https://t.me/s/${CHANNEL}?before=${before}`
      : `https://t.me/s/${CHANNEL}`;

    const pageRes = await fetch(pageUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; JaramanaBackfill/1.0)' },
    });
    if (!pageRes.ok) {
      return new Response(JSON.stringify({ error: `fetch failed: ${pageRes.status}` }), { status: 502 });
    }
    const html = await pageRes.text();

    const blocks = parseBlocks(html);
    let imported = 0;
    let skipped = 0;

    // Photos/videos for a listing are posted as separate messages right
    // after its caption (not bundled in the same data-post block) — so
    // pull in every sibling block's photos up to the next captioned
    // listing (next block containing "السعر").
    let idx = 0;
    while (idx < blocks.length) {
      const block = blocks[idx];
      if (!/السعر/.test(block.text)) {
        skipped++;
        idx++;
        continue;
      }

      const photoUrls = [...block.photoUrls];
      const videoThumbUrls = [...block.videoThumbUrls];
      let next = idx + 1;
      while (next < blocks.length && !/السعر/.test(blocks[next].text)) {
        photoUrls.push(...blocks[next].photoUrls);
        videoThumbUrls.push(...blocks[next].videoThumbUrls);
        next++;
      }
      // Only fall back to blurred video thumbnails when no real photo exists
      const images = photoUrls.length > 0 ? photoUrls : videoThumbUrls;

      const propertyId = await createPropertyFromBlock({ ...block, photoUrls: images });
      if (propertyId) {
        imported++;
        for (let i = 0; i < images.length; i++) {
          await attachPhotoFromUrl(propertyId, images[i], block.messageId, i);
        }
      }
      idx = next;
    }

    const nextBefore = findPrevBefore(html);

    return new Response(
      JSON.stringify({
        page_url: pageUrl,
        blocks_seen: blocks.length,
        imported,
        skipped,
        next_before: nextBefore,
        done: nextBefore === null,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('telegram-backfill error', err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});

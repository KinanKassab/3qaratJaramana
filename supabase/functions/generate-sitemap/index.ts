import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const APP_URL = Deno.env.get('APP_URL') ?? 'https://3qaratjaramana.com';

serve(async (_req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const [propertiesRes, locationsRes, categoriesRes] = await Promise.all([
    supabase
      .from('properties')
      .select('slug, updated_at')
      .eq('status', 'available')
      .order('updated_at', { ascending: false }),
    supabase
      .from('locations')
      .select('slug, type')
      .eq('is_active', true),
    supabase
      .from('categories')
      .select('slug')
      .eq('is_active', true),
  ]);

  const properties = propertiesRes.data ?? [];
  const locations = locationsRes.data ?? [];
  const categories = categoriesRes.data ?? [];

  const staticPages = [
    { url: `${APP_URL}/`, priority: '1.0', changefreq: 'daily' },
    { url: `${APP_URL}/properties`, priority: '0.9', changefreq: 'daily' },
    { url: `${APP_URL}/map`, priority: '0.8', changefreq: 'weekly' },
    { url: `${APP_URL}/compare`, priority: '0.6', changefreq: 'monthly' },
  ];

  const propertyUrls = properties.map(
    (p: { slug: string; updated_at: string }) => ({
      url: `${APP_URL}/property/${p.slug}`,
      lastmod: p.updated_at?.split('T')[0],
      priority: '0.8',
      changefreq: 'weekly',
    })
  );

  const locationUrls = locations
    .filter((l: { type: string }) => l.type !== 'country')
    .map((l: { slug: string }) => ({
      url: `${APP_URL}/properties?location=${l.slug}`,
      priority: '0.7',
      changefreq: 'weekly',
    }));

  const categoryUrls = categories.map((c: { slug: string }) => ({
    url: `${APP_URL}/properties?category=${c.slug}`,
    priority: '0.7',
    changefreq: 'weekly',
  }));

  const allUrls = [...staticPages, ...propertyUrls, ...locationUrls, ...categoryUrls];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${allUrls
  .map(
    (entry) => `  <url>
    <loc>${entry.url}</loc>
    ${entry.lastmod ? `<lastmod>${entry.lastmod}</lastmod>` : ''}
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
    <xhtml:link rel="alternate" hreflang="ar" href="${entry.url}?lang=ar"/>
    <xhtml:link rel="alternate" hreflang="en" href="${entry.url}?lang=en"/>
  </url>`
  )
  .join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      'Access-Control-Allow-Origin': '*',
    },
  });
});

export const config = { runtime: 'edge' };

export default async function handler(_req: Request): Promise<Response> {
  const supabaseUrl = process.env.SUPABASE_URL ?? '';
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ?? '';

  if (!supabaseUrl) {
    return new Response('SUPABASE_URL not configured', { status: 500 });
  }

  const res = await fetch(`${supabaseUrl}/functions/v1/generate-sitemap`, {
    headers: { Authorization: `Bearer ${supabaseAnonKey}` },
  });

  const xml = await res.text();

  return new Response(xml, {
    status: res.ok ? 200 : res.status,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400',
    },
  });
}

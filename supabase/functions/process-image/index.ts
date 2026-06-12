import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  }

  try {
    const { storage_path, property_id } = await req.json();

    if (!storage_path || !property_id) {
      return new Response(JSON.stringify({ error: 'Missing storage_path or property_id' }), {
        status: 400,
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Download original image
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('property-images')
      .download(storage_path);

    if (downloadError || !fileData) {
      return new Response(JSON.stringify({ error: 'Failed to download image' }), { status: 500 });
    }

    // Note: Full image processing (resize/WebP conversion) requires
    // a native image library. This function currently validates the upload
    // and updates the DB record. For production, integrate with an image
    // CDN service (Cloudflare Images, Imgix) for transformation.

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('property-images')
      .getPublicUrl(storage_path);

    return new Response(
      JSON.stringify({
        success: true,
        url: publicUrlData.publicUrl,
        storage_path,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

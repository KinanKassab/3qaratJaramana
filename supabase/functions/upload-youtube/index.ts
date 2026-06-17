import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, x-client-info, apikey',
};

async function getAccessToken(): Promise<string> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: Deno.env.get('YOUTUBE_CLIENT_ID')!,
      client_secret: Deno.env.get('YOUTUBE_CLIENT_SECRET')!,
      refresh_token: Deno.env.get('YOUTUBE_REFRESH_TOKEN')!,
      grant_type: 'refresh_token',
    }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error('Failed to get YouTube access token');
  return data.access_token;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const formData = await req.formData();
    const file = formData.get('video') as File | null;
    const title = (formData.get('title') as string | null) ?? 'Property Video';

    if (!file) {
      return new Response(JSON.stringify({ error: 'No video file provided' }), {
        status: 400,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const accessToken = await getAccessToken();

    // Initiate resumable upload session
    const initRes = await fetch(
      'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Upload-Content-Type': file.type,
          'X-Upload-Content-Length': String(file.size),
        },
        body: JSON.stringify({
          snippet: {
            title,
            description: 'عقارات جرمانا',
            categoryId: '22',
          },
          status: { privacyStatus: 'unlisted' },
        }),
      },
    );

    if (!initRes.ok) {
      const err = await initRes.text();
      throw new Error(`YouTube init error: ${err}`);
    }

    const uploadUrl = initRes.headers.get('Location');
    if (!uploadUrl) throw new Error('No upload URL returned from YouTube');

    // Upload the file
    const buffer = await file.arrayBuffer();
    const uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
        'Content-Length': String(file.size),
      },
      body: buffer,
    });

    if (!uploadRes.ok) {
      const err = await uploadRes.text();
      throw new Error(`YouTube upload error: ${err}`);
    }

    const videoData = await uploadRes.json();
    const videoId: string = videoData.id;

    return new Response(
      JSON.stringify({ url: `https://www.youtube.com/watch?v=${videoId}`, videoId }),
      { headers: { ...CORS, 'Content-Type': 'application/json' } },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});

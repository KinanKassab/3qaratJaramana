import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface NotificationPayload {
  user_ids?: string[];
  broadcast?: boolean;
  type: string;
  title_ar: string;
  title_en?: string;
  body_ar?: string;
  body_en?: string;
  data?: Record<string, unknown>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const payload: NotificationPayload = await req.json();
    const { user_ids, broadcast, type, title_ar, title_en, body_ar, body_en, data } = payload;

    // Get target users
    let targetUserIds: string[] = user_ids ?? [];

    if (broadcast) {
      const { data: allUsers } = await supabase
        .from('users')
        .select('id')
        .eq('is_active', true);
      targetUserIds = (allUsers ?? []).map((u: { id: string }) => u.id);
    }

    if (targetUserIds.length === 0) {
      return new Response(JSON.stringify({ error: 'No target users' }), { status: 400 });
    }

    // Insert notifications into DB
    const notifications = targetUserIds.map((uid) => ({
      user_id: uid,
      type,
      title_ar,
      title_en,
      body_ar,
      body_en,
      data,
    }));

    await supabase.from('notifications').insert(notifications);

    // Send push notifications via Expo
    const { data: usersWithTokens } = await supabase
      .from('users')
      .select('expo_push_token')
      .in('id', targetUserIds)
      .not('expo_push_token', 'is', null);

    const pushTokens = (usersWithTokens ?? [])
      .map((u: { expo_push_token: string | null }) => u.expo_push_token)
      .filter(Boolean);

    if (pushTokens.length > 0) {
      const messages = pushTokens.map((token) => ({
        to: token,
        sound: 'default',
        title: title_ar,
        body: body_ar,
        data: data ?? {},
      }));

      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages),
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        notified_users: targetUserIds.length,
        push_sent: pushTokens.length,
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

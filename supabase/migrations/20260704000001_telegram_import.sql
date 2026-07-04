-- ============================================================
-- Telegram channel import support
-- Lets a Supabase Edge Function ingest listings posted to the
-- Telegram channel as draft properties for admin review.
-- ============================================================

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'telegram')),
  ADD COLUMN IF NOT EXISTS telegram_message_id BIGINT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_properties_telegram_message_id
  ON public.properties(telegram_message_id) WHERE telegram_message_id IS NOT NULL;

ALTER TABLE public.property_images
  ADD COLUMN IF NOT EXISTS telegram_message_id BIGINT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_property_images_telegram_message_id
  ON public.property_images(telegram_message_id) WHERE telegram_message_id IS NOT NULL;

-- Maps a Telegram album (media_group_id) to the draft property created
-- from its captioned message, so later photos in the same album attach
-- to the right property instead of creating duplicates.
CREATE TABLE IF NOT EXISTS public.telegram_albums (
  media_group_id TEXT PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Buffers photos that arrive before the captioned message in an album
-- (Telegram does not guarantee message order), drained once the
-- caption creates the property.
CREATE TABLE IF NOT EXISTS public.telegram_pending_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  media_group_id TEXT NOT NULL,
  file_id TEXT NOT NULL,
  message_id BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_telegram_pending_media_group
  ON public.telegram_pending_media(media_group_id);

-- Internal tables only touched by the edge function via the service
-- role key, which bypasses RLS — enable RLS with no policies so no
-- other role can read/write them.
ALTER TABLE public.telegram_albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_pending_media ENABLE ROW LEVEL SECURITY;

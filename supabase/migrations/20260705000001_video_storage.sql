-- ============================================================
-- Store property videos directly in Supabase Storage instead of
-- uploading to YouTube. Mirrors the property-images bucket setup.
-- ============================================================

ALTER TABLE public.property_videos
  ADD COLUMN IF NOT EXISTS storage_path TEXT;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'property-videos',
  'property-videos',
  true,
  524288000,  -- 500 MB
  ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/3gpp']
)
ON CONFLICT (id) DO NOTHING;

-- Property Videos: public read
CREATE POLICY "property_videos_public_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'property-videos');

-- Property Videos: authenticated agents/admins can upload
CREATE POLICY "property_videos_agent_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'property-videos'
    AND auth.role() = 'authenticated'
    AND public.user_role() IN ('agent', 'admin')
  );

-- Property Videos: admins or the uploading agent can delete
CREATE POLICY "property_videos_agent_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'property-videos'
    AND auth.role() = 'authenticated'
    AND (
      public.user_role() = 'admin'
      OR (storage.foldername(name))[1] = auth.uid()::text
    )
  );

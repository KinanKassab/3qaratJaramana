-- ============================================================
-- Database Functions & Triggers
-- ============================================================

-- ============================================================
-- Auto-create users row on auth.users INSERT
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, full_name, preferred_language)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      split_part(NEW.email, '@', 1)
    ),
    COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'ar')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Trigger on auth.users requires superuser; apply via Supabase Dashboard:
-- Authentication → Hooks → "After user is created" → public.handle_new_user
-- OR run this in SQL Editor (works with service_role):
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;

-- ============================================================
-- updated_at trigger function
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- SEO-friendly slug generation
-- Format: {category-en}-for-{sale|rent}-{location-en}-{counter}
-- ============================================================
CREATE OR REPLACE FUNCTION public.generate_property_slug(
  p_title TEXT,
  p_category_slug TEXT DEFAULT NULL,
  p_location_slug TEXT DEFAULT NULL,
  p_listing_type TEXT DEFAULT 'sale'
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_base TEXT;
  v_slug TEXT;
  v_counter INT := 1;
BEGIN
  -- Build a human-readable base from available info
  v_base := LOWER(
    COALESCE(p_category_slug, 'property')
    || '-for-' || p_listing_type
    || CASE WHEN p_location_slug IS NOT NULL THEN '-' || p_location_slug ELSE '' END
  );

  -- Sanitize: keep only alphanumeric and hyphens
  v_base := regexp_replace(v_base, '[^a-z0-9\-]', '', 'g');
  v_base := regexp_replace(v_base, '-+', '-', 'g');
  v_base := trim(both '-' from v_base);

  -- Find unique slug with counter suffix
  v_slug := v_base || '-' || floor(random() * 9000 + 1000)::TEXT;

  WHILE EXISTS (SELECT 1 FROM public.properties WHERE slug = v_slug) LOOP
    v_counter := v_counter + 1;
    v_slug := v_base || '-' || (floor(random() * 9000 + 1000)::TEXT) || '-' || v_counter;
  END LOOP;

  RETURN v_slug;
END;
$$;

-- ============================================================
-- Increment view count (atomic)
-- ============================================================
CREATE OR REPLACE FUNCTION public.increment_view_count(p_property_id UUID)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE public.properties
  SET view_count = view_count + 1
  WHERE id = p_property_id;
$$;

-- ============================================================
-- Increment analytics event (whatsapp_click | share)
-- ============================================================
CREATE OR REPLACE FUNCTION public.increment_analytics(
  p_property_id UUID,
  p_event_type TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.property_analytics (property_id, whatsapp_clicks, share_count)
  VALUES (p_property_id, 0, 0)
  ON CONFLICT (property_id) DO NOTHING;

  IF p_event_type = 'whatsapp_click' THEN
    UPDATE public.property_analytics
    SET whatsapp_clicks = whatsapp_clicks + 1, updated_at = NOW()
    WHERE property_id = p_property_id;
  ELSIF p_event_type = 'share' THEN
    UPDATE public.property_analytics
    SET share_count = share_count + 1, updated_at = NOW()
    WHERE property_id = p_property_id;
  END IF;
END;
$$;

-- ============================================================
-- Get nearby properties (Haversine — no PostGIS required)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_nearby_properties(
  p_lat NUMERIC,
  p_lng NUMERIC,
  p_radius_km INT DEFAULT 5,
  p_limit INT DEFAULT 8,
  p_exclude_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  distance_km NUMERIC
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    p.id,
    ROUND(
      (6371 * acos(
        LEAST(1.0, GREATEST(-1.0,
          cos(radians(p_lat)) * cos(radians(p.latitude)) *
          cos(radians(p.longitude) - radians(p_lng)) +
          sin(radians(p_lat)) * sin(radians(p.latitude))
        ))
      ))::NUMERIC,
      2
    ) AS distance_km
  FROM public.properties p
  WHERE
    p.latitude IS NOT NULL
    AND p.longitude IS NOT NULL
    AND p.status = 'available'
    AND (p_exclude_id IS NULL OR p.id != p_exclude_id)
  ORDER BY distance_km
  LIMIT p_limit;
$$;

-- ============================================================
-- Get property analytics (views + favorites + appointments + clicks + shares)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_property_analytics(p_property_id UUID)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT jsonb_build_object(
    'total_views', (SELECT view_count FROM public.properties WHERE id = p_property_id),
    'favorites_count', (SELECT COUNT(*) FROM public.favorites WHERE property_id = p_property_id),
    'appointments_count', (SELECT COUNT(*) FROM public.appointments WHERE property_id = p_property_id),
    'whatsapp_clicks', COALESCE((SELECT whatsapp_clicks FROM public.property_analytics WHERE property_id = p_property_id), 0),
    'share_count', COALESCE((SELECT share_count FROM public.property_analytics WHERE property_id = p_property_id), 0),
    'views_last_30_days', (
      SELECT COUNT(*) FROM public.property_views
      WHERE property_id = p_property_id
        AND viewed_at >= NOW() - INTERVAL '30 days'
    )
  );
$$;

-- ============================================================
-- Admin dashboard stats
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT jsonb_build_object(
    'total_properties', (SELECT COUNT(*) FROM public.properties WHERE status != 'draft'),
    'featured_properties', (SELECT COUNT(*) FROM public.properties WHERE is_featured = true),
    'sold_properties', (SELECT COUNT(*) FROM public.properties WHERE status = 'sold'),
    'rented_properties', (SELECT COUNT(*) FROM public.properties WHERE status = 'rented'),
    'available_properties', (SELECT COUNT(*) FROM public.properties WHERE status = 'available'),
    'total_users', (SELECT COUNT(*) FROM public.users WHERE is_active = true),
    'total_appointments', (SELECT COUNT(*) FROM public.appointments),
    'pending_appointments', (SELECT COUNT(*) FROM public.appointments WHERE status = 'pending'),
    'total_views', (SELECT COALESCE(SUM(view_count), 0) FROM public.properties),
    'new_properties_this_month', (
      SELECT COUNT(*) FROM public.properties
      WHERE created_at >= date_trunc('month', NOW())
    ),
    'new_users_this_month', (
      SELECT COUNT(*) FROM public.users
      WHERE created_at >= date_trunc('month', NOW())
    )
  );
$$;

-- ============================================================
-- Views per day for a property (last 30 days)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_property_views_per_day(
  p_property_id UUID,
  p_days INT DEFAULT 30
)
RETURNS TABLE (view_date DATE, view_count BIGINT)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    viewed_at::DATE AS view_date,
    COUNT(*) AS view_count
  FROM public.property_views
  WHERE
    property_id = p_property_id
    AND viewed_at >= NOW() - (p_days || ' days')::INTERVAL
  GROUP BY view_date
  ORDER BY view_date;
$$;

-- ============================================================
-- Most viewed properties (admin)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_most_viewed_properties(p_limit INT DEFAULT 10)
RETURNS TABLE (
  property_id UUID,
  title_ar TEXT,
  slug TEXT,
  view_count INT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT id, title_ar, slug, view_count
  FROM public.properties
  WHERE status != 'draft'
  ORDER BY view_count DESC
  LIMIT p_limit;
$$;

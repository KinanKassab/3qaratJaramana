-- ============================================================
-- Row Level Security Policies
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Helper: get current user's role
-- ============================================================
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT role FROM public.users WHERE id = auth.uid()),
    'anonymous'
  )
$$;

-- ============================================================
-- USERS policies
-- ============================================================
CREATE POLICY "users_select_own"
  ON public.users FOR SELECT
  USING (id = auth.uid() OR auth.user_role() = 'admin');

CREATE POLICY "users_insert_own"
  ON public.users FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "users_update_own"
  ON public.users FOR UPDATE
  USING (id = auth.uid() OR auth.user_role() = 'admin');

-- ============================================================
-- LOCATIONS policies (public read, admin write)
-- ============================================================
CREATE POLICY "locations_select_all"
  ON public.locations FOR SELECT
  USING (is_active = true OR auth.user_role() = 'admin');

CREATE POLICY "locations_insert_admin"
  ON public.locations FOR INSERT
  WITH CHECK (auth.user_role() = 'admin');

CREATE POLICY "locations_update_admin"
  ON public.locations FOR UPDATE
  USING (auth.user_role() = 'admin');

CREATE POLICY "locations_delete_admin"
  ON public.locations FOR DELETE
  USING (auth.user_role() = 'admin');

-- ============================================================
-- CATEGORIES policies (public read, admin write)
-- ============================================================
CREATE POLICY "categories_select_all"
  ON public.categories FOR SELECT
  USING (is_active = true OR auth.user_role() = 'admin');

CREATE POLICY "categories_insert_admin"
  ON public.categories FOR INSERT
  WITH CHECK (auth.user_role() = 'admin');

CREATE POLICY "categories_update_admin"
  ON public.categories FOR UPDATE
  USING (auth.user_role() = 'admin');

CREATE POLICY "categories_delete_admin"
  ON public.categories FOR DELETE
  USING (auth.user_role() = 'admin');

-- ============================================================
-- PROPERTIES policies
-- ============================================================
CREATE POLICY "properties_select_public"
  ON public.properties FOR SELECT
  USING (
    status != 'draft'
    OR agent_id = auth.uid()
    OR auth.user_role() = 'admin'
  );

CREATE POLICY "properties_insert_agent"
  ON public.properties FOR INSERT
  WITH CHECK (
    auth.uid() = agent_id
    AND auth.user_role() IN ('agent', 'admin')
  );

CREATE POLICY "properties_update_agent"
  ON public.properties FOR UPDATE
  USING (
    auth.uid() = agent_id
    OR auth.user_role() = 'admin'
  );

CREATE POLICY "properties_delete_agent"
  ON public.properties FOR DELETE
  USING (
    auth.uid() = agent_id
    OR auth.user_role() = 'admin'
  );

-- ============================================================
-- PROPERTY IMAGES policies
-- ============================================================
CREATE POLICY "property_images_select_public"
  ON public.property_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_id AND (p.status != 'draft' OR p.agent_id = auth.uid())
    )
  );

CREATE POLICY "property_images_insert_agent"
  ON public.property_images FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_id AND (p.agent_id = auth.uid() OR auth.user_role() = 'admin')
    )
  );

CREATE POLICY "property_images_update_agent"
  ON public.property_images FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_id AND (p.agent_id = auth.uid() OR auth.user_role() = 'admin')
    )
  );

CREATE POLICY "property_images_delete_agent"
  ON public.property_images FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_id AND (p.agent_id = auth.uid() OR auth.user_role() = 'admin')
    )
  );

-- ============================================================
-- PROPERTY VIDEOS policies
-- ============================================================
CREATE POLICY "property_videos_select_public"
  ON public.property_videos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_id AND p.status != 'draft'
    )
    OR auth.user_role() IN ('agent', 'admin')
  );

CREATE POLICY "property_videos_insert_agent"
  ON public.property_videos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_id AND (p.agent_id = auth.uid() OR auth.user_role() = 'admin')
    )
  );

CREATE POLICY "property_videos_delete_agent"
  ON public.property_videos FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_id AND (p.agent_id = auth.uid() OR auth.user_role() = 'admin')
    )
  );

-- ============================================================
-- FAVORITES policies
-- ============================================================
CREATE POLICY "favorites_select_own"
  ON public.favorites FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "favorites_insert_own"
  ON public.favorites FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "favorites_delete_own"
  ON public.favorites FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================
-- APPOINTMENTS policies
-- ============================================================
CREATE POLICY "appointments_select"
  ON public.appointments FOR SELECT
  USING (
    user_id = auth.uid()
    OR agent_id = auth.uid()
    OR auth.user_role() = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_id AND p.agent_id = auth.uid()
    )
  );

CREATE POLICY "appointments_insert_auth"
  ON public.appointments FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "appointments_update"
  ON public.appointments FOR UPDATE
  USING (
    user_id = auth.uid()
    OR agent_id = auth.uid()
    OR auth.user_role() = 'admin'
  );

-- ============================================================
-- PROPERTY VIEWS policies (public insert for anonymous tracking)
-- ============================================================
CREATE POLICY "property_views_select_admin"
  ON public.property_views FOR SELECT
  USING (auth.user_role() = 'admin');

CREATE POLICY "property_views_insert_all"
  ON public.property_views FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- NOTIFICATIONS policies
-- ============================================================
CREATE POLICY "notifications_select_own"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid() OR auth.user_role() = 'admin');

CREATE POLICY "notifications_insert_admin"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.user_role() = 'admin');

CREATE POLICY "notifications_update_own"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid());

-- ============================================================
-- PROPERTY ANALYTICS policies (public read, system write)
-- ============================================================
CREATE POLICY "analytics_select_all"
  ON public.property_analytics FOR SELECT
  USING (true);

CREATE POLICY "analytics_insert_all"
  ON public.property_analytics FOR INSERT
  WITH CHECK (true);

CREATE POLICY "analytics_update_all"
  ON public.property_analytics FOR UPDATE
  USING (true);

-- ============================================================
-- SAVED SEARCHES policies
-- ============================================================
CREATE POLICY "saved_searches_select_own"
  ON public.saved_searches FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "saved_searches_insert_own"
  ON public.saved_searches FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "saved_searches_update_own"
  ON public.saved_searches FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "saved_searches_delete_own"
  ON public.saved_searches FOR DELETE
  USING (user_id = auth.uid());

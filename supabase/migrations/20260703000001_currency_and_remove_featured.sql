-- ============================================================
-- Currency support + remove featured-properties feature
-- 1) Listings can be priced in SYP or USD (price filters are
--    currency-specific in the apps).
-- 2) The "featured" concept is removed from the entire system.
-- ============================================================

-- 1) Currency column
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'SYP'
  CHECK (currency IN ('SYP', 'USD'));

CREATE INDEX IF NOT EXISTS idx_properties_currency ON public.properties(currency);

-- 2) Drop the featured flag (its partial index is dropped with it)
DROP INDEX IF EXISTS idx_properties_featured;
ALTER TABLE public.properties DROP COLUMN IF EXISTS is_featured;

-- 3) Dashboard stats without featured_properties
CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT jsonb_build_object(
    'total_properties', (SELECT COUNT(*) FROM public.properties WHERE status != 'draft'),
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

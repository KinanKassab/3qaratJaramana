-- ============================================================
-- Seed Data — عقارات جرمانا
-- The platform is Jaramana-only:
--   Syria (country) > Jaramana (city) > neighborhoods (districts)
-- ============================================================

-- ============================================================
-- CATEGORIES
-- ============================================================
INSERT INTO public.categories (id, name_ar, name_en, slug, icon, sort_order) VALUES
  ('c1000000-0000-4000-8000-000000000001', 'شقق سكنية', 'Apartments', 'apartments', 'building', 1),
  ('c1000000-0000-4000-8000-000000000002', 'فلل وقصور', 'Villas', 'villas', 'home', 2),
  ('c1000000-0000-4000-8000-000000000003', 'بيوت', 'Houses', 'houses', 'house', 3),
  ('c1000000-0000-4000-8000-000000000004', 'أراضي', 'Land', 'land', 'map', 4),
  ('c1000000-0000-4000-8000-000000000005', 'محلات تجارية', 'Commercial', 'commercial', 'store', 5),
  ('c1000000-0000-4000-8000-000000000006', 'مكاتب', 'Offices', 'offices', 'briefcase', 6)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- LOCATIONS: Syria > Jaramana > Neighborhoods
-- ============================================================
INSERT INTO public.locations (id, name_ar, name_en, slug, type, parent_id, latitude, longitude, sort_order) VALUES
  -- Country
  ('a1000000-0000-4000-8000-000000000001', 'سوريا', 'Syria', 'syria', 'country', NULL, 34.8021, 38.9968, 1),

  -- Jaramana city
  ('a1000000-0000-4000-8000-000000000002', 'جرمانا', 'Jaramana', 'jaramana', 'city', 'a1000000-0000-4000-8000-000000000001', 33.4862, 36.3462, 1),

  -- Jaramana neighborhoods
  ('a1000000-0000-4000-8000-000000000011', 'جرمانا البلد', 'Jaramana Old Town', 'jaramana-albalad', 'district', 'a1000000-0000-4000-8000-000000000002', 33.4880, 36.3450, 1),
  ('a1000000-0000-4000-8000-000000000012', 'ساحة السيوف', 'Sahet Al-Siyouf', 'sahet-alsiyouf', 'district', 'a1000000-0000-4000-8000-000000000002', 33.4905, 36.3400, 2),
  ('a1000000-0000-4000-8000-000000000013', 'ساحة الرئيس', 'Sahet Al-Raees', 'sahet-alraees', 'district', 'a1000000-0000-4000-8000-000000000002', 33.4870, 36.3480, 3),
  ('a1000000-0000-4000-8000-000000000014', 'حي الوحدة', 'Al-Wahda', 'al-wahda', 'district', 'a1000000-0000-4000-8000-000000000002', 33.4840, 36.3500, 4),
  ('a1000000-0000-4000-8000-000000000015', 'حي الروضة', 'Al-Rawda', 'al-rawda', 'district', 'a1000000-0000-4000-8000-000000000002', 33.4895, 36.3520, 5),
  ('a1000000-0000-4000-8000-000000000016', 'حي النهضة', 'Al-Nahda', 'al-nahda', 'district', 'a1000000-0000-4000-8000-000000000002', 33.4825, 36.3440, 6),
  ('a1000000-0000-4000-8000-000000000017', 'مساكن جرمانا', 'Masaken Jaramana', 'masaken-jaramana', 'district', 'a1000000-0000-4000-8000-000000000002', 33.4810, 36.3530, 7),
  ('a1000000-0000-4000-8000-000000000018', 'طريق المطار', 'Airport Road', 'airport-road', 'district', 'a1000000-0000-4000-8000-000000000002', 33.4770, 36.3560, 8)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- NOTE: Admin and agent users are created via Supabase Auth dashboard
-- or via the registration flow in the app. Seed data only includes
-- reference data (categories, locations) to avoid auth complexity.
-- ============================================================

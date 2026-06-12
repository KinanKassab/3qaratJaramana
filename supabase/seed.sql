-- ============================================================
-- Seed Data — عقارات جرمانا
-- ============================================================

-- ============================================================
-- CATEGORIES
-- ============================================================
INSERT INTO public.categories (id, name_ar, name_en, slug, icon, sort_order) VALUES
  ('cat-apt-0000-0000-000000000001', 'شقق سكنية', 'Apartments', 'apartments', 'building', 1),
  ('cat-vil-0000-0000-000000000002', 'فلل وقصور', 'Villas', 'villas', 'home', 2),
  ('cat-hou-0000-0000-000000000003', 'بيوت', 'Houses', 'houses', 'house', 3),
  ('cat-lan-0000-0000-000000000004', 'أراضي', 'Land', 'land', 'map', 4),
  ('cat-com-0000-0000-000000000005', 'محلات تجارية', 'Commercial', 'commercial', 'store', 5),
  ('cat-off-0000-0000-000000000006', 'مكاتب', 'Offices', 'offices', 'briefcase', 6)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- LOCATIONS: Syria > Damascus > Districts
-- ============================================================
INSERT INTO public.locations (id, name_ar, name_en, slug, type, parent_id, latitude, longitude, sort_order) VALUES
  -- Country
  ('loc-sy-00000-0000-000000000001', 'سوريا', 'Syria', 'syria', 'country', NULL, 34.8021, 38.9968, 1),

  -- Damascus city
  ('loc-dm-00000-0000-000000000010', 'دمشق', 'Damascus', 'damascus', 'city', 'loc-sy-00000-0000-000000000001', 33.5138, 36.2765, 1),

  -- Rif Dimashq
  ('loc-rd-00000-0000-000000000011', 'ريف دمشق', 'Rif Dimashq', 'rif-dimashq', 'city', 'loc-sy-00000-0000-000000000001', 33.5500, 36.3500, 2),

  -- Damascus districts
  ('loc-jr-00000-0000-000000000020', 'جرمانا', 'Jaramana', 'jaramana', 'district', 'loc-dm-00000-0000-000000000010', 33.4876, 36.3412, 1),
  ('loc-me-00000-0000-000000000021', 'مساكن برزة', 'Masaken Barzeh', 'masaken-barzeh', 'district', 'loc-dm-00000-0000-000000000010', 33.5500, 36.2900, 2),
  ('loc-qa-00000-0000-000000000022', 'قدسيا', 'Qudsaya', 'qudsaya', 'district', 'loc-dm-00000-0000-000000000010', 33.5667, 36.2167, 3),
  ('loc-mz-00000-0000-000000000023', 'المزة', 'Mazzeh', 'mazzeh', 'district', 'loc-dm-00000-0000-000000000010', 33.5000, 36.2333, 4),
  ('loc-kf-00000-0000-000000000024', 'كفرسوسة', 'Kafr Sousa', 'kafr-sousa', 'district', 'loc-dm-00000-0000-000000000010', 33.4833, 36.2667, 5),
  ('loc-mu-00000-0000-000000000025', 'موسى', 'Mousa', 'mousa', 'district', 'loc-dm-00000-0000-000000000010', 33.4950, 36.3000, 6),
  ('loc-ei-00000-0000-000000000026', 'عين ترما', 'Ein Terma', 'ein-terma', 'district', 'loc-dm-00000-0000-000000000010', 33.5100, 36.3600, 7),
  ('loc-do-00000-0000-000000000027', 'دوما', 'Douma', 'douma', 'district', 'loc-rd-00000-0000-000000000011', 33.5706, 36.4006, 1),
  ('loc-ha-00000-0000-000000000028', 'حرستا', 'Harasta', 'harasta', 'district', 'loc-rd-00000-0000-000000000011', 33.5564, 36.3764, 2)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- NOTE: Admin and agent users are created via Supabase Auth dashboard
-- or via the registration flow in the app. Seed data only includes
-- reference data (categories, locations) to avoid auth complexity.
-- ============================================================

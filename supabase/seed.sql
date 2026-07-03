-- ============================================================
-- Seed Data — عقارات جرمانا
-- The platform is Jaramana-only:
--   Jaramana (city) > its real neighborhoods (districts)
-- Mirrors the live database. Idempotent (matches by slug).
-- ============================================================

-- ============================================================
-- CATEGORIES
-- ============================================================
INSERT INTO public.categories (name_ar, name_en, slug, icon, sort_order) VALUES
  ('شقق سكنية', 'Apartments', 'apartments', 'building', 1),
  ('فلل وقصور', 'Villas', 'villas', 'home', 2),
  ('بيوت', 'Houses', 'houses', 'house', 3),
  ('أراضي', 'Land', 'land', 'map', 4),
  ('محلات تجارية', 'Commercial', 'commercial', 'store', 5),
  ('مكاتب', 'Offices', 'offices', 'briefcase', 6)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- LOCATIONS: Jaramana > Neighborhoods
-- ============================================================
INSERT INTO public.locations (name_ar, name_en, slug, type, parent_id, sort_order) VALUES
  ('جرمانا', 'Jaramana', 'jaramana', 'city', NULL, 0)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.locations (name_ar, name_en, slug, type, parent_id, sort_order) VALUES
  ('حارة الجرة', 'Harat Al-Jarra', 'harat-al-jarra', 'district', (SELECT id FROM public.locations WHERE slug = 'jaramana'), 1),
  ('المول', 'Al-Mall', 'al-mall', 'district', (SELECT id FROM public.locations WHERE slug = 'jaramana'), 2),
  ('القوس', 'Al-Qaws', 'al-qaws', 'district', (SELECT id FROM public.locations WHERE slug = 'jaramana'), 3),
  ('القريات', 'Al-Quriyat', 'al-quriyat', 'district', (SELECT id FROM public.locations WHERE slug = 'jaramana'), 4),
  ('النهضة القديمة', 'Al-Nahda Al-Qadima', 'al-nahda-al-qadima', 'district', (SELECT id FROM public.locations WHERE slug = 'jaramana'), 5),
  ('النهضة الجديدة', 'Al-Nahda Al-Jadida', 'al-nahda-al-jadida', 'district', (SELECT id FROM public.locations WHERE slug = 'jaramana'), 6),
  ('شارع الباسل', 'Shara Al-Bassel', 'shara-al-bassel', 'district', (SELECT id FROM public.locations WHERE slug = 'jaramana'), 7),
  ('حي السلام', 'Hay Al-Salam', 'hay-al-salam', 'district', (SELECT id FROM public.locations WHERE slug = 'jaramana'), 8),
  ('ساحة الكرامة', 'Sahat Al-Karama', 'sahat-al-karama', 'district', (SELECT id FROM public.locations WHERE slug = 'jaramana'), 9),
  ('البلدية', 'Al-Baladiya', 'al-baladiya', 'district', (SELECT id FROM public.locations WHERE slug = 'jaramana'), 10),
  ('البيدر', 'Al-Baydar', 'al-baydar', 'district', (SELECT id FROM public.locations WHERE slug = 'jaramana'), 11),
  ('الوحدة', 'Al-Wehda', 'al-wehda', 'district', (SELECT id FROM public.locations WHERE slug = 'jaramana'), 12),
  ('الروضة', 'Al-Rawda', 'al-rawda', 'district', (SELECT id FROM public.locations WHERE slug = 'jaramana'), 13),
  ('كرم صمادي', 'Karm Samadi', 'karm-samadi', 'district', (SELECT id FROM public.locations WHERE slug = 'jaramana'), 14),
  ('الأساس الغربي', 'Al-Asas Al-Gharbi', 'al-asas-al-gharbi', 'district', (SELECT id FROM public.locations WHERE slug = 'jaramana'), 15),
  ('الأساس الشرقي', 'Al-Asas Al-Sharqi', 'al-asas-al-sharqi', 'district', (SELECT id FROM public.locations WHERE slug = 'jaramana'), 16),
  ('الخضر', 'Al-Khadr', 'al-khadr', 'district', (SELECT id FROM public.locations WHERE slug = 'jaramana'), 17),
  ('الروضة مزارع', 'Al-Rawda Mazare', 'al-rawda-mazare', 'district', (SELECT id FROM public.locations WHERE slug = 'jaramana'), 18),
  ('دف الصخر', 'Daff Al-Sakhr', 'daff-al-sakhr', 'district', (SELECT id FROM public.locations WHERE slug = 'jaramana'), 19),
  ('الجمعيات', 'Al-Jamiyyat', 'al-jamiyyat', 'district', (SELECT id FROM public.locations WHERE slug = 'jaramana'), 20),
  ('الحمصي', 'Al-Homsi', 'al-homsi', 'district', (SELECT id FROM public.locations WHERE slug = 'jaramana'), 21),
  ('أوسكار', 'Oscar', 'oscar', 'district', (SELECT id FROM public.locations WHERE slug = 'jaramana'), 22),
  ('الجناين', 'Al-Janayin', 'al-janayin', 'district', (SELECT id FROM public.locations WHERE slug = 'jaramana'), 23),
  ('توسع الجناين', 'Tawassu Al-Janayin', 'tawassu-al-janayin', 'district', (SELECT id FROM public.locations WHERE slug = 'jaramana'), 24),
  ('توسع الحمصي', 'Tawassu Al-Homsi', 'tawassu-al-homsi', 'district', (SELECT id FROM public.locations WHERE slug = 'jaramana'), 25),
  ('النسيم', 'Al-Nasim', 'al-nasim', 'district', (SELECT id FROM public.locations WHERE slug = 'jaramana'), 26),
  ('التربة', 'Al-Turba', 'al-turba', 'district', (SELECT id FROM public.locations WHERE slug = 'jaramana'), 27)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- NOTE: Admin and agent users are created via Supabase Auth dashboard
-- or via the registration flow in the app. Seed data only includes
-- reference data (categories, locations) to avoid auth complexity.
-- ============================================================

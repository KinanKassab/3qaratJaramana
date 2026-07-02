-- ============================================================
-- Jaramana-only restructure — عقارات جرمانا
-- The platform serves Jaramana exclusively. Location tree becomes:
--   Syria (country) > Jaramana (city) > neighborhoods (districts)
-- Old Damascus / Rif Dimashq locations are deactivated (not deleted,
-- to preserve any historical references).
-- ============================================================

-- 1) Ensure the country exists
INSERT INTO public.locations (id, name_ar, name_en, slug, type, parent_id, latitude, longitude, sort_order)
VALUES ('a1000000-0000-4000-8000-000000000001', 'سوريا', 'Syria', 'syria', 'country', NULL, 34.8021, 38.9968, 1)
ON CONFLICT (slug) DO NOTHING;

-- 2) Jaramana becomes a city directly under Syria (promoted from district if it existed)
INSERT INTO public.locations (id, name_ar, name_en, slug, type, parent_id, latitude, longitude, sort_order, is_active)
VALUES (
  'a1000000-0000-4000-8000-000000000002', 'جرمانا', 'Jaramana', 'jaramana', 'city',
  (SELECT id FROM public.locations WHERE slug = 'syria'),
  33.4862, 36.3462, 1, true
)
ON CONFLICT (slug) DO UPDATE SET
  type = 'city',
  parent_id = (SELECT id FROM public.locations WHERE slug = 'syria'),
  is_active = true,
  sort_order = 1;

-- 3) Jaramana neighborhoods (districts)
INSERT INTO public.locations (id, name_ar, name_en, slug, type, parent_id, latitude, longitude, sort_order, is_active)
VALUES
  ('a1000000-0000-4000-8000-000000000011', 'جرمانا البلد', 'Jaramana Old Town', 'jaramana-albalad', 'district', (SELECT id FROM public.locations WHERE slug = 'jaramana'), 33.4880, 36.3450, 1, true),
  ('a1000000-0000-4000-8000-000000000012', 'ساحة السيوف', 'Sahet Al-Siyouf', 'sahet-alsiyouf', 'district', (SELECT id FROM public.locations WHERE slug = 'jaramana'), 33.4905, 36.3400, 2, true),
  ('a1000000-0000-4000-8000-000000000013', 'ساحة الرئيس', 'Sahet Al-Raees', 'sahet-alraees', 'district', (SELECT id FROM public.locations WHERE slug = 'jaramana'), 33.4870, 36.3480, 3, true),
  ('a1000000-0000-4000-8000-000000000014', 'حي الوحدة', 'Al-Wahda', 'al-wahda', 'district', (SELECT id FROM public.locations WHERE slug = 'jaramana'), 33.4840, 36.3500, 4, true),
  ('a1000000-0000-4000-8000-000000000015', 'حي الروضة', 'Al-Rawda', 'al-rawda', 'district', (SELECT id FROM public.locations WHERE slug = 'jaramana'), 33.4895, 36.3520, 5, true),
  ('a1000000-0000-4000-8000-000000000016', 'حي النهضة', 'Al-Nahda', 'al-nahda', 'district', (SELECT id FROM public.locations WHERE slug = 'jaramana'), 33.4825, 36.3440, 6, true),
  ('a1000000-0000-4000-8000-000000000017', 'مساكن جرمانا', 'Masaken Jaramana', 'masaken-jaramana', 'district', (SELECT id FROM public.locations WHERE slug = 'jaramana'), 33.4810, 36.3530, 7, true),
  ('a1000000-0000-4000-8000-000000000018', 'طريق المطار', 'Airport Road', 'airport-road', 'district', (SELECT id FROM public.locations WHERE slug = 'jaramana'), 33.4770, 36.3560, 8, true)
ON CONFLICT (slug) DO UPDATE SET
  type = 'district',
  parent_id = EXCLUDED.parent_id,
  is_active = true,
  sort_order = EXCLUDED.sort_order;

-- 4) Remap any property pointing outside Jaramana's tree to Jaramana city
UPDATE public.properties
SET location_id = (SELECT id FROM public.locations WHERE slug = 'jaramana')
WHERE location_id IS NOT NULL
  AND location_id NOT IN (
    SELECT id FROM public.locations
    WHERE slug = 'jaramana'
       OR parent_id = (SELECT id FROM public.locations WHERE slug = 'jaramana')
  );

-- 5) Deactivate every location outside Jaramana's tree (country stays)
UPDATE public.locations
SET is_active = false
WHERE type <> 'country'
  AND slug <> 'jaramana'
  AND parent_id IS DISTINCT FROM (SELECT id FROM public.locations WHERE slug = 'jaramana');

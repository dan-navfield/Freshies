-- ============================================
-- FRESHIES DATABASE SCHEMA + SEED DATA
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable pgcrypto extension for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enable pgvector extension for vector embeddings (optional, for semantic search)
CREATE EXTENSION IF NOT EXISTS "vector";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role_hint TEXT CHECK (role_hint IN ('parent', 'child')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Households
CREATE TABLE IF NOT EXISTS public.households (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_by UUID REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Household members (many-to-many)
CREATE TABLE IF NOT EXISTS public.household_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID REFERENCES public.households(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('parent', 'child')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'removed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(household_id, user_id)
);

-- Child profiles (additional data for children)
CREATE TABLE IF NOT EXISTS public.child_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID REFERENCES public.households(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  display_name TEXT,
  birthdate DATE,
  skin_type TEXT CHECK (skin_type IN ('normal', 'dry', 'oily', 'combination', 'sensitive')),
  sensitivities TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Brands
CREATE TABLE IF NOT EXISTS public.brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  category TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Barcodes (multiple per product)
CREATE TABLE IF NOT EXISTS public.barcodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  ean_upc TEXT UNIQUE NOT NULL,
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ingredients master list
CREATE TABLE IF NOT EXISTS public.ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inci_name TEXT UNIQUE NOT NULL,
  common_name TEXT,
  family TEXT,
  aliases TEXT[],
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product ingredients (junction with order)
CREATE TABLE IF NOT EXISTS public.product_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  ingredient_id UUID REFERENCES public.ingredients(id) ON DELETE CASCADE,
  position INTEGER,
  concentration_guess TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, ingredient_id)
);

-- Scans (user scan history)
CREATE TABLE IF NOT EXISTS public.scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_profile_id UUID REFERENCES public.child_profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  raw_ocr_text TEXT,
  raw_ocr_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Approvals (parent approval/rejection of scans)
CREATE TABLE IF NOT EXISTS public.approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID REFERENCES public.scans(id) ON DELETE CASCADE,
  parent_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('approved', 'rejected')),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(scan_id)
);

-- Rules (ingredient safety rules by age/skin type)
CREATE TABLE IF NOT EXISTS public.rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_family TEXT NOT NULL,
  age_min INTEGER,
  age_max INTEGER,
  skin_type_flags TEXT[],
  threshold_concentration TEXT,
  rating TEXT NOT NULL CHECK (rating IN ('safe', 'use_with_care', 'avoid')),
  reason_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Decisions (AI evaluation results)
CREATE TABLE IF NOT EXISTS public.decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID REFERENCES public.scans(id) ON DELETE CASCADE,
  rating TEXT NOT NULL CHECK (rating IN ('safe', 'use_with_care', 'avoid')),
  reason_codes TEXT[],
  notes_parent TEXT,
  notes_teen TEXT,
  json_blob JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(scan_id)
);

-- Routines (AM/PM skincare routines)
CREATE TABLE IF NOT EXISTS public.routines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_profile_id UUID REFERENCES public.child_profiles(id) ON DELETE CASCADE,
  period TEXT NOT NULL CHECK (period IN ('AM', 'PM')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(child_profile_id, period)
);

-- Routine items (products in a routine)
CREATE TABLE IF NOT EXISTS public.routine_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id UUID REFERENCES public.routines(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(routine_id, product_id)
);

-- Lessons (educational content)
CREATE TABLE IF NOT EXISTS public.lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  body_md TEXT NOT NULL,
  tags TEXT[],
  age_range TEXT,
  image_url TEXT,
  vector_embedding vector(1536),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lesson progress (user completion tracking)
CREATE TABLE IF NOT EXISTS public.lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'started' CHECK (status IN ('started', 'completed')),
  last_opened_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, lesson_id)
);

-- Achievements
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  icon_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User achievements (awarded badges)
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES public.achievements(id) ON DELETE CASCADE,
  awarded_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.child_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barcodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routine_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Users: can read/update own record
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Households: members can read their households
CREATE POLICY "Members can view their households" ON public.households FOR SELECT
  USING (id IN (SELECT household_id FROM public.household_members WHERE user_id = auth.uid()));

-- Household members: can view members of their households
CREATE POLICY "Members can view household members" ON public.household_members FOR SELECT
  USING (household_id IN (SELECT household_id FROM public.household_members WHERE user_id = auth.uid()));

-- Child profiles: household members can view
CREATE POLICY "Household members can view child profiles" ON public.child_profiles FOR SELECT
  USING (household_id IN (SELECT household_id FROM public.household_members WHERE user_id = auth.uid()));

-- Products, brands, ingredients: public read
CREATE POLICY "Anyone can view brands" ON public.brands FOR SELECT USING (true);
CREATE POLICY "Anyone can view products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Anyone can view barcodes" ON public.barcodes FOR SELECT USING (true);
CREATE POLICY "Anyone can view ingredients" ON public.ingredients FOR SELECT USING (true);
CREATE POLICY "Anyone can view product ingredients" ON public.product_ingredients FOR SELECT USING (true);

-- Rules: public read
CREATE POLICY "Anyone can view rules" ON public.rules FOR SELECT USING (true);

-- Scans: child can view own, parents can view household children's scans
CREATE POLICY "Users can view own scans" ON public.scans FOR SELECT
  USING (child_profile_id IN (SELECT id FROM public.child_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Parents can view household scans" ON public.scans FOR SELECT
  USING (child_profile_id IN (
    SELECT cp.id FROM public.child_profiles cp
    JOIN public.household_members hm ON cp.household_id = hm.household_id
    WHERE hm.user_id = auth.uid() AND hm.role = 'parent'
  ));

-- Approvals: parents can create/view
CREATE POLICY "Parents can view approvals" ON public.approvals FOR SELECT
  USING (parent_user_id = auth.uid());

-- Decisions: users can view decisions for their scans
CREATE POLICY "Users can view decisions for their scans" ON public.decisions FOR SELECT
  USING (scan_id IN (SELECT id FROM public.scans WHERE child_profile_id IN (
    SELECT id FROM public.child_profiles WHERE user_id = auth.uid()
  )));

-- Routines: users can view/manage own routines
CREATE POLICY "Users can view own routines" ON public.routines FOR SELECT
  USING (child_profile_id IN (SELECT id FROM public.child_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can view own routine items" ON public.routine_items FOR SELECT
  USING (routine_id IN (
    SELECT r.id FROM public.routines r
    JOIN public.child_profiles cp ON r.child_profile_id = cp.id
    WHERE cp.user_id = auth.uid()
  ));

-- Lessons: public read
CREATE POLICY "Anyone can view lessons" ON public.lessons FOR SELECT USING (true);

-- Lesson progress: users can view/update own progress
CREATE POLICY "Users can view own lesson progress" ON public.lesson_progress FOR SELECT
  USING (user_id = auth.uid());

-- Achievements: public read
CREATE POLICY "Anyone can view achievements" ON public.achievements FOR SELECT USING (true);

-- User achievements: users can view own achievements
CREATE POLICY "Users can view own achievements" ON public.user_achievements FOR SELECT
  USING (user_id = auth.uid());

-- ============================================
-- SEED DATA
-- ============================================

-- Seed ingredients (sample dataset)
INSERT INTO public.ingredients (inci_name, common_name, family, description) VALUES
  ('Retinol', 'Retinol', 'retinoid', 'Vitamin A derivative that promotes cell turnover'),
  ('Retinyl Palmitate', 'Retinyl Palmitate', 'retinoid', 'Milder form of vitamin A'),
  ('Glycolic Acid', 'Glycolic Acid', 'aha', 'Alpha hydroxy acid that exfoliates skin'),
  ('Lactic Acid', 'Lactic Acid', 'aha', 'Gentle AHA that hydrates and exfoliates'),
  ('Salicylic Acid', 'Salicylic Acid', 'bha', 'Beta hydroxy acid that unclogs pores'),
  ('Niacinamide', 'Niacinamide', 'vitamin', 'Vitamin B3 that calms and brightens skin'),
  ('Hyaluronic Acid', 'Hyaluronic Acid', 'humectant', 'Hydrating molecule that holds water'),
  ('Ceramides', 'Ceramides', 'lipid', 'Skin barrier lipids that lock in moisture'),
  ('Parfum', 'Fragrance', 'fragrance', 'Synthetic or natural scent'),
  ('Alcohol Denat.', 'Denatured Alcohol', 'alcohol', 'Drying alcohol that can irritate'),
  ('Cetyl Alcohol', 'Cetyl Alcohol', 'fatty_alcohol', 'Moisturizing fatty alcohol'),
  ('Limonene', 'Limonene', 'essential_oil', 'Citrus-derived fragrance component'),
  ('Benzoyl Peroxide', 'Benzoyl Peroxide', 'acne_active', 'Antibacterial acne treatment'),
  ('Zinc Oxide', 'Zinc Oxide', 'sunscreen', 'Physical sunscreen ingredient'),
  ('Octinoxate', 'Octinoxate', 'sunscreen', 'Chemical sunscreen ingredient'),
  ('Glycerin', 'Glycerin', 'humectant', 'Hydrating and skin-softening ingredient'),
  ('Squalane', 'Squalane', 'emollient', 'Lightweight moisturizing oil'),
  ('Panthenol', 'Panthenol', 'vitamin', 'Pro-vitamin B5 that soothes skin'),
  ('Tocopherol', 'Vitamin E', 'antioxidant', 'Antioxidant that protects skin'),
  ('Ascorbic Acid', 'Vitamin C', 'antioxidant', 'Brightening antioxidant'),
  ('Petrolatum', 'Petrolatum', 'emollient', 'Occlusive moisturizer that seals in hydration')
ON CONFLICT (inci_name) DO NOTHING;

-- Seed rules (age-based safety guidelines)
INSERT INTO public.rules (ingredient_family, age_min, age_max, rating, reason_code) VALUES
  ('retinoid', NULL, 15, 'avoid', 'AGE_BELOW_THRESHOLD'),
  ('retinoid', 16, NULL, 'use_with_care', 'STRONG_ACTIVE'),
  ('aha', NULL, 13, 'avoid', 'AGE_BELOW_THRESHOLD'),
  ('aha', 14, 17, 'use_with_care', 'EXFOLIANT_CAUTION'),
  ('aha', 18, NULL, 'safe', NULL),
  ('bha', NULL, 13, 'use_with_care', 'EXFOLIANT_CAUTION'),
  ('bha', 14, NULL, 'safe', NULL),
  ('fragrance', NULL, NULL, 'use_with_care', 'POTENTIAL_IRRITANT'),
  ('alcohol', NULL, NULL, 'use_with_care', 'DRYING_INGREDIENT'),
  ('fatty_alcohol', NULL, NULL, 'safe', NULL),
  ('essential_oil', NULL, NULL, 'use_with_care', 'POTENTIAL_IRRITANT'),
  ('vitamin', NULL, NULL, 'safe', NULL),
  ('humectant', NULL, NULL, 'safe', NULL),
  ('lipid', NULL, NULL, 'safe', NULL),
  ('emollient', NULL, NULL, 'safe', NULL),
  ('antioxidant', NULL, NULL, 'safe', NULL),
  ('sunscreen', NULL, NULL, 'safe', NULL),
  ('acne_active', NULL, 13, 'use_with_care', 'STRONG_ACTIVE'),
  ('acne_active', 14, NULL, 'safe', NULL);

-- Seed sample brands
INSERT INTO public.brands (name) VALUES
  ('CeraVe'),
  ('The Ordinary'),
  ('Neutrogena'),
  ('La Roche-Posay'),
  ('Cetaphil')
ON CONFLICT (name) DO NOTHING;

-- Seed sample products
INSERT INTO public.products (brand_id, name, category) VALUES
  ((SELECT id FROM public.brands WHERE name = 'CeraVe'), 'Hydrating Facial Cleanser', 'cleanser'),
  ((SELECT id FROM public.brands WHERE name = 'CeraVe'), 'Moisturizing Cream', 'moisturizer'),
  ((SELECT id FROM public.brands WHERE name = 'The Ordinary'), 'Niacinamide 10% + Zinc 1%', 'serum'),
  ((SELECT id FROM public.brands WHERE name = 'Neutrogena'), 'Hydro Boost Water Gel', 'moisturizer'),
  ((SELECT id FROM public.brands WHERE name = 'La Roche-Posay'), 'Anthelios Mineral Sunscreen SPF 50', 'sunscreen');

-- Link ingredients to products
INSERT INTO public.product_ingredients (product_id, ingredient_id, position) VALUES
  ((SELECT id FROM public.products WHERE name = 'Hydrating Facial Cleanser'), 
   (SELECT id FROM public.ingredients WHERE inci_name = 'Ceramides'), 1),
  ((SELECT id FROM public.products WHERE name = 'Hydrating Facial Cleanser'), 
   (SELECT id FROM public.ingredients WHERE inci_name = 'Hyaluronic Acid'), 2),
  ((SELECT id FROM public.products WHERE name = 'Hydrating Facial Cleanser'), 
   (SELECT id FROM public.ingredients WHERE inci_name = 'Glycerin'), 3),
  ((SELECT id FROM public.products WHERE name = 'Moisturizing Cream'), 
   (SELECT id FROM public.ingredients WHERE inci_name = 'Ceramides'), 1),
  ((SELECT id FROM public.products WHERE name = 'Moisturizing Cream'), 
   (SELECT id FROM public.ingredients WHERE inci_name = 'Hyaluronic Acid'), 2),
  ((SELECT id FROM public.products WHERE name = 'Moisturizing Cream'), 
   (SELECT id FROM public.ingredients WHERE inci_name = 'Petrolatum'), 3),
  ((SELECT id FROM public.products WHERE name = 'Niacinamide 10% + Zinc 1%'), 
   (SELECT id FROM public.ingredients WHERE inci_name = 'Niacinamide'), 1),
  ((SELECT id FROM public.products WHERE name = 'Hydro Boost Water Gel'), 
   (SELECT id FROM public.ingredients WHERE inci_name = 'Hyaluronic Acid'), 1),
  ((SELECT id FROM public.products WHERE name = 'Hydro Boost Water Gel'), 
   (SELECT id FROM public.ingredients WHERE inci_name = 'Glycerin'), 2),
  ((SELECT id FROM public.products WHERE name = 'Anthelios Mineral Sunscreen SPF 50'), 
   (SELECT id FROM public.ingredients WHERE inci_name = 'Zinc Oxide'), 1)
ON CONFLICT (product_id, ingredient_id) DO NOTHING;

-- Seed achievements
INSERT INTO public.achievements (code, title, description, icon_name) VALUES
  ('first_scan', 'First Scan', 'Scanned your first product', 'scan'),
  ('streak_7', '7-Day Streak', 'Completed your routine for 7 days straight', 'flame'),
  ('lesson_complete_5', 'Knowledge Seeker', 'Completed 5 Glow Cards', 'book-open'),
  ('safe_choice', 'Safe Choice', 'Found a product perfect for your age', 'shield-check')
ON CONFLICT (code) DO NOTHING;

-- Seed lessons
INSERT INTO public.lessons (slug, title, body_md, tags, age_range) VALUES
  ('what-is-spf', 'What is SPF?', '# What is SPF?

SPF stands for Sun Protection Factor. It tells you how well a sunscreen protects your skin from UVB rays—the kind that cause sunburn.

## Why it matters
- Protects against skin damage
- Prevents premature aging
- Reduces skin cancer risk

## How to use it
Apply sunscreen every morning, even on cloudy days!', ARRAY['basics', 'sunscreen'], '11-17'),
  
  ('why-hydration-matters', 'Why Hydration Matters', '# Why Hydration Matters

Even if your skin is oily, it still needs moisture! Hydration keeps your skin healthy and balanced.

## Signs of dehydrated skin
- Tight feeling
- Dullness
- Fine lines

## Best hydrating ingredients
- Hyaluronic Acid
- Glycerin
- Ceramides', ARRAY['hydration', 'ingredients'], '11-17'),
  
  ('gentle-cleansing-101', 'Gentle Cleansing 101', '# Gentle Cleansing 101

Cleansing removes dirt and oil, but harsh cleansers can strip your skin barrier.

## How to cleanse properly
1. Use lukewarm water
2. Gentle, circular motions
3. Pat dry (don''t rub!)

## Look for these ingredients
- Ceramides
- Glycerin
- Avoid harsh sulfates', ARRAY['cleansing', 'basics'], '11-17')
ON CONFLICT (slug) DO NOTHING;

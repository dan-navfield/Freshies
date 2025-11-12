-- Enable pgcrypto extension for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enable pgvector extension for vector embeddings (optional, for semantic search)
CREATE EXTENSION IF NOT EXISTS "vector";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role_hint TEXT CHECK (role_hint IN ('parent', 'child')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Households
CREATE TABLE public.households (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_by UUID REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Household members (many-to-many)
CREATE TABLE public.household_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID REFERENCES public.households(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('parent', 'child')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'removed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(household_id, user_id)
);

-- Child profiles (additional data for children)
CREATE TABLE public.child_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID REFERENCES public.households(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  display_name TEXT,
  birthdate DATE,
  skin_type TEXT CHECK (skin_type IN ('normal', 'dry', 'oily', 'combination', 'sensitive')),
  sensitivities TEXT[], -- array of sensitivity tags
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Brands
CREATE TABLE public.brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  category TEXT, -- e.g., 'cleanser', 'moisturizer', 'serum'
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Barcodes (multiple per product)
CREATE TABLE public.barcodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  ean_upc TEXT UNIQUE NOT NULL,
  source TEXT, -- 'manual', 'openfoodfacts', etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ingredients master list
CREATE TABLE public.ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inci_name TEXT UNIQUE NOT NULL, -- standardized INCI name
  common_name TEXT,
  family TEXT, -- 'retinoid', 'aha', 'bha', 'fragrance', 'alcohol', etc.
  aliases TEXT[], -- alternative names
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product ingredients (junction with order)
CREATE TABLE public.product_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  ingredient_id UUID REFERENCES public.ingredients(id) ON DELETE CASCADE,
  position INTEGER, -- order in ingredient list (1 = first)
  concentration_guess TEXT, -- 'high', 'medium', 'low', or percentage if known
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, ingredient_id)
);

-- Scans (user scan history)
CREATE TABLE public.scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_profile_id UUID REFERENCES public.child_profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  raw_ocr_text TEXT, -- if OCR was used
  raw_ocr_image_url TEXT, -- stored in Supabase Storage
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Approvals (parent approval/rejection of scans)
CREATE TABLE public.approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID REFERENCES public.scans(id) ON DELETE CASCADE,
  parent_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('approved', 'rejected')),
  note TEXT, -- e.g., "OK once per week"
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(scan_id) -- one approval per scan
);

-- Rules (ingredient safety rules by age/skin type)
CREATE TABLE public.rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_family TEXT NOT NULL,
  age_min INTEGER, -- minimum age (null = no restriction)
  age_max INTEGER, -- maximum age (null = no restriction)
  skin_type_flags TEXT[], -- applicable skin types, null = all
  threshold_concentration TEXT, -- 'any', 'low', 'medium', 'high'
  rating TEXT NOT NULL CHECK (rating IN ('safe', 'use_with_care', 'avoid')),
  reason_code TEXT, -- e.g., 'AGE_BELOW_THRESHOLD', 'HIGH_FRAGRANCE'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Decisions (cached evaluation results)
CREATE TABLE public.decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID REFERENCES public.scans(id) ON DELETE CASCADE,
  rating TEXT NOT NULL CHECK (rating IN ('safe', 'use_with_care', 'avoid')),
  reason_codes TEXT[], -- array of reason codes
  notes_parent TEXT, -- scientific explanation
  notes_teen TEXT, -- friendly explanation
  json_blob JSONB, -- full evaluation details
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(scan_id)
);

-- Routines (AM/PM routines per child)
CREATE TABLE public.routines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_profile_id UUID REFERENCES public.child_profiles(id) ON DELETE CASCADE,
  period TEXT NOT NULL CHECK (period IN ('AM', 'PM')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(child_profile_id, period)
);

-- Routine items (products in a routine)
CREATE TABLE public.routine_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id UUID REFERENCES public.routines(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(routine_id, product_id)
);

-- Lessons (educational content)
CREATE TABLE public.lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  body_md TEXT NOT NULL, -- markdown content
  tags TEXT[],
  age_range TEXT, -- e.g., '11-13', '14-17'
  image_url TEXT,
  vector_embedding vector(1536), -- for semantic search (pgvector)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lesson progress (user completion tracking)
CREATE TABLE public.lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'started' CHECK (status IN ('started', 'completed')),
  last_opened_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, lesson_id)
);

-- Achievements
CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL, -- e.g., 'first_scan', 'streak_7'
  title TEXT NOT NULL,
  description TEXT,
  icon_name TEXT, -- Lucide icon name
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User achievements (awarded badges)
CREATE TABLE public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES public.achievements(id) ON DELETE CASCADE,
  awarded_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Enable Row Level Security on all tables
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

-- RLS Policies

-- Users: can read/update own record
CREATE POLICY "Users can view own record" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own record" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Households: members can read their households
CREATE POLICY "Household members can view their households" ON public.households
  FOR SELECT USING (
    id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid()
    )
  );

-- Household members: can view members in their household
CREATE POLICY "Members can view household members" ON public.household_members
  FOR SELECT USING (
    household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid()
    )
  );

-- Child profiles: parents can view all children in household, children can view own
CREATE POLICY "View child profiles in household" ON public.child_profiles
  FOR SELECT USING (
    household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid()
    )
  );

-- Scans: children can view/insert own scans, parents can view all household scans
CREATE POLICY "Children can insert own scans" ON public.scans
  FOR INSERT WITH CHECK (
    child_profile_id IN (
      SELECT id FROM public.child_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "View scans in household" ON public.scans
  FOR SELECT USING (
    child_profile_id IN (
      SELECT cp.id FROM public.child_profiles cp
      JOIN public.household_members hm ON cp.household_id = hm.household_id
      WHERE hm.user_id = auth.uid()
    )
  );

-- Approvals: parents can insert/view approvals for household scans
CREATE POLICY "Parents can approve scans" ON public.approvals
  FOR INSERT WITH CHECK (
    scan_id IN (
      SELECT s.id FROM public.scans s
      JOIN public.child_profiles cp ON s.child_profile_id = cp.id
      JOIN public.household_members hm ON cp.household_id = hm.household_id
      WHERE hm.user_id = auth.uid() AND hm.role = 'parent'
    )
  );

CREATE POLICY "View approvals in household" ON public.approvals
  FOR SELECT USING (
    scan_id IN (
      SELECT s.id FROM public.scans s
      JOIN public.child_profiles cp ON s.child_profile_id = cp.id
      JOIN public.household_members hm ON cp.household_id = hm.household_id
      WHERE hm.user_id = auth.uid()
    )
  );

-- Routines: children can manage own routines, parents can view
CREATE POLICY "Manage own routines" ON public.routines
  FOR ALL USING (
    child_profile_id IN (
      SELECT id FROM public.child_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Parents can view household routines" ON public.routines
  FOR SELECT USING (
    child_profile_id IN (
      SELECT cp.id FROM public.child_profiles cp
      JOIN public.household_members hm ON cp.household_id = hm.household_id
      WHERE hm.user_id = auth.uid() AND hm.role = 'parent'
    )
  );

-- Routine items: follow routine policy
CREATE POLICY "Manage own routine items" ON public.routine_items
  FOR ALL USING (
    routine_id IN (
      SELECT r.id FROM public.routines r
      JOIN public.child_profiles cp ON r.child_profile_id = cp.id
      WHERE cp.user_id = auth.uid()
    )
  );

-- Lessons: public read
CREATE POLICY "Lessons are publicly readable" ON public.lessons
  FOR SELECT USING (true);

-- Lesson progress: users can manage own progress
CREATE POLICY "Manage own lesson progress" ON public.lesson_progress
  FOR ALL USING (auth.uid() = user_id);

-- Achievements: public read
CREATE POLICY "Achievements are publicly readable" ON public.achievements
  FOR SELECT USING (true);

-- User achievements: users can view own achievements
CREATE POLICY "View own achievements" ON public.user_achievements
  FOR SELECT USING (auth.uid() = user_id);

-- Public read policies for reference data
CREATE POLICY "Brands are publicly readable" ON public.brands FOR SELECT USING (true);
CREATE POLICY "Products are publicly readable" ON public.products FOR SELECT USING (true);
CREATE POLICY "Barcodes are publicly readable" ON public.barcodes FOR SELECT USING (true);
CREATE POLICY "Ingredients are publicly readable" ON public.ingredients FOR SELECT USING (true);
CREATE POLICY "Product ingredients are publicly readable" ON public.product_ingredients FOR SELECT USING (true);
CREATE POLICY "Rules are publicly readable" ON public.rules FOR SELECT USING (true);
CREATE POLICY "Decisions are readable in household" ON public.decisions
  FOR SELECT USING (
    scan_id IN (
      SELECT s.id FROM public.scans s
      JOIN public.child_profiles cp ON s.child_profile_id = cp.id
      JOIN public.household_members hm ON cp.household_id = hm.household_id
      WHERE hm.user_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX idx_household_members_user ON public.household_members(user_id);
CREATE INDEX idx_household_members_household ON public.household_members(household_id);
CREATE INDEX idx_child_profiles_user ON public.child_profiles(user_id);
CREATE INDEX idx_scans_child_profile ON public.scans(child_profile_id);
CREATE INDEX idx_scans_product ON public.scans(product_id);
CREATE INDEX idx_approvals_scan ON public.approvals(scan_id);
CREATE INDEX idx_product_ingredients_product ON public.product_ingredients(product_id);
CREATE INDEX idx_product_ingredients_ingredient ON public.product_ingredients(ingredient_id);
CREATE INDEX idx_routines_child_profile ON public.routines(child_profile_id);
CREATE INDEX idx_routine_items_routine ON public.routine_items(routine_id);
CREATE INDEX idx_lesson_progress_user ON public.lesson_progress(user_id);
CREATE INDEX idx_user_achievements_user ON public.user_achievements(user_id);

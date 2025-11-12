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
  ('Petrolatum', 'Petrolatum', 'emollient', 'Occlusive moisturizer that seals in hydration');

-- Seed rules (age-based safety guidelines)
INSERT INTO public.rules (ingredient_family, age_min, age_max, rating, reason_code) VALUES
  -- Retinoids: avoid under 16
  ('retinoid', NULL, 15, 'avoid', 'AGE_BELOW_THRESHOLD'),
  ('retinoid', 16, NULL, 'use_with_care', 'STRONG_ACTIVE'),
  
  -- AHAs: limited use under 14, careful 14-17
  ('aha', NULL, 13, 'avoid', 'AGE_BELOW_THRESHOLD'),
  ('aha', 14, 17, 'use_with_care', 'EXFOLIANT_CAUTION'),
  ('aha', 18, NULL, 'safe', NULL),
  
  -- BHAs: careful under 14
  ('bha', NULL, 13, 'use_with_care', 'EXFOLIANT_CAUTION'),
  ('bha', 14, NULL, 'safe', NULL),
  
  -- Fragrance: caution for sensitive skin
  ('fragrance', NULL, NULL, 'use_with_care', 'POTENTIAL_IRRITANT'),
  
  -- Drying alcohols: caution for dry/sensitive
  ('alcohol', NULL, NULL, 'use_with_care', 'DRYING_INGREDIENT'),
  
  -- Fatty alcohols: safe
  ('fatty_alcohol', NULL, NULL, 'safe', NULL),
  
  -- Essential oils: caution
  ('essential_oil', NULL, NULL, 'use_with_care', 'POTENTIAL_IRRITANT'),
  
  -- Vitamins and hydrators: generally safe
  ('vitamin', NULL, NULL, 'safe', NULL),
  ('humectant', NULL, NULL, 'safe', NULL),
  ('lipid', NULL, NULL, 'safe', NULL),
  ('emollient', NULL, NULL, 'safe', NULL),
  ('antioxidant', NULL, NULL, 'safe', NULL),
  
  -- Sunscreen: safe and recommended
  ('sunscreen', NULL, NULL, 'safe', NULL),
  
  -- Acne actives: use with care
  ('acne_active', NULL, 13, 'use_with_care', 'STRONG_ACTIVE'),
  ('acne_active', 14, NULL, 'safe', NULL);

-- Seed sample brands
INSERT INTO public.brands (name) VALUES
  ('CeraVe'),
  ('The Ordinary'),
  ('Neutrogena'),
  ('La Roche-Posay'),
  ('Cetaphil');

-- Seed sample products
INSERT INTO public.products (brand_id, name, category) VALUES
  ((SELECT id FROM public.brands WHERE name = 'CeraVe'), 'Hydrating Facial Cleanser', 'cleanser'),
  ((SELECT id FROM public.brands WHERE name = 'CeraVe'), 'Moisturizing Cream', 'moisturizer'),
  ((SELECT id FROM public.brands WHERE name = 'The Ordinary'), 'Niacinamide 10% + Zinc 1%', 'serum'),
  ((SELECT id FROM public.brands WHERE name = 'Neutrogena'), 'Hydro Boost Water Gel', 'moisturizer'),
  ((SELECT id FROM public.brands WHERE name = 'La Roche-Posay'), 'Anthelios Mineral Sunscreen SPF 50', 'sunscreen');

-- Link ingredients to products (sample)
-- CeraVe Hydrating Cleanser
INSERT INTO public.product_ingredients (product_id, ingredient_id, position) VALUES
  ((SELECT id FROM public.products WHERE name = 'Hydrating Facial Cleanser'), 
   (SELECT id FROM public.ingredients WHERE inci_name = 'Ceramides'), 1),
  ((SELECT id FROM public.products WHERE name = 'Hydrating Facial Cleanser'), 
   (SELECT id FROM public.ingredients WHERE inci_name = 'Hyaluronic Acid'), 2),
  ((SELECT id FROM public.products WHERE name = 'Hydrating Facial Cleanser'), 
   (SELECT id FROM public.ingredients WHERE inci_name = 'Glycerin'), 3);

-- CeraVe Moisturizing Cream
INSERT INTO public.product_ingredients (product_id, ingredient_id, position) VALUES
  ((SELECT id FROM public.products WHERE name = 'Moisturizing Cream'), 
   (SELECT id FROM public.ingredients WHERE inci_name = 'Ceramides'), 1),
  ((SELECT id FROM public.products WHERE name = 'Moisturizing Cream'), 
   (SELECT id FROM public.ingredients WHERE inci_name = 'Hyaluronic Acid'), 2),
  ((SELECT id FROM public.products WHERE name = 'Moisturizing Cream'), 
   (SELECT id FROM public.ingredients WHERE inci_name = 'Petrolatum'), 3);

-- The Ordinary Niacinamide
INSERT INTO public.product_ingredients (product_id, ingredient_id, position) VALUES
  ((SELECT id FROM public.products WHERE name = 'Niacinamide 10% + Zinc 1%'), 
   (SELECT id FROM public.ingredients WHERE inci_name = 'Niacinamide'), 1);

-- Neutrogena Hydro Boost
INSERT INTO public.product_ingredients (product_id, ingredient_id, position) VALUES
  ((SELECT id FROM public.products WHERE name = 'Hydro Boost Water Gel'), 
   (SELECT id FROM public.ingredients WHERE inci_name = 'Hyaluronic Acid'), 1),
  ((SELECT id FROM public.products WHERE name = 'Hydro Boost Water Gel'), 
   (SELECT id FROM public.ingredients WHERE inci_name = 'Glycerin'), 2);

-- La Roche-Posay Sunscreen
INSERT INTO public.product_ingredients (product_id, ingredient_id, position) VALUES
  ((SELECT id FROM public.products WHERE name = 'Anthelios Mineral Sunscreen SPF 50'), 
   (SELECT id FROM public.ingredients WHERE inci_name = 'Zinc Oxide'), 1);

-- Seed sample achievements
INSERT INTO public.achievements (code, title, description, icon_name) VALUES
  ('first_scan', 'First Scan', 'Scanned your first product', 'scan'),
  ('streak_7', '7-Day Streak', 'Checked your routine for 7 days in a row', 'flame'),
  ('lesson_5', 'Learning Star', 'Completed 5 Glow Card lessons', 'star'),
  ('routine_complete', 'Routine Master', 'Completed your full AM and PM routine', 'check-circle');

-- Seed sample lessons
INSERT INTO public.lessons (slug, title, body_md, tags, age_range) VALUES
  ('what-is-spf', 'What is SPF?', 
   '# What is SPF?\n\nSPF stands for Sun Protection Factor. It measures how well a sunscreen protects your skin from UVB rays.\n\n## Why it matters\n- Prevents sunburn\n- Protects developing skin\n- Reduces long-term damage\n\n**Pro tip:** Use SPF 30+ every day, even when it''s cloudy!', 
   ARRAY['sunscreen', 'basics'], '11-17'),
  
  ('gentle-cleansing', 'Gentle Cleansing 101', 
   '# Gentle Cleansing 101\n\nYour skin has a natural barrier that protects it. Harsh cleansers can strip this away.\n\n## How to cleanse gently\n1. Use lukewarm water (not hot!)\n2. Choose a creamy or gel cleanser\n3. Massage for 30 seconds\n4. Pat dry with a soft towel\n\n**Remember:** Clean skin = happy skin!', 
   ARRAY['cleansing', 'basics'], '11-17'),
  
  ('hydration-matters', 'Why Hydration Matters', 
   '# Why Hydration Matters\n\nHydrated skin is healthy skin. Even oily skin needs moisture!\n\n## Signs your skin needs hydration\n- Feels tight after washing\n- Looks dull or flaky\n- Gets oily quickly (yes, really!)\n\n## Best hydrators\n- Hyaluronic Acid\n- Glycerin\n- Ceramides\n\n**Try this:** Apply moisturizer while skin is still damp!', 
   ARRAY['hydration', 'ingredients'], '11-17');

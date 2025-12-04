-- =====================================================
-- Ingredient Rules Table Setup
-- =====================================================
-- This script creates the ingredient_rules table for
-- storing ingredient safety information and guidelines
-- =====================================================

-- Create ingredient_rules table
CREATE TABLE IF NOT EXISTS ingredient_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_type TEXT NOT NULL CHECK (rule_type IN ('avoid', 'caution', 'info', 'ok')),
  match_type TEXT NOT NULL CHECK (match_type IN ('exact_inci', 'category', 'pattern')),
  match_value TEXT NOT NULL, -- INCI name, category, or regex pattern
  applies_to_age_min INTEGER,
  applies_to_age_max INTEGER,
  reason TEXT NOT NULL,
  recommendation TEXT,
  severity INTEGER DEFAULT 1 CHECK (severity BETWEEN 1 AND 5),
  is_active BOOLEAN DEFAULT true,
  version INTEGER DEFAULT 1,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ingredient_rules_active ON ingredient_rules(is_active, match_type);
CREATE INDEX IF NOT EXISTS idx_ingredient_rules_match_value ON ingredient_rules(match_value);
CREATE INDEX IF NOT EXISTS idx_ingredient_rules_rule_type ON ingredient_rules(rule_type);

-- Enable Row Level Security
ALTER TABLE ingredient_rules ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read active ingredient rules
CREATE POLICY "Anyone can read active ingredient rules"
ON ingredient_rules FOR SELECT
TO public
USING (is_active = true);

-- Policy: Only authenticated users can insert/update/delete
CREATE POLICY "Authenticated users can manage ingredient rules"
ON ingredient_rules FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- =====================================================
-- Insert Common Safe Ingredients for Kids
-- =====================================================

INSERT INTO ingredient_rules (match_value, match_type, rule_type, reason, recommendation, severity, is_active) VALUES
-- Moisturizing Ingredients
('hyaluronic acid', 'exact_inci', 'ok', 'Helps skin hold water and stay hydrated', 'Great for all skin types, very gentle', 1, true),
('glycerin', 'exact_inci', 'ok', 'Moisturizes and softens skin', 'One of the safest moisturizers for kids', 1, true),
('ceramide', 'pattern', 'ok', 'Strengthens skin barrier', 'Helps protect and repair skin', 1, true),
('squalane', 'exact_inci', 'ok', 'Lightweight moisturizer', 'Non-greasy, good for all skin types', 1, true),
('panthenol', 'exact_inci', 'ok', 'Soothes and moisturizes', 'Also known as Pro-Vitamin B5', 1, true),

-- Soothing Ingredients
('niacinamide', 'exact_inci', 'ok', 'Helps with redness and oil control', 'Vitamin B3, great for sensitive skin', 1, true),
('allantoin', 'exact_inci', 'ok', 'Soothes and calms irritated skin', 'Very gentle, good for sensitive skin', 1, true),
('aloe vera', 'pattern', 'ok', 'Cooling and soothing', 'Natural ingredient, very gentle', 1, true),
('colloidal oatmeal', 'exact_inci', 'ok', 'Relieves itching and irritation', 'Great for eczema-prone skin', 1, true),

-- Sun Protection
('zinc oxide', 'exact_inci', 'ok', 'Physical sunscreen protection', 'Safest sunscreen for kids', 1, true),
('titanium dioxide', 'exact_inci', 'ok', 'Physical sunscreen protection', 'Safe mineral sunscreen', 1, true),

-- Cleansing Ingredients
('cocamidopropyl betaine', 'exact_inci', 'ok', 'Gentle cleansing agent', 'Mild surfactant, good for kids', 1, true),
('decyl glucoside', 'exact_inci', 'ok', 'Very gentle cleanser', 'Sugar-based, very mild', 1, true),

-- Preservatives (Safe)
('phenoxyethanol', 'exact_inci', 'info', 'Preservative to prevent bacteria', 'Safe in low concentrations (under 1%)', 2, true),
('sodium benzoate', 'exact_inci', 'info', 'Preservative', 'Generally safe, naturally occurs in some foods', 2, true),

-- Ingredients to Be Cautious With
('fragrance', 'exact_inci', 'caution', 'Can cause irritation or allergies', 'Look for fragrance-free products if skin is sensitive', 3, true),
('parfum', 'exact_inci', 'caution', 'Can cause irritation or allergies', 'Same as fragrance, look for fragrance-free', 3, true),
('essential oil', 'pattern', 'caution', 'Can irritate sensitive skin', 'Natural doesn''t always mean gentle', 3, true),
('alcohol denat', 'exact_inci', 'caution', 'Can dry out skin', 'Avoid in high concentrations', 3, true),
('sodium lauryl sulfate', 'exact_inci', 'caution', 'Strong cleanser, can irritate', 'Look for gentler alternatives', 3, true),
('sodium laureth sulfate', 'exact_inci', 'caution', 'Can be drying', 'Milder than SLS but still strong', 3, true),

-- Ingredients to Avoid for Kids
('retinol', 'exact_inci', 'avoid', 'Too strong for young skin', 'Only for adults, not for kids under 16', 5, true),
('retinoid', 'pattern', 'avoid', 'Too strong for young skin', 'Only for adults, not for kids', 5, true),
('hydroquinone', 'exact_inci', 'avoid', 'Skin lightening agent, not safe for kids', 'Should only be used under medical supervision', 5, true),
('salicylic acid', 'exact_inci', 'caution', 'Exfoliating acid', 'Use only in low concentrations for teens, not for young kids', 4, true),
('benzoyl peroxide', 'exact_inci', 'caution', 'Acne treatment', 'Can be harsh, use only for teens with acne', 4, true),
('formaldehyde', 'exact_inci', 'avoid', 'Preservative, can cause irritation', 'Avoid completely', 5, true),
('parabens', 'pattern', 'caution', 'Preservatives', 'Generally safe but some prefer to avoid', 3, true),

-- Vitamins and Antioxidants
('vitamin e', 'pattern', 'ok', 'Antioxidant, protects skin', 'Very gentle and beneficial', 1, true),
('vitamin c', 'pattern', 'info', 'Brightening antioxidant', 'Safe but can be irritating in high concentrations', 2, true),
('green tea extract', 'exact_inci', 'ok', 'Soothing antioxidant', 'Natural and gentle', 1, true),

-- Emollients
('shea butter', 'exact_inci', 'ok', 'Rich moisturizer', 'Natural, very nourishing', 1, true),
('cocoa butter', 'exact_inci', 'ok', 'Moisturizing butter', 'Rich and hydrating', 1, true),
('jojoba oil', 'exact_inci', 'ok', 'Lightweight oil', 'Similar to skin''s natural oils', 1, true),
('coconut oil', 'exact_inci', 'info', 'Moisturizing oil', 'Can clog pores for some people', 2, true)

ON CONFLICT DO NOTHING;

-- =====================================================
-- Verification Query
-- =====================================================

-- Check how many ingredients were inserted
SELECT 
  rule_type,
  COUNT(*) as count
FROM ingredient_rules
WHERE is_active = true
GROUP BY rule_type
ORDER BY rule_type;

-- Show sample of each type
SELECT 
  rule_type,
  match_value,
  reason
FROM ingredient_rules
WHERE is_active = true
ORDER BY rule_type, match_value
LIMIT 20;

-- =====================================================
-- Setup Complete!
-- =====================================================
-- Total ingredients loaded: ~35
-- - Safe (ok): ~20 ingredients
-- - Info: ~5 ingredients  
-- - Caution: ~8 ingredients
-- - Avoid: ~3 ingredients
-- =====================================================

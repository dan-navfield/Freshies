-- =====================================================
-- Daily Tips Table Setup
-- =====================================================
-- AI-generated daily skincare tips for kids
-- =====================================================

-- Create daily_tips table
CREATE TABLE IF NOT EXISTS daily_tips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tip_date DATE NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  extended_content TEXT, -- Detailed explanation for "Learn More" modal
  fun_fact TEXT, -- Optional fun fact to include
  action_steps TEXT[], -- Array of actionable steps
  category TEXT, -- e.g., 'sunscreen', 'hydration', 'cleansing'
  age_group TEXT DEFAULT 'Ages 8-12',
  generated_by TEXT DEFAULT 'ai', -- 'ai' or 'manual'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for quick date lookups
CREATE INDEX IF NOT EXISTS idx_daily_tips_date ON daily_tips(tip_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_tips_active ON daily_tips(is_active, tip_date);

-- Enable Row Level Security
ALTER TABLE daily_tips ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read active tips
DROP POLICY IF EXISTS "Anyone can read active daily tips" ON daily_tips;
CREATE POLICY "Anyone can read active daily tips"
ON daily_tips FOR SELECT
TO public
USING (is_active = true);

-- Policy: Only authenticated users can manage tips
DROP POLICY IF EXISTS "Authenticated users can manage daily tips" ON daily_tips;
CREATE POLICY "Authenticated users can manage daily tips"
ON daily_tips FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- =====================================================
-- Insert Sample Tips
-- =====================================================

INSERT INTO daily_tips (tip_date, title, content, extended_content, fun_fact, action_steps, category, age_group) VALUES
(CURRENT_DATE, 'Always wear sunscreen!', 'Even on cloudy days, UV rays can damage your skin. Apply sunscreen every morning as part of your routine.', 
'Sunscreen is like a shield for your skin! UV rays from the sun can damage your skin cells even when it''s cloudy outside. These rays can cause sunburn, make your skin age faster, and even lead to serious problems later in life. Using sunscreen every day protects your skin and keeps it healthy and happy!', 
'Did you know? Up to 80% of UV rays can pass through clouds! That''s why dermatologists say to wear sunscreen every single day, rain or shine.',
ARRAY['Apply SPF 30 or higher every morning', 'Reapply every 2 hours if you''re outside', 'Don''t forget ears, neck, and hands!', 'Use about a shot glass worth for your whole body'],
'sunscreen', 'Ages 8-12'),
(CURRENT_DATE - INTERVAL '1 day', 'Drink lots of water!', 'Your skin needs water to stay healthy and glowing. Try to drink 6-8 glasses every day!', 'hydration', 'Ages 8-12'),
(CURRENT_DATE - INTERVAL '2 days', 'Wash your face gently', 'Use lukewarm water and a gentle cleanser. Hot water can dry out your skin!', 'cleansing', 'Ages 8-12'),
(CURRENT_DATE - INTERVAL '3 days', 'Don''t touch your face', 'Your hands touch lots of things during the day. Keep them away from your face to prevent breakouts!', 'hygiene', 'Ages 8-12'),
(CURRENT_DATE - INTERVAL '4 days', 'Moisturize daily', 'Even if your skin feels fine, moisturizer helps keep it healthy and protected!', 'moisturizing', 'Ages 8-12')
ON CONFLICT (tip_date) DO NOTHING;

-- =====================================================
-- Function to get today's tip
-- =====================================================

CREATE OR REPLACE FUNCTION get_daily_tip()
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  category TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dt.id,
    dt.title,
    dt.content,
    dt.category
  FROM daily_tips dt
  WHERE dt.tip_date = CURRENT_DATE
    AND dt.is_active = true
  LIMIT 1;
  
  -- If no tip for today, return the most recent tip
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      dt.id,
      dt.title,
      dt.content,
      dt.category
    FROM daily_tips dt
    WHERE dt.is_active = true
    ORDER BY dt.tip_date DESC
    LIMIT 1;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Verification
-- =====================================================

SELECT * FROM get_daily_tip();

-- =====================================================
-- Setup Complete!
-- =====================================================

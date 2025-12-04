-- =====================================================
-- Update Daily Tips Table for Modal Content
-- =====================================================
-- Adds extended content fields for "Learn More" modal
-- =====================================================

-- Add new columns if they don't exist
ALTER TABLE daily_tips 
ADD COLUMN IF NOT EXISTS extended_content TEXT,
ADD COLUMN IF NOT EXISTS fun_fact TEXT,
ADD COLUMN IF NOT EXISTS action_steps TEXT[];

-- Update existing sunscreen tip with modal content
UPDATE daily_tips
SET 
  extended_content = 'Sunscreen is like a shield for your skin! UV rays from the sun can damage your skin cells even when it''s cloudy outside. These rays can cause sunburn, make your skin age faster, and even lead to serious problems later in life. Using sunscreen every day protects your skin and keeps it healthy and happy!',
  fun_fact = 'Did you know? Up to 80% of UV rays can pass through clouds! That''s why dermatologists say to wear sunscreen every single day, rain or shine.',
  action_steps = ARRAY[
    'Apply SPF 30 or higher every morning',
    'Reapply every 2 hours if you''re outside',
    'Don''t forget ears, neck, and hands!',
    'Use about a shot glass worth for your whole body'
  ]
WHERE title = 'Always wear sunscreen!'
  AND extended_content IS NULL;

-- Verify the update
SELECT 
  title,
  content,
  extended_content IS NOT NULL as has_extended,
  fun_fact IS NOT NULL as has_fun_fact,
  array_length(action_steps, 1) as num_steps
FROM daily_tips
WHERE title = 'Always wear sunscreen!';

-- =====================================================
-- Update Complete!
-- =====================================================

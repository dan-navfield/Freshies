-- =====================================================
-- Daily Tip Cron Job Setup
-- =====================================================
-- Automatically generate a new tip every day at midnight
-- =====================================================

-- Install pg_cron extension (if not already installed)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a function to call the Edge Function
CREATE OR REPLACE FUNCTION trigger_daily_tip_generation()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  function_url TEXT;
  cron_secret TEXT;
BEGIN
  -- Get the Supabase project URL and secret
  function_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/generate-daily-tip';
  cron_secret := current_setting('app.settings.cron_secret', true);
  
  -- Call the Edge Function using http extension
  PERFORM
    net.http_post(
      url := function_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || cron_secret
      ),
      body := '{}'::jsonb
    );
    
  RAISE NOTICE 'Daily tip generation triggered';
END;
$$;

-- Schedule the cron job to run daily at midnight UTC
SELECT cron.schedule(
  'generate-daily-tip',           -- Job name
  '0 0 * * *',                    -- Cron expression: Every day at midnight
  $$SELECT trigger_daily_tip_generation()$$
);

-- =====================================================
-- Alternative: Simple SQL-based Generation
-- =====================================================
-- If you prefer not to use Edge Functions, here's a simpler approach
-- that cycles through pre-written tips

CREATE OR REPLACE FUNCTION generate_daily_tip_simple()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  today_date DATE := CURRENT_DATE;
  tip_exists BOOLEAN;
  random_category TEXT;
  tip_title TEXT;
  tip_content TEXT;
BEGIN
  -- Check if tip already exists for today
  SELECT EXISTS(
    SELECT 1 FROM daily_tips WHERE tip_date = today_date
  ) INTO tip_exists;
  
  IF tip_exists THEN
    RAISE NOTICE 'Tip already exists for today';
    RETURN;
  END IF;
  
  -- Select a random category
  SELECT category INTO random_category
  FROM (
    VALUES 
      ('sunscreen'),
      ('hydration'),
      ('cleansing'),
      ('moisturizing'),
      ('hygiene'),
      ('sleep'),
      ('nutrition')
  ) AS categories(category)
  ORDER BY RANDOM()
  LIMIT 1;
  
  -- Generate tip based on category
  CASE random_category
    WHEN 'sunscreen' THEN
      tip_title := 'Always wear sunscreen!';
      tip_content := 'Even on cloudy days, UV rays can damage your skin. Apply sunscreen every morning as part of your routine.';
    WHEN 'hydration' THEN
      tip_title := 'Drink lots of water!';
      tip_content := 'Your skin needs water to stay healthy and glowing. Try to drink 6-8 glasses every day!';
    WHEN 'cleansing' THEN
      tip_title := 'Wash your face gently';
      tip_content := 'Use lukewarm water and a gentle cleanser. Hot water can dry out your skin!';
    WHEN 'moisturizing' THEN
      tip_title := 'Moisturize daily';
      tip_content := 'Even if your skin feels fine, moisturizer helps keep it healthy and protected!';
    WHEN 'hygiene' THEN
      tip_title := 'Don''t touch your face';
      tip_content := 'Your hands touch lots of things during the day. Keep them away from your face to prevent breakouts!';
    WHEN 'sleep' THEN
      tip_title := 'Get enough sleep';
      tip_content := 'Your skin repairs itself while you sleep. Aim for 8-10 hours every night!';
    WHEN 'nutrition' THEN
      tip_title := 'Eat healthy foods';
      tip_content := 'Fruits and vegetables give your skin vitamins it needs to stay healthy and glowing!';
  END CASE;
  
  -- Insert the new tip
  INSERT INTO daily_tips (
    tip_date,
    title,
    content,
    category,
    age_group,
    generated_by,
    is_active
  ) VALUES (
    today_date,
    tip_title,
    tip_content,
    random_category,
    'Ages 8-12',
    'cron',
    true
  );
  
  RAISE NOTICE 'Generated new % tip for %', random_category, today_date;
END;
$$;

-- Schedule the simple version (comment out if using Edge Function)
SELECT cron.schedule(
  'generate-daily-tip-simple',    -- Job name
  '0 0 * * *',                    -- Every day at midnight
  $$SELECT generate_daily_tip_simple()$$
);

-- =====================================================
-- View Scheduled Jobs
-- =====================================================

SELECT * FROM cron.job;

-- =====================================================
-- Manually Trigger (for testing)
-- =====================================================

-- Test the simple version:
-- SELECT generate_daily_tip_simple();

-- Test the Edge Function version:
-- SELECT trigger_daily_tip_generation();

-- =====================================================
-- Unschedule Jobs (if needed)
-- =====================================================

-- To remove the cron job:
-- SELECT cron.unschedule('generate-daily-tip');
-- SELECT cron.unschedule('generate-daily-tip-simple');

-- =====================================================
-- Setup Complete!
-- =====================================================
-- A new tip will be generated automatically every day at midnight UTC
-- =====================================================

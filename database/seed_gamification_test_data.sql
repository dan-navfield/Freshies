-- =====================================================
-- Seed Test Data for Gamification
-- =====================================================
-- Run this to add test points, achievements, and activity
-- for the first child profile in the database
-- =====================================================

-- Get the first child profile ID
DO $$
DECLARE
  v_child_id UUID;
BEGIN
  -- Get first child profile
  SELECT id INTO v_child_id FROM child_profiles LIMIT 1;
  
  IF v_child_id IS NULL THEN
    RAISE NOTICE 'No child profiles found. Please create a child profile first.';
    RETURN;
  END IF;
  
  RAISE NOTICE 'Seeding data for child profile: %', v_child_id;
  
  -- =====================================================
  -- 1. CREATE POINTS RECORD
  -- =====================================================
  INSERT INTO gamification_points (child_profile_id, total_points, points_this_week, points_this_month, level)
  VALUES (v_child_id, 150, 45, 150, 3)
  ON CONFLICT (child_profile_id) DO UPDATE SET
    total_points = 150,
    points_this_week = 45,
    points_this_month = 150,
    level = 3;
  
  RAISE NOTICE 'Points record created/updated';
  
  -- =====================================================
  -- 2. CREATE STREAKS
  -- =====================================================
  INSERT INTO streaks (child_profile_id, streak_type, current_streak, longest_streak, last_activity_date, total_completions)
  VALUES 
    (v_child_id, 'daily', 5, 7, CURRENT_DATE, 12),
    (v_child_id, 'learning', 3, 5, CURRENT_DATE, 8)
  ON CONFLICT (child_profile_id, streak_type) DO UPDATE SET
    current_streak = EXCLUDED.current_streak,
    longest_streak = EXCLUDED.longest_streak,
    last_activity_date = EXCLUDED.last_activity_date,
    total_completions = EXCLUDED.total_completions;
  
  RAISE NOTICE 'Streaks created/updated';
  
  -- =====================================================
  -- 3. AWARD SOME ACHIEVEMENTS
  -- =====================================================
  -- Award "First Steps" badge
  INSERT INTO user_achievements (child_profile_id, achievement_id)
  SELECT v_child_id, id FROM achievements WHERE badge_key = 'first_routine'
  ON CONFLICT (child_profile_id, achievement_id) DO NOTHING;
  
  -- Award "Three Day Streak" badge
  INSERT INTO user_achievements (child_profile_id, achievement_id)
  SELECT v_child_id, id FROM achievements WHERE badge_key = 'three_day_streak'
  ON CONFLICT (child_profile_id, achievement_id) DO NOTHING;
  
  -- Award "Curious Mind" badge
  INSERT INTO user_achievements (child_profile_id, achievement_id)
  SELECT v_child_id, id FROM achievements WHERE badge_key = 'first_article'
  ON CONFLICT (child_profile_id, achievement_id) DO NOTHING;
  
  RAISE NOTICE 'Achievements awarded';
  
  -- =====================================================
  -- 4. CREATE ACTIVITY LOG ENTRIES
  -- =====================================================
  INSERT INTO activity_log (child_profile_id, activity_type, title, points_earned)
  VALUES
    (v_child_id, 'article_read', 'Read daily tip: Sunscreen Basics', 5),
    (v_child_id, 'article_read', 'Completed: Understanding SPF', 10),
    (v_child_id, 'quiz_completed', 'Aced the Moisturizer Quiz!', 20),
    (v_child_id, 'badge_earned', 'Earned: Three Day Streak 🔥', 0),
    (v_child_id, 'streak_milestone', '5-day learning streak!', 10);
  
  RAISE NOTICE 'Activity log entries created';
  
  -- =====================================================
  -- 5. CREATE LEARNING PROGRESS ENTRIES
  -- =====================================================
  INSERT INTO learning_progress (child_profile_id, content_type, content_id, completed, progress_percentage, completed_at)
  VALUES
    (v_child_id, 'tip', 'tip-001', true, 100, NOW() - INTERVAL '2 days'),
    (v_child_id, 'article', 'article-001', true, 100, NOW() - INTERVAL '1 day'),
    (v_child_id, 'video', 'video-001', true, 100, NOW() - INTERVAL '3 hours')
  ON CONFLICT (child_profile_id, content_type, content_id) DO NOTHING;
  
  RAISE NOTICE 'Learning progress entries created';
  
  -- =====================================================
  -- DONE!
  -- =====================================================
  RAISE NOTICE '✅ Test data seeded successfully for child profile: %', v_child_id;
  RAISE NOTICE 'Points: 150 | Level: 3 | Badges: 3 | Activities: 5';
  
END $$;

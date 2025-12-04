-- =====================================================
-- Gamification System Setup
-- =====================================================
-- Cross-app gamification for routines, learning, and Freshies
-- Private, encouraging, non-competitive
-- =====================================================

-- =====================================================
-- 1. STREAKS TABLE
-- =====================================================
-- Track routine consistency (morning/evening/daily)

CREATE TABLE IF NOT EXISTS streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_profile_id UUID NOT NULL REFERENCES child_profiles(id) ON DELETE CASCADE,
  streak_type TEXT NOT NULL CHECK (streak_type IN ('morning', 'evening', 'daily', 'learning')),
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  total_completions INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(child_profile_id, streak_type)
);

CREATE INDEX idx_streaks_child ON streaks(child_profile_id);
CREATE INDEX idx_streaks_type ON streaks(streak_type);

-- =====================================================
-- 2. POINTS TABLE
-- =====================================================
-- Soft points system to track overall progress

CREATE TABLE IF NOT EXISTS gamification_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_profile_id UUID NOT NULL REFERENCES child_profiles(id) ON DELETE CASCADE,
  total_points INTEGER DEFAULT 0,
  points_this_week INTEGER DEFAULT 0,
  points_this_month INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(child_profile_id)
);

CREATE INDEX idx_points_child ON gamification_points(child_profile_id);

-- =====================================================
-- 3. ACHIEVEMENTS/BADGES TABLE
-- =====================================================
-- Track earned badges across all activities

CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  badge_key TEXT NOT NULL UNIQUE, -- e.g. 'first_routine', 'three_day_streak'
  category TEXT NOT NULL CHECK (category IN ('routine', 'freshies', 'learning', 'quiz')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  emoji TEXT,
  points_value INTEGER DEFAULT 0,
  age_min INTEGER DEFAULT 8,
  age_max INTEGER DEFAULT 18,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_achievements_category ON achievements(category);
CREATE INDEX idx_achievements_active ON achievements(is_active);

-- =====================================================
-- 4. USER ACHIEVEMENTS TABLE
-- =====================================================
-- Track which badges each child has earned

CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_profile_id UUID NOT NULL REFERENCES child_profiles(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  is_new BOOLEAN DEFAULT true, -- For showing "New badge!" notifications
  UNIQUE(child_profile_id, achievement_id)
);

CREATE INDEX idx_user_achievements_child ON user_achievements(child_profile_id);
CREATE INDEX idx_user_achievements_new ON user_achievements(is_new);

-- =====================================================
-- 5. LEARNING PROGRESS TABLE
-- =====================================================
-- Track article/module completion

CREATE TABLE IF NOT EXISTS learning_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_profile_id UUID NOT NULL REFERENCES child_profiles(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('article', 'module', 'video', 'tip')),
  content_id TEXT NOT NULL, -- Article ID, module name, etc.
  completed BOOLEAN DEFAULT false,
  progress_percentage INTEGER DEFAULT 0,
  time_spent_seconds INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(child_profile_id, content_type, content_id)
);

CREATE INDEX idx_learning_progress_child ON learning_progress(child_profile_id);
CREATE INDEX idx_learning_progress_completed ON learning_progress(completed);

-- =====================================================
-- 6. QUIZ RESULTS TABLE
-- =====================================================
-- Track quiz attempts and scores

CREATE TABLE IF NOT EXISTS quiz_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_profile_id UUID NOT NULL REFERENCES child_profiles(id) ON DELETE CASCADE,
  quiz_id TEXT NOT NULL,
  quiz_title TEXT NOT NULL,
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  score_percentage INTEGER NOT NULL,
  time_taken_seconds INTEGER,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_quiz_results_child ON quiz_results(child_profile_id);
CREATE INDEX idx_quiz_results_quiz ON quiz_results(quiz_id);

-- =====================================================
-- 7. ACTIVITY LOG TABLE
-- =====================================================
-- General activity tracking for "Recent Activity" feed

CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_profile_id UUID NOT NULL REFERENCES child_profiles(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'routine_completed', 
    'freshie_taken', 
    'article_read', 
    'quiz_completed', 
    'badge_earned',
    'streak_milestone'
  )),
  title TEXT NOT NULL,
  description TEXT,
  points_earned INTEGER DEFAULT 0,
  metadata JSONB, -- Flexible storage for activity-specific data
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activity_log_child ON activity_log(child_profile_id);
CREATE INDEX idx_activity_log_type ON activity_log(activity_type);
CREATE INDEX idx_activity_log_created ON activity_log(created_at DESC);

-- =====================================================
-- 8. GAMIFICATION SETTINGS TABLE
-- =====================================================
-- Parent controls for gamification features

CREATE TABLE IF NOT EXISTS gamification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_profile_id UUID NOT NULL REFERENCES child_profiles(id) ON DELETE CASCADE,
  freshies_enabled BOOLEAN DEFAULT true,
  points_enabled BOOLEAN DEFAULT true,
  badges_enabled BOOLEAN DEFAULT true,
  quizzes_enabled BOOLEAN DEFAULT true,
  streaks_enabled BOOLEAN DEFAULT true,
  parent_can_view_progress BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(child_profile_id)
);

CREATE INDEX idx_gamification_settings_child ON gamification_settings(child_profile_id);

-- =====================================================
-- SEED ACHIEVEMENTS/BADGES
-- =====================================================

INSERT INTO achievements (badge_key, category, title, description, emoji, points_value, age_min, age_max) VALUES
-- Routine Badges
('first_routine', 'routine', 'First Routine!', 'You completed your first routine', '🎉', 10, 8, 18),
('three_day_streak', 'routine', '3-Day Streak', 'Three days in a row!', '🔥', 25, 8, 18),
('week_streak', 'routine', 'Week Warrior', 'A full week of routines', '⭐', 50, 8, 18),
('morning_routine_week', 'routine', 'Morning Champion', 'Week of morning routines', '🌅', 40, 8, 18),
('evening_routine_week', 'routine', 'Night Owl', 'Week of evening routines', '🌙', 40, 8, 18),

-- Freshies Badges
('first_freshie', 'freshies', 'First Freshie!', 'You took your first Freshie', '📸', 10, 8, 18),
('five_freshies', 'freshies', 'Freshie Fan', 'Five Freshies captured', '✨', 30, 8, 18),
('freshie_week', 'freshies', 'Freshie Week', 'A Freshie every day this week', '🌟', 50, 8, 18),

-- Learning Badges
('first_article', 'learning', 'Curious Mind', 'Read your first article', '📚', 10, 8, 18),
('first_module', 'learning', 'Module Master', 'Completed your first module', '🎓', 30, 8, 18),
('spf_basics', 'learning', 'SPF Expert', 'Completed SPF basics module', '☀️', 25, 8, 18),
('ingredient_expert', 'learning', 'Ingredient Pro', 'Learned about 10 ingredients', '🧪', 40, 8, 18),

-- Quiz Badges
('first_quiz', 'quiz', 'Quiz Starter', 'Completed your first quiz', '❓', 10, 8, 18),
('perfect_score', 'quiz', 'Perfect Score!', 'Got 100% on a quiz', '💯', 50, 8, 18),
('three_correct', 'quiz', 'On a Roll', '3 correct answers in a row', '🎯', 15, 8, 18),
('quiz_week', 'quiz', 'Quiz Champion', 'Completed 5 quizzes this week', '🏆', 60, 8, 18)

ON CONFLICT (badge_key) DO NOTHING;

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to award points
CREATE OR REPLACE FUNCTION award_points(
  p_child_profile_id UUID,
  p_points INTEGER,
  p_activity_type TEXT,
  p_activity_title TEXT
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update or create points record
  INSERT INTO gamification_points (child_profile_id, total_points, points_this_week, points_this_month)
  VALUES (p_child_profile_id, p_points, p_points, p_points)
  ON CONFLICT (child_profile_id)
  DO UPDATE SET
    total_points = gamification_points.total_points + p_points,
    points_this_week = gamification_points.points_this_week + p_points,
    points_this_month = gamification_points.points_this_month + p_points,
    updated_at = NOW();
    
  -- Log the activity
  INSERT INTO activity_log (child_profile_id, activity_type, title, points_earned)
  VALUES (p_child_profile_id, p_activity_type, p_activity_title, p_points);
END;
$$;

-- Function to award achievement
CREATE OR REPLACE FUNCTION award_achievement(
  p_child_profile_id UUID,
  p_badge_key TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_achievement_id UUID;
  v_points INTEGER;
  v_title TEXT;
BEGIN
  -- Get achievement details
  SELECT id, points_value, title INTO v_achievement_id, v_points, v_title
  FROM achievements
  WHERE badge_key = p_badge_key AND is_active = true;
  
  IF v_achievement_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Award the badge (if not already earned)
  INSERT INTO user_achievements (child_profile_id, achievement_id)
  VALUES (p_child_profile_id, v_achievement_id)
  ON CONFLICT (child_profile_id, achievement_id) DO NOTHING;
  
  IF FOUND THEN
    -- Award points
    PERFORM award_points(p_child_profile_id, v_points, 'badge_earned', 'Earned: ' || v_title);
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- Function to update streak
CREATE OR REPLACE FUNCTION update_streak(
  p_child_profile_id UUID,
  p_streak_type TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_current_streak INTEGER;
  v_last_date DATE;
  v_new_streak INTEGER;
BEGIN
  -- Get current streak info
  SELECT current_streak, last_activity_date INTO v_current_streak, v_last_date
  FROM streaks
  WHERE child_profile_id = p_child_profile_id AND streak_type = p_streak_type;
  
  -- If no record exists, create one
  IF NOT FOUND THEN
    INSERT INTO streaks (child_profile_id, streak_type, current_streak, longest_streak, last_activity_date, total_completions)
    VALUES (p_child_profile_id, p_streak_type, 1, 1, CURRENT_DATE, 1);
    RETURN 1;
  END IF;
  
  -- Check if activity is today (don't increment twice)
  IF v_last_date = CURRENT_DATE THEN
    RETURN v_current_streak;
  END IF;
  
  -- Check if streak continues (yesterday)
  IF v_last_date = CURRENT_DATE - INTERVAL '1 day' THEN
    v_new_streak := v_current_streak + 1;
  ELSE
    -- Streak broken, start over
    v_new_streak := 1;
  END IF;
  
  -- Update streak
  UPDATE streaks
  SET 
    current_streak = v_new_streak,
    longest_streak = GREATEST(longest_streak, v_new_streak),
    last_activity_date = CURRENT_DATE,
    total_completions = total_completions + 1,
    updated_at = NOW()
  WHERE child_profile_id = p_child_profile_id AND streak_type = p_streak_type;
  
  -- Check for streak milestones and award badges
  IF v_new_streak = 3 THEN
    PERFORM award_achievement(p_child_profile_id, 'three_day_streak');
  ELSIF v_new_streak = 7 THEN
    PERFORM award_achievement(p_child_profile_id, 'week_streak');
  END IF;
  
  RETURN v_new_streak;
END;
$$;

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
-- DISABLED FOR DEVELOPMENT
-- Run disable_rls_dev.sql to disable RLS during development

-- ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE gamification_points ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE learning_progress ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE gamification_settings ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
-- CREATE POLICY "Users can view own gamification data" ON streaks FOR SELECT USING (true);
-- CREATE POLICY "Users can view own points" ON gamification_points FOR SELECT USING (true);
-- CREATE POLICY "Anyone can view achievements" ON achievements FOR SELECT USING (is_active = true);
-- CREATE POLICY "Users can view own badges" ON user_achievements FOR SELECT USING (true);
-- CREATE POLICY "Users can view own learning progress" ON learning_progress FOR SELECT USING (true);
-- CREATE POLICY "Users can view own quiz results" ON quiz_results FOR SELECT USING (true);
-- CREATE POLICY "Users can view own activity" ON activity_log FOR SELECT USING (true);
-- CREATE POLICY "Users can view own settings" ON gamification_settings FOR SELECT USING (true);

-- =====================================================
-- SETUP COMPLETE!
-- =====================================================
-- Gamification system ready for:
-- - Streaks (routine consistency)
-- - Points (soft progression)
-- - Badges (achievements)
-- - Learning progress
-- - Quiz tracking
-- - Activity feed
-- =====================================================

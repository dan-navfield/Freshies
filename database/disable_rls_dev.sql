-- =====================================================
-- Disable RLS for Development
-- =====================================================
-- Run this during development to avoid RLS policy conflicts
-- REMEMBER TO RE-ENABLE BEFORE PRODUCTION!
-- =====================================================

-- Disable RLS on all tables (only if they exist)
DO $$ 
BEGIN
    -- Daily tips
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'daily_tips') THEN
        ALTER TABLE daily_tips DISABLE ROW LEVEL SECURITY;
    END IF;
    
    -- Gamification tables
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'streaks') THEN
        ALTER TABLE streaks DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'gamification_points') THEN
        ALTER TABLE gamification_points DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'achievements') THEN
        ALTER TABLE achievements DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'user_achievements') THEN
        ALTER TABLE user_achievements DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'learning_progress') THEN
        ALTER TABLE learning_progress DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'quiz_results') THEN
        ALTER TABLE quiz_results DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'activity_log') THEN
        ALTER TABLE activity_log DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'gamification_settings') THEN
        ALTER TABLE gamification_settings DISABLE ROW LEVEL SECURITY;
    END IF;

    -- Other existing tables
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'ingredient_rules') THEN
        ALTER TABLE ingredient_rules DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'child_profiles') THEN
        ALTER TABLE child_profiles DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'learn_articles') THEN
        ALTER TABLE learn_articles DISABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- =====================================================
-- RLS Disabled for Development
-- =====================================================
-- All tables now accessible without policy restrictions
-- =====================================================

-- =====================================================
-- Drop Old Gamification Tables
-- =====================================================
-- Run this to remove old gamification tables before
-- running setup_gamification.sql
-- =====================================================

DROP TABLE IF EXISTS user_achievements CASCADE;
DROP TABLE IF EXISTS achievements CASCADE;
DROP TABLE IF EXISTS streaks CASCADE;
DROP TABLE IF EXISTS gamification_points CASCADE;
DROP TABLE IF EXISTS learning_progress CASCADE;
DROP TABLE IF EXISTS quiz_results CASCADE;
DROP TABLE IF EXISTS activity_log CASCADE;
DROP TABLE IF EXISTS gamification_settings CASCADE;

-- Also drop any related functions
DROP FUNCTION IF EXISTS award_points(UUID, INTEGER, TEXT, TEXT);
DROP FUNCTION IF EXISTS award_achievement(UUID, TEXT);
DROP FUNCTION IF EXISTS update_streak(UUID, TEXT);

-- =====================================================
-- Old tables dropped!
-- =====================================================
-- Now run setup_gamification.sql to create new tables
-- =====================================================

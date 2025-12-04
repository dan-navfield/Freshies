/**
 * Achievement System Helpers
 * Track and unlock achievements based on user activity
 */

import { supabase } from '../../lib/supabase';
import * as Notifications from 'expo-notifications';

export interface Achievement {
  id: string;
  code: string;
  name: string;
  description: string;
  emoji: string;
  category: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  requirement_type: string;
  requirement_value: number;
  points: number;
  progress?: number;
  is_unlocked?: boolean;
  unlocked_at?: string;
}

export interface PointsUpdate {
  new_total: number;
  new_level: number;
  leveled_up: boolean;
}

/**
 * Check and unlock achievements after routine completion
 */
export async function checkAndUnlockAchievements(
  childProfileId: string
): Promise<Achievement[]> {
  try {
    const newlyUnlocked: Achievement[] = [];

    // Get current streak and completion stats
    const { data: stats } = await supabase.rpc('get_child_stats', {
      p_child_profile_id: childProfileId,
    });

    if (!stats) return [];

    // Get all achievements
    const { data: achievements } = await supabase
      .from('achievements')
      .select('*')
      .eq('is_active', true);

    if (!achievements) return [];

    // Get already unlocked achievements
    const { data: unlocked } = await supabase
      .from('child_achievements')
      .select('achievement_id')
      .eq('child_profile_id', childProfileId);

    const unlockedIds = new Set(unlocked?.map(u => u.achievement_id) || []);

    // Check each achievement
    for (const achievement of achievements) {
      if (unlockedIds.has(achievement.id)) continue;

      let shouldUnlock = false;

      switch (achievement.requirement_type) {
        case 'streak_days':
          shouldUnlock = stats.current_streak >= achievement.requirement_value;
          break;
        case 'total_completions':
          shouldUnlock = stats.total_completions >= achievement.requirement_value;
          break;
        case 'perfect_week':
          shouldUnlock = await checkPerfectWeek(childProfileId);
          break;
        case 'perfect_month':
          shouldUnlock = await checkPerfectMonth(childProfileId);
          break;
        case 'early_bird':
          shouldUnlock = await checkEarlyBird(childProfileId, achievement.requirement_value);
          break;
        case 'night_owl':
          shouldUnlock = await checkNightOwl(childProfileId, achievement.requirement_value);
          break;
        case 'weekend_warrior':
          shouldUnlock = await checkWeekendWarrior(childProfileId, achievement.requirement_value);
          break;
      }

      if (shouldUnlock) {
        await unlockAchievement(childProfileId, achievement);
        newlyUnlocked.push(achievement);
      }
    }

    return newlyUnlocked;
  } catch (error) {
    console.error('Error checking achievements:', error);
    return [];
  }
}

/**
 * Unlock an achievement
 */
async function unlockAchievement(
  childProfileId: string,
  achievement: Achievement
): Promise<void> {
  try {
    // Add to child_achievements
    await supabase.from('child_achievements').insert({
      child_profile_id: childProfileId,
      achievement_id: achievement.id,
      progress: achievement.requirement_value,
      is_claimed: false,
    });

    // Award points
    await awardPoints(childProfileId, achievement.points);

    // Send celebration notification
    await sendAchievementNotification(childProfileId, achievement);
  } catch (error) {
    console.error('Error unlocking achievement:', error);
  }
}

/**
 * Award points to a child
 */
export async function awardPoints(
  childProfileId: string,
  points: number
): Promise<PointsUpdate | null> {
  try {
    const { data, error } = await supabase.rpc('award_points', {
      p_child_profile_id: childProfileId,
      p_points: points,
    });

    if (error) throw error;

    const result = data[0];
    
    // If leveled up, send notification
    if (result.leveled_up) {
      await sendLevelUpNotification(childProfileId, result.new_level);
    }

    return result;
  } catch (error) {
    console.error('Error awarding points:', error);
    return null;
  }
}

/**
 * Get all achievements with progress
 */
export async function getAchievementsWithProgress(
  childProfileId: string
): Promise<Achievement[]> {
  try {
    const { data: achievements } = await supabase
      .from('achievements')
      .select('*')
      .eq('is_active', true)
      .order('tier', { ascending: true })
      .order('requirement_value', { ascending: true });

    if (!achievements) return [];

    // Get unlocked achievements
    const { data: unlocked } = await supabase
      .from('child_achievements')
      .select('*')
      .eq('child_profile_id', childProfileId);

    const unlockedMap = new Map(
      unlocked?.map(u => [u.achievement_id, u]) || []
    );

    // Get current stats for progress calculation
    const { data: stats } = await supabase.rpc('get_child_stats', {
      p_child_profile_id: childProfileId,
    });

    return achievements.map(achievement => {
      const unlockedData = unlockedMap.get(achievement.id);
      let progress = 0;

      if (unlockedData) {
        progress = achievement.requirement_value;
      } else if (stats) {
        // Calculate current progress
        switch (achievement.requirement_type) {
          case 'streak_days':
            progress = Math.min(stats.current_streak, achievement.requirement_value);
            break;
          case 'total_completions':
            progress = Math.min(stats.total_completions, achievement.requirement_value);
            break;
        }
      }

      return {
        ...achievement,
        progress,
        is_unlocked: !!unlockedData,
        unlocked_at: unlockedData?.unlocked_at,
      };
    });
  } catch (error) {
    console.error('Error getting achievements:', error);
    return [];
  }
}

/**
 * Get child's points and level
 */
export async function getChildPoints(
  childProfileId: string
): Promise<{
  total_points: number;
  current_level: number;
  points_to_next_level: number;
  lifetime_points: number;
} | null> {
  try {
    const { data, error } = await supabase
      .from('child_points')
      .select('*')
      .eq('child_profile_id', childProfileId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return data || {
      total_points: 0,
      current_level: 1,
      points_to_next_level: 100,
      lifetime_points: 0,
    };
  } catch (error) {
    console.error('Error getting child points:', error);
    return null;
  }
}

// Helper functions for specific achievement checks
async function checkPerfectWeek(childProfileId: string): Promise<boolean> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const { data } = await supabase
    .from('routine_completions')
    .select('completion_date')
    .eq('child_profile_id', childProfileId)
    .gte('completion_date', sevenDaysAgo.toISOString().split('T')[0]);

  const uniqueDays = new Set(data?.map(c => c.completion_date));
  return uniqueDays.size >= 7;
}

async function checkPerfectMonth(childProfileId: string): Promise<boolean> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const { data } = await supabase
    .from('routine_completions')
    .select('completion_date')
    .eq('child_profile_id', childProfileId)
    .gte('completion_date', thirtyDaysAgo.toISOString().split('T')[0]);

  const uniqueDays = new Set(data?.map(c => c.completion_date));
  return uniqueDays.size >= 30;
}

async function checkEarlyBird(childProfileId: string, required: number): Promise<boolean> {
  const { data } = await supabase
    .from('routine_completions')
    .select('completed_at, segment')
    .eq('child_profile_id', childProfileId)
    .eq('segment', 'morning');

  const earlyCompletions = data?.filter(c => {
    const hour = new Date(c.completed_at).getHours();
    return hour < 8;
  });

  return (earlyCompletions?.length || 0) >= required;
}

async function checkNightOwl(childProfileId: string, required: number): Promise<boolean> {
  const { count } = await supabase
    .from('routine_completions')
    .select('*', { count: 'exact', head: true })
    .eq('child_profile_id', childProfileId)
    .eq('segment', 'evening');

  return (count || 0) >= required;
}

async function checkWeekendWarrior(childProfileId: string, required: number): Promise<boolean> {
  const { data } = await supabase
    .from('routine_completions')
    .select('completion_date')
    .eq('child_profile_id', childProfileId);

  const weekendDays = data?.filter(c => {
    const day = new Date(c.completion_date).getDay();
    return day === 0 || day === 6; // Sunday or Saturday
  });

  const uniqueWeekends = new Set(
    weekendDays?.map(c => {
      const date = new Date(c.completion_date);
      const week = Math.floor(date.getTime() / (7 * 24 * 60 * 60 * 1000));
      return week;
    })
  );

  return uniqueWeekends.size >= required;
}

// Notification helpers
async function sendAchievementNotification(
  childProfileId: string,
  achievement: Achievement
): Promise<void> {
  try {
    const { data: profile } = await supabase
      .from('child_profiles')
      .select('user_id')
      .eq('id', childProfileId)
      .single();

    if (!profile) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `${achievement.emoji} Achievement Unlocked!`,
        body: `You earned "${achievement.name}" and ${achievement.points} points!`,
        data: {
          type: 'achievement',
          achievement_id: achievement.id,
        },
      },
      trigger: null,
    });

    await supabase.from('notifications').insert({
      user_id: profile.user_id,
      type: 'system',
      title: 'Achievement Unlocked!',
      message: `${achievement.emoji} ${achievement.name}: ${achievement.description}`,
      related_id: achievement.id,
      related_type: 'achievement',
    });
  } catch (error) {
    console.error('Error sending achievement notification:', error);
  }
}

async function sendLevelUpNotification(
  childProfileId: string,
  newLevel: number
): Promise<void> {
  try {
    const { data: profile } = await supabase
      .from('child_profiles')
      .select('user_id')
      .eq('id', childProfileId)
      .single();

    if (!profile) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🎉 Level Up!',
        body: `You reached Level ${newLevel}! Keep up the amazing work!`,
        data: {
          type: 'level_up',
          new_level: newLevel,
        },
      },
      trigger: null,
    });
  } catch (error) {
    console.error('Error sending level up notification:', error);
  }
}

/**
 * Get tier color
 */
export function getTierColor(tier: string): string {
  switch (tier) {
    case 'bronze': return '#CD7F32';
    case 'silver': return '#C0C0C0';
    case 'gold': return '#FFD700';
    case 'platinum': return '#E5E4E2';
    case 'diamond': return '#B9F2FF';
    default: return '#8B7AB8';
  }
}

/**
 * Get tier gradient
 */
export function getTierGradient(tier: string): string[] {
  switch (tier) {
    case 'bronze': return ['#CD7F32', '#B87333'];
    case 'silver': return ['#C0C0C0', '#A8A8A8'];
    case 'gold': return ['#FFD700', '#FFA500'];
    case 'platinum': return ['#E5E4E2', '#D3D3D3'];
    case 'diamond': return ['#B9F2FF', '#00CED1'];
    default: return ['#8B7AB8', '#6B5A98'];
  }
}

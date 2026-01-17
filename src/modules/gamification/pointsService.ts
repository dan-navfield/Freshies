import { supabase } from '../../lib/supabase';

// =====================================================
// TYPES
// =====================================================

export interface UserPoints {
  total_points: number;
  points_this_week: number;
  points_this_month: number;
  level: number;
}

export interface Streak {
  streak_type: 'morning' | 'evening' | 'daily' | 'learning';
  current_streak: number;
  longest_streak: number;
  last_activity_date: string;
  total_completions: number;
}

export interface Achievement {
  id: string;
  badge_key: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  points: number;
  is_active: boolean;
}

export interface UserAchievement {
  id: string;
  achievement_id: string;
  earned_at: string;
  achievement: Achievement;
}

export interface ActivityLogEntry {
  id: string;
  activity_type: string;
  title: string;
  points_earned: number;
  created_at: string;
}

// =====================================================
// POINTS & LEVEL
// =====================================================

export async function getUserPoints(childProfileId: string): Promise<UserPoints | null> {
  try {
    const { data, error } = await supabase
      .from('gamification_points')
      .select('total_points, points_this_week, points_this_month, level')
      .eq('child_profile_id', childProfileId)
      .single();

    if (error) {
      console.error('Error fetching user points:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getUserPoints:', error);
    return null;
  }
}

export async function awardPoints(
  childProfileId: string,
  points: number,
  activityType: string,
  activityTitle: string
): Promise<boolean> {
  try {
    const { error } = await supabase.rpc('award_points', {
      p_child_profile_id: childProfileId,
      p_points: points,
      p_activity_type: activityType,
      p_activity_title: activityTitle,
    });

    if (error) {
      console.error('Error awarding points:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in awardPoints:', error);
    return false;
  }
}

// =====================================================
// STREAKS
// =====================================================

export async function getUserStreaks(childProfileId: string): Promise<Streak[]> {
  try {
    const { data, error } = await supabase
      .from('streaks')
      .select('streak_type, current_streak, longest_streak, last_activity_date, total_completions')
      .eq('child_profile_id', childProfileId);

    if (error) {
      console.error('Error fetching streaks:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getUserStreaks:', error);
    return [];
  }
}

export async function updateStreak(
  childProfileId: string,
  streakType: 'morning' | 'evening' | 'daily' | 'learning'
): Promise<number> {
  try {
    const { data, error } = await supabase.rpc('update_streak', {
      p_child_profile_id: childProfileId,
      p_streak_type: streakType,
    });

    if (error) {
      console.error('Error updating streak:', error);
      return 0;
    }

    return data || 0;
  } catch (error) {
    console.error('Error in updateStreak:', error);
    return 0;
  }
}

// =====================================================
// ACHIEVEMENTS
// =====================================================

export async function getAllAchievements(): Promise<Achievement[]> {
  try {
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true });

    if (error) {
      console.error('Error fetching achievements:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getAllAchievements:', error);
    return [];
  }
}

export async function getUserAchievements(childProfileId: string): Promise<UserAchievement[]> {
  try {
    const { data, error } = await supabase
      .from('user_achievements')
      .select(`
        *,
        achievement:achievements(*)
      `)
      .eq('child_profile_id', childProfileId)
      .order('unlocked_at', { ascending: false, nullsFirst: false });

    if (error) {
      console.error('Error fetching user achievements:', error);
      return [];
    }

    return (data || []) as unknown as UserAchievement[];
  } catch (error) {
    console.error('Error in getUserAchievements:', error);
    return [];
  }
}

export async function awardAchievement(
  childProfileId: string,
  badgeKey: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('award_achievement', {
      p_child_profile_id: childProfileId,
      p_badge_key: badgeKey,
    });

    if (error) {
      console.error('Error awarding achievement:', error);
      return false;
    }

    return data || false;
  } catch (error) {
    console.error('Error in awardAchievement:', error);
    return false;
  }
}

// =====================================================
// ACTIVITY LOG
// =====================================================

export async function getRecentActivity(
  childProfileId: string,
  limit: number = 10
): Promise<ActivityLogEntry[]> {
  try {
    const { data, error } = await supabase
      .from('activity_log')
      .select('id, activity_type, title, points_earned, created_at')
      .eq('child_profile_id', childProfileId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching activity log:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getRecentActivity:', error);
    return [];
  }
}

// =====================================================
// LEARNING PROGRESS
// =====================================================

export async function trackLearningProgress(
  childProfileId: string,
  contentType: 'article' | 'video' | 'tip' | 'module',
  contentId: string,
  contentTitle: string,
  completed: boolean = false
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('learning_progress')
      .upsert({
        child_profile_id: childProfileId,
        content_type: contentType,
        content_id: contentId,
        completed,
        progress_percentage: completed ? 100 : 0,
        completed_at: completed ? new Date().toISOString() : null,
      }, {
        onConflict: 'child_profile_id,content_type,content_id',
      });

    if (error) {
      console.error('Error tracking learning progress:', error);
      return false;
    }

    // Award points for completion
    if (completed) {
      const pointsMap: Record<typeof contentType, number> = {
        article: 10,
        video: 15,
        tip: 5,
        module: 15,
      };
      
      // Map content types to valid activity types
      const activityTypeMap: Record<typeof contentType, string> = {
        article: 'article_read',
        video: 'article_read',
        tip: 'article_read',
        module: 'article_read',
      };
      
      await awardPoints(
        childProfileId,
        pointsMap[contentType],
        activityTypeMap[contentType],
        contentTitle
      );
    }

    return true;
  } catch (error) {
    console.error('Error in trackLearningProgress:', error);
    return false;
  }
}

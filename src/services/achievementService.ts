import { supabase } from '../lib/supabase';

export type AchievementCategory = 'routine' | 'products' | 'learning' | 'social' | 'special';
export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  icon: string;
  points: number;
  requirement: number;
  requirement_type: 'count' | 'streak' | 'total' | 'unique';
  created_at: string;
}

export interface UserAchievement {
  id: string;
  child_profile_id: string;
  achievement_id: string;
  progress: number;
  unlocked: boolean;
  unlocked_at?: string;
  achievement?: Achievement;
}

export interface LeaderboardEntry {
  id: string;
  child_profile_id: string;
  username: string;
  avatar_emoji: string;
  total_points: number;
  level: number;
  rank: number;
  achievements_count: number;
  weekly_points: number;
}

class AchievementService {
  // Get all achievements
  async getAllAchievements(): Promise<Achievement[]> {
    try {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .order('category', { ascending: true })
        .order('points', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching achievements:', error);
      return [];
    }
  }

  // Get user achievements with progress
  async getUserAchievements(childProfileId: string): Promise<UserAchievement[]> {
    try {
      const { data, error } = await supabase
        .from('user_achievements')
        .select(`
          *,
          achievement:achievements(*)
        `)
        .eq('child_profile_id', childProfileId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user achievements:', error);
      return [];
    }
  }

  // Update achievement progress
  async updateProgress(
    childProfileId: string,
    achievementId: string,
    progress: number
  ): Promise<UserAchievement | null> {
    try {
      // First check if user achievement exists
      const { data: existing } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('child_profile_id', childProfileId)
        .eq('achievement_id', achievementId)
        .single();

      if (existing) {
        // Update existing
        const { data, error } = await supabase
          .from('user_achievements')
          .update({
            progress,
            unlocked: progress >= existing.achievement?.requirement,
            unlocked_at: progress >= existing.achievement?.requirement ? new Date().toISOString() : null
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new
        const { data: achievement } = await supabase
          .from('achievements')
          .select('*')
          .eq('id', achievementId)
          .single();

        const { data, error } = await supabase
          .from('user_achievements')
          .insert({
            child_profile_id: childProfileId,
            achievement_id: achievementId,
            progress,
            unlocked: progress >= (achievement?.requirement || 0),
            unlocked_at: progress >= (achievement?.requirement || 0) ? new Date().toISOString() : null
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    } catch (error) {
      console.error('Error updating achievement progress:', error);
      return null;
    }
  }

  // Unlock achievement
  async unlockAchievement(childProfileId: string, achievementId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_achievements')
        .upsert({
          child_profile_id: childProfileId,
          achievement_id: achievementId,
          unlocked: true,
          unlocked_at: new Date().toISOString(),
          progress: 100
        });

      if (error) throw error;

      // Update user's total points
      await this.updateUserPoints(childProfileId);
      
      return true;
    } catch (error) {
      console.error('Error unlocking achievement:', error);
      return false;
    }
  }

  // Get leaderboard
  async getLeaderboard(timeframe: 'weekly' | 'monthly' | 'all'): Promise<LeaderboardEntry[]> {
    try {
      // For simplicity, we'll fetch all users with their achievement points
      const { data: profiles, error } = await supabase
        .from('child_profiles')
        .select(`
          id,
          first_name,
          avatar_emoji,
          user_achievements(
            achievement:achievements(points)
          )
        `)
        .limit(50);

      if (error) throw error;

      // Calculate points and create leaderboard
      const leaderboard = (profiles || []).map(profile => {
        const totalPoints = profile.user_achievements?.reduce((sum: number, ua: any) => {
          return sum + (ua.unlocked ? ua.achievement?.points || 0 : 0);
        }, 0) || 0;

        const level = Math.floor(totalPoints / 100) + 1;

        return {
          id: profile.id,
          child_profile_id: profile.id,
          username: profile.first_name,
          avatar_emoji: profile.avatar_emoji || '👤',
          total_points: totalPoints,
          level,
          rank: 0,
          achievements_count: profile.user_achievements?.filter((ua: any) => ua.unlocked).length || 0,
          weekly_points: totalPoints // Simplified - would need date filtering for real weekly points
        };
      });

      // Sort by points and assign ranks
      leaderboard.sort((a, b) => b.total_points - a.total_points);
      leaderboard.forEach((entry, index) => {
        entry.rank = index + 1;
      });

      return leaderboard;
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      return [];
    }
  }

  // Update user's total points
  private async updateUserPoints(childProfileId: string): Promise<void> {
    try {
      const { data } = await supabase
        .from('user_achievements')
        .select(`
          achievement:achievements(points)
        `)
        .eq('child_profile_id', childProfileId)
        .eq('unlocked', true);

      const totalPoints = (data || []).reduce((sum, ua) => {
        return sum + (ua.achievement?.points || 0);
      }, 0);

      // Update child profile with total points
      await supabase
        .from('child_profiles')
        .update({
          total_achievement_points: totalPoints,
          level: Math.floor(totalPoints / 100) + 1
        })
        .eq('id', childProfileId);
    } catch (error) {
      console.error('Error updating user points:', error);
    }
  }

  // Check and update achievements based on actions
  async checkAchievements(
    childProfileId: string,
    action: {
      type: 'routine_completed' | 'product_scanned' | 'lesson_completed' | 'friend_added' | 'streak_maintained';
      value?: number;
    }
  ): Promise<UserAchievement[]> {
    const newlyUnlocked: UserAchievement[] = [];

    try {
      // Get all achievements for this action type
      const { data: achievements } = await supabase
        .from('achievements')
        .select('*');

      if (!achievements) return [];

      // Check each achievement
      for (const achievement of achievements) {
        let shouldUpdate = false;
        let newProgress = 0;

        // Check based on action type
        switch (action.type) {
          case 'routine_completed':
            if (achievement.category === 'routine') {
              shouldUpdate = true;
              newProgress = action.value || 1;
            }
            break;
          case 'product_scanned':
            if (achievement.category === 'products') {
              shouldUpdate = true;
              newProgress = action.value || 1;
            }
            break;
          case 'lesson_completed':
            if (achievement.category === 'learning') {
              shouldUpdate = true;
              newProgress = action.value || 1;
            }
            break;
          case 'streak_maintained':
            if (achievement.requirement_type === 'streak') {
              shouldUpdate = true;
              newProgress = action.value || 1;
            }
            break;
        }

        if (shouldUpdate) {
          const updated = await this.updateProgress(childProfileId, achievement.id, newProgress);
          if (updated && updated.unlocked && !updated.unlocked_at) {
            newlyUnlocked.push(updated);
          }
        }
      }

      return newlyUnlocked;
    } catch (error) {
      console.error('Error checking achievements:', error);
      return [];
    }
  }

  // Get achievement stats
  async getAchievementStats(childProfileId: string): Promise<{
    total_unlocked: number;
    total_points: number;
    completion_percentage: number;
    rarity_breakdown: Record<AchievementRarity, number>;
  }> {
    try {
      const userAchievements = await this.getUserAchievements(childProfileId);
      const allAchievements = await this.getAllAchievements();

      const unlocked = userAchievements.filter(ua => ua.unlocked);
      const totalPoints = unlocked.reduce((sum, ua) => sum + (ua.achievement?.points || 0), 0);
      
      const rarityBreakdown: Record<AchievementRarity, number> = {
        common: 0,
        rare: 0,
        epic: 0,
        legendary: 0
      };

      unlocked.forEach(ua => {
        if (ua.achievement?.rarity) {
          rarityBreakdown[ua.achievement.rarity]++;
        }
      });

      return {
        total_unlocked: unlocked.length,
        total_points: totalPoints,
        completion_percentage: (unlocked.length / allAchievements.length) * 100,
        rarity_breakdown: rarityBreakdown
      };
    } catch (error) {
      console.error('Error getting achievement stats:', error);
      return {
        total_unlocked: 0,
        total_points: 0,
        completion_percentage: 0,
        rarity_breakdown: { common: 0, rare: 0, epic: 0, legendary: 0 }
      };
    }
  }
}

export const achievementService = new AchievementService();

/**
 * Family Circle Service
 * Manages kid-safe social features for sharing achievements with family
 */

import { supabase } from '../../../lib/supabase';

/**
 * Share an achievement with family circle
 */
export async function shareAchievement(
  childProfileId: string,
  achievementId: string,
  message?: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('achievement_shares')
      .insert({
        child_profile_id: childProfileId,
        achievement_id: achievementId,
        shared_with_circle: true,
        message: message || null,
      });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error sharing achievement:', error);
    return false;
  }
}

/**
 * Share a streak milestone with family circle
 */
export async function shareStreakMilestone(
  childProfileId: string,
  streakDays: number,
  streakType: string = 'daily',
  message?: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('streak_celebrations')
      .insert({
        child_profile_id: childProfileId,
        streak_days: streakDays,
        streak_type: streakType,
        shared_with_circle: true,
        celebration_message: message || null,
      });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error sharing streak:', error);
    return false;
  }
}

/**
 * Get family circle members for a child
 */
export async function getFamilyCircle(childProfileId: string) {
  try {
    const { data, error } = await supabase
      .from('family_circle')
      .select('*')
      .eq('child_profile_id', childProfileId)
      .eq('status', 'approved')
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching family circle:', error);
    return [];
  }
}

/**
 * Get shared achievements for a child
 */
export async function getSharedAchievements(childProfileId: string) {
  try {
    const { data, error } = await supabase
      .from('achievement_shares')
      .select(`
        *,
        achievement:user_achievements(*)
      `)
      .eq('child_profile_id', childProfileId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching shared achievements:', error);
    return [];
  }
}

/**
 * Get shared streak celebrations for a child
 */
export async function getSharedStreaks(childProfileId: string) {
  try {
    const { data, error } = await supabase
      .from('streak_celebrations')
      .select('*')
      .eq('child_profile_id', childProfileId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching shared streaks:', error);
    return [];
  }
}

/**
 * Get achievement share status and reaction counts
 */
export async function getAchievementShareStatus(childProfileId: string, achievementId: string) {
  try {
    // Get share record
    const { data: shareData, error: shareError } = await supabase
      .from('achievement_shares')
      .select('id')
      .eq('child_profile_id', childProfileId)
      .eq('achievement_id', achievementId)
      .single();

    if (shareError || !shareData) {
      return { isShared: false, reactionCount: 0 };
    }

    // Get reaction count
    const { count, error: countError } = await supabase
      .from('family_reactions')
      .select('*', { count: 'exact', head: true })
      .eq('share_id', shareData.id)
      .eq('share_type', 'achievement');

    if (countError) throw countError;

    return {
      isShared: true,
      reactionCount: count || 0,
      shareId: shareData.id
    };
  } catch (error) {
    console.error('Error getting achievement share status:', error);
    return { isShared: false, reactionCount: 0 };
  }
}

/**
 * Get share status for multiple achievements at once
 */
export async function getBulkAchievementShareStatus(childProfileId: string, achievementIds: string[]) {
  try {
    // Get all shares for these achievements
    const { data: shares, error: shareError } = await supabase
      .from('achievement_shares')
      .select('id, achievement_id')
      .eq('child_profile_id', childProfileId)
      .in('achievement_id', achievementIds);

    if (shareError) throw shareError;

    if (!shares || shares.length === 0) {
      return {};
    }

    // Get reaction counts for all shares
    const shareIds = shares.map(s => s.id);
    const { data: reactions, error: reactionError } = await supabase
      .from('family_reactions')
      .select('share_id')
      .in('share_id', shareIds)
      .eq('share_type', 'achievement');

    if (reactionError) throw reactionError;

    // Count reactions per share
    const reactionCounts: Record<string, number> = {};
    reactions?.forEach(r => {
      reactionCounts[r.share_id] = (reactionCounts[r.share_id] || 0) + 1;
    });

    // Map back to achievement IDs
    const result: Record<string, { isShared: boolean; reactionCount: number }> = {};
    shares.forEach(share => {
      result[share.achievement_id] = {
        isShared: true,
        reactionCount: reactionCounts[share.id] || 0
      };
    });

    return result;
  } catch (error) {
    console.error('Error getting bulk achievement share status:', error);
    return {};
  }
}

/**
 * Get detailed reactions for a shared achievement
 */
export async function getAchievementReactions(childProfileId: string, achievementId: string) {
  try {
    // Get share record
    const { data: shareData, error: shareError } = await supabase
      .from('achievement_shares')
      .select('id')
      .eq('child_profile_id', childProfileId)
      .eq('achievement_id', achievementId)
      .single();

    if (shareError || !shareData) {
      return [];
    }

    // Get reactions with family member details
    const { data: reactions, error: reactionsError } = await supabase
      .from('family_reactions')
      .select(`
        id,
        reaction_type,
        created_at,
        family_circle_id
      `)
      .eq('share_id', shareData.id)
      .eq('share_type', 'achievement')
      .order('created_at', { ascending: false });

    if (reactionsError) throw reactionsError;

    // Get family member details for each reaction
    if (reactions && reactions.length > 0) {
      const familyCircleIds = reactions.map(r => r.family_circle_id);
      const { data: members, error: membersError } = await supabase
        .from('family_circle')
        .select('id, family_member_name, relationship, family_member_email')
        .in('id', familyCircleIds)
        .eq('child_profile_id', childProfileId);

      if (membersError) throw membersError;

      // Map member details to reactions
      const memberMap = new Map(members?.map(m => [m.id, { 
        ...m, 
        display_name: m.family_member_name 
      }]) || []);
      
      return reactions.map(r => ({
        ...r,
        member: memberMap.get(r.family_circle_id) || null
      }));
    }

    return [];
  } catch (error) {
    console.error('Error getting achievement reactions:', error);
    return [];
  }
}

/**
 * Add a family reaction to a shared achievement
 */
export async function addFamilyReaction(
  shareId: string,
  familyCircleId: string,
  reactionType: 'celebrate' | 'proud' | 'awesome' | 'keep_going'
): Promise<boolean> {
  try {
    const { data: reaction, error } = await supabase
      .from('family_reactions')
      .insert({
        share_id: shareId,
        share_type: 'achievement',
        family_circle_id: familyCircleId,
        reaction_type: reactionType,
      })
      .select('id')
      .single();

    if (error) throw error;

    // Get notification data and send notification
    if (reaction) {
      const { data: notifData, error: notifError } = await supabase
        .rpc('get_family_reaction_notification_data', { p_reaction_id: reaction.id });

      if (!notifError && notifData) {
        const { sendFamilyReactionNotification } = await import('./notificationsService');
        await sendFamilyReactionNotification(
          notifData.child_user_id,
          notifData.family_member_name,
          notifData.achievement_title,
          notifData.reaction_type,
          notifData.achievement_id
        );
      }
    }

    return true;
  } catch (error) {
    console.error('Error adding family reaction:', error);
    return false;
  }
}

/**
 * Pre-approved celebration messages for achievements
 */
export const CELEBRATION_MESSAGES = {
  achievement: [
    "I did it! 🌟",
    "Look what I achieved! 🎉",
    "I'm so proud of myself! 💪",
    "Check out my progress! ⭐",
    "I worked really hard for this! 🚀",
  ],
  streak: [
    "Your dedication is inspiring! 🔥",
    "Keep that streak going! You've got this! 💪",
    "So proud of your consistency! 🌟",
    "Amazing work staying on track! 🎯",
    "You're crushing it! Keep going! 🚀",
  ],
};

/**
 * Pre-approved reaction types
 */
export const REACTION_TYPES = {
  celebrate: { emoji: '🎉', label: 'Celebrate' },
  proud: { emoji: '🌟', label: 'Proud' },
  awesome: { emoji: '💪', label: 'Awesome' },
  keep_going: { emoji: '🚀', label: 'Keep Going' },
};

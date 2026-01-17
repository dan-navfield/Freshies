import { supabase } from '../lib/supabase';

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastCompletionDate: string | null;
}

/**
 * Calculate the current streak for a child's routine completions
 */
export async function calculateStreak(
  childProfileId: string,
  routineId: string
): Promise<StreakData> {
  try {
    // Get all completion dates for this routine, ordered by date descending
    const { data: completions, error } = await supabase
      .from('routine_step_completions')
      .select('completion_date')
      .eq('routine_id', routineId)
      .order('completion_date', { ascending: false });

    if (error) throw error;

    if (!completions || completions.length === 0) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        lastCompletionDate: null,
      };
    }

    // Get unique dates
    const uniqueDates = Array.from(
      new Set(completions.map(c => c.completion_date))
    ).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    // Calculate current streak
    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < uniqueDates.length; i++) {
      const completionDate = new Date(uniqueDates[i]);
      completionDate.setHours(0, 0, 0, 0);

      const expectedDate = new Date(today);
      expectedDate.setDate(expectedDate.getDate() - i);
      expectedDate.setHours(0, 0, 0, 0);

      if (completionDate.getTime() === expectedDate.getTime()) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Calculate longest streak
    let longestStreak = 0;
    let tempStreak = 1;

    for (let i = 0; i < uniqueDates.length - 1; i++) {
      const currentDate = new Date(uniqueDates[i]);
      const nextDate = new Date(uniqueDates[i + 1]);
      
      const dayDiff = Math.floor(
        (currentDate.getTime() - nextDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (dayDiff === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    return {
      currentStreak,
      longestStreak,
      lastCompletionDate: uniqueDates[0] || null,
    };
  } catch (error) {
    console.error('Error calculating streak:', error);
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastCompletionDate: null,
    };
  }
}

/**
 * Get streak data for all routines for a child
 */
export async function getAllStreaks(
  childProfileId: string
): Promise<Record<string, StreakData>> {
  try {
    // Get all routines for this child
    const { data: routines, error } = await supabase
      .from('custom_routines')
      .select('id')
      .eq('child_profile_id', childProfileId);

    if (error) throw error;

    const streaks: Record<string, StreakData> = {};

    for (const routine of routines || []) {
      streaks[routine.id] = await calculateStreak(childProfileId, routine.id);
    }

    return streaks;
  } catch (error) {
    console.error('Error getting all streaks:', error);
    return {};
  }
}

/**
 * Award points for completing a routine
 */
export async function awardRoutinePoints(
  childProfileId: string,
  routineId: string,
  stepCount: number
): Promise<number> {
  try {
    const pointsPerStep = 10;
    const basePoints = stepCount * pointsPerStep;
    
    // Get streak for bonus points
    const streak = await calculateStreak(childProfileId, routineId);
    
    // Bonus points for streaks
    let bonusPoints = 0;
    if (streak.currentStreak >= 7) {
      bonusPoints = 50; // Week streak bonus
    } else if (streak.currentStreak >= 3) {
      bonusPoints = 20; // 3-day streak bonus
    }

    const totalPoints = basePoints + bonusPoints;

    // Update child profile points
    const { data: profile } = await supabase
      .from('child_profiles')
      .select('points')
      .eq('id', childProfileId)
      .single();

    if (profile) {
      await supabase
        .from('child_profiles')
        .update({ points: (profile.points || 0) + totalPoints })
        .eq('id', childProfileId);
    }

    return totalPoints;
  } catch (error) {
    console.error('Error awarding points:', error);
    return stepCount * 10; // Return base points as fallback
  }
}

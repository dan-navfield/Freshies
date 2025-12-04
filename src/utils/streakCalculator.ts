/**
 * Streak Calculator
 * Calculates routine completion streaks for children
 */

import { supabase } from '../../lib/supabase';

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
  completionRate: number; // percentage
  lastCompletedDate: string | null;
}

export interface DailyCompletion {
  date: string;
  morning: boolean;
  afternoon: boolean;
  evening: boolean;
  totalSteps: number;
  completedSteps: number;
}

/**
 * Calculate the current streak for a child
 */
export async function calculateStreak(childProfileId: string): Promise<StreakData> {
  try {
    // Get all step completions for the child, grouped by date
    const { data: completions, error } = await supabase
      .from('routine_step_completions')
      .select('completion_date, created_at')
      .eq('child_profile_id', childProfileId)
      .order('completion_date', { ascending: false });

    if (error) throw error;

    if (!completions || completions.length === 0) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        totalCompletions: 0,
        completionRate: 0,
        lastCompletedDate: null,
      };
    }

    // Group completions by date (count unique dates with activity)
    const completionsByDate = new Map<string, number>();
    completions.forEach((c) => {
      const date = c.completion_date;
      completionsByDate.set(date, (completionsByDate.get(date) || 0) + 1);
    });

    // Convert to sorted array of dates
    const dates = Array.from(completionsByDate.keys()).sort((a, b) => 
      new Date(b).getTime() - new Date(a).getTime()
    );

    // Calculate current streak
    let currentStreak = 0;
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // Check if there's activity today or yesterday (grace period)
    if (dates[0] === today || dates[0] === yesterday) {
      currentStreak = 1;
      let checkDate = new Date(dates[0]);

      for (let i = 1; i < dates.length; i++) {
        const expectedDate = new Date(checkDate);
        expectedDate.setDate(expectedDate.getDate() - 1);
        const expectedDateStr = expectedDate.toISOString().split('T')[0];

        if (dates[i] === expectedDateStr) {
          currentStreak++;
          checkDate = new Date(dates[i]);
        } else {
          break;
        }
      }
    }

    // Calculate longest streak
    let longestStreak = 0;
    let tempStreak = 1;

    for (let i = 0; i < dates.length - 1; i++) {
      const currentDate = new Date(dates[i]);
      const nextDate = new Date(dates[i + 1]);
      const dayDiff = Math.floor(
        (currentDate.getTime() - nextDate.getTime()) / 86400000
      );

      if (dayDiff === 1) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    // Calculate completion rate (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
    const recentCompletions = dates.filter(
      (date) => new Date(date) >= thirtyDaysAgo
    );
    const completionRate = Math.round((recentCompletions.length / 30) * 100);

    return {
      currentStreak,
      longestStreak,
      totalCompletions: completions.length,
      completionRate,
      lastCompletedDate: dates[0] || null,
    };
  } catch (error) {
    console.error('Error calculating streak:', error);
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalCompletions: 0,
      completionRate: 0,
      lastCompletedDate: null,
    };
  }
}

/**
 * Get daily completion summary for a date range
 */
export async function getDailyCompletions(
  childProfileId: string,
  startDate: string,
  endDate: string
): Promise<DailyCompletion[]> {
  try {
    // Get all routine steps for the child
    const { data: routine, error: routineError } = await supabase
      .from('child_routines')
      .select('id')
      .eq('child_profile_id', childProfileId)
      .eq('is_active', true)
      .single();

    if (routineError || !routine) {
      return [];
    }

    // Get all steps
    const { data: steps, error: stepsError } = await supabase
      .from('routine_steps')
      .select('id, segment')
      .eq('routine_id', routine.id)
      .eq('is_active', true);

    if (stepsError || !steps) {
      return [];
    }

    // Get completions in date range
    const { data: completions, error: completionsError } = await supabase
      .from('routine_step_completions')
      .select('completion_date, routine_id')
      .eq('child_profile_id', childProfileId)
      .gte('completion_date', startDate)
      .lte('completion_date', endDate);

    if (completionsError) {
      return [];
    }

    // Get routine info to determine segments
    const { data: routines } = await supabase
      .from('custom_routines')
      .select('id, segment')
      .eq('child_profile_id', childProfileId);

    const routineSegments = new Map(routines?.map(r => [r.id, r.segment]) || []);

    // Group by date
    const dailyMap = new Map<string, DailyCompletion>();
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Initialize all dates
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      dailyMap.set(dateStr, {
        date: dateStr,
        morning: false,
        afternoon: false,
        evening: false,
        totalSteps: steps.length,
        completedSteps: 0,
      });
    }

    // Fill in completions
    completions?.forEach((c) => {
      const dateStr = c.completion_date;
      const daily = dailyMap.get(dateStr);
      const segment = routineSegments.get(c.routine_id);
      if (daily) {
        daily.completedSteps++;
        if (segment === 'morning') daily.morning = true;
        if (segment === 'afternoon') daily.afternoon = true;
        if (segment === 'evening') daily.evening = true;
      }
    });

    return Array.from(dailyMap.values()).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  } catch (error) {
    console.error('Error getting daily completions:', error);
    return [];
  }
}

/**
 * Check if a specific segment is complete for today
 */
export async function isSegmentComplete(
  childProfileId: string,
  segment: 'morning' | 'afternoon' | 'evening'
): Promise<boolean> {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Get active routine
    const { data: routine } = await supabase
      .from('child_routines')
      .select('id')
      .eq('child_profile_id', childProfileId)
      .eq('is_active', true)
      .single();

    if (!routine) return false;

    // Get total steps for this segment
    const { data: steps } = await supabase
      .from('routine_steps')
      .select('id')
      .eq('routine_id', routine.id)
      .eq('segment', segment)
      .eq('is_active', true);

    if (!steps || steps.length === 0) return false;

    // Get completed steps for today for this segment's routine
    const { data: segmentRoutine } = await supabase
      .from('custom_routines')
      .select('id')
      .eq('child_profile_id', childProfileId)
      .eq('segment', segment)
      .eq('is_active', true)
      .single();

    if (!segmentRoutine) return false;

    const { data: completions } = await supabase
      .from('routine_step_completions')
      .select('id')
      .eq('child_profile_id', childProfileId)
      .eq('routine_id', segmentRoutine.id)
      .eq('completion_date', today);

    return (completions?.length || 0) >= steps.length;
  } catch (error) {
    console.error('Error checking segment completion:', error);
    return false;
  }
}

/**
 * Get streak milestone messages
 */
export function getStreakMessage(streak: number): string {
  if (streak === 0) return "Start your streak today!";
  if (streak === 1) return "Great start! Keep it going!";
  if (streak === 3) return "3 days strong! You're building a habit! 💪";
  if (streak === 7) return "One week streak! Amazing! 🎉";
  if (streak === 14) return "Two weeks! You're unstoppable! 🔥";
  if (streak === 30) return "30 days! You're a skincare superstar! ⭐";
  if (streak === 60) return "60 days! Incredible dedication! 🏆";
  if (streak === 100) return "100 days! You're a legend! 👑";
  
  if (streak >= 7) return `${streak} day streak! Keep it up! 🔥`;
  return `${streak} days in a row! Great job! ✨`;
}

/**
 * Get streak emoji based on count
 */
export function getStreakEmoji(streak: number): string {
  if (streak === 0) return "💤";
  if (streak < 3) return "🌱";
  if (streak < 7) return "🌿";
  if (streak < 14) return "🔥";
  if (streak < 30) return "⚡";
  if (streak < 60) return "💎";
  if (streak < 100) return "🏆";
  return "👑";
}

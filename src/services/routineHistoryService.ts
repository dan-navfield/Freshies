import { supabase } from '../lib/supabase';

export interface DailyCompletionSummary {
  completion_date: string;
  routines_completed: number;
  total_steps_completed: number;
  total_xp: number;
}

export interface RoutineCompletionDetail {
  completion_date: string;
  routine_id: string;
  routine_name: string;
  segment: 'morning' | 'afternoon' | 'evening';
  routine_step_id: string;
  xp_earned: number;
  created_at: string;
}

export interface CalendarDayData {
  completion_date: string;
  activity_count: number;
  xp_earned: number;
  activity_level: 'none' | 'low' | 'medium' | 'high';
}

export interface StreakInfo {
  streak_start: string;
  streak_end: string;
  streak_days: number;
}

export interface MonthlyStats {
  month: string;
  active_days: number;
  unique_routines: number;
  total_steps_completed: number;
  total_xp: number;
  avg_xp_per_step: number;
}

export interface SegmentStats {
  segment: 'morning' | 'afternoon' | 'evening';
  days_completed: number;
  total_steps: number;
  total_xp: number;
}

export const routineHistoryService = {
  /**
   * Get all completions for a specific day
   */
  async getCompletionsForDay(
    childProfileId: string,
    date: string
  ): Promise<RoutineCompletionDetail[]> {
    const { data, error } = await supabase
      .from('routine_step_completions')
      .select(`
        completion_date,
        routine_id,
        routine_step_id,
        xp_earned,
        created_at,
        custom_routines (
          name,
          segment
        )
      `)
      .eq('child_profile_id', childProfileId)
      .eq('completion_date', date)
      .order('created_at');

    if (error) throw error;

    return (data || []).map(item => ({
      completion_date: item.completion_date,
      routine_id: item.routine_id,
      routine_name: (item.custom_routines as any)?.name || 'Unknown',
      segment: (item.custom_routines as any)?.segment || 'morning',
      routine_step_id: item.routine_step_id,
      xp_earned: item.xp_earned,
      created_at: item.created_at,
    }));
  },

  /**
   * Get daily completion summary for a date range (for calendar view)
   */
  async getDailySummary(
    childProfileId: string,
    startDate: string,
    endDate: string
  ): Promise<DailyCompletionSummary[]> {
    const { data, error } = await supabase.rpc('get_daily_completion_summary', {
      p_child_profile_id: childProfileId,
      p_start_date: startDate,
      p_end_date: endDate,
    });

    if (error) {
      // Fallback to manual query if RPC doesn't exist
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('routine_step_completions')
        .select('completion_date, routine_id, xp_earned')
        .eq('child_profile_id', childProfileId)
        .gte('completion_date', startDate)
        .lte('completion_date', endDate);

      if (fallbackError) throw fallbackError;

      // Group by date
      const grouped = (fallbackData || []).reduce((acc, item) => {
        const date = item.completion_date;
        if (!acc[date]) {
          acc[date] = {
            completion_date: date,
            routines_completed: new Set(),
            total_steps_completed: 0,
            total_xp: 0,
          };
        }
        acc[date].routines_completed.add(item.routine_id);
        acc[date].total_steps_completed += 1;
        acc[date].total_xp += item.xp_earned;
        return acc;
      }, {} as Record<string, any>);

      return Object.values(grouped).map(item => ({
        ...item,
        routines_completed: item.routines_completed.size,
      }));
    }

    return data || [];
  },

  /**
   * Get calendar heatmap data (activity intensity per day)
   */
  async getCalendarHeatmap(
    childProfileId: string,
    days: number = 90
  ): Promise<CalendarDayData[]> {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    const { data, error } = await supabase
      .from('routine_step_completions')
      .select('completion_date, xp_earned')
      .eq('child_profile_id', childProfileId)
      .gte('completion_date', startDate)
      .lte('completion_date', endDate);

    if (error) throw error;

    // Group by date and calculate activity level
    const grouped = (data || []).reduce((acc, item) => {
      const date = item.completion_date;
      if (!acc[date]) {
        acc[date] = {
          completion_date: date,
          activity_count: 0,
          xp_earned: 0,
        };
      }
      acc[date].activity_count += 1;
      acc[date].xp_earned += item.xp_earned;
      return acc;
    }, {} as Record<string, any>);

    return Object.values(grouped).map(item => ({
      ...item,
      activity_level:
        item.activity_count >= 10
          ? 'high'
          : item.activity_count >= 5
          ? 'medium'
          : item.activity_count >= 1
          ? 'low'
          : 'none',
    }));
  },

  /**
   * Get current streak information
   */
  async getCurrentStreak(childProfileId: string): Promise<StreakInfo | null> {
    // Get all unique dates with activity
    const { data, error } = await supabase
      .from('routine_step_completions')
      .select('completion_date')
      .eq('child_profile_id', childProfileId)
      .order('completion_date', { ascending: false });

    if (error) throw error;
    if (!data || data.length === 0) return null;

    // Get unique dates
    const uniqueDates = [...new Set(data.map(d => d.completion_date))].sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime()
    );

    // Calculate streak
    let streakDays = 0;
    const today = new Date().toISOString().split('T')[0];
    let currentDate = new Date(today);

    for (const dateStr of uniqueDates) {
      const checkDate = currentDate.toISOString().split('T')[0];
      if (dateStr === checkDate) {
        streakDays++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    if (streakDays === 0) return null;

    const streakEnd = uniqueDates[0];
    const streakStart = uniqueDates[streakDays - 1];

    return {
      streak_start: streakStart,
      streak_end: streakEnd,
      streak_days: streakDays,
    };
  },

  /**
   * Get monthly statistics
   */
  async getMonthlyStats(
    childProfileId: string,
    year: number,
    month: number
  ): Promise<MonthlyStats | null> {
    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('routine_step_completions')
      .select('completion_date, routine_id, xp_earned')
      .eq('child_profile_id', childProfileId)
      .gte('completion_date', startDate)
      .lte('completion_date', endDate);

    if (error) throw error;
    if (!data || data.length === 0) return null;

    const uniqueDates = new Set(data.map(d => d.completion_date));
    const uniqueRoutines = new Set(data.map(d => d.routine_id));
    const totalXp = data.reduce((sum, d) => sum + d.xp_earned, 0);

    return {
      month: `${year}-${month.toString().padStart(2, '0')}`,
      active_days: uniqueDates.size,
      unique_routines: uniqueRoutines.size,
      total_steps_completed: data.length,
      total_xp: totalXp,
      avg_xp_per_step: Math.round((totalXp / data.length) * 10) / 10,
    };
  },

  /**
   * Get stats by segment (morning/afternoon/evening)
   */
  async getSegmentStats(
    childProfileId: string,
    days: number = 30
  ): Promise<SegmentStats[]> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    const { data, error } = await supabase
      .from('routine_step_completions')
      .select(`
        completion_date,
        xp_earned,
        custom_routines (
          segment
        )
      `)
      .eq('child_profile_id', childProfileId)
      .gte('completion_date', startDate);

    if (error) throw error;

    // Group by segment
    const grouped = (data || []).reduce((acc, item) => {
      const segment = (item.custom_routines as any)?.segment || 'morning';
      if (!acc[segment]) {
        acc[segment] = {
          segment,
          days_completed: new Set(),
          total_steps: 0,
          total_xp: 0,
        };
      }
      acc[segment].days_completed.add(item.completion_date);
      acc[segment].total_steps += 1;
      acc[segment].total_xp += item.xp_earned;
      return acc;
    }, {} as Record<string, any>);

    return Object.values(grouped).map(item => ({
      ...item,
      days_completed: item.days_completed.size,
    }));
  },

  /**
   * Get specific routine's completion history
   */
  async getRoutineHistory(
    routineId: string,
    childProfileId: string,
    days: number = 30
  ): Promise<Array<{
    completion_date: string;
    steps_completed: number;
    total_steps: number;
    xp_earned: number;
    fully_completed: boolean;
  }>> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    const { data: completions, error: completionsError } = await supabase
      .from('routine_step_completions')
      .select('completion_date, xp_earned')
      .eq('routine_id', routineId)
      .eq('child_profile_id', childProfileId)
      .gte('completion_date', startDate);

    if (completionsError) throw completionsError;

    const { data: routine, error: routineError } = await supabase
      .from('custom_routines')
      .select('steps')
      .eq('id', routineId)
      .single();

    if (routineError) throw routineError;

    const totalSteps = Array.isArray(routine.steps) ? routine.steps.length : 0;

    // Group by date
    const grouped = (completions || []).reduce((acc, item) => {
      const date = item.completion_date;
      if (!acc[date]) {
        acc[date] = {
          completion_date: date,
          steps_completed: 0,
          xp_earned: 0,
        };
      }
      acc[date].steps_completed += 1;
      acc[date].xp_earned += item.xp_earned;
      return acc;
    }, {} as Record<string, any>);

    return Object.values(grouped).map(item => ({
      ...item,
      total_steps: totalSteps,
      fully_completed: item.steps_completed === totalSteps,
    }));
  },
};

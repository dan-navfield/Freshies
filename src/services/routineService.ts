import { supabase } from '../../lib/supabase';

export interface CustomRoutine {
  id: string;
  user_id: string;
  child_profile_id: string;
  name: string;
  segment: 'morning' | 'evening';
  steps: RoutineStepData[];
  total_duration: number;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  completion_count: number;
  last_completed_at?: string;
  active_days?: number[]; // Array of day indices (0=Monday, 1=Tuesday, ..., 6=Sunday)
  status?: 'draft' | 'active'; // Draft = incomplete/being built, Active = ready to use
}

export interface RoutineStepData {
  id: string;
  type: 'cleanser' | 'moisturizer' | 'sunscreen' | 'treatment' | 'serum';
  title: string;
  order: number;
  duration: number;
  product_id?: string;
  instructions: string[];
  tips?: string;
  is_completed?: boolean;
}

export interface RoutineCompletion {
  id: string;
  routine_id: string;
  child_profile_id: string;
  completed_at: string;
  total_time: number;
  steps_completed: number;
  steps_total: number;
  xp_earned: number;
}

class RoutineService {
  // Create a new custom routine
  async createRoutine(routine: Omit<CustomRoutine, 'id' | 'created_at' | 'updated_at'>): Promise<CustomRoutine | null> {
    try {
      const { data, error } = await supabase
        .from('custom_routines')
        .insert(routine)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating routine:', error);
      return null;
    }
  }

  // Get all routines for a child
  async getRoutines(childProfileId: string): Promise<CustomRoutine[]> {
    try {
      const { data, error } = await supabase
        .from('custom_routines')
        .select('*')
        .eq('child_profile_id', childProfileId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching routines:', error);
      return [];
    }
  }

  // Get active routine for a segment
  async getActiveRoutine(childProfileId: string, segment: 'morning' | 'evening'): Promise<CustomRoutine | null> {
    try {
      const { data, error } = await supabase
        .from('custom_routines')
        .select('*')
        .eq('child_profile_id', childProfileId)
        .eq('segment', segment)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
      return data;
    } catch (error) {
      console.error('Error fetching active routine:', error);
      return null;
    }
  }

  // Update routine
  async updateRoutine(routineId: string, updates: Partial<CustomRoutine>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('custom_routines')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', routineId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating routine:', error);
      return false;
    }
  }

  // Set routine as active (deactivate others for same segment)
  async setActiveRoutine(childProfileId: string, routineId: string, segment: 'morning' | 'afternoon' | 'evening'): Promise<boolean> {
    try {
      // First deactivate all routines for this segment
      await supabase
        .from('custom_routines')
        .update({ is_active: false })
        .eq('child_profile_id', childProfileId)
        .eq('segment', segment);

      // Then activate the selected routine
      const { error } = await supabase
        .from('custom_routines')
        .update({ is_active: true })
        .eq('id', routineId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error setting active routine:', error);
      return false;
    }
  }

  // Complete a routine
  async completeRoutine(
    routineId: string,
    childProfileId: string,
    completionData: {
      total_time: number;
      steps_completed: number;
      steps_total: number;
    }
  ): Promise<RoutineCompletion | null> {
    try {
      const xp_earned = Math.floor(completionData.steps_completed * 10 + (completionData.total_time / 60) * 5);

      const { data, error } = await supabase
        .from('routine_completions')
        .insert({
          routine_id: routineId,
          child_profile_id: childProfileId,
          completed_at: new Date().toISOString(),
          ...completionData,
          xp_earned
        })
        .select()
        .single();

      if (error) throw error;

      // Update routine completion count
      const { data: routine } = await supabase
        .from('custom_routines')
        .select('completion_count')
        .eq('id', routineId)
        .single();

      await supabase
        .from('custom_routines')
        .update({
          completion_count: (routine?.completion_count || 0) + 1,
          last_completed_at: new Date().toISOString()
        })
        .eq('id', routineId);

      return data;
    } catch (error) {
      console.error('Error completing routine:', error);
      return null;
    }
  }

  // Get routine statistics
  async getRoutineStats(childProfileId: string): Promise<{
    total_routines_completed: number;
    current_streak: number;
    total_xp_earned: number;
    average_completion_time: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('routine_completions')
        .select('*')
        .eq('child_profile_id', childProfileId)
        .order('completed_at', { ascending: false });

      if (error) throw error;

      const completions = data || [];
      
      // Calculate stats
      const total_routines_completed = completions.length;
      const total_xp_earned = completions.reduce((sum, c) => sum + c.xp_earned, 0);
      const average_completion_time = completions.length > 0
        ? completions.reduce((sum, c) => sum + c.total_time, 0) / completions.length
        : 0;

      // Calculate streak (simplified - counts consecutive days)
      let current_streak = 0;
      if (completions.length > 0) {
        const today = new Date().toDateString();
        const lastCompletion = new Date(completions[0].completed_at).toDateString();
        if (today === lastCompletion) {
          current_streak = 1;
          // Check previous days
          for (let i = 1; i < completions.length; i++) {
            const prevDate = new Date(completions[i].completed_at);
            const dayDiff = Math.floor((new Date(completions[i - 1].completed_at).getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
            if (dayDiff === 1) {
              current_streak++;
            } else {
              break;
            }
          }
        }
      }

      return {
        total_routines_completed,
        current_streak,
        total_xp_earned,
        average_completion_time
      };
    } catch (error) {
      console.error('Error fetching routine stats:', error);
      return {
        total_routines_completed: 0,
        current_streak: 0,
        total_xp_earned: 0,
        average_completion_time: 0
      };
    }
  }

  // Delete routine
  async deleteRoutine(routineId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('custom_routines')
        .delete()
        .eq('id', routineId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting routine:', error);
      return false;
    }
  }

  // Update active days for a routine
  async updateActiveDays(routineId: string, activeDays: number[]): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('custom_routines')
        .update({ active_days: activeDays })
        .eq('id', routineId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating active days:', error);
      return false;
    }
  }

  // Get routines active for today
  async getRoutinesForToday(childProfileId: string): Promise<CustomRoutine[]> {
    try {
      const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
      const dayIndex = today === 0 ? 6 : today - 1; // Convert to our format (0 = Monday)

      const { data, error } = await supabase
        .from('custom_routines')
        .select('*')
        .eq('child_profile_id', childProfileId)
        .eq('is_active', true)
        .contains('active_days', [dayIndex]);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching routines for today:', error);
      return [];
    }
  }
}

export const routineService = new RoutineService();

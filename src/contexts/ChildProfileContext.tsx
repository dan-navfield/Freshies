import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { ChildProfile, ChildGoal } from '../types/child';

interface ChildProfileContextType {
  childProfile: ChildProfile | null;
  goals: ChildGoal[];
  loading: boolean;
  error: string | null;
  isChildMode: boolean;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<ChildProfile>) => Promise<void>;
  addGoal: (goalType: string, priority: number) => Promise<void>;
  removeGoal: (goalId: string) => Promise<void>;
  updateGoal: (goalId: string, updates: Partial<ChildGoal>) => Promise<void>;
}

const ChildProfileContext = createContext<ChildProfileContextType | undefined>(undefined);

export function ChildProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [childProfile, setChildProfile] = useState<ChildProfile | null>(null);
  const [goals, setGoals] = useState<ChildGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user has a child profile (is in child mode)
  const isChildMode = childProfile !== null;

  const fetchProfile = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch child profile
      const { data: profileData, error: profileError } = await supabase
        .from('child_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // PGRST116 = no rows returned (user doesn't have child profile)
      // PGRST201/42P01 = table doesn't exist (not migrated yet)
      if (profileError && profileError.code !== 'PGRST116' && profileError.code !== '42P01') {
        console.warn('Child profile fetch error:', profileError);
        // Don't throw - just log and continue
      }

      setChildProfile(profileData);

      // If child profile exists, fetch goals
      if (profileData) {
        const { data: goalsData, error: goalsError } = await supabase
          .from('child_goals')
          .select('*')
          .eq('child_profile_id', profileData.id)
          .eq('is_active', true)
          .order('priority', { ascending: false });

        if (goalsError && goalsError.code !== '42P01') {
          console.warn('Child goals fetch error:', goalsError);
        }
        setGoals(goalsData || []);
      }
    } catch (err: any) {
      console.warn('Error fetching child profile:', err);
      // Don't set error - just log it and continue
      // This allows the app to work even if child tables don't exist yet
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    await fetchProfile();
  };

  const updateProfile = async (updates: Partial<ChildProfile>) => {
    if (!childProfile) return;

    try {
      const { data, error } = await supabase
        .from('child_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', childProfile.id)
        .select()
        .single();

      if (error) throw error;
      setChildProfile(data);
    } catch (err: any) {
      console.error('Error updating child profile:', err);
      throw err;
    }
  };

  const addGoal = async (goalType: string, priority: number = 3) => {
    if (!childProfile) return;

    try {
      const { data, error } = await supabase
        .from('child_goals')
        .insert({
          child_profile_id: childProfile.id,
          goal_type: goalType,
          priority,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      setGoals([...goals, data]);
    } catch (err: any) {
      console.error('Error adding goal:', err);
      throw err;
    }
  };

  const removeGoal = async (goalId: string) => {
    try {
      const { error } = await supabase
        .from('child_goals')
        .update({ is_active: false })
        .eq('id', goalId);

      if (error) throw error;
      setGoals(goals.filter(g => g.id !== goalId));
    } catch (err: any) {
      console.error('Error removing goal:', err);
      throw err;
    }
  };

  const updateGoal = async (goalId: string, updates: Partial<ChildGoal>) => {
    try {
      const { data, error } = await supabase
        .from('child_goals')
        .update(updates)
        .eq('id', goalId)
        .select()
        .single();

      if (error) throw error;
      setGoals(goals.map(g => g.id === goalId ? data : g));
    } catch (err: any) {
      console.error('Error updating goal:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const value = {
    childProfile,
    goals,
    loading,
    error,
    isChildMode,
    refreshProfile,
    updateProfile,
    addGoal,
    removeGoal,
    updateGoal,
  };

  return (
    <ChildProfileContext.Provider value={value}>
      {children}
    </ChildProfileContext.Provider>
  );
}

export function useChildProfile() {
  const context = useContext(ChildProfileContext);
  if (context === undefined) {
    throw new Error('useChildProfile must be used within a ChildProfileProvider');
  }
  return context;
}

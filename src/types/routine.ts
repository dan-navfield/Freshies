/**
 * Routine Management Types
 * Types for child skincare routines (AM/PM)
 */

export type RoutineType = 'morning' | 'evening';
export type StepCategory = 'cleanse' | 'treat' | 'moisturize' | 'protect' | 'other';

export interface RoutineStep {
  id: string;
  routine_id: string;
  step_order: number;
  category: StepCategory;
  product_name: string;
  product_brand?: string;
  product_image_url?: string;
  instructions?: string;
  wait_time?: number; // seconds
  is_optional: boolean;
  created_at: string;
  updated_at: string;
}

export interface Routine {
  id: string;
  child_id: string;
  routine_type: RoutineType;
  name: string;
  description?: string;
  is_active: boolean;
  last_completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface RoutineWithSteps extends Routine {
  steps: RoutineStep[];
  step_count: number;
  completion_rate?: number; // percentage
}

export interface RoutineCompletion {
  id: string;
  routine_id: string;
  child_id: string;
  completed_at: string;
  steps_completed: number;
  total_steps: number;
  duration_seconds?: number;
  notes?: string;
}

export interface RoutineStats {
  total_routines: number;
  active_routines: number;
  completions_this_week: number;
  completion_rate: number;
  streak_days: number;
  favorite_routine?: string;
}

// Step category configurations
export const STEP_CATEGORY_CONFIG = {
  cleanse: {
    label: 'Cleanse',
    icon: '🧼',
    color: '#BFF2E6',
    order: 1,
  },
  treat: {
    label: 'Treat',
    icon: '💧',
    color: '#E7D9FF',
    order: 2,
  },
  moisturize: {
    label: 'Moisturize',
    icon: '✨',
    color: '#FFDFB9',
    order: 3,
  },
  protect: {
    label: 'Protect',
    icon: '☀️',
    color: '#FF9500',
    order: 4,
  },
  other: {
    label: 'Other',
    icon: '🌟',
    color: '#8B7AB8',
    order: 5,
  },
} as const;

// Routine type configurations
export const ROUTINE_TYPE_CONFIG = {
  morning: {
    label: 'Morning Routine',
    icon: '🌅',
    color: '#FFDFB9',
    emoji: '☀️',
  },
  evening: {
    label: 'Evening Routine',
    icon: '🌙',
    color: '#E7D9FF',
    emoji: '🌙',
  },
} as const;

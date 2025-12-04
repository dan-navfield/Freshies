/**
 * Child App Types
 * Types for child profiles, skin profiles, goals, and related features
 */

/**
 * Age Bands for Child Profiles
 * 
 * 0-4: Parent-only mode (no child app)
 * 5-9: Parent-only mode (no child app)
 * 10-12: First child app tier (simple, parent-controlled)
 * 13-15: Full child app (moderate autonomy)
 * 16-18: Most autonomous (lighter parent controls)
 */
export type AgeBand = '0-4' | '5-9' | '10-12' | '13-15' | '16-18';

export type SkinType = 'oily' | 'dry' | 'combination' | 'normal' | 'sensitive';

export type SkinTypeSource = 'self_reported' | 'ai_analyzed' | 'parent_set';

export type AcneTendency = 'none' | 'mild' | 'moderate' | 'severe';

export type MakeupFrequency = 'none' | 'sometimes' | 'frequent';

export type ConcernSource = 'self_reported' | 'ai_analyzed' | 'parent_input';

export type OilinessZone = 't-zone' | 'cheeks' | 'forehead' | 'chin' | 'nose';

export type SkinConcern = 'acne' | 'redness' | 'dryness' | 'oiliness' | 'sensitivity' | 'dark_spots' | 'texture';

export type EnvironmentalFactor = 'high_sun' | 'indoor_heavy' | 'dry_air' | 'humid' | 'pollution';

export type TextureDislike = 'sticky' | 'greasy' | 'thick' | 'watery' | 'fragranced';

export type GoalType =
  | 'reduce_breakouts'
  | 'reduce_shine'
  | 'improve_hydration'
  | 'reduce_redness'
  | 'simple_routine'
  | 'improve_after_sport'
  | 'feel_confident';

export type WishlistStatus = 'pending' | 'approved' | 'declined';

export type TimeOfDay = 'morning' | 'afternoon' | 'evening';

export interface ChildProfile {
  id: string;
  user_id: string;
  parent_id: string;
  
  // Basic Info
  display_name: string;
  age_band?: AgeBand;
  avatar_config: AvatarConfig;
  
  // Skin Profile
  skin_type?: SkinType;
  skin_type_source?: SkinTypeSource;
  sensitivity_level: number; // 1-5
  acne_tendency?: AcneTendency;
  oiliness_zones: OilinessZone[];
  
  // Concerns
  concerns: SkinConcern[];
  concern_source?: ConcernSource;
  
  // Environmental & Lifestyle
  environmental_factors: EnvironmentalFactor[];
  makeup_frequency: MakeupFrequency;
  
  // Preferences & Restrictions
  texture_dislikes: TextureDislike[];
  ingredient_exclusions: string[];
  brand_preferences: string[];
  
  // Parent Controls
  parent_guardrails: ParentGuardrails;
  wishlisting_enabled: boolean;
  selfie_analysis_enabled: boolean;
  routine_tracking_visible_to_parent: boolean;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  last_profile_update?: string;
}

export interface AvatarConfig {
  shape?: string;
  color?: string;
  accessory?: string;
  mood?: string;
}

export interface ParentGuardrails {
  banned_ingredients?: string[];
  max_price?: number;
  approved_brands_only?: boolean;
  require_approval_for_new_categories?: boolean;
}

export interface ChildGoal {
  id: string;
  child_profile_id: string;
  goal_type: GoalType;
  priority: number; // 1-5
  is_active: boolean;
  created_at: string;
}

export interface WishlistItem {
  id: string;
  child_profile_id: string;
  product_id?: string;
  product_data: ProductData;
  
  // Approval Flow
  status: WishlistStatus;
  child_note?: string;
  parent_note?: string;
  
  // Match Score
  skin_match_score?: number; // 0-100
  match_reasoning?: MatchReasoning;
  
  // Timestamps
  requested_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  created_at: string;
}

export interface MatchReasoning {
  pros: string[];
  cons: string[];
  flags: string[];
  recommendation?: string;
}

export interface ProductData {
  name: string;
  brand: string;
  category?: string;
  image_url?: string;
  barcode?: string;
  ingredients?: string[];
  price?: number;
  [key: string]: any;
}

export interface ChildRoutine {
  id: string;
  child_profile_id: string;
  time_of_day: TimeOfDay;
  steps: RoutineStep[];
  
  // Tracking
  is_active: boolean;
  streak_count: number;
  last_completed_at?: string;
  
  // Reminders
  reminder_enabled: boolean;
  reminder_time?: string; // HH:MM format
  
  created_at: string;
  updated_at: string;
}

export interface RoutineStep {
  id: string;
  product_id?: string;
  product_data: ProductData;
  order: number;
  completed: boolean;
  notes?: string;
}

export interface RoutineCompletion {
  id: string;
  routine_id: string;
  child_profile_id: string;
  completed_at: string;
  steps_completed: string[]; // Array of step IDs
  created_at: string;
}

export interface ProductExpiry {
  id: string;
  child_profile_id: string;
  product_id?: string;
  product_data: ProductData;
  
  expiry_date: string; // ISO date
  opened_date?: string;
  purchase_date?: string;
  
  alert_sent: boolean;
  alert_sent_at?: string;
  
  created_at: string;
  updated_at: string;
}

export interface ChildFavorite {
  id: string;
  child_profile_id: string;
  product_id?: string;
  product_data: ProductData;
  created_at: string;
}

export interface ChildScanHistory {
  id: string;
  child_profile_id: string;
  product_id?: string;
  product_data: ProductData;
  barcode?: string;
  scan_result: ScanResult;
  visible_to_parent: boolean;
  created_at: string;
}

export interface ScanResult {
  score: number;
  rating: 'excellent' | 'good' | 'fair' | 'poor';
  insights: string[];
  warnings: string[];
  skin_match: SkinMatchResult;
  alternatives?: ProductData[];
}

export interface SkinMatchResult {
  overall_score: number; // 0-100
  matches_skin_type: boolean;
  matches_goals: GoalType[];
  concerns_addressed: SkinConcern[];
  potential_issues: string[];
  recommendation: string;
}

// Goal Display Helpers
export const GOAL_LABELS: Record<GoalType, string> = {
  reduce_breakouts: 'Reduce Breakouts',
  reduce_shine: 'Reduce Shine',
  improve_hydration: 'Improve Hydration',
  reduce_redness: 'Reduce Redness',
  simple_routine: 'Keep It Simple',
  improve_after_sport: 'Better After Sport',
  feel_confident: 'Feel More Confident',
};

export const GOAL_EMOJIS: Record<GoalType, string> = {
  reduce_breakouts: '✨',
  reduce_shine: '🌟',
  improve_hydration: '💧',
  reduce_redness: '🌸',
  simple_routine: '⚡',
  improve_after_sport: '⚽',
  feel_confident: '😊',
};

// Concern Display Helpers
export const CONCERN_LABELS: Record<SkinConcern, string> = {
  acne: 'Breakouts',
  redness: 'Redness',
  dryness: 'Dryness',
  oiliness: 'Oily Skin',
  sensitivity: 'Sensitivity',
  dark_spots: 'Dark Spots',
  texture: 'Rough Texture',
};

export const CONCERN_COLORS: Record<SkinConcern, string> = {
  acne: '#EF4444',
  redness: '#F87171',
  dryness: '#60A5FA',
  oiliness: '#FBBF24',
  sensitivity: '#F472B6',
  dark_spots: '#A78BFA',
  texture: '#34D399',
};

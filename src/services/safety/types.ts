/**
 * Safety Calculation System Types
 * Comprehensive type definitions for the Freshies safety rating system
 */

// =====================================================
// INGREDIENT TYPES
// =====================================================

export interface Ingredient {
  id: string;
  inci_name: string;
  common_name?: string;
  family?: string;
  
  // ISI Score (0-100, where 100 is very gentle, 0 is unsuitable for kids)
  isi_score: number;
  
  // Safety Flags
  irritation_potential?: 'low' | 'medium' | 'high';
  sensitiser_flag: boolean;
  fragrance_flag: boolean;
  allergen_flag: boolean;
  comedogenicity?: number; // 0-5
  age_min_recommended?: number;
  hormonal_concern_flag: boolean;
  regulatory_flag: boolean;
  
  // Friendly Text
  kid_friendly_summary?: string;
  what_it_does?: string;
  avoid_if?: string[];
  
  // Additional
  ewg_score?: number;
  concerns?: string[];
  pregnancy_safe?: boolean;
  child_safe: boolean;
}

export interface ProductIngredient {
  id: string;
  product_id: string;
  ingredient_id: string;
  ingredient: Ingredient;
  position: number; // 1-based index
  safety_override?: number; // Optional per-product override
  override_reason?: string;
}

// =====================================================
// PRODUCT TYPES
// =====================================================

export interface Product {
  id: string;
  name: string;
  brand_id?: string;
  barcode?: string;
  
  // Product Context
  category?: string;
  form_factor?: string;
  leave_on: boolean;
  target_age_band?: string;
  
  // Global Safety Score
  safety_score_global?: number;
  safety_tier_global?: 'A' | 'B' | 'C' | 'D' | 'E';
  safety_last_calculated_at?: string;
  
  // Manual Override
  safety_manual_override: boolean;
  safety_manual_value?: number;
  safety_manual_reason?: string;
  
  // Additional
  image_url?: string;
  description?: string;
  ingredients_text?: string;
  concerns?: string[];
  benefits?: string[];
  ai_summary?: string;
  
  // Relations
  product_ingredients?: ProductIngredient[];
}

// =====================================================
// SAFETY RULES TYPES
// =====================================================

export interface SafetyRule {
  id: string;
  rule_key: string;
  rule_category: 'penalty' | 'contextual_adjustment' | 'profile_penalty';
  description: string;
  penalty_value: number; // positive = penalty, negative = bonus
  condition_config: RuleConditionConfig;
  is_active: boolean;
  priority: number;
}

export interface RuleConditionConfig {
  // Ingredient-based conditions
  ingredient_flag?: string; // e.g., 'fragrance_flag'
  ingredient_field?: string; // e.g., 'comedogenicity'
  ingredient_family?: string | string[];
  ingredient_pattern?: string | string[];
  flag_value?: string | string[];
  field_value_min?: number;
  field_value_max?: number;
  position_max?: number;
  count_min?: number;
  
  // Product-based conditions
  product_category?: string | string[];
  product_leave_on?: boolean;
  product_form_factor?: string | string[];
  product_name_contains?: string[];
  product_benefits_contains?: string[];
  
  // Profile-based conditions
  profile_flag?: string;
  profile_skin_type?: string;
  profile_concern?: string;
  
  // Special checks
  check_type?: 'age_gap' | 'avoid_list_match';
  penalty_per_year?: number;
  max_penalty?: number;
}

// =====================================================
// CALCULATION TYPES
// =====================================================

export interface SafetyCalculationResult {
  // Final Scores
  weighted_score: number; // Base score from ingredients
  total_penalties: number; // Sum of all penalties
  contextual_adjustments: number; // Sum of adjustments
  final_score: number; // Clamped 0-100
  tier: 'A' | 'B' | 'C' | 'D' | 'E';
  
  // Breakdown
  ingredient_contributions: IngredientContribution[];
  applied_penalties: AppliedRule[];
  applied_adjustments: AppliedRule[];
  
  // Metadata
  calculated_at: string;
  calculation_version: string;
}

export interface IngredientContribution {
  ingredient_id: string;
  ingredient_name: string;
  position: number;
  isi_score: number;
  weight: number;
  contribution: number; // isi_score * weight
  flags: string[]; // List of active flags
}

export interface AppliedRule {
  rule_key: string;
  rule_description: string;
  penalty_value: number;
  reason: string; // Why this rule was applied
  matched_ingredients?: string[]; // If ingredient-based
}

// =====================================================
// PROFILE-SPECIFIC TYPES
// =====================================================

export interface ChildProfile {
  id: string;
  user_id: string;
  age?: number;
  skin_type?: string;
  sensitivity_level?: number;
  
  // Safety-related
  avoid_ingredients?: string[]; // UUIDs of ingredients to avoid
  sensitivity_flags?: string[]; // ['very_sensitive', 'fragrance_sensitive']
  primary_concerns?: string[]; // ['acne', 'eczema', 'redness']
}

export interface ProfileSafetyResult {
  // Scores
  global_score: number; // From product
  profile_penalties: number; // Additional penalties for this child
  profile_score: number; // Final score for this child
  profile_category: 'great_match' | 'ok_with_care' | 'not_recommended';
  
  // Breakdown
  applied_profile_penalties: AppliedRule[];
  
  // Messaging
  kid_friendly_message: string;
  parent_message: string;
  concerns_for_child: string[];
  recommendations: string[];
}

// =====================================================
// CALCULATION OPTIONS
// =====================================================

export interface CalculationOptions {
  include_breakdown?: boolean; // Include detailed breakdown
  apply_manual_override?: boolean; // Use manual override if set
  child_profile_id?: string; // For profile-specific calculation
  recalculate_if_stale?: boolean; // Recalculate if older than threshold
  stale_threshold_hours?: number; // Default 24 hours
}

// =====================================================
// AUDIT LOG TYPES
// =====================================================

export interface ProductActivityLog {
  id: string;
  product_id: string;
  action_type: 'safety_recalculated' | 'safety_override_set' | 'safety_override_removed' | 'ingredient_changed' | 'manual_edit';
  action_details: {
    old_score?: number;
    new_score?: number;
    old_tier?: string;
    new_tier?: string;
    reason?: string;
    changed_by?: string;
    [key: string]: any;
  };
  admin_id?: string;
  created_at: string;
}

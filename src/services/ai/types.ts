/**
 * AI Service Types
 * Type definitions for all AI tools and their inputs/outputs
 */

// ============================================================================
// Child Profile
// ============================================================================

export interface ChildProfile {
  name: string;
  age_years: number;
  has_eczema?: boolean;
  has_acne?: boolean;
  has_sensitive_skin?: boolean;
  known_allergies?: string[];
  skin_type?: 'dry' | 'oily' | 'combination' | 'normal' | 'sensitive';
}

// ============================================================================
// Product Data
// ============================================================================

export interface ProductData {
  name: string;
  brand: string;
  category: string;
  ingredients_raw?: string;
  normalised_ingredients?: string[];
  country_code?: string;
  barcode?: string;
  image_url?: string;
}

export interface ProductWithFlags extends ProductData {
  flags?: ProductFlags;
  time_of_day?: 'morning' | 'evening' | 'both';
  frequency?: 'daily' | 'twice_daily' | 'weekly' | 'as_needed';
}

export interface ProductFlags {
  contains_fragrance?: boolean;
  contains_common_allergens?: string[];
  contains_potential_irritants?: string[];
  contains_strong_actives?: string[];
  suitable_for_children_in_general?: 'ok' | 'caution' | 'avoid';
  ph_level?: 'acidic' | 'neutral' | 'alkaline';
  alcohol_content?: 'high' | 'moderate' | 'low' | 'none';
}

// ============================================================================
// Tool 1: analyse_ingredients
// ============================================================================

export interface AnalyseIngredientsInput {
  product: ProductData;
  child_profile: ChildProfile;
}

export interface AnalyseIngredientsOutput {
  normalised_ingredients: string[];
  flags: ProductFlags;
  ingredient_details?: Array<{
    name: string;
    purpose: string;
    safety_level: 'safe' | 'caution' | 'avoid';
    notes?: string;
  }>;
}

// ============================================================================
// Tool 2: summarise_risk_for_parent
// ============================================================================

export interface SummariseRiskInput {
  product: ProductData;
  usage_context: string;
  normalised_ingredients: string[];
  flags: ProductFlags;
  child_profile: ChildProfile;
}

export interface SummariseRiskOutput {
  overall_risk_level: 'ok' | 'caution' | 'avoid';
  summary_text: string;
  bullet_points: string[];
  practical_tips?: string[];
  disclaimer: string;
}

// ============================================================================
// Tool 3: assess_routine
// ============================================================================

export interface AssessRoutineInput {
  child_profile: ChildProfile;
  products: ProductWithFlags[];
}

export interface AssessRoutineOutput {
  overall_assessment: 'ok' | 'caution' | 'too_complex';
  headline: string;
  key_points: string[];
  recommendations: {
    simplify?: string[];
    sequence?: string[];
    warnings?: string[];
  };
  compatibility_issues?: Array<{
    product_a: string;
    product_b: string;
    issue: string;
    suggestion: string;
  }>;
  disclaimer: string;
}

// ============================================================================
// Tool 4: propose_routine
// ============================================================================

export interface ProposeRoutineInput {
  child_profile: ChildProfile;
  goals: string[];
  available_products?: ProductWithFlags[];
  budget?: 'low' | 'medium' | 'high';
}

export interface RoutineStep {
  step_type: 'cleanser' | 'toner' | 'treatment' | 'moisturiser' | 'sunscreen' | 'spot_treatment';
  product_reference?: string;
  instructions: string;
  optional?: boolean;
}

export interface RoutineTimeSlot {
  time_of_day: 'morning' | 'evening';
  steps: RoutineStep[];
}

export interface ProposeRoutineOutput {
  routine: RoutineTimeSlot[];
  explanations: string[];
  missing_products?: Array<{
    type: string;
    why_needed: string;
    suggestions?: string[];
  }>;
  introduction_plan?: {
    week_1: string[];
    week_2: string[];
    week_3_onwards: string[];
  };
  disclaimer: string;
}

// ============================================================================
// Tool 5: coach_parent
// ============================================================================

export interface CoachParentInput {
  child_profile: ChildProfile;
  question: string;
  context?: {
    current_routine_products?: ProductWithFlags[];
    recent_concerns?: string[];
    last_scanned_product?: ProductData;
  };
}

export interface CoachParentOutput {
  answer_text: string;
  key_points: string[];
  suggested_actions?: string[];
  related_topics?: string[];
  follow_up_prompts?: string[];
  must_show_disclaimer: boolean;
  disclaimer: string;
}

// ============================================================================
// Tool 6: interpret_question_and_route (Router)
// ============================================================================

export interface RouteQuestionInput {
  question: string;
  child_profile?: ChildProfile;
  context?: {
    last_scanned_product?: ProductData;
    current_routine_products?: ProductWithFlags[];
    conversation_history?: Array<{
      role: 'user' | 'assistant';
      content: string;
    }>;
  };
}

export type RouteIntent = 
  | 'analyse_product'
  | 'assess_routine'
  | 'propose_routine'
  | 'explain_ingredient'
  | 'general_coaching'
  | 'safety_concern'
  | 'product_comparison';

export interface RouteQuestionOutput {
  intent: RouteIntent;
  confidence: number;
  suggested_tool: AIToolName | 'coach_parent';
  extracted_entities?: {
    product_name?: string;
    ingredient_names?: string[];
    age_mentioned?: number;
    concern_type?: string;
  };
  reasoning: string;
}

// ============================================================================
// AI Provider Configuration
// ============================================================================

export type AIProvider = 'openai' | 'claude' | 'mistral' | 'gemini' | 'auto';

export interface AIOptions {
  provider?: AIProvider;
  model?: string;
  temperature?: number;
  max_tokens?: number;
  timeout_ms?: number;
}

// ============================================================================
// AI Tool Names (for MCP)
// ============================================================================

export const AI_TOOLS = {
  ANALYSE_INGREDIENTS: 'analyse_ingredients',
  SUMMARISE_RISK: 'summarise_risk_for_parent',
  ASSESS_ROUTINE: 'assess_routine',
  PROPOSE_ROUTINE: 'propose_routine',
  COACH_PARENT: 'coach_parent',
  ROUTE_QUESTION: 'interpret_question_and_route',
} as const;

export type AIToolName = typeof AI_TOOLS[keyof typeof AI_TOOLS];

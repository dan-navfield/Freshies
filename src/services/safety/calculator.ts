/**
 * Safety Score Calculator
 * Core calculation engine for product safety scoring
 */

import {
  Product,
  ProductIngredient,
  SafetyRule,
  SafetyCalculationResult,
  IngredientContribution,
  AppliedRule,
  CalculationOptions
} from './types';

// =====================================================
// CONSTANTS
// =====================================================

const CALCULATION_VERSION = '1.0.0';

// Position-based weights for ingredient concentration proxy
const POSITION_WEIGHTS = {
  '1-5': 1.0,
  '6-10': 0.5,
  '11-20': 0.25,
  '21+': 0.1
};

// Tier thresholds
const TIER_THRESHOLDS = {
  A: 85,
  B: 70,
  C: 55,
  D: 40,
  E: 0
};

// =====================================================
// MAIN CALCULATION FUNCTION
// =====================================================

export async function calculateProductSafety(
  product: Product,
  rules: SafetyRule[],
  options: CalculationOptions = {}
): Promise<SafetyCalculationResult> {
  
  // Check for manual override
  if (options.apply_manual_override !== false && product.safety_manual_override && product.safety_manual_value != null) {
    return createManualOverrideResult(product);
  }
  
  // Ensure we have ingredients
  if (!product.product_ingredients || product.product_ingredients.length === 0) {
    return createNoIngredientsResult(product);
  }
  
  // Step 1: Calculate weighted ingredient score
  const { weightedScore, contributions } = calculateWeightedIngredientScore(
    product.product_ingredients
  );
  
  // Step 2: Apply penalty rules
  const { totalPenalties, appliedPenalties } = applyPenaltyRules(
    product,
    product.product_ingredients,
    rules.filter(r => r.rule_category === 'penalty' && r.is_active)
  );
  
  // Step 3: Apply contextual adjustments
  const { totalAdjustments, appliedAdjustments } = applyContextualAdjustments(
    product,
    rules.filter(r => r.rule_category === 'contextual_adjustment' && r.is_active)
  );
  
  // Step 4: Calculate final score
  const finalScore = clamp(
    weightedScore - totalPenalties + totalAdjustments,
    0,
    100
  );
  
  // Step 5: Determine tier
  const tier = determineTier(finalScore);
  
  return {
    weighted_score: Math.round(weightedScore),
    total_penalties: Math.round(totalPenalties),
    contextual_adjustments: Math.round(totalAdjustments),
    final_score: Math.round(finalScore),
    tier,
    ingredient_contributions: contributions,
    applied_penalties: appliedPenalties,
    applied_adjustments: appliedAdjustments,
    calculated_at: new Date().toISOString(),
    calculation_version: CALCULATION_VERSION
  };
}

// =====================================================
// STEP 1: WEIGHTED INGREDIENT SCORE
// =====================================================

function calculateWeightedIngredientScore(
  productIngredients: ProductIngredient[]
): { weightedScore: number; contributions: IngredientContribution[] } {
  
  let totalWeightedScore = 0;
  let totalWeight = 0;
  const contributions: IngredientContribution[] = [];
  
  for (const pi of productIngredients) {
    const weight = getPositionWeight(pi.position);
    const isiScore = pi.safety_override ?? pi.ingredient.isi_score;
    const contribution = isiScore * weight;
    
    totalWeightedScore += contribution;
    totalWeight += weight;
    
    // Collect flags for this ingredient
    const flags: string[] = [];
    if (pi.ingredient.allergen_flag) flags.push('allergen');
    if (pi.ingredient.fragrance_flag) flags.push('fragrance');
    if (pi.ingredient.sensitiser_flag) flags.push('sensitiser');
    if (pi.ingredient.hormonal_concern_flag) flags.push('hormonal_concern');
    if (pi.ingredient.regulatory_flag) flags.push('regulatory');
    if (pi.ingredient.irritation_potential === 'high') flags.push('high_irritation');
    
    contributions.push({
      ingredient_id: pi.ingredient.id,
      ingredient_name: pi.ingredient.inci_name,
      position: pi.position,
      isi_score: isiScore,
      weight,
      contribution,
      flags
    });
  }
  
  const weightedScore = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
  
  return { weightedScore, contributions };
}

function getPositionWeight(position: number): number {
  if (position <= 5) return POSITION_WEIGHTS['1-5'];
  if (position <= 10) return POSITION_WEIGHTS['6-10'];
  if (position <= 20) return POSITION_WEIGHTS['11-20'];
  return POSITION_WEIGHTS['21+'];
}

// =====================================================
// STEP 2: APPLY PENALTY RULES
// =====================================================

function applyPenaltyRules(
  product: Product,
  productIngredients: ProductIngredient[],
  penaltyRules: SafetyRule[]
): { totalPenalties: number; appliedPenalties: AppliedRule[] } {
  
  let totalPenalties = 0;
  const appliedPenalties: AppliedRule[] = [];
  
  for (const rule of penaltyRules) {
    const match = checkRuleMatch(rule, product, productIngredients);
    
    if (match.matches) {
      totalPenalties += rule.penalty_value;
      appliedPenalties.push({
        rule_key: rule.rule_key,
        rule_description: rule.description,
        penalty_value: rule.penalty_value,
        reason: match.reason,
        matched_ingredients: match.matchedIngredients
      });
    }
  }
  
  return { totalPenalties, appliedPenalties };
}

// =====================================================
// STEP 3: APPLY CONTEXTUAL ADJUSTMENTS
// =====================================================

function applyContextualAdjustments(
  product: Product,
  adjustmentRules: SafetyRule[]
): { totalAdjustments: number; appliedAdjustments: AppliedRule[] } {
  
  let totalAdjustments = 0;
  const appliedAdjustments: AppliedRule[] = [];
  
  for (const rule of adjustmentRules) {
    const match = checkRuleMatch(rule, product, []);
    
    if (match.matches) {
      // Note: penalty_value is negative for bonuses
      totalAdjustments += rule.penalty_value;
      appliedAdjustments.push({
        rule_key: rule.rule_key,
        rule_description: rule.description,
        penalty_value: rule.penalty_value,
        reason: match.reason
      });
    }
  }
  
  return { totalAdjustments, appliedAdjustments };
}

// =====================================================
// RULE MATCHING LOGIC
// =====================================================

interface RuleMatchResult {
  matches: boolean;
  reason: string;
  matchedIngredients?: string[];
}

function checkRuleMatch(
  rule: SafetyRule,
  product: Product,
  productIngredients: ProductIngredient[]
): RuleMatchResult {
  
  const config = rule.condition_config;
  
  // Check ingredient-based conditions
  if (config.ingredient_flag || config.ingredient_field || config.ingredient_family || config.ingredient_pattern) {
    return checkIngredientConditions(config, productIngredients);
  }
  
  // Check product-based conditions
  if (config.product_category || config.product_leave_on !== undefined || config.product_name_contains || config.product_benefits_contains) {
    return checkProductConditions(config, product);
  }
  
  return { matches: false, reason: 'No matching conditions' };
}

function checkIngredientConditions(
  config: any,
  productIngredients: ProductIngredient[]
): RuleMatchResult {
  
  const matchedIngredients: string[] = [];
  let matchCount = 0;
  
  for (const pi of productIngredients) {
    const ingredient = pi.ingredient;
    let matches = true;
    
    // Check position constraint
    if (config.position_max && pi.position > config.position_max) {
      continue;
    }
    
    // Check ingredient flag
    if (config.ingredient_flag) {
      const flagValue = (ingredient as any)[config.ingredient_flag];
      if (config.flag_value) {
        const expectedValues = Array.isArray(config.flag_value) ? config.flag_value : [config.flag_value];
        matches = matches && expectedValues.includes(flagValue);
      } else {
        matches = matches && flagValue === true;
      }
    }
    
    // Check ingredient field
    if (config.ingredient_field) {
      const fieldValue = (ingredient as any)[config.ingredient_field];
      if (config.field_value_min !== undefined) {
        matches = matches && fieldValue >= config.field_value_min;
      }
      if (config.field_value_max !== undefined) {
        matches = matches && fieldValue <= config.field_value_max;
      }
    }
    
    // Check ingredient family
    if (config.ingredient_family) {
      const families = Array.isArray(config.ingredient_family) ? config.ingredient_family : [config.ingredient_family];
      matches = matches && ingredient.family != null && families.includes(ingredient.family);
    }
    
    // Check ingredient pattern
    if (config.ingredient_pattern) {
      const patterns = Array.isArray(config.ingredient_pattern) ? config.ingredient_pattern : [config.ingredient_pattern];
      const nameMatches = patterns.some((pattern: string) => 
        ingredient.inci_name.toLowerCase().includes(pattern.toLowerCase())
      );
      matches = matches && nameMatches;
    }
    
    if (matches) {
      matchCount++;
      matchedIngredients.push(ingredient.inci_name);
    }
  }
  
  // Check count requirement
  if (config.count_min && matchCount < config.count_min) {
    return { matches: false, reason: 'Insufficient matches' };
  }
  
  if (matchCount > 0) {
    const positionText = config.position_max ? ` in top ${config.position_max}` : '';
    return {
      matches: true,
      reason: `Found ${matchCount} matching ingredient(s)${positionText}`,
      matchedIngredients
    };
  }
  
  return { matches: false, reason: 'No matching ingredients' };
}

function checkProductConditions(
  config: any,
  product: Product
): RuleMatchResult {
  
  // Check category
  if (config.product_category) {
    const categories = Array.isArray(config.product_category) ? config.product_category : [config.product_category];
    if (!product.category || !categories.includes(product.category)) {
      return { matches: false, reason: 'Category does not match' };
    }
  }
  
  // Check leave_on
  if (config.product_leave_on !== undefined) {
    if (product.leave_on !== config.product_leave_on) {
      return { matches: false, reason: 'Leave-on status does not match' };
    }
  }
  
  // Check form factor
  if (config.product_form_factor) {
    const formFactors = Array.isArray(config.product_form_factor) ? config.product_form_factor : [config.product_form_factor];
    if (!product.form_factor || !formFactors.includes(product.form_factor)) {
      return { matches: false, reason: 'Form factor does not match' };
    }
  }
  
  // Check name contains
  if (config.product_name_contains) {
    const nameMatches = config.product_name_contains.some((term: string) =>
      product.name.toLowerCase().includes(term.toLowerCase())
    );
    if (!nameMatches) {
      return { matches: false, reason: 'Product name does not contain required terms' };
    }
  }
  
  // Check benefits contains
  if (config.product_benefits_contains) {
    if (!product.benefits || product.benefits.length === 0) {
      return { matches: false, reason: 'Product has no benefits listed' };
    }
    const benefitsMatch = config.product_benefits_contains.some((term: string) =>
      product.benefits!.some(benefit => benefit.toLowerCase().includes(term.toLowerCase()))
    );
    if (!benefitsMatch) {
      return { matches: false, reason: 'Product benefits do not match' };
    }
  }
  
  return { matches: true, reason: 'Product conditions matched' };
}

// =====================================================
// TIER DETERMINATION
// =====================================================

function determineTier(score: number): 'A' | 'B' | 'C' | 'D' | 'E' {
  if (score >= TIER_THRESHOLDS.A) return 'A';
  if (score >= TIER_THRESHOLDS.B) return 'B';
  if (score >= TIER_THRESHOLDS.C) return 'C';
  if (score >= TIER_THRESHOLDS.D) return 'D';
  return 'E';
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function createManualOverrideResult(product: Product): SafetyCalculationResult {
  const score = product.safety_manual_value!;
  return {
    weighted_score: score,
    total_penalties: 0,
    contextual_adjustments: 0,
    final_score: score,
    tier: determineTier(score),
    ingredient_contributions: [],
    applied_penalties: [],
    applied_adjustments: [{
      rule_key: 'manual_override',
      rule_description: 'Manual override by admin',
      penalty_value: 0,
      reason: product.safety_manual_reason || 'Manual override applied'
    }],
    calculated_at: new Date().toISOString(),
    calculation_version: CALCULATION_VERSION
  };
}

function createNoIngredientsResult(product: Product): SafetyCalculationResult {
  return {
    weighted_score: 0,
    total_penalties: 0,
    contextual_adjustments: 0,
    final_score: 0,
    tier: 'E',
    ingredient_contributions: [],
    applied_penalties: [],
    applied_adjustments: [],
    calculated_at: new Date().toISOString(),
    calculation_version: CALCULATION_VERSION
  };
}

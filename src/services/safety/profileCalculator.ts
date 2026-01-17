/**
 * Profile-Specific Safety Calculator
 * Calculates safety scores adjusted for individual child profiles
 */

import {
  Product,
  ProductIngredient,
  ChildProfile,
  SafetyRule,
  ProfileSafetyResult,
  AppliedRule
} from './types';

// =====================================================
// PROFILE-SPECIFIC CALCULATION
// =====================================================

export async function calculateProfileSafety(
  product: Product,
  childProfile: ChildProfile,
  profileRules: SafetyRule[]
): Promise<ProfileSafetyResult> {
  
  // Start with global score
  const globalScore = product.safety_score_global || 0;
  
  // Apply profile-specific penalties
  const { totalPenalties, appliedPenalties } = applyProfilePenalties(
    product,
    childProfile,
    profileRules.filter(r => r.rule_category === 'profile_penalty' && r.is_active)
  );
  
  // Calculate final profile score
  const profileScore = Math.max(0, Math.min(100, globalScore - totalPenalties));
  
  // Determine category
  const category = determineProfileCategory(profileScore);
  
  // Generate messaging
  const messaging = generateProfileMessaging(
    product,
    childProfile,
    profileScore,
    category,
    appliedPenalties
  );
  
  return {
    global_score: globalScore,
    profile_penalties: Math.round(totalPenalties),
    profile_score: Math.round(profileScore),
    profile_category: category,
    applied_profile_penalties: appliedPenalties,
    ...messaging
  };
}

// =====================================================
// APPLY PROFILE PENALTIES
// =====================================================

function applyProfilePenalties(
  product: Product,
  childProfile: ChildProfile,
  profileRules: SafetyRule[]
): { totalPenalties: number; appliedPenalties: AppliedRule[] } {
  
  let totalPenalties = 0;
  const appliedPenalties: AppliedRule[] = [];
  
  for (const rule of profileRules) {
    const match = checkProfileRuleMatch(rule, product, childProfile);
    
    if (match.matches) {
      const penalty = calculateProfilePenalty(rule, match.context);
      totalPenalties += penalty;
      
      appliedPenalties.push({
        rule_key: rule.rule_key,
        rule_description: rule.description,
        penalty_value: penalty,
        reason: match.reason,
        matched_ingredients: match.matchedIngredients
      });
    }
  }
  
  return { totalPenalties, appliedPenalties };
}

// =====================================================
// PROFILE RULE MATCHING
// =====================================================

interface ProfileRuleMatchResult {
  matches: boolean;
  reason: string;
  matchedIngredients?: string[];
  context?: any; // Additional context for penalty calculation
}

function checkProfileRuleMatch(
  rule: SafetyRule,
  product: Product,
  childProfile: ChildProfile
): ProfileRuleMatchResult {
  
  const config = rule.condition_config;
  
  // Check for avoid list match
  if (config.check_type === 'avoid_list_match') {
    return checkAvoidListMatch(product, childProfile);
  }
  
  // Check for age gap
  if (config.check_type === 'age_gap') {
    return checkAgeGap(product, childProfile, config);
  }
  
  // Check profile flag conditions
  if (config.profile_flag) {
    return checkProfileFlag(product, childProfile, config);
  }
  
  // Check skin type conditions
  if (config.profile_skin_type) {
    return checkSkinType(product, childProfile, config);
  }
  
  // Check concern conditions
  if (config.profile_concern) {
    return checkConcern(product, childProfile, config);
  }
  
  return { matches: false, reason: 'No matching profile conditions' };
}

function checkAvoidListMatch(
  product: Product,
  childProfile: ChildProfile
): ProfileRuleMatchResult {
  
  if (!childProfile.avoid_ingredients || childProfile.avoid_ingredients.length === 0) {
    return { matches: false, reason: 'No avoid list' };
  }
  
  if (!product.product_ingredients) {
    return { matches: false, reason: 'No ingredients' };
  }
  
  const matchedIngredients: string[] = [];
  
  for (const pi of product.product_ingredients) {
    if (childProfile.avoid_ingredients.includes(pi.ingredient.id)) {
      matchedIngredients.push(pi.ingredient.inci_name);
    }
  }
  
  if (matchedIngredients.length > 0) {
    return {
      matches: true,
      reason: `Contains ${matchedIngredients.length} ingredient(s) on avoid list`,
      matchedIngredients
    };
  }
  
  return { matches: false, reason: 'No avoided ingredients found' };
}

function checkAgeGap(
  product: Product,
  childProfile: ChildProfile,
  config: any
): ProfileRuleMatchResult {
  
  if (!product.target_age_band || !childProfile.age) {
    return { matches: false, reason: 'Missing age data' };
  }
  
  // Parse target age band (e.g., "8+", "10+", "12+")
  const targetAge = parseInt(product.target_age_band.replace('+', ''));
  
  if (isNaN(targetAge)) {
    return { matches: false, reason: 'Invalid target age format' };
  }
  
  if (childProfile.age < targetAge) {
    const ageGap = targetAge - childProfile.age;
    return {
      matches: true,
      reason: `Child is ${ageGap} year(s) below target age`,
      context: { ageGap, targetAge, childAge: childProfile.age }
    };
  }
  
  return { matches: false, reason: 'Child meets age requirement' };
}

function checkProfileFlag(
  product: Product,
  childProfile: ChildProfile,
  config: any
): ProfileRuleMatchResult {
  
  if (!childProfile.sensitivity_flags || !childProfile.sensitivity_flags.includes(config.profile_flag)) {
    return { matches: false, reason: 'Profile flag not set' };
  }
  
  // Check if product has the concerning ingredient
  if (config.ingredient_flag && product.product_ingredients) {
    const matchedIngredients: string[] = [];
    let hasMatch = false;
    
    for (const pi of product.product_ingredients) {
      // Check position constraint
      if (config.position_max && pi.position > config.position_max) {
        continue;
      }
      
      const flagValue = (pi.ingredient as any)[config.ingredient_flag];
      if (flagValue === true) {
        hasMatch = true;
        matchedIngredients.push(pi.ingredient.inci_name);
      }
    }
    
    if (hasMatch) {
      const positionText = config.position_max ? ` in top ${config.position_max}` : '';
      return {
        matches: true,
        reason: `Profile is ${config.profile_flag} and product contains flagged ingredient${positionText}`,
        matchedIngredients
      };
    }
  }
  
  return { matches: false, reason: 'No concerning ingredients found' };
}

function checkSkinType(
  product: Product,
  childProfile: ChildProfile,
  config: any
): ProfileRuleMatchResult {
  
  if (childProfile.skin_type !== config.profile_skin_type) {
    return { matches: false, reason: 'Skin type does not match' };
  }
  
  // Check for concerning ingredient patterns
  if (config.ingredient_pattern && product.product_ingredients) {
    const patterns = Array.isArray(config.ingredient_pattern) ? config.ingredient_pattern : [config.ingredient_pattern];
    const matchedIngredients: string[] = [];
    
    for (const pi of product.product_ingredients) {
      const nameMatches = patterns.some((pattern: string) =>
        pi.ingredient.inci_name.toLowerCase().includes(pattern.toLowerCase())
      );
      
      if (nameMatches) {
        matchedIngredients.push(pi.ingredient.inci_name);
      }
    }
    
    if (matchedIngredients.length > 0) {
      return {
        matches: true,
        reason: `${config.profile_skin_type} skin with concerning ingredients`,
        matchedIngredients
      };
    }
  }
  
  return { matches: false, reason: 'No concerning ingredients for skin type' };
}

function checkConcern(
  product: Product,
  childProfile: ChildProfile,
  config: any
): ProfileRuleMatchResult {
  
  if (!childProfile.primary_concerns || !childProfile.primary_concerns.includes(config.profile_concern)) {
    return { matches: false, reason: 'Concern not in profile' };
  }
  
  // Check for concerning ingredient properties
  if (config.ingredient_field && product.product_ingredients) {
    const matchedIngredients: string[] = [];
    
    for (const pi of product.product_ingredients) {
      const fieldValue = (pi.ingredient as any)[config.ingredient_field];
      
      if (config.field_value_min !== undefined && fieldValue >= config.field_value_min) {
        matchedIngredients.push(pi.ingredient.inci_name);
      }
    }
    
    if (matchedIngredients.length > 0) {
      return {
        matches: true,
        reason: `Profile has ${config.profile_concern} concern and product contains concerning ingredients`,
        matchedIngredients
      };
    }
  }
  
  return { matches: false, reason: 'No concerning ingredients for this concern' };
}

// =====================================================
// PENALTY CALCULATION
// =====================================================

function calculateProfilePenalty(rule: SafetyRule, context?: any): number {
  const config = rule.condition_config;
  
  // Special handling for age gap
  if (config.check_type === 'age_gap' && context?.ageGap) {
    const penaltyPerYear = config.penalty_per_year || 5;
    const maxPenalty = config.max_penalty || 30;
    return Math.min(context.ageGap * penaltyPerYear, maxPenalty);
  }
  
  // Default penalty value
  return rule.penalty_value;
}

// =====================================================
// CATEGORY DETERMINATION
// =====================================================

function determineProfileCategory(
  score: number
): 'great_match' | 'ok_with_care' | 'not_recommended' {
  if (score >= 75) return 'great_match';
  if (score >= 50) return 'ok_with_care';
  return 'not_recommended';
}

// =====================================================
// MESSAGING GENERATION
// =====================================================

function generateProfileMessaging(
  product: Product,
  childProfile: ChildProfile,
  profileScore: number,
  category: 'great_match' | 'ok_with_care' | 'not_recommended',
  appliedPenalties: AppliedRule[]
): {
  kid_friendly_message: string;
  parent_message: string;
  concerns_for_child: string[];
  recommendations: string[];
} {
  
  const concerns: string[] = [];
  const recommendations: string[] = [];
  
  // Generate kid-friendly message
  let kidMessage = '';
  switch (category) {
    case 'great_match':
      kidMessage = '✨ Looks good for you!';
      break;
    case 'ok_with_care':
      kidMessage = '🤔 Check with your grown-up';
      break;
    case 'not_recommended':
      kidMessage = '⚠️ Not a Freshies fave for you';
      break;
  }
  
  // Generate parent message
  let parentMessage = '';
  if (category === 'great_match') {
    parentMessage = `This product is well-suited for ${childProfile.user_id}'s profile with a safety score of ${profileScore}/100.`;
  } else if (category === 'ok_with_care') {
    parentMessage = `This product may be suitable with supervision. Safety score: ${profileScore}/100.`;
  } else {
    parentMessage = `This product is not recommended for ${childProfile.user_id}'s profile. Safety score: ${profileScore}/100.`;
  }
  
  // Extract concerns from penalties
  for (const penalty of appliedPenalties) {
    concerns.push(penalty.reason);
    
    if (penalty.matched_ingredients && penalty.matched_ingredients.length > 0) {
      recommendations.push(`Consider avoiding: ${penalty.matched_ingredients.join(', ')}`);
    }
  }
  
  // Add general recommendations
  if (category === 'ok_with_care') {
    recommendations.push('Patch test before full use');
    recommendations.push('Monitor for any reactions');
  } else if (category === 'not_recommended') {
    recommendations.push('Look for products specifically formulated for sensitive skin');
    recommendations.push('Consult with a dermatologist if needed');
  }
  
  return {
    kid_friendly_message: kidMessage,
    parent_message: parentMessage,
    concerns_for_child: concerns,
    recommendations
  };
}

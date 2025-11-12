// Simple rules engine for ingredient safety evaluation
// This will be replaced with Supabase edge function + AI explanations later

export type Rating = 'safe' | 'use_with_care' | 'avoid';

export interface Ingredient {
  inci_name: string;
  family: string;
  common_name?: string;
}

export interface EvaluationResult {
  rating: Rating;
  reason_codes: string[];
  notes_parent: string;
  notes_teen: string;
}

// Static rules (will be loaded from Supabase later)
const RULES: Record<string, { age_min?: number; age_max?: number; rating: Rating; reason: string }> = {
  retinoid: {
    age_max: 15,
    rating: 'avoid',
    reason: 'Retinoids are too strong for developing skin under 16',
  },
  aha: {
    age_max: 13,
    rating: 'avoid',
    reason: 'AHAs can be too harsh for young skin',
  },
  bha: {
    age_max: 13,
    rating: 'use_with_care',
    reason: 'BHAs should be used carefully on young skin',
  },
  fragrance: {
    rating: 'use_with_care',
    reason: 'Fragrance can irritate sensitive skin',
  },
  alcohol: {
    rating: 'use_with_care',
    reason: 'Drying alcohols can strip your skin barrier',
  },
  vitamin: {
    rating: 'safe',
    reason: 'Vitamins are generally safe and beneficial',
  },
  humectant: {
    rating: 'safe',
    reason: 'Hydrating ingredients are great for all ages',
  },
  sunscreen: {
    rating: 'safe',
    reason: 'Sunscreen is essential for protecting your skin',
  },
};

export function evaluateProduct(
  ingredients: Ingredient[],
  userAge: number
): EvaluationResult {
  let worstRating: Rating = 'safe';
  const reasonCodes: string[] = [];
  const concerns: string[] = [];

  for (const ingredient of ingredients) {
    const rule = RULES[ingredient.family];
    if (!rule) continue;

    // Check age restrictions
    if (rule.age_max && userAge <= rule.age_max) {
      if (rule.rating === 'avoid') {
        worstRating = 'avoid';
        reasonCodes.push('AGE_BELOW_THRESHOLD');
        concerns.push(`${ingredient.common_name || ingredient.inci_name}: ${rule.reason}`);
      } else if (rule.rating === 'use_with_care' && worstRating !== 'avoid') {
        worstRating = 'use_with_care';
        reasonCodes.push('CAUTION_RECOMMENDED');
        concerns.push(`${ingredient.common_name || ingredient.inci_name}: ${rule.reason}`);
      }
    } else if (rule.rating === 'use_with_care' && worstRating === 'safe') {
      worstRating = 'use_with_care';
      reasonCodes.push('POTENTIAL_IRRITANT');
      concerns.push(`${ingredient.common_name || ingredient.inci_name}: ${rule.reason}`);
    }
  }

  // Generate notes
  const notes_parent =
    concerns.length > 0
      ? `This product contains: ${concerns.join('; ')}. Consider consulting a dermatologist.`
      : 'This product appears safe for your child based on the ingredients.';

  const notes_teen =
    concerns.length > 0
      ? `Heads up! ${concerns[0]}. ${worstRating === 'avoid' ? 'We recommend skipping this one.' : 'Use it carefully and watch how your skin reacts.'}`
      : 'This product looks good for your age! All the ingredients are gentle and safe.';

  return {
    rating: worstRating,
    reason_codes: reasonCodes,
    notes_parent,
    notes_teen,
  };
}

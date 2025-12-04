/**
 * Ingredients Lookup & Analysis Service
 * Handles INCI name parsing, ingredient safety checks, allergen detection
 */

export interface Ingredient {
  id: string;
  name: string;
  inciName?: string;
  casNumber?: string;
  function?: string;
  description?: string;
  safetyRating?: 'safe' | 'caution' | 'avoid' | 'unknown';
  concerns?: string[];
  allergen?: boolean;
  restricted?: boolean;
  banned?: boolean;
}

export interface IngredientAnalysis {
  totalIngredients: number;
  parsed: Ingredient[];
  safetyScore?: number; // 0-100
  flags: {
    allergens: string[];
    restricted: string[];
    banned: string[];
    concerns: string[];
  };
  childSafe?: boolean;
  recommendations?: string[];
}

/**
 * Parse ingredient text into structured data
 * Handles various formats: comma-separated, INCI names, etc.
 */
export function parseIngredientText(ingredientsText: string): string[] {
  if (!ingredientsText) return [];

  // Common separators: comma, semicolon, newline
  const ingredients = ingredientsText
    .split(/[,;\n]/)
    .map(ing => ing.trim())
    .filter(ing => ing.length > 0)
    // Remove common prefixes like "Ingredients:", "INCI:", etc.
    .map(ing => ing.replace(/^(ingredients?|inci):\s*/i, ''))
    .filter(ing => ing.length > 0);

  return ingredients;
}

/**
 * Analyze ingredients for safety concerns
 * This is a basic implementation - will be enhanced with real databases
 */
export async function analyzeIngredients(
  ingredientsText: string
): Promise<IngredientAnalysis> {
  const ingredientList = parseIngredientText(ingredientsText);
  
  // Known allergens (basic list - will be expanded)
  const commonAllergens = [
    'fragrance', 'parfum', 'perfume',
    'formaldehyde', 'methylisothiazolinone', 'methylchloroisothiazolinone',
    'lanolin', 'propylene glycol', 'parabens',
    'sodium lauryl sulfate', 'sls', 'sodium laureth sulfate', 'sles',
  ];

  // Known restricted ingredients (EU/AU regulations)
  const restrictedIngredients = [
    'hydroquinone', 'mercury', 'lead', 'arsenic',
    'formaldehyde', 'toluene', 'phthalates',
  ];

  // Banned ingredients
  const bannedIngredients = [
    'asbestos', 'chloroform', 'methylene chloride',
    'vinyl chloride', 'zirconium', 'halogenated salicylanilides',
  ];

  const flags = {
    allergens: [] as string[],
    restricted: [] as string[],
    banned: [] as string[],
    concerns: [] as string[],
  };

  const parsed: Ingredient[] = ingredientList.map((name, index) => {
    const nameLower = name.toLowerCase();
    
    // Check for allergens
    const isAllergen = commonAllergens.some(allergen => 
      nameLower.includes(allergen.toLowerCase())
    );
    if (isAllergen) flags.allergens.push(name);

    // Check for restricted
    const isRestricted = restrictedIngredients.some(restricted => 
      nameLower.includes(restricted.toLowerCase())
    );
    if (isRestricted) flags.restricted.push(name);

    // Check for banned
    const isBanned = bannedIngredients.some(banned => 
      nameLower.includes(banned.toLowerCase())
    );
    if (isBanned) flags.banned.push(name);

    // Determine safety rating
    let safetyRating: Ingredient['safetyRating'] = 'unknown';
    if (isBanned) safetyRating = 'avoid';
    else if (isRestricted) safetyRating = 'caution';
    else if (isAllergen) safetyRating = 'caution';

    return {
      id: `ing-${index}`,
      name,
      allergen: isAllergen,
      restricted: isRestricted,
      banned: isBanned,
      safetyRating,
    };
  });

  // Calculate safety score (0-100, higher is better)
  const safetyScore = calculateSafetyScore(flags, ingredientList.length);

  // Child safety determination
  const childSafe = flags.banned.length === 0 && flags.restricted.length === 0;

  // Generate recommendations
  const recommendations = generateRecommendations(flags, childSafe);

  return {
    totalIngredients: ingredientList.length,
    parsed,
    safetyScore,
    flags,
    childSafe,
    recommendations,
  };
}

/**
 * Calculate overall safety score
 */
function calculateSafetyScore(
  flags: IngredientAnalysis['flags'],
  totalIngredients: number
): number {
  let score = 100;

  // Deduct points for concerns
  score -= flags.banned.length * 30;
  score -= flags.restricted.length * 15;
  score -= flags.allergens.length * 5;

  // Normalize by total ingredients
  if (totalIngredients > 0) {
    const concernRatio = (flags.banned.length + flags.restricted.length + flags.allergens.length) / totalIngredients;
    score = Math.max(0, score - (concernRatio * 20));
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Generate parent-friendly recommendations
 */
function generateRecommendations(
  flags: IngredientAnalysis['flags'],
  childSafe: boolean
): string[] {
  const recommendations: string[] = [];

  if (flags.banned.length > 0) {
    recommendations.push(`⚠️ Contains ${flags.banned.length} banned ingredient(s). Not recommended for use.`);
  }

  if (flags.restricted.length > 0) {
    recommendations.push(`⚠️ Contains ${flags.restricted.length} restricted ingredient(s). Use with caution.`);
  }

  if (flags.allergens.length > 0) {
    recommendations.push(`ℹ️ Contains ${flags.allergens.length} common allergen(s). May cause reactions in sensitive individuals.`);
  }

  if (childSafe && flags.allergens.length === 0) {
    recommendations.push('✅ No major concerns found. Generally safe for children.');
  }

  if (!childSafe) {
    recommendations.push('⚠️ Not recommended for children without consulting a healthcare professional.');
  }

  return recommendations;
}

/**
 * Look up detailed ingredient information
 * TODO: Integrate with Cosmethics API, CosIng database, etc.
 */
export async function lookupIngredientDetails(
  ingredientName: string
): Promise<Ingredient | null> {
  // Placeholder for future API integration
  // Will call Cosmethics API, CosIng, or other ingredient databases
  
  console.log(`🔍 Looking up ingredient: ${ingredientName}`);
  
  // For now, return basic parsed data
  return {
    id: ingredientName.toLowerCase().replace(/\s+/g, '-'),
    name: ingredientName,
    safetyRating: 'unknown',
  };
}

/**
 * Check if ingredient is safe for children
 */
export function isChildSafe(ingredient: Ingredient): boolean {
  return !ingredient.banned && !ingredient.restricted;
}

/**
 * Get ingredient concerns for a specific age group
 */
export function getAgeSpecificConcerns(
  ingredient: Ingredient,
  ageInYears: number
): string[] {
  const concerns: string[] = [];

  // Children under 3
  if (ageInYears < 3) {
    if (ingredient.allergen) {
      concerns.push('May cause allergic reactions in young children');
    }
    if (ingredient.name.toLowerCase().includes('fragrance')) {
      concerns.push('Fragrances not recommended for babies and toddlers');
    }
  }

  // Children under 12
  if (ageInYears < 12) {
    if (ingredient.restricted) {
      concerns.push('Restricted ingredient - consult pediatrician');
    }
  }

  return concerns;
}

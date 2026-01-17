import { supabase } from '../../lib/supabase';

export interface ProductWarning {
  id: string;
  product_id: string;
  warning_type: 'expiry' | 'age_restriction' | 'ingredient_conflict' | 'overuse' | 'unsafe';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  suggestion?: string;
  conflicting_product_id?: string;
  conflicting_ingredient?: string;
  expires_at?: string;
  created_at: string;
}

// Ingredient conflict pairs (should not be used together)
const CONFLICTING_INGREDIENTS = [
  { ingredients: ['retinol', 'vitamin c'], reason: 'Can cause irritation when combined' },
  { ingredients: ['retinol', 'aha'], reason: 'Too harsh when combined, may cause severe irritation' },
  { ingredients: ['retinol', 'bha'], reason: 'Too harsh when combined, may cause severe irritation' },
  { ingredients: ['vitamin c', 'niacinamide'], reason: 'May reduce effectiveness of both ingredients' },
  { ingredients: ['benzoyl peroxide', 'retinol'], reason: 'Can cause excessive dryness and irritation' },
  { ingredients: ['aha', 'bha'], reason: 'Over-exfoliation risk when used in same routine' },
];

// Age-restricted ingredients
const AGE_RESTRICTIONS: Record<string, { minAge: number; reason: string }> = {
  'retinol': { minAge: 16, reason: 'Too strong for younger skin, may cause irritation' },
  'tretinoin': { minAge: 18, reason: 'Prescription-strength, not suitable for teens' },
  'hydroquinone': { minAge: 18, reason: 'Strong lightening agent, requires supervision' },
  'high concentration aha': { minAge: 16, reason: 'May be too harsh for younger skin' },
  'high concentration bha': { minAge: 16, reason: 'May be too harsh for younger skin' },
};

/**
 * Check for warnings on a specific product
 */
export async function checkProductWarnings(
  productId: string,
  childAge: number
): Promise<ProductWarning[]> {
  try {
    const { data: product } = await supabase
      .from('scanned_products')
      .select('*')
      .eq('id', productId)
      .single();

    if (!product) return [];

    const warnings: Partial<ProductWarning>[] = [];

    // Check age restrictions
    if (product.ingredients) {
      const ingredients = product.ingredients.toLowerCase();
      
      for (const [ingredient, restriction] of Object.entries(AGE_RESTRICTIONS)) {
        if (ingredients.includes(ingredient.toLowerCase()) && childAge < restriction.minAge) {
          warnings.push({
            product_id: productId,
            warning_type: 'age_restriction',
            severity: 'high',
            title: 'Age Restriction',
            message: `This product contains ${ingredient}, which is recommended for ages ${restriction.minAge}+`,
            suggestion: restriction.reason,
          });
        }
      }
    }

    // Save warnings to database
    if (warnings.length > 0) {
      await supabase.from('product_warnings').insert(warnings);
    }

    // Fetch all warnings for this product
    const { data: allWarnings } = await supabase
      .from('product_warnings')
      .select('*')
      .eq('product_id', productId)
      .order('severity', { ascending: false });

    return allWarnings || [];
  } catch (error) {
    console.error('Error checking product warnings:', error);
    return [];
  }
}

/**
 * Check for ingredient conflicts in a routine
 */
export async function checkRoutineConflicts(
  routineSteps: Array<{ product_id?: string }>
): Promise<ProductWarning[]> {
  try {
    const productIds = routineSteps
      .map(step => step.product_id)
      .filter(Boolean) as string[];

    if (productIds.length === 0) return [];

    // Get all products in routine
    const { data: products } = await supabase
      .from('scanned_products')
      .select('id, product_name, ingredients')
      .in('id', productIds);

    if (!products || products.length < 2) return [];

    const warnings: Partial<ProductWarning>[] = [];

    // Check each pair of products for conflicts
    for (let i = 0; i < products.length; i++) {
      for (let j = i + 1; j < products.length; j++) {
        const product1 = products[i];
        const product2 = products[j];

        if (!product1.ingredients || !product2.ingredients) continue;

        const ingredients1 = product1.ingredients.toLowerCase();
        const ingredients2 = product2.ingredients.toLowerCase();

        // Check for conflicting ingredient pairs
        for (const conflict of CONFLICTING_INGREDIENTS) {
          const hasFirst = conflict.ingredients.some(ing => 
            ingredients1.includes(ing.toLowerCase())
          );
          const hasSecond = conflict.ingredients.some(ing => 
            ingredients2.includes(ing.toLowerCase())
          );

          if (hasFirst && hasSecond) {
            warnings.push({
              product_id: product1.id,
              warning_type: 'ingredient_conflict',
              severity: 'high',
              title: 'Ingredient Conflict',
              message: `${product1.product_name} and ${product2.product_name} contain conflicting ingredients`,
              suggestion: conflict.reason,
              conflicting_product_id: product2.id,
              conflicting_ingredient: conflict.ingredients.join(' + '),
            });
          }
        }
      }
    }

    // Save warnings
    if (warnings.length > 0) {
      await supabase.from('product_warnings').upsert(warnings);
    }

    return warnings as ProductWarning[];
  } catch (error) {
    console.error('Error checking routine conflicts:', error);
    return [];
  }
}

/**
 * Check for overuse warnings (e.g., exfoliating too often)
 */
export async function checkOveruseWarnings(
  childProfileId: string,
  productId: string
): Promise<ProductWarning | null> {
  try {
    // Get product details
    const { data: product } = await supabase
      .from('scanned_products')
      .select('product_name, ingredients, category')
      .eq('id', productId)
      .single();

    if (!product) return null;

    // Check if it's an exfoliating product
    const isExfoliant = 
      product.ingredients?.toLowerCase().includes('aha') ||
      product.ingredients?.toLowerCase().includes('bha') ||
      product.ingredients?.toLowerCase().includes('exfoliat') ||
      product.category?.toLowerCase().includes('exfoliant');

    if (!isExfoliant) return null;

    // Check usage frequency in last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: recentUse } = await supabase
      .from('routine_step_completions')
      .select('completion_date')
      .eq('child_profile_id', childProfileId)
      .gte('completion_date', sevenDaysAgo.toISOString().split('T')[0]);

    if (!recentUse) return null;

    // Count unique days
    const uniqueDays = new Set(recentUse.map(r => r.completion_date)).size;

    // If used more than 3 times per week
    if (uniqueDays > 3) {
      const warning: Partial<ProductWarning> = {
        product_id: productId,
        warning_type: 'overuse',
        severity: 'medium',
        title: 'Overuse Warning',
        message: `You've used ${product.product_name} ${uniqueDays} times this week`,
        suggestion: 'Exfoliating products should typically be used 2-3 times per week to avoid irritation.',
      };

      await supabase.from('product_warnings').insert(warning);
      return warning as ProductWarning;
    }

    return null;
  } catch (error) {
    console.error('Error checking overuse:', error);
    return null;
  }
}

/**
 * Get all active warnings for a child's products
 */
export async function getActiveWarnings(childProfileId: string): Promise<ProductWarning[]> {
  try {
    const { data: warnings } = await supabase
      .from('product_warnings')
      .select(`
        *,
        scanned_products!product_warnings_product_id_fkey(
          id,
          product_name,
          child_profile_id
        )
      `)
      .eq('scanned_products.child_profile_id', childProfileId)
      .order('severity', { ascending: false })
      .order('created_at', { ascending: false });

    return warnings || [];
  } catch (error) {
    console.error('Error getting active warnings:', error);
    return [];
  }
}

/**
 * Dismiss a warning
 */
export async function dismissWarning(warningId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('product_warnings')
      .delete()
      .eq('id', warningId);

    return !error;
  } catch (error) {
    console.error('Error dismissing warning:', error);
    return false;
  }
}

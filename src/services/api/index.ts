/**
 * API Services Index
 * Central export point for all API services
 */

// Product lookup (multi-source)
export { lookupProduct, searchProducts, type ProductData } from './productLookup';

// Open Beauty Facts
export { lookupProductByBarcode, searchProductsByName } from './openBeautyFacts';

// Ingredients analysis
export {
  analyzeIngredients,
  parseIngredientText,
  lookupIngredientDetails,
  isChildSafe,
  getAgeSpecificConcerns,
  type Ingredient,
  type IngredientAnalysis,
} from './ingredientsLookup';

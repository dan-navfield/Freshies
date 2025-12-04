/**
 * Product Comparison Types
 */

export interface ComparisonProduct {
  barcode: string;
  name: string;
  brand: string;
  category: string;
  imageUrl?: string;
  
  // Safety data
  rating: string; // SUPER_GENTLE, GENTLE, etc.
  riskScore: number;
  
  // Ingredient data
  totalIngredients: number;
  concernCounts: {
    low: number;
    mild: number;
    medium: number;
    high: number;
  };
  
  // Review data
  averageRating?: number;
  totalReviews: number;
  
  // Key flags
  hasFragrance: boolean;
  hasParabens: boolean;
  hasSulfates: boolean;
  isVegan?: boolean;
  isCrueltyFree?: boolean;
}

export interface ComparisonSet {
  id: string;
  user_id: string;
  name: string;
  products: ComparisonProduct[];
  created_at: string;
  updated_at: string;
}

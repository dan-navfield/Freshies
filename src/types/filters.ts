/**
 * Product Search and Filter Types
 */

export type SafetyRating = 'SUPER_GENTLE' | 'GENTLE' | 'MOSTLY_SAFE' | 'CAUTION' | 'AVOID' | 'UNKNOWN';
export type ProductCategory = 'cleanser' | 'moisturizer' | 'sunscreen' | 'shampoo' | 'body_wash' | 'lotion' | 'other';
export type SkinType = 'normal' | 'dry' | 'oily' | 'sensitive' | 'combination';
export type AgeRange = '0-2' | '3-5' | '6-8' | '9-12' | '13+';

export interface ProductFilters {
  // Safety
  safetyRatings?: SafetyRating[];
  maxRiskScore?: number;
  
  // Category
  categories?: ProductCategory[];
  
  // Ingredients
  excludeFragrance?: boolean;
  excludeParabens?: boolean;
  excludeSulfates?: boolean;
  excludeAlcohol?: boolean;
  
  // Child-specific
  skinTypes?: SkinType[];
  ageRanges?: AgeRange[];
  allergyFree?: string[]; // List of allergens to avoid
  
  // Reviews
  minRating?: number;
  minReviews?: number;
  
  // Certifications
  veganOnly?: boolean;
  crueltyFreeOnly?: boolean;
  organicOnly?: boolean;
  
  // Price (if available)
  maxPrice?: number;
}

export interface SearchOptions {
  query?: string;
  filters?: ProductFilters;
  sortBy?: 'relevance' | 'safety' | 'rating' | 'reviews' | 'name';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface FilterOption {
  id: string;
  label: string;
  value: any;
  count?: number;
  icon?: string;
}

export interface FilterGroup {
  id: string;
  label: string;
  type: 'checkbox' | 'radio' | 'range' | 'toggle';
  options: FilterOption[];
  expanded?: boolean;
}

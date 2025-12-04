/**
 * Product Reviews and Ratings Types
 */

export type ExperienceRating = 'worked_well' | 'somewhat' | 'no_irritation';
export type SkinType = 'normal' | 'dry' | 'oily' | 'sensitive' | 'combination';

export interface ProductReview {
  id: string;
  product_barcode: string;
  product_name: string;
  product_brand?: string;
  
  // Reviewer
  user_id: string;
  child_id?: string;
  
  // Review content
  experience_rating: ExperienceRating;
  review_text?: string;
  
  // Child context (snapshot at review time)
  child_age?: number;
  child_skin_type?: SkinType;
  child_allergies?: string[];
  
  // Helpfulness
  helpful_count: number;
  not_helpful_count: number;
  
  // Moderation
  is_flagged: boolean;
  is_approved: boolean;
  flagged_reason?: string;
  
  // Metadata
  created_at: string;
  updated_at: string;
}

export interface ProductRating {
  id: string;
  product_barcode: string;
  user_id: string;
  child_id?: string;
  rating: number; // 1-5
  created_at: string;
  updated_at: string;
}

export interface ReviewHelpfulness {
  id: string;
  review_id: string;
  user_id: string;
  is_helpful: boolean;
  created_at: string;
}

// For creating a new review
export interface CreateReviewRequest {
  product_barcode: string;
  product_name: string;
  product_brand?: string;
  child_id?: string;
  experience_rating: ExperienceRating;
  review_text?: string;
  child_age?: number;
  child_skin_type?: SkinType;
  child_allergies?: string[];
}

// For creating a rating
export interface CreateRatingRequest {
  product_barcode: string;
  child_id?: string;
  rating: number;
}

// Aggregated review data for display
export interface ReviewWithContext extends ProductReview {
  user_has_marked_helpful?: boolean;
  user_helpfulness_vote?: boolean; // true = helpful, false = not helpful
}

// Product review summary
export interface ProductReviewSummary {
  total_reviews: number;
  average_rating?: number;
  rating_distribution?: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  experience_breakdown?: {
    worked_well: number;
    somewhat: number;
    no_irritation: number;
  };
}

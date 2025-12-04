/**
 * Product Reviews and Ratings Service
 * Handles all review and rating operations
 */

import { supabase } from '../lib/supabase';
import type {
  ProductReview,
  ProductRating,
  CreateReviewRequest,
  CreateRatingRequest,
  ReviewWithContext,
  ProductReviewSummary,
} from '../types/reviews';

/**
 * Get reviews for a product
 */
export async function getProductReviews(
  productBarcode: string,
  userId?: string
): Promise<ReviewWithContext[]> {
  try {
    const { data: reviews, error } = await supabase
      .from('product_reviews')
      .select('*')
      .eq('product_barcode', productBarcode)
      .eq('is_approved', true)
      .eq('is_flagged', false)
      .order('helpful_count', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Return empty array if no reviews
    if (!reviews || reviews.length === 0) {
      return [];
    }

    // If user is logged in, get their helpfulness votes
    if (userId && reviews.length > 0) {
      const reviewIds = reviews.map(r => r.id);
      const { data: helpfulness } = await supabase
        .from('review_helpfulness')
        .select('review_id, is_helpful')
        .eq('user_id', userId)
        .in('review_id', reviewIds);

      const helpfulnessMap = new Map(
        helpfulness?.map(h => [h.review_id, h.is_helpful]) || []
      );

      return reviews.map(review => ({
        ...review,
        user_has_marked_helpful: helpfulnessMap.has(review.id),
        user_helpfulness_vote: helpfulnessMap.get(review.id),
      }));
    }

    return reviews;
  } catch (error) {
    console.error('Error fetching product reviews:', error);
    throw error;
  }
}

/**
 * Create a new review
 */
export async function createReview(
  review: CreateReviewRequest,
  userId: string
): Promise<ProductReview> {
  try {
    const { data, error } = await supabase
      .from('product_reviews')
      .insert({
        ...review,
        user_id: userId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating review:', error);
    throw error;
  }
}

/**
 * Update a review
 */
export async function updateReview(
  reviewId: string,
  updates: Partial<CreateReviewRequest>
): Promise<ProductReview> {
  try {
    const { data, error } = await supabase
      .from('product_reviews')
      .update(updates)
      .eq('id', reviewId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating review:', error);
    throw error;
  }
}

/**
 * Delete a review
 */
export async function deleteReview(reviewId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('product_reviews')
      .delete()
      .eq('id', reviewId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting review:', error);
    throw error;
  }
}

/**
 * Mark a review as helpful or not helpful
 */
export async function markReviewHelpful(
  reviewId: string,
  userId: string,
  isHelpful: boolean
): Promise<void> {
  try {
    // Upsert - insert or update if already exists
    const { error } = await supabase
      .from('review_helpfulness')
      .upsert({
        review_id: reviewId,
        user_id: userId,
        is_helpful: isHelpful,
      }, {
        onConflict: 'review_id,user_id'
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error marking review helpful:', error);
    throw error;
  }
}

/**
 * Remove helpfulness vote
 */
export async function removeHelpfulnessVote(
  reviewId: string,
  userId: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('review_helpfulness')
      .delete()
      .eq('review_id', reviewId)
      .eq('user_id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Error removing helpfulness vote:', error);
    throw error;
  }
}

/**
 * Get product rating by user
 */
export async function getUserProductRating(
  productBarcode: string,
  userId: string,
  childId?: string
): Promise<ProductRating | null> {
  try {
    let query = supabase
      .from('product_ratings')
      .select('*')
      .eq('product_barcode', productBarcode)
      .eq('user_id', userId);

    if (childId) {
      query = query.eq('child_id', childId);
    } else {
      query = query.is('child_id', null);
    }

    const { data, error } = await query.single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
    return data;
  } catch (error) {
    console.error('Error fetching user rating:', error);
    return null;
  }
}

/**
 * Create or update a product rating
 */
export async function rateProduct(
  rating: CreateRatingRequest,
  userId: string
): Promise<ProductRating> {
  try {
    const { data, error } = await supabase
      .from('product_ratings')
      .upsert({
        ...rating,
        user_id: userId,
      }, {
        onConflict: 'product_barcode,user_id,child_id'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error rating product:', error);
    throw error;
  }
}

/**
 * Get product review summary/statistics
 */
export async function getProductReviewSummary(
  productBarcode: string
): Promise<ProductReviewSummary> {
  try {
    // Get review count and experience breakdown
    const { data: reviews, error: reviewError } = await supabase
      .from('product_reviews')
      .select('experience_rating')
      .eq('product_barcode', productBarcode)
      .eq('is_approved', true)
      .eq('is_flagged', false);

    if (reviewError) throw reviewError;

    // Get ratings
    const { data: ratings, error: ratingError } = await supabase
      .from('product_ratings')
      .select('rating')
      .eq('product_barcode', productBarcode);

    if (ratingError) throw ratingError;

    // Calculate experience breakdown
    const experienceBreakdown = {
      worked_well: 0,
      somewhat: 0,
      no_irritation: 0,
    };

    reviews?.forEach(r => {
      if (r.experience_rating in experienceBreakdown) {
        experienceBreakdown[r.experience_rating as keyof typeof experienceBreakdown]++;
      }
    });

    // Calculate rating distribution and average
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let totalRating = 0;

    ratings?.forEach(r => {
      ratingDistribution[r.rating as keyof typeof ratingDistribution]++;
      totalRating += r.rating;
    });

    const averageRating = ratings && ratings.length > 0 
      ? totalRating / ratings.length 
      : undefined;

    return {
      total_reviews: reviews?.length || 0,
      average_rating: averageRating,
      rating_distribution: ratingDistribution,
      experience_breakdown: experienceBreakdown,
    };
  } catch (error) {
    console.error('Error fetching review summary:', error);
    throw error;
  }
}

/**
 * Check if user has already reviewed this product
 */
export async function hasUserReviewedProduct(
  productBarcode: string,
  userId: string,
  childId?: string
): Promise<boolean> {
  try {
    let query = supabase
      .from('product_reviews')
      .select('id')
      .eq('product_barcode', productBarcode)
      .eq('user_id', userId);

    if (childId) {
      query = query.eq('child_id', childId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data?.length || 0) > 0;
  } catch (error) {
    console.error('Error checking if user reviewed:', error);
    return false;
  }
}

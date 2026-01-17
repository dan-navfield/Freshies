/**
 * Safety Service
 * Main service for product safety calculations and database operations
 */

import { supabase } from '../../lib/supabase';
import { calculateProductSafety } from './calculator';
import { calculateProfileSafety } from './profileCalculator';
import {
  Product,
  SafetyRule,
  SafetyCalculationResult,
  ProfileSafetyResult,
  CalculationOptions,
  ProductActivityLog
} from './types';

// =====================================================
// MAIN SERVICE CLASS
// =====================================================

export class SafetyService {
  
  /**
   * Calculate and save safety score for a product
   */
  async calculateAndSaveProductSafety(
    productId: string,
    options: CalculationOptions = {}
  ): Promise<SafetyCalculationResult> {
    
    // Fetch product with ingredients
    const product = await this.fetchProductWithIngredients(productId);
    
    if (!product) {
      throw new Error(`Product not found: ${productId}`);
    }
    
    // Check if recalculation is needed
    if (!this.needsRecalculation(product, options)) {
      // Return existing calculation
      return {
        weighted_score: 0,
        total_penalties: 0,
        contextual_adjustments: 0,
        final_score: product.safety_score_global || 0,
        tier: product.safety_tier_global || 'E',
        ingredient_contributions: [],
        applied_penalties: [],
        applied_adjustments: [],
        calculated_at: product.safety_last_calculated_at || new Date().toISOString(),
        calculation_version: '1.0.0'
      };
    }
    
    // Fetch safety rules
    const rules = await this.fetchSafetyRules();
    
    // Calculate safety score
    const result = await calculateProductSafety(product, rules, options);
    
    // Save to database
    await this.saveCalculationResult(productId, result);
    
    // Log activity
    await this.logActivity(productId, 'safety_recalculated', {
      old_score: product.safety_score_global,
      new_score: result.final_score,
      old_tier: product.safety_tier_global,
      new_tier: result.tier
    });
    
    return result;
  }
  
  /**
   * Get profile-specific safety assessment
   */
  async getProfileSafety(
    productId: string,
    childProfileId: string
  ): Promise<ProfileSafetyResult> {
    
    // Ensure product has global score
    const product = await this.fetchProductWithIngredients(productId);
    if (!product) {
      throw new Error(`Product not found: ${productId}`);
    }
    
    if (!product.safety_score_global) {
      // Calculate global score first
      await this.calculateAndSaveProductSafety(productId);
      // Refetch
      const updatedProduct = await this.fetchProductWithIngredients(productId);
      if (updatedProduct) {
        Object.assign(product, updatedProduct);
      }
    }
    
    // Fetch child profile
    const childProfile = await this.fetchChildProfile(childProfileId);
    if (!childProfile) {
      throw new Error(`Child profile not found: ${childProfileId}`);
    }
    
    // Fetch profile rules
    const profileRules = await this.fetchSafetyRules('profile_penalty');
    
    // Calculate profile-specific safety
    const result = await calculateProfileSafety(product, childProfile, profileRules);
    
    return result;
  }
  
  /**
   * Set manual override for a product
   */
  async setManualOverride(
    productId: string,
    score: number,
    reason: string,
    adminId: string
  ): Promise<void> {
    
    // Fetch current product
    const { data: product } = await supabase
      .from('products')
      .select('safety_score_global, safety_tier_global')
      .eq('id', productId)
      .single();
    
    // Update product
    await supabase
      .from('products')
      .update({
        safety_manual_override: true,
        safety_manual_value: score,
        safety_manual_reason: reason,
        safety_manual_set_by: adminId,
        safety_manual_set_at: new Date().toISOString(),
        safety_score_global: score,
        safety_tier_global: this.determineTier(score)
      })
      .eq('id', productId);
    
    // Log activity
    await this.logActivity(productId, 'safety_override_set', {
      old_score: product?.safety_score_global,
      new_score: score,
      reason,
      admin_id: adminId
    });
  }
  
  /**
   * Remove manual override
   */
  async removeManualOverride(
    productId: string,
    adminId: string
  ): Promise<void> {
    
    // Update product
    await supabase
      .from('products')
      .update({
        safety_manual_override: false,
        safety_manual_value: null,
        safety_manual_reason: null,
        safety_manual_set_by: null,
        safety_manual_set_at: null
      })
      .eq('id', productId);
    
    // Recalculate
    await this.calculateAndSaveProductSafety(productId, { apply_manual_override: false });
    
    // Log activity
    await this.logActivity(productId, 'safety_override_removed', {
      admin_id: adminId
    });
  }
  
  /**
   * Recalculate all products (batch operation)
   */
  async recalculateAllProducts(): Promise<{ success: number; failed: number }> {
    
    let success = 0;
    let failed = 0;
    
    // Fetch all product IDs
    const { data: products } = await supabase
      .from('products')
      .select('id')
      .eq('safety_manual_override', false);
    
    if (!products) return { success, failed };
    
    // Process in batches
    for (const product of products) {
      try {
        await this.calculateAndSaveProductSafety(product.id);
        success++;
      } catch (error) {
        console.error(`Failed to calculate safety for product ${product.id}:`, error);
        failed++;
      }
    }
    
    return { success, failed };
  }
  
  // =====================================================
  // PRIVATE HELPER METHODS
  // =====================================================
  
  private async fetchProductWithIngredients(productId: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        product_ingredients(
          *,
          ingredient:ingredients(*)
        )
      `)
      .eq('id', productId)
      .single();
    
    if (error || !data) {
      console.error('Error fetching product:', error);
      return null;
    }
    
    return data as Product;
  }
  
  private async fetchSafetyRules(category?: string): Promise<SafetyRule[]> {
    let query = supabase
      .from('safety_rules')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: true });
    
    if (category) {
      query = query.eq('rule_category', category);
    }
    
    const { data, error } = await query;
    
    if (error || !data) {
      console.error('Error fetching safety rules:', error);
      return [];
    }
    
    return data as SafetyRule[];
  }
  
  private async fetchChildProfile(childProfileId: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('child_profiles')
      .select('*')
      .eq('id', childProfileId)
      .single();
    
    if (error || !data) {
      console.error('Error fetching child profile:', error);
      return null;
    }
    
    return data;
  }
  
  private needsRecalculation(product: Product, options: CalculationOptions): boolean {
    // Always recalculate if no score exists
    if (!product.safety_score_global) return true;
    
    // Check manual override
    if (product.safety_manual_override && options.apply_manual_override !== false) {
      return false;
    }
    
    // Check if stale
    if (options.recalculate_if_stale && product.safety_last_calculated_at) {
      const staleThreshold = options.stale_threshold_hours || 24;
      const lastCalculated = new Date(product.safety_last_calculated_at);
      const now = new Date();
      const hoursSince = (now.getTime() - lastCalculated.getTime()) / (1000 * 60 * 60);
      
      return hoursSince > staleThreshold;
    }
    
    return false;
  }
  
  private async saveCalculationResult(
    productId: string,
    result: SafetyCalculationResult
  ): Promise<void> {
    
    await supabase
      .from('products')
      .update({
        safety_score_global: result.final_score,
        safety_tier_global: result.tier,
        safety_last_calculated_at: result.calculated_at
      })
      .eq('id', productId);
  }
  
  private async logActivity(
    productId: string,
    actionType: string,
    details: any
  ): Promise<void> {
    
    await supabase
      .from('product_activity_history')
      .insert({
        product_id: productId,
        action_type: actionType,
        action_details: details,
        created_at: new Date().toISOString()
      });
  }
  
  private determineTier(score: number): 'A' | 'B' | 'C' | 'D' | 'E' {
    if (score >= 85) return 'A';
    if (score >= 70) return 'B';
    if (score >= 55) return 'C';
    if (score >= 40) return 'D';
    return 'E';
  }
}

// Export singleton instance
export const safetyService = new SafetyService();

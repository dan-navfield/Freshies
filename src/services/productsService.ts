/**
 * Child Products Service
 * Manages approved products for children
 */

import { supabase } from '../lib/supabase';
import { ChildProduct } from '../types/products';

/**
 * Add approved product to child's library
 */
export async function addChildProduct(
  childId: string,
  approvalId: string,
  productData: {
    product_id?: string;
    product_name: string;
    product_brand?: string;
    product_image_url?: string;
    product_category?: string;
    parent_notes?: string;
  }
): Promise<ChildProduct | null> {
  try {
    const { data, error } = await supabase
      .from('child_products')
      .insert({
        child_id: childId,
        approval_id: approvalId,
        ...productData,
        status: 'active',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error adding child product:', error);
    return null;
  }
}

/**
 * Get all products for a child
 */
export async function getChildProducts(
  childId: string,
  status?: 'active' | 'discontinued' | 'removed'
): Promise<ChildProduct[]> {
  try {
    let query = supabase
      .from('child_products')
      .select('*')
      .eq('child_id', childId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching child products:', error);
    return [];
  }
}

/**
 * Update product usage
 */
export async function updateProductUsage(productId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('child_products')
      .update({
        last_used_at: new Date().toISOString(),
        usage_count: supabase.rpc('increment', { row_id: productId }),
      })
      .eq('id', productId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating product usage:', error);
    return false;
  }
}

/**
 * Log product usage
 */
export async function logProductUsage(
  childId: string,
  productId: string,
  routineId?: string,
  notes?: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('product_usage_log')
      .insert({
        child_id: childId,
        product_id: productId,
        routine_id: routineId,
        notes: notes,
        used_at: new Date().toISOString(),
      });

    if (error) throw error;
    
    // Update product usage count
    await updateProductUsage(productId);
    
    return true;
  } catch (error) {
    console.error('Error logging product usage:', error);
    return false;
  }
}

/**
 * Remove product from child's library
 */
export async function removeChildProduct(productId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('child_products')
      .update({ status: 'removed' })
      .eq('id', productId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error removing child product:', error);
    return false;
  }
}

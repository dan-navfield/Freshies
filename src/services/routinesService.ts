/**
 * Routines Service
 * Manages child routines and routine products
 */

import { supabase } from '../lib/supabase';
import { ChildRoutine, RoutineProduct, RoutineWithProducts } from '../types/products';

/**
 * Get all routines for a child
 */
export async function getChildRoutines(childId: string): Promise<RoutineWithProducts[]> {
  try {
    const { data, error } = await supabase
      .from('child_routines')
      .select(`
        *,
        routine_products (
          *,
          product:child_products (*)
        )
      `)
      .eq('child_id', childId)
      .order('routine_type', { ascending: true });

    if (error) throw error;
    
    // Map routine_products to products for type compatibility
    return (data || []).map(routine => ({
      ...routine,
      products: routine.routine_products || []
    }));
  } catch (error) {
    console.error('Error fetching child routines:', error);
    return [];
  }
}

/**
 * Get a specific routine
 */
export async function getRoutine(routineId: string): Promise<RoutineWithProducts | null> {
  try {
    const { data, error } = await supabase
      .from('child_routines')
      .select(`
        *,
        routine_products (
          *,
          product:child_products (*)
        )
      `)
      .eq('id', routineId)
      .single();

    if (error) throw error;
    
    // Map routine_products to products for type compatibility
    if (data) {
      return {
        ...data,
        products: data.routine_products || []
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching routine:', error);
    return null;
  }
}

/**
 * Add product to routine
 */
export async function addProductToRoutine(
  routineId: string,
  productId: string,
  stepOrder?: number,
  instructions?: string
): Promise<boolean> {
  try {
    // Get current max step order if not provided
    if (stepOrder === undefined) {
      const { data: existingProducts } = await supabase
        .from('routine_products')
        .select('step_order')
        .eq('routine_id', routineId)
        .order('step_order', { ascending: false })
        .limit(1);

      stepOrder = existingProducts && existingProducts.length > 0 
        ? existingProducts[0].step_order + 1 
        : 0;
    }

    const { error } = await supabase
      .from('routine_products')
      .insert({
        routine_id: routineId,
        product_id: productId,
        step_order: stepOrder,
        instructions: instructions,
      });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error adding product to routine:', error);
    return false;
  }
}

/**
 * Remove product from routine
 */
export async function removeProductFromRoutine(
  routineId: string,
  productId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('routine_products')
      .delete()
      .eq('routine_id', routineId)
      .eq('product_id', productId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error removing product from routine:', error);
    return false;
  }
}

/**
 * Update routine product order
 */
export async function updateRoutineProductOrder(
  routineProductId: string,
  newOrder: number
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('routine_products')
      .update({ step_order: newOrder })
      .eq('id', routineProductId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating routine product order:', error);
    return false;
  }
}

/**
 * Create custom routine
 */
export async function createRoutine(
  childId: string,
  name: string,
  routineType: 'morning' | 'evening' | 'custom',
  description?: string,
  reminderTime?: string
): Promise<ChildRoutine | null> {
  try {
    const { data, error } = await supabase
      .from('child_routines')
      .insert({
        child_id: childId,
        name: name,
        routine_type: routineType,
        description: description,
        reminder_time: reminderTime,
        enabled: true,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating routine:', error);
    return null;
  }
}

/**
 * Update routine
 */
export async function updateRoutine(
  routineId: string,
  updates: Partial<ChildRoutine>
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('child_routines')
      .update(updates)
      .eq('id', routineId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating routine:', error);
    return false;
  }
}

/**
 * Delete routine
 */
export async function deleteRoutine(routineId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('child_routines')
      .delete()
      .eq('id', routineId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting routine:', error);
    return false;
  }
}

import { supabase } from './supabase';

/**
 * Test Supabase connection by fetching ingredients
 */
export async function testSupabaseConnection() {
  try {
    console.log('🔍 Testing Supabase connection...');
    
    // Test 1: Fetch ingredients
    const { data: ingredients, error: ingredientsError } = await supabase
      .from('ingredients')
      .select('inci_name, common_name, family')
      .limit(5);
    
    if (ingredientsError) {
      console.error('❌ Error fetching ingredients:', ingredientsError);
      return false;
    }
    
    console.log('✅ Successfully fetched ingredients:', ingredients?.length);
    console.log('Sample:', ingredients?.[0]);
    
    // Test 2: Fetch products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('name, category')
      .limit(3);
    
    if (productsError) {
      console.error('❌ Error fetching products:', productsError);
      return false;
    }
    
    console.log('✅ Successfully fetched products:', products?.length);
    
    // Test 3: Fetch lessons
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('title, slug')
      .limit(3);
    
    if (lessonsError) {
      console.error('❌ Error fetching lessons:', lessonsError);
      return false;
    }
    
    console.log('✅ Successfully fetched lessons:', lessons?.length);
    
    console.log('🎉 All Supabase connection tests passed!');
    return true;
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

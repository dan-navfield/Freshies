import { supabase } from '../../../lib/supabase';
import { ChildProduct } from '../../../types/products';

export interface ProductDetail {
  id: string;
  name: string;
  brand: string;
  category: string;
  imageUrl?: string;
  description?: string;
  safetyScore: number;
  safetyTier: 'A' | 'B' | 'C' | 'D' | 'E';
  barcode?: string;
  formFactor?: string;
  targetAge?: string;
  benefits?: string[];
  concerns?: string[];
  aiSummary?: string;
}

const mapDatabaseToProduct = (item: any): ProductDetail => {
  return {
    id: item.id,
    name: item.name,
    brand: item.brand || 'Unknown Brand',
    category: item.category || 'Personal Care',
    imageUrl: item.image_url || item.imageUrl,
    description: item.ai_summary || item.description, // Prefer AI summary if available
    safetyScore: item.safety_score_global || 0,
    safetyTier: item.safety_tier_global || 'E',
    barcode: item.barcode,
    formFactor: item.form_factor,
    targetAge: item.target_age_band,
    benefits: item.benefits || [],
    concerns: item.concerns || [],
    aiSummary: item.ai_summary
  };
};

export const getPopularProducts = async (): Promise<ProductDetail[]> => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('safety_score_global', { ascending: false }) // Show best products first? Or check for popularity column
    .limit(20);

  if (error) {
    console.error('Error fetching popular products:', error);
    return [];
  }
  return data.map(mapDatabaseToProduct);
};

export const getProductsByFilter = async (filter: string): Promise<ProductDetail[]> => {
  let query = supabase.from('products').select('*');

  switch (filter) {
    case 'safe':
      // Tier A or score > 80
      query = query.gte('safety_score_global', 80);
      break;
    case 'moisturizer':
      query = query.ilike('category', '%moisturizer%');
      break;
    case 'cleanser':
      query = query.or('category.ilike.%cleanser%,category.ilike.%wash%');
      break;
    case 'sunscreen':
      query = query.or('category.ilike.%sun%,category.ilike.%spf%');
      break;
    case 'lip':
      query = query.ilike('category', '%lip%');
      break;
    default:
      // 'all' or fallback
      break;
  }

  // Always order by safety score for child view
  query = query.order('safety_score_global', { ascending: false }).limit(20);

  const { data, error } = await query;
  if (error) {
    console.error('Error filtering products:', error);
    return [];
  }
  return data.map(mapDatabaseToProduct);
};

export const searchProducts = async (query: string): Promise<ProductDetail[]> => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .or(`name.ilike.%${query}%,brand.ilike.%${query}%`)
    .limit(20);

  if (error) {
    console.error('Error searching products:', error);
    return [];
  }
  return data.map(mapDatabaseToProduct);
};

export const getProductById = async (id: string): Promise<ProductDetail | undefined> => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return undefined;
  return mapDatabaseToProduct(data);
};

export const logProductUsage = async (childId: string, childProductId: string): Promise<boolean> => {
  try {
    // 1. Get current count
    const { data: current, error: fetchError } = await supabase
      .from('child_products')
      .select('usage_count')
      .eq('id', childProductId)
      .single();

    if (fetchError) throw fetchError;

    // 2. Increment and update date
    const { error } = await supabase
      .from('child_products')
      .update({
        usage_count: (current?.usage_count || 0) + 1,
        last_used_at: new Date().toISOString()
      })
      .eq('id', childProductId);

    if (error) {
      console.error('Error logging usage:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error logging usage:', error);
    return false;
  }
};

export const removeChildProduct = async (childProductId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('child_products')
      .delete()
      .eq('id', childProductId);

    if (error) {
      console.error('Error removing product:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error removing product:', error);
    return false;
  }
};

export const getChildProducts = async (childId: string, status?: string): Promise<ChildProduct[]> => {
  let query = supabase
    .from('child_products')
    .select('*')
    .eq('child_id', childId)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching child products:', error);
    return [];
  }
  return data as ChildProduct[];
};

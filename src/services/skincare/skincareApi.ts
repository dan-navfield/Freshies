/**
 * SkincareAPI Integration
 * Free API with 2,000+ skincare products from US, Korea, and Japan
 * https://github.com/LauraAddams/skincareAPI
 */

const BASE_URL = 'https://skincare-api.herokuapp.com';

export interface SkincareProduct {
  id: number;
  brand: string;
  name: string;
  ingredient_list: string[];
}

/**
 * Get all products
 */
export async function getAllSkincareProducts(): Promise<SkincareProduct[]> {
  try {
    const response = await fetch(`${BASE_URL}/products`);
    if (!response.ok) {
      throw new Error(`SkincareAPI error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('SkincareAPI getAllProducts error:', error);
    throw error;
  }
}

/**
 * Get single product by ID
 */
export async function getSkincareProduct(id: number): Promise<SkincareProduct> {
  try {
    const response = await fetch(`${BASE_URL}/products/${id}`);
    if (!response.ok) {
      throw new Error(`SkincareAPI error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('SkincareAPI getProduct error:', error);
    throw error;
  }
}

/**
 * Search products by query (brand or product name)
 */
export async function searchSkincareProducts(query: string): Promise<SkincareProduct[]> {
  try {
    const response = await fetch(`${BASE_URL}/product?q=${encodeURIComponent(query)}`);
    if (!response.ok) {
      // Silently fail - API might be down
      return [];
    }
    return await response.json();
  } catch (error) {
    // Silently fail - don't log errors to avoid console spam
    return []; // Return empty array on error
  }
}

/**
 * Search by ingredient
 */
export async function searchByIngredient(ingredient: string): Promise<SkincareProduct[]> {
  try {
    const response = await fetch(`${BASE_URL}/ingredient?q=${encodeURIComponent(ingredient)}`);
    if (!response.ok) {
      throw new Error(`SkincareAPI error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('SkincareAPI searchByIngredient error:', error);
    return [];
  }
}

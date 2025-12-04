/**
 * Makeup API Integration
 * Limited makeup product dataset
 * Documentation: http://makeup-api.herokuapp.com/
 */

const BASE_URL = 'http://makeup-api.herokuapp.com/api/v1/products';

export interface MakeupAPIProduct {
  id: number;
  brand: string;
  name: string;
  price: string;
  price_sign: string;
  currency: string;
  image_link: string;
  product_link: string;
  website_link: string;
  description: string;
  rating: number | null;
  category: string;
  product_type: string;
  tag_list: string[];
  created_at: string;
  updated_at: string;
  product_api_url: string;
  api_featured_image: string;
  product_colors: Array<{
    hex_value: string;
    colour_name: string;
  }>;
}

/**
 * Search makeup products by brand
 */
export async function searchMakeupByBrand(brand: string): Promise<MakeupAPIProduct[]> {
  try {
    const response = await fetch(`${BASE_URL}.json?brand=${encodeURIComponent(brand)}`);

    if (!response.ok) {
      throw new Error(`Makeup API error: ${response.status}`);
    }

    const data = await response.json();
    return data || [];
  } catch (error) {
    // Silently fail - this is a non-critical external API
    // console.log('Makeup API unavailable, using cached data');
    return [];
  }
}

/**
 * Search makeup products by product type
 */
export async function searchMakeupByType(productType: string): Promise<MakeupAPIProduct[]> {
  try {
    const response = await fetch(`${BASE_URL}.json?product_type=${encodeURIComponent(productType)}`);

    if (!response.ok) {
      throw new Error(`Makeup API error: ${response.status}`);
    }

    const data = await response.json();
    return data || [];
  } catch (error) {
    // Silently fail - this is a non-critical external API
    return [];
  }
}

/**
 * Search makeup products by category
 */
export async function searchMakeupByCategory(category: string): Promise<MakeupAPIProduct[]> {
  try {
    const response = await fetch(`${BASE_URL}.json?product_category=${encodeURIComponent(category)}`);

    if (!response.ok) {
      throw new Error(`Makeup API error: ${response.status}`);
    }

    const data = await response.json();
    return data || [];
  } catch (error) {
    // Silently fail - this is a non-critical external API
    return [];
  }
}

/**
 * Search makeup products with multiple filters
 */
export async function searchMakeup(params: {
  brand?: string;
  productType?: string;
  category?: string;
  tags?: string[];
  priceGreaterThan?: number;
  priceLessThan?: number;
  rating?: number;
}): Promise<MakeupAPIProduct[]> {
  try {
    const queryParams = new URLSearchParams();
    
    if (params.brand) queryParams.append('brand', params.brand);
    if (params.productType) queryParams.append('product_type', params.productType);
    if (params.category) queryParams.append('product_category', params.category);
    if (params.tags) params.tags.forEach(tag => queryParams.append('product_tags', tag));
    if (params.priceGreaterThan) queryParams.append('price_greater_than', params.priceGreaterThan.toString());
    if (params.priceLessThan) queryParams.append('price_less_than', params.priceLessThan.toString());
    if (params.rating) queryParams.append('rating_greater_than', params.rating.toString());

    const response = await fetch(`${BASE_URL}.json?${queryParams.toString()}`);

    if (!response.ok) {
      throw new Error(`Makeup API error: ${response.status}`);
    }

    const data = await response.json();
    return data || [];
  } catch (error) {
    // Silently fail - this is a non-critical external API
    return [];
  }
}

/**
 * Get all makeup products (paginated)
 */
export async function getAllMakeupProducts(): Promise<MakeupAPIProduct[]> {
  try {
    const response = await fetch(`${BASE_URL}.json`);

    if (!response.ok) {
      throw new Error(`Makeup API error: ${response.status}`);
    }

    const data = await response.json();
    return data || [];
  } catch (error) {
    // Silently fail - this is a non-critical external API
    return [];
  }
}

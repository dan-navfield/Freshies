/**
 * BeautyFeeds.io API Integration
 * Product catalogue/retail data with pricing, availability, and enriched metadata
 * Documentation: https://app.beautyfeeds.io/docs
 */

const BEAUTYFEEDS_API_KEY = process.env.EXPO_PUBLIC_BEAUTYFEEDS_API_KEY;
const BASE_URL = 'https://api.beautyfeeds.io/v1';

export interface BeautyFeedsProduct {
  id: string;
  name: string;
  brand: string;
  category?: string;
  description?: string;
  price?: {
    amount: number;
    currency: string;
  };
  images?: string[];
  barcode?: string;
  asin?: string; // Amazon ASIN
  upc?: string; // Universal Product Code
  ean_list?: string[]; // European Article Numbers
  gtin_list?: string[]; // Global Trade Item Numbers
  ingredients?: string;
  availability?: {
    inStock: boolean;
    retailers: string[];
  };
  rating?: number;
  reviewCount?: number;
  url?: string;
}

export interface BeautyFeedsSearchResult {
  products: BeautyFeedsProduct[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Search products by query
 */
export async function searchBeautyFeedsProducts(
  query: string,
  options?: {
    page?: number;
    pageSize?: number;
    category?: string;
    brand?: string;
  }
): Promise<BeautyFeedsSearchResult> {
  if (!BEAUTYFEEDS_API_KEY) {
    throw new Error('BeautyFeeds API key not configured');
  }

  try {
    const params = new URLSearchParams({
      q: query,
      page: (options?.page || 1).toString(),
      page_size: (options?.pageSize || 20).toString(),
    });

    if (options?.category) params.append('category', options.category);
    if (options?.brand) params.append('brand', options.brand);

    const response = await fetch(`${BASE_URL}/products/search?${params}`, {
      headers: {
        'Authorization': `Bearer ${BEAUTYFEEDS_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`BeautyFeeds API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      products: data.products || [],
      total: data.total || 0,
      page: data.page || 1,
      pageSize: data.page_size || 20,
    };
  } catch (error) {
    // Silently fail - API requires key
    throw error;
  }
}

/**
 * Get product by barcode or ASIN
 * Supports UPC, EAN, and Amazon ASIN codes
 */
export async function getBeautyFeedsProductByBarcode(
  code: string
): Promise<BeautyFeedsProduct | null> {
  if (!BEAUTYFEEDS_API_KEY) {
    throw new Error('BeautyFeeds API key not configured');
  }

  try {
    // Try searching by the code (works for ASIN, UPC, EAN, etc.)
    const searchResults = await searchBeautyFeedsProducts(code, { pageSize: 5 });
    
    // Look for exact match in ASIN, UPC, EAN, or barcode fields
    const exactMatch = searchResults.products.find(p => 
      p.barcode === code || 
      (p as any).asin === code ||
      (p as any).upc === code ||
      (p as any).ean_list?.includes(code)
    );
    
    if (exactMatch) {
      console.log('✅ Found product by code:', code);
      return exactMatch;
    }

    // If no exact match but we have results, return the first one
    if (searchResults.products.length > 0) {
      console.log('✅ Found similar product for code:', code);
      return searchResults.products[0];
    }

    console.log('❌ No product found for code:', code);
    return null;
  } catch (error) {
    console.error('❌ BeautyFeeds code lookup error:', error);
    return null;
  }
}

/**
 * Get product by ID
 */
export async function getBeautyFeedsProductById(
  productId: string
): Promise<BeautyFeedsProduct | null> {
  if (!BEAUTYFEEDS_API_KEY) {
    throw new Error('BeautyFeeds API key not configured');
  }

  try {
    const response = await fetch(`${BASE_URL}/products/${productId}`, {
      headers: {
        'Authorization': `Bearer ${BEAUTYFEEDS_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`BeautyFeeds API error: ${response.status}`);
    }

    const data = await response.json();
    return data.product || null;
  } catch (error) {
    console.error('❌ BeautyFeeds product lookup error:', error);
    return null;
  }
}

/**
 * Get products by brand
 */
export async function getBeautyFeedsProductsByBrand(
  brand: string,
  options?: {
    page?: number;
    pageSize?: number;
  }
): Promise<BeautyFeedsSearchResult> {
  return searchBeautyFeedsProducts('', {
    ...options,
    brand,
  });
}

/**
 * Get trending/popular products
 */
export async function getBeautyFeedsTrendingProducts(
  options?: {
    category?: string;
    limit?: number;
  }
): Promise<BeautyFeedsProduct[]> {
  if (!BEAUTYFEEDS_API_KEY) {
    throw new Error('BeautyFeeds API key not configured');
  }

  try {
    const params = new URLSearchParams({
      limit: (options?.limit || 10).toString(),
    });

    if (options?.category) params.append('category', options.category);

    const response = await fetch(`${BASE_URL}/products/trending?${params}`, {
      headers: {
        'Authorization': `Bearer ${BEAUTYFEEDS_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`BeautyFeeds API error: ${response.status}`);
    }

    const data = await response.json();
    return data.products || [];
  } catch (error) {
    console.error('❌ BeautyFeeds trending products error:', error);
    return [];
  }
}

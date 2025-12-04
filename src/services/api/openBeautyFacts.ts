/**
 * Open Beauty Facts API Service
 * https://world.openbeautyfacts.org/api/v2/product/{barcode}
 */

const BASE_URL = 'https://world.openbeautyfacts.org/api/v2';

export interface ProductIngredient {
  id: string;
  text: string;
  percent_estimate?: number;
  vegan?: string;
  vegetarian?: string;
}

export interface ProductResponse {
  code: string;
  status: number;
  status_verbose: string;
  product?: {
    product_name?: string;
    brands?: string;
    categories?: string;
    image_url?: string;
    image_front_url?: string;
    image_ingredients_url?: string;
    ingredients_text?: string;
    ingredients?: ProductIngredient[];
    allergens?: string;
    traces?: string;
    labels?: string;
    countries?: string;
    manufacturing_places?: string;
    origins?: string;
    packaging?: string;
    quantity?: string;
    serving_size?: string;
    // Nutriscore and Ecoscore (if available)
    nutriscore_grade?: string;
    ecoscore_grade?: string;
    nova_group?: string;
  };
}

export interface ProductLookupResult {
  found: boolean;
  barcode: string;
  product?: {
    name: string;
    brand: string;
    category: string;
    imageUrl?: string;
    ingredientsText?: string;
    ingredients?: ProductIngredient[];
    allergens?: string[];
    labels?: string[];
    packaging?: string;
    quantity?: string;
  };
  error?: string;
}

/**
 * Look up a product by barcode
 */
export async function lookupProductByBarcode(
  barcode: string
): Promise<ProductLookupResult> {
  try {
    const response = await fetch(`${BASE_URL}/product/${barcode}.json`);
    const data: ProductResponse = await response.json();

    if (data.status === 0 || !data.product) {
      return {
        found: false,
        barcode,
        error: 'Product not found in database',
      };
    }

    const product = data.product;

    return {
      found: true,
      barcode,
      product: {
        name: product.product_name || 'Unknown Product',
        brand: product.brands || 'Unknown Brand',
        category: product.categories?.split(',')[0] || 'Personal Care',
        imageUrl: product.image_front_url || product.image_url,
        ingredientsText: product.ingredients_text,
        ingredients: product.ingredients,
        allergens: product.allergens?.split(',').map(a => a.trim()) || [],
        labels: product.labels?.split(',').map(l => l.trim()) || [],
        packaging: product.packaging,
        quantity: product.quantity,
      },
    };
  } catch (error) {
    console.error('Error looking up product:', error);
    return {
      found: false,
      barcode,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Search products by name (for manual entry)
 */
export async function searchProductsByName(query: string, page: number = 1) {
  try {
    const queryLower = query.toLowerCase().trim();
    
    // If query looks like a brand name (single word, no special chars), try brand endpoint first
    const isBrandQuery = /^[a-z0-9-]+$/i.test(queryLower) && !queryLower.includes(' ');
    
    if (isBrandQuery) {
      // Try brand-specific endpoint for better results
      const brandResponse = await fetch(
        `${BASE_URL}/brand/${encodeURIComponent(queryLower)}.json?page=${page}&page_size=20`
      );
      
      if (brandResponse.ok) {
        const brandData = await brandResponse.json();
        if (brandData.products && brandData.products.length > 0) {
          return brandData;
        }
      }
    }
    
    // Fall back to search endpoint
    const response = await fetch(
      `${BASE_URL}/search?search_terms=${encodeURIComponent(query)}&page=${page}&page_size=20&json=true&fields=code,product_name,brands,categories,image_url,ingredients_text&sort_by=unique_scans_n`
    );
    const data = await response.json();
    
    // Filter and rank results by relevance
    if (data.products) {
      const queryWords = queryLower.split(/\s+/);
      
      data.products = data.products
        .map((p: any) => {
          let relevance = 0;
          const name = (p.product_name || '').toLowerCase();
          const brand = (p.brands || '').toLowerCase();
          const fullText = `${brand} ${name}`.toLowerCase();
          
          // Exact brand match gets highest score
          if (brand === queryLower) relevance += 100;
          else if (brand.startsWith(queryLower)) relevance += 50;
          else if (brand.includes(queryLower)) relevance += 25;
          
          // Product name matches
          if (name === queryLower) relevance += 80;
          else if (name.startsWith(queryLower)) relevance += 40;
          else if (name.includes(queryLower)) relevance += 20;
          
          // Word matching
          queryWords.forEach(word => {
            if (word.length > 2) {
              if (fullText.includes(word)) relevance += 10;
            }
          });
          
          return { ...p, _relevance: relevance };
        })
        .filter((p: any) => p._relevance >= 20) // Require at least some match, not just having data
        .sort((a: any, b: any) => b._relevance - a._relevance);
    }
    
    return data;
  } catch (error) {
    console.error('Error searching products:', error);
    return { products: [], count: 0 };
  }
}

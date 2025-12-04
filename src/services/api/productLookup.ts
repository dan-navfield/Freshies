/**
 * Multi-source Product Lookup Service
 * Cascades through multiple APIs to find product data
 * Priority: Open Beauty Facts → UPCitemDB → EAN-Search → Makeup API → BeautyFeeds.io
 */

import { lookupProductByBarcode as lookupOpenBeautyFacts } from './openBeautyFacts';
import { analyzeIngredients, type IngredientAnalysis } from './ingredientsLookup';
import { getBeautyFeedsProductByBarcode, searchBeautyFeedsProducts } from '../beautyfeeds/api';
import { lookupUPCItemDB } from '../barcode/upcitemdb';
import { lookupEANSearch } from '../barcode/eanSearch';
import { searchMakeup } from '../makeup/makeupApi';

export interface ProductData {
  found: boolean;
  barcode?: string;
  source?: 'open_beauty_facts' | 'beauty_feeds' | 'upcitemdb' | 'ean_search' | 'makeup_api' | 'skincare_api' | 'manual';
  product?: {
    name: string;
    brand: string;
    category: string;
    imageUrl?: string;
    ingredientsText?: string;
    ingredients?: Array<{
      id: string;
      text: string;
      percent_estimate?: number;
    }>;
    allergens?: string[];
    labels?: string[];
    packaging?: string;
    quantity?: string;
    price?: string;
    productType?: string;
    description?: string;
  };
  analysis?: IngredientAnalysis; // Ingredient safety analysis
  error?: string;
  confidence?: 'high' | 'medium' | 'low';
}

/**
 * Main product lookup - cascades through multiple sources
 */
export async function lookupProduct(barcode: string): Promise<ProductData> {
  console.log(`🔍 Looking up product: ${barcode}`);

  // Try Open Beauty Facts first (best for cosmetics/personal care)
  try {
    const obfResult = await lookupOpenBeautyFacts(barcode);
    if (obfResult.found && obfResult.product) {
      console.log('✅ Found in Open Beauty Facts');
      
      // Analyze ingredients if available
      let analysis: IngredientAnalysis | undefined;
      if (obfResult.product.ingredientsText) {
        try {
          analysis = await analyzeIngredients(obfResult.product.ingredientsText);
          console.log(`📊 Ingredient analysis complete: ${analysis.totalIngredients} ingredients, safety score: ${analysis.safetyScore}`);
        } catch (error) {
          console.warn('⚠️ Ingredient analysis failed:', error);
        }
      }
      
      return {
        ...obfResult,
        source: 'open_beauty_facts',
        confidence: 'high',
        analysis,
      };
    }
  } catch (error) {
    console.warn('⚠️ Open Beauty Facts lookup failed:', error);
  }

  // Try BeautyFeeds.io as fallback (commercial data with pricing/availability)
  try {
    const bfResult = await getBeautyFeedsProductByBarcode(barcode);
    if (bfResult) {
      console.log('✅ Found in BeautyFeeds.io');
      
      // Analyze ingredients if available
      let analysis: IngredientAnalysis | undefined;
      if (bfResult.ingredients) {
        try {
          analysis = await analyzeIngredients(bfResult.ingredients);
          console.log(`📊 Ingredient analysis complete: ${analysis.totalIngredients} ingredients, safety score: ${analysis.safetyScore}`);
        } catch (error) {
          console.warn('⚠️ Ingredient analysis failed:', error);
        }
      }
      
      return {
        found: true,
        barcode: bfResult.asin || bfResult.upc || bfResult.barcode || barcode,
        source: 'beauty_feeds',
        confidence: 'high',
        product: {
          name: bfResult.name,
          brand: bfResult.brand,
          category: bfResult.category || 'Personal Care',
          imageUrl: bfResult.images?.[0],
          ingredientsText: bfResult.ingredients,
          description: bfResult.description,
          price: bfResult.price ? `${bfResult.price.currency} ${bfResult.price.amount}` : undefined,
          productType: bfResult.asin ? 'Amazon Product (ASIN)' : 'Barcode Product',
        },
        analysis,
      };
    }
  } catch (error) {
    console.warn('⚠️ BeautyFeeds.io lookup failed:', error);
  }

  // Try UPCitemDB (general barcode database)
  try {
    const upcResult = await lookupUPCItemDB(barcode);
    if (upcResult) {
      console.log('✅ Found in UPCitemDB');
      
      return {
        found: true,
        barcode,
        source: 'upcitemdb',
        confidence: 'medium',
        product: {
          name: upcResult.title,
          brand: upcResult.brand || 'Unknown',
          category: upcResult.category || 'Personal Care',
          imageUrl: upcResult.images?.[0],
          description: upcResult.description,
          price: upcResult.lowest_recorded_price ? `${upcResult.currency} ${upcResult.lowest_recorded_price}` : undefined,
        },
      };
    }
  } catch (error) {
    console.warn('⚠️ UPCitemDB lookup failed:', error);
  }

  // Try EAN-Search (basic barcode info)
  try {
    const eanResult = await lookupEANSearch(barcode);
    if (eanResult) {
      console.log('✅ Found in EAN-Search');
      
      return {
        found: true,
        barcode,
        source: 'ean_search',
        confidence: 'low',
        product: {
          name: eanResult.name,
          brand: 'Unknown',
          category: eanResult.categoryName || 'Personal Care',
        },
      };
    }
  } catch (error) {
    console.warn('⚠️ EAN-Search lookup failed:', error);
  }

  console.log('❌ Product not found in any database');
  return {
    found: false,
    barcode,
    error: 'Product not found in our databases',
  };
}

/**
 * Search products by name across all sources
 * Merges results from Open Beauty Facts and BeautyFeeds.io
 */
export async function searchProducts(query: string, page: number = 1): Promise<{
  products: ProductData[];
  total: number;
  page: number;
}> {
  const allProducts: ProductData[] = [];
  let totalCount = 0;

  // Search Open Beauty Facts
  try {
    const { searchProductsByName } = await import('./openBeautyFacts');
    const obfResults = await searchProductsByName(query, page);
    
    const obfProducts = obfResults.products
      ?.filter((p: any) => p.product_name && p.product_name.trim()) // Only include products with valid names
      .map((p: any) => ({
        found: true,
        source: 'open_beauty_facts' as const,
        confidence: 'high' as const,
        product: {
          name: p.product_name,
          brand: p.brands || 'Unknown Brand',
          category: p.categories?.split(',')[0] || 'Personal Care',
          imageUrl: p.image_url,
          ingredientsText: p.ingredients_text,
        },
      })) || [];
    
    allProducts.push(...obfProducts);
    totalCount += obfResults.count || 0;
  } catch (error) {
    console.warn('⚠️ Open Beauty Facts search failed:', error);
  }

  // Note: BeautyFeeds is only available through backend (requires API key)
  // Frontend searches use Open Beauty Facts and Makeup API only

  // Search SkincareAPI (2,000+ products with full ingredients)
  try {
    const { searchSkincareProducts } = await import('../skincare/skincareApi');
    const skincareResults = await searchSkincareProducts(query);
    
    const skincareProducts = skincareResults.map(p => ({
      found: true,
      source: 'skincare_api' as const,
      confidence: 'high' as const,
      product: {
        name: p.name,
        brand: p.brand,
        category: 'Skincare',
        imageUrl: undefined,
        ingredientsText: p.ingredient_list.join(', '),
      },
    }));
    
    allProducts.push(...skincareProducts);
    totalCount += skincareResults.length;
  } catch (error) {
    console.warn('⚠️ SkincareAPI search failed:', error);
  }

  // Search Makeup API (free cosmetics database)
  try {
    const { searchMakeup } = await import('../makeup/makeupApi');
    const makeupResults = await searchMakeup({ brand: query });
    
    const makeupProducts = makeupResults.map(p => ({
      found: true,
      source: 'makeup_api' as const,
      confidence: 'medium' as const,
      product: {
        name: p.name,
        brand: p.brand,
        category: p.product_type || 'Cosmetics',
        imageUrl: p.image_link,
        ingredientsText: '', // Makeup API doesn't provide ingredients
        description: p.description,
        price: p.price ? `$${p.price}` : undefined,
      },
    }));
    
    allProducts.push(...makeupProducts);
    totalCount += makeupResults.length;
  } catch (error) {
    console.warn('⚠️ Makeup API search failed:', error);
  }

  return {
    products: allProducts,
    total: totalCount,
    page,
  };
}

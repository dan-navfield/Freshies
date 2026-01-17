/**
 * Scanned Products Storage Service
 * Manages saving and retrieving scanned product history using AsyncStorage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@freshies_scanned_products';

export interface ScannedProduct {
  id: string;
  barcode: string;
  name: string;
  brand: string;
  category?: string;
  imageUrl?: string;
  ingredientsText?: string;
  scannedDate: string;
  rating?: number;
  reviewCount?: number;
  wouldBuyAgain?: number;
  ingredientAlerts?: number;
}

/**
 * Save a scanned product to history
 */
export async function saveScannedProduct(product: Omit<ScannedProduct, 'id' | 'scannedDate'>): Promise<void> {
  try {
    // Get existing products
    const existing = await getScannedProducts();

    // Check if product already exists
    // For AI-identified products (generic barcodes), check by name+brand
    // For real barcodes, check by barcode
    const isGenericBarcode = ['AI_VISION', 'OCR_SCAN', 'CAMERA_CAPTURE', 'LIVE_DETECTION'].includes(product.barcode);

    const existingIndex = existing.findIndex(p => {
      if (isGenericBarcode) {
        // Match by name and brand (case-insensitive)
        return p.name.toLowerCase() === product.name.toLowerCase() &&
          p.brand.toLowerCase() === product.brand.toLowerCase();
      }
      // Match by actual barcode
      return p.barcode === product.barcode;
    });

    const newProduct: ScannedProduct = {
      ...product,
      id: existingIndex >= 0 ? existing[existingIndex].id : Date.now().toString(),
      scannedDate: new Date().toISOString(),
    };

    // If exists, update it; otherwise add to beginning
    if (existingIndex >= 0) {
      existing[existingIndex] = newProduct;
      console.log('✅ Updated existing product:', product.name);
    } else {
      existing.unshift(newProduct);
      console.log('✅ Saved new product:', product.name);
    }

    // Keep only last 100 products
    const trimmed = existing.slice(0, 100);

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    console.log('✅ Saved scanned product:', product.name);
  } catch (error) {
    console.error('❌ Error saving scanned product:', error);
    throw error;
  }
}

/**
 * Get all scanned products
 */
export async function getScannedProducts(): Promise<ScannedProduct[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (!data) return [];

    const products = JSON.parse(data) as ScannedProduct[];
    return products;
  } catch (error) {
    console.error('❌ Error getting scanned products:', error);
    return [];
  }
}

/**
 * Get a single scanned product by barcode
 */
export async function getScannedProductByBarcode(barcode: string): Promise<ScannedProduct | null> {
  try {
    const products = await getScannedProducts();
    return products.find(p => p.barcode === barcode) || null;
  } catch (error) {
    console.error('❌ Error getting scanned product:', error);
    return null;
  }
}

/**
 * Delete a scanned product
 */
export async function deleteScannedProduct(id: string): Promise<void> {
  try {
    const products = await getScannedProducts();
    const filtered = products.filter(p => p.id !== id);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    console.log('✅ Deleted scanned product:', id);
  } catch (error) {
    console.error('❌ Error deleting scanned product:', error);
    throw error;
  }
}

/**
 * Clear all scanned products
 */
export async function clearScannedProducts(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
    console.log('✅ Cleared all scanned products');
  } catch (error) {
    console.error('❌ Error clearing scanned products:', error);
    throw error;
  }
}

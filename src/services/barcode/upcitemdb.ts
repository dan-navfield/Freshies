/**
 * UPCitemDB API Integration
 * General barcode lookup for UPC, EAN, and other product codes
 * Documentation: https://www.upcitemdb.com/api/explorer
 */

const UPCITEMDB_API_KEY = process.env.EXPO_PUBLIC_UPCITEMDB_API_KEY;
const BASE_URL = 'https://api.upcitemdb.com/prod/trial';

export interface UPCItemDBProduct {
  ean: string;
  title: string;
  description?: string;
  brand?: string;
  model?: string;
  color?: string;
  size?: string;
  dimension?: string;
  weight?: string;
  category?: string;
  currency?: string;
  lowest_recorded_price?: number;
  highest_recorded_price?: number;
  images?: string[];
  offers?: Array<{
    merchant: string;
    domain: string;
    title: string;
    currency: string;
    list_price: string;
    price: number;
    shipping: string;
    condition: string;
    availability: string;
    link: string;
    updated_t: number;
  }>;
}

/**
 * Lookup product by barcode (UPC/EAN)
 */
export async function lookupUPCItemDB(barcode: string): Promise<UPCItemDBProduct | null> {
  try {
    const url = UPCITEMDB_API_KEY 
      ? `https://api.upcitemdb.com/prod/v1/lookup?upc=${barcode}`
      : `${BASE_URL}/lookup?upc=${barcode}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (UPCITEMDB_API_KEY) {
      headers['Authorization'] = `Bearer ${UPCITEMDB_API_KEY}`;
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`UPCitemDB API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.code === 'OK' && data.items && data.items.length > 0) {
      return data.items[0];
    }

    return null;
  } catch (error) {
    console.error('❌ UPCitemDB lookup error:', error);
    return null;
  }
}

/**
 * Search products by query
 */
export async function searchUPCItemDB(query: string): Promise<UPCItemDBProduct[]> {
  try {
    const url = UPCITEMDB_API_KEY
      ? `https://api.upcitemdb.com/prod/v1/search?s=${encodeURIComponent(query)}`
      : `${BASE_URL}/search?s=${encodeURIComponent(query)}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (UPCITEMDB_API_KEY) {
      headers['Authorization'] = `Bearer ${UPCITEMDB_API_KEY}`;
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(`UPCitemDB API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.code === 'OK' && data.items) {
      return data.items;
    }

    return [];
  } catch (error) {
    console.error('❌ UPCitemDB search error:', error);
    return [];
  }
}

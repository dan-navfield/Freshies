/**
 * EAN-Search API Integration
 * General barcode lookup for EAN, UPC, ISBN codes
 * Documentation: https://www.ean-search.org/ean-database-api.html
 */

const BASE_URL = 'https://api.ean-search.org/api';

export interface EANSearchProduct {
  ean: string;
  name: string;
  categoryId?: number;
  categoryName?: string;
  issuingCountry?: string;
}

/**
 * Lookup product by EAN/UPC barcode
 * Note: Free tier limited to 10 requests per day
 */
export async function lookupEANSearch(barcode: string): Promise<EANSearchProduct | null> {
  try {
    const response = await fetch(`${BASE_URL}?op=barcode-lookup&ean=${barcode}&format=json`);

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`EAN-Search API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data && data[0]) {
      return {
        ean: data[0].ean || barcode,
        name: data[0].name || '',
        categoryId: data[0].categoryId,
        categoryName: data[0].categoryName,
        issuingCountry: data[0].issuingCountry,
      };
    }

    return null;
  } catch (error) {
    console.error('❌ EAN-Search lookup error:', error);
    return null;
  }
}

/**
 * Verify if a barcode is valid
 */
export async function verifyBarcode(barcode: string): Promise<boolean> {
  try {
    const response = await fetch(`${BASE_URL}?op=barcode-verify&ean=${barcode}&format=json`);

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.valid === true;
  } catch (error) {
    console.error('❌ EAN-Search verify error:', error);
    return false;
  }
}

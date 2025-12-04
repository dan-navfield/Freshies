/**
 * Ingredient OCR Scanner
 * Uses Google Cloud Vision to read ingredient lists from photos
 * Then searches for matching products
 */

import * as FileSystem from 'expo-file-system/legacy';

const GOOGLE_CLOUD_VISION_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_VISION_API_KEY || '';
const VISION_API_URL = 'https://vision.googleapis.com/v1/images:annotate';

export interface OCRResult {
  success: boolean;
  text?: string;
  ingredients?: string[];
  error?: string;
}

/**
 * Convert image URI to base64
 */
async function imageUriToBase64(uri: string): Promise<string> {
  try {
    // Use expo-file-system for local file URIs
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: 'base64',
    });
    
    return base64;
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw new Error(`Failed to convert image to base64: ${error}`);
  }
}

/**
 * Extract text from ingredient photo using Google Cloud Vision
 */
export async function extractTextFromImage(imageUri: string): Promise<OCRResult> {
  try {
    if (!GOOGLE_CLOUD_VISION_API_KEY) {
      return {
        success: false,
        error: 'Google Cloud Vision API key not configured',
      };
    }

    console.log('📝 Extracting text from image with OCR...');

    const base64Image = await imageUriToBase64(imageUri);

    const requestBody = {
      requests: [
        {
          image: {
            content: base64Image,
          },
          features: [
            {
              type: 'TEXT_DETECTION',
              maxResults: 1,
            },
          ],
        },
      ],
    };

    const response = await fetch(
      `${VISION_API_URL}?key=${GOOGLE_CLOUD_VISION_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const textAnnotations = data.responses[0]?.textAnnotations;

    if (!textAnnotations || textAnnotations.length === 0) {
      return {
        success: false,
        error: 'No text detected in image',
      };
    }

    const fullText = textAnnotations[0]?.description || '';
    console.log('✅ Extracted text:', fullText.substring(0, 200) + '...');

    // Parse ingredients from the text
    const ingredients = parseIngredients(fullText);

    return {
      success: true,
      text: fullText,
      ingredients,
    };
  } catch (error) {
    console.error('❌ Error extracting text:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Parse ingredient list from OCR text
 * Looks for common patterns like "Ingredients:", "INCI:", etc.
 */
function parseIngredients(text: string): string[] {
  // Common ingredient list markers
  const markers = [
    /ingredients?:?\s*/i,
    /inci:?\s*/i,
    /composition:?\s*/i,
    /contains?:?\s*/i,
  ];

  let ingredientText = text;

  // Try to find ingredient section
  for (const marker of markers) {
    const match = text.match(marker);
    if (match) {
      // Get text after the marker
      ingredientText = text.substring(match.index! + match[0].length);
      break;
    }
  }

  // Split by common separators
  const ingredients = ingredientText
    .split(/[,;\n]/)
    .map(ing => ing.trim())
    .filter(ing => {
      // Filter out very short strings and non-ingredient text
      if (ing.length < 3) return false;
      if (/^\d+$/.test(ing)) return false; // Just numbers
      if (/^[^a-zA-Z]+$/.test(ing)) return false; // No letters
      return true;
    })
    .slice(0, 20); // Take first 20 ingredients

  return ingredients;
}

/**
 * Create search query from ingredients
 * Takes top ingredients and creates a search-friendly string
 */
export function createSearchQueryFromIngredients(ingredients: string[]): string {
  // Take first 3-5 most distinctive ingredients
  const topIngredients = ingredients.slice(0, 5);
  
  // Clean up ingredient names (remove percentages, parentheses, etc.)
  const cleanedIngredients = topIngredients.map(ing => 
    ing
      .replace(/\([^)]*\)/g, '') // Remove parentheses content
      .replace(/\d+%?/g, '') // Remove percentages
      .trim()
  );

  return cleanedIngredients.join(' ');
}

/**
 * Extract product name from text
 * Looks for brand names and product names at the top of the text
 */
export function extractProductName(text: string): string | null {
  // Get first few lines (usually contains product name)
  const lines = text.split('\n').slice(0, 5);
  
  // Look for capitalized words (likely product/brand names)
  for (const line of lines) {
    const trimmed = line.trim();
    // Skip very short lines and lines with only numbers
    if (trimmed.length > 3 && !/^\d+$/.test(trimmed)) {
      // If line is mostly uppercase or title case, likely a product name
      if (/^[A-Z\s]+$/.test(trimmed) || /^[A-Z][a-z]+(\s[A-Z][a-z]+)*$/.test(trimmed)) {
        return trimmed;
      }
    }
  }

  return null;
}

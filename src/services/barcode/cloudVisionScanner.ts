/**
 * Google Cloud Vision Barcode Scanner
 * Uses Google Cloud Vision API for robust barcode detection
 */

const GOOGLE_CLOUD_VISION_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_VISION_API_KEY;
const VISION_API_URL = 'https://vision.googleapis.com/v1/images:annotate';

export interface CloudVisionBarcode {
  type: string;
  data: string;
  boundingBox?: any;
}

export interface CloudVisionResult {
  found: boolean;
  barcodes?: CloudVisionBarcode[];
  error?: string;
}

/**
 * Convert image URI to base64
 */
async function imageUriToBase64(uri: string): Promise<string> {
  const response = await fetch(uri);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64Data = base64.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Scan barcode using Google Cloud Vision API
 */
export async function scanBarcodeWithCloudVision(imageUri: string): Promise<CloudVisionResult> {
  try {
    // Check if API key is configured
    if (!GOOGLE_CLOUD_VISION_API_KEY) {
      console.warn('⚠️ Google Cloud Vision API key not configured, skipping');
      return { found: false };
    }

    console.log('🔍 Scanning with Google Cloud Vision...');

    // Convert image to base64
    const base64Image = await imageUriToBase64(imageUri);

    // Prepare API request
    const requestBody = {
      requests: [
        {
          image: {
            content: base64Image,
          },
          features: [
            {
              type: 'BARCODE_DETECTION',
              maxResults: 10,
            },
          ],
        },
      ],
    };

    // Call Google Cloud Vision API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(
      `${VISION_API_URL}?key=${GOOGLE_CLOUD_VISION_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Cloud Vision API error:', response.status, errorText);
      return { found: false };
    }

    const data = await response.json();
    
    // Parse barcode results
    const annotations = data.responses?.[0]?.barcodeAnnotations;

    if (annotations && annotations.length > 0) {
      const barcodes: CloudVisionBarcode[] = annotations.map((annotation: any) => ({
        type: annotation.format || 'UNKNOWN',
        data: annotation.displayValue || annotation.rawValue || '',
        boundingBox: annotation.boundingPoly,
      }));

      console.log(`✅ Found ${barcodes.length} barcode(s) with Cloud Vision`);
      return {
        found: true,
        barcodes,
      };
    }

    console.log('ℹ️ No barcodes detected by Cloud Vision');
    return { found: false };
    
  } catch (error) {
    // Log error but don't fail - this is optional enhancement
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.warn('⚠️ Cloud Vision request timed out');
      } else {
        console.warn('⚠️ Cloud Vision unavailable:', error.message);
      }
    }
    return { found: false };
  }
}

/**
 * Get the best barcode from multiple detections
 * Prioritizes EAN/UPC codes which are most common for products
 */
export function getBestBarcode(barcodes: CloudVisionBarcode[]): CloudVisionBarcode | null {
  if (!barcodes || barcodes.length === 0) return null;

  // Priority order for product barcodes
  const priorityTypes = [
    'EAN_13',
    'EAN_8',
    'UPC_A',
    'UPC_E',
    'CODE_128',
    'CODE_39',
  ];

  // Find first barcode matching priority types
  for (const type of priorityTypes) {
    const match = barcodes.find(b => b.type === type);
    if (match) return match;
  }

  // If no priority match, return first barcode
  return barcodes[0];
}

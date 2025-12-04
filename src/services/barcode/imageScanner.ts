/**
 * Image-based Barcode Scanner
 * Uses Google Cloud Vision API for robust barcode detection
 * Falls back to expo-camera if Cloud Vision is unavailable
 */

import { Camera } from 'expo-camera';
import { scanBarcodeWithCloudVision, getBestBarcode } from './cloudVisionScanner';

export interface BarcodeScanResult {
  found: boolean;
  data?: string;
  type?: string;
  error?: string;
}

/**
 * Scan barcode from image URI
 * Tries Cloud Vision first (better accuracy), falls back to expo-camera
 */
export async function scanBarcodeFromImage(
  imageUri: string
): Promise<BarcodeScanResult> {
  try {
    console.log('🔍 Scanning barcode from image:', imageUri);

    // Try Google Cloud Vision first (most accurate for barcodes)
    const cloudResult = await scanBarcodeWithCloudVision(imageUri);
    
    if (cloudResult.found && cloudResult.barcodes && cloudResult.barcodes.length > 0) {
      const bestBarcode = getBestBarcode(cloudResult.barcodes);
      if (bestBarcode) {
        console.log('✅ Found barcode with Cloud Vision:', bestBarcode.data);
        return {
          found: true,
          data: bestBarcode.data,
          type: bestBarcode.type,
        };
      }
    }

    // Fallback to expo-camera
    console.log('ℹ️ Trying expo-camera fallback...');
    const results = await Camera.scanFromURLAsync(imageUri, [
      'ean13',
      'ean8',
      'upc_a',
      'upc_e',
      'code128',
      'code39',
      'code93',
      'codabar',
      'itf14',
      'pdf417',
    ]);

    if (results && results.length > 0) {
      const barcode = results[0];
      console.log('✅ Found barcode with expo-camera:', barcode.data, 'Type:', barcode.type);
      
      return {
        found: true,
        data: barcode.data,
        type: barcode.type,
      };
    }

    console.log('❌ No barcode found in image');
    return {
      found: false,
      error: 'No barcode detected in image',
    };
  } catch (error) {
    console.error('❌ Error scanning barcode from image:', error);
    return {
      found: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check if barcode scanner is available
 */
export async function isBarcodesScannerAvailable(): Promise<boolean> {
  try {
    // Check if the module is available
    return Camera !== undefined;
  } catch {
    return false;
  }
}

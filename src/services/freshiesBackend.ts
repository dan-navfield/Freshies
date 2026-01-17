/**
 * Freshies Backend API Client
 * Connects to the product scanning backend
 */

const BACKEND_URL = __DEV__ 
  ? 'http://localhost:3001'  // Development
  : 'https://api.freshies.app'; // Production (update when deployed)

const API_BASE_URL = BACKEND_URL;

/**
 * Upload image to backend
 */
export async function uploadImage(imageUri: string): Promise<{ imageUrl: string }> {
  const formData = new FormData();
  
  // Create file object from URI
  const filename = imageUri.split('/').pop() || 'image.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image/jpeg';
  
  formData.append('image', {
    uri: imageUri,
    name: filename,
    type,
  } as any);

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    body: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }

  const data = await response.json();
  return { imageUrl: data.imageUrl };
}

export interface ScanRequest {
  imageUrl?: string;
  barcodeHint?: string;
  childProfile?: {
    age?: number;
    skinType?: string;
    allergies?: string[];
  };
}

export interface ScanResult {
  scanId: string;
  product?: {
    id?: string;
    barcode?: string;
    brand?: string;
    name?: string;
    category?: string;
    confidence: number;
  };
  ingredients: {
    rawText?: string;
    normalised: Array<{
      name: string;
      canonicalName: string;
      inciId?: string;
    }>;
  };
  scoring: {
    modelVersion: string;
    riskScore: number;
    rating: string;
    tags: string[];
    reasons: Array<{
      code: string;
      severity: string;
      ingredient?: string;
      detail: string;
    }>;
  };
}

export interface FeedbackRequest {
  modelVersion: string;
  riskScore: number;
  rating: string;
  userFeedback?: string;
  labels?: {
    expert_override_rating?: string;
    notes?: string;
  };
}

/**
 * Scan a product using the Freshies backend
 */
export async function scanProduct(params: ScanRequest): Promise<ScanResult> {
  try {
    console.log('🔍 Scanning product with Freshies backend:', params);
    
    const response = await fetch(`${BACKEND_URL}/scan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`Backend error: ${response.status} ${response.statusText}`);
    }

    const result: ScanResult = await response.json();
    console.log('✅ Scan result:', result);
    
    return result;
  } catch (error) {
    console.error('❌ Error scanning product:', error);
    throw error;
  }
}

/**
 * Submit feedback for a scan
 */
export async function submitScanFeedback(
  scanId: string,
  feedback: FeedbackRequest
): Promise<{ status: string; message: string }> {
  try {
    console.log(`💬 Submitting feedback for scan ${scanId}:`, feedback);
    
    const response = await fetch(`${BACKEND_URL}/scan/${scanId}/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(feedback),
    });

    if (!response.ok) {
      throw new Error(`Backend error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ Feedback submitted:', result);
    
    return result;
  } catch (error) {
    console.error('❌ Error submitting feedback:', error);
    throw error;
  }
}

/**
 * Check backend health
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${BACKEND_URL}/health`);
    const data = await response.json();
    return data.status === 'ok';
  } catch (error) {
    console.error('❌ Backend health check failed:', error);
    return false;
  }
}

import { File } from 'expo-file-system/next';

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

export interface LiveDetectionResult {
    detected: boolean;
    productName?: string;
    brandName?: string;
    category?: string;
    confidence: number;
    boundingBox?: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
}

/**
 * Analyze a camera frame for product identification
 * Optimized for speed - uses gpt-4o-mini with low detail
 */
export async function analyzeFrameForProduct(imageUri: string): Promise<LiveDetectionResult> {
    try {
        // Use the new File API
        const file = new File(imageUri);
        const base64 = await file.base64();

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: `Quick scan: Is there a skincare/beauty product visible? If yes, identify it.

Return ONLY JSON:
{
  "detected": true/false,
  "productName": "product name" or null,
  "brandName": "brand name" or null,
  "category": "cleanser/moisturizer/sunscreen/serum/etc" or null,
  "confidence": 0.0-1.0
}

Be fast - only detect if product is clearly visible and identifiable.`
                            },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: `data:image/jpeg;base64,${base64}`,
                                    detail: 'low' // Low detail for speed
                                }
                            }
                        ]
                    }
                ],
                max_tokens: 150,
                temperature: 0.2,
            }),
        });

        const data = await response.json();

        if (!data.choices?.[0]?.message?.content) {
            return { detected: false, confidence: 0 };
        }

        const content = data.choices[0].message.content;

        // Parse JSON from response
        let jsonStr = content;
        if (content.includes('```')) {
            const match = content.match(/```(?:json)?\s*([\s\S]*?)```/);
            jsonStr = match ? match[1].trim() : content;
        }

        const result = JSON.parse(jsonStr);

        return {
            detected: result.detected === true,
            productName: result.productName || undefined,
            brandName: result.brandName || undefined,
            category: result.category || undefined,
            confidence: result.confidence || 0,
        };
    } catch (error) {
        console.error('Live detection error:', error);
        return { detected: false, confidence: 0 };
    }
}

/**
 * Debounced live detection manager
 * Prevents too many API calls while camera is active
 */
export class LiveDetectionManager {
    private lastAnalysisTime: number = 0;
    private isAnalyzing: boolean = false;
    private minIntervalMs: number;
    private onResult: (result: LiveDetectionResult) => void;

    constructor(
        onResult: (result: LiveDetectionResult) => void,
        intervalMs: number = 2000 // Default 2 seconds between analyses
    ) {
        this.onResult = onResult;
        this.minIntervalMs = intervalMs;
    }

    async analyzeFrame(imageUri: string): Promise<void> {
        const now = Date.now();

        // Skip if already analyzing or too soon
        if (this.isAnalyzing) return;
        if (now - this.lastAnalysisTime < this.minIntervalMs) return;

        this.isAnalyzing = true;
        this.lastAnalysisTime = now;

        try {
            const result = await analyzeFrameForProduct(imageUri);
            this.onResult(result);
        } finally {
            this.isAnalyzing = false;
        }
    }

    reset(): void {
        this.lastAnalysisTime = 0;
        this.isAnalyzing = false;
    }
}

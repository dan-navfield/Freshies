// Image quality checker service

export interface ImageQualityResult {
    quality: 'good' | 'fair' | 'poor';
    score: number; // 0-100
    issues: string[];
    canProceed: boolean;
    suggestion?: string;
}

/**
 * Check image quality before processing for product identification
 * Uses OpenAI Vision to assess blur, lighting, and visibility
 */
export async function checkImageQuality(imageUri: string): Promise<ImageQualityResult> {
    try {
        // Use OpenAI Vision with a quality-focused prompt
        const response = await analyzeImageForQuality(imageUri);
        return response;
    } catch (error) {
        console.error('Error checking image quality:', error);
        // Default to allowing processing if quality check fails
        return {
            quality: 'fair',
            score: 70,
            issues: [],
            canProceed: true,
            suggestion: undefined
        };
    }
}

async function analyzeImageForQuality(imageUri: string): Promise<ImageQualityResult> {
    const { File } = require('expo-file-system/next');
    const file = new File(imageUri);
    const base64 = await file.base64();

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.EXPO_PUBLIC_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: `Analyze this image for quality as a product photo. Rate it for a product scanning app.

Return ONLY a JSON object with these fields:
{
  "quality": "good" | "fair" | "poor",
  "score": 0-100,
  "issues": ["list of specific issues like 'blurry', 'too dark', 'product not visible', 'too far away', 'glare/reflection'"],
  "canProceed": true/false (false only if image is unusable),
  "suggestion": "brief tip to improve the photo if needed"
}

Be lenient - only mark as "poor" if the product is truly unidentifiable.`
                        },
                        {
                            type: 'image_url',
                            image_url: {
                                url: `data:image/jpeg;base64,${base64}`,
                                detail: 'low' // Use low detail for faster/cheaper quality check
                            }
                        }
                    ]
                }
            ],
            max_tokens: 200,
            temperature: 0.3,
        }),
    });

    const data = await response.json();

    if (!data.choices?.[0]?.message?.content) {
        throw new Error('No response from quality check');
    }

    const content = data.choices[0].message.content;

    // Parse JSON from response (handle markdown code blocks)
    let jsonStr = content;
    if (content.includes('```')) {
        const match = content.match(/```(?:json)?\s*([\s\S]*?)```/);
        jsonStr = match ? match[1].trim() : content;
    }

    try {
        const result = JSON.parse(jsonStr);
        return {
            quality: result.quality || 'fair',
            score: result.score || 70,
            issues: result.issues || [],
            canProceed: result.canProceed !== false,
            suggestion: result.suggestion
        };
    } catch (parseError) {
        console.error('Failed to parse quality response:', content);
        return {
            quality: 'fair',
            score: 70,
            issues: [],
            canProceed: true
        };
    }
}

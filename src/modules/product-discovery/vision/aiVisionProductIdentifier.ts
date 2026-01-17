/**
 * AI Vision Product Identifier
 * Uses GPT-4 Vision to identify products from photos
 */

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
const VISION_MODEL = 'gpt-4o'; // GPT-4o has vision capabilities

export interface ProductIdentificationResult {
    success: boolean;
    confidence: number; // 0-1
    product_name?: string;
    brand_name?: string;
    category?: string;
    size?: string;
    key_ingredients?: string[];
    product_type?: string;
    error?: string;
}

/**
 * Convert image URI to base64 using fetch
 */
async function imageToBase64(imageUri: string): Promise<string> {
    try {
        // For local file URIs, we need to fetch and convert
        const response = await fetch(imageUri);
        const blob = await response.blob();

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64data = reader.result as string;
                // Remove the data:image/...;base64, prefix
                const base64 = base64data.split(',')[1] || base64data;
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error('Error converting image to base64:', error);
        throw new Error('Failed to process image');
    }
}

/**
 * Identify a product from an image using GPT-4 Vision
 */
export async function identifyProductFromImage(
    imageUri: string
): Promise<ProductIdentificationResult> {
    if (!OPENAI_API_KEY) {
        return {
            success: false,
            confidence: 0,
            error: 'OpenAI API key not configured',
        };
    }

    try {
        console.log('🤖 Running AI Vision product identification...');

        // Convert image to base64
        const base64Image = await imageToBase64(imageUri);
        const imageMediaType = imageUri.toLowerCase().includes('.png') ? 'image/png' : 'image/jpeg';

        // Create the vision request
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: VISION_MODEL,
                messages: [
                    {
                        role: 'system',
                        content: `You are a product identification expert. Analyse the image and identify the personal care/skincare/cosmetic product shown. 

Return a JSON object with:
- product_name: The exact product name (e.g., "Gentle Foaming Cleanser")
- brand_name: The brand (e.g., "CeraVe", "Cetaphil", "La Roche-Posay")
- category: Product category (e.g., "Cleanser", "Moisturizer", "Sunscreen", "Shampoo")
- size: IMPORTANT - Extract the product size/volume if visible anywhere on packaging (e.g., "50ml", "200ml", "1.69 FL OZ", "16 oz", "8oz/236ml"). Look for numbers followed by ml, oz, g, or fl oz.
- key_ingredients: Array of key ingredients if visible on the product
- product_type: Type (e.g., "face wash", "body lotion", "diaper cream")
- confidence: Your confidence level from 0 to 1

If you cannot identify the product, return confidence: 0 and explain in error field.
Return ONLY valid JSON, no markdown.`,
                    },
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: 'Identify this product. Return the product name, brand, category, and any visible details as JSON.',
                            },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: `data:${imageMediaType};base64,${base64Image}`,
                                    detail: 'high',
                                },
                            },
                        ],
                    },
                ],
                max_tokens: 500,
                temperature: 0.3, // Lower temperature for more consistent identification
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ OpenAI Vision API error:', response.status, errorText);
            return {
                success: false,
                confidence: 0,
                error: `API error: ${response.status}`,
            };
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        if (!content) {
            return {
                success: false,
                confidence: 0,
                error: 'No response from AI',
            };
        }

        // Parse the JSON response
        try {
            // Log raw response for debugging
            console.log('🔍 Raw AI response:', content);

            // Clean the response - remove markdown code blocks if present
            let cleanContent = content.trim();

            // Remove markdown code block markers (handles ```json, ``` with newlines, etc.)
            cleanContent = cleanContent.replace(/^```(?:json)?\s*/i, '');
            cleanContent = cleanContent.replace(/\s*```$/i, '');
            cleanContent = cleanContent.trim();

            // Try to extract JSON if there's extra text
            const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                cleanContent = jsonMatch[0];
            }

            const result = JSON.parse(cleanContent);

            console.log('✅ AI Vision identified:', result.product_name, 'by', result.brand_name);
            console.log('📏 AI Vision full result:', JSON.stringify(result, null, 2));

            return {
                success: result.confidence > 0.3,
                confidence: result.confidence || 0,
                product_name: result.product_name,
                brand_name: result.brand_name,
                category: result.category,
                size: result.size,
                key_ingredients: result.key_ingredients,
                product_type: result.product_type,
                error: result.error,
            };
        } catch (parseError) {
            console.error('❌ Failed to parse AI response:', content);
            return {
                success: false,
                confidence: 0,
                error: 'Failed to parse AI response',
            };
        }
    } catch (error) {
        console.error('❌ AI Vision error:', error);
        return {
            success: false,
            confidence: 0,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

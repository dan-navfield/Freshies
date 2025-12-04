import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
});

export interface StepImageRequest {
  stepType: string;
  stepTitle: string;
  instructions: string[];
  targetAge?: string; // 'young' (5-8), 'tween' (9-12), 'teen' (13-17)
}

export interface StepImageResult {
  imageUrl: string;
  prompt: string;
  revisedPrompt?: string;
}

/**
 * Generate a kid-friendly instructional diagram for a skincare routine step
 */
export async function generateStepDiagram(
  request: StepImageRequest
): Promise<StepImageResult> {
  try {
    const { stepType, stepTitle, instructions, targetAge = 'tween' } = request;

    // Build a detailed prompt for DALL-E
    const prompt = buildImagePrompt(stepType, stepTitle, instructions, targetAge);

    console.log('🎨 Generating step diagram with DALL-E 3...');
    console.log('Prompt:', prompt);

    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
      style: 'natural', // 'vivid' or 'natural'
    });

    const imageUrl = response.data?.[0]?.url;
    const revisedPrompt = response.data?.[0]?.revised_prompt;

    if (!imageUrl) {
      throw new Error('No image URL returned from DALL-E');
    }

    console.log('✅ Image generated successfully');
    console.log('URL:', imageUrl);

    return {
      imageUrl,
      prompt,
      revisedPrompt,
    };
  } catch (error) {
    console.error('❌ Error generating step diagram:', error);
    throw error;
  }
}

/**
 * Build a detailed prompt for DALL-E to generate a step diagram
 */
function buildImagePrompt(
  stepType: string,
  stepTitle: string,
  instructions: string[],
  targetAge: string
): string {
  // Age-appropriate style guidance
  const styleGuide = {
    young: 'simple, colorful cartoon style with big friendly characters',
    tween: 'clean, modern illustration style with diverse characters',
    teen: 'stylish, contemporary illustration with realistic proportions',
  }[targetAge] || 'clean, modern illustration style';

  // Step-specific visual elements
  const stepVisuals: Record<string, string> = {
    cleanser: 'showing hands washing face with water and cleanser, water droplets, gentle circular motions',
    moisturizer: 'showing hands applying cream to face, dotting on cheeks and forehead, upward motions',
    serum: 'showing dropper bottle and fingers applying serum drops to face, patting motion',
    sunscreen: 'showing sunscreen application to face and neck, two-finger rule, even coverage',
    treatment: 'showing targeted application to specific spots, small amount, gentle patting',
    toner: 'showing cotton pad or hands applying toner to face, gentle patting',
    mask: 'showing face mask application, even layer, relaxing pose',
    exfoliant: 'showing gentle circular scrubbing motions on face',
  };

  const visual = stepVisuals[stepType.toLowerCase()] || 'showing skincare step being performed correctly';

  // Combine key instructions into visual description
  const keyActions = instructions.slice(0, 3).join(', ').toLowerCase();

  const prompt = `Create an educational diagram for kids showing how to "${stepTitle}". 
Style: ${styleGuide}, friendly and encouraging, bright pastel colors, clean white background.
Visual: ${visual}
Key actions: ${keyActions}
The image should be clear, simple, and easy to understand for children. 
Show a diverse child or teen demonstrating the technique with clear hand positions and facial expressions.
Include subtle directional arrows or motion lines to show movement.
Keep it positive and fun, avoiding any medical or clinical appearance.
No text or labels in the image.`;

  return prompt;
}

/**
 * Generate diagrams for multiple steps in batch
 */
export async function generateStepDiagramsBatch(
  requests: StepImageRequest[]
): Promise<StepImageResult[]> {
  const results: StepImageResult[] = [];
  
  // Generate sequentially to avoid rate limits
  for (const request of requests) {
    try {
      const result = await generateStepDiagram(request);
      results.push(result);
      
      // Small delay between requests to be nice to the API
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Failed to generate image for ${request.stepTitle}:`, error);
      // Continue with other images even if one fails
    }
  }
  
  return results;
}

/**
 * Helper to generate image for a template and update the database
 */
export async function generateAndSaveTemplateImage(
  templateId: string,
  stepType: string,
  stepTitle: string,
  instructions: string[]
): Promise<string | null> {
  try {
    const result = await generateStepDiagram({
      stepType,
      stepTitle,
      instructions,
    });

    // Note: You'll need to implement the actual database update
    // This is just the image generation part
    console.log(`✅ Generated image for template ${templateId}`);
    console.log(`Image URL: ${result.imageUrl}`);
    
    return result.imageUrl;
  } catch (error) {
    console.error(`Failed to generate image for template ${templateId}:`, error);
    return null;
  }
}

import { routineTemplateService, RoutineStepTemplate } from '../routineTemplateService';
import { isCapabilityPaused, loadActivePromptTemplate } from '../config/promptLoader';

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY || process.env.EXPO_PUBLIC_MISTRAL_API_KEY;
const MISTRAL_BASE_URL = 'https://api.mistral.ai/v1/chat/completions';

const AI_CAPABILITY_KEY = 'routine_step_template_generation';

function escapeRegExp(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function renderTemplate(template: string, vars: Record<string, string>) {
  let out = template;
  for (const [key, value] of Object.entries(vars)) {
    const re = new RegExp(`{{\\s*${escapeRegExp(key)}\\s*}}`, 'g');
    out = out.replace(re, value);
  }
  return out;
}

async function callMistral(
  messages: Array<{ role: string; content: string }>,
  options: { model?: string; temperature?: number; response_format?: { type: string } } = {}
) {
  if (!MISTRAL_API_KEY) {
    throw new Error('Mistral API key not configured');
  }

  const response = await fetch(MISTRAL_BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${MISTRAL_API_KEY}`,
    },
    body: JSON.stringify({
      model: options.model || 'mistral-small-latest',
      messages,
      temperature: options.temperature || 0.7,
      response_format: options.response_format,
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Mistral API error: ${response.status} - ${text.slice(0, 300)}`);
  }

  return response.json();
}

/**
 * Call OpenAI API (similar to guidedRoutineService pattern)
 */
async function callOpenAI(
  messages: Array<{ role: string; content: string }>,
  options: { model?: string; temperature?: number; response_format?: { type: string } } = {}
): Promise<any> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: options.model || 'gpt-4o-mini',
      messages,
      temperature: options.temperature || 0.7,
      response_format: options.response_format
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  return response.json();
}

export interface TemplateGenerationRequest {
  type: string; // cleanser, moisturizer, etc.
  targetAge?: number;
  skinType?: string;
  concern?: string;
  timeOfDay?: 'morning' | 'evening' | 'both';
  customPrompt?: string;
}

export interface GeneratedTemplate {
  title: string;
  description: string;
  icon_name: string;
  color_hex: string;
  default_duration: number;
  default_instructions: string[];
  tips: string;
  benefits: string[];
  recommended_order: number;
}

class TemplateGenerationService {
  /**
   * Generate a new routine step template using AI
   */
  async generateTemplate(
    request: TemplateGenerationRequest
  ): Promise<GeneratedTemplate | null> {
    try {
      if (await isCapabilityPaused(AI_CAPABILITY_KEY)) {
        throw new Error('AI capability is paused')
      }

      const systemTpl = await loadActivePromptTemplate(AI_CAPABILITY_KEY, 'system')
      const userTpl = await loadActivePromptTemplate(AI_CAPABILITY_KEY, 'user')
      const provider = systemTpl.model_preferences?.provider || 'openai'
      const model = systemTpl.model_preferences?.model || 'gpt-4o-mini'

      const prompt = this.buildPrompt(request);

      const userPrompt = userTpl.content?.trim().length
        ? renderTemplate(userTpl.content, {
          type: request.type,
          targetAge: request.targetAge ? String(request.targetAge) : '',
          skinType: request.skinType || '',
          concern: request.concern || '',
          timeOfDay: request.timeOfDay || '',
          customPrompt: request.customPrompt || '',
          built_prompt: prompt,
        })
        : prompt

      console.log('Generating template with AI...');

      const systemFallback = `You are a pediatric dermatology expert and skincare educator specializing in creating age-appropriate skincare routines for children and teens.

Your task is to generate detailed, safe, and educational skincare step templates that:
- Are appropriate for the specified age group
- Use gentle, kid-friendly language
- Include clear, easy-to-follow instructions
- Emphasize safety and skin health
- Are fun and engaging for young users
- Follow dermatological best practices

Always return valid JSON in the exact format requested.`

      const systemPrompt = systemTpl.content?.trim().length ? systemTpl.content : systemFallback

      const data = provider === 'mistral'
        ? await callMistral(
          [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          {
            model,
            temperature: 0.7,
            response_format: { type: 'json_object' },
          }
        )
        : await callOpenAI(
          [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          {
            model,
            temperature: 0.7,
            response_format: { type: 'json_object' }
          }
        );

      const response = JSON.parse(data.choices[0]?.message?.content || '{}');
      console.log('AI generated template:', response);

      return response.template || null;
    } catch (error) {
      console.error('Error generating template:', error);
      return null;
    }
  }

  /**
   * Generate and save a template to the database
   */
  async generateAndSaveTemplate(
    request: TemplateGenerationRequest,
    createdBy?: string
  ): Promise<RoutineStepTemplate | null> {
    try {
      const generated = await this.generateTemplate(request);

      if (!generated) {
        throw new Error('Failed to generate template');
      }

      // Create slug from title
      const slug = this.createSlug(generated.title);

      // Save to database
      const result = await routineTemplateService.createTemplate({
        type: request.type,
        title: generated.title,
        slug,
        icon_name: generated.icon_name,
        color_hex: generated.color_hex,
        description: generated.description,
        default_duration: generated.default_duration,
        default_instructions: generated.default_instructions,
        tips: generated.tips,
        benefits: generated.benefits,
        recommended_order: generated.recommended_order,
        age_appropriate_min: request.targetAge ? Math.max(0, request.targetAge - 2) : 0,
        age_appropriate_max: request.targetAge ? Math.min(18, request.targetAge + 2) : 18,
        skin_types: request.skinType ? [request.skinType] : undefined,
        concerns: request.concern ? [request.concern] : undefined,
        time_of_day: request.timeOfDay ? [request.timeOfDay] : ['morning', 'evening'],
        generated_by_ai: true,
        ai_prompt: this.buildPrompt(request),
        ai_model: 'gpt-4o-mini',
        is_active: true,
        is_featured: false,
        created_by: createdBy
      });

      if (!result.ok) {
        throw new Error(result.error?.message || 'Failed to create template');
      }

      return result.value;
    } catch (error) {
      console.error('Error generating and saving template:', error);
      return null;
    }
  }

  /**
   * Generate multiple templates in batch
   */
  async generateBatchTemplates(
    requests: TemplateGenerationRequest[],
    createdBy?: string
  ): Promise<RoutineStepTemplate[]> {
    const templates: RoutineStepTemplate[] = [];

    for (const request of requests) {
      const template = await this.generateAndSaveTemplate(request, createdBy);
      if (template) {
        templates.push(template);
      }
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return templates;
  }

  /**
   * Regenerate an existing template with AI
   */
  async regenerateTemplate(
    templateId: string,
    customPrompt?: string
  ): Promise<RoutineStepTemplate | null> {
    try {
      const templateResult = await routineTemplateService.getTemplateById(templateId);

      if (!templateResult.ok || !templateResult.value) {
        const errorMsg = !templateResult.ok ? templateResult.error?.message : 'Template not found';
        throw new Error(errorMsg || 'Template not found');
      }

      const existing = templateResult.value;

      const request: TemplateGenerationRequest = {
        type: existing.type,
        targetAge: Math.floor((existing.age_appropriate_min + existing.age_appropriate_max) / 2),
        skinType: existing.skin_types?.[0],
        concern: existing.concerns?.[0],
        timeOfDay: existing.time_of_day?.[0] as any,
        customPrompt
      };

      const generated = await this.generateTemplate(request);

      if (!generated) {
        throw new Error('Failed to regenerate template');
      }

      // Update existing template
      const updateResult = await routineTemplateService.updateTemplate(templateId, {
        title: generated.title,
        description: generated.description,
        default_duration: generated.default_duration,
        default_instructions: generated.default_instructions,
        tips: generated.tips,
        benefits: generated.benefits,
        ai_prompt: this.buildPrompt(request),
        updated_at: new Date().toISOString()
      });

      if (!updateResult.ok) {
        // Force cast to any to avoid "Property error does not exist on type never" if TS inference fails
        const err = (updateResult as any).error;
        throw new Error(err?.message || 'Failed to update template');
      }

      return updateResult.value;
    } catch (error) {
      console.error('Error regenerating template:', error);
      return null;
    }
  }

  /**
   * Build the AI prompt for template generation
   */
  private buildPrompt(request: TemplateGenerationRequest): string {
    let prompt = `Generate a detailed skincare routine step template for: ${request.type}\n\n`;

    if (request.targetAge) {
      prompt += `Target age: ${request.targetAge} years old\n`;
    }

    if (request.skinType) {
      prompt += `Skin type: ${request.skinType}\n`;
    }

    if (request.concern) {
      prompt += `Skin concern: ${request.concern}\n`;
    }

    if (request.timeOfDay) {
      prompt += `Time of day: ${request.timeOfDay}\n`;
    }

    if (request.customPrompt) {
      prompt += `\nAdditional requirements: ${request.customPrompt}\n`;
    }

    prompt += `\nReturn a JSON object with this exact structure:
{
  "template": {
    "title": "Short, engaging title (e.g., 'Gentle Morning Cleanse')",
    "description": "2-3 sentence description of what this step does and why it's important",
    "icon_name": "lucide icon name (e.g., 'droplets', 'sparkles', 'sun', 'shield', 'zap')",
    "color_hex": "hex color code that fits the step type (e.g., '#A7F3D0' for cleanser)",
    "default_duration": 30-120 (seconds, realistic time for this step),
    "default_instructions": [
      "Step 1: Clear, simple instruction",
      "Step 2: Another clear instruction",
      "Step 3: etc."
    ],
    "tips": "💡 One helpful tip or pro advice (include emoji)",
    "benefits": [
      "Benefit 1",
      "Benefit 2",
      "Benefit 3"
    ],
    "recommended_order": 1-5 (typical order in a routine: cleanser=1, serum=2, moisturizer=3, sunscreen=4, treatment=2-3)
  }
}

Make it age-appropriate, safe, educational, and fun!`;

    return prompt;
  }

  /**
   * Create a URL-friendly slug from a title
   */
  private createSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}

export const templateGenerationService = new TemplateGenerationService();

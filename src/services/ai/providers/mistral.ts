/**
 * Mistral Provider
 * Minimal provider implementation for Mistral chat completions (JSON output)
 */

import {
  AnalyseIngredientsInput,
  AnalyseIngredientsOutput,
  SummariseRiskInput,
  SummariseRiskOutput,
  AssessRoutineInput,
  AssessRoutineOutput,
  ProposeRoutineInput,
  ProposeRoutineOutput,
  CoachParentInput,
  CoachParentOutput,
  RouteQuestionInput,
  RouteQuestionOutput,
  AIOptions,
} from '../types';
import { loadActivePromptTemplate } from '../../config/promptLoader';

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY || process.env.EXPO_PUBLIC_MISTRAL_API_KEY;
const BASE_URL = 'https://api.mistral.ai/v1/chat/completions';
const DEFAULT_MODEL = 'mistral-small-latest';

async function callMistral<T>(
  systemPrompt: string,
  userPrompt: string,
  options: AIOptions = {},
  modelOverride?: string
): Promise<T> {
  if (!MISTRAL_API_KEY) {
    throw new Error('Mistral API key not configured');
  }

  const timeout = options.timeout_ms || 30000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const model = modelOverride || options.model || DEFAULT_MODEL;

    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${MISTRAL_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: options.temperature ?? 0.7,
        max_tokens: options.max_tokens ?? 2000,
        response_format: { type: 'json_object' },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`Mistral API error: ${response.status} - ${text.slice(0, 300)}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No response from Mistral');
    }

    return JSON.parse(content) as T;
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('❌ Mistral API error:', error);
    throw error;
  }
}

async function getSystemPromptTemplate(toolName: string) {
  return await loadActivePromptTemplate(toolName, 'system');
}

export async function analyseIngredients(
  input: AnalyseIngredientsInput,
  options?: AIOptions
): Promise<AnalyseIngredientsOutput> {
  const tpl = await getSystemPromptTemplate('analyse_ingredients');
  const systemPrompt = `${tpl.content}

You are analysing product ingredients for child safety. Return a JSON object with:
- normalised_ingredients: array of uppercase ingredient names
- flags: object with safety flags
- ingredient_details: array of ingredient analysis

Focus on common allergens, irritants, and age-appropriateness.`;

  const userPrompt = `Analyse these ingredients for a ${input.child_profile.age_years}-year-old child:

Product: ${input.product.name} by ${input.product.brand}
Category: ${input.product.category}
Ingredients: ${input.product.ingredients_raw || 'Not provided'}

Child profile:
- Age: ${input.child_profile.age_years} years
- Has eczema: ${input.child_profile.has_eczema || false}
- Known allergies: ${input.child_profile.known_allergies?.join(', ') || 'None'}

Return valid JSON only.`;

  return callMistral<AnalyseIngredientsOutput>(systemPrompt, userPrompt, options || {}, tpl.model_preferences?.model);
}

export async function summariseRiskForParent(
  input: SummariseRiskInput,
  options?: AIOptions
): Promise<SummariseRiskOutput> {
  const tpl = await getSystemPromptTemplate('summarise_risk_for_parent');
  const systemPrompt = `${tpl.content}

Explain product safety in parent-friendly language. Be calm and practical.
Return JSON with: overall_risk_level, summary_text, bullet_points, practical_tips, disclaimer.`;

  const userPrompt = `Explain this product assessment to a parent:

Product: ${input.product.name} by ${input.product.brand}
Usage: ${input.usage_context}
Child: ${input.child_profile.age_years} years old${input.child_profile.has_eczema ? ', has eczema' : ''}

Flags: ${JSON.stringify(input.flags, null, 2)}

Provide a calm, helpful summary. Return valid JSON only.`;

  return callMistral<SummariseRiskOutput>(systemPrompt, userPrompt, options || {}, tpl.model_preferences?.model);
}

export async function assessRoutine(
  input: AssessRoutineInput,
  options?: AIOptions
): Promise<AssessRoutineOutput> {
  const tpl = await getSystemPromptTemplate('assess_routine');
  const systemPrompt = `${tpl.content}

Analyse a child's skincare routine for safety and effectiveness.
Check for: product conflicts, over-complication, age-appropriateness, duplication of actives.
Return JSON with: overall_assessment, headline, key_points, recommendations, compatibility_issues, disclaimer.`;

  const userPrompt = `Assess this routine for ${input.child_profile.name} (${input.child_profile.age_years} years old):

${input.products
    .map(
      (p, i) =>
        `${i + 1}. ${p.name} (${p.brand}) - ${p.category}
   Time: ${p.time_of_day || 'not specified'}
   Frequency: ${p.frequency || 'not specified'}
   Flags: ${JSON.stringify(p.flags || {})}`
    )
    .join('\n\n')}

Child profile:
- Has eczema: ${input.child_profile.has_eczema || false}
- Known allergies: ${input.child_profile.known_allergies?.join(', ') || 'None'}

Return valid JSON only.`;

  return callMistral<AssessRoutineOutput>(systemPrompt, userPrompt, options || {}, tpl.model_preferences?.model);
}

export async function proposeRoutine(
  input: ProposeRoutineInput,
  options?: AIOptions
): Promise<ProposeRoutineOutput> {
  const tpl = await getSystemPromptTemplate('propose_routine');
  const systemPrompt = `${tpl.content}

Design a simple, age-appropriate skincare routine for a child.
Keep it minimal - children don't need complex routines.
Return JSON with: routine (morning/evening steps), explanations, missing_products, introduction_plan, disclaimer.`;

  const userPrompt = `Create a starter routine for a ${input.child_profile.age_years}-year-old child:

Goals: ${input.goals.join(', ')}
Budget: ${input.budget || 'medium'}

Child profile:
- Has eczema: ${input.child_profile.has_eczema || false}
- Skin type: ${input.child_profile.skin_type || 'not specified'}
- Known allergies: ${input.child_profile.known_allergies?.join(', ') || 'None'}

${input.available_products ? `Available products:\n${input.available_products.map((p) => `- ${p.name} (${p.category})`).join('\n')}` : 'No products available yet'}

Return valid JSON only.`;

  return callMistral<ProposeRoutineOutput>(systemPrompt, userPrompt, options || {}, tpl.model_preferences?.model);
}

export async function coachParent(
  input: CoachParentInput,
  options?: AIOptions
): Promise<CoachParentOutput> {
  const tpl = await getSystemPromptTemplate('coach_parent');
  const systemPrompt = `${tpl.content}

Answer parent questions about children's skincare with practical, evidence-based guidance.
Be supportive and clear. Encourage professional consultation when appropriate.
Return JSON with: answer_text, key_points, suggested_actions, related_topics, follow_up_prompts, must_show_disclaimer, disclaimer.`;

  const userPrompt = `Parent's question: "${input.question}"

Child: ${input.child_profile.age_years} years old
${input.child_profile.has_eczema ? 'Has eczema' : ''}
${input.child_profile.known_allergies?.length ? `Allergies: ${input.child_profile.known_allergies.join(', ')}` : ''}

${input.context?.current_routine_products ? `Current routine:\n${input.context.current_routine_products.map((p) => `- ${p.name}`).join('\n')}` : ''}
${input.context?.last_scanned_product ? `Recently scanned: ${input.context.last_scanned_product.name} by ${input.context.last_scanned_product.brand}` : ''}

Provide a helpful, practical answer with 2-4 follow-up prompts the parent might ask next. Return valid JSON only.`;

  return callMistral<CoachParentOutput>(systemPrompt, userPrompt, options || {}, tpl.model_preferences?.model);
}

export async function routeQuestion(
  input: RouteQuestionInput,
  options?: AIOptions
): Promise<RouteQuestionOutput> {
  const tpl = await getSystemPromptTemplate('interpret_question_and_route');
  const systemPrompt = `${tpl.content}

You are a question router for FreshiesAI.
Return JSON with: intent, confidence (0-1), suggested_tool, extracted_entities, reasoning.`;

  const contextInfo: string[] = [];
  if (input.context?.last_scanned_product) {
    contextInfo.push(`Recently scanned: ${input.context.last_scanned_product.name} by ${input.context.last_scanned_product.brand}`);
  }
  if (input.context?.current_routine_products?.length) {
    contextInfo.push(`Has ${input.context.current_routine_products.length} products in routine`);
  }

  const userPrompt = `Question: "${input.question}"

${input.child_profile ? `Child: ${input.child_profile.age_years} years old` : 'No child profile'}
${contextInfo.length > 0 ? `\nContext:\n${contextInfo.join('\n')}` : ''}

Determine the intent and best tool to handle this. Return valid JSON only.`;

  return callMistral<RouteQuestionOutput>(systemPrompt, userPrompt, options || {}, tpl.model_preferences?.model);
}

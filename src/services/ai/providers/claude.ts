/**
 * Claude Provider
 * MCP integration for Anthropic Claude models
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
import FRESHIES_AI_META_PROMPT from '../metaPrompt';

const CLAUDE_API_KEY = process.env.EXPO_PUBLIC_CLAUDE_API_KEY;
const BASE_URL = 'https://api.anthropic.com/v1/messages';
const DEFAULT_MODEL = 'claude-3-5-sonnet-20241022';
const ANTHROPIC_VERSION = '2023-06-01';

// Use comprehensive meta prompt for all interactions
const SYSTEM_PROMPT_BASE = `${FRESHIES_AI_META_PROMPT}

IMPORTANT: Always respond with valid JSON only. No markdown, no explanations outside the JSON structure.`;

/**
 * Make Claude API call with structured output
 */
async function callClaude<T>(
  systemPrompt: string,
  userPrompt: string,
  options: AIOptions = {}
): Promise<T> {
  if (!CLAUDE_API_KEY) {
    throw new Error('Claude API key not configured');
  }

  const timeout = options.timeout_ms || 30000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        max_tokens: options.max_tokens || 4096,
        temperature: options.temperature || 0.7,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Claude API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const content = data.content[0]?.text;

    if (!content) {
      throw new Error('No response from Claude');
    }

    // Claude sometimes wraps JSON in markdown code blocks, so clean it
    const cleanedContent = content
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    return JSON.parse(cleanedContent) as T;
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('❌ Claude API error:', error);
    throw error;
  }
}

/**
 * Tool 1: Analyse Ingredients
 */
export async function analyseIngredients(
  input: AnalyseIngredientsInput,
  options?: AIOptions
): Promise<AnalyseIngredientsOutput> {
  const systemPrompt = `${SYSTEM_PROMPT_BASE}

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

  return callClaude<AnalyseIngredientsOutput>(systemPrompt, userPrompt, options);
}

/**
 * Tool 2: Summarise Risk for Parent
 */
export async function summariseRiskForParent(
  input: SummariseRiskInput,
  options?: AIOptions
): Promise<SummariseRiskOutput> {
  const systemPrompt = `${SYSTEM_PROMPT_BASE}

Explain product safety in parent-friendly language. Be calm and practical.
Return JSON with: overall_risk_level, summary_text, bullet_points, practical_tips, disclaimer.`;

  const userPrompt = `Explain this product assessment to a parent:

Product: ${input.product.name} by ${input.product.brand}
Usage: ${input.usage_context}
Child: ${input.child_profile.age_years} years old${input.child_profile.has_eczema ? ', has eczema' : ''}

Flags: ${JSON.stringify(input.flags, null, 2)}

Provide a calm, helpful summary. Return valid JSON only.`;

  return callClaude<SummariseRiskOutput>(systemPrompt, userPrompt, options);
}

/**
 * Tool 3: Assess Routine
 */
export async function assessRoutine(
  input: AssessRoutineInput,
  options?: AIOptions
): Promise<AssessRoutineOutput> {
  const systemPrompt = `${SYSTEM_PROMPT_BASE}

Analyse a child's skincare routine for safety and effectiveness.
Check for: product conflicts, over-complication, age-appropriateness, duplication of actives.
Return JSON with: overall_assessment, headline, key_points, recommendations, compatibility_issues, disclaimer.`;

  const userPrompt = `Assess this routine for ${input.child_profile.name} (${input.child_profile.age_years} years old):

${input.products.map((p, i) => `${i + 1}. ${p.name} (${p.brand}) - ${p.category}
   Time: ${p.time_of_day || 'not specified'}
   Frequency: ${p.frequency || 'not specified'}
   Flags: ${JSON.stringify(p.flags || {})}`).join('\n\n')}

Child profile:
- Has eczema: ${input.child_profile.has_eczema || false}
- Known allergies: ${input.child_profile.known_allergies?.join(', ') || 'None'}

Return valid JSON only.`;

  return callClaude<AssessRoutineOutput>(systemPrompt, userPrompt, options);
}

/**
 * Tool 4: Propose Routine
 */
export async function proposeRoutine(
  input: ProposeRoutineInput,
  options?: AIOptions
): Promise<ProposeRoutineOutput> {
  const systemPrompt = `${SYSTEM_PROMPT_BASE}

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

${input.available_products ? `Available products:\n${input.available_products.map(p => `- ${p.name} (${p.category})`).join('\n')}` : 'No products available yet'}

Return valid JSON only.`;

  return callClaude<ProposeRoutineOutput>(systemPrompt, userPrompt, options);
}

/**
 * Tool 5: Coach Parent
 */
export async function coachParent(
  input: CoachParentInput,
  options?: AIOptions
): Promise<CoachParentOutput> {
  const systemPrompt = `${SYSTEM_PROMPT_BASE}

Answer parent questions about children's skincare with practical, evidence-based guidance.
Be supportive and clear. Encourage professional consultation when appropriate.
Return JSON with: answer_text, key_points, suggested_actions, related_topics, follow_up_prompts, must_show_disclaimer, disclaimer.`;

  const userPrompt = `Parent's question: "${input.question}"

Child: ${input.child_profile.age_years} years old
${input.child_profile.has_eczema ? 'Has eczema' : ''}
${input.child_profile.known_allergies?.length ? `Allergies: ${input.child_profile.known_allergies.join(', ')}` : ''}

${input.context?.current_routine_products ? `Current routine:\n${input.context.current_routine_products.map(p => `- ${p.name}`).join('\n')}` : ''}
${input.context?.last_scanned_product ? `Recently scanned: ${input.context.last_scanned_product.name} by ${input.context.last_scanned_product.brand}` : ''}

Provide a helpful, practical answer with 2-4 follow-up prompts the parent might ask next. Return valid JSON only.`;

  return callClaude<CoachParentOutput>(systemPrompt, userPrompt, options);
}

/**
 * Tool 6: Route Question (Router)
 */
export async function routeQuestion(
  input: RouteQuestionInput,
  options?: AIOptions
): Promise<RouteQuestionOutput> {
  const systemPrompt = `You are a question router for FreshiesAI, a kids' skincare assistant.

Analyse the parent's question and determine:
1. The intent (what they're trying to accomplish)
2. Which tool should handle it
3. Extract any relevant entities

Available tools:
- analyse_ingredients: For analysing a specific product's ingredients
- assess_routine: For evaluating multiple products used together
- propose_routine: For creating a new routine from scratch
- coach_parent: For general questions, explanations, coaching

Return JSON with: intent, confidence (0-1), suggested_tool, extracted_entities, reasoning.`;

  const contextInfo = [];
  if (input.context?.last_scanned_product) {
    contextInfo.push(`Recently scanned: ${input.context.last_scanned_product.name} by ${input.context.last_scanned_product.brand}`);
  }
  if (input.context?.current_routine_products?.length) {
    contextInfo.push(`Has ${input.context.current_routine_products.length} products in routine`);
  }
  if (input.context?.conversation_history?.length) {
    const lastExchange = input.context.conversation_history.slice(-2);
    contextInfo.push(`Recent context: ${lastExchange.map(m => `${m.role}: ${m.content.substring(0, 100)}`).join(' | ')}`);
  }

  const userPrompt = `Question: "${input.question}"

${input.child_profile ? `Child: ${input.child_profile.age_years} years old` : 'No child profile'}
${contextInfo.length > 0 ? `\nContext:\n${contextInfo.join('\n')}` : ''}

Determine the intent and best tool to handle this. Return valid JSON only.`;

  return callClaude<RouteQuestionOutput>(systemPrompt, userPrompt, options);
}

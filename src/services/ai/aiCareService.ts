/**
 * AI Care Service
 * Main orchestration layer for all AI tools
 * Handles provider selection, fallbacks, logging, and error handling
 */

import * as OpenAIProvider from './providers/openai';
import * as ClaudeProvider from './providers/claude';
import * as MistralProvider from './providers/mistral';
import { getEffectiveAIProvider } from '../../stores/settingsStore';
import { isCapabilityPaused, loadActivePromptTemplate } from '../config/promptLoader';
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
  AIProvider,
  ChildProfile,
  ProductData,
  ProductWithFlags,
} from './types';

// ============================================================================
// Provider Selection
// ============================================================================

function getProvider(preferredProvider?: AIProvider): 'openai' | 'claude' | 'mistral' {
  // Use explicitly passed provider, or get from settings store
  const effectiveProvider = preferredProvider || getEffectiveAIProvider();
  
  if (effectiveProvider === 'auto' || !effectiveProvider) {
    // Auto-select based on availability
    const hasOpenAI = !!process.env.EXPO_PUBLIC_OPENAI_API_KEY;
    const hasClaude = !!process.env.EXPO_PUBLIC_CLAUDE_API_KEY;
    const hasMistral = !!process.env.MISTRAL_API_KEY || !!process.env.EXPO_PUBLIC_MISTRAL_API_KEY;
    
    if (hasOpenAI) return 'openai';
    if (hasMistral) return 'mistral';
    if (hasClaude) return 'claude';
    
    throw new Error('No AI provider configured');
  }
  
  if (effectiveProvider === 'mistral') return 'mistral';
  if (effectiveProvider === 'openai' || effectiveProvider === 'claude') return effectiveProvider;
  throw new Error('Unsupported AI provider');
}

// ============================================================================
// Logging and Analytics
// ============================================================================

interface AICallLog {
  tool: string;
  provider: string;
  timestamp: string;
  duration_ms: number;
  success: boolean;
  error?: string;
}

function logAICall(log: AICallLog) {
  console.log(`🤖 AI Call: ${log.tool} via ${log.provider} - ${log.success ? '✅' : '❌'} (${log.duration_ms}ms)`);
  
  // TODO: Send to analytics service
  // analytics.track('ai_tool_used', {
  //   tool: log.tool,
  //   provider: log.provider,
  //   duration_ms: log.duration_ms,
  //   success: log.success,
  // });
}

// ============================================================================
// Tool Wrappers with Fallback
// ============================================================================

async function callWithFallback<T>(
  toolName: string,
  openaiFunc: (opts: AIOptions) => Promise<T>,
  mistralFunc: (opts: AIOptions) => Promise<T>,
  claudeFunc: (opts: AIOptions) => Promise<T>,
  options: AIOptions = {}
): Promise<T> {
  const startTime = Date.now();

  if (await isCapabilityPaused(toolName)) {
    throw new Error(`AI capability is paused: ${toolName}`);
  }

  const tpl = await loadActivePromptTemplate(toolName, 'system');
  const configuredProvider = tpl.model_preferences?.provider as AIProvider | undefined;
  const configuredModel = tpl.model_preferences?.model as string | undefined;

  const effectiveOptions: AIOptions = {
    ...options,
    provider: options.provider && options.provider !== 'auto' ? options.provider : configuredProvider || options.provider,
    model: options.model || configuredModel,
  };

  const provider = getProvider(effectiveOptions.provider);
  
  try {
    const result = provider === 'openai'
      ? await openaiFunc(effectiveOptions)
      : provider === 'mistral'
        ? await mistralFunc(effectiveOptions)
        : await claudeFunc(effectiveOptions);
    
    logAICall({
      tool: toolName,
      provider,
      timestamp: new Date().toISOString(),
      duration_ms: Date.now() - startTime,
      success: true,
    });
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logAICall({
      tool: toolName,
      provider,
      timestamp: new Date().toISOString(),
      duration_ms: duration,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    
    // Try fallback provider if primary fails
    if (effectiveOptions.provider !== 'auto') {
      throw error; // Don't fallback if user explicitly chose a provider
    }

    const fallbackProvider = provider === 'openai' ? 'mistral' : 'openai';
    console.log(`⚠️ Trying fallback provider: ${fallbackProvider}`);
    
    try {
      const result = fallbackProvider === 'openai'
        ? await openaiFunc(effectiveOptions)
        : fallbackProvider === 'mistral'
          ? await mistralFunc(effectiveOptions)
          : await claudeFunc(effectiveOptions);
      
      logAICall({
        tool: toolName,
        provider: fallbackProvider,
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
        success: true,
      });
      
      return result;
    } catch (fallbackError) {
      logAICall({
        tool: toolName,
        provider: fallbackProvider,
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
        success: false,
        error: fallbackError instanceof Error ? fallbackError.message : 'Unknown error',
      });
      
      throw fallbackError;
    }
  }
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Analyse a product's ingredients for child safety
 */
export async function analyseProductForChild(
  product: ProductData,
  childProfile: ChildProfile,
  options?: AIOptions
): Promise<AnalyseIngredientsOutput> {
  const input: AnalyseIngredientsInput = { product, child_profile: childProfile };
  
  return callWithFallback(
    'analyse_ingredients',
    (opts) => OpenAIProvider.analyseIngredients(input, opts),
    (opts) => MistralProvider.analyseIngredients(input, opts),
    (opts) => ClaudeProvider.analyseIngredients(input, opts),
    options
  );
}

/**
 * Get a parent-friendly summary of product safety
 */
export async function getProductSummaryForParent(
  product: ProductData,
  usageContext: string,
  normalisedIngredients: string[],
  flags: any,
  childProfile: ChildProfile,
  options?: AIOptions
): Promise<SummariseRiskOutput> {
  const input: SummariseRiskInput = {
    product,
    usage_context: usageContext,
    normalised_ingredients: normalisedIngredients,
    flags,
    child_profile: childProfile,
  };
  
  return callWithFallback(
    'summarise_risk_for_parent',
    (opts) => OpenAIProvider.summariseRiskForParent(input, opts),
    (opts) => MistralProvider.summariseRiskForParent(input, opts),
    (opts) => ClaudeProvider.summariseRiskForParent(input, opts),
    options
  );
}

/**
 * Assess a child's complete skincare routine
 */
export async function assessRoutineForChild(
  routine: ProductWithFlags[],
  childProfile: ChildProfile,
  options?: AIOptions
): Promise<AssessRoutineOutput> {
  const input: AssessRoutineInput = {
    child_profile: childProfile,
    products: routine,
  };
  
  return callWithFallback(
    'assess_routine',
    (opts) => OpenAIProvider.assessRoutine(input, opts),
    (opts) => MistralProvider.assessRoutine(input, opts),
    (opts) => ClaudeProvider.assessRoutine(input, opts),
    options
  );
}

/**
 * Propose a new skincare routine for a child
 */
export async function proposeRoutineForChild(
  childProfile: ChildProfile,
  goals: string[],
  availableProducts?: ProductWithFlags[],
  budget?: 'low' | 'medium' | 'high',
  options?: AIOptions
): Promise<ProposeRoutineOutput> {
  const input: ProposeRoutineInput = {
    child_profile: childProfile,
    goals,
    available_products: availableProducts,
    budget,
  };
  
  return callWithFallback(
    'propose_routine',
    (opts) => OpenAIProvider.proposeRoutine(input, opts),
    (opts) => MistralProvider.proposeRoutine(input, opts),
    (opts) => ClaudeProvider.proposeRoutine(input, opts),
    options
  );
}

/**
 * Answer parent questions about skincare
 */
export async function coachParent(
  question: string,
  childProfile: ChildProfile,
  context?: {
    current_routine_products?: ProductWithFlags[];
    recent_concerns?: string[];
    last_scanned_product?: ProductData;
  },
  options?: AIOptions
): Promise<CoachParentOutput> {
  const input: CoachParentInput = {
    child_profile: childProfile,
    question,
    context,
  };
  
  return callWithFallback(
    'coach_parent',
    (opts) => OpenAIProvider.coachParent(input, opts),
    (opts) => MistralProvider.coachParent(input, opts),
    (opts) => ClaudeProvider.coachParent(input, opts),
    options
  );
}

// ============================================================================
// Convenience Methods
// ============================================================================

/**
 * Complete product analysis workflow
 * Analyses ingredients and returns parent-friendly summary
 */
export async function analyseProductComplete(
  product: ProductData,
  childProfile: ChildProfile,
  usageContext: string = 'daily use',
  options?: AIOptions
): Promise<{
  analysis: AnalyseIngredientsOutput;
  summary: SummariseRiskOutput;
}> {
  // Step 1: Analyse ingredients
  const analysis = await analyseProductForChild(product, childProfile, options);
  
  // Step 2: Get parent summary
  const summary = await getProductSummaryForParent(
    product,
    usageContext,
    analysis.normalised_ingredients,
    analysis.flags,
    childProfile,
    options
  );
  
  return { analysis, summary };
}

/**
 * Route a question to the appropriate AI tool
 */
export async function routeQuestion(
  input: RouteQuestionInput,
  options?: AIOptions
): Promise<RouteQuestionOutput> {
  return callWithFallback(
    'interpret_question_and_route',
    (opts) => OpenAIProvider.routeQuestion(input, opts),
    (opts) => MistralProvider.routeQuestion(input, opts),
    (opts) => ClaudeProvider.routeQuestion(input, opts),
    options
  );
}

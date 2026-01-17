/**
 * AI Prompt Loader Service
 * Loads AI prompts from database instead of hard-coded files
 * Enables dynamic prompt management without code deployment
 */

import { supabase } from '../../lib/supabase';
import FRESHIES_AI_META_PROMPT from '../ai/metaPrompt';

interface PromptTemplate {
  id: string;
  tool_name: string;
  role: 'system' | 'user';
  content: string;
  model_preferences: {
    provider?: string;
    model?: string;
  };
  version: number;
}

// In-memory cache for prompts (refresh every 5 minutes)
const promptCache: Map<string, { prompt: string; model_preferences: any; timestamp: number }> = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const capabilityCache: Map<string, { state: string | null; timestamp: number }> = new Map();

export type ActivePromptTemplate = {
  content: string;
  model_preferences: { provider?: string; model?: string };
};

export async function loadCapabilityState(toolName: string): Promise<'active' | 'paused' | 'needs_review' | null> {
  const cacheKey = toolName;
  const cached = capabilityCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    const s = cached.state;
    return s === 'active' || s === 'paused' || s === 'needs_review' ? (s as any) : null;
  }

  try {
    const { data, error } = await supabase
      .from('ai_capabilities')
      .select('state')
      .eq('key', toolName)
      .maybeSingle();

    if (error) {
      return null;
    }

    const state = data?.state || null;
    capabilityCache.set(cacheKey, { state, timestamp: Date.now() });

    return state === 'active' || state === 'paused' || state === 'needs_review' ? (state as any) : null;
  } catch {
    return null;
  }
}

export async function isCapabilityPaused(toolName: string): Promise<boolean> {
  const state = await loadCapabilityState(toolName);
  return state === 'paused';
}

export async function loadActivePromptTemplate(
  toolName: string,
  role: 'system' | 'user' = 'system'
): Promise<ActivePromptTemplate> {
  const cacheKey = `${toolName}:${role}`;

  const cached = promptCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return { content: cached.prompt, model_preferences: cached.model_preferences || {} };
  }

  try {
    const { data, error } = await supabase
      .from('ai_prompt_templates')
      .select('content, model_preferences')
      .eq('tool_name', toolName)
      .eq('role', role)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      const fallback = getFallbackPrompt(toolName, role);
      return { content: fallback, model_preferences: {} };
    }

    promptCache.set(cacheKey, {
      prompt: data.content,
      model_preferences: data.model_preferences || {},
      timestamp: Date.now(),
    });

    return { content: data.content, model_preferences: data.model_preferences || {} };
  } catch (error) {
    console.error(`Error loading prompt for ${toolName}:${role}:`, error);
    const fallback = getFallbackPrompt(toolName, role);
    return { content: fallback, model_preferences: {} };
  }
}

/**
 * Load active prompt from database
 * Falls back to hard-coded prompt if database fails
 */
export async function loadActivePrompt(
  toolName: string,
  role: 'system' | 'user' = 'system'
): Promise<string> {
  const cacheKey = `${toolName}:${role}`;
  
  // Check cache first
  const cached = promptCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.prompt;
  }

  try {
    const { data, error } = await supabase
      .from('ai_prompt_templates')
      .select('content, model_preferences')
      .eq('tool_name', toolName)
      .eq('role', role)
      .eq('is_active', true)
      .single();

    if (error) {
      console.warn(`Failed to load prompt for ${toolName}:${role}, using fallback:`, error.message);
      return getFallbackPrompt(toolName, role);
    }

    if (!data) {
      console.warn(`No active prompt found for ${toolName}:${role}, using fallback`);
      return getFallbackPrompt(toolName, role);
    }

    // Cache the result
    promptCache.set(cacheKey, {
      prompt: data.content,
      model_preferences: data.model_preferences || {},
      timestamp: Date.now(),
    });

    return data.content;
  } catch (error) {
    console.error(`Error loading prompt for ${toolName}:${role}:`, error);
    return getFallbackPrompt(toolName, role);
  }
}

/**
 * Get fallback prompt (current hard-coded prompts)
 */
function getFallbackPrompt(toolName: string, role: 'system' | 'user'): string {
  // For system role, return the meta prompt
  if (role === 'system') {
    return FRESHIES_AI_META_PROMPT;
  }

  // For user role, return empty (will be constructed by the specific tool)
  return '';
}

/**
 * Clear prompt cache (useful for testing or forcing refresh)
 */
export function clearPromptCache(): void {
  promptCache.clear();
  capabilityCache.clear();
}

/**
 * Preload all prompts into cache
 * Call this on app startup for better performance
 */
export async function preloadPrompts(): Promise<void> {
  const tools = [
    'coach_parent',
    'assess_routine',
    'propose_routine',
    'analyse_ingredients',
    'summarise_risk',
    'route_question',
  ];

  await Promise.all(
    tools.map(tool => loadActivePrompt(tool, 'system'))
  );

  console.log('✅ AI prompts preloaded');
}

/**
 * Save new prompt version to database
 * (For future admin use)
 */
export async function savePromptVersion(
  toolName: string,
  role: 'system' | 'user',
  content: string,
  changeReason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get current active prompt
    const { data: current } = await supabase
      .from('ai_prompt_templates')
      .select('id, version')
      .eq('tool_name', toolName)
      .eq('role', role)
      .eq('is_active', true)
      .single();

    const newVersion = (current?.version || 0) + 1;

    // Deactivate current prompt
    if (current) {
      await supabase
        .from('ai_prompt_templates')
        .update({ is_active: false })
        .eq('id', current.id);

      // Save to version history
      await supabase
        .from('ai_prompt_versions')
        .insert({
          template_id: current.id,
          version: current.version,
          content: content,
          change_reason: changeReason,
        });
    }

    // Insert new active prompt
    const { error } = await supabase
      .from('ai_prompt_templates')
      .insert({
        tool_name: toolName,
        role,
        content,
        version: newVersion,
        is_active: true,
      });

    if (error) {
      return { success: false, error: error.message };
    }

    // Clear cache to force reload
    clearPromptCache();

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

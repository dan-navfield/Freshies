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
const promptCache: Map<string, { prompt: string; timestamp: number }> = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

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
      .select('content')
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

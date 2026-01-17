/**
 * AI-Powered Routine Suggestions
 * Analyzes child's skin profile, completion patterns, and product usage
 * to provide personalized routine recommendations
 */

import { supabase } from '../lib/supabase';

export interface RoutineSuggestion {
  id: string;
  type: 'add_step' | 'remove_step' | 'reorder' | 'product_swap' | 'timing_adjustment';
  title: string;
  description: string;
  reasoning: string;
  confidence: number; // 0-100
  priority: 'low' | 'medium' | 'high';
  suggested_action: any;
  emoji: string;
}

export interface SkinAnalysis {
  skin_type: string;
  concerns: string[];
  sensitivity_level: number;
  acne_tendency: string;
  environmental_factors: any;
  age_band: string;
}

/**
 * Generate AI-powered routine suggestions
 */
export async function generateRoutineSuggestions(
  childProfileId: string
): Promise<RoutineSuggestion[]> {
  try {
    const suggestions: RoutineSuggestion[] = [];

    // Get child profile and skin analysis
    const skinAnalysis = await getSkinAnalysis(childProfileId);

    // Get current routine
    const currentRoutine = await getCurrentRoutine(childProfileId);

    // Get completion patterns
    const completionPatterns = await getCompletionPatterns(childProfileId);

    // Generate different types of suggestions
    suggestions.push(...await suggestMissingSteps(skinAnalysis, currentRoutine));
    suggestions.push(...await suggestProductSwaps(skinAnalysis, currentRoutine));
    suggestions.push(...await suggestTimingAdjustments(completionPatterns));
    suggestions.push(...await suggestSeasonalAdjustments(skinAnalysis, currentRoutine));
    suggestions.push(...await suggestBasedOnConcerns(skinAnalysis, currentRoutine));

    // Sort by priority and confidence
    return suggestions.sort((a, b) => {
      const priorityWeight = { high: 3, medium: 2, low: 1 };
      const aPriority = priorityWeight[a.priority];
      const bPriority = priorityWeight[b.priority];

      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      return b.confidence - a.confidence;
    }).slice(0, 5); // Return top 5 suggestions
  } catch (error) {
    console.error('Error generating routine suggestions:', error);
    return [];
  }
}

/**
 * Get skin analysis from child profile
 */
async function getSkinAnalysis(childProfileId: string): Promise<SkinAnalysis> {
  const { data } = await supabase
    .from('child_profiles')
    .select('*')
    .eq('id', childProfileId)
    .single();

  return {
    skin_type: data?.skin_type || 'normal',
    concerns: data?.concerns || [],
    sensitivity_level: data?.sensitivity_level || 1,
    acne_tendency: data?.acne_tendency || 'none',
    environmental_factors: data?.environmental_factors || {},
    age_band: data?.age_band || '10-12',
  };
}

/**
 * Get current routine steps
 */
async function getCurrentRoutine(childProfileId: string): Promise<any[]> {
  const { data: routine } = await supabase
    .from('child_routines')
    .select('id')
    .eq('child_profile_id', childProfileId)
    .eq('is_active', true)
    .single();

  if (!routine) return [];

  const { data: steps } = await supabase
    .from('routine_steps')
    .select('*')
    .eq('routine_id', routine.id)
    .eq('is_active', true)
    .order('segment')
    .order('step_order');

  return steps || [];
}

interface CompletionPatterns {
  morning: { count: number; avgTime: number };
  afternoon: { count: number; avgTime: number };
  evening: { count: number; avgTime: number };
  weekday: number;
  weekend: number;
}

/**
 * Get completion patterns
 */
async function getCompletionPatterns(childProfileId: string): Promise<CompletionPatterns> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const { data } = await supabase
    .from('routine_completions')
    .select('*')
    .eq('child_profile_id', childProfileId)
    .gte('completion_date', thirtyDaysAgo.toISOString().split('T')[0]);

  // Analyze patterns
  const patterns: CompletionPatterns = {
    morning: { count: 0, avgTime: 0 },
    afternoon: { count: 0, avgTime: 0 },
    evening: { count: 0, avgTime: 0 },
    weekday: 0,
    weekend: 0,
  };

  data?.forEach((completion) => {
    const segment = completion.segment as keyof Pick<CompletionPatterns, 'morning' | 'afternoon' | 'evening'>;
    const date = new Date(completion.completed_at);
    const hour = date.getHours();
    const dayOfWeek = date.getDay();

    if (patterns[segment]) {
      patterns[segment].count++;
      patterns[segment].avgTime += hour;
    }

    if (dayOfWeek === 0 || dayOfWeek === 6) {
      patterns.weekend++;
    } else {
      patterns.weekday++;
    }
  });

  // Calculate averages
  (['morning', 'afternoon', 'evening'] as const).forEach((key) => {
    if (patterns[key].count > 0) {
      patterns[key].avgTime = Math.round(patterns[key].avgTime / patterns[key].count);
    }
  });

  return patterns;
}

/**
 * Suggest missing essential steps
 */
async function suggestMissingSteps(
  skinAnalysis: SkinAnalysis,
  currentRoutine: any[]
): Promise<RoutineSuggestion[]> {
  const suggestions: RoutineSuggestion[] = [];

  const hasStepType = (type: string, segment: string) =>
    currentRoutine.some(s => s.step_type === type && s.segment === segment);

  // Essential steps everyone should have
  if (!hasStepType('cleanser', 'morning')) {
    suggestions.push({
      id: 'add-morning-cleanser',
      type: 'add_step',
      title: 'Add Morning Cleanser',
      description: 'Start your day with a gentle face wash',
      reasoning: 'Cleansing in the morning removes oils and prepares skin for the day',
      confidence: 95,
      priority: 'high',
      emoji: '🧼',
      suggested_action: {
        segment: 'morning',
        step_type: 'cleanser',
        step_order: 1,
      },
    });
  }

  if (!hasStepType('sunscreen', 'morning')) {
    suggestions.push({
      id: 'add-sunscreen',
      type: 'add_step',
      title: 'Add Sunscreen (Essential!)',
      description: 'Protect your skin from UV damage every day',
      reasoning: 'Sunscreen is the most important step for preventing skin damage and aging',
      confidence: 100,
      priority: 'high',
      emoji: '☀️',
      suggested_action: {
        segment: 'morning',
        step_type: 'sunscreen',
        step_order: 3,
      },
    });
  }

  if (!hasStepType('moisturiser', 'evening')) {
    suggestions.push({
      id: 'add-night-moisturiser',
      type: 'add_step',
      title: 'Add Night Moisturizer',
      description: 'Hydrate your skin while you sleep',
      reasoning: 'Night time is when skin repairs itself - moisturizer helps this process',
      confidence: 90,
      priority: 'medium',
      emoji: '🌙',
      suggested_action: {
        segment: 'evening',
        step_type: 'moisturiser',
        step_order: 2,
      },
    });
  }

  return suggestions;
}

interface RoutineStep {
  id: string;
  step_type: string;
  segment: string;
  step_order: number;
}

/**
 * Suggest product swaps based on skin concerns
 */
async function suggestProductSwaps(
  skinAnalysis: SkinAnalysis,
  currentRoutine: any[] // TODO: Replace any with RoutineStep[] when fully typed
): Promise<RoutineSuggestion[]> {
  const suggestions: RoutineSuggestion[] = [];

  // Suggest gentler products for sensitive skin
  if (skinAnalysis.sensitivity_level >= 3) {
    const harshProducts = currentRoutine.filter((s: RoutineStep) =>
      s.step_type === 'treatment' || s.step_type === 'cleanser'
    );

    if (harshProducts.length > 0) {
      suggestions.push({
        id: 'gentle-products',
        type: 'product_swap',
        title: 'Switch to Gentler Products',
        description: 'Your skin is sensitive - try fragrance-free options',
        reasoning: 'Sensitive skin benefits from minimal, gentle ingredients',
        confidence: 85,
        priority: 'medium',
        emoji: '🌸',
        suggested_action: {
          swap_to: 'fragrance-free',
          step_ids: harshProducts.map((p: RoutineStep) => p.id),
        },
      });
    }
  }

  // Suggest acne-fighting products
  if (skinAnalysis.acne_tendency === 'frequent' || skinAnalysis.acne_tendency === 'occasional') {
    const hasTreatment = currentRoutine.some(s => s.step_type === 'treatment');

    if (!hasTreatment) {
      suggestions.push({
        id: 'add-acne-treatment',
        type: 'add_step',
        title: 'Add Spot Treatment',
        description: 'Target breakouts with a gentle treatment',
        reasoning: 'Your skin profile shows acne tendency - a targeted treatment can help',
        confidence: 80,
        priority: 'medium',
        emoji: '🎯',
        suggested_action: {
          segment: 'evening',
          step_type: 'treatment',
          step_order: 2,
        },
      });
    }
  }

  return suggestions;
}

/**
 * Suggest timing adjustments based on completion patterns
 */
async function suggestTimingAdjustments(
  patterns: any
): Promise<RoutineSuggestion[]> {
  const suggestions: RoutineSuggestion[] = [];

  // If morning routine is often done late
  if (patterns.morning.avgTime > 10) {
    suggestions.push({
      id: 'earlier-morning',
      type: 'timing_adjustment',
      title: 'Try an Earlier Morning Routine',
      description: 'Set your reminder 2 hours earlier',
      reasoning: `You usually complete your morning routine around ${patterns.morning.avgTime}:00 - earlier is better for skin protection`,
      confidence: 70,
      priority: 'low',
      emoji: '⏰',
      suggested_action: {
        segment: 'morning',
        suggested_time: '07:00',
      },
    });
  }

  // If evening routine completion is low
  if (patterns.evening.count < patterns.morning.count * 0.7) {
    suggestions.push({
      id: 'evening-consistency',
      type: 'timing_adjustment',
      title: 'Be More Consistent with Evening Routine',
      description: 'You complete morning routines more often - try setting an evening reminder',
      reasoning: 'Evening skincare is just as important as morning for healthy skin',
      confidence: 75,
      priority: 'medium',
      emoji: '🌙',
      suggested_action: {
        segment: 'evening',
        enable_reminder: true,
      },
    });
  }

  return suggestions;
}

/**
 * Suggest seasonal adjustments
 */
async function suggestSeasonalAdjustments(
  skinAnalysis: SkinAnalysis,
  currentRoutine: any[]
): Promise<RoutineSuggestion[]> {
  const suggestions: RoutineSuggestion[] = [];
  const currentMonth = new Date().getMonth();

  // Winter (Nov-Feb): Extra hydration
  if (currentMonth >= 10 || currentMonth <= 1) {
    const hasRichMoisturizer = currentRoutine.some(s =>
      s.step_type === 'moisturiser' && s.notes?.toLowerCase().includes('rich')
    );

    if (!hasRichMoisturizer && skinAnalysis.skin_type !== 'oily') {
      suggestions.push({
        id: 'winter-hydration',
        type: 'product_swap',
        title: 'Switch to Richer Moisturizer for Winter',
        description: 'Cold weather can dry out your skin',
        reasoning: 'Winter air is drier - your skin needs extra hydration',
        confidence: 80,
        priority: 'medium',
        emoji: '❄️',
        suggested_action: {
          swap_type: 'richer_moisturizer',
        },
      });
    }
  }

  // Summer (Jun-Aug): Lighter products, more sunscreen
  if (currentMonth >= 5 && currentMonth <= 7) {
    suggestions.push({
      id: 'summer-sunscreen',
      type: 'add_step',
      title: 'Reapply Sunscreen in Afternoon',
      description: 'Summer sun is stronger - reapply for better protection',
      reasoning: 'UV rays are strongest in summer months',
      confidence: 85,
      priority: 'high',
      emoji: '☀️',
      suggested_action: {
        segment: 'afternoon',
        step_type: 'sunscreen',
      },
    });
  }

  return suggestions;
}

/**
 * Suggest based on specific skin concerns
 */
async function suggestBasedOnConcerns(
  skinAnalysis: SkinAnalysis,
  currentRoutine: any[]
): Promise<RoutineSuggestion[]> {
  const suggestions: RoutineSuggestion[] = [];
  const concerns = skinAnalysis.concerns || [];

  if (concerns.includes('dryness')) {
    const hasToner = currentRoutine.some(s => s.step_type === 'toner');
    if (!hasToner) {
      suggestions.push({
        id: 'hydrating-toner',
        type: 'add_step',
        title: 'Add Hydrating Toner',
        description: 'Boost hydration with a toner',
        reasoning: 'You mentioned dryness as a concern - toners add an extra layer of hydration',
        confidence: 75,
        priority: 'medium',
        emoji: '💧',
        suggested_action: {
          segment: 'morning',
          step_type: 'toner',
          step_order: 2,
        },
      });
    }
  }

  return suggestions;
}

/**
 * Get suggestion emoji based on type
 */
export function getSuggestionEmoji(type: string): string {
  const emojiMap: Record<string, string> = {
    add_step: '➕',
    remove_step: '➖',
    reorder: '🔄',
    product_swap: '🔄',
    timing_adjustment: '⏰',
  };
  return emojiMap[type] || '💡';
}

/**
 * Get priority color
 */
export function getPriorityColor(priority: string): string {
  const colorMap: Record<string, string> = {
    high: '#EF4444',
    medium: '#F59E0B',
    low: '#10B981',
  };
  return colorMap[priority] || '#8B7AB8';
}

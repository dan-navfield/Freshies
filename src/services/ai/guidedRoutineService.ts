/**
 * Guided Routine Service
 * AI-powered conversational routine builder for kids
 */

import { ChildProfile } from '../../types/child';

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

async function callOpenAI(messages: Array<{role: string; content: string}>, options: any = {}) {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  console.log('Calling OpenAI with model:', options.model || 'gpt-4o-mini');
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: options.model || 'gpt-4o-mini',
      messages,
      temperature: options.temperature || 0.7,
      max_tokens: options.max_tokens,
      response_format: options.response_format,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('OpenAI API error:', response.status, errorText);
    throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

export interface RoutineGoal {
  id: string;
  label: string;
  emoji: string;
  description: string;
}

export interface SuggestedStep {
  type: 'cleanser' | 'moisturizer' | 'sunscreen' | 'treatment' | 'serum';
  title: string;
  duration: number;
  instructions: string[];
  tips: string;
  reasoning: string; // Why this step is recommended
}

export interface ConversationMessage {
  role: 'assistant' | 'user';
  content: string;
  timestamp: Date;
}

export interface GuidedRoutineState {
  segment: 'morning' | 'afternoon' | 'evening';
  currentStep: 'goals' | 'concerns' | 'time' | 'review' | 'customize';
  goals: string[];
  concerns: string[];
  availableTime: number;
  suggestedSteps: SuggestedStep[];
  conversationHistory: ConversationMessage[];
}

// Predefined goals kids can choose from
export const ROUTINE_GOALS: RoutineGoal[] = [
  {
    id: 'clean',
    label: 'Keep my skin clean',
    emoji: '✨',
    description: 'Remove dirt and oil'
  },
  {
    id: 'hydrate',
    label: 'Hydrate my skin',
    emoji: '💧',
    description: 'Keep skin moisturized'
  },
  {
    id: 'protect',
    label: 'Protect from sun',
    emoji: '☀️',
    description: 'Prevent sun damage'
  },
  {
    id: 'acne',
    label: 'Help with breakouts',
    emoji: '🎯',
    description: 'Manage acne and pimples'
  },
  {
    id: 'sensitive',
    label: 'Calm sensitive skin',
    emoji: '🌸',
    description: 'Reduce redness and irritation'
  },
  {
    id: 'glow',
    label: 'Get glowing skin',
    emoji: '🌟',
    description: 'Brighten and even tone'
  }
];

/**
 * Start a new guided routine conversation
 */
export async function startGuidedRoutine(
  segment: 'morning' | 'afternoon' | 'evening',
  childProfile: ChildProfile
): Promise<{ message: string; state: GuidedRoutineState }> {
  const greeting = `Hey there! 👋 Let's build your perfect ${segment} routine together!

I'll ask you a few quick questions to understand what you want, and then I'll suggest the best steps for you. Sound good?

First up: **What do you want your ${segment} routine to do?** Pick as many as you like! 🎯`;

  const state: GuidedRoutineState = {
    segment,
    currentStep: 'goals',
    goals: [],
    concerns: [],
    availableTime: 0,
    suggestedSteps: [],
    conversationHistory: [
      {
        role: 'assistant',
        content: greeting,
        timestamp: new Date()
      }
    ]
  };

  console.log('✅ Guided routine initialized successfully');
  return { message: greeting, state };
}

/**
 * Process user's goal selection
 */
export async function processGoals(
  state: GuidedRoutineState,
  selectedGoals: string[]
): Promise<{ message: string; state: GuidedRoutineState }> {
  const updatedState = {
    ...state,
    goals: selectedGoals,
    currentStep: 'concerns' as const,
    conversationHistory: [
      ...state.conversationHistory,
      {
        role: 'user' as const,
        content: `Selected goals: ${selectedGoals.join(', ')}`,
        timestamp: new Date()
      }
    ]
  };

  const message = `Great choices! 🌟

Now, do you have any specific skin concerns I should know about? Like:
- Dry or flaky skin
- Oily or shiny skin
- Sensitive or easily irritated
- Acne-prone
- None, my skin feels pretty good!

Just tell me what applies to you, or tap "Skip" if you're not sure! 💭`;

  updatedState.conversationHistory.push({
    role: 'assistant',
    content: message,
    timestamp: new Date()
  });

  return { message, state: updatedState };
}

/**
 * Process skin concerns
 */
export async function processConcerns(
  state: GuidedRoutineState,
  concerns: string[]
): Promise<{ message: string; state: GuidedRoutineState }> {
  const updatedState = {
    ...state,
    concerns,
    currentStep: 'time' as const,
    conversationHistory: [
      ...state.conversationHistory,
      {
        role: 'user' as const,
        content: concerns.length > 0 ? `Concerns: ${concerns.join(', ')}` : 'No specific concerns',
        timestamp: new Date()
      }
    ]
  };

  const message = `Got it! ${concerns.length > 0 ? "I'll keep that in mind. 💚" : ""}

One last thing: **How much time do you have for your ${state.segment} routine?** ⏰

Pick what works for you:
- Quick (2-3 minutes) ⚡
- Normal (5-7 minutes) ✨
- Thorough (10+ minutes) 🌟`;

  updatedState.conversationHistory.push({
    role: 'assistant',
    content: message,
    timestamp: new Date()
  });

  return { message, state: updatedState };
}

/**
 * Generate routine suggestions based on AI
 */
export async function generateRoutineSuggestions(
  state: GuidedRoutineState,
  availableTime: number,
  childProfile: ChildProfile
): Promise<{ message: string; steps: SuggestedStep[]; state: GuidedRoutineState }> {
  
  const systemPrompt = `You are a friendly skincare assistant helping kids (ages 8-14) build a simple, safe skincare routine. 
You suggest age-appropriate steps based on their goals and concerns.

Guidelines:
- Keep it simple - no more than 3-4 steps
- Use gentle, kid-friendly products
- Explain WHY each step matters in simple terms
- Be encouraging and positive
- Focus on basics: cleanse, moisturize, protect
- Only suggest treatments if they mentioned specific concerns
- Match the time constraint they selected`;

  const userPrompt = `Create a ${state.segment} skincare routine for a child (age band: ${childProfile.age_band || '8-10'}) with ${childProfile.skin_type || 'normal'} skin.

Goals: ${state.goals.join(', ')}
Concerns: ${state.concerns.length > 0 ? state.concerns.join(', ') : 'None'}
Available time: ${availableTime} minutes
Segment: ${state.segment}

Child age band: ${childProfile.age_band || '8-10'}

Suggest 2-4 steps with:
1. Step type (cleanser, moisturizer, sunscreen, serum, or treatment)
2. Simple title
3. Duration in seconds
4. 3-5 easy instructions
5. One helpful tip
6. Brief reasoning why this step helps their goals

Return as JSON array of steps.`;

  try {
    const data = await callOpenAI(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      {
        model: 'gpt-4o-mini',
        temperature: 0.7,
        response_format: { type: 'json_object' },
      }
    );

    console.log('AI Response:', data.choices[0]?.message?.content);
    const response = JSON.parse(data.choices[0]?.message?.content || '{}');
    console.log('Parsed response:', response);
    
    // Handle different response formats
    let steps: SuggestedStep[] = [];
    if (response.steps) {
      steps = response.steps;
    } else if (response.skincareRoutine) {
      // AI might return in a different structure
      steps = response.skincareRoutine;
    } else if (Array.isArray(response)) {
      steps = response;
    }
    
    console.log('Steps extracted:', steps);

    if (steps.length === 0) {
      throw new Error('AI returned no steps. Response: ' + JSON.stringify(response));
    }
    
    // Normalize step structure and map step types to our standard types
    const normalizeStepType = (type: string): 'cleanser' | 'moisturizer' | 'sunscreen' | 'treatment' | 'serum' => {
      const normalized = type.toLowerCase();
      if (normalized.includes('clean')) return 'cleanser';
      if (normalized.includes('moistur') || normalized.includes('hydrat')) return 'moisturizer';
      if (normalized.includes('sun') || normalized.includes('spf')) return 'sunscreen';
      if (normalized.includes('serum')) return 'serum';
      return 'treatment'; // Default fallback
    };
    
    steps = steps.map((step: any) => ({
      type: normalizeStepType(step.stepType || step.type || 'treatment'),
      title: step.title,
      duration: step.duration,
      instructions: Array.isArray(step.instructions) ? step.instructions : [step.instructions || ''],
      tips: step.tip || step.tips || '',
      reasoning: step.reasoning || ''
    }));

    const updatedState = {
      ...state,
      availableTime,
      suggestedSteps: steps,
      currentStep: 'review' as const,
      conversationHistory: [
        ...state.conversationHistory,
        {
          role: 'user' as const,
          content: `Selected ${availableTime} minutes`,
          timestamp: new Date()
        }
      ]
    };

    const totalTime = steps.reduce((sum, step) => sum + step.duration, 0);
    const message = `Perfect! ✨ Based on what you told me, here's your personalized ${state.segment} routine (${Math.ceil(totalTime / 60)} minutes):

${steps.map((step, i) => `**${i + 1}. ${step.title}** (${step.duration}s)
${step.reasoning}`).join('\n\n')}

You can tap any step to see the full instructions, or hit "Start Building" to customize it! 🎨`;

    updatedState.conversationHistory.push({
      role: 'assistant',
      content: message,
      timestamp: new Date()
    });

    return { message, steps, state: updatedState };
  } catch (error) {
    console.error('Error generating routine:', error);
    throw new Error('Failed to generate routine suggestions');
  }
}

/**
 * Ask follow-up question or provide guidance
 */
export async function askFollowUp(
  state: GuidedRoutineState,
  userMessage: string,
  childProfile: ChildProfile
): Promise<{ message: string; state: GuidedRoutineState }> {
  
  const systemPrompt = `You are a friendly, encouraging skincare assistant helping kids build routines.
Keep responses short (2-3 sentences), positive, and age-appropriate.
Use emojis sparingly but effectively.
If they ask about products, remind them to check with a parent.
If unsure, suggest they talk to a parent or dermatologist.`;

  const conversationContext = state.conversationHistory
    .slice(-6) // Last 3 exchanges
    .map(msg => `${msg.role}: ${msg.content}`)
    .join('\n');

  try {
    const data = await callOpenAI(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Context:\n${conversationContext}\n\nUser: ${userMessage}` }
      ],
      {
        model: 'gpt-4o-mini',
        temperature: 0.8,
        max_tokens: 150,
      }
    );

    const response = data.choices[0]?.message?.content || "I'm not sure about that. Let's keep building your routine! 🌟";

    const updatedState = {
      ...state,
      conversationHistory: [
        ...state.conversationHistory,
        {
          role: 'user' as const,
          content: userMessage,
          timestamp: new Date()
        },
        {
          role: 'assistant' as const,
          content: response,
          timestamp: new Date()
        }
      ]
    };

    return { message: response, state: updatedState };
  } catch (error) {
    console.error('Error in follow-up:', error);
    return {
      message: "Hmm, I'm having trouble right now. But let's keep going! 💪",
      state
    };
  }
}

/**
 * Explain why a specific step was suggested
 */
export async function explainStep(
  step: SuggestedStep,
  childProfile: ChildProfile
): Promise<string> {
  const systemPrompt = `You are explaining a skincare step to a kid (ages 8-14) in a fun, simple way.
Keep it to 2-3 sentences. Use an analogy or comparison they'd understand.
Be encouraging and make it sound easy!`;

  try {
    const data = await callOpenAI(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Explain why "${step.title}" is important for their skin. Their age band: ${childProfile.age_band || '8-10'}` }
      ],
      {
        model: 'gpt-4o-mini',
        temperature: 0.8,
        max_tokens: 100,
      }
    );

    return data.choices[0]?.message?.content || step.reasoning;
  } catch (error) {
    return step.reasoning;
  }
}

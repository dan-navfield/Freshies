/**
 * Daily Tip API
 * GET /api/learn/daily-tip - Get today's tip (or generate if missing)
 * POST /api/learn/daily-tip - Manually generate a new tip
 */

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Check for required environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl, supabaseKey);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.EXPO_PUBLIC_OPENAI_API_KEY,
});

const CATEGORIES = ['sunscreen', 'hydration', 'cleansing', 'moisturizing', 'hygiene', 'sleep', 'nutrition'];

/**
 * Generate a kid-friendly skincare tip using AI
 */
async function generateTipWithAI(category?: string): Promise<{ title: string; content: string; category: string }> {
  const selectedCategory = category || CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
  
  const prompt = `Generate a fun, kid-friendly skincare tip for children ages 8-12 about ${selectedCategory}.

Requirements:
- Title should be short, catchy, and actionable (max 6 words)
- Content should be 1-2 sentences explaining why it matters
- Use simple, encouraging language
- Make it relatable to kids' daily lives
- Keep it positive and empowering

Return ONLY a JSON object with this exact format:
{
  "title": "Your catchy title here!",
  "content": "Your explanation here."
}`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: 'You are a friendly skincare educator for children. You make skincare fun and easy to understand.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.8,
    max_tokens: 200,
    response_format: { type: 'json_object' },
  });

  const result = JSON.parse(completion.choices[0].message.content || '{}');
  
  return {
    title: result.title || 'Take care of your skin!',
    content: result.content || 'Your skin is amazing - treat it well!',
    category: selectedCategory,
  };
}

/**
 * GET - Fetch today's tip (generate if missing)
 */
export async function GET() {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Check if we already have a tip for today
    const { data: existingTip, error: fetchError } = await supabase
      .from('daily_tips')
      .select('*')
      .eq('tip_date', today)
      .eq('is_active', true)
      .single();

    if (existingTip && !fetchError) {
      return Response.json({
        tip: existingTip,
        generated: false,
      });
    }

    // No tip for today - generate one
    const { title, content, category } = await generateTipWithAI();

    const { data: newTip, error: insertError } = await supabase
      .from('daily_tips')
      .insert({
        tip_date: today,
        title,
        content,
        category,
        age_group: 'Ages 8-12',
        generated_by: 'ai',
        is_active: true,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return Response.json({
      tip: newTip,
      generated: true,
    });

  } catch (error) {
    console.error('Error fetching/generating daily tip:', error);
    
    // Fallback to most recent tip
    const { data: fallbackTip } = await supabase
      .from('daily_tips')
      .select('*')
      .eq('is_active', true)
      .order('tip_date', { ascending: false })
      .limit(1)
      .single();

    if (fallbackTip) {
      return Response.json({
        tip: fallbackTip,
        generated: false,
        fallback: true,
      });
    }

    return Response.json(
      { error: 'Failed to get daily tip' },
      { status: 500 }
    );
  }
}

/**
 * POST - Manually generate a new tip for a specific date
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { date, category } = body;

    const tipDate = date || new Date().toISOString().split('T')[0];

    // Generate tip
    const { title, content, category: selectedCategory } = await generateTipWithAI(category);

    // Insert or update
    const { data: tip, error } = await supabase
      .from('daily_tips')
      .upsert({
        tip_date: tipDate,
        title,
        content,
        category: selectedCategory,
        age_group: 'Ages 8-12',
        generated_by: 'ai',
        is_active: true,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'tip_date',
      })
      .select()
      .single();

    if (error) throw error;

    return Response.json({
      tip,
      generated: true,
    });

  } catch (error) {
    console.error('Error generating tip:', error);
    return Response.json(
      { error: 'Failed to generate tip' },
      { status: 500 }
    );
  }
}

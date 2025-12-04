// Supabase Edge Function: Generate Daily Tip
// This function runs daily to generate a new AI tip

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const CATEGORIES = ['sunscreen', 'hydration', 'cleansing', 'moisturizing', 'hygiene', 'sleep', 'nutrition']

interface DailyTip {
  title: string
  content: string
}

async function generateTipWithAI(category: string): Promise<DailyTip> {
  const prompt = `Generate a fun, kid-friendly skincare tip for children ages 8-12 about ${category}.

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
}`

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
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
    }),
  })

  const data = await response.json()
  const result = JSON.parse(data.choices[0].message.content)

  return {
    title: result.title || 'Take care of your skin!',
    content: result.content || 'Your skin is amazing - treat it well!',
  }
}

serve(async (req) => {
  try {
    // Verify this is a cron job or authorized request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.includes(Deno.env.get('CRON_SECRET') || 'secret')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)
    const today = new Date().toISOString().split('T')[0]

    // Check if we already have a tip for today
    const { data: existingTip } = await supabase
      .from('daily_tips')
      .select('id')
      .eq('tip_date', today)
      .single()

    if (existingTip) {
      return new Response(
        JSON.stringify({ 
          message: 'Tip already exists for today',
          tip_id: existingTip.id 
        }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Select a random category
    const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)]

    // Generate tip with AI
    console.log(`Generating tip for category: ${category}`)
    const { title, content } = await generateTipWithAI(category)

    // Insert into database
    const { data: newTip, error } = await supabase
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
      .single()

    if (error) throw error

    console.log(`✅ Generated new tip: ${title}`)

    return new Response(
      JSON.stringify({
        success: true,
        tip: newTip,
        message: `Generated new ${category} tip for ${today}`,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error generating daily tip:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
})

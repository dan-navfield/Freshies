/**
 * Seed AI Prompts Script
 * Migrates current hard-coded AI meta prompt to database
 * Run once after database migration
 */

import { createClient } from '@supabase/supabase-js';
import FRESHIES_AI_META_PROMPT from '../src/services/ai/metaPrompt';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const AI_TOOLS = [
  'coach_parent',
  'assess_routine',
  'propose_routine',
  'analyse_ingredients',
  'summarise_risk',
  'route_question',
];

async function seedAIPrompts() {
  console.log('🌱 Seeding AI prompts to database...\n');

  for (const tool of AI_TOOLS) {
    console.log(`📝 Seeding prompt for: ${tool}`);

    try {
      // Check if prompt already exists
      const { data: existing } = await supabase
        .from('ai_prompt_templates')
        .select('id')
        .eq('tool_name', tool)
        .eq('role', 'system')
        .eq('is_active', true)
        .single();

      if (existing) {
        console.log(`   ⏭️  Prompt already exists for ${tool}, skipping`);
        continue;
      }

      // Insert new prompt
      const { error } = await supabase
        .from('ai_prompt_templates')
        .insert({
          tool_name: tool,
          role: 'system',
          content: FRESHIES_AI_META_PROMPT,
          model_preferences: {
            provider: 'openai',
            model: 'gpt-4-turbo-preview',
          },
          version: 1,
          is_active: true,
        });

      if (error) {
        console.error(`   ❌ Failed to seed ${tool}:`, error.message);
      } else {
        console.log(`   ✅ Successfully seeded ${tool}`);
      }
    } catch (error: any) {
      console.error(`   ❌ Error seeding ${tool}:`, error.message);
    }
  }

  console.log('\n✨ AI prompts seeding complete!');
}

// Run the seed function
seedAIPrompts()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

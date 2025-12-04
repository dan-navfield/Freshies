import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTemplates() {
  console.log('Checking routine_step_templates table...\n');

  const { data, error } = await supabase
    .from('routine_step_templates')
    .select('id, type, title, slug, is_active, generated_by_ai')
    .order('recommended_order');

  if (error) {
    console.error('Error:', error);
    return;
  }

  if (!data || data.length === 0) {
    console.log('✅ Table exists but no templates found yet.');
    console.log('This is expected if the INSERT statements haven\'t run.');
    return;
  }

  console.log(`✅ Found ${data.length} templates:\n`);
  data.forEach((template, index) => {
    console.log(`${index + 1}. ${template.title}`);
    console.log(`   Type: ${template.type}`);
    console.log(`   Slug: ${template.slug}`);
    console.log(`   Active: ${template.is_active}`);
    console.log(`   AI Generated: ${template.generated_by_ai}`);
    console.log('');
  });
}

checkTemplates();

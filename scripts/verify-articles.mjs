/**
 * Verify published articles in database
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing environment variables!');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

console.log('\n📊 Checking published articles...\n');

const { data: articles, error } = await supabase
  .from('learn_articles')
  .select('id, title, topic, status, published_at, created_at')
  .eq('status', 'published')
  .order('created_at', { ascending: false });

if (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}

console.log(`✅ Found ${articles.length} published articles:\n`);

articles.forEach((article, index) => {
  console.log(`${index + 1}. ${article.title}`);
  console.log(`   ID: ${article.id}`);
  console.log(`   Topic: ${article.topic}`);
  console.log(`   Published: ${new Date(article.published_at || article.created_at).toLocaleString()}`);
  console.log('');
});

console.log('✅ Articles are in the database and ready to view!\n');

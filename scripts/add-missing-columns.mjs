/**
 * Add missing columns to learn_articles table
 * Run with: node scripts/add-missing-columns.mjs
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing environment variables!');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false }
});

console.log('\n🔧 Adding missing columns to learn_articles table...\n');

const sql = `
-- Add source_type column
ALTER TABLE learn_articles
ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'ai_generated' CHECK (source_type IN ('human_written', 'ai_generated', 'mixed'));

-- Add source_refs column
ALTER TABLE learn_articles
ADD COLUMN IF NOT EXISTS source_refs TEXT[] DEFAULT '{}';

-- Add version column
ALTER TABLE learn_articles
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- Add published_at column
ALTER TABLE learn_articles
ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_learn_articles_source_type ON learn_articles(source_type);
CREATE INDEX IF NOT EXISTS idx_learn_articles_version ON learn_articles(version DESC);
`;

try {
  const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
  
  if (error) {
    // Try direct approach
    console.log('Trying direct SQL execution...');
    const queries = sql.split(';').filter(q => q.trim());
    
    for (const query of queries) {
      if (query.trim()) {
        const { error: queryError } = await supabase.rpc('exec_sql', { sql_query: query });
        if (queryError) {
          console.error(`❌ Error executing query: ${queryError.message}`);
        } else {
          console.log(`✅ Executed: ${query.substring(0, 50)}...`);
        }
      }
    }
  } else {
    console.log('✅ All columns added successfully!');
  }
  
  // Verify columns exist
  console.log('\n🔍 Verifying columns...');
  const { data, error: verifyError } = await supabase
    .from('learn_articles')
    .select('*')
    .limit(0);
  
  if (verifyError) {
    console.error('❌ Verification failed:', verifyError.message);
  } else {
    console.log('✅ Table structure verified!');
  }
  
  console.log('\n✅ Migration complete!\n');
  process.exit(0);
  
} catch (error) {
  console.error('\n❌ Migration failed:', error.message);
  console.error('\nPlease run this SQL manually in Supabase SQL Editor:');
  console.log('\n' + sql + '\n');
  process.exit(1);
}

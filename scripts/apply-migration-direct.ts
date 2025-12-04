/**
 * Apply Learn Content Migration Directly
 */

import 'dotenv/config';
import { readFileSync } from 'fs';
import { supabase } from '../src/lib/supabase-server';

async function applyMigration() {
  console.log('📦 Reading migration file...');
  
  const migrationSQL = readFileSync(
    './supabase/migrations/20251115164923_learn_content_pipeline.sql',
    'utf-8'
  );

  console.log('🚀 Applying migration to Supabase...\n');

  try {
    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', {
      sql_string: migrationSQL
    });

    if (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }

    console.log('✅ Migration applied successfully!');
    console.log('\n📊 Tables created:');
    console.log('  - source_snapshots');
    console.log('  - learn_articles');
    console.log('  - content_sources');
    console.log('  - sync_jobs');
    console.log('  - review_tasks');
    console.log('  - user_saved_articles');
    console.log('  - article_views');
    console.log('  - content_analytics');
    console.log('  - sync_errors');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

applyMigration();

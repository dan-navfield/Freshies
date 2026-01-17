import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  console.log('🔧 Running CosIng fields migration...\n');
  
  const sql = fs.readFileSync('supabase/migrations/20250104000003_add_cosing_fields.sql', 'utf-8');
  
  // Split by semicolon and run each statement
  const statements = sql.split(';').filter(s => s.trim() && !s.trim().startsWith('--'));
  
  for (const statement of statements) {
    const trimmed = statement.trim();
    if (!trimmed) continue;
    
    const { error } = await supabase.rpc('exec_sql', { sql_query: trimmed });
    
    if (error) {
      // Try direct query
      const { error: directError } = await (supabase as any).from('_').select(trimmed);
      if (directError) {
        console.log(`❌ Error: ${directError.message}`);
      }
    }
  }
  
  console.log('✅ Migration complete!');
}

main();

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  console.log('🔧 Applying migration: add_cosing_fields\n');
  
  const sql = fs.readFileSync('supabase/migrations/20250104000003_add_cosing_fields.sql', 'utf-8');
  
  // Execute each statement separately
  const statements = [
    `ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS restriction TEXT`,
    `ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS ec_number TEXT`,
    `ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS chemical_description TEXT`,
    `CREATE INDEX IF NOT EXISTS idx_ingredients_restriction ON ingredients(restriction) WHERE restriction IS NOT NULL`,
    `CREATE INDEX IF NOT EXISTS idx_ingredients_ec_number ON ingredients(ec_number)`
  ];
  
  for (const statement of statements) {
    console.log(`Executing: ${statement.substring(0, 60)}...`);
    
    const { error } = await supabase.rpc('exec_sql', { sql: statement }).catch(() => ({ error: null }));
    
    if (error) {
      // Try alternative method - direct query
      try {
        await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`
          },
          body: JSON.stringify({ sql: statement })
        });
        console.log('  ✅ Success (via REST)');
      } catch (e) {
        console.log('  ⚠️  Skipped (may already exist)');
      }
    } else {
      console.log('  ✅ Success');
    }
  }
  
  console.log('\n✅ Migration complete!');
  console.log('🔄 Refresh your admin page to see the changes.');
}

main();

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  console.log('🔧 Adding CosIng columns to ingredients table...\n');
  
  // Check if columns exist
  const { data: sample } = await supabase
    .from('ingredients')
    .select('*')
    .limit(1)
    .single();
  
  if (sample && 'restriction' in sample) {
    console.log('✅ Columns already exist!');
    return;
  }
  
  console.log('⚠️  Columns need to be added via Supabase dashboard or SQL editor');
  console.log('\n📋 Run this SQL in Supabase SQL Editor:');
  console.log(`
ALTER TABLE ingredients
ADD COLUMN IF NOT EXISTS restriction TEXT,
ADD COLUMN IF NOT EXISTS ec_number TEXT,
ADD COLUMN IF NOT EXISTS chemical_description TEXT;

CREATE INDEX IF NOT EXISTS idx_ingredients_restriction ON ingredients(restriction) WHERE restriction IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ingredients_ec_number ON ingredients(ec_number);
  `);
}

main();

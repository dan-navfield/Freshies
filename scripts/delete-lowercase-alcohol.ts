import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const { error } = await supabase
    .from('ingredients')
    .delete()
    .eq('inci_name', 'alcohol denat');
  
  if (error) {
    console.log('❌ Error:', error.message);
  } else {
    console.log('✅ Deleted "alcohol denat" (lowercase)');
    console.log('✅ Kept "Alcohol Denat." (proper capitalization)');
  }
}

main();

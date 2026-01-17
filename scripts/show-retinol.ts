import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const { data } = await supabase
    .from('ingredients')
    .select('*')
    .eq('inci_name', 'Retinol')
    .single();
  
  console.log('Retinol data:');
  console.log(JSON.stringify(data, null, 2));
}

main();

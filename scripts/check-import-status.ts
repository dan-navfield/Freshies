import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  // Count total ingredients
  const { count: total } = await supabase
    .from('ingredients')
    .select('*', { count: 'exact', head: true });
  
  console.log(`📊 Total ingredients: ${total}`);
  
  // Check for retinol
  const { data: retinol } = await supabase
    .from('ingredients')
    .select('*')
    .ilike('inci_name', '%retinol%');
  
  console.log(`\n🔍 Retinol search results: ${retinol?.length || 0}`);
  if (retinol && retinol.length > 0) {
    retinol.forEach(r => console.log(`   - ${r.inci_name}`));
  }
  
  // Show last 5 imported
  const { data: recent } = await supabase
    .from('ingredients')
    .select('inci_name, created_at')
    .order('created_at', { ascending: false })
    .limit(5);
  
  console.log(`\n📅 Last 5 imported:`);
  recent?.forEach(r => console.log(`   - ${r.inci_name} (${new Date(r.created_at).toLocaleTimeString()})`));
}

main();

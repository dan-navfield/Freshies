import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  // Check ingredients with ISI scores
  const { data: withScores } = await supabase
    .from('ingredients')
    .select('inci_name, isi_score')
    .not('isi_score', 'is', null)
    .limit(10);
  
  console.log('\n✅ Ingredients WITH ISI scores:');
  console.log(withScores);
  
  // Check ingredients without ISI scores
  const { data: withoutScores } = await supabase
    .from('ingredients')
    .select('inci_name, isi_score')
    .is('isi_score', null)
    .limit(10);
  
  console.log('\n❌ Ingredients WITHOUT ISI scores:');
  console.log(withoutScores);
  
  // Check product ingredients
  const { data: productIngs } = await supabase
    .from('product_ingredients')
    .select(`
      product_id,
      ingredient:ingredients(inci_name, isi_score)
    `)
    .limit(5);
  
  console.log('\n📦 Product Ingredients:');
  console.log(JSON.stringify(productIngs, null, 2));
}

main();

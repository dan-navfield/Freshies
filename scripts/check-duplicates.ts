/**
 * Check for all duplicate ingredients
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  // Get all ingredients
  const { data: ingredients } = await supabase
    .from('ingredients')
    .select('id, inci_name')
    .order('inci_name');
  
  if (!ingredients) return;
  
  console.log('\n📋 All ingredients:\n');
  
  // Group by normalized name (lowercase, no punctuation)
  const groups = new Map<string, any[]>();
  
  for (const ing of ingredients) {
    const normalized = ing.inci_name.toLowerCase().replace(/[.\s]/g, '');
    if (!groups.has(normalized)) {
      groups.set(normalized, []);
    }
    groups.get(normalized)!.push(ing);
  }
  
  // Show duplicates
  console.log('🔍 Duplicate groups:\n');
  for (const [norm, items] of groups.entries()) {
    if (items.length > 1) {
      console.log(`Group: ${norm}`);
      for (const item of items) {
        const { count } = await supabase
          .from('product_ingredients')
          .select('*', { count: 'exact', head: true })
          .eq('ingredient_id', item.id);
        
        console.log(`  - "${item.inci_name}" (${item.id.slice(0, 8)}...) - used in ${count || 0} products`);
      }
      console.log('');
    }
  }
}

main();

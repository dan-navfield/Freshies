/**
 * Remove lowercase duplicate ingredients
 * Keep only the capitalized versions that are linked to products
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  console.log('🔍 Finding duplicate ingredients...\n');
  
  // Get all ingredients
  const { data: ingredients } = await supabase
    .from('ingredients')
    .select('id, inci_name')
    .order('inci_name');
  
  if (!ingredients) {
    console.log('No ingredients found');
    return;
  }
  
  // Find duplicates (case-insensitive)
  const seen = new Map<string, any[]>();
  
  for (const ing of ingredients) {
    const lower = ing.inci_name.toLowerCase();
    if (!seen.has(lower)) {
      seen.set(lower, []);
    }
    seen.get(lower)!.push(ing);
  }
  
  // Process duplicates
  let deleted = 0;
  
  for (const [lowerName, dupes] of seen.entries()) {
    if (dupes.length > 1) {
      console.log(`\n📋 Found ${dupes.length} versions of "${lowerName}":`);
      dupes.forEach(d => console.log(`   - "${d.inci_name}" (${d.id.slice(0, 8)}...)`));
      
      // Check which ones are used in products
      const usageCounts = await Promise.all(
        dupes.map(async (d) => {
          const { count } = await supabase
            .from('product_ingredients')
            .select('*', { count: 'exact', head: true })
            .eq('ingredient_id', d.id);
          return { ...d, usage: count || 0 };
        })
      );
      
      // Sort by: 1) usage count, 2) capitalization (prefer capitalized)
      usageCounts.sort((a, b) => {
        if (a.usage !== b.usage) return b.usage - a.usage;
        // Prefer capitalized (has uppercase letter)
        const aHasUpper = /[A-Z]/.test(a.inci_name);
        const bHasUpper = /[A-Z]/.test(b.inci_name);
        if (aHasUpper && !bHasUpper) return -1;
        if (!aHasUpper && bHasUpper) return 1;
        return 0;
      });
      
      const keep = usageCounts[0];
      const toDelete = usageCounts.slice(1);
      
      console.log(`   ✅ Keeping: "${keep.inci_name}" (used in ${keep.usage} products)`);
      
      for (const del of toDelete) {
        if (del.usage > 0) {
          console.log(`   ⚠️  Skipping "${del.inci_name}" - still used in ${del.usage} products`);
        } else {
          const { error } = await supabase
            .from('ingredients')
            .delete()
            .eq('id', del.id);
          
          if (error) {
            console.log(`   ❌ Error deleting "${del.inci_name}": ${error.message}`);
          } else {
            console.log(`   🗑️  Deleted: "${del.inci_name}"`);
            deleted++;
          }
        }
      }
    }
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`✅ Deleted ${deleted} duplicate ingredients`);
  console.log(`📊 Kept the capitalized versions that are in use`);
}

main();

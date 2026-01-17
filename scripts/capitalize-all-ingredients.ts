/**
 * Capitalize the first letter of all ingredient names
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function capitalizeFirstLetter(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

async function main() {
  console.log('🔤 Capitalizing all ingredient names...\n');
  
  // Get all ingredients
  const { data: ingredients } = await supabase
    .from('ingredients')
    .select('id, inci_name');
  
  if (!ingredients) {
    console.log('No ingredients found');
    return;
  }
  
  let updated = 0;
  let skipped = 0;
  
  for (const ing of ingredients) {
    const capitalized = capitalizeFirstLetter(ing.inci_name);
    
    if (capitalized !== ing.inci_name) {
      // Check if capitalized version already exists
      const { data: existing } = await supabase
        .from('ingredients')
        .select('id')
        .eq('inci_name', capitalized)
        .single();
      
      if (existing) {
        console.log(`⚠️  "${ing.inci_name}" → "${capitalized}" already exists, deleting lowercase version`);
        
        // Check if lowercase version is used
        const { count } = await supabase
          .from('product_ingredients')
          .select('*', { count: 'exact', head: true })
          .eq('ingredient_id', ing.id);
        
        if (count && count > 0) {
          console.log(`   ⚠️  Cannot delete - used in ${count} products. Manual merge needed.`);
          skipped++;
        } else {
          // Delete the lowercase version
          await supabase
            .from('ingredients')
            .delete()
            .eq('id', ing.id);
          console.log(`   🗑️  Deleted lowercase version`);
          updated++;
        }
      } else {
        // Update to capitalized
        const { error } = await supabase
          .from('ingredients')
          .update({ inci_name: capitalized })
          .eq('id', ing.id);
        
        if (error) {
          console.log(`❌ Error updating "${ing.inci_name}": ${error.message}`);
        } else {
          console.log(`✅ "${ing.inci_name}" → "${capitalized}"`);
          updated++;
        }
      }
    }
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`✅ Updated/cleaned: ${updated}`);
  console.log(`⚠️  Skipped (needs manual merge): ${skipped}`);
}

main();

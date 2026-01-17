/**
 * Update existing ingredients with ISI scores
 * Maps the old capitalized ingredients to the new lowercase ones with scores
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Manual mapping of common ingredients to ISI scores
const INGREDIENT_ISI_MAP: Record<string, number> = {
  // Safe moisturizers (ISI 90-95)
  'hyaluronic acid': 95,
  'glycerin': 95,
  'ceramides': 95,
  'ceramide': 95,
  'ceramide np': 95,
  'squalane': 95,
  'panthenol': 95,
  'niacinamide': 95,
  'allantoin': 95,
  'butylene glycol': 90,
  'propanediol': 92,
  
  // Emulsifiers (ISI 85-88)
  'cetyl alcohol': 88,
  'cetearyl alcohol': 88,
  'stearyl alcohol': 88,
  
  // Preservatives (ISI 80-85)
  'phenoxyethanol': 80,
  'ethylhexylglycerin': 85,
  'caprylyl glycol': 85,
  
  // Sunscreen (ISI 95)
  'zinc oxide': 95,
  'titanium dioxide': 95,
  
  // Silicones (ISI 82-85)
  'dimethicone': 85,
  'cyclopentasiloxane': 82,
  
  // Thickeners (ISI 90-95)
  'xanthan gum': 95,
  'carbomer': 90,
  
  // Caution ingredients (ISI 40-60)
  'fragrance': 60,
  'parfum': 60,
  'alcohol denat': 60,
  'alcohol denat.': 60,
  'sodium lauryl sulfate': 60,
  'sodium laureth sulfate': 60,
  'limonene': 60,
  'salicylic acid': 40,
  'benzoyl peroxide': 40,
  
  // Avoid for kids (ISI 10-20)
  'retinol': 10,
  'retinyl palmitate': 20,
  'hydroquinone': 10,
};

async function main() {
  console.log('🔄 Updating existing ingredients with ISI scores...\n');
  
  // Get all ingredients without ISI scores
  const { data: ingredients } = await supabase
    .from('ingredients')
    .select('id, inci_name, isi_score')
    .is('isi_score', null);
  
  if (!ingredients || ingredients.length === 0) {
    console.log('✅ All ingredients already have ISI scores!');
    return;
  }
  
  console.log(`Found ${ingredients.length} ingredients without ISI scores\n`);
  
  let updated = 0;
  let notFound = 0;
  
  for (const ing of ingredients) {
    const nameLower = ing.inci_name.toLowerCase();
    const isiScore = INGREDIENT_ISI_MAP[nameLower];
    
    if (isiScore) {
      // Update with ISI score and basic flags
      const isAllergen = ['fragrance', 'parfum', 'limonene', 'sodium lauryl sulfate', 'sodium laureth sulfate'].includes(nameLower);
      const isFragrance = ['fragrance', 'parfum'].includes(nameLower);
      const isSensitiser = isiScore <= 60;
      const childSafe = isiScore >= 70;
      const irritationPotential = isiScore >= 80 ? 'low' : isiScore >= 60 ? 'medium' : 'high';
      
      const { error } = await supabase
        .from('ingredients')
        .update({
          isi_score: isiScore,
          allergen_flag: isAllergen,
          fragrance_flag: isFragrance,
          sensitiser_flag: isSensitiser,
          child_safe: childSafe,
          irritation_potential: irritationPotential,
          hormonal_concern_flag: nameLower.includes('retinol'),
          regulatory_flag: nameLower.includes('hydroquinone')
        })
        .eq('id', ing.id);
      
      if (error) {
        console.log(`❌ Error updating ${ing.inci_name}: ${error.message}`);
      } else {
        console.log(`✅ ${ing.inci_name} → ISI ${isiScore}`);
        updated++;
      }
    } else {
      console.log(`⚠️  ${ing.inci_name} - no mapping found (keeping null)`);
      notFound++;
    }
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`✅ Updated: ${updated}`);
  console.log(`⚠️  Not found: ${notFound}`);
  console.log(`📊 Total: ${ingredients.length}`);
}

main();

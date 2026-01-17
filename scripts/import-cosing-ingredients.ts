/**
 * Import ingredients from CosIng (EU Cosmetic Ingredient Database)
 * 
 * Data source: https://www.kaggle.com/datasets/amaboh/cosing-ingredients-inci-list
 * 
 * Instructions:
 * 1. Download the CSV from Kaggle
 * 2. Place it in the scripts folder as 'cosing-ingredients.csv'
 * 3. Run this script: npx tsx scripts/import-cosing-ingredients.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface CosingIngredient {
  inci_name: string;
  inn_name?: string;
  ph_eur_name?: string;
  cas_number?: string;
  ec_number?: string;
  chemical_description?: string;
  restriction?: string;
  function?: string;
  update_date?: string;
}

// Default ISI scores based on common ingredient types
function estimateISI(inciName: string, functionType?: string): number {
  const lower = inciName.toLowerCase();
  
  // Known safe ingredients
  if (lower.includes('hyaluronic') || lower.includes('glycerin') || 
      lower.includes('ceramide') || lower.includes('panthenol') ||
      lower.includes('niacinamide') || lower.includes('allantoin')) {
    return 95;
  }
  
  // Sunscreen ingredients
  if (lower.includes('zinc oxide') || lower.includes('titanium dioxide')) {
    return 95;
  }
  
  // Preservatives (generally safe in low concentrations)
  if (lower.includes('phenoxyethanol') || lower.includes('benzoate') ||
      functionType?.toLowerCase().includes('preservative')) {
    return 80;
  }
  
  // Fragrances and allergens
  if (lower.includes('fragrance') || lower.includes('parfum') || 
      lower.includes('perfume')) {
    return 60;
  }
  
  // Alcohols (check if fatty alcohol or drying alcohol)
  if (lower.includes('alcohol')) {
    if (lower.includes('cetyl') || lower.includes('stearyl') || 
        lower.includes('cetearyl') || lower.includes('behenyl')) {
      return 88; // Fatty alcohols are good
    }
    if (lower.includes('denat') || lower.includes('sd alcohol')) {
      return 60; // Drying alcohols
    }
  }
  
  // Retinoids (not for kids)
  if (lower.includes('retinol') || lower.includes('retinoid') || 
      lower.includes('tretinoin')) {
    return 10;
  }
  
  // Acids (use with caution)
  if (lower.includes('salicylic') || lower.includes('glycolic') || 
      lower.includes('lactic acid')) {
    return 40;
  }
  
  // Default for unknown ingredients
  return 70;
}

function parseCSV(filePath: string): CosingIngredient[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  const ingredients: CosingIngredient[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    
    // Simple CSV parsing (handles basic cases)
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
    
    // CosIng CSV format:
    // 0: COSING Ref No, 1: INCI name, 2: INN name, 3: Ph. Eur. Name
    // 4: CAS No, 5: EC No, 6: Chem/IUPAC Name / Description
    // 7: Restriction, 8: Function, 9: Update Date
    const ingredient: CosingIngredient = {
      inci_name: values[1] || '', // INCI name is column 1
      inn_name: values[2] || undefined,
      ph_eur_name: values[3] || undefined,
      cas_number: values[4] || undefined,
      ec_number: values[5] || undefined,
      chemical_description: values[6] || undefined,
      restriction: values[7] || undefined,
      function: values[8] || undefined,
      update_date: values[9] || undefined
    };
    
    if (ingredient.inci_name) {
      ingredients.push(ingredient);
    }
  }
  
  return ingredients;
}

async function importIngredients(ingredients: CosingIngredient[], limit?: number) {
  console.log(`📦 Importing ${limit || ingredients.length} ingredients from CosIng...\n`);
  
  let imported = 0;
  let skipped = 0;
  let errors = 0;
  
  const toImport = limit ? ingredients.slice(0, limit) : ingredients;
  
  for (const ing of toImport) {
    // Check if already exists
    const { data: existing } = await supabase
      .from('ingredients')
      .select('id')
      .eq('inci_name', ing.inci_name)
      .single();
    
    if (existing) {
      skipped++;
      continue;
    }
    
    // Estimate ISI score
    const isiScore = estimateISI(ing.inci_name, ing.function);
    
    // Determine flags based on ISI and name
    const allergenFlag = ing.inci_name.toLowerCase().includes('fragrance') ||
                        ing.inci_name.toLowerCase().includes('parfum') ||
                        ing.inci_name.toLowerCase().includes('sulfate');
    
    const fragranceFlag = ing.inci_name.toLowerCase().includes('fragrance') ||
                         ing.inci_name.toLowerCase().includes('parfum');
    
    const sensitiserFlag = isiScore < 70;
    const childSafe = isiScore >= 70;
    const irritationPotential = isiScore >= 80 ? 'low' : isiScore >= 60 ? 'medium' : 'high';
    
    // Check if ingredient has restrictions (important for safety)
    const hasRestriction = ing.restriction && ing.restriction.trim().length > 0;
    
    // Insert ingredient
    const { error } = await supabase
      .from('ingredients')
      .insert({
        inci_name: ing.inci_name,
        family: ing.function,
        cas_number: ing.cas_number,
        ec_number: ing.ec_number,
        chemical_description: ing.chemical_description,
        restriction: ing.restriction,
        isi_score: isiScore,
        allergen_flag: allergenFlag,
        fragrance_flag: fragranceFlag,
        sensitiser_flag: sensitiserFlag,
        child_safe: childSafe,
        irritation_potential: irritationPotential,
        hormonal_concern_flag: ing.inci_name.toLowerCase().includes('retinol'),
        regulatory_flag: hasRestriction // Flag if there are restrictions
      });
    
    if (error) {
      console.log(`❌ Error importing ${ing.inci_name}: ${error.message}`);
      errors++;
    } else {
      if (imported % 100 === 0) {
        console.log(`✅ Imported ${imported} ingredients...`);
      }
      imported++;
    }
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`✅ Imported: ${imported}`);
  console.log(`⏭️  Skipped (already exists): ${skipped}`);
  console.log(`❌ Errors: ${errors}`);
  console.log(`📊 Total processed: ${toImport.length}`);
}

async function main() {
  const csvPath = path.join(__dirname, 'cosing-ingredients.csv');
  
  if (!fs.existsSync(csvPath)) {
    console.log('❌ CSV file not found!');
    console.log('\n📥 Please download the CosIng dataset:');
    console.log('   https://www.kaggle.com/datasets/amaboh/cosing-ingredients-inci-list');
    console.log('\n📁 Save it as: scripts/cosing-ingredients.csv');
    console.log('\n💡 Then run this script again.');
    return;
  }
  
  console.log('📖 Reading CSV file...');
  const ingredients = parseCSV(csvPath);
  console.log(`📋 Found ${ingredients.length} ingredients in CSV\n`);
  
  // Ask if they want to import all or just a sample
  console.log('⚠️  This will import a large number of ingredients.');
  console.log('💡 For testing, you can import just the first 100.\n');
  
  // Import first 1000 for now (you can adjust this)
  await importIngredients(ingredients, 1000);
}

main();

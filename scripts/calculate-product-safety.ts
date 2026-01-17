/**
 * Calculate Safety Scores for All Products
 * Run this script to calculate and save safety scores for all products in the database
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

// Create client (using anon key since RLS is disabled in dev)
const supabase = createClient(supabaseUrl, supabaseKey);

// =====================================================
// CALCULATION LOGIC (simplified for script)
// =====================================================

interface Ingredient {
  id: string;
  inci_name: string;
  isi_score: number;
  allergen_flag: boolean;
  fragrance_flag: boolean;
  sensitiser_flag: boolean;
  hormonal_concern_flag: boolean;
  regulatory_flag: boolean;
  irritation_potential?: string;
}

interface ProductIngredient {
  id: string;
  position: number;
  ingredient: Ingredient;
}

interface Product {
  id: string;
  name: string;
  category?: string;
  leave_on: boolean;
  product_ingredients: ProductIngredient[];
}

function calculateWeightedScore(productIngredients: ProductIngredient[]): number {
  let totalWeighted = 0;
  let totalWeight = 0;
  
  for (const pi of productIngredients) {
    const weight = pi.position <= 5 ? 1.0 : pi.position <= 10 ? 0.5 : pi.position <= 20 ? 0.25 : 0.1;
    totalWeighted += pi.ingredient.isi_score * weight;
    totalWeight += weight;
  }
  
  return totalWeight > 0 ? totalWeighted / totalWeight : 0;
}

function calculatePenalties(product: Product): number {
  let penalties = 0;
  
  for (const pi of product.product_ingredients) {
    const ing = pi.ingredient;
    
    // Hormonal concern
    if (ing.hormonal_concern_flag) penalties += 25;
    
    // Regulatory flag
    if (ing.regulatory_flag) penalties += 25;
    
    // High irritation in top 5
    if (ing.irritation_potential === 'high' && pi.position <= 5) penalties += 20;
    
    // Fragrance in top 10
    if (ing.fragrance_flag && pi.position <= 10) {
      penalties += product.leave_on ? 15 : 5;
    }
    
    // Sensitiser in top 10
    if (ing.sensitiser_flag && pi.position <= 10) penalties += 15;
  }
  
  // Multiple allergens
  const allergenCount = product.product_ingredients.filter(pi => pi.ingredient.allergen_flag).length;
  if (allergenCount >= 2) penalties += 10;
  
  return penalties;
}

function calculateAdjustments(product: Product): number {
  let adjustments = 0;
  
  // Rinse-off cleanser bonus
  if (product.category === 'cleanser' && !product.leave_on) {
    adjustments += 5;
  }
  
  return adjustments;
}

function determineTier(score: number): string {
  if (score >= 85) return 'A';
  if (score >= 70) return 'B';
  if (score >= 55) return 'C';
  if (score >= 40) return 'D';
  return 'E';
}

// =====================================================
// MAIN SCRIPT
// =====================================================

async function main() {
  console.log('🔍 Fetching products...\n');
  
  // Fetch all products with ingredients
  const { data: products, error } = await supabase
    .from('products')
    .select(`
      id,
      name,
      category,
      leave_on,
      product_ingredients(
        id,
        position,
        ingredient:ingredients(
          id,
          inci_name,
          isi_score,
          allergen_flag,
          fragrance_flag,
          sensitiser_flag,
          hormonal_concern_flag,
          regulatory_flag,
          irritation_potential
        )
      )
    `)
    .order('created_at', { ascending: true });
  
  if (error) {
    console.error('❌ Error fetching products:', error);
    return;
  }
  
  if (!products || products.length === 0) {
    console.log('⚠️  No products found');
    return;
  }
  
  console.log(`📦 Found ${products.length} products\n`);
  console.log('═'.repeat(80));
  
  let calculated = 0;
  let skipped = 0;
  
  for (const product of products as any[]) {
    console.log(`\n📊 ${product.name}`);
    console.log('─'.repeat(80));
    
    // Check if product has ingredients
    if (!product.product_ingredients || product.product_ingredients.length === 0) {
      console.log('⚠️  No ingredients - skipping');
      skipped++;
      continue;
    }
    
    console.log(`   Ingredients: ${product.product_ingredients.length}`);
    
    // Calculate scores
    const weightedScore = calculateWeightedScore(product.product_ingredients);
    const penalties = calculatePenalties(product);
    const adjustments = calculateAdjustments(product);
    const finalScore = Math.max(0, Math.min(100, Math.round(weightedScore - penalties + adjustments)));
    const tier = determineTier(finalScore);
    
    console.log(`   Weighted Score: ${Math.round(weightedScore)}`);
    console.log(`   Penalties: -${Math.round(penalties)}`);
    console.log(`   Adjustments: ${adjustments >= 0 ? '+' : ''}${Math.round(adjustments)}`);
    console.log(`   Final Score: ${finalScore}/100`);
    console.log(`   Tier: ${tier}`);
    
    // Save to database
    const { error: updateError } = await supabase
      .from('products')
      .update({
        safety_score_global: finalScore,
        safety_tier_global: tier,
        safety_last_calculated_at: new Date().toISOString()
      })
      .eq('id', product.id);
    
    if (updateError) {
      console.log(`   ❌ Error saving: ${updateError.message}`);
    } else {
      console.log(`   ✅ Saved to database`);
      calculated++;
      
      // Log activity
      await supabase
        .from('product_activity_history')
        .insert({
          product_id: product.id,
          action_type: 'safety_recalculated',
          action_details: {
            score: finalScore,
            tier: tier,
            weighted_score: Math.round(weightedScore),
            penalties: Math.round(penalties),
            adjustments: Math.round(adjustments)
          }
        });
    }
  }
  
  console.log('\n' + '═'.repeat(80));
  console.log(`\n✅ Complete!`);
  console.log(`   Calculated: ${calculated}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Total: ${products.length}\n`);
}

// Run the script
main().catch(console.error);

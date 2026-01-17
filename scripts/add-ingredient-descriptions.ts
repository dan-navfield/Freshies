/**
 * Add detailed kid-friendly descriptions to existing ingredients
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const INGREDIENT_DESCRIPTIONS: Record<string, { summary: string; details: string }> = {
  'hyaluronic acid': {
    summary: 'A super hydrating ingredient that holds 1000x its weight in water!',
    details: 'Imagine a tiny sponge that can hold a thousand times its weight in water - that\'s hyaluronic acid! It pulls moisture into your skin like a magnet and keeps it there, making your skin feel plump, soft, and bouncy. It\'s one of the gentlest and most effective moisturizers for all skin types, even super sensitive skin!'
  },
  'glycerin': {
    summary: 'One of the safest and most gentle moisturizers ever!',
    details: 'Glycerin is like a moisture superhero for your skin! It pulls water from the air and from deeper layers of your skin to keep the surface nice and hydrated. It\'s been used in skincare for over 100 years because it\'s so gentle and effective. Perfect for everyone, even babies!'
  },
  'ceramides': {
    summary: 'Helps build a strong protective barrier for your skin',
    details: 'Think of ceramides as the bricks that build your skin\'s protective wall! They fill in the gaps between skin cells to create a strong barrier that keeps moisture in and bad stuff out. They\'re especially great if your skin feels dry or sensitive, because they help repair and strengthen your skin\'s natural defenses.'
  },
  'niacinamide': {
    summary: 'A vitamin that helps with redness, oil control, and makes skin glow!',
    details: 'Niacinamide is vitamin B3, and it\'s like a multi-tasking superhero for your skin! It helps calm redness, controls oil production, makes your skin look brighter and more even, and even helps build more ceramides. It\'s super gentle and works great for all skin types, especially if you have redness or oily skin.'
  },
  'panthenol': {
    summary: 'Also called Pro-Vitamin B5 - soothes and moisturizes beautifully',
    details: 'Panthenol is like a gentle hug for your skin! It\'s a form of vitamin B5 that deeply moisturizes and helps soothe any irritation. When it touches your skin, it converts into vitamin B5 and gets to work making your skin soft, smooth, and calm. It\'s especially great for sensitive or irritated skin!'
  },
  'squalane': {
    summary: 'A lightweight oil that mimics your skin\'s natural moisture',
    details: 'Squalane is super cool because it\'s almost identical to an oil your skin makes naturally! It absorbs quickly without feeling greasy, helps lock in moisture, and makes your skin feel silky smooth. It comes from plants (usually olives or sugarcane) and works great for all skin types, even oily skin!'
  },
  'zinc oxide': {
    summary: 'The safest sunscreen ingredient - protects like a shield!',
    details: 'Zinc oxide is like a tiny mirror for your skin! It sits on top and reflects harmful UV rays away, protecting you from sun damage. It\'s a mineral sunscreen (also called physical sunscreen) and it\'s the gentlest, safest option for kids and sensitive skin. Dermatologists love it!'
  },
  'titanium dioxide': {
    summary: 'Another super safe mineral sunscreen that blocks UV rays',
    details: 'Titanium dioxide works just like zinc oxide - it creates a protective shield on your skin that reflects UV rays away. It\'s a mineral ingredient that\'s incredibly gentle and safe, which is why it\'s used in baby sunscreens. Together with zinc oxide, it provides the best sun protection for young skin!'
  },
  'fragrance': {
    summary: 'Adds nice smell but can irritate sensitive skin',
    details: 'Fragrance makes products smell nice, but it\'s one of the most common causes of skin irritation and allergies. If you have sensitive skin or notice redness or itching from products, fragrance might be the culprit. Look for "fragrance-free" products if your skin is sensitive!'
  },
  'parfum': {
    summary: 'The same as fragrance - can cause irritation',
    details: 'Parfum is just the fancy French word for fragrance! Like fragrance, it can make products smell lovely but might irritate sensitive skin. Companies don\'t have to tell you exactly what\'s in their fragrance blend, so if you react to it, it\'s hard to know which specific ingredient caused the problem.'
  },
  'alcohol denat': {
    summary: 'A drying alcohol that can irritate skin',
    details: 'This type of alcohol (also called SD alcohol or denatured alcohol) is different from the good fatty alcohols! It can dry out your skin and cause irritation, especially if it\'s high up in the ingredient list. It\'s used to help products dry quickly or feel less greasy, but it\'s not the best choice for young or sensitive skin.'
  },
  'retinol': {
    summary: 'A strong anti-aging ingredient that\'s too harsh for kids',
    details: 'Retinol is a form of vitamin A that\'s great for adults with aging skin, but it\'s way too strong for young skin! It can cause redness, peeling, and irritation. Kids and teens should avoid retinol - your skin is already making new cells super fast naturally, so you don\'t need this powerful ingredient!'
  },
  'salicylic acid': {
    summary: 'An acne-fighting acid that should be used carefully',
    details: 'Salicylic acid is really good at unclogging pores and fighting acne, which is why it\'s in many acne products. But it can be drying and irritating, especially for young skin. If you\'re a teen with acne, use it in low concentrations (0.5-2%) and only on problem areas. Kids under 12 should generally avoid it unless a doctor recommends it.'
  },
  'benzoyl peroxide': {
    summary: 'A powerful acne fighter that can be harsh on skin',
    details: 'Benzoyl peroxide kills acne-causing bacteria really effectively, but it can also be quite harsh! It can cause dryness, redness, and peeling. If you\'re a teen with acne, start with a low concentration (2.5%) and use it carefully. It can also bleach towels and pillowcases, so be careful! Not recommended for kids under 12.'
  }
};

async function main() {
  console.log('📝 Adding detailed descriptions to ingredients...\n');
  
  let updated = 0;
  
  for (const [inciName, desc] of Object.entries(INGREDIENT_DESCRIPTIONS)) {
    const { error } = await supabase
      .from('ingredients')
      .update({
        kid_friendly_summary: desc.summary,
        what_it_does: desc.details
      })
      .eq('inci_name', inciName);
    
    if (error) {
      console.log(`❌ Error updating ${inciName}: ${error.message}`);
    } else {
      console.log(`✅ ${inciName}`);
      updated++;
    }
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`✅ Updated ${updated} ingredients with detailed descriptions`);
}

main();

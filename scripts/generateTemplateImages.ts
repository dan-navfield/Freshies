/**
 * Utility script to generate AI images for routine step templates
 * Run this to generate images for templates that don't have them yet
 * 
 * Usage: npx tsx scripts/generateTemplateImages.ts
 */

import 'dotenv/config';
import { generateStepDiagram } from '../src/services/ai/stepImageGenerationService.js';

// Example: Generate image for "Cleanse Your Face" template
async function generateCleanserImage() {
  console.log('🎨 Generating image for Cleanse Your Face template...\n');
  
  try {
    const result = await generateStepDiagram({
      stepType: 'cleanser',
      stepTitle: 'Cleanse Your Face',
      instructions: [
        'Wet your face with lukewarm water',
        'Apply a dime-sized amount of cleanser',
        'Gently massage in circular motions for 30 seconds',
        'Rinse thoroughly with water',
        'Pat dry with a clean towel'
      ],
      targetAge: 'tween'
    });

    console.log('\n✅ SUCCESS!');
    console.log('─'.repeat(60));
    console.log('Image URL:', result.imageUrl);
    console.log('─'.repeat(60));
    console.log('\nPrompt used:', result.prompt);
    if (result.revisedPrompt) {
      console.log('\nDALL-E revised prompt:', result.revisedPrompt);
    }
    console.log('\n💡 Copy the Image URL above and paste it into your template\'s image_url field in Supabase');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error);
  }
}

// Example: Generate images for all default templates
async function generateAllDefaultImages() {
  const templates = [
    {
      type: 'cleanser',
      title: 'Cleanse Your Face',
      instructions: [
        'Wet your face with lukewarm water',
        'Apply a dime-sized amount of cleanser',
        'Gently massage in circular motions for 30 seconds',
        'Rinse thoroughly with water',
        'Pat dry with a clean towel'
      ]
    },
    {
      type: 'serum',
      title: 'Apply Serum',
      instructions: [
        'Apply 2-3 drops to fingertips',
        'Gently pat onto face and neck',
        'Wait 30 seconds for absorption',
        'Focus on problem areas'
      ]
    },
    {
      type: 'moisturizer',
      title: 'Moisturize',
      instructions: [
        'Take a pea-sized amount',
        'Dot on forehead, cheeks, nose, and chin',
        'Gently spread in upward motions',
        'Don\'t forget your neck!',
        'Let it absorb for a minute'
      ]
    },
    {
      type: 'sunscreen',
      title: 'Apply Sunscreen',
      instructions: [
        'Apply two finger lengths of sunscreen',
        'Spread evenly across face and neck',
        'Don\'t forget ears and hairline',
        'Wait 2 minutes before going outside'
      ]
    },
    {
      type: 'treatment',
      title: 'Spot Treatment',
      instructions: [
        'Apply directly to problem areas',
        'Use a small amount',
        'Gently pat, don\'t rub',
        'Let it dry completely'
      ]
    }
  ];

  console.log(`🎨 Generating images for ${templates.length} templates...\n`);
  
  const results = [];
  
  for (const template of templates) {
    console.log(`\n📸 Generating: ${template.title}...`);
    try {
      const result = await generateStepDiagram({
        stepType: template.type,
        stepTitle: template.title,
        instructions: template.instructions,
        targetAge: 'tween'
      });
      
      results.push({
        title: template.title,
        type: template.type,
        imageUrl: result.imageUrl,
        success: true
      });
      
      console.log(`✅ ${template.title}: ${result.imageUrl}`);
      
      // Wait 2 seconds between requests to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error(`❌ Failed to generate ${template.title}:`, error);
      results.push({
        title: template.title,
        type: template.type,
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      });
    }
  }

  console.log('\n\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  
  results.forEach(result => {
    if (result.success) {
      console.log(`\n✅ ${result.title} (${result.type})`);
      console.log(`   ${result.imageUrl}`);
    } else {
      console.log(`\n❌ ${result.title} (${result.type})`);
      console.log(`   Error: ${result.error}`);
    }
  });
  
  console.log('\n\n💡 Update your Supabase templates with these URLs:');
  console.log('─'.repeat(60));
  results.forEach(result => {
    if (result.success) {
      console.log(`\nUPDATE routine_step_templates`);
      console.log(`SET image_url = '${result.imageUrl}'`);
      console.log(`WHERE slug = '${result.type}-template';`);
    }
  });
}

// Run the script
const args = process.argv.slice(2);
if (args.includes('--all')) {
  generateAllDefaultImages();
} else {
  generateCleanserImage();
}

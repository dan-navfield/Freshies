/**
 * Learn Content Pipeline - Test Script
 * Tests the pipeline with a single source
 */

import 'dotenv/config';
import { processSource } from '../src/services/learn/pipelineOrchestrator';
import { getSourceById } from '../src/services/learn/contentSources';
import { generateSafetyReport } from '../src/services/learn/safetyChecker';
import { createArticle, updateArticleStatus } from '../src/services/learn/database';

async function testPipeline() {
  console.log('\n========================================');
  console.log('Learn Content Pipeline - Test Run');
  console.log('========================================\n');

  try {
    // Test with RCH Eczema article
    console.log('📖 Testing with: Royal Children\'s Hospital - Eczema\n');
    
    const source = getSourceById('rch-eczema');
    
    if (!source) {
      throw new Error('Source not found: rch-eczema');
    }

    console.log(`Source: ${source.name}`);
    console.log(`URL: ${source.url}`);
    console.log(`Topic: ${source.topic}\n`);

    // Process the source
    const result = await processSource(source);

    if (!result) {
      console.log('⚠️  No changes detected - content is up to date\n');
      return;
    }

    // Display results
    console.log('\n========================================');
    console.log('Results');
    console.log('========================================\n');

    console.log('📄 Article Details:');
    console.log(`  Title: ${result.article.title}`);
    console.log(`  Topic: ${result.article.topic}`);
    console.log(`  Age Bands: ${result.article.age_bands.join(', ')}`);
    console.log(`  Tags: ${result.article.tags.join(', ')}`);
    console.log(`  Sections: ${result.article.body_sections.length}`);
    console.log(`  FAQs: ${result.article.faqs.length}`);
    console.log(`  Status: ${result.article.status}\n`);

    console.log('🔒 Safety Check:');
    console.log(`  Score: ${result.safety_check.score}/100`);
    console.log(`  Passed: ${result.safety_check.passed ? 'YES ✅' : 'NO ❌'}`);
    console.log(`  Issues: ${result.safety_check.issues.length}`);
    console.log(`  Warnings: ${result.safety_check.warnings.length}\n`);

    if (result.safety_check.issues.length > 0) {
      console.log('⚠️  Safety Issues:');
      result.safety_check.issues.forEach((issue, i) => {
        console.log(`  ${i + 1}. [${issue.severity.toUpperCase()}] ${issue.description}`);
      });
      console.log('');
    }

    if (result.safety_check.warnings.length > 0) {
      console.log('⚠️  Warnings:');
      result.safety_check.warnings.slice(0, 3).forEach((warning, i) => {
        console.log(`  ${i + 1}. ${warning.description}`);
      });
      if (result.safety_check.warnings.length > 3) {
        console.log(`  ... and ${result.safety_check.warnings.length - 3} more`);
      }
      console.log('');
    }

    console.log('⏱️  Performance:');
    console.log(`  Processing Time: ${result.processing_time_ms}ms\n`);

    // Display sample content
    console.log('📝 Sample Content:\n');
    console.log('Summary:');
    console.log(result.article.summary.split('\n').slice(0, 3).join('\n'));
    console.log('...\n');

    if (result.article.body_sections.length > 0) {
      const firstSection = result.article.body_sections[0];
      console.log(`First Section: ${firstSection.heading}`);
      console.log(firstSection.content.substring(0, 200) + '...\n');
    }

    if (result.article.faqs.length > 0) {
      const firstFaq = result.article.faqs[0];
      console.log(`Sample FAQ:`);
      console.log(`Q: ${firstFaq.question}`);
      console.log(`A: ${firstFaq.answer.substring(0, 150)}...\n`);
    }

    console.log('========================================');
    console.log('✅ Test Complete!');
    console.log('========================================\n');

    // Generate full safety report
    console.log('Full Safety Report:');
    console.log('---');
    console.log(generateSafetyReport(result.safety_check));
    console.log('---\n');

    // Save to database and publish
    console.log('💾 Saving to database...');
    const articleId = await createArticle(result.article);
    console.log(`✅ Article saved with ID: ${articleId}\n`);

    console.log('📢 Publishing article...');
    await updateArticleStatus(articleId, 'published');
    console.log('✅ Article published!\n');

    console.log('========================================');
    console.log('🎉 Article is now live in the Learn section!');
    console.log(`Article ID: ${articleId}`);
    console.log('========================================\n');

  } catch (error) {
    console.error('\n❌ Test Failed:', error);
    if (error instanceof Error) {
      console.error('Error:', error.message);
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

// Run the test
testPipeline();

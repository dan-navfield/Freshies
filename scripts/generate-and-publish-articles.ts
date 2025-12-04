/**
 * Generate and Publish 5 Articles
 * Full pipeline: Fetch → Transform → Safety Check → Save → Publish
 */

import 'dotenv/config';
import { processSource } from '../src/services/learn/pipelineOrchestrator';
import { getSourceById, getEnabledSources } from '../src/services/learn/contentSources';
import { createArticle, updateArticleStatus } from '../src/services/learn/database';

const TARGET_SOURCES = [
  'rch-eczema',
  'rch-acne',
  'rch-sunscreen',
  'dermnetnz-moisturizers',
  'acd-sunscreen-kids'
];

async function generateAndPublishArticles() {
  console.log('\n========================================');
  console.log('Generate & Publish 5 Articles');
  console.log('========================================\n');

  const results = [];
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < TARGET_SOURCES.length; i++) {
    const sourceId = TARGET_SOURCES[i];
    console.log(`\n[${i + 1}/5] Processing: ${sourceId}`);
    console.log('─'.repeat(50));

    try {
      // Get source configuration
      const source = getSourceById(sourceId);
      
      if (!source) {
        console.log(`⚠️  Source not found: ${sourceId}, trying next available source...`);
        const allSources = getEnabledSources();
        const alternativeSource = allSources[i];
        if (!alternativeSource) {
          console.log(`❌ No alternative source available`);
          failCount++;
          continue;
        }
        console.log(`✓ Using alternative: ${alternativeSource.name}`);
        
        // Process alternative source
        const result = await processSource(alternativeSource);
        
        if (!result) {
          console.log('⚠️  No changes detected - content is up to date');
          continue;
        }

        // Save article
        console.log('\n💾 Saving article...');
        const articleId = await createArticle(result.article);
        console.log(`✅ Article saved with ID: ${articleId}`);

        // Auto-approve and publish
        console.log('📢 Publishing article...');
        await updateArticleStatus(articleId, 'published');
        console.log(`✅ Article published!`);

        results.push({
          source: alternativeSource.name,
          title: result.article.title,
          articleId,
          safetyScore: result.safety_check.score,
          status: 'published',
        });

        successCount++;
        console.log(`\n✅ [${i + 1}/5] Complete: ${result.article.title}`);
        
      } else {
        // Process the source
        const result = await processSource(source);
        
        if (!result) {
          console.log('⚠️  No changes detected - content is up to date');
          continue;
        }

        // Check safety score
        console.log(`\n🔒 Safety Score: ${result.safety_check.score}/100`);
        
        if (result.safety_check.score < 70) {
          console.log(`⚠️  Safety score too low (${result.safety_check.score}), skipping...`);
          failCount++;
          continue;
        }

        // Save article
        console.log('\n💾 Saving article...');
        const articleId = await createArticle(result.article);
        console.log(`✅ Article saved with ID: ${articleId}`);

        // Auto-approve and publish
        console.log('📢 Publishing article...');
        await updateArticleStatus(articleId, 'published');
        console.log(`✅ Article published!`);

        results.push({
          source: source.name,
          title: result.article.title,
          articleId,
          safetyScore: result.safety_check.score,
          status: 'published',
        });

        successCount++;
        console.log(`\n✅ [${i + 1}/5] Complete: ${result.article.title}`);
      }

      // Add delay between requests to avoid rate limiting
      if (i < TARGET_SOURCES.length - 1) {
        console.log('\n⏳ Waiting 3 seconds before next article...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }

    } catch (error) {
      console.error(`\n❌ Error processing ${sourceId}:`, error);
      failCount++;
      results.push({
        source: sourceId,
        error: error instanceof Error ? error.message : 'Unknown error',
        status: 'failed',
      });
    }
  }

  // Summary
  console.log('\n\n========================================');
  console.log('📊 SUMMARY');
  console.log('========================================\n');
  console.log(`✅ Successfully published: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`📝 Total processed: ${results.length}\n`);

  if (results.length > 0) {
    console.log('Published Articles:');
    console.log('─'.repeat(80));
    results.forEach((result, index) => {
      if (result.status === 'published') {
        console.log(`${index + 1}. ${result.title}`);
        console.log(`   Source: ${result.source}`);
        console.log(`   ID: ${result.articleId}`);
        console.log(`   Safety Score: ${result.safetyScore}/100`);
        console.log('');
      }
    });
  }

  console.log('========================================');
  console.log('🎉 Content generation complete!');
  console.log('========================================\n');
  console.log('📱 Check the Learn tab in the app to see the new articles!\n');
}

// Run the script
generateAndPublishArticles()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });

/**
 * Learn Content Pipeline - Main Orchestrator
 * Coordinates the entire content ingestion and transformation flow
 */

import { ContentSource, LearnArticle, TransformResult, SyncJobResult, SyncError } from './types';
import { fetchSourceContent, parseRawContent, hashContent, hasContentChanged } from './contentFetcher.simple';
import { summariseSourceContent, extractFactsAndQAs, classifyArticleTopic } from './aiTools';
import { checkContentSafety } from './safetyChecker';
import { getEnabledSources } from './contentSources';

// ============================================================================
// Main Pipeline Function
// ============================================================================

/**
 * Process a single source through the complete pipeline
 */
export async function processSource(source: ContentSource): Promise<TransformResult | null> {
  const startTime = Date.now();
  
  try {
    console.log(`\n=== Processing: ${source.name} ===`);
    
    // Step 1: Fetch content
    console.log('1. Fetching content...');
    const fetchResult = await fetchSourceContent(source);
    
    if (!fetchResult.success) {
      throw new Error(`Fetch failed: ${fetchResult.error}`);
    }

    // Step 2: Check if content has changed
    console.log('2. Checking for changes...');
    const newHash = hashContent(fetchResult.raw_text);
    // TODO: Get existing hash from database
    const existingHash = undefined; // await getLatestSnapshotHash(source.url);
    
    if (!hasContentChanged(newHash, existingHash)) {
      console.log('✓ No changes detected, skipping...');
      return null;
    }

    // Step 3: Parse content
    console.log('3. Parsing content...');
    const parsed = parseRawContent(fetchResult.raw_text, fetchResult.title);

    // Step 4: AI Transformation - Summarise
    console.log('4. AI transformation - summarising...');
    const summarised = await summariseSourceContent({
      source_text: parsed.sections.map(s => s.content).join('\n\n'),
      source_url: source.url,
      source_name: source.name,
      topic: source.topic,
      target_reading_level: 'Year 7-8',
      needs_age_banding: true,
    });

    // Step 5: AI Transformation - Extract FAQs
    console.log('5. AI transformation - extracting FAQs...');
    const faqs = await extractFactsAndQAs({
      article_text: summarised.body_sections.map(s => s.content).join('\n\n'),
      topic: source.topic,
      max_questions: 5,
    });

    // Step 6: AI Transformation - Classify
    console.log('6. AI transformation - classifying...');
    const classification = await classifyArticleTopic({
      article_text: summarised.body_sections.map(s => s.content).join('\n\n'),
      article_title: summarised.title,
      allowed_topics: ['skin-basics', 'ingredients', 'products', 'routines', 'safety', 'mental-health'],
    });

    // Step 7: Assemble article
    console.log('7. Assembling article...');
    const article: Omit<LearnArticle, 'id' | 'created_at' | 'updated_at' | 'view_count' | 'save_count'> = {
      title: summarised.title,
      summary: summarised.summary.join('\n'),
      body_sections: summarised.body_sections.map((section, index) => ({
        ...section,
        order: index,
      })),
      faqs: faqs.faqs.map((faq, index) => ({
        ...faq,
        order: index,
      })),
      topic: classification.primary_topic,
      secondary_topics: classification.secondary_topics,
      tags: classification.suggested_tags,
      age_bands: summarised.age_bands,
      source_url: source.url,
      source_name: source.name,
      last_synced_at: new Date(),
      llm_version: 'gpt-4-turbo-2024-04-09',
      llm_provider: 'openai',
      disclaimer: summarised.disclaimer,
      status: 'draft',
    };

    // Step 8: Safety check
    console.log('8. Running safety checks...');
    const safetyCheck = checkContentSafety(article);
    
    console.log(`✓ Safety score: ${safetyCheck.score}/100`);
    console.log(`✓ Issues: ${safetyCheck.issues.length}`);
    console.log(`✓ Warnings: ${safetyCheck.warnings.length}`);

    const processingTime = Date.now() - startTime;
    console.log(`✓ Completed in ${processingTime}ms`);

    return {
      article,
      safety_check: safetyCheck,
      processing_time_ms: processingTime,
    };

  } catch (error) {
    console.error(`✗ Error processing ${source.name}:`, error);
    throw error;
  }
}

// ============================================================================
// Batch Processing
// ============================================================================

/**
 * Process multiple sources in a sync job
 */
export async function runSyncJob(
  jobId: string,
  sourceIds?: string[]
): Promise<SyncJobResult> {
  const startTime = new Date();
  const errors: SyncError[] = [];
  let articlesCreated = 0;
  let articlesUpdated = 0;

  try {
    console.log(`\n========================================`);
    console.log(`Starting Sync Job: ${jobId}`);
    console.log(`========================================\n`);

    // Get sources to process
    const allSources = getEnabledSources();
    const sources = sourceIds
      ? allSources.filter(s => sourceIds.includes(s.id))
      : allSources;

    console.log(`Processing ${sources.length} sources...`);

    // Process each source
    for (const source of sources) {
      try {
        const result = await processSource(source);
        
        if (result) {
          // TODO: Save to database
          // const saved = await saveArticle(result.article);
          
          if (result.safety_check.passed) {
            articlesCreated++;
            console.log(`✓ Article created: ${result.article.title}`);
          } else {
            console.log(`⚠ Article created but needs review: ${result.article.title}`);
            articlesCreated++;
          }
        }
      } catch (error) {
        errors.push({
          source_url: source.url,
          error_type: 'transform_failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date(),
        });
      }
    }

    const completedTime = new Date();
    const success = errors.length === 0;

    console.log(`\n========================================`);
    console.log(`Sync Job Complete`);
    console.log(`========================================`);
    console.log(`Sources processed: ${sources.length}`);
    console.log(`Articles created: ${articlesCreated}`);
    console.log(`Articles updated: ${articlesUpdated}`);
    console.log(`Errors: ${errors.length}`);
    console.log(`Success: ${success ? 'YES' : 'NO'}`);
    console.log(`========================================\n`);

    return {
      job_id: jobId,
      started_at: startTime,
      completed_at: completedTime,
      sources_processed: sources.length,
      articles_created: articlesCreated,
      articles_updated: articlesUpdated,
      errors,
      success,
    };

  } catch (error) {
    console.error('Sync job failed:', error);
    
    return {
      job_id: jobId,
      started_at: startTime,
      completed_at: new Date(),
      sources_processed: 0,
      articles_created: 0,
      articles_updated: 0,
      errors: [{
        source_url: 'N/A',
        error_type: 'transform_failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      }],
      success: false,
    };
  }
}

// ============================================================================
// Scheduled Job Runner
// ============================================================================

/**
 * Run weekly content sync
 */
export async function runWeeklySync(): Promise<SyncJobResult> {
  return runSyncJob('weekly-sync');
}

/**
 * Run daily content sync (for high-priority sources)
 */
export async function runDailySync(): Promise<SyncJobResult> {
  const allSources = getEnabledSources();
  const dailySources = allSources
    .filter(s => s.fetch_frequency === 'daily')
    .map(s => s.id);
  
  return runSyncJob('daily-sync', dailySources);
}

/**
 * Process a single source on-demand
 */
export async function processSourceOnDemand(sourceId: string): Promise<TransformResult | null> {
  const allSources = getEnabledSources();
  const source = allSources.find(s => s.id === sourceId);
  
  if (!source) {
    throw new Error(`Source not found: ${sourceId}`);
  }
  
  return processSource(source);
}

// ============================================================================
// Stale Content Management
// ============================================================================

/**
 * Flag articles older than 6 months for review
 */
export async function flagStaleArticles(): Promise<number> {
  console.log('Checking for stale articles...');
  
  // TODO: Implement database query
  // const staleArticles = await getStaleArticles();
  // for (const article of staleArticles) {
  //   await updateArticleStatus(article.id, 'review');
  //   await createReviewTask(article.id, 'Stale content - needs refresh');
  // }
  
  console.log('Stale article check complete');
  return 0; // Return count of flagged articles
}

// ============================================================================
// Pipeline Status & Metrics
// ============================================================================

/**
 * Get pipeline status
 */
export async function getPipelineStatus(): Promise<{
  enabled_sources: number;
  pending_reviews: number;
  published_articles: number;
  last_sync: Date | null;
  next_sync: Date | null;
}> {
  const enabledSources = getEnabledSources();
  
  return {
    enabled_sources: enabledSources.length,
    pending_reviews: 0, // TODO: Query database
    published_articles: 0, // TODO: Query database
    last_sync: null, // TODO: Query database
    next_sync: null, // TODO: Calculate from schedule
  };
}

/**
 * Generate pipeline metrics report
 */
export async function generateMetricsReport(): Promise<string> {
  const status = await getPipelineStatus();
  
  const lines: string[] = [];
  lines.push('=== Learn Content Pipeline Metrics ===');
  lines.push('');
  lines.push(`Enabled Sources: ${status.enabled_sources}`);
  lines.push(`Published Articles: ${status.published_articles}`);
  lines.push(`Pending Reviews: ${status.pending_reviews}`);
  lines.push(`Last Sync: ${status.last_sync?.toISOString() || 'Never'}`);
  lines.push(`Next Sync: ${status.next_sync?.toISOString() || 'Not scheduled'}`);
  lines.push('');
  lines.push('=====================================');
  
  return lines.join('\n');
}

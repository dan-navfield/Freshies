/**
 * Learn Content Pipeline - Database Layer
 * Supabase client wrapper for Learn content operations
 */

import { LearnArticle, SourceSnapshot, ReviewTask, ContentSource } from './types';
import { supabase } from '../../lib/supabase-server';

// ============================================================================
// Article Operations
// ============================================================================

/**
 * Get all published articles
 */
export async function getPublishedArticles(options?: {
  topic?: string;
  tags?: string[];
  age_band?: string;
  limit?: number;
  offset?: number;
}): Promise<LearnArticle[]> {
  let query = supabase
    .from('learn_articles')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false });
  
  if (options?.topic) {
    query = query.eq('topic', options.topic);
  }
  
  if (options?.tags) {
    query = query.contains('tags', options.tags);
  }
  
  if (options?.age_band) {
    query = query.contains('age_bands', [options.age_band]);
  }
  
  if (options?.limit) {
    query = query.limit(options.limit);
  }
  
  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  return data as LearnArticle[];
}

/**
 * Get article by ID
 */
export async function getArticleById(id: string): Promise<LearnArticle | null> {
  const { data, error } = await supabase
    .from('learn_articles')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data as LearnArticle;
}

/**
 * Create new article
 * Now with admin-ready workflow: defaults to 'draft' status
 */
export async function createArticle(
  article: Omit<LearnArticle, 'id' | 'created_at' | 'updated_at' | 'view_count' | 'save_count'>,
  options?: {
    status?: 'draft' | 'review' | 'published' | 'retired';
    sourceType?: 'human_written' | 'ai_generated' | 'mixed';
    sourceRefs?: string[];
  }
): Promise<string> {
  const articleData = {
    ...article,
    status: options?.status || 'draft', // Default to draft for admin review
    source_type: options?.sourceType || 'ai_generated',
    source_refs: options?.sourceRefs || [],
    version: 1,
  };

  const { data, error } = await supabase
    .from('learn_articles')
    .insert(articleData)
    .select('id')
    .single();
  
  if (error) throw error;
  
  console.log(`✅ Article created with ID: ${data.id} (status: ${articleData.status})`);
  
  return data.id;
}

/**
 * Update article
 */
export async function updateArticle(
  id: string,
  updates: Partial<LearnArticle>
): Promise<void> {
  const { error } = await supabase
    .from('learn_articles')
    .update(updates)
    .eq('id', id);
  
  if (error) throw error;
}

/**
 * Update article status
 */
export async function updateArticleStatus(
  id: string,
  status: 'draft' | 'review' | 'published' | 'retired'
): Promise<void> {
  const updates: any = { status };
  
  // If publishing, set published_at timestamp
  if (status === 'published') {
    updates.published_at = new Date().toISOString();
  }
  
  return updateArticle(id, updates);
}

/**
 * Get articles by status (for admin review)
 */
export async function getArticlesByStatus(
  status: 'draft' | 'review' | 'published' | 'retired',
  limit: number = 50
): Promise<LearnArticle[]> {
  const { data, error } = await supabase
    .from('learn_articles')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  return data as LearnArticle[];
}

/**
 * Publish article (admin action)
 */
export async function publishArticle(
  id: string,
  publishedBy?: string
): Promise<void> {
  const updates: any = {
    status: 'published',
    published_at: new Date().toISOString(),
  };
  
  if (publishedBy) {
    updates.published_by = publishedBy;
  }
  
  await updateArticle(id, updates);
  console.log(`✅ Article ${id} published`);
}

/**
 * Increment article view count
 */
export async function incrementArticleViewCount(id: string): Promise<void> {
  // TODO: Implement Supabase RPC call
  // const { error } = await supabase.rpc('increment_article_view_count', {
  //   article_uuid: id,
  // });
  
  // if (error) throw error;
}

/**
 * Record article view with details
 */
export async function recordArticleView(
  articleId: string,
  userId?: string,
  readingTimeSeconds?: number
): Promise<void> {
  // TODO: Implement Supabase insert
  // const { error } = await supabase
  //   .from('article_views')
  //   .insert({
  //     article_id: articleId,
  //     user_id: userId,
  //     reading_time_seconds: readingTimeSeconds,
  //   });
  
  // if (error) throw error;
  
  // Also increment the counter
  await incrementArticleViewCount(articleId);
}

/**
 * Search articles by text
 */
export async function searchArticles(query: string, limit: number = 20): Promise<LearnArticle[]> {
  // TODO: Implement full-text search
  // const { data, error } = await supabase
  //   .from('learn_articles')
  //   .select('*')
  //   .textSearch('title', query, { type: 'websearch' })
  //   .eq('status', 'published')
  //   .limit(limit);
  
  // if (error) throw error;
  // return data as LearnArticle[];
  
  return [];
}

/**
 * Get stale articles (> 6 months old)
 */
export async function getStaleArticles(): Promise<LearnArticle[]> {
  // TODO: Implement Supabase RPC call
  // const { data, error } = await supabase.rpc('get_stale_articles');
  
  // if (error) throw error;
  // return data as LearnArticle[];
  
  return [];
}

// ============================================================================
// Source Snapshot Operations
// ============================================================================

/**
 * Get latest snapshot for a source URL
 */
export async function getLatestSnapshot(sourceUrl: string): Promise<SourceSnapshot | null> {
  // TODO: Implement Supabase query
  // const { data, error } = await supabase
  //   .from('source_snapshots')
  //   .select('*')
  //   .eq('source_url', sourceUrl)
  //   .order('processed_at', { ascending: false })
  //   .limit(1)
  //   .single();
  
  // if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
  // return data as SourceSnapshot | null;
  
  return null;
}

/**
 * Get latest snapshot hash
 */
export async function getLatestSnapshotHash(sourceUrl: string): Promise<string | undefined> {
  const snapshot = await getLatestSnapshot(sourceUrl);
  return snapshot?.hash_of_text;
}

/**
 * Save source snapshot
 */
export async function saveSourceSnapshot(snapshot: Omit<SourceSnapshot, 'id' | 'created_at'>): Promise<string> {
  // TODO: Implement Supabase insert
  // const { data, error } = await supabase
  //   .from('source_snapshots')
  //   .insert(snapshot)
  //   .select('id')
  //   .single();
  
  // if (error) throw error;
  // return data.id;
  
  return 'mock-snapshot-id';
}

// ============================================================================
// Content Source Operations
// ============================================================================

/**
 * Get all content sources
 */
export async function getContentSources(enabledOnly: boolean = false): Promise<ContentSource[]> {
  // TODO: Implement Supabase query
  // let query = supabase.from('content_sources').select('*');
  
  // if (enabledOnly) {
  //   query = query.eq('enabled', true);
  // }
  
  // const { data, error } = await query;
  
  // if (error) throw error;
  // return data as ContentSource[];
  
  return [];
}

/**
 * Update source last fetched time
 */
export async function updateSourceLastFetched(sourceId: string, nextFetch: Date): Promise<void> {
  // TODO: Implement Supabase update
  // const { error } = await supabase
  //   .from('content_sources')
  //   .update({
  //     last_fetched: new Date().toISOString(),
  //     next_fetch: nextFetch.toISOString(),
  //   })
  //   .eq('id', sourceId);
  
  // if (error) throw error;
}

// ============================================================================
// Review Task Operations
// ============================================================================

/**
 * Get pending review tasks
 */
export async function getPendingReviewTasks(): Promise<ReviewTask[]> {
  // TODO: Implement Supabase query with join
  // const { data, error } = await supabase
  //   .from('review_tasks')
  //   .select(`
  //     *,
  //     article:learn_articles(*)
  //   `)
  //   .eq('status', 'pending')
  //   .order('priority', { ascending: false })
  //   .order('created_at', { ascending: true });
  
  // if (error) throw error;
  // return data as ReviewTask[];
  
  return [];
}

/**
 * Create review task
 */
export async function createReviewTask(
  articleId: string,
  priority: 'low' | 'medium' | 'high' = 'medium'
): Promise<string> {
  // TODO: Implement Supabase insert
  // const checklist = [
  //   { id: '1', label: 'Factually accurate', description: 'Content matches source', checked: false, required: true },
  //   { id: '2', label: 'Tone matches brand', description: 'Warm, balanced, reassuring', checked: false, required: true },
  //   { id: '3', label: 'Disclaimers correct', description: 'Includes required disclaimers', checked: false, required: true },
  //   { id: '4', label: 'No medical advice', description: 'Avoids diagnosis language', checked: false, required: true },
  //   { id: '5', label: 'Australian English', description: 'Uses Australian spelling', checked: false, required: true },
  //   { id: '6', label: 'Age-appropriate', description: 'Suitable for target age bands', checked: false, required: false },
  // ];
  
  // const { data, error } = await supabase
  //   .from('review_tasks')
  //   .insert({
  //     article_id: articleId,
  //     priority,
  //     checklist,
  //   })
  //   .select('id')
  //   .single();
  
  // if (error) throw error;
  // return data.id;
  
  return 'mock-task-id';
}

/**
 * Complete review task
 */
export async function completeReviewTask(
  taskId: string,
  decision: 'approve' | 'reject' | 'request_changes',
  notes: string,
  reviewerId: string
): Promise<void> {
  // TODO: Implement Supabase transaction
  // 1. Insert review decision
  // 2. Update task status
  // 3. Update article status based on decision
  
  // const { error: decisionError } = await supabase
  //   .from('review_decisions')
  //   .insert({
  //     task_id: taskId,
  //     decision,
  //     notes,
  //     reviewer_id: reviewerId,
  //   });
  
  // if (decisionError) throw decisionError;
  
  // const { error: taskError } = await supabase
  //   .from('review_tasks')
  //   .update({ status: 'completed' })
  //   .eq('id', taskId);
  
  // if (taskError) throw taskError;
  
  // if (decision === 'approve') {
  //   // Get article_id from task and update article status
  //   const { data: task } = await supabase
  //     .from('review_tasks')
  //     .select('article_id')
  //     .eq('id', taskId)
  //     .single();
  //   
  //   if (task) {
  //     await updateArticleStatus(task.article_id, 'published');
  //   }
  // }
}

// ============================================================================
// User Saved Articles Operations
// ============================================================================

/**
 * Save article for user
 */
export async function saveArticleForUser(userId: string, articleId: string): Promise<void> {
  // TODO: Implement Supabase insert
  // const { error } = await supabase
  //   .from('user_saved_articles')
  //   .insert({
  //     user_id: userId,
  //     article_id: articleId,
  //   });
  
  // if (error && error.code !== '23505') throw error; // 23505 = unique violation (already saved)
  
  // Increment save count
  // await supabase.rpc('increment_article_save_count', { article_uuid: articleId });
}

/**
 * Unsave article for user
 */
export async function unsaveArticleForUser(userId: string, articleId: string): Promise<void> {
  // TODO: Implement Supabase delete
  // const { error } = await supabase
  //   .from('user_saved_articles')
  //   .delete()
  //   .eq('user_id', userId)
  //   .eq('article_id', articleId);
  
  // if (error) throw error;
}

/**
 * Get user's saved articles
 */
export async function getUserSavedArticles(userId: string): Promise<LearnArticle[]> {
  // TODO: Implement Supabase query with join
  // const { data, error } = await supabase
  //   .from('user_saved_articles')
  //   .select(`
  //     article:learn_articles(*)
  //   `)
  //   .eq('user_id', userId)
  //   .order('saved_at', { ascending: false });
  
  // if (error) throw error;
  // return data.map(d => d.article) as LearnArticle[];
  
  return [];
}

// ============================================================================
// Analytics Operations
// ============================================================================

/**
 * Get content metrics
 */
export async function getContentMetrics() {
  // TODO: Implement Supabase query
  // const { data, error } = await supabase
  //   .from('article_metrics')
  //   .select('*');
  
  // if (error) throw error;
  // return data;
  
  return {
    total_articles: 0,
    by_status: {},
    by_topic: {},
    total_views: 0,
    total_saves: 0,
  };
}

/**
 * Get most viewed articles
 */
export async function getMostViewedArticles(limit: number = 10): Promise<LearnArticle[]> {
  // TODO: Implement Supabase query
  // const { data, error } = await supabase
  //   .from('learn_articles')
  //   .select('*')
  //   .eq('status', 'published')
  //   .order('view_count', { ascending: false })
  //   .limit(limit);
  
  // if (error) throw error;
  // return data as LearnArticle[];
  
  return [];
}

/**
 * Get most saved articles
 */
export async function getMostSavedArticles(limit: number = 10): Promise<LearnArticle[]> {
  // TODO: Implement Supabase query
  // const { data, error } = await supabase
  //   .from('learn_articles')
  //   .select('*')
  //   .eq('status', 'published')
  //   .order('save_count', { ascending: false })
  //   .limit(limit);
  
  // if (error) throw error;
  // return data as LearnArticle[];
  
  return [];
}

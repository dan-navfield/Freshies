/**
 * Admin Content Management Service
 * Handles all admin operations for Learn content
 * Future Management app will call these functions via API endpoints
 */

import { supabase } from '../../lib/supabase';
import { logAdminAction, logSystemAction, AuditActions } from '../config/auditLogger';

export interface ArticleWorkflowResult {
  success: boolean;
  articleId?: string;
  error?: string;
  message?: string;
}

export interface ArticleListResult {
  articles: any[];
  total: number;
  page: number;
  pageSize: number;
}

// ============================================================================
// ARTICLE WORKFLOW MANAGEMENT
// ============================================================================

/**
 * Get articles by status (for admin review queue)
 */
export async function getArticlesByStatus(
  status: 'draft' | 'review' | 'published' | 'retired',
  options?: {
    page?: number;
    pageSize?: number;
    sortBy?: 'created_at' | 'updated_at' | 'title';
    sortOrder?: 'asc' | 'desc';
  }
): Promise<ArticleListResult> {
  const page = options?.page || 1;
  const pageSize = options?.pageSize || 20;
  const sortBy = options?.sortBy || 'created_at';
  const sortOrder = options?.sortOrder || 'desc';
  const offset = (page - 1) * pageSize;

  try {
    // Get total count
    const { count, error: countError } = await supabase
      .from('learn_articles')
      .select('*', { count: 'exact', head: true })
      .eq('status', status);

    if (countError) throw countError;

    // Get paginated results
    const { data, error } = await supabase
      .from('learn_articles')
      .select('*')
      .eq('status', status)
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + pageSize - 1);

    if (error) throw error;

    return {
      articles: data || [],
      total: count || 0,
      page,
      pageSize,
    };
  } catch (error: any) {
    console.error('Error fetching articles by status:', error);
    throw error;
  }
}

/**
 * Move article to review queue
 */
export async function moveToReview(
  articleId: string,
  adminId?: string
): Promise<ArticleWorkflowResult> {
  try {
    const { error } = await supabase
      .from('learn_articles')
      .update({
        status: 'review',
        updated_at: new Date().toISOString(),
      })
      .eq('id', articleId);

    if (error) throw error;

    // Log audit event
    if (adminId) {
      await logAdminAction(adminId, 'article_moved_to_review', 'learn_article', articleId);
    } else {
      await logSystemAction('article_moved_to_review', 'learn_article', articleId);
    }

    return {
      success: true,
      articleId,
      message: 'Article moved to review queue',
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Publish article (make visible to mobile app users)
 */
export async function publishArticle(
  articleId: string,
  adminId?: string,
  options?: { publishedAt?: string }
): Promise<ArticleWorkflowResult> {
  try {
    const { error } = await supabase
      .from('learn_articles')
      .update({
        status: 'published',
        published_at: options?.publishedAt || new Date().toISOString(),
        published_by: adminId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', articleId);

    if (error) throw error;

    // Log audit event
    if (adminId) {
      await logAdminAction(adminId, AuditActions.ARTICLE_PUBLISHED, 'learn_article', articleId);
    } else {
      await logSystemAction(AuditActions.ARTICLE_PUBLISHED, 'learn_article', articleId);
    }

    console.log(`✅ Article ${articleId} published and now visible to users`);

    return {
      success: true,
      articleId,
      message: 'Article published successfully',
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Retire article (remove from public view)
 */
export async function retireArticle(
  articleId: string,
  reason: string,
  adminId?: string
): Promise<ArticleWorkflowResult> {
  try {
    const { error } = await supabase
      .from('learn_articles')
      .update({
        status: 'retired',
        updated_at: new Date().toISOString(),
      })
      .eq('id', articleId);

    if (error) throw error;

    // Log audit event
    if (adminId) {
      await logAdminAction(
        adminId,
        AuditActions.ARTICLE_RETIRED,
        'learn_article',
        articleId,
        { reason }
      );
    } else {
      await logSystemAction(
        AuditActions.ARTICLE_RETIRED,
        'learn_article',
        articleId,
        { reason }
      );
    }

    return {
      success: true,
      articleId,
      message: 'Article retired successfully',
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Reject article (send back to draft)
 */
export async function rejectArticle(
  articleId: string,
  feedback: string,
  adminId?: string
): Promise<ArticleWorkflowResult> {
  try {
    const { error } = await supabase
      .from('learn_articles')
      .update({
        status: 'draft',
        updated_at: new Date().toISOString(),
      })
      .eq('id', articleId);

    if (error) throw error;

    // Log audit event
    if (adminId) {
      await logAdminAction(
        adminId,
        'article_rejected',
        'learn_article',
        articleId,
        { feedback }
      );
    }

    return {
      success: true,
      articleId,
      message: 'Article rejected and moved back to draft',
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Flag article for review
 */
export async function flagArticle(
  articleId: string,
  reason: string,
  flaggedBy?: string
): Promise<ArticleWorkflowResult> {
  try {
    const { error } = await supabase
      .from('learn_articles')
      .update({
        flagged: true,
        flag_reason: reason,
        flagged_at: new Date().toISOString(),
        flagged_by: flaggedBy,
      })
      .eq('id', articleId);

    if (error) throw error;

    // Log audit event
    if (flaggedBy) {
      await logAdminAction(
        flaggedBy,
        AuditActions.ARTICLE_FLAGGED,
        'learn_article',
        articleId,
        { reason }
      );
    }

    return {
      success: true,
      articleId,
      message: 'Article flagged for review',
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Unflag article
 */
export async function unflagArticle(
  articleId: string,
  adminId?: string
): Promise<ArticleWorkflowResult> {
  try {
    const { error } = await supabase
      .from('learn_articles')
      .update({
        flagged: false,
        flag_reason: null,
        flagged_at: null,
        flagged_by: null,
      })
      .eq('id', articleId);

    if (error) throw error;

    // Log audit event
    if (adminId) {
      await logAdminAction(adminId, 'article_unflagged', 'learn_article', articleId);
    }

    return {
      success: true,
      articleId,
      message: 'Article unflagged',
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

// ============================================================================
// ARTICLE CRUD OPERATIONS
// ============================================================================

/**
 * Get article details (for admin editing)
 */
export async function getArticleForEdit(articleId: string): Promise<any> {
  try {
    const { data, error } = await supabase
      .from('learn_articles')
      .select('*')
      .eq('id', articleId)
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('Error fetching article:', error);
    throw error;
  }
}

/**
 * Update article content
 */
export async function updateArticleContent(
  articleId: string,
  updates: {
    title?: string;
    summary?: string;
    body_sections?: any[];
    faqs?: any[];
    tags?: string[];
    age_bands?: string[];
    topic?: string;
    disclaimer?: string;
  },
  adminId?: string
): Promise<ArticleWorkflowResult> {
  try {
    // Increment version
    const { data: current } = await supabase
      .from('learn_articles')
      .select('version')
      .eq('id', articleId)
      .single();

    const newVersion = (current?.version || 1) + 1;

    const { error } = await supabase
      .from('learn_articles')
      .update({
        ...updates,
        version: newVersion,
        updated_at: new Date().toISOString(),
        updated_by: adminId,
      })
      .eq('id', articleId);

    if (error) throw error;

    // Log audit event
    if (adminId) {
      await logAdminAction(
        adminId,
        AuditActions.ARTICLE_UPDATED,
        'learn_article',
        articleId,
        { version: newVersion, fields: Object.keys(updates) }
      );
    }

    return {
      success: true,
      articleId,
      message: `Article updated to version ${newVersion}`,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Delete article (soft delete by retiring)
 */
export async function deleteArticle(
  articleId: string,
  adminId?: string
): Promise<ArticleWorkflowResult> {
  return retireArticle(articleId, 'Deleted by admin', adminId);
}

// ============================================================================
// BULK OPERATIONS
// ============================================================================

/**
 * Bulk publish articles
 */
export async function bulkPublishArticles(
  articleIds: string[],
  adminId?: string
): Promise<{ succeeded: string[]; failed: string[] }> {
  const succeeded: string[] = [];
  const failed: string[] = [];

  for (const id of articleIds) {
    const result = await publishArticle(id, adminId);
    if (result.success) {
      succeeded.push(id);
    } else {
      failed.push(id);
    }
  }

  return { succeeded, failed };
}

/**
 * Bulk retire articles
 */
export async function bulkRetireArticles(
  articleIds: string[],
  reason: string,
  adminId?: string
): Promise<{ succeeded: string[]; failed: string[] }> {
  const succeeded: string[] = [];
  const failed: string[] = [];

  for (const id of articleIds) {
    const result = await retireArticle(id, reason, adminId);
    if (result.success) {
      succeeded.push(id);
    } else {
      failed.push(id);
    }
  }

  return { succeeded, failed };
}

// ============================================================================
// STATISTICS & REPORTING
// ============================================================================

/**
 * Get content statistics
 */
export async function getContentStatistics(): Promise<{
  total: number;
  byStatus: Record<string, number>;
  byTopic: Record<string, number>;
  flagged: number;
  recentlyUpdated: number;
}> {
  try {
    // Get all articles
    const { data: articles, error } = await supabase
      .from('learn_articles')
      .select('status, topic, flagged, updated_at');

    if (error) throw error;

    const stats = {
      total: articles?.length || 0,
      byStatus: {} as Record<string, number>,
      byTopic: {} as Record<string, number>,
      flagged: 0,
      recentlyUpdated: 0,
    };

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    articles?.forEach((article: any) => {
      // Count by status
      stats.byStatus[article.status] = (stats.byStatus[article.status] || 0) + 1;

      // Count by topic
      if (article.topic) {
        stats.byTopic[article.topic] = (stats.byTopic[article.topic] || 0) + 1;
      }

      // Count flagged
      if (article.flagged) {
        stats.flagged++;
      }

      // Count recently updated
      if (new Date(article.updated_at) > oneWeekAgo) {
        stats.recentlyUpdated++;
      }
    });

    return stats;
  } catch (error: any) {
    console.error('Error getting content statistics:', error);
    throw error;
  }
}

/**
 * Get review queue summary
 */
export async function getReviewQueueSummary(): Promise<{
  draft: number;
  review: number;
  flagged: number;
  oldestDraft?: Date;
  oldestReview?: Date;
}> {
  try {
    const { data: drafts } = await supabase
      .from('learn_articles')
      .select('created_at')
      .eq('status', 'draft')
      .order('created_at', { ascending: true });

    const { data: reviews } = await supabase
      .from('learn_articles')
      .select('created_at')
      .eq('status', 'review')
      .order('created_at', { ascending: true });

    const { count: flaggedCount } = await supabase
      .from('learn_articles')
      .select('*', { count: 'exact', head: true })
      .eq('flagged', true);

    return {
      draft: drafts?.length || 0,
      review: reviews?.length || 0,
      flagged: flaggedCount || 0,
      oldestDraft: drafts?.[0]?.created_at ? new Date(drafts[0].created_at) : undefined,
      oldestReview: reviews?.[0]?.created_at ? new Date(reviews[0].created_at) : undefined,
    };
  } catch (error: any) {
    console.error('Error getting review queue summary:', error);
    throw error;
  }
}

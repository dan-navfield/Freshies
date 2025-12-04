/**
 * Audit Logging Service
 * Tracks all important actions for compliance and debugging
 * Provides accountability for admin actions
 */

import { supabase } from '../../lib/supabase';

export type ActorType = 'user' | 'admin' | 'system';
export type TargetType = 
  | 'learn_article'
  | 'ai_prompt'
  | 'user'
  | 'feature_flag'
  | 'ingredient_rule'
  | 'routine_rule'
  | 'child_profile'
  | 'product';

export interface AuditEvent {
  actorType: ActorType;
  actorId?: string;
  action: string;
  targetType: TargetType;
  targetId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log an audit event
 */
export async function logAuditEvent(event: AuditEvent): Promise<void> {
  try {
    const { error } = await supabase
      .from('audit_events')
      .insert({
        actor_type: event.actorType,
        actor_id: event.actorId,
        action: event.action,
        target_type: event.targetType,
        target_id: event.targetId,
        metadata: event.metadata || {},
        ip_address: event.ipAddress,
        user_agent: event.userAgent,
      });

    if (error) {
      console.error('Failed to log audit event:', error);
    }
  } catch (error) {
    console.error('Error logging audit event:', error);
  }
}

/**
 * Log user action
 */
export async function logUserAction(
  userId: string,
  action: string,
  targetType: TargetType,
  targetId?: string,
  metadata?: Record<string, any>
): Promise<void> {
  await logAuditEvent({
    actorType: 'user',
    actorId: userId,
    action,
    targetType,
    targetId,
    metadata,
  });
}

/**
 * Log system action
 */
export async function logSystemAction(
  action: string,
  targetType: TargetType,
  targetId?: string,
  metadata?: Record<string, any>
): Promise<void> {
  await logAuditEvent({
    actorType: 'system',
    action,
    targetType,
    targetId,
    metadata,
  });
}

/**
 * Log admin action (for future admin use)
 */
export async function logAdminAction(
  adminId: string,
  action: string,
  targetType: TargetType,
  targetId?: string,
  metadata?: Record<string, any>
): Promise<void> {
  await logAuditEvent({
    actorType: 'admin',
    actorId: adminId,
    action,
    targetType,
    targetId,
    metadata,
  });
}

/**
 * Common audit actions
 */
export const AuditActions = {
  // Learn content
  ARTICLE_VIEWED: 'article_viewed',
  ARTICLE_CREATED: 'article_created',
  ARTICLE_UPDATED: 'article_updated',
  ARTICLE_PUBLISHED: 'article_published',
  ARTICLE_RETIRED: 'article_retired',
  ARTICLE_FLAGGED: 'article_flagged',

  // AI
  PROMPT_UPDATED: 'prompt_updated',
  PROMPT_ACTIVATED: 'prompt_activated',
  AI_QUERY: 'ai_query',
  AI_RESPONSE: 'ai_response',

  // Users
  USER_REGISTERED: 'user_registered',
  USER_SUSPENDED: 'user_suspended',
  USER_UNSUSPENDED: 'user_unsuspended',
  PROFILE_UPDATED: 'profile_updated',

  // Features
  FEATURE_TOGGLED: 'feature_toggled',

  // Rules
  RULE_CREATED: 'rule_created',
  RULE_UPDATED: 'rule_updated',
  RULE_DELETED: 'rule_deleted',

  // Products
  PRODUCT_SCANNED: 'product_scanned',
  PRODUCT_REVIEWED: 'product_reviewed',
} as const;

/**
 * Get audit events (for admin use)
 */
export async function getAuditEvents(filters?: {
  actorType?: ActorType;
  actorId?: string;
  targetType?: TargetType;
  targetId?: string;
  action?: string;
  limit?: number;
  offset?: number;
}): Promise<any[]> {
  try {
    let query = supabase
      .from('audit_events')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.actorType) {
      query = query.eq('actor_type', filters.actorType);
    }
    if (filters?.actorId) {
      query = query.eq('actor_id', filters.actorId);
    }
    if (filters?.targetType) {
      query = query.eq('target_type', filters.targetType);
    }
    if (filters?.targetId) {
      query = query.eq('target_id', filters.targetId);
    }
    if (filters?.action) {
      query = query.eq('action', filters.action);
    }

    query = query.limit(filters?.limit || 100);
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 100) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to get audit events:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error getting audit events:', error);
    return [];
  }
}

/**
 * Helper to track AI interactions
 */
export async function trackAIInteraction(
  userId: string,
  question: string,
  response: string,
  toolUsed: string
): Promise<void> {
  await logUserAction(
    userId,
    AuditActions.AI_QUERY,
    'ai_prompt',
    undefined,
    {
      question: question.substring(0, 500), // Truncate for storage
      response_length: response.length,
      tool_used: toolUsed,
    }
  );
}

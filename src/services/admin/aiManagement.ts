/**
 * Admin AI Management Service
 * Handles all admin operations for AI configuration
 * Future Management app will call these functions via API endpoints
 */

import { supabase } from '../../lib/supabase';
import { logAdminAction, AuditActions } from '../config/auditLogger';
import { clearPromptCache } from '../config/promptLoader';

export interface AIManagementResult {
  success: boolean;
  id?: string;
  error?: string;
  message?: string;
}

// ============================================================================
// PROMPT TEMPLATE MANAGEMENT
// ============================================================================

/**
 * Get all prompt templates
 */
export async function getAllPromptTemplates(): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('ai_prompt_templates')
      .select('*')
      .order('tool_name', { ascending: true })
      .order('version', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error: any) {
    console.error('Error fetching prompt templates:', error);
    throw error;
  }
}

/**
 * Get active prompt for a tool
 */
export async function getActivePrompt(toolName: string): Promise<any> {
  try {
    const { data, error } = await supabase
      .from('ai_prompt_templates')
      .select('*')
      .eq('tool_name', toolName)
      .eq('is_active', true)
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('Error fetching active prompt:', error);
    throw error;
  }
}

/**
 * Update prompt template (creates new version)
 */
export async function updatePromptTemplate(
  toolName: string,
  newContent: string,
  changeReason: string,
  adminId?: string
): Promise<AIManagementResult> {
  try {
    // Get current active prompt
    const { data: current } = await supabase
      .from('ai_prompt_templates')
      .select('id, version, content')
      .eq('tool_name', toolName)
      .eq('is_active', true)
      .single();

    const newVersion = (current?.version || 0) + 1;

    // Deactivate current prompt
    if (current) {
      await supabase
        .from('ai_prompt_templates')
        .update({ is_active: false })
        .eq('id', current.id);

      // Save to version history
      await supabase
        .from('ai_prompt_versions')
        .insert({
          template_id: current.id,
          version: current.version,
          content: current.content,
          changed_by: adminId,
          change_reason: changeReason,
        });
    }

    // Insert new active prompt
    const { data: newPrompt, error } = await supabase
      .from('ai_prompt_templates')
      .insert({
        tool_name: toolName,
        role: 'system',
        content: newContent,
        version: newVersion,
        is_active: true,
        created_by: adminId,
        updated_by: adminId,
      })
      .select('id')
      .single();

    if (error) throw error;

    // Clear cache to force reload
    clearPromptCache();

    // Log audit event
    if (adminId) {
      await logAdminAction(
        adminId,
        AuditActions.PROMPT_UPDATED,
        'ai_prompt',
        newPrompt.id,
        { tool_name: toolName, version: newVersion, reason: changeReason }
      );
    }

    console.log(`✅ Prompt updated for ${toolName} (v${newVersion})`);

    return {
      success: true,
      id: newPrompt.id,
      message: `Prompt updated to version ${newVersion}`,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Rollback to previous prompt version
 */
export async function rollbackPrompt(
  toolName: string,
  targetVersion: number,
  adminId?: string
): Promise<AIManagementResult> {
  try {
    // Get the target version from history
    const { data: targetPrompt } = await supabase
      .from('ai_prompt_templates')
      .select('content')
      .eq('tool_name', toolName)
      .eq('version', targetVersion)
      .single();

    if (!targetPrompt) {
      return {
        success: false,
        error: `Version ${targetVersion} not found`,
      };
    }

    // Update using the standard update function
    return await updatePromptTemplate(
      toolName,
      targetPrompt.content,
      `Rolled back to version ${targetVersion}`,
      adminId
    );
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get prompt version history
 */
export async function getPromptHistory(toolName: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('ai_prompt_templates')
      .select('*')
      .eq('tool_name', toolName)
      .order('version', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error: any) {
    console.error('Error fetching prompt history:', error);
    throw error;
  }
}

// ============================================================================
// SAFETY POLICY MANAGEMENT
// ============================================================================

/**
 * Get active safety policy
 */
export async function getActiveSafetyPolicy(): Promise<any> {
  try {
    const { data, error } = await supabase
      .from('ai_safety_policies')
      .select('*')
      .eq('is_active', true)
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('Error fetching safety policy:', error);
    throw error;
  }
}

/**
 * Update safety policy
 */
export async function updateSafetyPolicy(
  updates: {
    allow_free_form_qa?: boolean;
    max_answer_length?: number;
    forbidden_phrases?: string[];
    forbidden_patterns?: string[];
    require_disclaimer_for?: string[];
  },
  adminId?: string
): Promise<AIManagementResult> {
  try {
    // Get current active policy
    const { data: current } = await supabase
      .from('ai_safety_policies')
      .select('id, name')
      .eq('is_active', true)
      .single();

    if (!current) {
      return {
        success: false,
        error: 'No active safety policy found',
      };
    }

    // Update policy
    const { error } = await supabase
      .from('ai_safety_policies')
      .update({
        ...updates,
        updated_by: adminId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', current.id);

    if (error) throw error;

    // Log audit event
    if (adminId) {
      await logAdminAction(
        adminId,
        'safety_policy_updated',
        'ai_prompt',
        current.id,
        { fields: Object.keys(updates) }
      );
    }

    return {
      success: true,
      id: current.id,
      message: 'Safety policy updated',
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

// ============================================================================
// AI PERFORMANCE MONITORING
// ============================================================================

/**
 * Get AI usage statistics
 */
export async function getAIUsageStats(
  startDate?: Date,
  endDate?: Date
): Promise<{
  totalQueries: number;
  byTool: Record<string, number>;
  averageResponseTime?: number;
  errorRate?: number;
}> {
  try {
    let query = supabase
      .from('audit_events')
      .select('action, metadata, created_at')
      .eq('action', AuditActions.AI_QUERY);

    if (startDate) {
      query = query.gte('created_at', startDate.toISOString());
    }
    if (endDate) {
      query = query.lte('created_at', endDate.toISOString());
    }

    const { data, error } = await query;

    if (error) throw error;

    const stats = {
      totalQueries: data?.length || 0,
      byTool: {} as Record<string, number>,
    };

    data?.forEach((event: any) => {
      const tool = event.metadata?.tool_used || 'unknown';
      stats.byTool[tool] = (stats.byTool[tool] || 0) + 1;
    });

    return stats;
  } catch (error: any) {
    console.error('Error getting AI usage stats:', error);
    throw error;
  }
}

/**
 * Get most common AI queries
 */
export async function getCommonQueries(limit: number = 20): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('audit_events')
      .select('metadata')
      .eq('action', AuditActions.AI_QUERY)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data?.map((event: any) => ({
      question: event.metadata?.question,
      tool: event.metadata?.tool_used,
      timestamp: event.created_at,
    })) || [];
  } catch (error: any) {
    console.error('Error getting common queries:', error);
    throw error;
  }
}

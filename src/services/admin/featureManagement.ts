/**
 * Admin Feature Management Service
 * Handles all admin operations for feature flags
 * Future Management app will call these functions via API endpoints
 */

import { supabase } from '../../lib/supabase';
import { logAdminAction, AuditActions } from '../config/auditLogger';
import { clearFeatureFlagsCache } from '../config/featureFlags';

export interface FeatureManagementResult {
  success: boolean;
  id?: string;
  error?: string;
  message?: string;
}

// ============================================================================
// FEATURE FLAG CRUD
// ============================================================================

/**
 * Get all feature flags
 */
export async function getAllFeatureFlags(): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('feature_flags')
      .select('*')
      .order('key', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error: any) {
    console.error('Error fetching feature flags:', error);
    throw error;
  }
}

/**
 * Get feature flag by key
 */
export async function getFeatureFlag(key: string): Promise<any> {
  try {
    const { data, error } = await supabase
      .from('feature_flags')
      .select('*')
      .eq('key', key)
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('Error fetching feature flag:', error);
    throw error;
  }
}

/**
 * Create new feature flag
 */
export async function createFeatureFlag(
  flag: {
    key: string;
    name: string;
    description?: string;
    is_enabled?: boolean;
    scope?: 'global' | 'cohort' | 'user';
    target_cohort?: string[];
    target_users?: string[];
    metadata?: Record<string, any>;
  },
  adminId?: string
): Promise<FeatureManagementResult> {
  try {
    const { data, error } = await supabase
      .from('feature_flags')
      .insert({
        ...flag,
        created_by: adminId,
        updated_by: adminId,
      })
      .select('id')
      .single();

    if (error) throw error;

    // Clear cache
    clearFeatureFlagsCache();

    // Log audit event
    if (adminId) {
      await logAdminAction(
        adminId,
        'feature_flag_created',
        'feature_flag',
        data.id,
        { key: flag.key }
      );
    }

    return {
      success: true,
      id: data.id,
      message: 'Feature flag created',
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Update feature flag
 */
export async function updateFeatureFlag(
  key: string,
  updates: {
    name?: string;
    description?: string;
    is_enabled?: boolean;
    scope?: 'global' | 'cohort' | 'user';
    target_cohort?: string[];
    target_users?: string[];
    metadata?: Record<string, any>;
  },
  adminId?: string
): Promise<FeatureManagementResult> {
  try {
    const { data, error } = await supabase
      .from('feature_flags')
      .update({
        ...updates,
        updated_by: adminId,
        updated_at: new Date().toISOString(),
      })
      .eq('key', key)
      .select('id')
      .single();

    if (error) throw error;

    // Clear cache
    clearFeatureFlagsCache();

    // Log audit event
    if (adminId) {
      await logAdminAction(
        adminId,
        'feature_flag_updated',
        'feature_flag',
        data.id,
        { key, fields: Object.keys(updates) }
      );
    }

    return {
      success: true,
      id: data.id,
      message: 'Feature flag updated',
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Toggle feature flag on/off
 */
export async function toggleFeatureFlag(
  key: string,
  enabled: boolean,
  adminId?: string
): Promise<FeatureManagementResult> {
  try {
    const { data, error } = await supabase
      .from('feature_flags')
      .update({
        is_enabled: enabled,
        updated_by: adminId,
        updated_at: new Date().toISOString(),
      })
      .eq('key', key)
      .select('id')
      .single();

    if (error) throw error;

    // Clear cache
    clearFeatureFlagsCache();

    // Log audit event
    if (adminId) {
      await logAdminAction(
        adminId,
        AuditActions.FEATURE_TOGGLED,
        'feature_flag',
        data.id,
        { key, enabled }
      );
    }

    console.log(`✅ Feature flag '${key}' ${enabled ? 'enabled' : 'disabled'}`);

    return {
      success: true,
      id: data.id,
      message: `Feature flag ${enabled ? 'enabled' : 'disabled'}`,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Delete feature flag
 */
export async function deleteFeatureFlag(
  key: string,
  adminId?: string
): Promise<FeatureManagementResult> {
  try {
    const { error } = await supabase
      .from('feature_flags')
      .delete()
      .eq('key', key);

    if (error) throw error;

    // Clear cache
    clearFeatureFlagsCache();

    // Log audit event
    if (adminId) {
      await logAdminAction(
        adminId,
        'feature_flag_deleted',
        'feature_flag',
        undefined,
        { key }
      );
    }

    return {
      success: true,
      message: 'Feature flag deleted',
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

// ============================================================================
// FEATURE FLAG TARGETING
// ============================================================================

/**
 * Add user to feature flag target list
 */
export async function addUserToFeature(
  key: string,
  userId: string,
  adminId?: string
): Promise<FeatureManagementResult> {
  try {
    // Get current flag
    const { data: flag } = await supabase
      .from('feature_flags')
      .select('target_users')
      .eq('key', key)
      .single();

    if (!flag) {
      return { success: false, error: 'Feature flag not found' };
    }

    const targetUsers = flag.target_users || [];
    if (!targetUsers.includes(userId)) {
      targetUsers.push(userId);
    }

    const { error } = await supabase
      .from('feature_flags')
      .update({
        target_users: targetUsers,
        scope: 'user',
        updated_by: adminId,
      })
      .eq('key', key);

    if (error) throw error;

    // Clear cache
    clearFeatureFlagsCache();

    return {
      success: true,
      message: 'User added to feature',
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Remove user from feature flag target list
 */
export async function removeUserFromFeature(
  key: string,
  userId: string,
  adminId?: string
): Promise<FeatureManagementResult> {
  try {
    // Get current flag
    const { data: flag } = await supabase
      .from('feature_flags')
      .select('target_users')
      .eq('key', key)
      .single();

    if (!flag) {
      return { success: false, error: 'Feature flag not found' };
    }

    const targetUsers = (flag.target_users || []).filter((id: string) => id !== userId);

    const { error } = await supabase
      .from('feature_flags')
      .update({
        target_users: targetUsers,
        updated_by: adminId,
      })
      .eq('key', key);

    if (error) throw error;

    // Clear cache
    clearFeatureFlagsCache();

    return {
      success: true,
      message: 'User removed from feature',
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

// ============================================================================
// FEATURE FLAG ANALYTICS
// ============================================================================

/**
 * Get feature flag usage statistics
 */
export async function getFeatureFlagStats(): Promise<{
  total: number;
  enabled: number;
  disabled: number;
  byScope: Record<string, number>;
}> {
  try {
    const { data, error } = await supabase
      .from('feature_flags')
      .select('is_enabled, scope');

    if (error) throw error;

    const stats = {
      total: data?.length || 0,
      enabled: 0,
      disabled: 0,
      byScope: {} as Record<string, number>,
    };

    data?.forEach((flag: any) => {
      if (flag.is_enabled) {
        stats.enabled++;
      } else {
        stats.disabled++;
      }

      stats.byScope[flag.scope] = (stats.byScope[flag.scope] || 0) + 1;
    });

    return stats;
  } catch (error: any) {
    console.error('Error getting feature flag stats:', error);
    throw error;
  }
}

/**
 * Feature Flags Service
 * Enables/disables features dynamically without code deployment
 * Supports global, cohort, and user-specific flags
 */

import { supabase } from '../../lib/supabase';
import { useState, useEffect } from 'react';

interface FeatureFlag {
  key: string;
  name: string;
  description: string | null;
  is_enabled: boolean;
  scope: 'global' | 'cohort' | 'user';
  target_cohort: string[] | null;
  target_users: string[] | null;
  metadata: Record<string, any>;
}

// In-memory cache
let flagsCache: Record<string, boolean> | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

/**
 * Get all feature flags from database
 */
export async function getFeatureFlags(userId?: string): Promise<Record<string, boolean>> {
  // Check cache
  if (flagsCache && Date.now() - cacheTimestamp < CACHE_TTL) {
    return flagsCache;
  }

  try {
    const { data, error } = await supabase
      .from('feature_flags')
      .select('key, is_enabled, scope, target_users')
      .eq('is_enabled', true);

    if (error) {
      console.error('Failed to load feature flags:', error);
      return getDefaultFlags();
    }

    if (!data) {
      return getDefaultFlags();
    }

    // Build flags object
    const flags: Record<string, boolean> = {};
    
    data.forEach((flag: any) => {
      // Global flags are enabled for everyone
      if (flag.scope === 'global') {
        flags[flag.key] = true;
      }
      // User-specific flags
      else if (flag.scope === 'user' && userId && flag.target_users?.includes(userId)) {
        flags[flag.key] = true;
      }
    });

    // Cache the result
    flagsCache = flags;
    cacheTimestamp = Date.now();

    return flags;
  } catch (error) {
    console.error('Error loading feature flags:', error);
    return getDefaultFlags();
  }
}

/**
 * Check if a specific feature is enabled
 */
export async function isFeatureEnabled(key: string, userId?: string): Promise<boolean> {
  const flags = await getFeatureFlags(userId);
  return flags[key] || false;
}

/**
 * React hook for feature flags
 */
export function useFeatureFlag(key: string, userId?: string): boolean {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadFlag() {
      const isEnabled = await isFeatureEnabled(key, userId);
      if (mounted) {
        setEnabled(isEnabled);
        setLoading(false);
      }
    }

    loadFlag();

    return () => {
      mounted = false;
    };
  }, [key, userId]);

  return enabled;
}

/**
 * React hook for all feature flags
 */
export function useFeatureFlags(userId?: string): {
  flags: Record<string, boolean>;
  loading: boolean;
  isEnabled: (key: string) => boolean;
} {
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadFlags() {
      const loadedFlags = await getFeatureFlags(userId);
      if (mounted) {
        setFlags(loadedFlags);
        setLoading(false);
      }
    }

    loadFlags();

    // Refresh every 2 minutes
    const interval = setInterval(loadFlags, CACHE_TTL);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [userId]);

  const isEnabled = (key: string) => flags[key] || false;

  return { flags, loading, isEnabled };
}

/**
 * Clear feature flags cache
 */
export function clearFeatureFlagsCache(): void {
  flagsCache = null;
  cacheTimestamp = 0;
}

/**
 * Default flags (fallback if database fails)
 */
function getDefaultFlags(): Record<string, boolean> {
  return {
    freshies_ai_chat: true,
    product_scanning: true,
    learn_content: true,
    routine_builder: false,
  };
}

/**
 * Admin function to toggle a feature flag
 * (For future admin use)
 */
export async function toggleFeatureFlag(
  key: string,
  enabled: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('feature_flags')
      .update({ is_enabled: enabled })
      .eq('key', key);

    if (error) {
      return { success: false, error: error.message };
    }

    // Clear cache
    clearFeatureFlagsCache();

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Family Management Types
 * Types for parent-child relationships, permissions, and family settings
 */

export type SafetyTier = 'strict' | 'moderate' | 'relaxed';
export type ChildStatus = 'pending' | 'active' | 'paused';
export type DeviceStatus = 'linked' | 'pending' | 'unlinked';

export interface Child {
  id: string;
  user_id?: string; // Supabase user ID if child has account
  parent_id: string;
  first_name: string;
  last_name?: string;
  nickname?: string;
  date_of_birth: string;
  age: number;
  avatar_url?: string;
  status: ChildStatus;
  safety_tier: SafetyTier;
  independence_level: number; // 1-5, how much they can do without approval
  created_at: string;
  updated_at: string;
}

export interface ChildProfile extends Child {
  // Extended profile with computed fields
  display_name: string;
  needs_approval_count: number;
  recent_scans_count: number;
  flagged_products_count: number;
  device_status: DeviceStatus;
}

export interface FamilyGroup {
  id: string;
  parent_id: string;
  name: string; // e.g., "Smith Family"
  created_at: string;
  updated_at: string;
}

export interface ChildDevice {
  id: string;
  child_id: string;
  device_name: string;
  device_type: 'ios' | 'android' | 'web';
  device_id: string;
  status: DeviceStatus;
  last_active: string;
  linked_at: string;
}

export interface ChildPermissions {
  id: string;
  child_id: string;
  can_scan_without_approval: boolean;
  can_add_to_routine: boolean;
  can_search_products: boolean;
  can_view_ingredients: boolean;
  can_access_learn: boolean;
  can_chat_with_ai: boolean;
  requires_approval_for_flagged: boolean;
  max_daily_scans?: number;
  created_at: string;
  updated_at: string;
}

export interface ChildInvitation {
  id: string;
  parent_id: string;
  child_email?: string;
  child_phone?: string;
  invitation_code: string;
  status: 'pending' | 'accepted' | 'expired';
  expires_at: string;
  created_at: string;
}

export interface FamilyActivity {
  id: string;
  child_id: string;
  activity_type: 'scan' | 'search' | 'routine_add' | 'approval_request' | 'flag';
  product_id?: string;
  product_name?: string;
  description: string;
  requires_attention: boolean;
  created_at: string;
}

export interface SafetySettings {
  tier: SafetyTier;
  label: string;
  description: string;
  color: string;
  auto_approve_safe: boolean;
  auto_flag_risky: boolean;
  block_age_inappropriate: boolean;
  require_approval_threshold: number; // 0-100, safety score threshold
}

export const SAFETY_TIERS: Record<SafetyTier, SafetySettings> = {
  strict: {
    tier: 'strict',
    label: 'Strict',
    description: 'Maximum safety, all products require approval',
    color: '#EF4444',
    auto_approve_safe: false,
    auto_flag_risky: true,
    block_age_inappropriate: true,
    require_approval_threshold: 90,
  },
  moderate: {
    tier: 'moderate',
    label: 'Moderate',
    description: 'Balanced approach, flag concerning products',
    color: '#F59E0B',
    auto_approve_safe: true,
    auto_flag_risky: true,
    block_age_inappropriate: true,
    require_approval_threshold: 70,
  },
  relaxed: {
    tier: 'relaxed',
    label: 'Relaxed',
    description: 'More independence, notify on major concerns',
    color: '#10B981',
    auto_approve_safe: true,
    auto_flag_risky: false,
    block_age_inappropriate: false,
    require_approval_threshold: 50,
  },
};

export interface IndependenceLevel {
  level: number;
  label: string;
  description: string;
  typical_age_range: string;
}

export const INDEPENDENCE_LEVELS: IndependenceLevel[] = [
  {
    level: 1,
    label: 'Full Supervision',
    description: 'Parent reviews everything before child sees results',
    typical_age_range: '6-8 years',
  },
  {
    level: 2,
    label: 'Guided',
    description: 'Child can browse but needs approval for actions',
    typical_age_range: '9-11 years',
  },
  {
    level: 3,
    label: 'Monitored',
    description: 'Child can add safe products, parent notified of flags',
    typical_age_range: '12-14 years',
  },
  {
    level: 4,
    label: 'Semi-Independent',
    description: 'Child manages routine, parent sees summary',
    typical_age_range: '15-16 years',
  },
  {
    level: 5,
    label: 'Independent',
    description: 'Full access, parent receives alerts only',
    typical_age_range: '17+ years',
  },
];

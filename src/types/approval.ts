/**
 * Product Approval Types
 * Types for parent approval queue and product review system
 */

export type ApprovalStatus = 'pending' | 'approved' | 'declined' | 'expired';
export type ApprovalType = 'scan' | 'search' | 'routine_add' | 'manual';
export type FlagSeverity = 'info' | 'caution' | 'warning' | 'danger';

export interface ProductApproval {
  id: string;
  child_id: string;
  parent_id: string;
  product_id?: string;
  product_name: string;
  product_brand?: string;
  product_image_url?: string;
  approval_type: ApprovalType;
  status: ApprovalStatus;
  requested_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  parent_notes?: string;
  child_notes?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ProductFlag {
  id: string;
  approval_id: string;
  flag_type: string; // 'age_inappropriate', 'allergen', 'harsh_ingredient', 'safety_concern'
  severity: FlagSeverity;
  title: string;
  description: string;
  ingredient?: string;
  recommendation?: string;
  created_at: string;
}

export interface ApprovalWithDetails extends ProductApproval {
  child_name: string;
  child_age: number;
  child_avatar_url?: string;
  flags: ProductFlag[];
  flag_count: number;
  highest_severity: FlagSeverity;
}

export interface ApprovalStats {
  total_pending: number;
  total_approved: number;
  total_declined: number;
  pending_by_child: Record<string, number>;
  flagged_count: number;
}

export interface ApprovalAction {
  approval_id: string;
  action: 'approve' | 'decline';
  parent_notes?: string;
  add_to_routine?: boolean;
  notify_child?: boolean;
}

export const FLAG_TYPES = {
  AGE_INAPPROPRIATE: {
    type: 'age_inappropriate',
    icon: '🔞',
    color: '#FF3B30',
    label: 'Age Inappropriate',
  },
  ALLERGEN: {
    type: 'allergen',
    icon: '⚠️',
    color: '#FF9500',
    label: 'Potential Allergen',
  },
  HARSH_INGREDIENT: {
    type: 'harsh_ingredient',
    icon: '⚡',
    color: '#FF9500',
    label: 'Harsh Ingredient',
  },
  SAFETY_CONCERN: {
    type: 'safety_concern',
    icon: '🛡️',
    color: '#FF3B30',
    label: 'Safety Concern',
  },
  FRAGRANCE: {
    type: 'fragrance',
    icon: '🌸',
    color: '#FF9500',
    label: 'Contains Fragrance',
  },
  SENSITIVE_SKIN: {
    type: 'sensitive_skin',
    icon: '💧',
    color: '#34C759',
    label: 'May Irritate Sensitive Skin',
  },
} as const;

export const SEVERITY_CONFIG = {
  info: {
    color: '#007AFF',
    label: 'Info',
    icon: 'ℹ️',
  },
  caution: {
    color: '#FF9500',
    label: 'Caution',
    icon: '⚠️',
  },
  warning: {
    color: '#FF9500',
    label: 'Warning',
    icon: '⚠️',
  },
  danger: {
    color: '#FF3B30',
    label: 'Danger',
    icon: '🚫',
  },
} as const;

/**
 * Activity Timeline Types
 * Types for tracking child activity and parent monitoring
 */

export type ActivityType = 
  | 'product_scan'
  | 'product_search'
  | 'approval_request'
  | 'approval_received'
  | 'routine_update'
  | 'routine_complete'
  | 'article_view'
  | 'ingredient_search'
  | 'profile_update';

export type ActivityCategory = 'product' | 'routine' | 'learning' | 'approval' | 'profile';

export interface Activity {
  id: string;
  child_id: string;
  activity_type: ActivityType;
  category: ActivityCategory;
  title: string;
  description?: string;
  metadata?: Record<string, any>; // Flexible JSON for activity-specific data
  created_at: string;
}

export interface ActivityWithChild extends Activity {
  child_name: string;
  child_age: number;
  child_avatar_url?: string;
}

export interface ActivityGroup {
  date: string; // YYYY-MM-DD
  display_date: string; // "Today", "Yesterday", "Jan 15"
  activities: ActivityWithChild[];
  count: number;
}

export interface ActivityStats {
  total_today: number;
  total_week: number;
  by_child: Record<string, number>;
  by_category: Record<ActivityCategory, number>;
  most_active_child?: string;
}

export interface ActivityFilter {
  child_id?: string;
  category?: ActivityCategory;
  activity_type?: ActivityType;
  date_from?: string;
  date_to?: string;
}

// Activity type configurations
export const ACTIVITY_CONFIG = {
  product_scan: {
    icon: '📷',
    color: '#8B7AB8',
    category: 'product' as ActivityCategory,
    label: 'Scanned Product',
  },
  product_search: {
    icon: '🔍',
    color: '#8B7AB8',
    category: 'product' as ActivityCategory,
    label: 'Searched Product',
  },
  approval_request: {
    icon: '📝',
    color: '#FF9500',
    category: 'approval' as ActivityCategory,
    label: 'Requested Approval',
  },
  approval_received: {
    icon: '✅',
    color: '#BFF2E6',
    category: 'approval' as ActivityCategory,
    label: 'Approval Received',
  },
  routine_update: {
    icon: '✏️',
    color: '#E7D9FF',
    category: 'routine' as ActivityCategory,
    label: 'Updated Routine',
  },
  routine_complete: {
    icon: '🎯',
    color: '#BFF2E6',
    category: 'routine' as ActivityCategory,
    label: 'Completed Routine',
  },
  article_view: {
    icon: '📚',
    color: '#FFDFB9',
    category: 'learning' as ActivityCategory,
    label: 'Read Article',
  },
  ingredient_search: {
    icon: '🧪',
    color: '#FFDFB9',
    category: 'learning' as ActivityCategory,
    label: 'Searched Ingredient',
  },
  profile_update: {
    icon: '👤',
    color: '#8B7AB8',
    category: 'profile' as ActivityCategory,
    label: 'Updated Profile',
  },
} as const;

// Category configurations
export const CATEGORY_CONFIG = {
  product: {
    label: 'Products',
    icon: '🧴',
    color: '#8B7AB8',
  },
  routine: {
    label: 'Routines',
    icon: '✨',
    color: '#E7D9FF',
  },
  learning: {
    label: 'Learning',
    icon: '📚',
    color: '#FFDFB9',
  },
  approval: {
    label: 'Approvals',
    icon: '✅',
    color: '#FF9500',
  },
  profile: {
    label: 'Profile',
    icon: '👤',
    color: '#8B7AB8',
  },
} as const;

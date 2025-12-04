/**
 * Child Products & Routines Types
 */

export interface ChildProduct {
  id: string;
  child_id: string;
  approval_id?: string;
  product_id?: string;
  product_name: string;
  product_brand?: string;
  product_image_url?: string;
  product_category?: string;
  status: 'active' | 'discontinued' | 'removed';
  first_used_at?: string;
  last_used_at?: string;
  usage_count: number;
  parent_notes?: string;
  child_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ChildRoutine {
  id: string;
  child_id: string;
  name: string;
  routine_type: 'morning' | 'evening' | 'custom';
  description?: string;
  enabled: boolean;
  reminder_time?: string;
  reminder_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface RoutineProduct {
  id: string;
  routine_id: string;
  product_id: string;
  step_order: number;
  instructions?: string;
  created_at: string;
}

export interface RoutineWithProducts extends ChildRoutine {
  products: (RoutineProduct & { product: ChildProduct })[];
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'approval' | 'routine' | 'product' | 'system';
  title: string;
  message: string;
  related_id?: string;
  related_type?: string;
  read: boolean;
  read_at?: string;
  action_url?: string;
  action_label?: string;
  created_at: string;
}

export interface ProductUsageLog {
  id: string;
  child_id: string;
  product_id: string;
  routine_id?: string;
  used_at: string;
  notes?: string;
  reaction?: 'good' | 'neutral' | 'bad';
  reaction_notes?: string;
}

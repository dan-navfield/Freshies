/**
 * Family Management Service
 * Handles family groups, children, permissions, and invitations
 */

import { supabase } from '../../../lib/supabase';
import { Child, ChildProfile, FamilyGroup, ChildPermissions, ChildInvitation, SafetyTier } from '../../../types/family';

/**
 * Get or create family group for parent
 */
export async function getOrCreateFamilyGroup(parentId: string): Promise<FamilyGroup | null> {
  try {
    // Check if family group exists
    const { data: existing, error: fetchError } = await supabase
      .from('family_groups')
      .select('*')
      .eq('parent_id', parentId)
      .single();

    if (existing) {
      return existing;
    }

    // Create new family group
    const { data: newGroup, error: createError } = await supabase
      .from('family_groups')
      .insert({
        parent_id: parentId,
        name: 'My Family',
      })
      .select()
      .single();

    if (createError) throw createError;
    return newGroup;
  } catch (error) {
    console.error('Error getting/creating family group:', error);
    return null;
  }
}

/**
 * Get all children for a parent
 */
export async function getChildren(parentId: string): Promise<ChildProfile[]> {
  try {
    const { data, error } = await supabase
      .from('managed_children')
      .select(`
        *,
        child_permissions (*),
        child_devices (*)
      `)
      .eq('parent_id', parentId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Fetch stats for each child
    const childrenWithStats = await Promise.all((data || []).map(async (child: any) => {
      // Get pending approvals count - explicitly filter by parent_id to ensure RLS works
      const { count: approvalsCount, error: approvalsError } = await supabase
        .from('product_approvals')
        .select('*', { count: 'exact', head: true })
        .eq('child_id', child.id)
        .eq('parent_id', parentId)
        .eq('status', 'pending');
      
      if (approvalsError) {
        console.error('❌ Error fetching approvals count for child:', child.first_name, approvalsError);
      }
      console.log(`📊 Approvals count for ${child.first_name} (child_id: ${child.id}):`, approvalsCount);

      // Get recent scans (last 7 days)
      const { count: scansCount } = await supabase
        .from('child_activities')
        .select('*', { count: 'exact', head: true })
        .eq('child_id', child.id)
        .eq('activity_type', 'product_scan')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      // Get flagged products count
      const { data: flaggedData } = await supabase
        .from('product_approvals')
        .select('id, product_flags(id)')
        .eq('child_id', child.id)
        .eq('status', 'pending');

      const flaggedCount = (flaggedData || []).filter((approval: any) => 
        approval.product_flags && approval.product_flags.length > 0
      ).length;

      return {
        ...child,
        display_name: child.nickname || child.first_name,
        needs_approval_count: approvalsCount || 0,
        recent_scans_count: scansCount || 0,
        flagged_products_count: flaggedCount,
        device_status: child.child_devices?.[0]?.status || 'unlinked',
      };
    }));

    return childrenWithStats;
  } catch (error) {
    console.error('Error fetching children:', error);
    return [];
  }
}

/**
 * Add a new child
 */
export async function addChild(parentId: string, childData: {
  first_name: string;
  last_name?: string;
  nickname?: string;
  date_of_birth: string;
  safety_tier?: SafetyTier;
  independence_level?: number;
}): Promise<Child | null> {
  try {
    // Calculate age from date of birth
    const birthDate = new Date(childData.date_of_birth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    const { data, error } = await supabase
      .from('managed_children')
      .insert({
        parent_id: parentId,
        first_name: childData.first_name,
        last_name: childData.last_name,
        nickname: childData.nickname,
        date_of_birth: childData.date_of_birth,
        age,
        status: 'active',
        safety_tier: childData.safety_tier || 'moderate',
        independence_level: childData.independence_level || 2,
      })
      .select()
      .single();

    if (error) throw error;

    // Create default permissions
    if (data) {
      await createDefaultPermissions(data.id, age);
    }

    return data;
  } catch (error) {
    console.error('Error adding child:', error);
    return null;
  }
}

/**
 * Update child profile
 */
export async function updateChild(childId: string, updates: Partial<Child>): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('managed_children')
      .update(updates)
      .eq('id', childId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating child:', error);
    return false;
  }
}

/**
 * Delete child
 */
export async function deleteChild(childId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('managed_children')
      .delete()
      .eq('id', childId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting child:', error);
    return false;
  }
}

/**
 * Create default permissions for a child based on age
 */
async function createDefaultPermissions(childId: string, age: number): Promise<void> {
  try {
    // Age-appropriate defaults
    const permissions: Partial<ChildPermissions> = {
      child_id: childId,
      can_scan_without_approval: age >= 12,
      can_add_to_routine: age >= 10,
      can_search_products: age >= 9,
      can_view_ingredients: true,
      can_access_learn: true,
      can_chat_with_ai: age >= 11,
      requires_approval_for_flagged: true,
      max_daily_scans: age < 10 ? 10 : undefined,
    };

    await supabase
      .from('child_permissions')
      .insert(permissions);
  } catch (error) {
    console.error('Error creating default permissions:', error);
  }
}

/**
 * Get child permissions
 */
export async function getChildPermissions(childId: string): Promise<ChildPermissions | null> {
  try {
    const { data, error } = await supabase
      .from('child_permissions')
      .select('*')
      .eq('child_id', childId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching child permissions:', error);
    return null;
  }
}

/**
 * Update child permissions
 */
export async function updateChildPermissions(
  childId: string,
  permissions: Partial<ChildPermissions>
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('child_permissions')
      .update(permissions)
      .eq('child_id', childId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating child permissions:', error);
    return false;
  }
}

/**
 * Generate invitation code for child to link device
 */
export async function generateChildInvitation(
  parentId: string,
  childEmail?: string
): Promise<ChildInvitation | null> {
  try {
    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Expires in 7 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { data, error } = await supabase
      .from('child_invitations')
      .insert({
        parent_id: parentId,
        child_email: childEmail,
        invitation_code: code,
        status: 'pending',
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error generating invitation:', error);
    return null;
  }
}

/**
 * Get child by ID
 */
export async function getChildById(childId: string): Promise<ChildProfile | null> {
  try {
    const { data, error } = await supabase
      .from('managed_children')
      .select(`
        *,
        child_permissions (*),
        child_devices (*)
      `)
      .eq('id', childId)
      .single();

    if (error) throw error;

    return {
      ...data,
      display_name: data.nickname || data.first_name,
      needs_approval_count: 0,
      recent_scans_count: 0,
      flagged_products_count: 0,
      device_status: data.child_devices?.[0]?.status || 'unlinked',
    };
  } catch (error) {
    console.error('Error fetching child:', error);
    return null;
  }
}

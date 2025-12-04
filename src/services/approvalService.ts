/**
 * Product Approval Service
 * Handles approval queue, review actions, and flag management
 */

import { supabase } from '../lib/supabase';
import { 
  ProductApproval, 
  ApprovalWithDetails, 
  ApprovalStats, 
  ApprovalAction,
  ProductFlag 
} from '../types/approval';

/**
 * Get all pending approvals for a parent
 */
export async function getPendingApprovals(parentId: string): Promise<ApprovalWithDetails[]> {
  try {
    const { data, error } = await supabase
      .from('product_approvals')
      .select(`
        *,
        children (
          first_name,
          age,
          avatar_url
        ),
        product_flags (*)
      `)
      .eq('parent_id', parentId)
      .eq('status', 'pending')
      .order('requested_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((approval: any) => ({
      ...approval,
      child_name: approval.children?.first_name || 'Unknown',
      child_age: approval.children?.age || 0,
      child_avatar_url: approval.children?.avatar_url,
      flags: approval.product_flags || [],
      flag_count: approval.product_flags?.length || 0,
      highest_severity: getHighestSeverity(approval.product_flags || []),
    }));
  } catch (error) {
    console.error('Error fetching pending approvals:', error);
    return [];
  }
}

/**
 * Get approvals for a specific child
 */
export async function getChildApprovals(
  childId: string, 
  status?: string
): Promise<ApprovalWithDetails[]> {
  try {
    let query = supabase
      .from('product_approvals')
      .select(`
        *,
        children (
          first_name,
          age,
          avatar_url
        ),
        product_flags (*)
      `)
      .eq('child_id', childId)
      .order('requested_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data || []).map((approval: any) => ({
      ...approval,
      child_name: approval.children?.first_name || 'Unknown',
      child_age: approval.children?.age || 0,
      child_avatar_url: approval.children?.avatar_url,
      flags: approval.product_flags || [],
      flag_count: approval.product_flags?.length || 0,
      highest_severity: getHighestSeverity(approval.product_flags || []),
    }));
  } catch (error) {
    console.error('Error fetching child approvals:', error);
    return [];
  }
}

/**
 * Get approval statistics for parent dashboard
 */
export async function getApprovalStats(parentId: string): Promise<ApprovalStats> {
  try {
    const { data, error } = await supabase
      .from('product_approvals')
      .select('status, child_id, product_flags(severity)')
      .eq('parent_id', parentId);

    if (error) throw error;

    const stats: ApprovalStats = {
      total_pending: 0,
      total_approved: 0,
      total_declined: 0,
      pending_by_child: {},
      flagged_count: 0,
    };

    (data || []).forEach((approval: any) => {
      if (approval.status === 'pending') {
        stats.total_pending++;
        stats.pending_by_child[approval.child_id] = 
          (stats.pending_by_child[approval.child_id] || 0) + 1;
      } else if (approval.status === 'approved') {
        stats.total_approved++;
      } else if (approval.status === 'declined') {
        stats.total_declined++;
      }

      if (approval.product_flags && approval.product_flags.length > 0) {
        stats.flagged_count++;
      }
    });

    return stats;
  } catch (error) {
    console.error('Error fetching approval stats:', error);
    return {
      total_pending: 0,
      total_approved: 0,
      total_declined: 0,
      pending_by_child: {},
      flagged_count: 0,
    };
  }
}

/**
 * Approve a product
 */
export async function approveProduct(action: ApprovalAction): Promise<boolean> {
  try {
    // Get the approval details first
    const { data: approval, error: fetchError } = await supabase
      .from('product_approvals')
      .select(`
        *,
        children (
          id,
          user_id,
          first_name
        )
      `)
      .eq('id', action.approval_id)
      .single();

    if (fetchError) throw fetchError;
    if (!approval) throw new Error('Approval not found');

    // Update approval status
    const { error: updateError } = await supabase
      .from('product_approvals')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewed_by: (await supabase.auth.getUser()).data.user?.id,
        parent_notes: action.parent_notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', action.approval_id);

    if (updateError) throw updateError;

    // 1. Add to child's product library
    const { addChildProduct } = await import('./productsService');
    const childProduct = await addChildProduct(
      approval.child_id,
      action.approval_id,
      {
        product_id: approval.product_id,
        product_name: approval.product_name,
        product_brand: approval.product_brand,
        product_image_url: approval.product_image_url,
        parent_notes: action.parent_notes,
      }
    );

    // 2. Add to routine if requested
    if (action.add_to_routine && childProduct) {
      const { getChildRoutines, addProductToRoutine } = await import('./routinesService');
      const routines = await getChildRoutines(approval.child_id);
      
      // Add to morning routine by default
      const morningRoutine = routines.find(r => r.routine_type === 'morning');
      if (morningRoutine) {
        await addProductToRoutine(morningRoutine.id, childProduct.id);
      }
    }

    // 3. Send notification to child
    if (action.notify_child && approval.children?.user_id) {
      const { sendApprovalNotification } = await import('./notificationsService');
      await sendApprovalNotification(
        approval.children.user_id,
        approval.product_name,
        true,
        action.parent_notes
      );
    }

    // 4. Create approval history record
    await supabase
      .from('approval_history')
      .insert({
        approval_id: action.approval_id,
        action: 'approved',
        performed_by: (await supabase.auth.getUser()).data.user?.id,
        notes: action.parent_notes,
        performed_at: new Date().toISOString(),
      });

    return true;
  } catch (error) {
    console.error('Error approving product:', error);
    return false;
  }
}

/**
 * Decline a product
 */
export async function declineProduct(action: ApprovalAction): Promise<boolean> {
  try {
    // Get the approval details first
    const { data: approval, error: fetchError } = await supabase
      .from('product_approvals')
      .select(`
        *,
        children (
          id,
          user_id,
          first_name
        )
      `)
      .eq('id', action.approval_id)
      .single();

    if (fetchError) throw fetchError;
    if (!approval) throw new Error('Approval not found');

    // Update approval status
    const { error: updateError } = await supabase
      .from('product_approvals')
      .update({
        status: 'declined',
        reviewed_at: new Date().toISOString(),
        reviewed_by: (await supabase.auth.getUser()).data.user?.id,
        parent_notes: action.parent_notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', action.approval_id);

    if (updateError) throw updateError;

    // 1. Send notification to child with reason
    if (action.notify_child && approval.children?.user_id) {
      const { sendApprovalNotification } = await import('./notificationsService');
      await sendApprovalNotification(
        approval.children.user_id,
        approval.product_name,
        false,
        action.parent_notes
      );
    }

    // 2. Create approval history record
    await supabase
      .from('approval_history')
      .insert({
        approval_id: action.approval_id,
        action: 'declined',
        performed_by: (await supabase.auth.getUser()).data.user?.id,
        notes: action.parent_notes,
        performed_at: new Date().toISOString(),
      });

    return true;
  } catch (error) {
    console.error('Error declining product:', error);
    return false;
  }
}

/**
 * Create a new approval request (typically from child app)
 */
export async function createApprovalRequest(
  childId: string,
  parentId: string,
  productData: {
    product_id?: string;
    product_name: string;
    product_brand?: string;
    product_image_url?: string;
    approval_type: string;
    child_notes?: string;
  }
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('product_approvals')
      .insert({
        child_id: childId,
        parent_id: parentId,
        ...productData,
        status: 'pending',
        requested_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) throw error;
    return data?.id || null;
  } catch (error) {
    console.error('Error creating approval request:', error);
    return null;
  }
}

/**
 * Add flags to an approval
 */
export async function addProductFlags(
  approvalId: string,
  flags: Omit<ProductFlag, 'id' | 'approval_id' | 'created_at'>[]
): Promise<boolean> {
  try {
    const flagsToInsert = flags.map(flag => ({
      approval_id: approvalId,
      ...flag,
    }));

    const { error } = await supabase
      .from('product_flags')
      .insert(flagsToInsert);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error adding product flags:', error);
    return false;
  }
}

/**
 * Get highest severity from flags
 */
function getHighestSeverity(flags: ProductFlag[]): 'info' | 'caution' | 'warning' | 'danger' {
  if (flags.length === 0) return 'info';
  
  const severityOrder: Record<string, number> = { danger: 4, warning: 3, caution: 2, info: 1 };
  
  return flags.reduce((highest, flag) => {
    return (severityOrder[flag.severity] || 0) > (severityOrder[highest] || 0)
      ? flag.severity 
      : highest;
  }, 'info' as 'info' | 'caution' | 'warning' | 'danger');
}

/**
 * Expire old pending approvals
 */
export async function expireOldApprovals(): Promise<void> {
  try {
    await supabase.rpc('expire_old_approvals');
  } catch (error) {
    console.error('Error expiring old approvals:', error);
  }
}

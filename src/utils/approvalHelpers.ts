/**
 * Parent Approval Helpers
 * Functions for creating and managing approval requests
 */

import { supabase } from '../lib/supabase';

export interface ApprovalRequest {
  id: string;
  child_profile_id: string;
  routine_step_id?: string;
  product_id?: string;
  request_type: 'add_product' | 'remove_step' | 'reorder' | 'new_routine';
  request_details: any;
  status: 'pending' | 'approved' | 'declined';
  created_at: string;
}

/**
 * Create an approval request for a new product in routine
 */
export async function requestProductApproval(
  childProfileId: string,
  routineStepId: string,
  productId: string,
  productDetails: {
    name: string;
    brand: string;
    step_type: string;
  }
): Promise<{ success: boolean; requestId?: string; error?: string }> {
  try {
    // Create approval request
    const { data: request, error: requestError } = await supabase
      .from('routine_approval_requests')
      .insert({
        child_profile_id: childProfileId,
        routine_step_id: routineStepId,
        product_id: productId,
        request_type: 'add_product',
        request_details: {
          product_name: productDetails.name,
          product_brand: productDetails.brand,
          step_type: productDetails.step_type,
        },
        status: 'pending',
      })
      .select()
      .single();

    if (requestError) throw requestError;

    // Get parent ID
    const { data: childProfile } = await supabase
      .from('child_profiles')
      .select('parent_id')
      .eq('id', childProfileId)
      .single();

    if (childProfile?.parent_id) {
      // Create notification for parent
      await createNotification({
        userId: childProfile.parent_id,
        type: 'approval',
        title: 'Product Approval Request',
        message: `Your child wants to add ${productDetails.brand} ${productDetails.name} to their routine`,
        relatedId: request.id,
        relatedType: 'approval_request',
        actionUrl: `/approvals/${request.id}`,
        actionLabel: 'Review',
      });
    }

    return { success: true, requestId: request.id };
  } catch (error) {
    console.error('Error requesting product approval:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Create an approval request for a new routine
 */
export async function requestRoutineApproval(
  childProfileId: string,
  routineId: string,
  routineDetails: {
    name: string;
    stepCount: number;
  }
): Promise<{ success: boolean; requestId?: string; error?: string }> {
  try {
    const { data: request, error: requestError } = await supabase
      .from('routine_approval_requests')
      .insert({
        child_profile_id: childProfileId,
        request_type: 'new_routine',
        request_details: {
          routine_id: routineId,
          routine_name: routineDetails.name,
          step_count: routineDetails.stepCount,
        },
        status: 'pending',
      })
      .select()
      .single();

    if (requestError) throw requestError;

    // Get parent ID
    const { data: childProfile } = await supabase
      .from('child_profiles')
      .select('parent_id')
      .eq('id', childProfileId)
      .single();

    if (childProfile?.parent_id) {
      await createNotification({
        userId: childProfile.parent_id,
        type: 'approval',
        title: 'New Routine Created',
        message: `Your child created a new routine: ${routineDetails.name}`,
        relatedId: request.id,
        relatedType: 'approval_request',
        actionUrl: `/approvals/${request.id}`,
        actionLabel: 'Review',
      });
    }

    return { success: true, requestId: request.id };
  } catch (error) {
    console.error('Error requesting routine approval:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Approve an approval request
 */
export async function approveRequest(
  requestId: string,
  parentId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Update approval request
    const { data: request, error: updateError } = await supabase
      .from('routine_approval_requests')
      .update({
        status: 'approved',
        responded_by: parentId,
        responded_at: new Date().toISOString(),
      })
      .eq('id', requestId)
      .select()
      .single();

    if (updateError) throw updateError;

    // If it's a product approval, update the routine step
    if (request.routine_step_id) {
      await supabase
        .from('routine_steps')
        .update({
          parent_approved: true,
          parent_approved_by: parentId,
          parent_approved_at: new Date().toISOString(),
        })
        .eq('id', request.routine_step_id);
    }

    // Notify child
    const { data: childProfile } = await supabase
      .from('child_profiles')
      .select('user_id')
      .eq('id', request.child_profile_id)
      .single();

    if (childProfile?.user_id) {
      await createNotification({
        userId: childProfile.user_id,
        type: 'approval',
        title: 'Request Approved! 🎉',
        message: 'Your parent approved your request',
        relatedId: requestId,
        relatedType: 'approval_request',
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error approving request:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Decline an approval request
 */
export async function declineRequest(
  requestId: string,
  parentId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: request, error: updateError } = await supabase
      .from('routine_approval_requests')
      .update({
        status: 'declined',
        responded_by: parentId,
        responded_at: new Date().toISOString(),
        parent_response: reason,
      })
      .eq('id', requestId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Notify child
    const { data: childProfile } = await supabase
      .from('child_profiles')
      .select('user_id')
      .eq('id', request.child_profile_id)
      .single();

    if (childProfile?.user_id) {
      await createNotification({
        userId: childProfile.user_id,
        type: 'approval',
        title: 'Request Declined',
        message: reason || 'Your parent declined your request',
        relatedId: requestId,
        relatedType: 'approval_request',
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error declining request:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Create a notification
 */
async function createNotification(params: {
  userId: string;
  type: 'approval' | 'routine' | 'product' | 'system';
  title: string;
  message: string;
  relatedId?: string;
  relatedType?: string;
  actionUrl?: string;
  actionLabel?: string;
}): Promise<void> {
  try {
    await supabase.from('notifications').insert({
      user_id: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      related_id: params.relatedId,
      related_type: params.relatedType,
      action_url: params.actionUrl,
      action_label: params.actionLabel,
      read: false,
    });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
}

/**
 * Get pending approval requests for a parent
 */
export async function getPendingApprovals(
  parentId: string
): Promise<ApprovalRequest[]> {
  try {
    const { data, error } = await supabase
      .from('routine_approval_requests')
      .select(`
        *,
        child_profiles!inner(
          parent_id,
          display_name
        )
      `)
      .eq('child_profiles.parent_id', parentId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting pending approvals:', error);
    return [];
  }
}

/**
 * Get unread notifications for a user
 */
export async function getUnreadNotifications(
  userId: string
): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Error getting unread notifications:', error);
    return 0;
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationRead(
  notificationId: string
): Promise<void> {
  try {
    await supabase
      .from('notifications')
      .update({
        read: true,
        read_at: new Date().toISOString(),
      })
      .eq('id', notificationId);
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
}

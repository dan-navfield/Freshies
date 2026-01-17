/**
 * Notifications Service
 * Manages in-app notifications
 */

import { supabase } from '../../lib/supabase';
import { Notification } from '../../types/products';

/**
 * Create a notification
 */
export async function createNotification(
  userId: string,
  type: 'approval' | 'routine' | 'product' | 'system' | 'achievement' | 'streak' | 'parent',
  title: string,
  message: string,
  options?: {
    related_id?: string;
    related_type?: string;
    action_url?: string;
    action_label?: string;
  }
): Promise<Notification | null> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type: type,
        title: title,
        message: message,
        ...options,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
}

/**
 * Get notifications for a user
 */
export async function getNotifications(
  userId: string,
  unreadOnly: boolean = false
): Promise<Notification[]> {
  try {
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (unreadOnly) {
      query = query.eq('read', false);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({
        read: true,
        read_at: new Date().toISOString(),
      })
      .eq('id', notificationId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({
        read: true,
        read_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return false;
  }
}

/**
 * Get unread notification count
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Error fetching unread notification count:', error);
    return 0;
  }
}

/**
 * Delete notification
 */
export async function deleteNotification(notificationId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting notification:', error);
    return false;
  }
}

/**
 * Helper: Send approval notification to child
 */
export async function sendApprovalNotification(
  childUserId: string,
  productName: string,
  approved: boolean,
  parentNotes?: string
): Promise<boolean> {
  const title = approved 
    ? `✅ ${productName} Approved!`
    : `❌ ${productName} Not Approved`;
  
  const message = approved
    ? `Great news! You can now use ${productName}.${parentNotes ? ` Note: ${parentNotes}` : ''}`
    : `${productName} wasn't approved this time.${parentNotes ? ` Reason: ${parentNotes}` : ''}`;

  const notification = await createNotification(
    childUserId,
    'approval',
    title,
    message,
    {
      action_url: approved ? '/products' : '/approvals',
      action_label: approved ? 'View Product' : 'View Details',
    }
  );

  return notification !== null;
}

/**
 * Helper: Send routine reminder notification
 */
export async function sendRoutineReminder(
  childUserId: string,
  routineName: string,
  routineId: string
): Promise<boolean> {
  const notification = await createNotification(
    childUserId,
    'routine',
    `Time for ${routineName}!`,
    `Don't forget to complete your ${routineName.toLowerCase()}.`,
    {
      related_id: routineId,
      related_type: 'routine',
      action_url: `/routines/${routineId}`,
      action_label: 'Start Routine',
    }
  );

  return notification !== null;
}

/**
 * Helper: Send achievement unlock notification
 */
export async function sendAchievementNotification(
  childUserId: string,
  achievementName: string,
  achievementId: string,
  points: number
): Promise<boolean> {
  const notification = await createNotification(
    childUserId,
    'achievement',
    `🏆 Achievement Unlocked!`,
    `You earned "${achievementName}" and got +${points} points!`,
    {
      related_id: achievementId,
      related_type: 'achievement',
      action_url: '/(child)/achievements-enhanced',
      action_label: 'View Achievement',
    }
  );

  return notification !== null;
}

/**
 * Helper: Send streak milestone notification
 */
export async function sendStreakNotification(
  childUserId: string,
  streakDays: number,
  streakType: string = 'daily'
): Promise<boolean> {
  const notification = await createNotification(
    childUserId,
    'streak',
    `🔥 ${streakDays} Day Streak!`,
    `Amazing! You've kept your ${streakType} routine streak going for ${streakDays} days!`,
    {
      related_type: 'streak',
      action_url: '/(child)/progress',
      action_label: 'View Progress',
    }
  );

  return notification !== null;
}

/**
 * Helper: Send parent message notification
 */
export async function sendParentMessageNotification(
  childUserId: string,
  parentName: string,
  message: string
): Promise<boolean> {
  const notification = await createNotification(
    childUserId,
    'parent',
    `Message from ${parentName}`,
    message,
    {
      related_type: 'parent_message',
      action_url: '/(child)/account',
      action_label: 'View',
    }
  );

  return notification !== null;
}

/**
 * Helper: Send family reaction notification
 */
export async function sendFamilyReactionNotification(
  childUserId: string,
  familyMemberName: string,
  achievementTitle: string,
  reactionType: string,
  achievementId: string
): Promise<boolean> {
  const reactionLabels: Record<string, string> = {
    celebrate: 'celebrated',
    proud: 'is proud of',
    awesome: 'thinks is awesome',
    keep_going: 'cheered you on for',
  };

  const reactionLabel = reactionLabels[reactionType] || 'reacted to';
  
  const notification = await createNotification(
    childUserId,
    'parent',
    `${familyMemberName} ${reactionLabel} your achievement! 🎉`,
    `"${achievementTitle}"`,
    {
      related_id: achievementId,
      related_type: 'family_reaction',
      action_url: '/(child)/learn/stats',
      action_label: 'View Achievement',
    }
  );

  return notification !== null;
}

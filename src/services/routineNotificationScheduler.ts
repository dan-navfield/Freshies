/**
 * Routine Notification Scheduler
 * Schedules local push notifications for routine reminders
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import { sendRoutineReminder } from '../notifications';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

interface RoutineSchedule {
  routineId: string;
  routineName: string;
  segment: 'morning' | 'afternoon' | 'evening';
  activeDays: number[]; // 0-6 (Monday-Sunday)
  reminderTime?: string; // HH:MM format
  enabled: boolean;
}

/**
 * Request notification permissions
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Notification permissions not granted');
      return false;
    }

    // Configure notification channel for Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('routines', {
        name: 'Routine Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#8133F6',
        sound: 'default',
      });
    }

    return true;
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
}

/**
 * Get default reminder time for a routine segment
 */
function getDefaultReminderTime(segment: 'morning' | 'afternoon' | 'evening'): string {
  switch (segment) {
    case 'morning':
      return '07:30'; // 7:30 AM
    case 'afternoon':
      return '15:00'; // 3:00 PM
    case 'evening':
      return '19:30'; // 7:30 PM
    default:
      return '08:00';
  }
}

/**
 * Schedule notifications for a single routine
 */
export async function scheduleRoutineNotifications(
  childUserId: string,
  routine: RoutineSchedule
): Promise<string[]> {
  try {
    if (!routine.enabled) {
      return [];
    }

    const notificationIds: string[] = [];
    const reminderTime = routine.reminderTime || getDefaultReminderTime(routine.segment);
    const [hours, minutes] = reminderTime.split(':').map(Number);

    // Schedule a notification for each active day
    for (const dayOfWeek of routine.activeDays) {
      const trigger: Notifications.CalendarTriggerInput = {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        weekday: dayOfWeek === 6 ? 1 : dayOfWeek + 2, // Convert to Expo's format (1=Sunday, 2=Monday, etc.)
        hour: hours,
        minute: minutes,
        repeats: true,
      };

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: `Time for ${routine.routineName}! 🌟`,
          body: `Ready to complete your ${routine.segment} routine?`,
          data: {
            routineId: routine.routineId,
            segment: routine.segment,
            type: 'routine_reminder',
          },
          sound: 'default',
          badge: 1,
          categoryIdentifier: 'routine',
        },
        trigger,
      });

      notificationIds.push(notificationId);

      // In-app notification will be created when the push notification is received
    }

    console.log(`✅ Scheduled ${notificationIds.length} notifications for ${routine.routineName}`);
    return notificationIds;
  } catch (error) {
    console.error('Error scheduling routine notifications:', error);
    return [];
  }
}

/**
 * Cancel all notifications for a routine
 */
export async function cancelRoutineNotifications(notificationIds: string[]): Promise<void> {
  try {
    for (const id of notificationIds) {
      await Notifications.cancelScheduledNotificationAsync(id);
    }
    console.log(`✅ Cancelled ${notificationIds.length} notifications`);
  } catch (error) {
    console.error('Error cancelling notifications:', error);
  }
}

/**
 * Cancel all routine notifications
 */
export async function cancelAllRoutineNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('✅ Cancelled all routine notifications');
  } catch (error) {
    console.error('Error cancelling all notifications:', error);
  }
}

/**
 * Get all scheduled notifications
 */
export async function getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error getting scheduled notifications:', error);
    return [];
  }
}

/**
 * Schedule notifications for all active routines
 */
export async function scheduleAllRoutineNotifications(
  childProfileId: string,
  childUserId: string
): Promise<void> {
  try {
    // Cancel existing notifications first
    await cancelAllRoutineNotifications();

    // Get all active routines for the child
    const { data: routines, error } = await supabase
      .from('custom_routines')
      .select('*')
      .eq('child_profile_id', childProfileId)
      .eq('is_active', true);

    if (error) throw error;

    if (!routines || routines.length === 0) {
      console.log('No active routines to schedule');
      return;
    }

    // Get notification settings
    const { data: settings } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('child_profile_id', childProfileId)
      .single();

    const notificationsEnabled = settings?.routine_reminders_enabled ?? true;

    if (!notificationsEnabled) {
      console.log('Routine notifications disabled in settings');
      return;
    }

    // Schedule notifications for each routine
    for (const routine of routines) {
      const schedule: RoutineSchedule = {
        routineId: routine.id,
        routineName: routine.name,
        segment: routine.segment,
        activeDays: routine.active_days || [0, 1, 2, 3, 4, 5, 6], // Default to all days
        reminderTime: settings?.[`${routine.segment}_reminder_time`],
        enabled: true,
      };

      await scheduleRoutineNotifications(childUserId, schedule);
    }

    console.log(`✅ Scheduled notifications for ${routines.length} routines`);
  } catch (error) {
    console.error('Error scheduling all routine notifications:', error);
  }
}

/**
 * Handle notification response (when user taps notification)
 */
export function setupNotificationResponseHandler(
  onRoutineNotification: (routineId: string, segment: string) => void
): void {
  Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data;
    
    if (data.type === 'routine_reminder' && data.routineId) {
      onRoutineNotification(data.routineId, data.segment);
    }
  });
}

/**
 * Update reminder time for a specific segment
 */
export async function updateSegmentReminderTime(
  childProfileId: string,
  childUserId: string,
  segment: 'morning' | 'afternoon' | 'evening',
  time: string // HH:MM format
): Promise<boolean> {
  try {
    // Update in database
    const updateData: any = {
      child_profile_id: childProfileId,
    };
    updateData[`${segment}_reminder_time`] = time;
    
    const { error } = await supabase
      .from('notification_settings')
      .upsert(updateData);

    if (error) throw error;

    // Reschedule all notifications
    await scheduleAllRoutineNotifications(childProfileId, childUserId);

    return true;
  } catch (error) {
    console.error('Error updating reminder time:', error);
    return false;
  }
}

/**
 * Toggle routine notifications on/off
 */
export async function toggleRoutineNotifications(
  childProfileId: string,
  childUserId: string,
  enabled: boolean
): Promise<boolean> {
  try {
    // Update in database
    const { error } = await supabase
      .from('notification_settings')
      .upsert({
        child_profile_id: childProfileId,
        routine_reminders_enabled: enabled,
      });

    if (error) throw error;

    if (enabled) {
      // Schedule notifications
      await scheduleAllRoutineNotifications(childProfileId, childUserId);
    } else {
      // Cancel all notifications
      await cancelAllRoutineNotifications();
    }

    return true;
  } catch (error) {
    console.error('Error toggling routine notifications:', error);
    return false;
  }
}

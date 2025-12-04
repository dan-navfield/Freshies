/**
 * Reminder System
 * Manages local notifications for routine reminders
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from '../../lib/supabase';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface RoutineReminder {
  id: string;
  child_profile_id: string;
  segment: 'morning' | 'afternoon' | 'evening';
  reminder_time: string; // HH:MM format
  is_enabled: boolean;
  days_of_week: number[]; // [0,1,2,3,4,5,6] for Sun-Sat
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
      await Notifications.setNotificationChannelAsync('routine-reminders', {
        name: 'Routine Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#8B7AB8',
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
 * Schedule a routine reminder
 */
export async function scheduleRoutineReminder(
  reminder: RoutineReminder
): Promise<{ success: boolean; notificationIds?: string[] }> {
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      return { success: false };
    }

    // Parse time
    const [hours, minutes] = reminder.reminder_time.split(':').map(Number);

    // Cancel existing notifications for this reminder
    await cancelReminderNotifications(reminder.id);

    // Schedule notifications for each day of the week
    const notificationIds: string[] = [];

    for (const dayOfWeek of reminder.days_of_week) {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: getSegmentTitle(reminder.segment),
          body: getSegmentMessage(reminder.segment),
          data: {
            reminderId: reminder.id,
            segment: reminder.segment,
            type: 'routine_reminder',
          },
          sound: 'default',
          badge: 1,
        },
        trigger: {
          hour: hours,
          minute: minutes,
          weekday: dayOfWeek + 1, // Expo uses 1-7 for Sun-Sat
          repeats: true,
        },
      });

      notificationIds.push(notificationId);
    }

    // Store notification IDs in database for later cancellation
    await supabase
      .from('routine_reminders')
      .update({
        notification_ids: notificationIds,
      })
      .eq('id', reminder.id);

    return { success: true, notificationIds };
  } catch (error) {
    console.error('Error scheduling reminder:', error);
    return { success: false };
  }
}

/**
 * Cancel reminder notifications
 */
export async function cancelReminderNotifications(
  reminderId: string
): Promise<void> {
  try {
    // Get notification IDs from database
    const { data: reminder } = await supabase
      .from('routine_reminders')
      .select('notification_ids')
      .eq('id', reminderId)
      .single();

    if (reminder?.notification_ids) {
      for (const notificationId of reminder.notification_ids) {
        await Notifications.cancelScheduledNotificationAsync(notificationId);
      }
    }
  } catch (error) {
    console.error('Error canceling reminder notifications:', error);
  }
}

/**
 * Create or update a reminder
 */
export async function saveReminder(
  childProfileId: string,
  segment: 'morning' | 'afternoon' | 'evening',
  time: string,
  daysOfWeek: number[],
  enabled: boolean = true
): Promise<{ success: boolean; reminder?: RoutineReminder }> {
  try {
    // Check if reminder exists
    const { data: existing } = await supabase
      .from('routine_reminders')
      .select('*')
      .eq('child_profile_id', childProfileId)
      .eq('segment', segment)
      .single();

    let reminder: RoutineReminder;

    if (existing) {
      // Update existing
      const { data, error } = await supabase
        .from('routine_reminders')
        .update({
          reminder_time: time,
          days_of_week: daysOfWeek,
          is_enabled: enabled,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      reminder = data;
    } else {
      // Create new
      const { data, error } = await supabase
        .from('routine_reminders')
        .insert({
          child_profile_id: childProfileId,
          segment,
          reminder_time: time,
          days_of_week: daysOfWeek,
          is_enabled: enabled,
        })
        .select()
        .single();

      if (error) throw error;
      reminder = data;
    }

    // Schedule notifications if enabled
    if (enabled) {
      await scheduleRoutineReminder(reminder);
    } else {
      await cancelReminderNotifications(reminder.id);
    }

    return { success: true, reminder };
  } catch (error) {
    console.error('Error saving reminder:', error);
    return { success: false };
  }
}

/**
 * Get all reminders for a child
 */
export async function getReminders(
  childProfileId: string
): Promise<RoutineReminder[]> {
  try {
    const { data, error } = await supabase
      .from('routine_reminders')
      .select('*')
      .eq('child_profile_id', childProfileId)
      .order('segment');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting reminders:', error);
    return [];
  }
}

/**
 * Toggle reminder on/off
 */
export async function toggleReminder(
  reminderId: string,
  enabled: boolean
): Promise<{ success: boolean }> {
  try {
    const { data: reminder, error } = await supabase
      .from('routine_reminders')
      .update({ is_enabled: enabled })
      .eq('id', reminderId)
      .select()
      .single();

    if (error) throw error;

    if (enabled) {
      await scheduleRoutineReminder(reminder);
    } else {
      await cancelReminderNotifications(reminderId);
    }

    return { success: true };
  } catch (error) {
    console.error('Error toggling reminder:', error);
    return { success: false };
  }
}

/**
 * Send immediate test notification
 */
export async function sendTestNotification(
  segment: 'morning' | 'afternoon' | 'evening'
): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: getSegmentTitle(segment),
        body: getSegmentMessage(segment),
        data: { type: 'test' },
      },
      trigger: null, // Send immediately
    });
  } catch (error) {
    console.error('Error sending test notification:', error);
  }
}

/**
 * Schedule smart reminders based on routine completion patterns
 */
export async function scheduleSmartReminders(
  childProfileId: string
): Promise<void> {
  try {
    // Get completion history to find optimal times
    const { data: completions } = await supabase
      .from('routine_completions')
      .select('segment, completed_at')
      .eq('child_profile_id', childProfileId)
      .gte('completion_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('completed_at');

    if (!completions || completions.length === 0) {
      // No history, use default times
      await saveReminder(childProfileId, 'morning', '08:00', [1, 2, 3, 4, 5], true);
      await saveReminder(childProfileId, 'evening', '20:00', [1, 2, 3, 4, 5], true);
      return;
    }

    // Analyze completion patterns by segment
    const patterns: Record<string, Date[]> = {
      morning: [],
      afternoon: [],
      evening: [],
    };

    completions.forEach((c) => {
      patterns[c.segment]?.push(new Date(c.completed_at));
    });

    // Calculate average completion time for each segment
    for (const [segment, times] of Object.entries(patterns)) {
      if (times.length === 0) continue;

      const avgHour = Math.round(
        times.reduce((sum, t) => sum + t.getHours(), 0) / times.length
      );
      const avgMinute = Math.round(
        times.reduce((sum, t) => sum + t.getMinutes(), 0) / times.length
      );

      // Set reminder 30 minutes before average completion time
      const reminderHour = avgHour > 0 ? avgHour - 1 : 23;
      const reminderMinute = avgMinute >= 30 ? avgMinute - 30 : avgMinute + 30;

      const timeString = `${String(reminderHour).padStart(2, '0')}:${String(reminderMinute).padStart(2, '0')}`;

      await saveReminder(
        childProfileId,
        segment as 'morning' | 'afternoon' | 'evening',
        timeString,
        [1, 2, 3, 4, 5], // Weekdays
        true
      );
    }
  } catch (error) {
    console.error('Error scheduling smart reminders:', error);
  }
}

/**
 * Handle notification response (when user taps notification)
 */
export function setupNotificationListener(
  onNotificationPress: (data: any) => void
): () => void {
  const subscription = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      const data = response.notification.request.content.data;
      onNotificationPress(data);
    }
  );

  return () => subscription.remove();
}

/**
 * Get notification badge count
 */
export async function getBadgeCount(): Promise<number> {
  try {
    return await Notifications.getBadgeCountAsync();
  } catch (error) {
    return 0;
  }
}

/**
 * Clear notification badge
 */
export async function clearBadge(): Promise<void> {
  try {
    await Notifications.setBadgeCountAsync(0);
  } catch (error) {
    console.error('Error clearing badge:', error);
  }
}

// Helper functions
function getSegmentTitle(segment: string): string {
  switch (segment) {
    case 'morning':
      return '☀️ Morning Routine Time!';
    case 'afternoon':
      return '🌤️ Afternoon Routine Time!';
    case 'evening':
      return '🌙 Evening Routine Time!';
    default:
      return '✨ Routine Time!';
  }
}

function getSegmentMessage(segment: string): string {
  const messages = {
    morning: [
      'Start your day fresh! Time for your morning routine 🌸',
      'Good morning! Let\'s take care of your skin ✨',
      'Rise and shine! Your skin is waiting 🌟',
    ],
    afternoon: [
      'Quick refresh! Time for your afternoon routine 🌺',
      'Midday glow-up time! ☀️',
      'Don\'t forget your afternoon skincare! 💫',
    ],
    evening: [
      'Wind down with your evening routine 🌙',
      'Time to wash away the day! 🌸',
      'Sweet dreams start with clean skin! ✨',
    ],
  };

  const options = messages[segment as keyof typeof messages] || messages.morning;
  return options[Math.floor(Math.random() * options.length)];
}

/**
 * Get suggested reminder times based on age band
 */
export function getSuggestedTimes(ageBand: string): Record<string, string> {
  switch (ageBand) {
    case '10-12':
      return {
        morning: '07:30',
        afternoon: '15:30',
        evening: '20:00',
      };
    case '13-15':
      return {
        morning: '07:00',
        afternoon: '16:00',
        evening: '21:00',
      };
    case '16-18':
      return {
        morning: '07:00',
        afternoon: '16:30',
        evening: '22:00',
      };
    default:
      return {
        morning: '08:00',
        afternoon: '16:00',
        evening: '20:00',
      };
  }
}

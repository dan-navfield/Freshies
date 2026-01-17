import * as Notifications from 'expo-notifications';
import { supabase } from '../lib/supabase';
import { requestNotificationPermissions } from './routineNotificationScheduler';

const EXPIRY_NOTIFICATION_TYPE = 'expiry_reminder';

class ExpiryNotificationService {
    /**
     * Schedule expiry notifications for a list of shelf items
     * Cancels existing expiry notifications first to avoid duplicates
     */
    async scheduleExpiryNotifications(
        childProfileId: string,
        shelfItems: any[]
    ): Promise<void> {
        try {
            // 1. Check permissions first
            const hasPermission = await requestNotificationPermissions();
            if (!hasPermission) {
                console.log('Notification permissions denied, skipping expiry scheduling');
                return;
            }

            // 2. Get settings to check if enabled
            const { data: settings } = await supabase
                .from('notification_settings')
                .select('expiry_alerts_enabled')
                .eq('child_profile_id', childProfileId)
                .single();

            // Default to true if setting doesn't exist yet
            if (settings && settings.expiry_alerts_enabled === false) {
                console.log('Expiry alerts disabled via settings');
                await this.cancelAllExpiryNotifications(); // Ensure clear
                return;
            }

            // 3. Cancel existing expiry notifications
            await this.cancelAllExpiryNotifications();

            // 4. Filter items with expiry dates
            const expiringItems = shelfItems.filter(
                item => item.expiry_date && item.status === 'active'
            );

            if (expiringItems.length === 0) return;

            console.log(`Scheduling expiry checks for ${expiringItems.length} items`);

            // 5. Schedule notifications
            // Limit to 40 to be safe (iOS limit is 64 total local notifications)
            // We prioritize imminent expiry
            const notificationsToSchedule: Array<{
                title: string;
                body: string;
                date: Date;
                itemId: string;
            }> = [];

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            for (const item of expiringItems) {
                const expiryDate = new Date(item.expiry_date);
                expiryDate.setHours(9, 0, 0, 0); // Default to 9 AM

                if (isNaN(expiryDate.getTime())) continue;

                const diffTime = expiryDate.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                // Skip if already expired
                if (diffDays < 0) continue;

                // Schedule: 7 Days Before
                if (diffDays >= 7) {
                    const warnDate7 = new Date(expiryDate);
                    warnDate7.setDate(warnDate7.getDate() - 7);
                    notificationsToSchedule.push({
                        title: 'Product Expiring Soon! 📅',
                        body: `${item.product_name} expires in 1 week. Time to use it up!`,
                        date: warnDate7,
                        itemId: item.id
                    });
                }

                // Schedule: 1 Day Before
                if (diffDays >= 1) {
                    const warnDate1 = new Date(expiryDate);
                    warnDate1.setDate(warnDate1.getDate() - 1);
                    notificationsToSchedule.push({
                        title: 'Expiring Tomorrow! ⏰',
                        body: `${item.product_name} expires tomorrow! Last chance to use it.`,
                        date: warnDate1,
                        itemId: item.id
                    });
                }

                // Schedule: Day Of (if mostly unused?)
                // Optional, but might be annoying if 1 Day already fired. 
                // Let's stick to 7d and 1d.
            }

            // Sort by date (nearest first) to prioritize limited slots
            notificationsToSchedule.sort((a, b) => a.date.getTime() - b.date.getTime());

            // Take top 30 to leave room for Routine reminders
            const limitedNotifications = notificationsToSchedule.slice(0, 30);

            for (const notif of limitedNotifications) {
                // Skip past dates (double check)
                if (notif.date < new Date()) continue;

                await Notifications.scheduleNotificationAsync({
                    content: {
                        title: notif.title,
                        body: notif.body,
                        data: {
                            type: EXPIRY_NOTIFICATION_TYPE,
                            itemId: notif.itemId
                        },
                        sound: 'default'
                    },
                    trigger: {
                        type: Notifications.SchedulableTriggerInputTypes.DATE,
                        date: notif.date
                    }
                });
            }

            console.log(`✅ Scheduled ${limitedNotifications.length} expiry notifications`);

        } catch (error) {
            console.error('Error scheduling expiry notifications:', error);
        }
    }

    /**
     * Cancel all expiry-related notifications
     */
    async cancelAllExpiryNotifications(): Promise<void> {
        try {
            const scheduled = await Notifications.getAllScheduledNotificationsAsync();

            const expiryNotifications = scheduled.filter(
                n => n.content.data?.type === EXPIRY_NOTIFICATION_TYPE
            );

            for (const n of expiryNotifications) {
                await Notifications.cancelScheduledNotificationAsync(n.identifier);
            }

            if (expiryNotifications.length > 0) {
                console.log(`Cancelled ${expiryNotifications.length} existing expiry notifications`);
            }
        } catch (error) {
            console.error('Error cancelling expiry notifications:', error);
        }
    }
}

export const expiryNotificationService = new ExpiryNotificationService();

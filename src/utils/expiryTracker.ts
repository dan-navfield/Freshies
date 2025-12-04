/**
 * Product Expiry Tracking Automation
 * Monitors product expiry dates and sends alerts
 */

import { supabase } from '../../lib/supabase';
import * as Notifications from 'expo-notifications';

export interface ExpiryAlert {
  id: string;
  product_name: string;
  product_brand: string;
  expiry_date: string;
  days_until_expiry: number;
  step_id: string;
  severity: 'expired' | 'critical' | 'warning' | 'info';
}

/**
 * Check all products for expiry and send alerts
 */
export async function checkProductExpiry(
  childProfileId: string
): Promise<ExpiryAlert[]> {
  try {
    const today = new Date();
    const alerts: ExpiryAlert[] = [];

    // Get active routine
    const { data: routine } = await supabase
      .from('child_routines')
      .select('id')
      .eq('child_profile_id', childProfileId)
      .eq('is_active', true)
      .single();

    if (!routine) return [];

    // Get all routine steps with expiry dates
    const { data: steps } = await supabase
      .from('routine_steps')
      .select(`
        id,
        title,
        expiry_date,
        product_id,
        scraped_products:product_id (
          name,
          brand
        )
      `)
      .eq('routine_id', routine.id)
      .eq('is_active', true)
      .not('expiry_date', 'is', null);

    if (!steps) return [];

    // Check each step for expiry
    for (const step of steps) {
      if (!step.expiry_date) continue;

      const expiryDate = new Date(step.expiry_date);
      const daysUntilExpiry = Math.floor(
        (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      let severity: ExpiryAlert['severity'];
      if (daysUntilExpiry < 0) {
        severity = 'expired';
      } else if (daysUntilExpiry <= 7) {
        severity = 'critical';
      } else if (daysUntilExpiry <= 30) {
        severity = 'warning';
      } else if (daysUntilExpiry <= 60) {
        severity = 'info';
      } else {
        continue; // Don't alert for products expiring in more than 60 days
      }

      alerts.push({
        id: step.id,
        product_name: step.scraped_products?.name || step.title,
        product_brand: step.scraped_products?.brand || 'Unknown',
        expiry_date: step.expiry_date,
        days_until_expiry: daysUntilExpiry,
        step_id: step.id,
        severity,
      });
    }

    // Send notifications for critical/expired products
    for (const alert of alerts) {
      if (alert.severity === 'expired' || alert.severity === 'critical') {
        await sendExpiryNotification(childProfileId, alert);
      }
    }

    return alerts.sort((a, b) => a.days_until_expiry - b.days_until_expiry);
  } catch (error) {
    console.error('Error checking product expiry:', error);
    return [];
  }
}

/**
 * Send expiry notification
 */
async function sendExpiryNotification(
  childProfileId: string,
  alert: ExpiryAlert
): Promise<void> {
  try {
    // Check if we've already sent a notification for this product recently
    const { data: recentNotif } = await supabase
      .from('expiry_notifications')
      .select('id')
      .eq('step_id', alert.step_id)
      .gte('sent_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .single();

    if (recentNotif) return; // Don't spam notifications

    // Get child's user_id for notification
    const { data: profile } = await supabase
      .from('child_profiles')
      .select('user_id, parent_id')
      .eq('id', childProfileId)
      .single();

    if (!profile) return;

    const title = alert.severity === 'expired' 
      ? '⚠️ Product Expired!'
      : '⏰ Product Expiring Soon';
    
    const message = alert.severity === 'expired'
      ? `Your ${alert.product_brand} ${alert.product_name} has expired. Ask your parent for a replacement!`
      : `Your ${alert.product_brand} ${alert.product_name} expires in ${alert.days_until_expiry} days. Time to get a new one!`;

    // Send push notification to child
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body: message,
        data: {
          type: 'expiry_alert',
          step_id: alert.step_id,
          severity: alert.severity,
        },
      },
      trigger: null, // Send immediately
    });

    // Create in-app notification for child
    await supabase.from('notifications').insert({
      user_id: profile.user_id,
      type: 'product',
      title,
      message,
      related_id: alert.step_id,
      related_type: 'routine_step',
    });

    // Notify parent if product is expired
    if (alert.severity === 'expired' && profile.parent_id) {
      await supabase.from('notifications').insert({
        user_id: profile.parent_id,
        type: 'product',
        title: 'Product Expired in Child\'s Routine',
        message: `${alert.product_brand} ${alert.product_name} in your child's routine has expired and needs replacement.`,
        related_id: alert.step_id,
        related_type: 'routine_step',
        action_url: `/child-routine/${childProfileId}`,
        action_label: 'View Routine',
      });
    }

    // Log that we sent this notification
    await supabase.from('expiry_notifications').insert({
      step_id: alert.step_id,
      child_profile_id: childProfileId,
      severity: alert.severity,
      sent_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error sending expiry notification:', error);
  }
}

/**
 * Auto-update expiry dates based on product opening date
 * (Most skincare products last 6-12 months after opening)
 */
export async function calculateExpiryFromOpening(
  productType: string,
  openedDate: Date
): Promise<Date> {
  // Default shelf life by product type (in months)
  const shelfLife: Record<string, number> = {
    cleanser: 12,
    moisturiser: 12,
    sunscreen: 12, // Very important - sunscreen degrades!
    treatment: 6, // Active ingredients degrade faster
    toner: 12,
    serum: 6,
    mask: 12,
  };

  const months = shelfLife[productType] || 12;
  const expiryDate = new Date(openedDate);
  expiryDate.setMonth(expiryDate.getMonth() + months);
  
  return expiryDate;
}

/**
 * Suggest replacement products for expired items
 */
export async function suggestReplacements(
  expiredStepId: string
): Promise<any[]> {
  try {
    // Get the expired step details
    const { data: step } = await supabase
      .from('routine_steps')
      .select(`
        step_type,
        product_id,
        scraped_products:product_id (
          brand,
          category
        )
      `)
      .eq('id', expiredStepId)
      .single();

    if (!step) return [];

    // Find similar products
    const { data: suggestions } = await supabase
      .from('scraped_products')
      .select('*')
      .eq('category', step.scraped_products?.category)
      .limit(5);

    return suggestions || [];
  } catch (error) {
    console.error('Error suggesting replacements:', error);
    return [];
  }
}

/**
 * Schedule daily expiry check
 * Call this when the app starts
 */
export async function scheduleExpiryChecks(
  childProfileId: string
): Promise<void> {
  try {
    // Schedule daily notification at 9 AM to check expiry
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Checking your products...',
        body: 'Making sure everything is fresh! 🌸',
        data: {
          type: 'expiry_check',
          child_profile_id: childProfileId,
        },
      },
      trigger: {
        hour: 9,
        minute: 0,
        repeats: true,
      },
    });
  } catch (error) {
    console.error('Error scheduling expiry checks:', error);
  }
}

/**
 * Get expiry summary for dashboard
 */
export async function getExpirySummary(
  childProfileId: string
): Promise<{
  expired: number;
  expiringSoon: number;
  needsAttention: ExpiryAlert[];
}> {
  const alerts = await checkProductExpiry(childProfileId);
  
  return {
    expired: alerts.filter(a => a.severity === 'expired').length,
    expiringSoon: alerts.filter(a => a.severity === 'critical').length,
    needsAttention: alerts.filter(a => 
      a.severity === 'expired' || a.severity === 'critical'
    ),
  };
}

/**
 * Mark product as replaced
 */
export async function markProductReplaced(
  stepId: string,
  newExpiryDate: Date
): Promise<{ success: boolean }> {
  try {
    await supabase
      .from('routine_steps')
      .update({
        expiry_date: newExpiryDate.toISOString().split('T')[0],
        updated_at: new Date().toISOString(),
      })
      .eq('id', stepId);

    // Clear old expiry notifications
    await supabase
      .from('expiry_notifications')
      .delete()
      .eq('step_id', stepId);

    return { success: true };
  } catch (error) {
    console.error('Error marking product as replaced:', error);
    return { success: false };
  }
}

/**
 * Create expiry_notifications table (run this SQL in Supabase)
 */
export const EXPIRY_NOTIFICATIONS_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS expiry_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  step_id UUID REFERENCES routine_steps(id) ON DELETE CASCADE,
  child_profile_id UUID REFERENCES child_profiles(id) ON DELETE CASCADE,
  severity TEXT NOT NULL CHECK (severity IN ('expired', 'critical', 'warning', 'info')),
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(step_id, sent_at::date)
);

CREATE INDEX IF NOT EXISTS idx_expiry_notifications_step ON expiry_notifications(step_id);
CREATE INDEX IF NOT EXISTS idx_expiry_notifications_sent ON expiry_notifications(sent_at);
`;

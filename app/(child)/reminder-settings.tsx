import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Sun, Moon, Sunrise, Bell, BellOff } from 'lucide-react-native';
import { colors, spacing, radii } from '../../src/theme/tokens';
import { useAuth } from '../../src/contexts/AuthContext';
import { StyleSheet } from 'react-native';
import {
  getReminders,
  saveReminder,
  toggleReminder,
  sendTestNotification,
  requestNotificationPermissions,
  getSuggestedTimes,
  type RoutineReminder,
} from '../../src/utils/reminderHelpers';
import { supabase } from '../../src/lib/supabase';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function ReminderSettingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [reminders, setReminders] = useState<Record<string, RoutineReminder | null>>({
    morning: null,
    afternoon: null,
    evening: null,
  });
  const [loading, setLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);
  const [ageBand, setAgeBand] = useState('10-12');

  useEffect(() => {
    loadReminders();
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    const granted = await requestNotificationPermissions();
    setHasPermission(granted);
  };

  const loadReminders = async () => {
    if (!user?.id) return;

    try {
      // Get child profile for age band
      const { data: profile } = await supabase
        .from('child_profiles')
        .select('id, age_band')
        .eq('user_id', user.id)
        .single();

      if (!profile) return;
      setAgeBand(profile.age_band || '10-12');

      // Get existing reminders
      const existingReminders = await getReminders(profile.id);
      
      const reminderMap: Record<string, RoutineReminder | null> = {
        morning: null,
        afternoon: null,
        evening: null,
      };

      existingReminders.forEach((r) => {
        reminderMap[r.segment] = r;
      });

      setReminders(reminderMap);
    } catch (error) {
      console.error('Error loading reminders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleReminder = async (segment: string, enabled: boolean) => {
    const reminder = reminders[segment];
    
    if (!reminder) {
      // Create new reminder with suggested time
      const { data: profile } = await supabase
        .from('child_profiles')
        .select('id')
        .eq('user_id', user!.id)
        .single();

      if (!profile) return;

      const suggestedTimes = getSuggestedTimes(ageBand);
      const result = await saveReminder(
        profile.id,
        segment as any,
        suggestedTimes[segment],
        [1, 2, 3, 4, 5], // Weekdays
        enabled
      );

      if (result.success && result.reminder) {
        setReminders(prev => ({ ...prev, [segment]: result.reminder! }));
      }
    } else {
      // Toggle existing reminder
      const result = await toggleReminder(reminder.id, enabled);
      if (result.success) {
        setReminders(prev => ({
          ...prev,
          [segment]: { ...reminder, is_enabled: enabled },
        }));
      }
    }
  };

  const handleToggleDay = async (segment: string, dayIndex: number) => {
    const reminder = reminders[segment];
    if (!reminder) return;

    const newDays = reminder.days_of_week.includes(dayIndex)
      ? reminder.days_of_week.filter(d => d !== dayIndex)
      : [...reminder.days_of_week, dayIndex].sort();

    if (newDays.length === 0) {
      Alert.alert('Oops!', 'You need at least one day selected');
      return;
    }

    const { data: profile } = await supabase
      .from('child_profiles')
      .select('id')
      .eq('user_id', user!.id)
      .single();

    if (!profile) return;

    const result = await saveReminder(
      profile.id,
      segment as any,
      reminder.reminder_time,
      newDays,
      reminder.is_enabled
    );

    if (result.success && result.reminder) {
      setReminders(prev => ({ ...prev, [segment]: result.reminder! }));
    }
  };

  const handleTestNotification = async (segment: string) => {
    if (!hasPermission) {
      Alert.alert(
        'Notifications Disabled',
        'Please enable notifications in your device settings to receive reminders.'
      );
      return;
    }

    await sendTestNotification(segment as any);
    Alert.alert('Test Sent!', 'Check your notifications 📱');
  };

  const getSegmentIcon = (segment: string) => {
    switch (segment) {
      case 'morning':
        return Sun;
      case 'afternoon':
        return Sunrise;
      case 'evening':
        return Moon;
      default:
        return Bell;
    }
  };

  const getSegmentColor = (segment: string) => {
    switch (segment) {
      case 'morning':
        return '#F59E0B';
      case 'afternoon':
        return '#10B981';
      case 'evening':
        return '#8B7AB8';
      default:
        return colors.purple;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reminders</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Permission Warning */}
        {!hasPermission && (
          <View style={styles.warningCard}>
            <BellOff size={24} color={colors.orange} />
            <View style={styles.warningContent}>
              <Text style={styles.warningTitle}>Notifications Disabled</Text>
              <Text style={styles.warningText}>
                Enable notifications in your device settings to receive routine reminders
              </Text>
            </View>
          </View>
        )}

        {/* Intro */}
        <View style={styles.intro}>
          <Text style={styles.introTitle}>Never miss your routine!</Text>
          <Text style={styles.introText}>
            Set reminders for each part of your day. We'll send you a friendly nudge when it's time.
          </Text>
        </View>

        {/* Reminder Cards */}
        {(['morning', 'afternoon', 'evening'] as const).map((segment) => {
          const reminder = reminders[segment];
          const Icon = getSegmentIcon(segment);
          const color = getSegmentColor(segment);
          const isEnabled = reminder?.is_enabled || false;

          return (
            <View key={segment} style={styles.reminderCard}>
              <View style={styles.reminderHeader}>
                <View style={[styles.segmentIcon, { backgroundColor: `${color}20` }]}>
                  <Icon size={24} color={color} />
                </View>
                <View style={styles.reminderInfo}>
                  <Text style={styles.segmentTitle}>
                    {segment.charAt(0).toUpperCase() + segment.slice(1)} Routine
                  </Text>
                  {reminder && (
                    <Text style={styles.reminderTime}>{reminder.reminder_time}</Text>
                  )}
                </View>
                <Switch
                  value={isEnabled}
                  onValueChange={(value) => handleToggleReminder(segment, value)}
                  trackColor={{ false: colors.mist, true: color }}
                  thumbColor={colors.white}
                />
              </View>

              {reminder && isEnabled && (
                <>
                  {/* Days Selection */}
                  <View style={styles.daysContainer}>
                    {DAYS.map((day, index) => {
                      const isSelected = reminder.days_of_week.includes(index);
                      return (
                        <TouchableOpacity
                          key={index}
                          style={[
                            styles.dayButton,
                            isSelected && { backgroundColor: color },
                          ]}
                          onPress={() => handleToggleDay(segment, index)}
                        >
                          <Text
                            style={[
                              styles.dayText,
                              isSelected && styles.dayTextSelected,
                            ]}
                          >
                            {day}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Test Button */}
                  <TouchableOpacity
                    style={styles.testButton}
                    onPress={() => handleTestNotification(segment)}
                  >
                    <Bell size={16} color={color} />
                    <Text style={[styles.testButtonText, { color }]}>
                      Send Test Notification
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          );
        })}

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 Tips</Text>
          <Text style={styles.tipsText}>
            • Set reminders 30 minutes before you usually do your routine{'\n'}
            • Choose days that work best for your schedule{'\n'}
            • You can always adjust times later
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  loadingText: {
    fontSize: 16,
    color: colors.charcoal,
    textAlign: 'center',
    marginTop: spacing[8],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[4],
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.mist,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.cream,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.black,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing[6],
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
    borderRadius: radii.lg,
    padding: spacing[4],
    marginBottom: spacing[4],
    gap: spacing[3],
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.orange,
    marginBottom: spacing[1],
  },
  warningText: {
    fontSize: 13,
    color: colors.charcoal,
    lineHeight: 18,
  },
  intro: {
    marginBottom: spacing[6],
  },
  introTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.black,
    marginBottom: spacing[2],
  },
  introText: {
    fontSize: 16,
    color: colors.charcoal,
    lineHeight: 24,
  },
  reminderCard: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing[5],
    marginBottom: spacing[4],
    borderWidth: 1,
    borderColor: colors.mist,
  },
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  segmentIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[3],
  },
  reminderInfo: {
    flex: 1,
  },
  segmentTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.black,
    marginBottom: spacing[1],
  },
  reminderTime: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.purple,
  },
  daysContainer: {
    flexDirection: 'row',
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  dayButton: {
    flex: 1,
    paddingVertical: spacing[2],
    borderRadius: radii.md,
    backgroundColor: colors.cream,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.mist,
  },
  dayText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.charcoal,
  },
  dayTextSelected: {
    color: colors.white,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
    borderRadius: radii.md,
    backgroundColor: colors.cream,
  },
  testButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tipsCard: {
    backgroundColor: 'rgba(139, 122, 184, 0.1)',
    borderRadius: radii.lg,
    padding: spacing[5],
    marginTop: spacing[4],
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.black,
    marginBottom: spacing[3],
  },
  tipsText: {
    fontSize: 14,
    color: colors.charcoal,
    lineHeight: 22,
  },
});

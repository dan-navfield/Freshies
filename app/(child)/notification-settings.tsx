import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Switch, TouchableOpacity, Platform, Alert, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Bell, ChevronLeft, Sun, Sunrise, Moon, Clock } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors, spacing, radii } from '../../src/theme/tokens';
import { supabase } from '../../lib/supabase';
import { useChildProfile } from '../../src/contexts/ChildProfileContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  requestNotificationPermissions,
  scheduleAllRoutineNotifications,
  cancelAllRoutineNotifications,
  updateSegmentReminderTime,
  toggleRoutineNotifications,
} from '../../src/services/routineNotificationScheduler';

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const { childProfile } = useChildProfile();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Settings state
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [morningTime, setMorningTime] = useState(new Date());
  const [afternoonTime, setAfternoonTime] = useState(new Date());
  const [eveningTime, setEveningTime] = useState(new Date());
  
  // Time picker state
  const [showTimePicker, setShowTimePicker] = useState<'morning' | 'afternoon' | 'evening' | null>(null);

  useEffect(() => {
    loadSettings();
  }, [childProfile?.id]);

  const loadSettings = async () => {
    if (!childProfile?.id) return;

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('child_profile_id', childProfile.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setNotificationsEnabled(data.routine_reminders_enabled ?? true);
        
        // Parse time strings to Date objects
        if (data.morning_reminder_time) {
          const [hours, minutes] = data.morning_reminder_time.split(':');
          const date = new Date();
          date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
          setMorningTime(date);
        }
        
        if (data.afternoon_reminder_time) {
          const [hours, minutes] = data.afternoon_reminder_time.split(':');
          const date = new Date();
          date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
          setAfternoonTime(date);
        }
        
        if (data.evening_reminder_time) {
          const [hours, minutes] = data.evening_reminder_time.split(':');
          const date = new Date();
          date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
          setEveningTime(date);
        }
      } else {
        // Set default times
        const morning = new Date();
        morning.setHours(7, 30, 0, 0);
        setMorningTime(morning);
        
        const afternoon = new Date();
        afternoon.setHours(15, 0, 0, 0);
        setAfternoonTime(afternoon);
        
        const evening = new Date();
        evening.setHours(19, 30, 0, 0);
        setEveningTime(evening);
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
      Alert.alert('Error', 'Failed to load notification settings');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleNotifications = async (enabled: boolean) => {
    if (!childProfile?.id || !user?.id) return;

    try {
      setSaving(true);
      
      // Request permissions if enabling
      if (enabled) {
        const hasPermission = await requestNotificationPermissions();
        if (!hasPermission) {
          Alert.alert(
            'Permission Required',
            'Please enable notifications in your device settings to receive routine reminders.',
            [{ text: 'OK' }]
          );
          return;
        }
      }

      const success = await toggleRoutineNotifications(childProfile.id, user.id, enabled);
      
      if (success) {
        setNotificationsEnabled(enabled);
        Alert.alert(
          'Success',
          enabled 
            ? 'Routine reminders are now enabled! 🔔'
            : 'Routine reminders have been disabled.'
        );
      } else {
        Alert.alert('Error', 'Failed to update notification settings');
      }
    } catch (error) {
      console.error('Error toggling notifications:', error);
      Alert.alert('Error', 'Failed to update notification settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTimeChange = async (
    segment: 'morning' | 'afternoon' | 'evening',
    event: any,
    selectedDate?: Date
  ) => {
    setShowTimePicker(null);
    
    if (event.type === 'dismissed' || !selectedDate) {
      return;
    }

    if (!childProfile?.id || !user?.id) return;

    try {
      setSaving(true);
      
      // Update local state
      if (segment === 'morning') setMorningTime(selectedDate);
      if (segment === 'afternoon') setAfternoonTime(selectedDate);
      if (segment === 'evening') setEveningTime(selectedDate);

      // Format time as HH:MM
      const hours = selectedDate.getHours().toString().padStart(2, '0');
      const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
      const timeString = `${hours}:${minutes}`;

      // Update in database and reschedule notifications
      const success = await updateSegmentReminderTime(
        childProfile.id,
        user.id,
        segment,
        timeString
      );

      if (success) {
        Alert.alert('Success', `${segment.charAt(0).toUpperCase() + segment.slice(1)} reminder time updated! ⏰`);
      } else {
        Alert.alert('Error', 'Failed to update reminder time');
      }
    } catch (error) {
      console.error('Error updating reminder time:', error);
      Alert.alert('Error', 'Failed to update reminder time');
    } finally {
      setSaving(false);
    }
  };

  const formatTime = (date: Date): string => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    return `${displayHours}:${displayMinutes} ${ampm}`;
  };

  const renderTimeSelector = (
    segment: 'morning' | 'afternoon' | 'evening',
    icon: any,
    time: Date,
    color: string
  ) => {
    const Icon = icon;
    const segmentName = segment.charAt(0).toUpperCase() + segment.slice(1);

    return (
      <View style={styles.timeSelector}>
        <View style={styles.timeSelectorHeader}>
          <View style={[styles.iconCircle, { backgroundColor: color }]}>
            <Icon size={20} color={colors.white} />
          </View>
          <Text style={styles.timeSelectorTitle}>{segmentName} Routine</Text>
        </View>
        
        <TouchableOpacity
          style={styles.timeButton}
          onPress={() => setShowTimePicker(segment)}
          disabled={!notificationsEnabled || saving}
        >
          <Clock size={18} color={notificationsEnabled ? colors.purple : colors.charcoal} opacity={notificationsEnabled ? 1 : 0.3} />
          <Text style={[
            styles.timeButtonText,
            !notificationsEnabled && styles.timeButtonTextDisabled
          ]}>
            {formatTime(time)}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={24} color={colors.charcoal} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notification Settings</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={colors.charcoal} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notification Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Main Toggle */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Bell size={24} color={colors.purple} />
            <Text style={styles.sectionTitle}>Routine Reminders</Text>
          </View>
          
          <View style={styles.toggleCard}>
            <View style={styles.toggleContent}>
              <Text style={styles.toggleTitle}>Enable Reminders</Text>
              <Text style={styles.toggleDescription}>
                Get notified when it's time to start your routines
              </Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleToggleNotifications}
              trackColor={{ false: colors.mist, true: colors.lavender }}
              thumbColor={notificationsEnabled ? colors.purple : colors.charcoal}
              disabled={saving}
            />
          </View>
        </View>

        {/* Time Settings */}
        {notificationsEnabled && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reminder Times</Text>
            <Text style={styles.sectionDescription}>
              Choose when you want to be reminded about each routine
            </Text>

            <View style={styles.timeSelectors}>
              {renderTimeSelector('morning', Sun, morningTime, '#FFD93D')}
              {renderTimeSelector('afternoon', Sunrise, afternoonTime, '#FFA500')}
              {renderTimeSelector('evening', Moon, eveningTime, '#8133F6')}
            </View>
          </View>
        )}

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>💡 How it works</Text>
          <Text style={styles.infoText}>
            You'll receive a notification at the time you set for each routine. Tap the notification to start your routine right away!
          </Text>
        </View>
      </ScrollView>

      {/* Time Pickers */}
      {showTimePicker === 'morning' && (
        <DateTimePicker
          value={morningTime}
          mode="time"
          is24Hour={false}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, date) => handleTimeChange('morning', event, date)}
        />
      )}
      {showTimePicker === 'afternoon' && (
        <DateTimePicker
          value={afternoonTime}
          mode="time"
          is24Hour={false}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, date) => handleTimeChange('afternoon', event, date)}
        />
      )}
      {showTimePicker === 'evening' && (
        <DateTimePicker
          value={eveningTime}
          mode="time"
          is24Hour={false}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, date) => handleTimeChange('evening', event, date)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingTop: spacing[12],
    paddingBottom: spacing[4],
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.mist,
  },
  backButton: {
    padding: spacing[2],
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.charcoal,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.charcoal,
    opacity: 0.6,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing[4],
    paddingBottom: spacing[8],
  },
  section: {
    marginBottom: spacing[6],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.charcoal,
  },
  sectionDescription: {
    fontSize: 14,
    color: colors.charcoal,
    opacity: 0.6,
    marginBottom: spacing[4],
  },
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    padding: spacing[4],
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: colors.purple,
  },
  toggleContent: {
    flex: 1,
    marginRight: spacing[3],
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.charcoal,
    marginBottom: spacing[1],
  },
  toggleDescription: {
    fontSize: 14,
    color: colors.charcoal,
    opacity: 0.6,
  },
  timeSelectors: {
    gap: spacing[3],
  },
  timeSelector: {
    backgroundColor: colors.white,
    padding: spacing[4],
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.mist,
  },
  timeSelectorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeSelectorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.charcoal,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: colors.lavender,
    padding: spacing[3],
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.purple,
  },
  timeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.purple,
  },
  timeButtonTextDisabled: {
    color: colors.charcoal,
    opacity: 0.3,
  },
  infoCard: {
    backgroundColor: colors.lavender,
    padding: spacing[4],
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.purple,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.charcoal,
    marginBottom: spacing[2],
  },
  infoText: {
    fontSize: 14,
    color: colors.charcoal,
    opacity: 0.8,
    lineHeight: 20,
  },
});

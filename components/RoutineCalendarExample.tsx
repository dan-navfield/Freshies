/**
 * Example: Routine Calendar Component
 * 
 * This is a reference implementation showing how to use the routine history
 * service to display a calendar with routine completion data.
 * 
 * Features demonstrated:
 * - Calendar heatmap showing activity intensity
 * - Daily completion details
 * - Streak tracking
 * - Monthly stats
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { routineHistoryService, CalendarDayData, StreakInfo, MonthlyStats } from '../src/services/routineHistoryService';
import { useChildProfile } from '../src/contexts/ChildProfileContext';
import { colors, spacing, radii } from '../src/theme/tokens';

export const RoutineCalendarExample: React.FC = () => {
  const { childProfile } = useChildProfile();
  const [calendarData, setCalendarData] = useState<CalendarDayData[]>([]);
  const [streak, setStreak] = useState<StreakInfo | null>(null);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    loadCalendarData();
  }, [childProfile?.id]);

  const loadCalendarData = async () => {
    if (!childProfile?.id) return;

    try {
      // Load calendar heatmap (last 90 days)
      const heatmap = await routineHistoryService.getCalendarHeatmap(childProfile.id, 90);
      setCalendarData(heatmap);

      // Load current streak
      const streakData = await routineHistoryService.getCurrentStreak(childProfile.id);
      setStreak(streakData);

      // Load current month stats
      const now = new Date();
      const stats = await routineHistoryService.getMonthlyStats(
        childProfile.id,
        now.getFullYear(),
        now.getMonth() + 1
      );
      setMonthlyStats(stats);
    } catch (error) {
      console.error('Error loading calendar data:', error);
    }
  };

  const getActivityColor = (level: string) => {
    switch (level) {
      case 'high': return colors.purple;
      case 'medium': return '#B794F6';
      case 'low': return '#E9D5FF';
      default: return colors.mist;
    }
  };

  const renderCalendarDay = (dayData: CalendarDayData) => {
    const date = new Date(dayData.completion_date);
    const dayOfMonth = date.getDate();
    const isSelected = selectedDate === dayData.completion_date;

    return (
      <TouchableOpacity
        key={dayData.completion_date}
        style={[
          styles.calendarDay,
          { backgroundColor: getActivityColor(dayData.activity_level) },
          isSelected && styles.selectedDay,
        ]}
        onPress={() => setSelectedDate(dayData.completion_date)}
      >
        <Text style={styles.dayNumber}>{dayOfMonth}</Text>
        {dayData.activity_count > 0 && (
          <Text style={styles.activityCount}>{dayData.activity_count}</Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Streak Display */}
      {streak && (
        <View style={styles.streakCard}>
          <Text style={styles.streakEmoji}>🔥</Text>
          <Text style={styles.streakNumber}>{streak.streak_days}</Text>
          <Text style={styles.streakLabel}>Day Streak!</Text>
        </View>
      )}

      {/* Monthly Stats */}
      {monthlyStats && (
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>This Month</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{monthlyStats.active_days}</Text>
              <Text style={styles.statLabel}>Active Days</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{monthlyStats.total_steps_completed}</Text>
              <Text style={styles.statLabel}>Steps Done</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{monthlyStats.total_xp}</Text>
              <Text style={styles.statLabel}>XP Earned</Text>
            </View>
          </View>
        </View>
      )}

      {/* Calendar Heatmap */}
      <View style={styles.calendarCard}>
        <Text style={styles.calendarTitle}>Activity Calendar</Text>
        <View style={styles.calendarGrid}>
          {calendarData.map(renderCalendarDay)}
        </View>
        <View style={styles.legend}>
          <Text style={styles.legendText}>Less</Text>
          <View style={[styles.legendBox, { backgroundColor: colors.mist }]} />
          <View style={[styles.legendBox, { backgroundColor: '#E9D5FF' }]} />
          <View style={[styles.legendBox, { backgroundColor: '#B794F6' }]} />
          <View style={[styles.legendBox, { backgroundColor: colors.purple }]} />
          <Text style={styles.legendText}>More</Text>
        </View>
      </View>

      {/* Selected Day Details */}
      {selectedDate && (
        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>
            {new Date(selectedDate).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
          <Text style={styles.detailsSubtitle}>
            Tap to see full routine details for this day
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  streakCard: {
    backgroundColor: colors.white,
    margin: spacing[4],
    padding: spacing[6],
    borderRadius: radii.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  streakEmoji: {
    fontSize: 48,
    marginBottom: spacing[2],
  },
  streakNumber: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.purple,
  },
  streakLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.charcoal,
    marginTop: spacing[1],
  },
  statsCard: {
    backgroundColor: colors.white,
    marginHorizontal: spacing[4],
    marginBottom: spacing[4],
    padding: spacing[6],
    borderRadius: radii.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.charcoal,
    marginBottom: spacing[4],
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.purple,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.charcoal,
    opacity: 0.6,
    marginTop: spacing[1],
  },
  calendarCard: {
    backgroundColor: colors.white,
    marginHorizontal: spacing[4],
    marginBottom: spacing[4],
    padding: spacing[6],
    borderRadius: radii.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  calendarTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.charcoal,
    marginBottom: spacing[4],
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  calendarDay: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.mist,
  },
  selectedDay: {
    borderWidth: 2,
    borderColor: colors.purple,
  },
  dayNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.charcoal,
  },
  activityCount: {
    fontSize: 8,
    fontWeight: '700',
    color: colors.purple,
    position: 'absolute',
    top: 2,
    right: 2,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing[4],
    gap: spacing[2],
  },
  legendText: {
    fontSize: 12,
    color: colors.charcoal,
    opacity: 0.6,
  },
  legendBox: {
    width: 20,
    height: 20,
    borderRadius: radii.sm,
  },
  detailsCard: {
    backgroundColor: colors.white,
    marginHorizontal: spacing[4],
    marginBottom: spacing[4],
    padding: spacing[6],
    borderRadius: radii.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.charcoal,
    marginBottom: spacing[2],
  },
  detailsSubtitle: {
    fontSize: 14,
    color: colors.charcoal,
    opacity: 0.6,
  },
});

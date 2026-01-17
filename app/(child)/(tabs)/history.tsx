import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight, Calendar, TrendingUp, CheckCircle, Package } from 'lucide-react-native';
import { colors, spacing, radii } from '../../../src/theme/tokens';
import { useChildProfile } from '../../../src/contexts/ChildProfileContext';
import { supabase } from '../../../src/lib/supabase';
import { getDailyCompletions, calculateStreak, type DailyCompletion } from '../../../src/utils/streakCalculator';
import { StyleSheet } from 'react-native';
import PageHeader from '../../../src/components/PageHeader';
import GamificationBand from '../../../src/components/GamificationBand';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function HistoryScreen() {
  const { childProfile } = useChildProfile();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<'routine' | 'products'>('routine');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [completions, setCompletions] = useState<DailyCompletion[]>([]);
  const [stats, setStats] = useState({
    currentStreak: 0,
    longestStreak: 0,
    totalCompletions: 0,
    completionRate: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (childProfile?.id) {
      loadHistory();
    }
  }, [currentDate, childProfile?.id]);

  const loadHistory = async () => {
    if (!childProfile?.id) return;

    try {
      const profileId = childProfile.id;

      // Get month range
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const startDate = new Date(year, month, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

      // Get completions for the month
      const dailyCompletions = await getDailyCompletions(profileId, startDate, endDate);
      setCompletions(dailyCompletions);

      // Get overall stats
      const streakData = await calculateStreak(profileId);
      setStats({
        currentStreak: streakData.currentStreak,
        longestStreak: streakData.longestStreak,
        totalCompletions: streakData.totalCompletions,
        completionRate: streakData.completionRate,
      });
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    const today = new Date();
    const next = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    if (next <= today) {
      setCurrentDate(next);
    }
  };

  const getCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days: (number | null)[] = [];
    
    // Add empty slots for days before the month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    
    return days;
  };

  const getCompletionForDate = (day: number): DailyCompletion | undefined => {
    const dateStr = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day
    ).toISOString().split('T')[0];
    
    return completions.find(c => c.date === dateStr);
  };

  const getCompletionLevel = (completion?: DailyCompletion): number => {
    if (!completion || completion.totalSteps === 0) return 0;
    const percentage = (completion.completedSteps / completion.totalSteps) * 100;
    if (percentage === 100) return 4;
    if (percentage >= 75) return 3;
    if (percentage >= 50) return 2;
    if (percentage > 0) return 1;
    return 0;
  };

  const getCompletionColor = (level: number): string => {
    switch (level) {
      case 4: return '#10B981'; // Full completion
      case 3: return '#34D399'; // 75%+
      case 2: return '#6EE7B7'; // 50%+
      case 1: return '#A7F3D0'; // Some completion
      default: return colors.mist; // No completion
    }
  };

  const calendarDays = getCalendarDays();
  const today = new Date();
  const isCurrentMonth = currentDate.getMonth() === today.getMonth() && 
                         currentDate.getFullYear() === today.getFullYear();

  return (
    <View style={styles.container}>
      {/* Page Header */}
      <PageHeader 
        title="History"
        subtitle="Track your skincare journey 📊"
        showAvatar={true}
      />
      
      {/* Gamification Band */}
      <GamificationBand />

      {/* Navigation Tabs */}
      <View style={styles.navTabs}>
        <TouchableOpacity 
          style={[styles.navTab, styles.navTabActive]}
          onPress={() => {}}
        >
          <Calendar size={20} color={colors.purple} />
          <Text style={[styles.navTabText, styles.navTabTextActive]}>Routine History</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navTab}
          onPress={() => router.push('/(child)/approved-products')}
        >
          <CheckCircle size={20} color={colors.charcoal} />
          <Text style={styles.navTabText}>Approved Products</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>🔥</Text>
            <Text style={styles.statValue}>{stats.currentStreak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>🏆</Text>
            <Text style={styles.statValue}>{stats.longestStreak}</Text>
            <Text style={styles.statLabel}>Best Streak</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>✅</Text>
            <Text style={styles.statValue}>{stats.totalCompletions}</Text>
            <Text style={styles.statLabel}>Total Done</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>📊</Text>
            <Text style={styles.statValue}>{stats.completionRate}%</Text>
            <Text style={styles.statLabel}>Success Rate</Text>
          </View>
        </View>

        {/* Calendar */}
        <View style={styles.calendarCard}>
          {/* Month Navigation */}
          <View style={styles.monthHeader}>
            <TouchableOpacity onPress={previousMonth} style={styles.monthButton}>
              <ChevronLeft size={24} color={colors.black} />
            </TouchableOpacity>
            
            <View style={styles.monthInfo}>
              <Calendar size={20} color={colors.purple} />
              <Text style={styles.monthText}>
                {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
              </Text>
            </View>
            
            <TouchableOpacity 
              onPress={nextMonth} 
              style={styles.monthButton}
              disabled={isCurrentMonth}
            >
              <ChevronRight 
                size={24} 
                color={isCurrentMonth ? colors.mist : colors.black} 
              />
            </TouchableOpacity>
          </View>

          {/* Day Headers */}
          <View style={styles.dayHeaders}>
            {DAYS.map((day) => (
              <Text key={day} style={styles.dayHeader}>{day}</Text>
            ))}
          </View>

          {/* Calendar Grid */}
          <View style={styles.calendarGrid}>
            {calendarDays.map((day, index) => {
              if (day === null) {
                return <View key={`empty-${index}`} style={styles.dayCell} />;
              }

              const completion = getCompletionForDate(day);
              const level = getCompletionLevel(completion);
              const isToday = isCurrentMonth && day === today.getDate();
              
              return (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.dayCell,
                    isToday && styles.todayCell,
                  ]}
                  onPress={() => {
                    if (completion) {
                      // Could show detail modal here
                    }
                  }}
                >
                  <View
                    style={[
                      styles.dayContent,
                      { backgroundColor: getCompletionColor(level) },
                      isToday && styles.todayContent,
                    ]}
                  >
                    <Text style={[
                      styles.dayNumber,
                      level > 2 && styles.dayNumberCompleted,
                      isToday && styles.todayNumber,
                    ]}>
                      {day}
                    </Text>
                  </View>
                  
                  {/* Segment indicators */}
                  {completion && (
                    <View style={styles.segmentIndicators}>
                      {completion.morning && <View style={[styles.segmentDot, { backgroundColor: '#F59E0B' }]} />}
                      {completion.afternoon && <View style={[styles.segmentDot, { backgroundColor: '#10B981' }]} />}
                      {completion.evening && <View style={[styles.segmentDot, { backgroundColor: '#8B7AB8' }]} />}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Legend */}
          <View style={styles.legend}>
            <Text style={styles.legendTitle}>Completion Level:</Text>
            <View style={styles.legendItems}>
              {[
                { level: 0, label: 'None' },
                { level: 1, label: 'Some' },
                { level: 2, label: '50%+' },
                { level: 3, label: '75%+' },
                { level: 4, label: 'All' },
              ].map(({ level, label }) => (
                <View key={level} style={styles.legendItem}>
                  <View style={[styles.legendBox, { backgroundColor: getCompletionColor(level) }]} />
                  <Text style={styles.legendLabel}>{label}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Insights */}
        <View style={styles.insightsCard}>
          <View style={styles.insightsHeader}>
            <TrendingUp size={20} color={colors.purple} />
            <Text style={styles.insightsTitle}>Your Progress</Text>
          </View>
          <Text style={styles.insightsText}>
            {stats.currentStreak > 0 
              ? `Amazing! You're on a ${stats.currentStreak} day streak! Keep it going! 🎉`
              : 'Start a new streak today! Complete your routine to begin. 💪'}
          </Text>
          {stats.completionRate >= 80 && (
            <Text style={styles.insightsText}>
              You're crushing it with an {stats.completionRate}% success rate! 🌟
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing[6],
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
    marginBottom: spacing[6],
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing[4],
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.mist,
  },
  statEmoji: {
    fontSize: 32,
    marginBottom: spacing[2],
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.black,
    marginBottom: spacing[1],
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.charcoal,
  },

  // Calendar
  calendarCard: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing[5],
    marginBottom: spacing[4],
    borderWidth: 1,
    borderColor: colors.mist,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[4],
  },
  monthButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.cream,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  monthText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.black,
  },
  dayHeaders: {
    flexDirection: 'row',
    marginBottom: spacing[2],
  },
  dayHeader: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: colors.charcoal,
    textAlign: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    padding: 2,
  },
  todayCell: {
    // Additional styling for today if needed
  },
  dayContent: {
    flex: 1,
    borderRadius: radii.md,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  todayContent: {
    borderWidth: 2,
    borderColor: colors.purple,
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.charcoal,
  },
  dayNumberCompleted: {
    color: colors.white,
  },
  todayNumber: {
    fontWeight: '700',
  },
  segmentIndicators: {
    position: 'absolute',
    bottom: 4,
    flexDirection: 'row',
    gap: 2,
  },
  segmentDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },

  // Legend
  legend: {
    marginTop: spacing[4],
    paddingTop: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.mist,
  },
  legendTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.charcoal,
    marginBottom: spacing[2],
  },
  legendItems: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  legendBox: {
    width: 16,
    height: 16,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 11,
    color: colors.charcoal,
  },

  // Navigation Tabs
  navTabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    gap: spacing[3],
  },
  navTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
    borderRadius: radii.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.mist,
  },
  navTabActive: {
    backgroundColor: colors.purple + '10',
    borderColor: colors.purple,
  },
  navTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.charcoal,
  },
  navTabTextActive: {
    color: colors.purple,
  },

  // Insights
  insightsCard: {
    backgroundColor: 'rgba(139, 122, 184, 0.1)',
    borderRadius: radii.lg,
    padding: spacing[5],
  },
  insightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  insightsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.black,
  },
  insightsText: {
    fontSize: 14,
    color: colors.charcoal,
    lineHeight: 20,
    marginBottom: spacing[2],
  },
});

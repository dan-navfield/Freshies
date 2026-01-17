import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { Calendar, ChevronLeft, ChevronRight, Sunrise, Sun, Moon, Flame } from 'lucide-react-native';
import { colors, spacing, radii } from '../../src/theme/tokens';
import { supabase } from '../../src/lib/supabase';
import { useChildProfile } from '../../src/contexts/ChildProfileContext';
import DetailPageHeader from '../../src/components/DetailPageHeader';

interface DayData {
  date: string;
  routines: {
    morning?: boolean;
    afternoon?: boolean;
    evening?: boolean;
  };
  totalCompleted: number;
}

export default function RoutineHistoryScreen() {
  const router = useRouter();
  const { childProfile } = useChildProfile();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [historyData, setHistoryData] = useState<Record<string, DayData>>({});
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [totalDaysCompleted, setTotalDaysCompleted] = useState(0);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [stats, setStats] = useState({
    thisWeek: 0,
    thisMonth: 0,
    completionRate: 0,
    morningCount: 0,
    afternoonCount: 0,
    eveningCount: 0,
    mostActiveTime: 'morning' as 'morning' | 'afternoon' | 'evening',
  });

  useEffect(() => {
    if (childProfile?.id) {
      loadHistoryData();
      calculateStreaks();
      calculateDetailedStats();
    }
  }, [childProfile?.id, currentMonth]);

  const loadHistoryData = async () => {
    if (!childProfile?.id) return;

    try {
      // Get start and end of current month
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

      // Get all routine completions for the month
      const { data: completions } = await supabase
        .from('routine_step_completions')
        .select(`
          completion_date,
          routine_id,
          custom_routines!inner(segment)
        `)
        .eq('child_profile_id', childProfile.id)
        .gte('completion_date', startOfMonth.toISOString().split('T')[0])
        .lte('completion_date', endOfMonth.toISOString().split('T')[0]);

      // Group by date and segment
      const grouped: Record<string, DayData> = {};
      
      completions?.forEach((completion: any) => {
        const date = completion.completion_date;
        if (!grouped[date]) {
          grouped[date] = {
            date,
            routines: {},
            totalCompleted: 0,
          };
        }
        
        const segment = completion.custom_routines.segment;
        if (!grouped[date].routines[segment as keyof typeof grouped[string]['routines']]) {
          grouped[date].routines[segment as keyof typeof grouped[string]['routines']] = true;
          grouped[date].totalCompleted++;
        }
      });

      setHistoryData(grouped);
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const calculateStreaks = async () => {
    if (!childProfile?.id) return;

    try {
      // Get all completion dates (distinct)
      const { data: completions } = await supabase
        .from('routine_step_completions')
        .select('completion_date')
        .eq('child_profile_id', childProfile.id)
        .order('completion_date', { ascending: false });

      if (!completions || completions.length === 0) {
        setCurrentStreak(0);
        setLongestStreak(0);
        setTotalDaysCompleted(0);
        return;
      }

      // Get unique dates
      const uniqueDates = [...new Set(completions.map(c => c.completion_date))].sort().reverse();
      setTotalDaysCompleted(uniqueDates.length);

      // Calculate current streak
      let streak = 0;
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

      if (uniqueDates[0] === today || uniqueDates[0] === yesterday) {
        streak = 1;
        for (let i = 1; i < uniqueDates.length; i++) {
          const prevDate = new Date(uniqueDates[i - 1]);
          const currDate = new Date(uniqueDates[i]);
          const diffDays = Math.floor((prevDate.getTime() - currDate.getTime()) / 86400000);
          
          if (diffDays === 1) {
            streak++;
          } else {
            break;
          }
        }
      }
      setCurrentStreak(streak);

      // Calculate longest streak
      let maxStreak = 0;
      let tempStreak = 1;
      for (let i = 1; i < uniqueDates.length; i++) {
        const prevDate = new Date(uniqueDates[i - 1]);
        const currDate = new Date(uniqueDates[i]);
        const diffDays = Math.floor((prevDate.getTime() - currDate.getTime()) / 86400000);
        
        if (diffDays === 1) {
          tempStreak++;
          maxStreak = Math.max(maxStreak, tempStreak);
        } else {
          tempStreak = 1;
        }
      }
      setLongestStreak(Math.max(maxStreak, streak));
    } catch (error) {
      console.error('Error calculating streaks:', error);
    }
  };

  const calculateDetailedStats = async () => {
    if (!childProfile?.id) return;

    try {
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Get all completions
      const { data: allCompletions } = await supabase
        .from('routine_step_completions')
        .select(`
          completion_date,
          custom_routines!inner(segment)
        `)
        .eq('child_profile_id', childProfile.id);

      if (!allCompletions) return;

      // Group by date and segment
      const completionsByDate: Record<string, Set<string>> = {};
      let morningCount = 0;
      let afternoonCount = 0;
      let eveningCount = 0;

      allCompletions.forEach((completion: any) => {
        const date = completion.completion_date;
        const segment = completion.custom_routines.segment;

        if (!completionsByDate[date]) {
          completionsByDate[date] = new Set();
        }
        
        if (!completionsByDate[date].has(segment)) {
          completionsByDate[date].add(segment);
          
          if (segment === 'morning') morningCount++;
          if (segment === 'afternoon') afternoonCount++;
          if (segment === 'evening') eveningCount++;
        }
      });

      // Calculate this week
      const thisWeek = Object.keys(completionsByDate).filter(date => 
        new Date(date) >= startOfWeek
      ).length;

      // Calculate this month
      const thisMonth = Object.keys(completionsByDate).filter(date => 
        new Date(date) >= startOfMonth
      ).length;

      // Calculate completion rate (days with at least one routine / total days this month)
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const completionRate = Math.round((thisMonth / daysInMonth) * 100);

      // Find most active time
      const counts = { morning: morningCount, afternoon: afternoonCount, evening: eveningCount };
      const mostActiveTime = Object.entries(counts).reduce((a, b) => 
        counts[a[0] as keyof typeof counts] > counts[b[0] as keyof typeof counts] ? a : b
      )[0] as 'morning' | 'afternoon' | 'evening';

      setStats({
        thisWeek,
        thisMonth,
        completionRate,
        morningCount,
        afternoonCount,
        eveningCount,
        mostActiveTime,
      });
    } catch (error) {
      console.error('Error calculating detailed stats:', error);
    }
  };

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add actual days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateString = date.toISOString().split('T')[0];
      days.push({
        day,
        date: dateString,
        data: historyData[dateString],
      });
    }
    
    return days;
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const getMonthName = () => {
    return currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const renderDay = (dayInfo: any) => {
    if (!dayInfo) {
      return <View key={`empty-${Math.random()}`} style={styles.dayCell} />;
    }

    const { day, date, data } = dayInfo;
    const isToday = date === new Date().toISOString().split('T')[0];
    const hasData = data && data.totalCompleted > 0;

    return (
      <TouchableOpacity
        key={date}
        style={[
          styles.dayCell,
          isToday && styles.todayCell,
        ]}
        onPress={() => hasData && setSelectedDay(data)}
        disabled={!hasData}
      >
        <Text style={[
          styles.dayNumber,
          isToday && styles.todayNumber,
          hasData && styles.completedDayNumber,
        ]}>
          {day}
        </Text>
        
        {hasData && (
          <View style={styles.dotsContainer}>
            {data.routines.morning && (
              <View style={[styles.dot, { backgroundColor: colors.orange }]} />
            )}
            {data.routines.afternoon && (
              <View style={[styles.dot, { backgroundColor: colors.mint }]} />
            )}
            {data.routines.evening && (
              <View style={[styles.dot, { backgroundColor: colors.purple }]} />
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <DetailPageHeader
        title="Routine History"
        subtitle="Your skincare journey"
      />

      <ScrollView style={styles.content}>
        {/* Stats Cards - Tappable */}
        <TouchableOpacity 
          style={styles.statsContainer}
          onPress={() => setShowStatsModal(true)}
          activeOpacity={0.7}
        >
          <View style={styles.statCard}>
            <Flame size={24} color={colors.orange} />
            <Text style={styles.statNumber}>{currentStreak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
          
          <View style={styles.statCard}>
            <Calendar size={24} color={colors.purple} />
            <Text style={styles.statNumber}>{totalDaysCompleted}</Text>
            <Text style={styles.statLabel}>Total Days</Text>
          </View>
          
          <View style={styles.statCard}>
            <Flame size={24} color={colors.mint} />
            <Text style={styles.statNumber}>{longestStreak}</Text>
            <Text style={styles.statLabel}>Best Streak</Text>
          </View>
        </TouchableOpacity>
        
        {/* Tap hint */}
        <Text style={styles.tapHint}>Tap for detailed stats 📊</Text>

        {/* Calendar */}
        <View style={styles.calendarContainer}>
          {/* Month Navigation */}
          <View style={styles.monthHeader}>
            <TouchableOpacity onPress={previousMonth} style={styles.monthButton}>
              <ChevronLeft size={24} color={colors.purple} />
            </TouchableOpacity>
            
            <Text style={styles.monthTitle}>{getMonthName()}</Text>
            
            <TouchableOpacity onPress={nextMonth} style={styles.monthButton}>
              <ChevronRight size={24} color={colors.purple} />
            </TouchableOpacity>
          </View>

          {/* Day Labels */}
          <View style={styles.dayLabelsRow}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
              <Text key={i} style={styles.dayLabel}>{day}</Text>
            ))}
          </View>

          {/* Calendar Grid */}
          <View style={styles.calendarGrid}>
            {getDaysInMonth().map((dayInfo, index) => renderDay(dayInfo))}
          </View>

          {/* Legend */}
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.orange }]} />
              <Text style={styles.legendText}>Morning</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.mint }]} />
              <Text style={styles.legendText}>Afternoon</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.purple }]} />
              <Text style={styles.legendText}>Evening</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Detailed Stats Modal */}
      <Modal
        visible={showStatsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowStatsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Your Stats 📊</Text>
            
            <ScrollView style={styles.statsModalScroll}>
              {/* Time Period Stats */}
              <View style={styles.statsSection}>
                <Text style={styles.statsSectionTitle}>This Period</Text>
                <View style={styles.statsGrid}>
                  <View style={styles.statsGridItem}>
                    <Text style={styles.statsGridNumber}>{stats.thisWeek}</Text>
                    <Text style={styles.statsGridLabel}>This Week</Text>
                  </View>
                  <View style={styles.statsGridItem}>
                    <Text style={styles.statsGridNumber}>{stats.thisMonth}</Text>
                    <Text style={styles.statsGridLabel}>This Month</Text>
                  </View>
                  <View style={styles.statsGridItem}>
                    <Text style={styles.statsGridNumber}>{stats.completionRate}%</Text>
                    <Text style={styles.statsGridLabel}>Completion Rate</Text>
                  </View>
                </View>
              </View>

              {/* Routine Breakdown */}
              <View style={styles.statsSection}>
                <Text style={styles.statsSectionTitle}>By Time of Day</Text>
                <View style={styles.routineBreakdown}>
                  <View style={styles.breakdownItem}>
                    <View style={styles.breakdownHeader}>
                      <Sunrise size={20} color={colors.orange} />
                      <Text style={styles.breakdownLabel}>Morning</Text>
                    </View>
                    <Text style={styles.breakdownCount}>{stats.morningCount} times</Text>
                  </View>
                  
                  <View style={styles.breakdownItem}>
                    <View style={styles.breakdownHeader}>
                      <Sun size={20} color={colors.mint} />
                      <Text style={styles.breakdownLabel}>Afternoon</Text>
                    </View>
                    <Text style={styles.breakdownCount}>{stats.afternoonCount} times</Text>
                  </View>
                  
                  <View style={styles.breakdownItem}>
                    <View style={styles.breakdownHeader}>
                      <Moon size={20} color={colors.purple} />
                      <Text style={styles.breakdownLabel}>Evening</Text>
                    </View>
                    <Text style={styles.breakdownCount}>{stats.eveningCount} times</Text>
                  </View>
                </View>
              </View>

              {/* Most Active Time */}
              <View style={styles.statsSection}>
                <Text style={styles.statsSectionTitle}>Your Favorite Time ⭐</Text>
                <View style={styles.favoriteTime}>
                  {stats.mostActiveTime === 'morning' && <Sunrise size={32} color={colors.orange} />}
                  {stats.mostActiveTime === 'afternoon' && <Sun size={32} color={colors.mint} />}
                  {stats.mostActiveTime === 'evening' && <Moon size={32} color={colors.purple} />}
                  <Text style={styles.favoriteTimeText}>
                    {stats.mostActiveTime.charAt(0).toUpperCase() + stats.mostActiveTime.slice(1)} Routines
                  </Text>
                  <Text style={styles.favoriteTimeSubtext}>You complete these the most!</Text>
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowStatsModal(false)}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Day Detail Modal */}
      <Modal
        visible={selectedDay !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedDay(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {selectedDay?.date && new Date(selectedDay.date).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
            
            <View style={styles.modalRoutines}>
              {selectedDay?.routines.morning && (
                <View style={styles.modalRoutineItem}>
                  <Sunrise size={20} color={colors.orange} />
                  <Text style={styles.modalRoutineText}>Morning Routine ✓</Text>
                </View>
              )}
              {selectedDay?.routines.afternoon && (
                <View style={styles.modalRoutineItem}>
                  <Sun size={20} color={colors.mint} />
                  <Text style={styles.modalRoutineText}>Afternoon Routine ✓</Text>
                </View>
              )}
              {selectedDay?.routines.evening && (
                <View style={styles.modalRoutineItem}>
                  <Moon size={20} color={colors.purple} />
                  <Text style={styles.modalRoutineText}>Evening Routine ✓</Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setSelectedDay(null)}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: spacing[4],
    gap: spacing[3],
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing[4],
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.purple,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.charcoal,
    marginTop: spacing[2],
  },
  statLabel: {
    fontSize: 12,
    color: colors.charcoal,
    opacity: 0.6,
    marginTop: spacing[1],
  },
  calendarContainer: {
    backgroundColor: colors.white,
    margin: spacing[4],
    marginTop: 0,
    borderRadius: radii.xl,
    padding: spacing[4],
    borderWidth: 2,
    borderColor: colors.purple,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[4],
  },
  monthButton: {
    padding: spacing[2],
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.charcoal,
  },
  dayLabelsRow: {
    flexDirection: 'row',
    marginBottom: spacing[2],
  },
  dayLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: colors.charcoal,
    opacity: 0.5,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    padding: spacing[1],
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayCell: {
    backgroundColor: colors.purple + '20',
    borderRadius: radii.md,
  },
  dayNumber: {
    fontSize: 14,
    color: colors.charcoal,
    opacity: 0.6,
  },
  todayNumber: {
    fontWeight: '700',
    color: colors.purple,
    opacity: 1,
  },
  completedDayNumber: {
    fontWeight: '600',
    opacity: 1,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing[4],
    marginTop: spacing[4],
    paddingTop: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.mist,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: colors.charcoal,
    opacity: 0.7,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: spacing[6],
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.charcoal,
    marginBottom: spacing[4],
    textAlign: 'center',
  },
  modalRoutines: {
    gap: spacing[3],
    marginBottom: spacing[6],
  },
  modalRoutineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[3],
    backgroundColor: colors.cream,
    borderRadius: radii.lg,
  },
  modalRoutineText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.charcoal,
  },
  modalCloseButton: {
    backgroundColor: colors.purple,
    borderRadius: radii.lg,
    padding: spacing[4],
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  tapHint: {
    textAlign: 'center',
    fontSize: 12,
    color: colors.charcoal,
    opacity: 0.5,
    marginTop: spacing[2],
    marginBottom: spacing[4],
  },
  statsModalScroll: {
    maxHeight: 400,
  },
  statsSection: {
    marginBottom: spacing[5],
  },
  statsSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.charcoal,
    marginBottom: spacing[3],
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  statsGridItem: {
    flex: 1,
    backgroundColor: colors.cream,
    borderRadius: radii.lg,
    padding: spacing[3],
    alignItems: 'center',
  },
  statsGridNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.purple,
  },
  statsGridLabel: {
    fontSize: 11,
    color: colors.charcoal,
    opacity: 0.6,
    marginTop: spacing[1],
    textAlign: 'center',
  },
  routineBreakdown: {
    gap: spacing[2],
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.cream,
    borderRadius: radii.lg,
    padding: spacing[3],
  },
  breakdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  breakdownLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.charcoal,
  },
  breakdownCount: {
    fontSize: 14,
    color: colors.charcoal,
    opacity: 0.6,
  },
  favoriteTime: {
    backgroundColor: colors.cream,
    borderRadius: radii.lg,
    padding: spacing[5],
    alignItems: 'center',
  },
  favoriteTimeText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.purple,
    marginTop: spacing[3],
  },
  favoriteTimeSubtext: {
    fontSize: 13,
    color: colors.charcoal,
    opacity: 0.6,
    marginTop: spacing[1],
  },
});

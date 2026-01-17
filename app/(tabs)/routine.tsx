import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Image, TouchableOpacity, Pressable, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../src/contexts/AuthContext';
import { supabase } from '../../src/lib/supabase';
import { routineService, CustomRoutine } from '../../src/services/routineService';
import { colors, radii, spacing } from '../../src/theme/tokens';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import PageHeader from '../../src/components/navigation/PageHeader';
import { AlertTriangle, CheckCircle, Clock, TrendingUp, Users, Baby, ChevronRight, ChevronLeft, Sun, Moon, Eye } from 'lucide-react-native';

interface ManagedChild {
  id: string;
  first_name: string;
  avatar_url: string | null;
  child_profile_id: string;
}

interface ChildRoutineSummary {
  child: ManagedChild;
  morningRoutine: CustomRoutine | null;
  eveningRoutine: CustomRoutine | null;
  stats: {
    streak: number;
    totalCompleted: number;
  };
  alerts: Alert[];
}

interface Alert {
  type: 'warning' | 'info' | 'success';
  message: string;
}

interface ProfileOption {
  id: string;
  name: string;
  avatar_url: string | null;
  type: 'all' | 'child';
}

interface DayCompletionStatus {
  [dayIndex: number]: 'complete' | 'partial' | 'none';
}

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function RoutineScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [summaries, setSummaries] = useState<ChildRoutineSummary[]>([]);

  // Profile filter
  const [profiles, setProfiles] = useState<ProfileOption[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>('all');

  // Child View State (when specific child is selected)
  const [selectedViewDate, setSelectedViewDate] = useState<Date>(() => new Date());
  const [dayCompletionStatus, setDayCompletionStatus] = useState<DayCompletionStatus>({});
  const [routineCompletionStatus, setRoutineCompletionStatus] = useState<Record<string, boolean>>({});

  const selectedViewDay = (() => {
    const day = selectedViewDate.getDay();
    return day === 0 ? 6 : day - 1;
  })();

  // Get selected child data
  const selectedChildSummary = activeFilter !== 'all'
    ? summaries.find(s => s.child.child_profile_id === activeFilter)
    : null;

  const loadData = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      // Fetch parent avatar
      const { data: parentData } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', user.id)
        .single();

      if (parentData?.avatar_url) {
        setAvatarUrl(parentData.avatar_url);
      }

      // Fetch all managed children
      const { data: children, error: childError } = await supabase
        .from('managed_children')
        .select('id, first_name, avatar_url, child_profile_id')
        .eq('parent_id', user.id)
        .eq('status', 'active');

      if (childError) throw childError;

      // Build profile options
      const profileOptions: ProfileOption[] = [
        { id: 'all', name: 'All', avatar_url: null, type: 'all' }
      ];
      (children || []).forEach(child => {
        profileOptions.push({
          id: child.child_profile_id || child.id,
          name: child.first_name,
          avatar_url: child.avatar_url,
          type: 'child'
        });
      });
      setProfiles(profileOptions);

      const summariesData: ChildRoutineSummary[] = [];

      for (const child of children || []) {
        if (!child.child_profile_id) continue;

        // Fetch routines and stats
        const morningRes = await routineService.getActiveRoutine(child.child_profile_id, 'morning');
        const eveningRes = await routineService.getActiveRoutine(child.child_profile_id, 'evening');
        const statsRes = await routineService.getRoutineStats(child.child_profile_id);

        const morningRoutine = morningRes.ok ? morningRes.value : null;
        const eveningRoutine = eveningRes.ok ? eveningRes.value : null;
        const stats = statsRes.ok ? {
          streak: statsRes.value.current_streak,
          totalCompleted: statsRes.value.total_routines_completed
        } : { streak: 0, totalCompleted: 0 };

        // Generate alerts
        const alerts: Alert[] = [];

        if (!morningRoutine && !eveningRoutine) {
          alerts.push({ type: 'warning', message: 'No routines set up yet' });
        } else if (!morningRoutine) {
          alerts.push({ type: 'info', message: 'No morning routine' });
        } else if (!eveningRoutine) {
          alerts.push({ type: 'info', message: 'No evening routine' });
        }

        if (stats.streak === 0 && stats.totalCompleted > 0) {
          alerts.push({ type: 'warning', message: 'Streak broken - encourage them!' });
        } else if (stats.streak >= 7) {
          alerts.push({ type: 'success', message: `🔥 ${stats.streak} day streak!` });
        }

        summariesData.push({
          child,
          morningRoutine,
          eveningRoutine,
          stats,
          alerts
        });
      }

      setSummaries(summariesData);

    } catch (error) {
      console.error('Error loading routines:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load week completion status when a child is selected
  const loadWeekCompletionStatus = async () => {
    if (!selectedChildSummary) return;
    const childId = selectedChildSummary.child.child_profile_id;
    const routines = {
      morning: selectedChildSummary.morningRoutine,
      evening: selectedChildSummary.eveningRoutine
    };

    try {
      const dates: string[] = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - ((new Date().getDay() === 0 ? 6 : new Date().getDay() - 1) - i));
        dates.push(date.toISOString().split('T')[0]);
      }

      const { data: completions, error } = await supabase
        .from('routine_step_completions')
        .select('completion_date, routine_id, routine_step_id')
        .eq('child_profile_id', childId)
        .in('completion_date', dates);

      if (error) throw error;

      const statusByDay: DayCompletionStatus = {};

      for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        const dateStr = dates[dayIndex];
        const today = new Date().toISOString().split('T')[0];

        if (dateStr > today) {
          statusByDay[dayIndex] = 'none';
          continue;
        }

        const dayCompletions = completions?.filter(c => c.completion_date === dateStr) || [];

        let totalStepsNeeded = 0;
        let totalStepsCompleted = 0;

        Object.values(routines).forEach(routine => {
          if (routine && Array.isArray(routine.steps)) {
            totalStepsNeeded += routine.steps.length;
            const routineCompletions = dayCompletions.filter(c => c.routine_id === routine.id);
            totalStepsCompleted += routineCompletions.length;
          }
        });

        if (totalStepsNeeded === 0 || totalStepsCompleted === 0) {
          statusByDay[dayIndex] = 'none';
        } else if (totalStepsCompleted === totalStepsNeeded) {
          statusByDay[dayIndex] = 'complete';
        } else {
          statusByDay[dayIndex] = 'partial';
        }
      }

      setDayCompletionStatus(statusByDay);

      // Individual routine status for today
      const today = new Date().toISOString().split('T')[0];
      const routineStatus: Record<string, boolean> = {};

      for (const [segment, routine] of Object.entries(routines)) {
        if (routine && routine.id) {
          const routineCompletions = completions?.filter(c =>
            c.routine_id === routine.id && c.completion_date === today
          ) || [];
          const uniqueCompletedStepIds = new Set(routineCompletions.map(c => c.routine_step_id));
          const totalSteps = routine.steps?.length || 0;
          const completedSteps = uniqueCompletedStepIds.size;
          routineStatus[routine.id] = totalSteps > 0 && completedSteps === totalSteps;
        }
      }

      setRoutineCompletionStatus(routineStatus);
    } catch (error) {
      console.error('Error loading week completion status:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.id]);

  // When child is selected, load completion status
  useEffect(() => {
    if (selectedChildSummary) {
      loadWeekCompletionStatus();
    }
  }, [activeFilter, selectedChildSummary?.child.child_profile_id]);

  // Reload on focus
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [user?.id])
  );

  const handleRoutinePress = (routineId: string) => {
    router.push(`/(parent)/routine/${routineId}`);
  };

  // Day navigation
  const goToPreviousDay = () => {
    setSelectedViewDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() - 1);
      return newDate;
    });
  };

  const goToNextDay = () => {
    setSelectedViewDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() + 1);
      return newDate;
    });
  };

  const getDateForDay = (dayIndex: number) => {
    const today = new Date();
    const currentDayIndex = today.getDay() === 0 ? 6 : today.getDay() - 1;
    const diff = dayIndex - currentDayIndex;
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + diff);
    return targetDate.getDate().toString();
  };

  const getFullDateDisplay = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(selectedViewDate);
    selected.setHours(0, 0, 0, 0);

    const dayName = DAY_NAMES[selectedViewDay];
    const month = selectedViewDate.toLocaleDateString('en-US', { month: 'short' });
    const date = selectedViewDate.getDate();

    if (selected.getTime() === today.getTime()) {
      return `Today, ${month} ${date}`;
    }

    return `${dayName}, ${month} ${date}`;
  };

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle size={14} color={colors.orange} />;
      case 'success':
        return <CheckCircle size={14} color="#34C759" />;
      default:
        return <Clock size={14} color={colors.charcoal} />;
    }
  };

  const getAlertStyle = (type: Alert['type']) => {
    switch (type) {
      case 'warning':
        return { backgroundColor: colors.orange + '20', borderColor: colors.orange };
      case 'success':
        return { backgroundColor: '#34C75920', borderColor: '#34C759' };
      default:
        return { backgroundColor: colors.cream, borderColor: colors.charcoal + '30' };
    }
  };

  // Filter summaries based on active filter
  const filteredSummaries = activeFilter === 'all'
    ? summaries
    : summaries.filter(s => s.child.child_profile_id === activeFilter);

  // Render routine card for child view
  const renderChildRoutineCard = (routine: CustomRoutine | null, type: 'morning' | 'evening') => {
    const Icon = type === 'morning' ? Sun : Moon;
    const iconBg = type === 'morning' ? '#FFD580' : colors.lilac;
    const iconColor = type === 'morning' ? '#FF9500' : colors.purple;

    if (!routine) {
      return (
        <View style={[styles.childRoutineCard, styles.childRoutineCardEmpty]}>
          <View style={styles.childCardHeader}>
            <View style={[styles.childCardIcon, { backgroundColor: iconBg }]}>
              <Icon size={24} color={iconColor} />
            </View>
            <View>
              <Text style={styles.childCardTitle}>{type === 'morning' ? 'Morning' : 'Evening'} Routine</Text>
              <Text style={styles.childCardMeta}>Not set up</Text>
            </View>
          </View>
        </View>
      );
    }

    const isComplete = routineCompletionStatus[routine.id] || false;
    const activeDays = routine.active_days || [0, 1, 2, 3, 4, 5, 6];

    return (
      <TouchableOpacity
        style={[styles.childRoutineCard, isComplete && styles.childRoutineCardComplete]}
        onPress={() => handleRoutinePress(routine.id)}
        activeOpacity={0.8}
      >
        <View style={styles.childCardHeader}>
          <View style={[styles.childCardIcon, { backgroundColor: isComplete ? colors.mint : iconBg }]}>
            <Icon size={24} color={isComplete ? colors.white : iconColor} />
          </View>
          <View style={styles.childCardContent}>
            <Text style={styles.childCardTitle}>{routine.name}</Text>
            <View style={styles.childCardMetaRow}>
              <Clock size={12} color={colors.charcoal} />
              <Text style={styles.childCardMeta}>{routine.total_duration} mins • {routine.steps?.length || 0} steps</Text>
            </View>
          </View>
          {isComplete && (
            <Ionicons name="checkmark-circle" size={24} color={colors.mint} />
          )}
        </View>

        {/* Active Days */}
        <View style={styles.activeDaysRow}>
          {DAYS.map((day, index) => {
            const isActive = activeDays.includes(index);
            return (
              <View key={index} style={[styles.dayDot, isActive && styles.dayDotActive]}>
                <Text style={[styles.dayDotText, isActive && styles.dayDotTextActive]}>{day}</Text>
              </View>
            );
          })}
        </View>

        <View style={styles.viewDetailsButton}>
          <Eye size={16} color={colors.purple} />
          <Text style={styles.viewDetailsText}>View Details</Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Render child view (when specific child selected)
  const renderChildView = () => {
    if (!selectedChildSummary) return null;

    return (
      <>
        {/* Day Selector - Full Width */}
        <View style={styles.daySelectorContainer}>
          <View style={styles.dayRow}>
            <TouchableOpacity style={styles.navArrow} onPress={goToPreviousDay}>
              <ChevronLeft size={20} color={colors.white} strokeWidth={2.5} />
            </TouchableOpacity>

            <View style={styles.dayCircles}>
              {DAYS.map((day, index) => {
                const isSelected = selectedViewDay === index;
                const isToday = (() => {
                  const today = new Date().getDay();
                  const todayIndex = today === 0 ? 6 : today - 1;
                  return index === todayIndex;
                })();
                const completionStatus = dayCompletionStatus[index] || 'none';

                return (
                  <TouchableOpacity
                    key={index}
                    style={styles.dayCircleWrapper}
                    onPress={() => {
                      const weekStart = new Date(selectedViewDate);
                      weekStart.setDate(weekStart.getDate() - selectedViewDay);
                      const targetDate = new Date(weekStart);
                      targetDate.setDate(weekStart.getDate() + index);
                      setSelectedViewDate(targetDate);
                    }}
                    activeOpacity={0.7}
                  >
                    {/* Date number above */}
                    <Text style={[
                      styles.dateNumber,
                      isSelected && styles.dateNumberActive,
                    ]}>
                      {getDateForDay(index)}
                    </Text>
                    {/* Day circle */}
                    <View style={[
                      styles.dayCircle,
                      isSelected && styles.dayCircleActive,
                      isToday && !isSelected && styles.dayCircleToday,
                      !isToday && !isSelected && completionStatus === 'complete' && styles.dayCircleComplete,
                      !isToday && !isSelected && completionStatus === 'partial' && styles.dayCirclePartial,
                    ]}>
                      <Text style={[
                        styles.dayText,
                        isSelected && styles.dayTextActive,
                        !isSelected && completionStatus === 'complete' && styles.dayTextComplete
                      ]}>
                        {day}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity style={styles.navArrow} onPress={goToNextDay}>
              <ChevronRight size={20} color={colors.white} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Content with padding */}
        <View style={styles.childViewContent}>
          {/* Date Display */}
          <View style={styles.dateHeader}>
            <Text style={styles.dateDisplay}>{getFullDateDisplay()}</Text>
          </View>

          {/* Routine Cards - Full Width */}
          <View style={styles.childCardsContainer}>
            {renderChildRoutineCard(selectedChildSummary.morningRoutine, 'morning')}
            {renderChildRoutineCard(selectedChildSummary.eveningRoutine, 'evening')}
          </View>
        </View>
      </>
    );
  };

  // Render hub view (all children)
  const renderHubView = () => {
    if (filteredSummaries.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No children linked yet.</Text>
          <Text style={styles.emptyStateSubtext}>Link a child account to manage their routines.</Text>
        </View>
      );
    }

    return filteredSummaries.map((summary) => (
      <TouchableOpacity
        key={summary.child.id}
        style={styles.childSection}
        onPress={() => setActiveFilter(summary.child.child_profile_id)}
        activeOpacity={0.9}
      >
        {/* Child Header */}
        <View style={styles.childHeader}>
          <Image
            source={{ uri: summary.child.avatar_url || 'https://via.placeholder.com/48' }}
            style={styles.avatar}
          />
          <View style={styles.childInfo}>
            <Text style={styles.childName}>{summary.child.first_name}</Text>
            <View style={styles.statsRow}>
              <TrendingUp size={12} color={colors.purple} />
              <Text style={styles.statsText}>
                {summary.stats.streak > 0 ? `${summary.stats.streak} day streak` : 'No streak'} • {summary.stats.totalCompleted} completed
              </Text>
            </View>
          </View>
          <ChevronRight size={20} color={colors.charcoal} style={{ opacity: 0.4 }} />
        </View>

        {/* Alerts */}
        {summary.alerts.length > 0 && (
          <View style={styles.alertsContainer}>
            {summary.alerts.map((alert, idx) => (
              <View key={idx} style={[styles.alertBadge, getAlertStyle(alert.type)]}>
                {getAlertIcon(alert.type)}
                <Text style={styles.alertText}>{alert.message}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Routine Cards */}
        <View style={styles.cardsContainer}>
          {/* Morning Routine Card */}
          <View style={[styles.card, !summary.morningRoutine && styles.emptyCard]}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconContainer, { backgroundColor: '#FFD580' }]}>
                <Ionicons name="sunny" size={20} color="#FF9500" />
              </View>
              <Text style={styles.cardTitle}>Morning</Text>
            </View>
            {summary.morningRoutine ? (
              <View>
                <Text style={styles.stepCount}>{summary.morningRoutine.steps.length} Steps</Text>
                <Text style={styles.duration}>
                  ~{summary.morningRoutine.total_duration} min
                </Text>
              </View>
            ) : (
              <Text style={styles.emptyText}>Not set</Text>
            )}
          </View>

          {/* Evening Routine Card */}
          <View style={[styles.card, !summary.eveningRoutine && styles.emptyCard]}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconContainer, { backgroundColor: '#E0E0FF' }]}>
                <Ionicons name="moon" size={20} color="#5856D6" />
              </View>
              <Text style={styles.cardTitle}>Evening</Text>
            </View>
            {summary.eveningRoutine ? (
              <View>
                <Text style={styles.stepCount}>{summary.eveningRoutine.steps.length} Steps</Text>
                <Text style={styles.duration}>
                  ~{summary.eveningRoutine.total_duration} min
                </Text>
              </View>
            ) : (
              <Text style={styles.emptyText}>Not set</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    ));
  };

  return (
    <View style={styles.container}>
      <PageHeader
        title="Routines"
        subtitle="Manage your family's routines"
        showSearch={true}
        searchPlaceholder="Search routines..."
        avatarUrl={avatarUrl}
      />

      {/* Profile Filter Row */}
      <View style={styles.profileSelectorRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.profileSelectorContent}
          style={styles.profileScrollView}
        >
          {profiles.map(profile => {
            const isActive = activeFilter === profile.id;
            return (
              <Pressable
                key={profile.id}
                style={[styles.profileChip, isActive && styles.profileChipActive]}
                onPress={() => setActiveFilter(profile.id)}
              >
                <View style={[styles.profileIcon, isActive && { backgroundColor: 'white' }]}>
                  {profile.type === 'all' ? (
                    <Users size={14} color={isActive ? colors.purple : colors.charcoal} />
                  ) : profile.avatar_url ? (
                    <Image source={{ uri: profile.avatar_url }} style={styles.profileImage} />
                  ) : (
                    <Baby size={14} color={isActive ? colors.purple : colors.charcoal} />
                  )}
                </View>
                <Text style={[styles.profileName, isActive && styles.profileNameActive]}>
                  {profile.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} tintColor={colors.purple} />}
      >
        {loading && summaries.length === 0 && filteredSummaries.length === 0 ? (
          <ActivityIndicator size="large" color={colors.purple} style={{ marginTop: 40 }} />
        ) : selectedChildSummary ? (
          renderChildView()
        ) : (
          renderHubView()
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  content: {
    padding: spacing[6],
    paddingBottom: 100,
  },
  // Profile Selector
  profileSelectorRow: {
    marginTop: spacing[4],
    marginBottom: spacing[2],
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: spacing[6],
    gap: spacing[3],
  },
  profileScrollView: {
    flex: 1,
  },
  profileSelectorContent: {
    paddingLeft: spacing[6],
    paddingRight: spacing[3],
    gap: spacing[3],
  },
  profileChip: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
    paddingRight: 12,
    backgroundColor: 'white',
    borderRadius: radii.full,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  profileChipActive: {
    backgroundColor: colors.purple,
    borderColor: colors.purple,
  },
  profileIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.cream,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  profileImage: {
    width: 28,
    height: 28,
  },
  profileName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.charcoal,
  },
  profileNameActive: {
    color: 'white',
  },
  // Hub View Styles
  childSection: {
    marginBottom: spacing[4],
    backgroundColor: 'white',
    borderRadius: radii.xl,
    padding: spacing[5],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  childHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.cream,
    marginRight: spacing[3],
  },
  childInfo: {
    flex: 1,
  },
  childName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.black,
    marginBottom: 2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statsText: {
    fontSize: 13,
    color: colors.charcoal,
  },
  alertsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  alertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: radii.full,
    borderWidth: 1,
  },
  alertText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.charcoal,
  },
  cardsContainer: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  card: {
    flex: 1,
    backgroundColor: colors.cream,
    borderRadius: radii.lg,
    padding: spacing[4],
    minHeight: 110,
    justifyContent: 'space-between',
  },
  emptyCard: {
    opacity: 0.6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    borderStyle: 'dashed',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing[2],
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.black,
  },
  stepCount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.black,
    marginBottom: 2,
  },
  duration: {
    fontSize: 12,
    color: colors.charcoal,
  },
  emptyText: {
    fontSize: 13,
    color: colors.charcoal,
    opacity: 0.6,
    fontStyle: 'italic',
  },
  // Empty State
  emptyState: {
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.black,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: colors.charcoal,
    textAlign: 'center',
  },
  // Child View Styles
  childViewContainer: {
    flex: 1,
  },
  childViewContent: {
    padding: spacing[6],
  },
  daySelectorContainer: {
    backgroundColor: colors.purple,
    paddingVertical: spacing[4],
    paddingTop: spacing[2],
    marginHorizontal: -spacing[6],
    marginTop: -spacing[6],
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
  },
  navArrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.purple,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayCircles: {
    flexDirection: 'row',
    gap: spacing[1],
  },
  dayCircleWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateNumber: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 4,
  },
  dateNumberActive: {
    color: colors.white,
    fontWeight: '700',
  },
  dayCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  dayCircleActive: {
    backgroundColor: colors.white,
    borderColor: colors.white,
  },
  dayCircleToday: {
    borderColor: colors.white,
    borderWidth: 2,
  },
  dayCircleComplete: {
    backgroundColor: colors.mint,
    borderColor: colors.mint,
  },
  dayCirclePartial: {
    backgroundColor: colors.orange,
    borderColor: colors.orange,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.8)',
  },
  dayTextActive: {
    color: colors.purple,
  },
  dayTextComplete: {
    color: colors.white,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.charcoal,
  },
  dateTextActive: {
    color: colors.white,
  },
  dateTextComplete: {
    color: colors.white,
  },
  childStatsBand: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: spacing[4],
    marginBottom: spacing[4],
    justifyContent: 'center',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: spacing[6],
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.black,
  },
  statLabel: {
    fontSize: 12,
    color: colors.charcoal,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
    paddingBottom: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.mist,
  },
  dateDisplay: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.purple,
  },
  childCardsContainer: {
    gap: spacing[4],
  },
  childRoutineCard: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: spacing[5],
    borderWidth: 2,
    borderColor: colors.mint,
    borderStyle: 'dashed',
  },
  childRoutineCardComplete: {
    borderColor: colors.mint,
    backgroundColor: colors.mint + '10',
  },
  childRoutineCardEmpty: {
    borderColor: colors.mist,
    borderStyle: 'dashed',
  },
  childCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  childCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[4],
  },
  childCardContent: {
    flex: 1,
  },
  childCardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.charcoal,
    marginBottom: 4,
  },
  childCardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  childCardMeta: {
    fontSize: 13,
    color: colors.charcoal,
    opacity: 0.7,
  },
  activeDaysRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing[2],
    marginBottom: spacing[4],
    paddingTop: spacing[2],
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  dayDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.cream,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  dayDotActive: {
    backgroundColor: colors.purple,
    borderColor: colors.purple,
  },
  dayDotText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.charcoal,
  },
  dayDotTextActive: {
    color: colors.white,
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cream,
    paddingVertical: spacing[3],
    borderRadius: radii.lg,
    gap: spacing[2],
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.purple,
  },
});

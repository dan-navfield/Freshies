import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, Pressable } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Sun, Moon, Sunrise, Clock, Play, ChevronLeft, ChevronRight, Check, Settings, Calendar } from 'lucide-react-native';
import { colors, spacing, radii } from '../../../src/theme/tokens';
import { supabase } from '../../../src/lib/supabase';
import GamificationBand from '../../../src/components/gamification/GamificationBand';
import PageHeader from '../../../src/components/navigation/PageHeader';
import { useChildProfile } from '../../../src/contexts/ChildProfileContext';
import { useAuth } from '../../../src/contexts/AuthContext';
import RoutineBottomSheet from '../../../src/components/routine/RoutineBottomSheet';
import SwipeableRoutineCard from '../../../src/components/routine/SwipeableRoutineCard';
import { StyleSheet, Alert } from 'react-native';
import {
  setupNotificationResponseHandler,
  scheduleAllRoutineNotifications,
  requestNotificationPermissions
} from '../../../src/services/routineNotificationScheduler';

type Segment = 'morning' | 'afternoon' | 'evening';

interface RoutineCardData {
  id: string;
  name: string;
  segment: Segment;
  steps: any[];
  total_duration: number;
  completion_count: number;
  active_days?: number[];
}

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

interface DayCompletionStatus {
  [dayIndex: number]: 'complete' | 'partial' | 'none';
}

export default function RoutineHomeScreen() {
  const router = useRouter();
  const { childProfile } = useChildProfile();
  const { user } = useAuth();
  const [routines, setRoutines] = useState<{ morning: RoutineCardData[], afternoon: RoutineCardData[], evening: RoutineCardData[] }>({ morning: [], afternoon: [], evening: [] });
  const [loading, setLoading] = useState(true);
  const [selectedRoutine, setSelectedRoutine] = useState<RoutineCardData | null>(null);
  const [selectedSegment, setSelectedSegment] = useState<Segment | null>(null);
  const [selectedViewDate, setSelectedViewDate] = useState<Date>(() => new Date());
  const [expandedRoutines, setExpandedRoutines] = useState<Set<Segment>>(new Set());
  const [routineCompletionStatus, setRoutineCompletionStatus] = useState<Record<string, boolean>>({});
  const [snoozedRoutines, setSnoozedRoutines] = useState<Set<string>>(new Set());
  const [skippedRoutines, setSkippedRoutines] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const selectedViewDay = (() => {
    const day = selectedViewDate.getDay();
    return day === 0 ? 6 : day - 1; // Convert to our format (0 = Monday)
  })();
  const [dayCompletionStatus, setDayCompletionStatus] = useState<DayCompletionStatus>({});

  useEffect(() => {
    if (childProfile?.id) {
      loadAllRoutines();
      initializeNotifications();
      loadWeekCompletionStatus();
      loadRoutineActions();
    }
  }, [childProfile]);

  // Reload routines when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (childProfile?.id) {
        loadAllRoutines();
        initializeNotifications();
        loadRoutineActions();
      }
    }, [childProfile?.id])
  );

  useEffect(() => {
    if (childProfile?.id && Object.keys(routines).length > 0) {
      loadWeekCompletionStatus();
    }
  }, [routines, childProfile]);

  // Load snoozed and skipped routines for today
  const loadRoutineActions = async () => {
    if (!childProfile?.id) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const now = new Date();

      const { data: actions } = await supabase
        .from('routine_actions')
        .select('*')
        .eq('child_profile_id', childProfile.id)
        .eq('action_date', today);

      const snoozed = new Set<string>();
      const skipped = new Set<string>();

      actions?.forEach(action => {
        if (action.action_type === 'skip') {
          skipped.add(action.routine_id);
        } else if (action.action_type === 'snooze') {
          // Check if snooze time has passed
          if (action.snooze_until && new Date(action.snooze_until) > now) {
            snoozed.add(action.routine_id);
          }
        }
      });

      setSnoozedRoutines(snoozed);
      setSkippedRoutines(skipped);
    } catch (error) {
      console.error('Error loading routine actions:', error);
    }
  };

  const handleSnoozeRoutine = async (routineId: string, routineName: string) => {
    if (!childProfile?.id) return;

    try {
      const snoozeUntil = new Date();
      snoozeUntil.setHours(snoozeUntil.getHours() + 1);

      const { error } = await supabase
        .from('routine_actions')
        .upsert({
          child_profile_id: childProfile.id,
          routine_id: routineId,
          action_type: 'snooze',
          action_date: new Date().toISOString().split('T')[0],
          snooze_until: snoozeUntil.toISOString(),
        });

      if (error) throw error;

      setSnoozedRoutines(prev => new Set(prev).add(routineId));

      Alert.alert(
        'Routine Snoozed ⏰',
        `${routineName} will remind you in 1 hour`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error snoozing routine:', error);
      Alert.alert('Error', 'Failed to snooze routine');
    }
  };

  const handleSkipRoutine = async (routineId: string, routineName: string) => {
    if (!childProfile?.id) return;

    Alert.alert(
      'Skip Routine?',
      `Skip ${routineName} for today? You can still complete it later.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Skip Today',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('routine_actions')
                .upsert({
                  child_profile_id: childProfile.id,
                  routine_id: routineId,
                  action_type: 'skip',
                  action_date: new Date().toISOString().split('T')[0],
                });

              if (error) throw error;

              setSkippedRoutines(prev => new Set(prev).add(routineId));
            } catch (error) {
              console.error('Error skipping routine:', error);
              Alert.alert('Error', 'Failed to skip routine');
            }
          },
        },
      ]
    );
  };

  // Initialize notifications
  const initializeNotifications = async () => {
    if (!childProfile?.id || !user?.id) return;

    try {
      // Request permissions
      const hasPermission = await requestNotificationPermissions();

      if (hasPermission) {
        // Schedule notifications for all active routines
        await scheduleAllRoutineNotifications(childProfile.id, user.id);

        // Set up notification tap handler
        setupNotificationResponseHandler((routineId, segment) => {
          // Find and open the routine when notification is tapped
          const allRoutines = [...routines.morning, ...routines.afternoon, ...routines.evening];
          const routine = allRoutines.find(r => r?.id === routineId);
          if (routine) {
            setSelectedRoutine(routine);
          }
        });
      }
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  };

  const loadAllRoutines = async () => {
    if (!childProfile?.id) {
      setLoading(false);
      return;
    }

    if (childProfile?.id === undefined) {
      setLoading(false);
      return;
    }

    try {
      const { routineService } = await import('../../../src/services/routineService');
      const result = await routineService.getRoutinesForToday(childProfile.id);

      if (!result.ok) {
        throw result.error;
      }

      const allRoutines = result.value;
      const routinesBySegment: { morning: RoutineCardData[], afternoon: RoutineCardData[], evening: RoutineCardData[] } = {
        morning: [],
        afternoon: [],
        evening: []
      };

      allRoutines.forEach(routine => {
        const segment = routine.segment as Segment;
        if (routinesBySegment[segment]) {
          routinesBySegment[segment].push(routine as RoutineCardData);
        }
      });

      setRoutines(routinesBySegment);
    } catch (error) {
      console.error('Error loading routines:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadWeekCompletionStatus = async () => {
    if (!childProfile?.id || Object.keys(routines).length === 0) return;

    try {
      console.log('🔄 Loading week completion status...');
      console.log('Child profile ID:', childProfile.id);
      console.log('Routines:', Object.keys(routines));

      // Get dates for the current week (last 7 days)
      const dates: string[] = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - ((new Date().getDay() === 0 ? 6 : new Date().getDay() - 1) - i));
        dates.push(date.toISOString().split('T')[0]);
      }

      console.log('Checking dates:', dates);

      // Get all completions for the week
      const { data: completions, error } = await supabase
        .from('routine_step_completions')
        .select('completion_date, routine_id, routine_step_id')
        .eq('child_profile_id', childProfile.id)
        .in('completion_date', dates);

      if (error) throw error;

      console.log('Found completions:', completions?.length || 0);

      // Calculate completion status for each day
      const statusByDay: DayCompletionStatus = {};

      for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        const dateStr = dates[dayIndex];
        const today = new Date().toISOString().split('T')[0];

        // Skip future days only (not today)
        if (dateStr > today) {
          statusByDay[dayIndex] = 'none';
          continue;
        }

        // Get completions for this day
        const dayCompletions = completions?.filter(c => c.completion_date === dateStr) || [];

        // Count total steps needed across all active routines
        let totalStepsNeeded = 0;
        let totalStepsCompleted = 0;

        // Iterate over all segments and all routines within each segment
        const allRoutines = [...routines.morning, ...routines.afternoon, ...routines.evening];
        allRoutines.forEach(routine => {
          if (routine && Array.isArray(routine.steps)) {
            totalStepsNeeded += routine.steps.length;

            // Count completed steps for this routine on this day
            const routineCompletions = dayCompletions.filter(c => c.routine_id === routine.id);
            totalStepsCompleted += routineCompletions.length;
          }
        });

        // Determine status
        if (totalStepsNeeded === 0) {
          statusByDay[dayIndex] = 'none';
        } else if (totalStepsCompleted === 0) {
          statusByDay[dayIndex] = 'none';
        } else if (totalStepsCompleted === totalStepsNeeded) {
          statusByDay[dayIndex] = 'complete';
        } else {
          statusByDay[dayIndex] = 'partial';
        }
      }

      setDayCompletionStatus(statusByDay);

      // Also load individual routine completion status for today
      const today = new Date().toISOString().split('T')[0];
      const routineStatus: Record<string, boolean> = {};

      console.log('📊 Checking individual routine completion for today:', today);

      // Iterate over all routines in all segments
      const allRoutinesFlat = [...routines.morning, ...routines.afternoon, ...routines.evening];
      for (const routine of allRoutinesFlat) {
        if (routine && routine.id) {
          const routineCompletions = completions?.filter(c =>
            c.routine_id === routine.id && c.completion_date === today
          ) || [];

          // Get unique step IDs (in case of duplicates)
          const uniqueCompletedStepIds = new Set(routineCompletions.map(c => c.routine_step_id));

          console.log(`    Completed step IDs:`, Array.from(uniqueCompletedStepIds));
          console.log(`    Expected step IDs:`, routine.steps?.map((s: any) => s.id));

          const totalSteps = routine.steps?.length || 0;
          const completedSteps = uniqueCompletedStepIds.size;
          const isComplete = totalSteps > 0 && completedSteps === totalSteps;

          console.log(`  ${routine.segment} (${routine.id}): ${completedSteps}/${totalSteps} unique steps = ${isComplete ? '✅ COMPLETE' : '❌ INCOMPLETE'}`);

          routineStatus[routine.id] = isComplete;
        }
      }

      console.log('Final routine status:', routineStatus);
      setRoutineCompletionStatus(routineStatus);
    } catch (error) {
      console.error('Error loading week completion status:', error);
    }
  };

  const getSegmentIcon = (segment: Segment) => {
    switch (segment) {
      case 'morning': return Sun;
      case 'afternoon': return Sunrise;
      case 'evening': return Moon;
    }
  };

  const getSegmentGradient = (segment: Segment) => {
    switch (segment) {
      case 'morning': return ['#FFD93D', '#FFA500'];
      case 'afternoon': return ['#87CEEB', '#4682B4'];
      case 'evening': return ['#6B5B95', '#4A4063'];
    }
  };

  const openRoutine = (routine: RoutineCardData) => {
    setSelectedRoutine(routine);
  };

  const closeRoutineModal = () => {
    setSelectedRoutine(null);
    // Refresh completion status when closing the modal
    loadWeekCompletionStatus();
  };

  const toggleDay = async (dayIndex: number, routineId: string, segment: Segment) => {
    // Find the routine in the appropriate segment array
    const segmentRoutines = routines[segment];
    const routineIndex = segmentRoutines.findIndex(r => r.id === routineId);
    if (routineIndex === -1) return;

    const routine = segmentRoutines[routineIndex];

    const currentDays = routine.active_days || [0, 1, 2, 3, 4];
    const newDays = currentDays.includes(dayIndex)
      ? currentDays.filter((d: number) => d !== dayIndex)
      : [...currentDays, dayIndex].sort();

    // Update locally
    setRoutines(prev => {
      const updatedSegment = [...prev[segment]];
      updatedSegment[routineIndex] = { ...routine, active_days: newDays };
      return {
        ...prev,
        [segment]: updatedSegment
      };
    });

    // Update in database
    const { routineService } = await import('../../../src/services/routineService');
    const result = await routineService.updateActiveDays(routine.id, newDays);
    if (!result.ok) {
      console.error('Failed to update active days:', result.error);
    }
  };

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

    return targetDate.getDate().toString(); // Just return the day number
  };

  const getFullDateDisplay = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(selectedViewDate);
    selected.setHours(0, 0, 0, 0);

    const dayName = DAY_NAMES[selectedViewDay];
    const month = selectedViewDate.toLocaleDateString('en-US', { month: 'short' });
    const date = selectedViewDate.getDate();

    // Check if it's today
    if (selected.getTime() === today.getTime()) {
      return `Today, ${month} ${date}`;
    }

    return `${dayName}, ${month} ${date}`;
  };

  const renderTopDaySelector = () => {
    return (
      <View style={styles.daySelectorContainer}>
        <View style={styles.compactDayRow}>
          <TouchableOpacity
            style={styles.compactNavArrow}
            onPress={goToPreviousDay}
            activeOpacity={0.7}
          >
            <ChevronLeft size={20} color={colors.purple} strokeWidth={2.5} />
          </TouchableOpacity>

          <View style={styles.dayCirclesCompact}>
            {DAYS.map((day, index) => {
              const isSelected = selectedViewDay === index;
              const isToday = (() => {
                const today = new Date().getDay();
                const todayIndex = today === 0 ? 6 : today - 1;
                return index === todayIndex;
              })();
              const completionStatus = dayCompletionStatus[index] || 'none';

              return (
                <View key={index} style={styles.dayCircleWrapper}>
                  <TouchableOpacity
                    style={[
                      styles.compactDayCircle,
                      isSelected && styles.dayCircleActive,
                      isToday && !isSelected && styles.dayCircleToday,
                      !isToday && !isSelected && completionStatus === 'complete' && styles.dayCircleComplete,
                      !isToday && !isSelected && completionStatus === 'partial' && styles.dayCirclePartial,
                      !isToday && !isSelected && completionStatus === 'none' && styles.dayCircleIncomplete
                    ]}
                    onPress={() => {
                      // Calculate the date for the clicked day in the current week view
                      const weekStart = new Date(selectedViewDate);
                      weekStart.setDate(weekStart.getDate() - selectedViewDay); // Go to Monday of current week
                      const targetDate = new Date(weekStart);
                      targetDate.setDate(weekStart.getDate() + index);
                      setSelectedViewDate(targetDate);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.compactDayText,
                      isSelected && styles.dayTextActive,
                      !isSelected && completionStatus === 'complete' && styles.dayTextComplete
                    ]}>
                      {day}
                    </Text>
                    <View style={styles.dateBadge}>
                      <Text style={[
                        styles.dateBadgeText,
                        isSelected && styles.dateBadgeTextActive,
                        !isSelected && completionStatus === 'complete' && styles.dateBadgeTextComplete
                      ]}>
                        {getDateForDay(index)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>

          <TouchableOpacity
            style={styles.compactNavArrow}
            onPress={goToNextDay}
            activeOpacity={0.7}
          >
            <ChevronRight size={20} color={colors.purple} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderDaySelector = (segment: Segment, routine?: RoutineCardData) => {
    if (!routine) return null;

    const activeDays = routine.active_days || [0, 1, 2, 3, 4];

    return (
      <View style={styles.miniDaySelector}>
        {DAYS.map((day, index) => {
          const isSelected = activeDays.includes(index);
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.miniDayCircle,
                isSelected && styles.miniDayCircleActive
              ]}
              onPress={() => toggleDay(index, routine.id, segment)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.miniDayText,
                isSelected && styles.miniDayTextActive
              ]}>
                {day}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  // Render an empty routine card when no routines exist for a segment
  const renderEmptyRoutineCard = (segment: Segment) => {
    const Icon = getSegmentIcon(segment);

    return (
      <TouchableOpacity
        key={`empty-${segment}`}
        style={[
          styles.routineCard,
          styles.routineCardInactive,
          styles.routineCardEmpty
        ]}
        onPress={() => {
          router.push({
            pathname: '/(child)/routine-builder-enhanced',
            params: { segment }
          });
        }}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={[styles.iconCircle, { backgroundColor: colors.mist }]}>
              <Icon size={28} color={colors.charcoal} />
            </View>
            <Text style={styles.cardTitle}>
              {`${segment.charAt(0).toUpperCase() + segment.slice(1)} Routine`}
            </Text>
          </View>
        </View>

        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No routine set</Text>
          <Text style={styles.emptySubtext}>Tap to create</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderRoutineCard = (routine: RoutineCardData, segment: Segment) => {
    // Filter by search query if active
    if (searchQuery) {
      if (!routine.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return null;
      }
    }

    const Icon = getSegmentIcon(segment);

    // Check if this routine is active on the selected day
    const isActiveOnSelectedDay = routine.active_days?.includes(selectedViewDay) ?? false;

    // Determine if we're viewing "today" or a different day
    const today = new Date();
    const currentDayIndex = today.getDay() === 0 ? 6 : today.getDay() - 1;
    const isViewingToday = selectedViewDay === currentDayIndex;

    // Check if THIS specific routine is complete for today
    const isCompleteToday = isViewingToday ? routineCompletionStatus[routine.id] === true : false;

    // If viewing OTHER DAY: only show routines scheduled for that day
    if (!isViewingToday && !isActiveOnSelectedDay) {
      return null;
    }

    const isSkipped = skippedRoutines.has(routine.id);
    const isSnoozed = snoozedRoutines.has(routine.id);

    return (
      <SwipeableRoutineCard
        key={routine.id}
        onSnooze={!isCompleteToday ? () => handleSnoozeRoutine(routine.id, routine.name) : undefined}
        onSkip={!isCompleteToday ? () => handleSkipRoutine(routine.id, routine.name) : undefined}
        disabled={isCompleteToday || isSkipped}
      >
        <TouchableOpacity
          style={[
            styles.routineCard,
            isSkipped && styles.routineCardSkipped,
            isSnoozed && styles.routineCardSnoozed
          ]}
          onPress={() => openRoutine(routine)}
          activeOpacity={0.8}
        >
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <View style={[styles.iconCircle, { backgroundColor: colors.purple }]}>
                <Icon size={28} color={colors.white} />
              </View>
              <Text style={styles.cardTitle}>{routine.name}</Text>
            </View>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                setExpandedRoutines(prev => {
                  const newSet = new Set(prev);
                  const routineKey = routine.id as unknown as Segment; // Using routine id as key
                  if (newSet.has(routineKey)) {
                    newSet.delete(routineKey);
                  } else {
                    newSet.add(routineKey);
                  }
                  return newSet;
                });
              }}
              style={styles.expandButton}
              activeOpacity={0.7}
            >
              <ChevronRight
                size={20}
                color={colors.charcoal}
                style={{
                  transform: [{ rotate: expandedRoutines.has(routine.id as unknown as Segment) ? '90deg' : '0deg' }],
                  opacity: 0.6
                }}
              />
            </TouchableOpacity>
          </View>

          {expandedRoutines.has(routine.id as unknown as Segment) && (
            <>
              {/* Active Days Display (read-only) */}
              <View style={styles.dayCirclesDisplay}>
                {DAYS.map((day, index) => {
                  const activeDays = routine.active_days || [0, 1, 2, 3, 4, 5, 6];
                  const isActive = activeDays.includes(index);
                  return (
                    <View
                      key={index}
                      style={[
                        styles.dayCircleReadOnly,
                        isActive && styles.dayCircleReadOnlyActive
                      ]}
                    >
                      <Text style={[
                        styles.dayTextReadOnly,
                        isActive && styles.dayTextReadOnlyActive
                      ]}>
                        {day}
                      </Text>
                    </View>
                  );
                })}
              </View>

              <View style={styles.cardMeta}>
                <View style={styles.metaItem}>
                  <Clock size={16} color={colors.charcoal} />
                  <Text style={styles.metaText}>{routine.total_duration} mins</Text>
                </View>
                <View style={styles.metaItem}>
                  <Text style={styles.metaText}>{routine.steps?.length || 0} steps</Text>
                </View>
              </View>

              {/* Routine Steps Pills */}
              <View style={styles.stepsSection}>
                <Text style={styles.stepsSectionTitle}>Routine steps:</Text>
                <View style={styles.stepsPills}>
                  {routine.steps?.map((step: any, index: number) => (
                    <View key={index} style={styles.stepPill}>
                      <Text style={styles.stepPillText}>
                        {index + 1}. {step.title}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </>
          )}

          <View style={[
            styles.playButton,
            isCompleteToday && styles.playButtonComplete
          ]}>
            {isCompleteToday ? (
              <>
                <Check size={20} color={colors.white} strokeWidth={3} />
                <Text style={styles.playButtonText}>Complete! ✨</Text>
              </>
            ) : (
              <>
                <Play size={20} color={colors.white} fill={colors.white} />
                <Text style={styles.playButtonText}>Start Routine</Text>
              </>
            )}
          </View>
        </TouchableOpacity>
      </SwipeableRoutineCard>
    );
  };

  return (
    <View style={styles.container}>
      <PageHeader
        title="My Routines"
        subtitle="Your daily skincare journey! 🌟"
        showAvatar={true}
      />

      <GamificationBand />

      {renderTopDaySelector()}

      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContainer}>
        <View style={styles.dateHeader}>
          <Text style={styles.dateDisplay}>{getFullDateDisplay()}</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              onPress={() => router.push('/(child)/routine-history')}
              style={styles.headerButton}
            >
              <Calendar size={20} color={colors.purple} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/(child)/notification-settings')}
              style={styles.headerButton}
            >
              <Settings size={20} color={colors.purple} />
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <Text style={styles.loadingText}>Loading...</Text>
        ) : (
          <View style={styles.cardsContainer}>
            {/* Morning Routines */}
            {routines.morning.length > 0 ? (
              routines.morning.map(routine => renderRoutineCard(routine, 'morning'))
            ) : (
              renderEmptyRoutineCard('morning')
            )}

            {/* Afternoon Routines */}
            {routines.afternoon.length > 0 ? (
              routines.afternoon.map(routine => renderRoutineCard(routine, 'afternoon'))
            ) : (
              renderEmptyRoutineCard('afternoon')
            )}

            {/* Evening Routines */}
            {routines.evening.length > 0 ? (
              routines.evening.map(routine => renderRoutineCard(routine, 'evening'))
            ) : (
              renderEmptyRoutineCard('evening')
            )}
          </View>
        )}

        <TouchableOpacity
          style={styles.manageButton}
          onPress={() => router.push('/(child)/routines')}
        >
          <Text style={styles.manageButtonText}>Manage All Routines</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Routine Bottom Sheet */}
      <RoutineBottomSheet
        visible={!!selectedRoutine}
        onClose={closeRoutineModal}
        routine={selectedRoutine}
        onRoutineComplete={() => {
          // Refresh completion status when routine is completed
          loadWeekCompletionStatus();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContainer: {
    padding: spacing[6],
    paddingBottom: 120, // Extra padding for tab bar + manage button
  },
  daySelectorContainer: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.mist,
  },
  compactDayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  compactNavArrow: {
    width: 32,
    height: 32,
    borderRadius: radii.full,
    backgroundColor: colors.cream,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  dayCirclesCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    justifyContent: 'center',
  },
  dayCircleWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactDayDate: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.purple,
    marginBottom: spacing[1],
  },
  compactDayCircle: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    backgroundColor: colors.mist,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  dateBadge: {
    position: 'absolute',
    top: -6,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: radii.full,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.purple,
  },
  dateBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.purple,
  },
  dateBadgeTextActive: {
    color: colors.purple,
    backgroundColor: colors.white,
  },
  dateBadgeTextComplete: {
    color: colors.white,
  },
  compactDayText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.charcoal,
  },
  dayTextComplete: {
    color: colors.white,
  },
  dayCircleComplete: {
    backgroundColor: '#10B981', // Green for complete
    borderColor: '#10B981',
  },
  dayCirclePartial: {
    backgroundColor: '#F59E0B', // Orange for partial
    borderColor: '#F59E0B',
  },
  dayCircleIncomplete: {
    backgroundColor: colors.white,
    borderColor: colors.purple,
    borderWidth: 2,
  },
  dayNavigationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[3],
  },
  navArrow: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    backgroundColor: colors.cream,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayInfoCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedDayName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.charcoal,
    marginBottom: spacing[1],
  },
  selectedDayDate: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.charcoal,
    opacity: 0.6,
  },
  daySelectorLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.charcoal,
    opacity: 0.6,
    marginBottom: spacing[2],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dayCircles: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing[2],
  },
  dayCircle: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    backgroundColor: colors.mist,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  dayCircleActive: {
    backgroundColor: colors.purple,
    borderColor: colors.purple,
  },
  dayCircleToday: {
    borderColor: colors.mint,
    borderWidth: 3,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.charcoal,
  },
  dayTextActive: {
    color: colors.white,
  },
  miniDaySelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing[2],
    marginBottom: spacing[3],
    paddingVertical: spacing[2],
  },
  miniDayCircle: {
    width: 32,
    height: 32,
    borderRadius: radii.full,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.purple,
  },
  miniDayCircleActive: {
    backgroundColor: colors.purple,
    borderColor: colors.purple,
  },
  miniDayText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.purple,
  },
  miniDayTextActive: {
    color: colors.white,
  },
  dayCirclesDisplay: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  dayCircleReadOnly: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.purple,
  },
  dayCircleReadOnlyActive: {
    backgroundColor: colors.purple,
  },
  dayTextReadOnly: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.purple,
  },
  dayTextReadOnlyActive: {
    color: colors.white,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -spacing[2],
    marginBottom: spacing[3],
    paddingBottom: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.mist,
    position: 'relative',
  },
  dateDisplay: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.purple,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.charcoal,
    marginBottom: spacing[4],
  },
  loadingText: {
    textAlign: 'center',
    color: colors.charcoal,
    opacity: 0.6,
    marginTop: spacing[8],
  },
  cardsContainer: {
    gap: spacing[4],
  },
  routineCard: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: spacing[5],
    marginBottom: spacing[4],
    borderWidth: 2,
    borderColor: colors.purple,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  routineCardInactive: {
    borderColor: colors.mist,
    borderStyle: 'dashed',
  },
  routineCardEmpty: {
    paddingVertical: spacing[3],
  },
  routineCardSkipped: {
    opacity: 0.5,
    borderColor: colors.mist,
  },
  routineCardSnoozed: {
    borderColor: colors.orange,
    backgroundColor: colors.orange + '10',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[3],
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  expandButton: {
    padding: spacing[2],
    marginRight: -spacing[2],
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: radii.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[3],
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.charcoal,
  },
  routineName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.purple,
    marginBottom: spacing[3],
  },
  cardMeta: {
    flexDirection: 'row',
    gap: spacing[4],
    marginBottom: spacing[4],
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  metaText: {
    fontSize: 14,
    color: colors.charcoal,
    opacity: 0.7,
  },
  routineSteps: {
    marginTop: spacing[2],
    paddingTop: spacing[2],
    borderTopWidth: 1,
    borderTopColor: colors.lavender,
    marginBottom: spacing[3],
  },
  stepsSection: {
    marginBottom: spacing[3],
  },
  stepsSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.charcoal,
    marginBottom: spacing[2],
  },
  stepsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.charcoal,
    marginBottom: spacing[2],
  },
  stepsPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  stepPillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  stepPill: {
    backgroundColor: colors.lavender,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.purple,
  },
  stepPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.purple,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.purple,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[5],
    borderRadius: radii.lg,
    gap: spacing[2],
  },
  playButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  playButtonComplete: {
    backgroundColor: colors.mint,
  },
  headerButtons: {
    position: 'absolute',
    right: 0,
    top: '50%',
    transform: [{ translateY: -12 }], // Half of icon size (24/2)
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: spacing[1],
    marginLeft: spacing[1],
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.charcoal,
    opacity: 0.5,
    marginBottom: 2,
  },
  emptySubtext: {
    fontSize: 13,
    color: colors.charcoal,
    opacity: 0.4,
  },
  manageButton: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.purple,
    borderRadius: radii.lg,
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[5],
    marginTop: spacing[6],
    alignItems: 'center',
  },
  manageButtonText: {
    color: colors.purple,
    fontSize: 16,
    fontWeight: '700',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.cream,
    padding: spacing[6],
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.charcoal,
    marginBottom: spacing[4],
  },
  closeModalButton: {
    backgroundColor: colors.purple,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[6],
    borderRadius: radii.lg,
  },
  closeModalText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});

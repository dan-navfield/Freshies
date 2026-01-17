import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Image } from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../../../src/lib/supabase';
import { routineService, CustomRoutine } from '../../../../src/services/routineService';
import { colors, radii, spacing } from '../../../../src/theme/tokens';
import { Ionicons } from '@expo/vector-icons';
import { ChevronLeft, ChevronRight, Sun, Moon, Sunrise, Clock, TrendingUp, Eye } from 'lucide-react-native';

type Segment = 'morning' | 'evening';

interface DayCompletionStatus {
    [dayIndex: number]: 'complete' | 'partial' | 'none';
}

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function ParentChildRoutineScreen() {
    const { childId } = useLocalSearchParams<{ childId: string }>();
    const [loading, setLoading] = useState(true);
    const [childInfo, setChildInfo] = useState<{ first_name: string; avatar_url: string | null } | null>(null);
    const [routines, setRoutines] = useState<{ morning?: CustomRoutine; evening?: CustomRoutine }>({});
    const [selectedViewDate, setSelectedViewDate] = useState<Date>(() => new Date());
    const [dayCompletionStatus, setDayCompletionStatus] = useState<DayCompletionStatus>({});
    const [routineCompletionStatus, setRoutineCompletionStatus] = useState<Record<string, boolean>>({});
    const [stats, setStats] = useState({ streak: 0, totalCompleted: 0 });

    const selectedViewDay = (() => {
        const day = selectedViewDate.getDay();
        return day === 0 ? 6 : day - 1;
    })();

    useEffect(() => {
        if (childId) {
            loadChildInfo();
            loadRoutines();
        }
    }, [childId]);

    useFocusEffect(
        useCallback(() => {
            if (childId && Object.keys(routines).length > 0) {
                loadWeekCompletionStatus();
            }
        }, [childId, routines])
    );

    useEffect(() => {
        if (childId && Object.keys(routines).length > 0) {
            loadWeekCompletionStatus();
        }
    }, [routines, childId]);

    const loadChildInfo = async () => {
        if (!childId) return;
        try {
            const { data } = await supabase
                .from('profiles')
                .select('first_name, avatar_url')
                .eq('id', childId)
                .single();

            if (data) setChildInfo(data);

            // Also load stats
            const statsRes = await routineService.getRoutineStats(childId);
            if (statsRes.ok) {
                setStats({
                    streak: statsRes.value.current_streak,
                    totalCompleted: statsRes.value.total_routines_completed
                });
            }
        } catch (error) {
            console.error('Error loading child info:', error);
        }
    };

    const loadRoutines = async () => {
        if (!childId) return;
        setLoading(true);
        try {
            const morningRes = await routineService.getActiveRoutine(childId, 'morning');
            const eveningRes = await routineService.getActiveRoutine(childId, 'evening');

            setRoutines({
                morning: morningRes.ok && morningRes.value ? morningRes.value : undefined,
                evening: eveningRes.ok && eveningRes.value ? eveningRes.value : undefined,
            });
        } catch (error) {
            console.error('Error loading routines:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadWeekCompletionStatus = async () => {
        if (!childId || Object.keys(routines).length === 0) return;

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

    const getSegmentIcon = (segment: Segment) => {
        switch (segment) {
            case 'morning': return Sun;
            case 'evening': return Moon;
        }
    };

    const renderRoutineCard = (segment: Segment) => {
        const routine = routines[segment];
        const Icon = getSegmentIcon(segment);

        if (!routine) {
            return (
                <View key={segment} style={[styles.routineCard, styles.routineCardEmpty]}>
                    <View style={styles.cardHeader}>
                        <View style={[styles.iconCircle, { backgroundColor: colors.mist }]}>
                            <Icon size={24} color={colors.charcoal} />
                        </View>
                        <View>
                            <Text style={styles.cardTitle}>{segment.charAt(0).toUpperCase() + segment.slice(1)} Routine</Text>
                            <Text style={styles.emptyText}>Not set up</Text>
                        </View>
                    </View>
                </View>
            );
        }

        const isComplete = routineCompletionStatus[routine.id] || false;
        const activeDays = routine.active_days || [0, 1, 2, 3, 4, 5, 6];
        const isActiveToday = activeDays.includes(selectedViewDay);

        return (
            <TouchableOpacity
                key={segment}
                style={[
                    styles.routineCard,
                    isComplete && styles.routineCardComplete,
                    !isActiveToday && styles.routineCardInactive
                ]}
                onPress={() => router.push(`/(parent)/routine/${routine.id}`)}
                activeOpacity={0.8}
            >
                <View style={styles.cardHeader}>
                    <View style={[styles.iconCircle, { backgroundColor: isComplete ? colors.mint : colors.purple }]}>
                        <Icon size={24} color={colors.white} />
                    </View>
                    <View style={styles.cardContent}>
                        <Text style={styles.cardTitle}>{routine.name}</Text>
                        <View style={styles.cardMeta}>
                            <Clock size={14} color={colors.charcoal} />
                            <Text style={styles.metaText}>{routine.total_duration} mins</Text>
                            <Text style={styles.metaText}>•</Text>
                            <Text style={styles.metaText}>{routine.steps?.length || 0} steps</Text>
                        </View>
                    </View>
                    {isComplete && (
                        <View style={styles.completeBadge}>
                            <Ionicons name="checkmark-circle" size={24} color={colors.mint} />
                        </View>
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

                <View style={styles.viewButton}>
                    <Eye size={16} color={colors.purple} />
                    <Text style={styles.viewButtonText}>View Details</Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <ChevronLeft size={24} color={colors.white} />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <View style={styles.headerRow}>
                        {childInfo?.avatar_url && (
                            <Image source={{ uri: childInfo.avatar_url }} style={styles.headerAvatar} />
                        )}
                        <View>
                            <Text style={styles.headerTitle}>{childInfo?.first_name || 'Child'}'s Routines</Text>
                            <View style={styles.statsRow}>
                                <TrendingUp size={14} color={colors.mint} />
                                <Text style={styles.statsText}>
                                    {stats.streak > 0 ? `${stats.streak} day streak` : 'No streak'} • {stats.totalCompleted} completed
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>
            </View>

            {/* Day Selector */}
            <View style={styles.daySelectorContainer}>
                <View style={styles.dayRow}>
                    <TouchableOpacity style={styles.navArrow} onPress={goToPreviousDay}>
                        <ChevronLeft size={20} color={colors.purple} strokeWidth={2.5} />
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
                                    style={[
                                        styles.dayCircle,
                                        isSelected && styles.dayCircleActive,
                                        isToday && !isSelected && styles.dayCircleToday,
                                        !isToday && !isSelected && completionStatus === 'complete' && styles.dayCircleComplete,
                                        !isToday && !isSelected && completionStatus === 'partial' && styles.dayCirclePartial,
                                    ]}
                                    onPress={() => {
                                        const weekStart = new Date(selectedViewDate);
                                        weekStart.setDate(weekStart.getDate() - selectedViewDay);
                                        const targetDate = new Date(weekStart);
                                        targetDate.setDate(weekStart.getDate() + index);
                                        setSelectedViewDate(targetDate);
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[
                                        styles.dayText,
                                        isSelected && styles.dayTextActive,
                                        !isSelected && completionStatus === 'complete' && styles.dayTextComplete
                                    ]}>
                                        {day}
                                    </Text>
                                    <Text style={[
                                        styles.dateText,
                                        isSelected && styles.dateTextActive,
                                        !isSelected && completionStatus === 'complete' && styles.dateTextComplete
                                    ]}>
                                        {getDateForDay(index)}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    <TouchableOpacity style={styles.navArrow} onPress={goToNextDay}>
                        <ChevronRight size={20} color={colors.purple} strokeWidth={2.5} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                style={styles.scrollContent}
                contentContainerStyle={styles.scrollContainer}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={loadRoutines} tintColor={colors.purple} />}
            >
                <View style={styles.dateHeader}>
                    <Text style={styles.dateDisplay}>{getFullDateDisplay()}</Text>
                </View>

                {loading ? (
                    <Text style={styles.loadingText}>Loading routines...</Text>
                ) : (
                    <View style={styles.cardsContainer}>
                        {renderRoutineCard('morning')}
                        {renderRoutineCard('evening')}
                    </View>
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
    header: {
        backgroundColor: colors.black,
        paddingTop: 60,
        paddingBottom: spacing[5],
        paddingHorizontal: spacing[6],
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing[4],
    },
    headerContent: {
        flex: 1,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[3],
    },
    headerAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 2,
        borderColor: colors.purple,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.white,
        marginBottom: 2,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statsText: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.7)',
    },
    // Day Selector
    daySelectorContainer: {
        backgroundColor: colors.white,
        paddingVertical: spacing[4],
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    dayRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing[3],
    },
    navArrow: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.cream,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dayCircles: {
        flexDirection: 'row',
        gap: spacing[2],
    },
    dayCircle: {
        width: 42,
        height: 52,
        borderRadius: radii.lg,
        backgroundColor: colors.cream,
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
        fontSize: 12,
        fontWeight: '700',
        color: colors.charcoal,
        marginBottom: 2,
    },
    dayTextActive: {
        color: colors.white,
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
    // Content
    scrollContent: {
        flex: 1,
    },
    scrollContainer: {
        padding: spacing[6],
        paddingBottom: 100,
    },
    dateHeader: {
        alignItems: 'center',
        marginBottom: spacing[4],
        paddingBottom: spacing[3],
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    dateDisplay: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.purple,
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
    // Routine Cards
    routineCard: {
        backgroundColor: colors.white,
        borderRadius: radii.xl,
        padding: spacing[5],
        borderWidth: 2,
        borderColor: colors.purple,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
    },
    routineCardComplete: {
        borderColor: colors.mint,
        backgroundColor: colors.mint + '10',
    },
    routineCardInactive: {
        opacity: 0.6,
        borderStyle: 'dashed',
    },
    routineCardEmpty: {
        borderColor: colors.mist,
        borderStyle: 'dashed',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing[3],
    },
    iconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing[4],
    },
    cardContent: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: colors.charcoal,
        marginBottom: 4,
    },
    cardMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[2],
    },
    metaText: {
        fontSize: 13,
        color: colors.charcoal,
        opacity: 0.7,
    },
    emptyText: {
        fontSize: 14,
        color: colors.charcoal,
        opacity: 0.5,
    },
    completeBadge: {
        marginLeft: spacing[2],
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
    viewButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.cream,
        paddingVertical: spacing[3],
        borderRadius: radii.lg,
        gap: spacing[2],
    },
    viewButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.purple,
    },
});

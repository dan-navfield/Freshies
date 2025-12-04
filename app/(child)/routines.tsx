import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import DetailPageHeader from '../../components/DetailPageHeader';
import GamificationBand from '../../components/GamificationBand';
import { useChildProfile } from '../../src/contexts/ChildProfileContext';
import { routineService } from '../../src/services/routineService';
import { colors, spacing, radii } from '../../src/theme/tokens';
import { 
  Plus, 
  Clock, 
  CheckCircle, 
  Edit3, 
  Trash2,
  Sun,
  Moon,
  Play,
  Star,
  Sunset
} from 'lucide-react-native';

interface SavedRoutine {
  id: string;
  name: string;
  segment: 'morning' | 'afternoon' | 'evening';
  total_duration: number;
  completion_count: number;
  is_active: boolean;
  last_completed_at?: string;
  created_at: string;
  steps: any[];
  active_days?: number[]; // 0=Monday, 1=Tuesday, ..., 6=Sunday
  status?: 'draft' | 'active';
}

export default function RoutinesScreen() {
  const router = useRouter();
  const { childProfile } = useChildProfile();
  const [routines, setRoutines] = useState<SavedRoutine[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'morning' | 'afternoon' | 'evening'>('all');

  useEffect(() => {
    loadRoutines();
  }, []);

  // Reload routines when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadRoutines();
    }, [childProfile?.id])
  );

  const loadRoutines = async () => {
    if (!childProfile?.id) return;
    
    try {
      const userRoutines = await routineService.getRoutines(childProfile.id);
      setRoutines(userRoutines || []);
    } catch (error) {
      console.error('Error loading routines:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleActiveDay = async (routineId: string, dayIndex: number, currentActiveDays?: number[]) => {
    const activeDays = currentActiveDays || [0, 1, 2, 3, 4, 5, 6]; // Default to all days
    const newActiveDays = activeDays.includes(dayIndex)
      ? activeDays.filter(d => d !== dayIndex)
      : [...activeDays, dayIndex].sort();
    
    try {
      await routineService.updateActiveDays(routineId, newActiveDays);
      await loadRoutines();
    } catch (error) {
      Alert.alert('Error', 'Failed to update active days');
    }
  };

  const deleteRoutine = async (routineId: string, routineName: string) => {
    Alert.alert(
      'Delete Routine',
      `Are you sure you want to delete "${routineName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await routineService.deleteRoutine(routineId);
              await loadRoutines();
              Alert.alert('Success', 'Routine deleted');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete routine');
            }
          }
        }
      ]
    );
  };

  const setActiveRoutine = async (routineId: string, segment: string) => {
    if (!childProfile?.id) return;
    
    try {
      await routineService.setActiveRoutine(childProfile.id, routineId, segment as 'morning' | 'afternoon' | 'evening');
      await loadRoutines();
      Alert.alert('Success', 'Routine set as active');
    } catch (error) {
      Alert.alert('Error', 'Failed to set active routine');
    }
  };

  const startRoutine = (routine: SavedRoutine) => {
    // Navigate to guided mode with this routine
    // For now, navigate to the builder in guided mode
    router.push({
      pathname: '/(child)/routine-builder-enhanced',
      params: { 
        routineId: routine.id,
        segment: routine.segment,
        guided: 'true'
      }
    });
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} min`;
  };

  const formatLastCompleted = (date?: string) => {
    if (!date) return 'Never';
    const daysAgo = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
    if (daysAgo === 0) return 'Today';
    if (daysAgo === 1) return 'Yesterday';
    return `${daysAgo} days ago`;
  };

  const filteredRoutines = selectedFilter === 'all' 
    ? routines 
    : routines.filter(r => r.segment === selectedFilter);

  const showCreateMenu = () => {
    Alert.alert(
      'Create New Routine',
      'Choose a time of day',
      [
        {
          text: 'Morning ☀️',
          onPress: () => router.push({
            pathname: '/(child)/routine-builder-enhanced',
            params: { segment: 'morning' }
          })
        },
        {
          text: 'Afternoon 🌅',
          onPress: () => router.push({
            pathname: '/(child)/routine-builder-enhanced',
            params: { segment: 'afternoon' }
          })
        },
        {
          text: 'Evening 🌙',
          onPress: () => router.push({
            pathname: '/(child)/routine-builder-enhanced',
            params: { segment: 'evening' }
          })
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <DetailPageHeader 
        title="Routine Library"
        subtitle="Manage your skincare routines 📚"
      />
      
      <GamificationBand />

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        <TouchableOpacity 
          style={[styles.filterTab, selectedFilter === 'all' && styles.filterTabActive]}
          onPress={() => setSelectedFilter('all')}
        >
          <Text style={[styles.filterTabText, selectedFilter === 'all' && styles.filterTabTextActive]}>All</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.filterTab, selectedFilter === 'morning' && styles.filterTabActive]}
          onPress={() => setSelectedFilter('morning')}
        >
          <Sun size={16} color={selectedFilter === 'morning' ? colors.white : colors.yellow} />
          <Text style={[styles.filterTabText, selectedFilter === 'morning' && styles.filterTabTextActive]}>Morning</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.filterTab, selectedFilter === 'afternoon' && styles.filterTabActive]}
          onPress={() => setSelectedFilter('afternoon')}
        >
          <Sunset size={16} color={selectedFilter === 'afternoon' ? colors.white : colors.mint} />
          <Text style={[styles.filterTabText, selectedFilter === 'afternoon' && styles.filterTabTextActive]}>Afternoon</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.filterTab, selectedFilter === 'evening' && styles.filterTabActive]}
          onPress={() => setSelectedFilter('evening')}
        >
          <Moon size={16} color={selectedFilter === 'evening' ? colors.white : colors.purple} />
          <Text style={[styles.filterTabText, selectedFilter === 'evening' && styles.filterTabTextActive]}>Evening</Text>
        </TouchableOpacity>
      </View>

      {/* Saved Routines */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Saved Routines</Text>
        
        {loading ? (
          <Text style={styles.emptyText}>Loading...</Text>
        ) : filteredRoutines.length === 0 ? (
          <TouchableOpacity style={styles.emptyStateCard} onPress={showCreateMenu}>
            <View style={styles.emptyIconCircle}>
              <Plus size={32} color={colors.mint} strokeWidth={2.5} />
            </View>
            <Text style={styles.emptyStateTitle}>
              {selectedFilter === 'morning' ? 'Morning Routine' : 
               selectedFilter === 'afternoon' ? 'Afternoon Routine' : 
               selectedFilter === 'evening' ? 'Evening Routine' : 'Create a Routine'}
            </Text>
            <Text style={styles.emptyStateSubtitle}>No routine set</Text>
            <Text style={styles.emptyStateTap}>Tap to create</Text>
          </TouchableOpacity>
        ) : (
          filteredRoutines.map((routine) => {
            const Icon = routine.segment === 'morning' ? Sun : routine.segment === 'afternoon' ? Sunset : Moon;
            const iconColor = colors.white;
            const iconBgColor = colors.purple;
            
            return (
            <View key={routine.id} style={styles.routineCard}>
              {/* Header with Icon and Title */}
              <View style={styles.cardHeader}>
                <View style={[styles.iconCircle, { backgroundColor: iconBgColor }]}>
                  <Icon size={32} color={iconColor} />
                </View>
                <View style={styles.headerText}>
                  <Text style={styles.routineName}>{routine.name}</Text>
                  <View style={{ flexDirection: 'row', gap: spacing[2] }}>
                    {routine.status === 'draft' && (
                      <View style={styles.draftBadge}>
                        <Text style={styles.draftBadgeText}>Draft</Text>
                      </View>
                    )}
                    {routine.is_active && (
                      <View style={styles.activeBadge}>
                        <Text style={styles.activeBadgeText}>Active</Text>
                      </View>
                    )}
                  </View>
                </View>
                {/* Action Buttons in Header */}
                <View style={styles.headerActions}>
                  <TouchableOpacity 
                    style={styles.headerActionButton}
                    onPress={() => router.push({
                      pathname: '/(child)/routine-builder-enhanced',
                      params: { 
                        routineId: routine.id,
                        segment: routine.segment
                      }
                    })}
                  >
                    <Edit3 size={18} color={colors.purple} />
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.headerActionButton}
                    onPress={() => deleteRoutine(routine.id, routine.name)}
                  >
                    <Trash2 size={18} color={colors.red} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Active Days Label */}
              <Text style={styles.activeDaysLabel}>Active days</Text>

              {/* Day Circles - showing active days */}
              <View style={styles.dayCircles}>
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => {
                  const activeDays = routine.active_days || [0, 1, 2, 3, 4, 5, 6];
                  const isActive = activeDays.includes(index);
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.dayCircle,
                        isActive && styles.dayCircleActive
                      ]}
                      onPress={() => toggleActiveDay(routine.id, index, routine.active_days)}
                    >
                      <Text style={[
                        styles.dayText,
                        isActive && styles.dayTextActive
                      ]}>
                        {day}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Duration and Steps */}
              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Clock size={16} color={colors.charcoal} />
                  <Text style={styles.metaText}>{formatDuration(routine.total_duration)}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Text style={styles.metaText}>{routine.steps.length} steps</Text>
                </View>
                <View style={styles.metaItem}>
                  <CheckCircle size={16} color={colors.success} />
                  <Text style={styles.metaText}>{routine.completion_count}x</Text>
                </View>
              </View>

              {/* Routine Summary */}
              <View style={styles.routineSummary}>
                <Text style={styles.summaryTitle}>Routine steps:</Text>
                <View style={styles.stepPillsContainer}>
                  {routine.steps.map((step: any, index: number) => (
                    <View key={index} style={styles.stepPill}>
                      <Text style={styles.stepPillText}>
                        {index + 1}. {step.title || step.name || step.action || 'Step ' + (index + 1)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          );
          })
        )}
        
        {/* Add Routine Button at Bottom */}
        {!loading && filteredRoutines.length > 0 && (
          <TouchableOpacity style={styles.addButtonBottom} onPress={showCreateMenu}>
            <Plus size={20} color={colors.white} strokeWidth={2.5} />
            <Text style={styles.addButtonText}>Add Routine</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1E8D2',
  },
  topSection: {
    paddingHorizontal: spacing[6],
    paddingTop: spacing[4],
    paddingBottom: spacing[2],
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    backgroundColor: colors.purple,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: radii.full,
    alignSelf: 'flex-start',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    gap: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.mist,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    borderRadius: radii.full,
    backgroundColor: '#FFFBF5',
    borderWidth: 1,
    borderColor: colors.lavender,
  },
  filterTabActive: {
    backgroundColor: colors.purple,
    borderColor: colors.purple,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.charcoal,
  },
  filterTabTextActive: {
    color: colors.white,
  },
  createSection: {
    paddingHorizontal: spacing[6],
    paddingTop: spacing[4],
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.charcoal,
    marginBottom: spacing[3],
  },
  createButtons: {
    flexDirection: 'row',
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  createButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[4],
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.charcoal,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing[6],
    paddingTop: spacing[5],
    paddingBottom: spacing[8],
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing[8],
  },
  emptyStateCard: {
    backgroundColor: 'white',
    borderRadius: radii.xl,
    padding: spacing[8],
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.mint,
    borderStyle: 'dashed',
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.mint + '30',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.charcoal,
    marginBottom: spacing[2],
  },
  emptyStateSubtitle: {
    fontSize: 18,
    color: colors.charcoal,
    opacity: 0.5,
    marginBottom: spacing[1],
  },
  emptyStateTap: {
    fontSize: 16,
    color: colors.charcoal,
    opacity: 0.4,
  },
  emptyText: {
    fontSize: 16,
    color: colors.charcoal,
    opacity: 0.5,
    marginBottom: spacing[2],
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.charcoal,
    opacity: 0.4,
  },
  addButtonBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    backgroundColor: colors.purple,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: radii.full,
    marginTop: spacing[4],
    alignSelf: 'center',
  },
  routineCard: {
    backgroundColor: '#FFFBF5',
    borderRadius: radii.xl,
    padding: spacing[5],
    marginBottom: spacing[4],
    borderWidth: 2,
    borderColor: colors.purple,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginBottom: spacing[3],
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    flexWrap: 'wrap',
  },
  routineName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.charcoal,
  },
  draftBadge: {
    backgroundColor: colors.charcoal + '20',
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  draftBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.charcoal,
  },
  activeBadge: {
    backgroundColor: colors.success,
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.white,
  },
  routineSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.purple,
    marginBottom: spacing[3],
  },
  dayCircles: {
    flexDirection: 'row',
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.purple,
  },
  dayCircleActive: {
    backgroundColor: colors.purple,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.purple,
  },
  dayTextActive: {
    color: colors.white,
  },
  metaRow: {
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
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    backgroundColor: colors.purple,
    paddingVertical: spacing[4],
    borderRadius: radii.full,
    marginBottom: spacing[3],
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing[3],
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.lavender,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing[2],
    marginLeft: 'auto',
  },
  headerActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.lavender,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeDaysLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.charcoal,
    marginBottom: spacing[2],
    opacity: 0.7,
  },
  routineSummary: {
    marginTop: spacing[2],
    paddingTop: spacing[2],
    borderTopWidth: 1,
    borderTopColor: colors.lavender,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.charcoal,
    marginBottom: spacing[3],
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
});

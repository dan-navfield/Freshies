import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Pressable, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { 
  Sun, Moon, Sunrise, Check, Plus, ChevronRight, 
  AlertCircle, Droplets, Sparkles, Shield, Star, Clock, Camera, Trash2, Image as ImageIcon
} from 'lucide-react-native';
import { colors } from '../../../src/theme/tokens';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import { routineStyles as styles } from './routine-styles';
import FreshieCamera from '../../../components/FreshieCamera';
import GamificationBand from '../../../components/GamificationBand';
import PageHeader from '../../../components/PageHeader';
import { useChildProfile } from '../../../src/contexts/ChildProfileContext';
import { replaceFreshie, deleteFreshie, removeFreshieFromStep } from '../../../src/services/freshieService';
import { routineService } from '../../../src/services/routineService';

type Segment = 'morning' | 'afternoon' | 'evening';

interface RoutineStep {
  id: string;
  title: string;
  step_type: string;
  notes?: string;
  expiry_date?: string;
  parent_approved: boolean;
  step_order: number;
  completed_today: boolean;
  freshie_photo_url?: string;
  duration?: number;
}

/**
 * Child Routine Screen
 * Tween-focused routine management with parent approval flow
 */
export default function ChildRoutineScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { childProfile } = useChildProfile();
  const [routines, setRoutines] = useState<{morning?: any, afternoon?: any, evening?: any}>({});
  const [loading, setLoading] = useState(true);
  const [selectedRoutine, setSelectedRoutine] = useState<{segment: Segment, routine: any} | null>(null);
  const [showRoutineModal, setShowRoutineModal] = useState(false);
  const [showFreshieCamera, setShowFreshieCamera] = useState(false);
  const [selectedStepForFreshie, setSelectedStepForFreshie] = useState<string | null>(null);

  useEffect(() => {
    if (childProfile?.id) {
      loadAllRoutines();
    }
  }, [childProfile]);

  const loadAllRoutines = async () => {
    if (!childProfile?.id) {
      setLoading(false);
      return;
    }

    try {
      // Get all active routines
      const { data: allRoutines, error } = await supabase
        .from('custom_routines')
        .select('*')
        .eq('child_profile_id', childProfile.id)
        .eq('is_active', true);

      if (error) throw error;

      // Organize by segment
      const routinesBySegment: any = {};
      allRoutines?.forEach(routine => {
        routinesBySegment[routine.segment] = routine;
      });

      setRoutines(routinesBySegment);

      // Check which steps were completed today
      const today = new Date().toISOString().split('T')[0];
      const { data: completions } = await supabase
        .from('routine_completions')
        .select('routine_step_id')
        .eq('routine_id', routine.id)
        .eq('completion_date', today);

      const completedIds = new Set(completions?.map(c => c.routine_step_id) || []);

      const stepsWithCompletion = steps.map((step: any, index: number) => ({
        id: step.id || `step-${index}`,
        title: step.title,
        step_type: step.type || step.step_type,
        notes: step.instructions?.join(' ') || '',
        expiry_date: undefined,
        parent_approved: true,
        step_order: step.order || index,
        completed_today: completedIds.has(step.id),
        freshie_photo_url: undefined,
        duration: step.duration || 60,
      }));

      setRoutineSteps(stepsWithCompletion);
      updateProgress(stepsWithCompletion);
    } catch (error) {
      console.error('Error loading routine:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStreak = async () => {
    // TODO: Calculate actual streak from completions
    setStreak(7);
  };

  const updateProgress = (steps: RoutineStep[]) => {
    const completed = steps.filter(s => s.completed_today).length;
    const total = steps.length;
    setCompletionProgress({ completed, total });
  };

  const toggleStepCompletion = async (step: RoutineStep) => {
    if (!childProfile?.id || !routineId) return;

    try {
      const today = new Date().toISOString().split('T')[0];

      if (step.completed_today) {
        // Uncomplete - delete completion record
        await supabase
          .from('routine_completions')
          .delete()
          .eq('routine_step_id', step.id)
          .eq('routine_id', routineId)
          .eq('completion_date', today);
      } else {
        // Complete - insert completion record
        await supabase
          .from('routine_completions')
          .insert({
            routine_id: routineId,
            routine_step_id: step.id,
            child_profile_id: childProfile.id,
            completion_date: today,
            xp_earned: 10
          });

        // Show celebration for completing all steps
        const updatedSteps = routineSteps.map(s => 
          s.id === step.id ? { ...s, completed_today: true } : s
        );
        const allComplete = updatedSteps.every(s => s.completed_today);
        if (allComplete) {
          showCompletionCelebration();
          // Mark routine as completed
          const totalTime = routineSteps.reduce((sum, s) => sum + (s.duration || 60), 0);
          await routineService.completeRoutine(routineId, childProfile.id, {
            total_time: totalTime,
            steps_completed: routineSteps.length,
            steps_total: routineSteps.length
          });
        }
      }

      // Reload routine to update UI
      loadActiveRoutine();
    } catch (error) {
      console.error('Error toggling step:', error);
      Alert.alert('Error', 'Could not update step');
    }
  };

  const showCompletionCelebration = () => {
    Alert.alert(
      '🎉 Nice Work!',
      `You completed your ${activeSegment} routine!`,
      [{ text: 'Awesome!', style: 'default' }]
    );
  };

  const openFreshieCamera = (stepId: string) => {
    setSelectedStepForFreshie(stepId);
    setShowFreshieCamera(true);
  };

  const handleFreshieCapture = async (photoUri: string) => {
    if (!selectedStepForFreshie || !user?.id) return;

    try {
      // Get the current step to check for existing photo
      const currentStep = routineSteps.find(s => s.id === selectedStepForFreshie);
      const oldPhotoUrl = currentStep?.freshie_photo_url || null;

      // Upload photo to Supabase Storage (replaces old if exists)
      const newPhotoUrl = await replaceFreshie(
        oldPhotoUrl,
        photoUri,
        user.id,
        selectedStepForFreshie
      );

      // Update local state
      setRoutineSteps(steps =>
        steps.map(s =>
          s.id === selectedStepForFreshie
            ? { ...s, freshie_photo_url: newPhotoUrl }
            : s
        )
      );

      Alert.alert('✨ Freshie Saved!', 'Your photo has been uploaded successfully');
    } catch (error) {
      console.error('Error saving Freshie:', error);
      Alert.alert('Error', 'Could not save your Freshie. Please try again.');
    }
  };

  const handleDeleteFreshie = async (stepId: string, photoUrl: string) => {
    Alert.alert(
      'Delete Freshie?',
      'Are you sure you want to remove this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete from storage
              await deleteFreshie(photoUrl);
              
              // Remove from database
              await removeFreshieFromStep(stepId);

              // Update local state
              setRoutineSteps(steps =>
                steps.map(s =>
                  s.id === stepId ? { ...s, freshie_photo_url: undefined } : s
                )
              );

              Alert.alert('✨ Freshie Deleted', 'Your photo has been removed');
            } catch (error) {
              console.error('Error deleting Freshie:', error);
              Alert.alert('Error', 'Could not delete your Freshie');
            }
          },
        },
      ]
    );
  };

  const getSegmentIcon = (segment: Segment) => {
    switch (segment) {
      case 'morning': return Sun;
      case 'afternoon': return Sunrise;
      case 'evening': return Moon;
    }
  };

  const getSegmentColor = (segment: Segment) => {
    switch (segment) {
      case 'morning': return '#F59E0B';
      case 'afternoon': return '#EC4899';
      case 'evening': return '#8B7AB8';
    }
  };

  const getStepIcon = (stepType: string) => {
    switch (stepType) {
      case 'cleanser': return Droplets;
      case 'moisturiser': return Sparkles;
      case 'sunscreen': return Sun;
      case 'treatment': return Star;
      default: return Shield;
    }
  };

  const isExpiringSoon = (expiryDate?: string) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
  };

  const isExpired = (expiryDate?: string) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  return (
    <View style={styles.container}>
      {/* Page Header */}
      <PageHeader 
        title="Active Routines"
        subtitle="Complete your daily skincare! 🌟"
        showAvatar={false}
      />
      
      {/* Gamification Band */}
      <GamificationBand />

      {/* Action Buttons */}
      <View style={styles.actionButtonsRow}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => router.push('/(child)/routines')}
        >
          <ImageIcon size={20} color={colors.purple} />
          <Text style={styles.actionButtonText}>Manage</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => {
            if (routineId) {
              router.push({
                pathname: '/(child)/routine-builder-enhanced',
                params: { segment: activeSegment, routineId }
              });
            } else {
              router.push({
                pathname: '/(child)/routine-builder-enhanced',
                params: { segment: activeSegment }
              });
            }
          }}
        >
          <Plus size={20} color={colors.purple} />
          <Text style={styles.actionButtonText}>Add Step</Text>
        </TouchableOpacity>
      </View>

      {/* Segment Selector */}
      <View style={styles.segmentSelector}>
        {(['morning', 'afternoon', 'evening'] as Segment[]).map((segment) => {
          const SegmentIcon = getSegmentIcon(segment);
          const isActive = activeSegment === segment;
          return (
            <Pressable
              key={segment}
              style={[styles.segmentButton, isActive && styles.segmentButtonActive]}
              onPress={() => setActiveSegment(segment)}
            >
              <SegmentIcon 
                size={20} 
                color={isActive ? colors.white : colors.charcoal} 
              />
              <Text style={[styles.segmentText, isActive && styles.segmentTextActive]}>
                {segment.charAt(0).toUpperCase() + segment.slice(1)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Progress Bar */}
      {completionProgress.total > 0 && (
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressText}>
              {completionProgress.completed} of {completionProgress.total} done
            </Text>
            <Text style={styles.progressPercentage}>
              {Math.round((completionProgress.completed / completionProgress.total) * 100)}%
            </Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View 
              style={[
                styles.progressBarFill, 
                { width: `${(completionProgress.completed / completionProgress.total) * 100}%` }
              ]} 
            />
          </View>
        </View>
      )}

      <ScrollView style={styles.scrollContent}>
        {loading ? (
          <Text style={styles.loadingText}>Loading...</Text>
        ) : routineSteps.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>✨</Text>
            <Text style={styles.emptyTitle}>No routine yet!</Text>
            <Text style={styles.emptyText}>Let's build your {activeSegment} routine together</Text>
            <TouchableOpacity 
              style={styles.buildButton}
              onPress={() => router.push('/(child)/routines')}
            >
              <Text style={styles.buildButtonText}>Build My Routine</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Steps List */}
            <View style={styles.stepsList}>
              {routineSteps.map((step) => {
                const StepIcon = getStepIcon(step.step_type);
                const expired = isExpired(step.expiry_date);
                const expiringSoon = isExpiringSoon(step.expiry_date);
                
                return (
                  <Pressable
                    key={step.id}
                    style={[
                      styles.stepCard,
                      step.completed_today && styles.stepCardCompleted,
                      expired && styles.stepCardExpired,
                    ]}
                    onPress={() => !expired && toggleStepCompletion(step)}
                  >
                    {/* Checkbox */}
                    <View style={[
                      styles.checkbox,
                      step.completed_today && styles.checkboxCompleted,
                      expired && styles.checkboxDisabled,
                    ]}>
                      {step.completed_today && (
                        <Check size={16} color={colors.white} strokeWidth={3} />
                      )}
                    </View>

                    {/* Step Info */}
                    <View style={styles.stepInfo}>
                      <View style={styles.stepHeader}>
                        <View style={styles.stepIconContainer}>
                          <StepIcon size={16} color={getSegmentColor(activeSegment)} />
                        </View>
                        <Text style={[
                          styles.stepTitle,
                          step.completed_today && styles.stepTitleCompleted,
                          expired && styles.stepTitleExpired,
                        ]}>
                          {step.title}
                        </Text>
                      </View>
                      
                      {step.notes && (
                        <Text style={styles.stepNotes}>{step.notes}</Text>
                      )}

                      {/* Warnings */}
                      {expired && (
                        <View style={styles.warningBadge}>
                          <AlertCircle size={12} color={colors.red} />
                          <Text style={styles.warningText}>Expired - Ask parent to replace</Text>
                        </View>
                      )}
                      {!expired && expiringSoon && (
                        <View style={[styles.warningBadge, styles.warningBadgeOrange]}>
                          <Clock size={12} color={colors.orange} />
                          <Text style={[styles.warningText, styles.warningTextOrange]}>
                            Expires soon
                          </Text>
                        </View>
                      )}
                      {!step.parent_approved && (
                        <View style={[styles.warningBadge, styles.warningBadgePurple]}>
                          <AlertCircle size={12} color={colors.purple} />
                          <Text style={[styles.warningText, styles.warningTextPurple]}>
                            Waiting for parent approval
                          </Text>
                        </View>
                      )}

                      {/* Freshie Photo */}
                      {step.freshie_photo_url && (
                        <View style={styles.freshieContainer}>
                          <View style={styles.freshiePhotoWrapper}>
                            <Image 
                              source={{ uri: step.freshie_photo_url }} 
                              style={styles.freshiePhoto}
                            />
                            <TouchableOpacity
                              style={styles.freshieDeleteButton}
                              onPress={(e) => {
                                e.stopPropagation();
                                handleDeleteFreshie(step.id, step.freshie_photo_url!);
                              }}
                            >
                              <Trash2 size={14} color={colors.white} />
                            </TouchableOpacity>
                          </View>
                          <Text style={styles.freshieLabel}>Your Freshie ✨</Text>
                        </View>
                      )}
                    </View>

                    {/* Freshie Camera Button */}
                    <TouchableOpacity
                      style={styles.freshieButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        openFreshieCamera(step.id);
                      }}
                    >
                      <Camera size={20} color={colors.purple} />
                    </TouchableOpacity>
                  </Pressable>
                );
              })}
            </View>

            {/* Streak Card */}
            {streak > 0 && (
              <View style={styles.streakCard}>
                <View style={styles.streakIconContainer}>
                  <Text style={styles.streakEmoji}>🔥</Text>
                </View>
                <View style={styles.streakInfo}>
                  <Text style={styles.streakNumber}>{streak} Day Streak!</Text>
                  <Text style={styles.streakText}>You're doing amazing! Keep it up!</Text>
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Freshie Camera Modal */}
      <FreshieCamera
        visible={showFreshieCamera}
        onClose={() => {
          setShowFreshieCamera(false);
          setSelectedStepForFreshie(null);
        }}
        onCapture={handleFreshieCapture}
      />
    </View>
  );
}

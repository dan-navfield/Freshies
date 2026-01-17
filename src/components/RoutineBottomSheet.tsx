import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, StyleSheet, Animated, Dimensions, Alert } from 'react-native';
import { X, Check, Camera, Clock } from 'lucide-react-native';
import { colors, spacing, radii } from '../theme/tokens';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useChildProfile } from '../contexts/ChildProfileContext';
import FreshieCamera from './FreshieCamera';
import RoutineGuideModal from './RoutineGuideModal';
import RoutineCompletionCelebration from './RoutineCompletionCelebration';
import { routineService } from '../services/routineService';
import { calculateStreak, awardRoutinePoints } from '../services/streakService';
import { usageService } from '../services/usageService';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface RoutineStep {
  id: string;
  type: string;
  title: string;
  order: number;
  duration: number;
  instructions: string[];
  tips?: string;
  completed_today?: boolean;
  freshie_photo_url?: string;
  product_id?: string;
}

interface RoutineBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  routine: {
    id: string;
    name: string;
    segment: 'morning' | 'afternoon' | 'evening';
    steps: RoutineStep[];
    total_duration: number;
  } | null;
  onRoutineComplete?: () => void;
}

export default function RoutineBottomSheet({ visible, onClose, routine, onRoutineComplete }: RoutineBottomSheetProps) {
  const { user } = useAuth();
  const { childProfile } = useChildProfile();
  const [slideAnim] = useState(new Animated.Value(SCREEN_HEIGHT));
  const [routineSteps, setRoutineSteps] = useState<RoutineStep[]>([]);
  const [completionProgress, setCompletionProgress] = useState({ completed: 0, total: 0 });
  const [showFreshieCamera, setShowFreshieCamera] = useState(false);
  const [selectedStepForFreshie, setSelectedStepForFreshie] = useState<string | null>(null);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationData, setCelebrationData] = useState({ points: 0, streak: 0 });
  const [showFreshiePrompt, setShowFreshiePrompt] = useState(false);

  useEffect(() => {
    if (visible) {
      // Slide up
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();

      if (routine) {
        loadRoutineSteps();
      }
    } else {
      // Slide down
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, routine]);

  const loadRoutineSteps = async () => {
    if (!routine || !childProfile?.id) return;

    try {
      const today = new Date().toISOString().split('T')[0];

      // Get completion status for today
      const { data: completions } = await supabase
        .from('routine_step_completions')
        .select('routine_step_id')
        .eq('routine_id', routine.id)
        .eq('completion_date', today);

      const completedIds = new Set(completions?.map(c => c.routine_step_id) || []);

      // Fetch template data to get image URLs
      const { data: templates } = await supabase
        .from('routine_step_templates')
        .select('type, image_url, video_url')
        .eq('is_active', true);

      const templateMap = new Map(templates?.map(t => [t.type, t]) || []);

      // Generate step IDs and enrich with template data
      const stepsWithCompletion = routine.steps.map((step, index) => {
        const stepId = step.id || `${routine.id}-step-${index}`;
        const template = templateMap.get(step.type);

        return {
          ...step,
          id: stepId,
          completed_today: completedIds.has(stepId),
          image_url: template?.image_url,
          video_url: template?.video_url,
        };
      });
      setRoutineSteps(stepsWithCompletion);
      updateProgress(stepsWithCompletion);
    } catch (error) {
      console.error('Error loading routine steps:', error);
    }
  };

  const updateProgress = (steps: RoutineStep[]) => {
    const completed = steps.filter(s => s.completed_today).length;
    const total = steps.length;
    setCompletionProgress({ completed, total });
  };

  const toggleStepCompletion = async (step: RoutineStep) => {
    if (!childProfile?.id || !routine?.id) return;

    try {
      const today = new Date().toISOString().split('T')[0];

      if (step.completed_today) {
        // Uncomplete - delete completion record
        await supabase
          .from('routine_step_completions')
          .delete()
          .eq('routine_step_id', step.id)
          .eq('routine_id', routine.id)
          .eq('completion_date', today);
      } else {
        // Complete - insert completion record
        await supabase
          .from('routine_step_completions')
          .insert({
            routine_id: routine.id,
            routine_step_id: step.id,
            child_profile_id: childProfile.id,
            completion_date: today,
            xp_earned: 10
          });

        // Track product usage if linked
        if (step.product_id) {
          try {
            await usageService.trackUsage(step.product_id, childProfile.id);
          } catch (e) {
            console.log('Failed to track usage for routine step (might not be a shelf item):', e);
          }
        }

        // Check if all steps are complete
        const updatedSteps = routineSteps.map(s =>
          s.id === step.id ? { ...s, completed_today: true } : s
        );
        const allComplete = updatedSteps.every(s => s.completed_today);

        if (allComplete) {
          const totalTime = routineSteps.reduce((sum, s) => sum + (s.duration || 60), 0);
          await routineService.completeRoutine(routine.id, childProfile.id, {
            total_time: totalTime,
            steps_completed: routineSteps.length,
            steps_total: routineSteps.length
          });

          // Reload steps first, then show celebration
          await loadRoutineSteps();
          setTimeout(() => {
            showCompletionCelebration();
          }, 100);
          return; // Exit early since we already reloaded
        }
      }

      // Reload steps for single toggle
      await loadRoutineSteps();
    } catch (error) {
      console.error('Error toggling step:', error);
      Alert.alert('Error', 'Could not update step');
    }
  };

  const showCompletionCelebration = () => {
    Alert.alert(
      '🎉 Amazing Work!',
      `You completed your ${routine?.segment} routine!`,
      [{ text: 'Awesome!', style: 'default' }]
    );
  };

  const toggleMarkAll = async () => {
    if (!childProfile?.id || !routine?.id) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const allComplete = routineSteps.every(s => s.completed_today);

      if (allComplete) {
        // Unmark all - delete all completions
        await Promise.all(
          routineSteps.map(step =>
            supabase
              .from('routine_step_completions')
              .delete()
              .eq('routine_step_id', step.id)
              .eq('routine_id', routine.id)
              .eq('completion_date', today)
          )
        );
      } else {
        // Mark all incomplete steps as complete
        const incompleteSteps = routineSteps.filter(s => !s.completed_today);

        await Promise.all(
          incompleteSteps.map(async (step) => {
            await supabase
              .from('routine_step_completions')
              .insert({
                routine_id: routine.id,
                routine_step_id: step.id,
                child_profile_id: childProfile.id,
                completion_date: today,
                xp_earned: 10
              });

            // Track product usage if linked
            if (step.product_id) {
              try {
                await usageService.trackUsage(step.product_id, childProfile.id);
              } catch (e) {
                console.log('Failed to track usage for routine step:', e);
              }
            }
          })
        );

        // Complete the routine
        const totalTime = routineSteps.reduce((sum, s) => sum + (s.duration || 60), 0);
        await routineService.completeRoutine(routine.id, childProfile.id, {
          total_time: totalTime,
          steps_completed: routineSteps.length,
          steps_total: routineSteps.length
        });
      }

      // Reload steps to update UI first
      await loadRoutineSteps();

      // Show celebration after UI updates (only when marking complete)
      if (!allComplete) {
        setTimeout(() => {
          showCompletionCelebration();
        }, 100);
      }
    } catch (error) {
      console.error('Error toggling all steps:', error);
      Alert.alert('Error', 'Could not update steps');
    }
  };

  const openFreshieCamera = (stepId: string) => {
    setSelectedStepForFreshie(stepId);
    setShowFreshieCamera(true);
  };

  const handleFreshieCapture = async (photoUri: string) => {
    if (!selectedStepForFreshie || !user?.id) return;

    try {
      // TODO: Upload photo to storage and save URL
      console.log('Freshie captured:', photoUri);
      setShowFreshieCamera(false);
      setSelectedStepForFreshie(null);
    } catch (error) {
      console.error('Error saving freshie:', error);
    }
  };

  if (!routine) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <Animated.View
          style={[
            styles.bottomSheet,
            { transform: [{ translateY: slideAnim }] }
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.dragHandle} />
            <View style={styles.headerContent}>
              <View style={styles.headerLeft}>
                <Text style={styles.routineTitle}>{routine.name}</Text>
                <Text style={styles.routineSubtitle}>
                  {routine.segment.charAt(0).toUpperCase() + routine.segment.slice(1)} Routine
                </Text>
              </View>
              <View style={styles.headerButtons}>
                <TouchableOpacity
                  onPress={() => openFreshieCamera('routine-overall')}
                  style={styles.freshieHeaderButton}
                >
                  <Text style={styles.freshieHeaderText}>Freshie</Text>
                  <Camera size={18} color={colors.purple} />
                </TouchableOpacity>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <X size={24} color={colors.charcoal} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Progress Bar */}
          {completionProgress.total > 0 && (
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <View>
                  <Text style={styles.progressText}>
                    {completionProgress.completed} of {completionProgress.total} done
                  </Text>
                  <Text style={styles.progressPercentage}>
                    {Math.round((completionProgress.completed / completionProgress.total) * 100)}%
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.markAllButton}
                  onPress={toggleMarkAll}
                >
                  <Check size={16} color={colors.white} strokeWidth={3} />
                  <Text style={styles.markAllButtonText}>
                    {routineSteps.every(s => s.completed_today) ? 'Unmark All' : 'Mark All'}
                  </Text>
                </TouchableOpacity>
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

          {/* Steps List */}
          <ScrollView style={styles.stepsContainer} showsVerticalScrollIndicator={false}>
            {routineSteps.map((step, index) => (
              <View key={step.id} style={styles.stepCard}>
                <View style={styles.stepHeader}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{index + 1}</Text>
                  </View>
                  <View style={styles.stepInfo}>
                    <Text style={styles.stepTitle}>{step.title}</Text>
                    <View style={styles.stepMeta}>
                      <Clock size={14} color={colors.charcoal} />
                      <Text style={styles.stepDuration}>{step.duration} min</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.checkButton,
                      step.completed_today && styles.checkButtonComplete
                    ]}
                    onPress={() => toggleStepCompletion(step)}
                  >
                    {step.completed_today && (
                      <Check size={20} color={colors.white} strokeWidth={3} />
                    )}
                  </TouchableOpacity>
                </View>

                {/* Instructions */}
                {step.instructions && step.instructions.length > 0 && (
                  <View style={styles.instructionsContainer}>
                    {step.instructions.map((instruction, i) => (
                      <Text key={i} style={styles.instructionText}>
                        • {instruction}
                      </Text>
                    ))}
                  </View>
                )}

                {/* Action Buttons */}
                <View style={styles.actionButtonsRow}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.guideButton]}
                    onPress={() => setShowGuideModal(true)}
                  >
                    <Clock size={16} color={colors.white} />
                    <Text style={styles.guideButtonText}>Start Guide</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.freshieButton]}
                    onPress={() => openFreshieCamera(step.id)}
                  >
                    <Camera size={16} color={colors.purple} />
                    <Text style={styles.freshieButtonText}>Take a Freshie</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Freshie Camera Modal */}
        {showFreshieCamera && (
          <FreshieCamera
            visible={showFreshieCamera}
            onClose={() => {
              setShowFreshieCamera(false);
              setSelectedStepForFreshie(null);
            }}
            onCapture={handleFreshieCapture}
          />
        )}

        {/* Routine Guide Modal */}
        {routine && (
          <RoutineGuideModal
            visible={showGuideModal}
            onClose={() => setShowGuideModal(false)}
            routineName={routine.name}
            steps={routineSteps}
            onComplete={async () => {
              if (!childProfile?.id || !routine?.id) return;

              // Mark all steps as complete
              for (const step of routineSteps) {
                await toggleStepCompletion(step);
              }

              // Calculate streak and award points
              const streak = await calculateStreak(childProfile.id, routine.id);
              const points = await awardRoutinePoints(childProfile.id, routine.id, routineSteps.length);

              setCelebrationData({
                points,
                streak: streak.currentStreak,
              });

              setShowGuideModal(false);
              loadRoutineSteps(); // Refresh to show completion

              // Notify parent to refresh
              onRoutineComplete?.();

              // Show celebration
              setShowCelebration(true);
            }}
          />
        )}

        {/* Completion Celebration */}
        {routine && (
          <RoutineCompletionCelebration
            visible={showCelebration}
            routineName={routine.name}
            pointsEarned={celebrationData.points}
            streakDays={celebrationData.streak}
            onDismiss={() => {
              setShowCelebration(false);
              // Prompt for Freshie photo
              setShowFreshiePrompt(true);
            }}
          />
        )}

        {/* Freshie Prompt After Completion */}
        {showFreshiePrompt && (
          <Modal
            visible={showFreshiePrompt}
            transparent
            animationType="fade"
          >
            <View style={styles.freshiePromptOverlay}>
              <View style={styles.freshiePromptCard}>
                <Text style={styles.freshiePromptTitle}>📸 Capture Your Glow!</Text>
                <Text style={styles.freshiePromptText}>
                  Take a Freshie to remember this moment!
                </Text>
                <View style={styles.freshiePromptButtons}>
                  <TouchableOpacity
                    style={[styles.freshiePromptButton, styles.freshiePromptButtonPrimary]}
                    onPress={() => {
                      setShowFreshiePrompt(false);
                      setShowFreshieCamera(true);
                      setSelectedStepForFreshie(routine?.id || null);
                    }}
                  >
                    <Camera size={20} color={colors.white} />
                    <Text style={styles.freshiePromptButtonTextPrimary}>Take Freshie</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.freshiePromptButton, styles.freshiePromptButtonSecondary]}
                    onPress={() => {
                      setShowFreshiePrompt(false);
                      onClose();
                    }}
                  >
                    <Text style={styles.freshiePromptButtonTextSecondary}>Maybe Later</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdrop: {
    flex: 1,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.85,
    backgroundColor: colors.cream,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  header: {
    paddingTop: spacing[3],
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[4],
    backgroundColor: colors.white,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.mist,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.mist,
    borderRadius: radii.full,
    alignSelf: 'center',
    marginBottom: spacing[3],
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  freshieHeaderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    backgroundColor: colors.cream,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.purple,
  },
  freshieHeaderText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.purple,
  },
  routineTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.charcoal,
    marginBottom: spacing[1],
  },
  routineSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.charcoal,
    opacity: 0.6,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    backgroundColor: colors.mist,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressSection: {
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[4],
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.mist,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.charcoal,
    marginBottom: spacing[1],
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.purple,
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    backgroundColor: colors.purple,
    borderRadius: radii.lg,
  },
  markAllButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: colors.mist,
    borderRadius: radii.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.purple,
    borderRadius: radii.full,
  },
  stepsContainer: {
    flex: 1,
    paddingHorizontal: spacing[6],
    paddingTop: spacing[4],
  },
  stepCard: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing[4],
    marginBottom: spacing[3],
    borderWidth: 2,
    borderColor: colors.mist,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: radii.full,
    backgroundColor: colors.purple,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[3],
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  stepInfo: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.charcoal,
    marginBottom: spacing[1],
  },
  stepMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  stepDuration: {
    fontSize: 14,
    color: colors.charcoal,
    opacity: 0.6,
  },
  checkButton: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    borderWidth: 2,
    borderColor: colors.mist,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkButtonComplete: {
    backgroundColor: colors.purple,
    borderColor: colors.purple,
  },
  instructionsContainer: {
    marginBottom: spacing[3],
    paddingLeft: spacing[2],
  },
  instructionText: {
    fontSize: 14,
    color: colors.charcoal,
    lineHeight: 20,
    marginBottom: spacing[1],
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    borderRadius: radii.lg,
  },
  guideButton: {
    backgroundColor: colors.purple,
  },
  guideButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
  },
  freshieButton: {
    backgroundColor: colors.cream,
    borderWidth: 1.5,
    borderColor: colors.purple,
  },
  freshieButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.purple,
  },
  freshiePromptOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[4],
  },
  freshiePromptCard: {
    backgroundColor: colors.cream,
    borderRadius: radii.xl,
    padding: spacing[5],
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  freshiePromptTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.purple,
    marginBottom: spacing[2],
    textAlign: 'center',
  },
  freshiePromptText: {
    fontSize: 16,
    color: colors.charcoal,
    textAlign: 'center',
    marginBottom: spacing[4],
    lineHeight: 22,
  },
  freshiePromptButtons: {
    width: '100%',
    gap: spacing[2],
  },
  freshiePromptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: radii.lg,
  },
  freshiePromptButtonPrimary: {
    backgroundColor: colors.purple,
  },
  freshiePromptButtonSecondary: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.lavender,
  },
  freshiePromptButtonTextPrimary: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  freshiePromptButtonTextSecondary: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.charcoal,
  },
});

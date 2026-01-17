import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Modal, TouchableOpacity, Animated, Dimensions, StyleSheet, ScrollView, Image } from 'react-native';
import { X, Play, Pause, SkipForward, Check, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { colors, spacing, radii } from '../theme/tokens';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface RoutineStep {
  id: string;
  type: string;
  title: string;
  order: number;
  duration: number;
  instructions: string[];
  tips?: string;
  image_url?: string;
  video_url?: string;
}

interface RoutineGuideModalProps {
  visible: boolean;
  onClose: () => void;
  routineName: string;
  steps: RoutineStep[];
  onComplete: () => void;
}

export default function RoutineGuideModal({ 
  visible, 
  onClose, 
  routineName, 
  steps,
  onComplete 
}: RoutineGuideModalProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [showFullscreenImage, setShowFullscreenImage] = useState(false);
  
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Slide up
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
      
      // Initialize timer for first step
      if (steps.length > 0) {
        setTimeRemaining(steps[0].duration * 60);
      }
    } else {
      // Slide down
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }).start();
      
      // Reset state
      setCurrentStepIndex(0);
      setIsTimerRunning(false);
      setCompletedSteps(new Set());
    }
  }, [visible]);

  // Timer logic
  useEffect(() => {
    if (isTimerRunning && timeRemaining > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isTimerRunning, timeRemaining]);

  // Progress animation
  useEffect(() => {
    const progress = completedSteps.size / steps.length;
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [completedSteps.size, steps.length]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleTimer = () => {
    setIsTimerRunning(!isTimerRunning);
  };

  const resetTimer = () => {
    setIsTimerRunning(false);
    setTimeRemaining(steps[currentStepIndex]?.duration * 60 || 0);
  };

  const completeCurrentStep = () => {
    const newCompleted = new Set(completedSteps);
    newCompleted.add(currentStepIndex);
    setCompletedSteps(newCompleted);

    if (currentStepIndex < steps.length - 1) {
      // Move to next step
      goToNextStep();
    } else {
      // All steps completed!
      setIsTimerRunning(false);
      // Call onComplete callback which will mark steps as done
      onComplete();
      // Close modal after short delay
      setTimeout(() => {
        onClose();
      }, 1000);
    }
  };

  const goToPreviousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
      setIsTimerRunning(false);
      setTimeRemaining(steps[currentStepIndex - 1].duration * 60);
    }
  };

  const goToNextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
      setIsTimerRunning(false);
      setTimeRemaining(steps[currentStepIndex + 1].duration * 60);
    }
  };

  const skipStep = () => {
    if (currentStepIndex < steps.length - 1) {
      goToNextStep();
    } else {
      onClose();
    }
  };

  if (steps.length === 0) return null;

  const currentStep = steps[currentStepIndex];
  const progressPercentage = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Backdrop */}
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1}
          onPress={onClose}
        />

        {/* Modal Content */}
        <Animated.View 
          style={[
            styles.modalContainer,
            { transform: [{ translateY: slideAnim }] }
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <X size={24} color={colors.charcoal} />
              </TouchableOpacity>
              <View style={styles.headerCenter}>
                <Text style={styles.routineName}>{routineName}</Text>
                <Text style={styles.stepCounter}>
                  Step {currentStepIndex + 1} of {steps.length}
                </Text>
              </View>
              <View style={styles.closeButton} />
            </View>

            {/* Progress Bar */}
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBg}>
                <Animated.View 
                  style={[
                    styles.progressBarFill,
                    { width: progressPercentage }
                  ]} 
                />
              </View>
            </View>
          </View>

          <ScrollView 
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Step Number Badge */}
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>{currentStepIndex + 1}</Text>
            </View>

            {/* Step Title */}
            <View style={styles.stepHeader}>
              <Text style={styles.stepTitle}>{currentStep.title}</Text>
              {completedSteps.has(currentStepIndex) && (
                <View style={styles.completedBadge}>
                  <Check size={20} color={colors.white} strokeWidth={3} />
                </View>
              )}
            </View>

            {/* Step Diagram/Image */}
            {currentStep.image_url && (
              <TouchableOpacity 
                style={styles.imageContainer}
                onPress={() => setShowFullscreenImage(true)}
                activeOpacity={0.9}
              >
                <Image 
                  source={{ uri: currentStep.image_url }}
                  style={styles.stepImage}
                  resizeMode="cover"
                />
                <View style={styles.imageOverlay}>
                  <Text style={styles.imageOverlayText}>Tap to enlarge</Text>
                </View>
              </TouchableOpacity>
            )}

            {/* Timer Display */}
            <View style={styles.timerCard}>
              <Text style={styles.timerText}>{formatTime(timeRemaining)}</Text>
              <Text style={styles.timerLabel}>
                {timeRemaining === 0 ? 'Time\'s up!' : isTimerRunning ? 'Running...' : 'Paused'}
              </Text>
            </View>

            {/* Timer Controls */}
            <View style={styles.timerControls}>
              <TouchableOpacity 
                onPress={toggleTimer}
                style={[styles.controlButton, styles.playButton]}
              >
                {isTimerRunning ? (
                  <>
                    <Pause size={20} color={colors.white} fill={colors.white} />
                    <Text style={styles.playButtonText}>Pause</Text>
                  </>
                ) : (
                  <>
                    <Play size={20} color={colors.white} fill={colors.white} />
                    <Text style={styles.playButtonText}>Start</Text>
                  </>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={resetTimer}
                style={[styles.controlButton, styles.resetButton]}
              >
                <Text style={styles.resetButtonText}>Reset</Text>
              </TouchableOpacity>
            </View>

            {/* Instructions */}
            {currentStep.instructions && currentStep.instructions.length > 0 && (
              <View style={styles.instructionsSection}>
                <Text style={styles.sectionTitle}>How to do it:</Text>
                {currentStep.instructions.map((instruction, i) => (
                  <View key={i} style={styles.instructionRow}>
                    <View style={styles.instructionBullet} />
                    <Text style={styles.instructionText}>{instruction}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Tips */}
            {currentStep.tips && (
              <View style={styles.tipsSection}>
                <Text style={styles.sectionTitle}>💡 Tip:</Text>
                <Text style={styles.tipText}>{currentStep.tips}</Text>
              </View>
            )}
          </ScrollView>

          {/* Bottom Navigation */}
          <View style={styles.bottomNav}>
            <View style={styles.navButtons}>
              <TouchableOpacity
                onPress={goToPreviousStep}
                disabled={currentStepIndex === 0}
                style={[
                  styles.navButton,
                  currentStepIndex === 0 && styles.navButtonDisabled
                ]}
              >
                <ChevronLeft 
                  size={20} 
                  color={currentStepIndex === 0 ? colors.mist : colors.charcoal} 
                />
                <Text style={[
                  styles.navButtonText,
                  currentStepIndex === 0 && styles.navButtonTextDisabled
                ]}>
                  Previous
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={skipStep}
                style={styles.skipButton}
              >
                <Text style={styles.skipButtonText}>Skip</Text>
                <SkipForward size={16} color={colors.charcoal} />
              </TouchableOpacity>

              {currentStepIndex < steps.length - 1 ? (
                <TouchableOpacity
                  onPress={goToNextStep}
                  style={styles.navButton}
                >
                  <Text style={styles.navButtonText}>Next</Text>
                  <ChevronRight size={20} color={colors.charcoal} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={completeCurrentStep}
                  style={[styles.navButton, styles.completeButton]}
                >
                  <Check size={20} color={colors.white} />
                  <Text style={styles.completeButtonText}>Done!</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Animated.View>

        {/* Fullscreen Image Modal */}
        {currentStep.image_url && (
          <Modal
            visible={showFullscreenImage}
            transparent
            animationType="fade"
            onRequestClose={() => setShowFullscreenImage(false)}
          >
            <View style={styles.fullscreenOverlay}>
              <TouchableOpacity 
                style={styles.fullscreenClose}
                onPress={() => setShowFullscreenImage(false)}
              >
                <X size={32} color={colors.white} />
              </TouchableOpacity>
              <Image 
                source={{ uri: currentStep.image_url }}
                style={styles.fullscreenImage}
                resizeMode="contain"
              />
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
  modalContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.9,
    backgroundColor: colors.cream,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  header: {
    paddingTop: spacing[4],
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.lavender,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[3],
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  routineName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.charcoal,
    marginBottom: spacing[1],
  },
  stepCounter: {
    fontSize: 14,
    color: colors.charcoal,
    opacity: 0.6,
  },
  progressBarContainer: {
    marginTop: spacing[2],
  },
  progressBarBg: {
    height: 6,
    backgroundColor: colors.lavender,
    borderRadius: radii.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.purple,
    borderRadius: radii.full,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing[4],
    paddingBottom: spacing[6],
  },
  stepBadge: {
    width: 48,
    height: 48,
    borderRadius: radii.full,
    backgroundColor: colors.purple,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: spacing[3],
  },
  stepBadgeText: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.white,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
    gap: spacing[2],
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.charcoal,
    textAlign: 'center',
  },
  completedBadge: {
    width: 32,
    height: 32,
    borderRadius: radii.full,
    backgroundColor: colors.mint,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    width: '100%',
    height: 200,
    borderRadius: radii.xl,
    overflow: 'hidden',
    marginBottom: spacing[4],
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.lavender,
    position: 'relative',
  },
  stepImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingVertical: spacing[1],
    alignItems: 'center',
  },
  imageOverlayText: {
    fontSize: 12,
    color: colors.white,
    fontWeight: '600',
  },
  fullscreenOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenClose: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
    padding: spacing[2],
  },
  fullscreenImage: {
    width: '100%',
    height: '100%',
  },
  timerCard: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: spacing[5],
    alignItems: 'center',
    marginBottom: spacing[3],
    borderWidth: 2,
    borderColor: colors.lavender,
  },
  timerText: {
    fontSize: 56,
    fontWeight: '700',
    color: colors.purple,
    marginBottom: spacing[2],
  },
  timerLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.charcoal,
    opacity: 0.6,
  },
  timerControls: {
    flexDirection: 'row',
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  controlButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
    borderRadius: radii.lg,
  },
  playButton: {
    backgroundColor: colors.purple,
  },
  playButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  resetButton: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.lavender,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.charcoal,
  },
  instructionsSection: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing[4],
    marginBottom: spacing[3],
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.charcoal,
    marginBottom: spacing[3],
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing[2],
  },
  instructionBullet: {
    width: 6,
    height: 6,
    borderRadius: radii.full,
    backgroundColor: colors.purple,
    marginTop: 7,
    marginRight: spacing[2],
  },
  instructionText: {
    flex: 1,
    fontSize: 15,
    color: colors.charcoal,
    lineHeight: 22,
  },
  tipsSection: {
    backgroundColor: colors.lavender,
    borderRadius: radii.lg,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.purple,
  },
  tipText: {
    fontSize: 15,
    color: colors.charcoal,
    lineHeight: 22,
  },
  bottomNav: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    paddingBottom: spacing[5],
    borderTopWidth: 1,
    borderTopColor: colors.lavender,
    backgroundColor: colors.cream,
  },
  navButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[2],
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    borderRadius: radii.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.lavender,
  },
  navButtonDisabled: {
    opacity: 0.4,
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.charcoal,
  },
  navButtonTextDisabled: {
    color: colors.mist,
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
  },
  skipButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.charcoal,
    opacity: 0.6,
  },
  completeButton: {
    backgroundColor: colors.mint,
    borderColor: colors.mint,
  },
  completeButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
  },
});

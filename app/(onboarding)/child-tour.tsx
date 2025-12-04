import { useState } from 'react';
import { View, Text, TouchableOpacity, Dimensions, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Home, Sparkles, Shield, X } from 'lucide-react-native';
import { colors, spacing, radii } from '../../src/theme/tokens';

const { width, height } = Dimensions.get('window');

const TOUR_STEPS = [
  {
    icon: Home,
    color: '#B8E6D5',
    bgColor: '#B8E6D5',
    title: 'This is Your Home Screen',
    description: 'See your tasks, routines, and what\'s new - all in one place.',
    highlightArea: { top: 100, left: 20, width: width - 40, height: 120 },
  },
  {
    icon: Shield,
    color: '#8B7AB8',
    bgColor: '#8B7AB8',
    title: 'Your Parent Can Help',
    description: 'They can manage your settings and make sure everything is safe.',
    highlightArea: { top: height - 150, left: width - 100, width: 80, height: 80 },
  },
  {
    icon: Sparkles,
    color: '#FFD93D',
    bgColor: '#FFD93D',
    title: 'Tap Here to Start',
    description: 'Explore, learn, and have fun building healthy habits!',
    highlightArea: { top: 350, left: 20, width: width - 40, height: 120 },
  },
];

export default function ChildTourScreen() {
  const [currentStep, setCurrentStep] = useState(0);
  const step = TOUR_STEPS[currentStep];
  const Icon = step.icon;

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      router.replace('/(onboarding)/child-success' as any);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    router.replace('/(onboarding)/child-success' as any);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Skip Button */}
      <View style={styles.skipButton}>
        <TouchableOpacity onPress={handleSkip} style={styles.skipButtonInner}>
          <X color="#FFFFFF" size={24} />
        </TouchableOpacity>
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBars}>
          {TOUR_STEPS.map((_, index) => (
            <View key={index} style={[styles.progressBar, index <= currentStep ? styles.progressBarActive : styles.progressBarInactive]} />
          ))}
        </View>
        <Text style={styles.progressText}>
          Step {currentStep + 1} of {TOUR_STEPS.length}
        </Text>
      </View>

      {/* Spotlight Effect - Simulated */}
      <View style={[styles.spotlight, step.highlightArea]} />

      {/* Tour Content Card */}
      <View style={styles.card}>
        {/* Icon */}
        <View style={[styles.iconContainer, { backgroundColor: `${step.bgColor}20` }]}>
          <Icon color={step.color} size={32} />
        </View>

        {/* Content */}
        <Text style={styles.title}>
          {step.title}
        </Text>
        <Text style={styles.description}>
          {step.description}
        </Text>

        {/* Navigation */}
        <View style={styles.navigation}>
          <View style={styles.buttonRow}>
            {currentStep > 0 && (
              <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                <Text style={styles.backButtonText}>
                  ← Back
                </Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity onPress={handleNext} style={[styles.nextButton, currentStep === 0 && styles.nextButtonFull]}>
              <Text style={styles.nextButtonText}>
                {currentStep < TOUR_STEPS.length - 1 ? 'Next →' : 'Finish'}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={handleSkip} style={styles.skipTourButton}>
            <Text style={styles.skipTourText}>
              Skip
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  skipButton: { position: 'absolute', top: spacing[12], right: spacing[6], zIndex: 50 },
  skipButtonInner: { backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: radii.pill, padding: spacing[2] },
  progressContainer: { position: 'absolute', top: spacing[12], left: spacing[6], right: 80, zIndex: 50 },
  progressBars: { flexDirection: 'row', gap: spacing[2] },
  progressBar: { flex: 1, height: 4, borderRadius: radii.pill },
  progressBarActive: { backgroundColor: colors.white },
  progressBarInactive: { backgroundColor: 'rgba(255, 255, 255, 0.3)' },
  progressText: { color: colors.white, fontSize: 14, marginTop: spacing[2] },
  spotlight: { position: 'absolute', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: radii.xxl },
  card: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.white, borderTopLeftRadius: radii.xxl, borderTopRightRadius: radii.xxl, paddingHorizontal: spacing[6], paddingTop: spacing[8], paddingBottom: spacing[12] },
  iconContainer: { width: 64, height: 64, borderRadius: radii.lg, alignItems: 'center', justifyContent: 'center', marginBottom: spacing[4] },
  title: { fontSize: 24, fontWeight: '700', color: colors.black, marginBottom: spacing[3] },
  description: { fontSize: 16, color: colors.charcoal, lineHeight: 24, marginBottom: spacing[8] },
  navigation: { gap: spacing[3] },
  buttonRow: { flexDirection: 'row', gap: spacing[3] },
  backButton: { flex: 1, backgroundColor: '#F3F4F6', borderRadius: radii.pill, paddingVertical: spacing[4] },
  backButtonText: { color: colors.charcoal, textAlign: 'center', fontSize: 16, fontWeight: '600' },
  nextButton: { flex: 1, backgroundColor: colors.mint, borderRadius: radii.pill, paddingVertical: spacing[4] },
  nextButtonFull: { flex: 2 },
  nextButtonText: { color: colors.black, textAlign: 'center', fontSize: 16, fontWeight: '600' },
  skipTourButton: { paddingVertical: spacing[3] },
  skipTourText: { color: colors.charcoal, textAlign: 'center', fontSize: 14 },
});

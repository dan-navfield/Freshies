import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { SkinConcern } from '../../../src/types/child';
import { CONCERN_LABELS, CONCERN_COLORS } from '../../../src/types/child';

/**
 * Child Onboarding - Skin Concerns Selection
 * Let kids select any skin concerns they have
 */
export default function ConcernsOnboarding() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [selectedConcerns, setSelectedConcerns] = useState<SkinConcern[]>([]);

  const concerns: Array<{ type: SkinConcern; emoji: string; description: string }> = [
    { type: 'acne', emoji: '✨', description: 'Pimples or breakouts' },
    { type: 'redness', emoji: '🌸', description: 'Red or flushed skin' },
    { type: 'dryness', emoji: '💧', description: 'Dry or flaky patches' },
    { type: 'oiliness', emoji: '🌟', description: 'Shiny or greasy skin' },
    { type: 'sensitivity', emoji: '🛡️', description: 'Gets irritated easily' },
    { type: 'dark_spots', emoji: '🎯', description: 'Dark marks or spots' },
    { type: 'texture', emoji: '🌊', description: 'Rough or bumpy texture' },
  ];

  const toggleConcern = (concern: SkinConcern) => {
    if (selectedConcerns.includes(concern)) {
      setSelectedConcerns(selectedConcerns.filter(c => c !== concern));
    } else {
      setSelectedConcerns([...selectedConcerns, concern]);
    }
  };

  const handleContinue = () => {
    router.push({
      pathname: '/(child)/onboarding/teen/goals' as const,
      params: {
        skinType: params.skinType,
        concerns: JSON.stringify(selectedConcerns),
      },
    });
  };

  const handleSkip = () => {
    router.push({
      pathname: '/(child)/onboarding/teen/goals' as const,
      params: {
        skinType: params.skinType,
        concerns: JSON.stringify([]),
      },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <View style={styles.progress}>
          <View style={[styles.progressBar, styles.progressActive]} />
          <View style={[styles.progressBar, styles.progressActive]} />
          <View style={styles.progressBar} />
          <View style={styles.progressBar} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Question */}
        <View style={styles.questionSection}>
          <Text style={styles.stepLabel}>Step 2 of 4</Text>
          <Text style={styles.question}>Any skin concerns?</Text>
          <Text style={styles.hint}>
            Select all that apply. It's okay if you don't have any!
          </Text>
        </View>

        {/* Concerns Grid */}
        <View style={styles.concernsGrid}>
          {concerns.map((concern) => {
            const isSelected = selectedConcerns.includes(concern.type);
            const color = CONCERN_COLORS[concern.type];

            return (
              <TouchableOpacity
                key={concern.type}
                style={[
                  styles.concernCard,
                  isSelected && styles.concernCardSelected,
                  { borderColor: isSelected ? color : '#e5e7eb' },
                ]}
                onPress={() => toggleConcern(concern.type)}
              >
                {isSelected && (
                  <View style={[styles.checkmark, { backgroundColor: color }]}>
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  </View>
                )}
                <Text style={styles.concernEmoji}>{concern.emoji}</Text>
                <Text style={styles.concernTitle}>{CONCERN_LABELS[concern.type]}</Text>
                <Text style={styles.concernDescription}>{concern.description}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Selected Count */}
        {selectedConcerns.length > 0 && (
          <View style={styles.selectedBadge}>
            <Text style={styles.selectedText}>
              {selectedConcerns.length} selected
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
          <Text style={styles.continueButtonText}>Continue</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipButtonText}>Skip this step</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progress: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
  },
  progressActive: {
    backgroundColor: '#6366F1',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  questionSection: {
    marginBottom: 32,
  },
  stepLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366F1',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  question: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  hint: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  concernsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  concernCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    position: 'relative',
  },
  concernCardSelected: {
    borderWidth: 3,
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  concernEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  concernTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
    textAlign: 'center',
  },
  concernDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  selectedBadge: {
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignSelf: 'center',
  },
  selectedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366F1',
  },
  footer: {
    padding: 20,
    gap: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  continueButton: {
    flexDirection: 'row',
    backgroundColor: '#6366F1',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  skipButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 16,
    color: '#666',
  },
});

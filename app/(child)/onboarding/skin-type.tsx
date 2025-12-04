import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { SkinType } from '../../../src/types/child';

/**
 * Child Onboarding - Skin Type Selection
 * Fun, simple way for kids to identify their skin type
 */
export default function SkinTypeOnboarding() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<SkinType | null>(null);

  const skinTypes: Array<{ type: SkinType; emoji: string; title: string; description: string; color: string }> = [
    {
      type: 'oily',
      emoji: '✨',
      title: 'Oily',
      description: 'My skin gets shiny, especially on my forehead and nose',
      color: '#FBBF24',
    },
    {
      type: 'dry',
      emoji: '🌵',
      title: 'Dry',
      description: 'My skin feels tight and sometimes flaky',
      color: '#60A5FA',
    },
    {
      type: 'combination',
      emoji: '🌗',
      title: 'Combination',
      description: 'Some parts are oily, other parts are dry',
      color: '#8B5CF6',
    },
    {
      type: 'normal',
      emoji: '😊',
      title: 'Normal',
      description: 'My skin feels balanced, not too oily or dry',
      color: '#10B981',
    },
    {
      type: 'sensitive',
      emoji: '🌸',
      title: 'Sensitive',
      description: 'My skin gets red or irritated easily',
      color: '#EC4899',
    },
  ];

  const handleContinue = () => {
    if (selectedType) {
      router.push({
        pathname: '/(child)/onboarding/concerns',
        params: { skinType: selectedType },
      });
    }
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
          <View style={styles.progressBar} />
          <View style={styles.progressBar} />
          <View style={styles.progressBar} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Question */}
        <View style={styles.questionSection}>
          <Text style={styles.stepLabel}>Step 1 of 4</Text>
          <Text style={styles.question}>What's your skin type?</Text>
          <Text style={styles.hint}>
            Pick the one that sounds most like you. Don't worry, you can change this later!
          </Text>
        </View>

        {/* Skin Type Options */}
        <View style={styles.optionsContainer}>
          {skinTypes.map((option) => (
            <TouchableOpacity
              key={option.type}
              style={[
                styles.optionCard,
                selectedType === option.type && styles.optionCardSelected,
                { borderColor: selectedType === option.type ? option.color : '#e5e7eb' },
              ]}
              onPress={() => setSelectedType(option.type)}
            >
              <View style={styles.optionHeader}>
                <Text style={styles.optionEmoji}>{option.emoji}</Text>
                {selectedType === option.type && (
                  <View style={[styles.checkmark, { backgroundColor: option.color }]}>
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  </View>
                )}
              </View>
              <Text style={styles.optionTitle}>{option.title}</Text>
              <Text style={styles.optionDescription}>{option.description}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Not Sure Option */}
        <TouchableOpacity style={styles.notSureButton}>
          <Ionicons name="help-circle-outline" size={20} color="#6366F1" />
          <Text style={styles.notSureText}>Not sure? Take a quick quiz</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.continueButton, !selectedType && styles.continueButtonDisabled]}
          onPress={handleContinue}
          disabled={!selectedType}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
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
  optionsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  optionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  optionCardSelected: {
    borderWidth: 3,
    shadowOpacity: 0.1,
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  optionEmoji: {
    fontSize: 32,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  optionDescription: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
  notSureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
  },
  notSureText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366F1',
  },
  footer: {
    padding: 20,
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
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonDisabled: {
    backgroundColor: '#cbd5e1',
    shadowOpacity: 0,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
});

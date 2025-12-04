import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { AgeBand } from '../../../src/types/child';

/**
 * Age Selection Screen
 * First step for direct child signups
 */
export default function AgeSelectScreen() {
  const router = useRouter();
  const [selectedAge, setSelectedAge] = useState<AgeBand | null>(null);

  const ageOptions: Array<{ age: AgeBand; label: string; description: string; emoji: string }> = [
    {
      age: '10-12',
      label: '10-12 years old',
      description: 'Just starting to learn about skincare',
      emoji: '🌱',
    },
    {
      age: '13-15',
      label: '13-15 years old',
      description: 'Building my skincare routine',
      emoji: '🌟',
    },
    {
      age: '16-18',
      label: '16-18 years old',
      description: 'Want detailed skincare info',
      emoji: '✨',
    },
  ];

  const handleContinue = () => {
    if (!selectedAge) return;

    // Route to age-appropriate onboarding
    switch (selectedAge) {
      case '10-12':
        router.push({
          pathname: '/(child)/onboarding/tween/welcome',
          params: { age: selectedAge },
        });
        break;
      case '13-15':
        router.push({
          pathname: '/(child)/onboarding/teen/welcome',
          params: { age: selectedAge },
        });
        break;
      case '16-18':
        router.push({
          pathname: '/(child)/onboarding/older-teen/welcome',
          params: { age: selectedAge },
        });
        break;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.emoji}>👋</Text>
          <Text style={styles.title}>Welcome to Freshies!</Text>
          <Text style={styles.subtitle}>
            First, let's make sure we give you the right experience
          </Text>
        </View>

        {/* Question */}
        <View style={styles.questionSection}>
          <Text style={styles.question}>How old are you?</Text>
          <Text style={styles.hint}>
            This helps us show you age-appropriate content
          </Text>
        </View>

        {/* Age Options */}
        <View style={styles.optionsContainer}>
          {ageOptions.map((option) => (
            <TouchableOpacity
              key={option.age}
              style={[
                styles.optionCard,
                selectedAge === option.age && styles.optionCardSelected,
              ]}
              onPress={() => setSelectedAge(option.age)}
            >
              <View style={styles.optionContent}>
                <Text style={styles.optionEmoji}>{option.emoji}</Text>
                <View style={styles.optionText}>
                  <Text style={styles.optionLabel}>{option.label}</Text>
                  <Text style={styles.optionDescription}>{option.description}</Text>
                </View>
              </View>
              {selectedAge === option.age && (
                <View style={styles.checkmark}>
                  <Ionicons name="checkmark-circle" size={28} color="#6366F1" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Privacy Note */}
        <View style={styles.privacyNote}>
          <Ionicons name="shield-checkmark" size={20} color="#10B981" />
          <Text style={styles.privacyText}>
            Your information is private and secure. Your parent can help manage your account.
          </Text>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.continueButton, !selectedAge && styles.continueButtonDisabled]}
          onPress={handleContinue}
          disabled={!selectedAge}
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
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  questionSection: {
    marginBottom: 32,
  },
  question: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  hint: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 32,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    borderColor: '#6366F1',
    borderWidth: 3,
    shadowOpacity: 0.1,
  },
  optionContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  optionEmoji: {
    fontSize: 40,
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: '#666',
  },
  checkmark: {
    marginLeft: 12,
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  privacyText: {
    flex: 1,
    fontSize: 13,
    color: '#166534',
    lineHeight: 20,
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

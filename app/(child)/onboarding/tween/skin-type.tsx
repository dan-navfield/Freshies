import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ArrowLeft } from 'lucide-react-native';
import type { SkinType } from '../../../../src/types/child';

/**
 * Tween Skin Type Selection
 * Super simple with big pictures/emojis
 */
export default function TweenSkinType() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [selectedType, setSelectedType] = useState<SkinType | null>(null);

  const skinTypes: Array<{ type: SkinType; emoji: string; title: string; description: string; color: string }> = [
    {
      type: 'oily',
      emoji: '✨',
      title: 'Shiny',
      description: 'My skin gets shiny and oily',
      color: '#FBBF24',
    },
    {
      type: 'dry',
      emoji: '🌵',
      title: 'Dry',
      description: 'My skin feels dry and tight',
      color: '#60A5FA',
    },
    {
      type: 'normal',
      emoji: '😊',
      title: 'Just Right',
      description: 'My skin feels good!',
      color: '#10B981',
    },
    {
      type: 'sensitive',
      emoji: '🌸',
      title: 'Sensitive',
      description: 'My skin gets red easily',
      color: '#EC4899',
    },
  ];

  const handleContinue = () => {
    if (selectedType) {
      router.push({
        pathname: '/(child)/onboarding/tween/problems',
        params: { age: params.age, skinType: selectedType },
      });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header with Back Button and Progress */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft color="#1a1a1a" size={24} />
        </TouchableOpacity>
        <Text style={styles.progress}>Step 2 of 4</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Question */}
        <View style={styles.questionSection}>
          <Text style={styles.question}>How does your skin feel?</Text>
          <Text style={styles.hint}>Pick the one that sounds like you!</Text>
        </View>

        {/* Skin Type Cards */}
        <View style={styles.cardsContainer}>
          {skinTypes.map((option) => {
            const isSelected = selectedType === option.type;
            
            return (
              <TouchableOpacity
                key={option.type}
                style={[
                  styles.card,
                  isSelected && styles.cardSelected,
                  { borderColor: isSelected ? option.color : '#e5e7eb' },
                ]}
                onPress={() => setSelectedType(option.type)}
              >
                <Text style={styles.cardEmoji}>{option.emoji}</Text>
                <Text style={styles.cardTitle}>{option.title}</Text>
                <Text style={styles.cardDescription}>{option.description}</Text>
                {isSelected && (
                  <View style={[styles.checkmark, { backgroundColor: option.color }]}>
                    <Ionicons name="checkmark" size={24} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.continueButton, !selectedType && styles.continueButtonDisabled]}
          onPress={handleContinue}
          disabled={!selectedType}
        >
          <Text style={styles.continueButtonText}>Next! →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5F7',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progress: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  questionSection: {
    marginBottom: 32,
  },
  question: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
    lineHeight: 40,
  },
  hint: {
    fontSize: 18,
    color: '#666',
    lineHeight: 26,
  },
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  card: {
    width: '47%',
    aspectRatio: 0.85,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    borderWidth: 4,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardSelected: {
    borderWidth: 5,
    shadowOpacity: 0.15,
  },
  cardEmoji: {
    fontSize: 56,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  checkmark: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    padding: 24,
    backgroundColor: '#fff',
  },
  continueButton: {
    backgroundColor: '#EC4899',
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: '#cbd5e1',
  },
  continueButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
});

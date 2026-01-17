import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ArrowLeft } from 'lucide-react-native';

/**
 * Tween Problems Selection
 * Simple 3-4 options for common skin issues
 */
export default function TweenProblems() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [selectedProblems, setSelectedProblems] = useState<string[]>([]);

  const problems = [
    { id: 'pimples', emoji: '😣', title: 'Pimples', description: 'I get pimples sometimes' },
    { id: 'dry', emoji: '🏜️', title: 'Dry Skin', description: 'My skin feels dry' },
    { id: 'oily', emoji: '✨', title: 'Too Shiny', description: 'My skin gets too shiny' },
    { id: 'sensitive', emoji: '🌸', title: 'Gets Red', description: 'My skin gets red easily' },
  ];

  const toggleProblem = (id: string) => {
    if (selectedProblems.includes(id)) {
      setSelectedProblems(selectedProblems.filter(p => p !== id));
    } else {
      setSelectedProblems([...selectedProblems, id]);
    }
  };

  const handleContinue = () => {
    router.push({
      pathname: '/(child)/onboarding/older-teen/goals',
      params: {
        age: params.age,
        skinType: params.skinType,
        problems: JSON.stringify(selectedProblems),
      },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header with Back Button and Progress */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft color="#1a1a1a" size={24} />
        </TouchableOpacity>
        <Text style={styles.progress}>Step 3 of 4</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Question */}
        <View style={styles.questionSection}>
          <Text style={styles.question}>Any skin problems?</Text>
          <Text style={styles.hint}>Pick all that you have (or skip!)</Text>
        </View>

        {/* Problems Grid */}
        <View style={styles.problemsGrid}>
          {problems.map((problem) => {
            const isSelected = selectedProblems.includes(problem.id);
            
            return (
              <TouchableOpacity
                key={problem.id}
                style={[styles.problemCard, isSelected && styles.problemCardSelected]}
                onPress={() => toggleProblem(problem.id)}
              >
                <Text style={styles.problemEmoji}>{problem.emoji}</Text>
                <Text style={styles.problemTitle}>{problem.title}</Text>
                <Text style={styles.problemDescription}>{problem.description}</Text>
                {isSelected && (
                  <View style={styles.checkmark}>
                    <Ionicons name="checkmark-circle" size={32} color="#10B981" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* No Problems Option */}
        <TouchableOpacity
          style={styles.noneButton}
          onPress={() => setSelectedProblems([])}
        >
          <Text style={styles.noneButtonText}>I don't have any problems! 😊</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
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
  problemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  problemCard: {
    width: '47%',
    aspectRatio: 0.9,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    borderWidth: 3,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  problemCardSelected: {
    borderColor: '#10B981',
    borderWidth: 4,
    backgroundColor: '#F0FDF4',
  },
  problemEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  problemTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  problemDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  noneButton: {
    backgroundColor: '#EEF2FF',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  noneButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6366F1',
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
  continueButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
});

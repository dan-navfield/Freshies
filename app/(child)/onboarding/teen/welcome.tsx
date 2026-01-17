import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ArrowLeft } from 'lucide-react-native';

/**
 * Tween (10-12) Welcome Screen
 * Super simple, fun introduction for younger kids
 */
export default function TweenWelcome() {
  const router = useRouter();
  const params = useLocalSearchParams();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header with Back Button and Progress */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft color="#1a1a1a" size={24} />
        </TouchableOpacity>
        <Text style={styles.progress}>Step 1 of 4</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Big Fun Emoji */}
        <View style={styles.emojiContainer}>
          <Text style={styles.bigEmoji}>✨</Text>
        </View>

        {/* Welcome Message */}
        <View style={styles.messageContainer}>
          <Text style={styles.title}>Hi there!</Text>
          <Text style={styles.subtitle}>
            Let's learn about your skin together! 🌟
          </Text>
        </View>

        {/* What We'll Do */}
        <View style={styles.stepsContainer}>
          <Text style={styles.stepsTitle}>We'll ask you about:</Text>
          
          <View style={styles.stepsList}>
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <Text style={styles.stepText}>Your skin type 🧴</Text>
            </View>

            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={styles.stepText}>Any problems 🤔</Text>
            </View>

            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <Text style={styles.stepText}>What you want 🎯</Text>
            </View>

            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>4</Text>
              </View>
              <Text style={styles.stepText}>Pick your avatar 🎨</Text>
            </View>
          </View>
        </View>

        {/* Fun Fact */}
        <View style={styles.funFactBox}>
          <Text style={styles.funFactEmoji}>💡</Text>
          <Text style={styles.funFactText}>
            This will help us find the best products for YOUR skin!
          </Text>
        </View>
      </ScrollView>

      {/* Big Start Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.startButton}
          onPress={() => router.push({
            pathname: '/(child)/onboarding/teen/skin-type',
            params: { age: params.age },
          })}
        >
          <Text style={styles.startButtonText}>Let's Start! 🚀</Text>
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
  emojiContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 24,
  },
  bigEmoji: {
    fontSize: 80,
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 20,
    color: '#666',
    textAlign: 'center',
    lineHeight: 28,
  },
  stepsContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  stepsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 20,
  },
  stepsList: {
    gap: 16,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EC4899',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  stepText: {
    flex: 1,
    fontSize: 18,
    color: '#1a1a1a',
    fontWeight: '600',
  },
  funFactBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  funFactEmoji: {
    fontSize: 32,
  },
  funFactText: {
    flex: 1,
    fontSize: 16,
    color: '#92400E',
    fontWeight: '600',
    lineHeight: 22,
  },
  footer: {
    padding: 24,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  startButton: {
    backgroundColor: '#EC4899',
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
    shadowColor: '#EC4899',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  startButtonText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
});

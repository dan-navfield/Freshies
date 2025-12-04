import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ArrowLeft } from 'lucide-react-native';

/**
 * Tween Avatar Builder
 * Fun, simple avatar selection
 */
export default function TweenAvatar() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [selectedAvatar, setSelectedAvatar] = useState('🦄');

  const avatars = [
    '🦄', '🌟', '✨', '💫', '⭐', '🌈',
    '🌸', '🌺', '🌻', '🌷', '🌹', '🏵️',
    '🐶', '🐱', '🐼', '🐨', '🦊', '🐰',
    '🍓', '🍉', '🍊', '🍋', '🍌', '🍇',
  ];

  const handleContinue = () => {
    // Pass avatar to goals screen
    router.push({
      pathname: '/(child)/onboarding/tween/goals',
      params: {
        ...params,
        avatar: selectedAvatar,
      },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header with Back Button */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft color="#1a1a1a" size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Question */}
        <View style={styles.questionSection}>
          <Text style={styles.question}>Pick your avatar!</Text>
          <Text style={styles.hint}>This will be your profile picture 🎨</Text>
        </View>

        {/* Selected Avatar Preview */}
        <View style={styles.previewContainer}>
          <View style={styles.previewCircle}>
            <Text style={styles.previewEmoji}>{selectedAvatar}</Text>
          </View>
        </View>

        {/* Avatar Grid */}
        <View style={styles.avatarGrid}>
          {avatars.map((avatar) => (
            <TouchableOpacity
              key={avatar}
              style={[
                styles.avatarButton,
                selectedAvatar === avatar && styles.avatarButtonSelected,
              ]}
              onPress={() => setSelectedAvatar(avatar)}
            >
              <Text style={styles.avatarEmoji}>{avatar}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
          <Text style={styles.continueButtonText}>All Done! 🎉</Text>
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
  previewContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  previewCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#EC4899',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  previewEmoji: {
    fontSize: 64,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  avatarButton: {
    width: '14%',
    aspectRatio: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#e5e7eb',
  },
  avatarButtonSelected: {
    borderColor: '#EC4899',
    borderWidth: 4,
    backgroundColor: '#FFF1F2',
  },
  avatarEmoji: {
    fontSize: 32,
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

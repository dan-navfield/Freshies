import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../../src/contexts/AuthContext';
import { supabase } from '../../../../src/lib/supabase';

/**
 * Tween Onboarding Complete
 * Celebration screen with confetti!
 */
export default function TweenComplete() {
  const router = useRouter();
  const { user } = useAuth();
  const confettiPieces = useRef(
    Array.from({ length: 50 }, () => ({
      x: new Animated.Value(Math.random() * 400),
      y: new Animated.Value(-50),
      rotation: new Animated.Value(0),
      color: ['#EC4899', '#FFD93D', '#B8E6D5', '#8B7AB8', '#FF6B9D'][Math.floor(Math.random() * 5)],
    }))
  ).current;

  useEffect(() => {
    // Animate confetti falling
    confettiPieces.forEach((piece, index) => {
      Animated.parallel([
        Animated.timing(piece.y, {
          toValue: 900,
          duration: 3000 + Math.random() * 2000,
          delay: index * 50,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(piece.rotation, {
          toValue: 360 * (2 + Math.random() * 2),
          duration: 3000 + Math.random() * 2000,
          delay: index * 50,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, []);

  const handleStart = async () => {
    // Mark onboarding as completed
    if (user?.id) {
      await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', user.id);
    }

    router.replace('/(child)/home');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Confetti Animation */}
      {confettiPieces.map((piece, index) => (
        <Animated.View
          key={index}
          style={[
            styles.confetti,
            {
              backgroundColor: piece.color,
              transform: [
                { translateX: piece.x },
                { translateY: piece.y },
                {
                  rotate: piece.rotation.interpolate({
                    inputRange: [0, 360],
                    outputRange: ['0deg', '360deg'],
                  }),
                },
              ],
            },
          ]}
        />
      ))}

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Celebration */}
        <View style={styles.celebrationContainer}>
          <Text style={styles.bigEmoji}>🎉</Text>
          <Text style={styles.title}>You're all set!</Text>
          <Text style={styles.subtitle}>
            Your profile is ready! Let's start exploring 🚀
          </Text>
        </View>

        {/* Features Preview */}
        <View style={styles.featuresContainer}>
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="scan" size={32} color="#fff" />
            </View>
            <Text style={styles.featureText}>Scan products to check if they're safe</Text>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="heart" size={32} color="#fff" />
            </View>
            <Text style={styles.featureText}>Save your favorite products</Text>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="time" size={32} color="#fff" />
            </View>
            <Text style={styles.featureText}>Follow your skincare routine</Text>
          </View>
        </View>

        {/* Fun Message */}
        <View style={styles.messageBox}>
          <Text style={styles.messageEmoji}>👨‍👩‍👧</Text>
          <Text style={styles.messageText}>
            Your parent can help you find safe products!
          </Text>
        </View>
      </ScrollView>

      {/* Start Button - Fixed at bottom */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.startButton} onPress={handleStart}>
          <Text style={styles.startButtonText}>Let's Go! 🚀</Text>
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
  confetti: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  celebrationContainer: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 10,
  },
  bigEmoji: {
    fontSize: 80,
    marginBottom: 16,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  featuresContainer: {
    gap: 12,
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EC4899',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    lineHeight: 20,
  },
  messageBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DBEAFE',
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  messageEmoji: {
    fontSize: 28,
  },
  messageText: {
    flex: 1,
    fontSize: 15,
    color: '#1E40AF',
    fontWeight: '600',
    lineHeight: 20,
  },
  footer: {
    padding: 20,
    paddingBottom: 30,
    backgroundColor: '#FFF5F7',
  },
  startButton: {
    backgroundColor: '#EC4899',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#EC4899',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  startButtonText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
});

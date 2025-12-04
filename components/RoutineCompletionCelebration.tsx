import React, { useEffect, useRef } from 'react';
import { View, Text, Modal, StyleSheet, Animated, Dimensions } from 'react-native';
import { Sparkles, Trophy, Star } from 'lucide-react-native';
import { colors, spacing, radii } from '../src/theme/tokens';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface RoutineCompletionCelebrationProps {
  visible: boolean;
  routineName: string;
  pointsEarned: number;
  streakDays: number;
  onDismiss: () => void;
}

export default function RoutineCompletionCelebration({
  visible,
  routineName,
  pointsEarned,
  streakDays,
  onDismiss
}: RoutineCompletionCelebrationProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const sparkleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Animate in
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(sparkleAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(sparkleAnim, {
              toValue: 0,
              duration: 1000,
              useNativeDriver: true,
            }),
          ])
        ),
      ]).start();

      // Auto dismiss after 3 seconds
      const timer = setTimeout(() => {
        onDismiss();
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
    }
  }, [visible]);

  if (!visible) return null;

  const sparkleRotation = sparkleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const sparkleOpacity = sparkleAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 1, 0.3],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ scale: scaleAnim }],
              opacity: fadeAnim,
            },
          ]}
        >
          {/* Sparkle decorations */}
          <Animated.View
            style={[
              styles.sparkle,
              styles.sparkleTopLeft,
              {
                transform: [{ rotate: sparkleRotation }],
                opacity: sparkleOpacity,
              },
            ]}
          >
            <Sparkles size={32} color={colors.yellow} fill={colors.yellow} />
          </Animated.View>

          <Animated.View
            style={[
              styles.sparkle,
              styles.sparkleTopRight,
              {
                transform: [{ rotate: sparkleRotation }],
                opacity: sparkleOpacity,
              },
            ]}
          >
            <Star size={28} color={colors.purple} fill={colors.purple} />
          </Animated.View>

          <Animated.View
            style={[
              styles.sparkle,
              styles.sparkleBottomLeft,
              {
                transform: [{ rotate: sparkleRotation }],
                opacity: sparkleOpacity,
              },
            ]}
          >
            <Star size={24} color={colors.mint} fill={colors.mint} />
          </Animated.View>

          <Animated.View
            style={[
              styles.sparkle,
              styles.sparkleBottomRight,
              {
                transform: [{ rotate: sparkleRotation }],
                opacity: sparkleOpacity,
              },
            ]}
          >
            <Sparkles size={28} color={colors.peach} fill={colors.peach} />
          </Animated.View>

          {/* Main content */}
          <View style={styles.iconContainer}>
            <Trophy size={64} color={colors.yellow} fill={colors.yellow} />
          </View>

          <Text style={styles.title}>Amazing Work!</Text>
          <Text style={styles.subtitle}>You completed</Text>
          <Text style={styles.routineName}>{routineName}</Text>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>+{pointsEarned}</Text>
              <Text style={styles.statLabel}>Points</Text>
            </View>

            {streakDays > 1 && (
              <>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{streakDays} 🔥</Text>
                  <Text style={styles.statLabel}>Day Streak</Text>
                </View>
              </>
            )}
          </View>

          <Text style={styles.encouragement}>
            Keep up the great work! ✨
          </Text>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: SCREEN_WIDTH * 0.85,
    backgroundColor: colors.cream,
    borderRadius: radii.xl,
    padding: spacing[6],
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  sparkle: {
    position: 'absolute',
  },
  sparkleTopLeft: {
    top: -10,
    left: -10,
  },
  sparkleTopRight: {
    top: -5,
    right: -5,
  },
  sparkleBottomLeft: {
    bottom: -5,
    left: -5,
  },
  sparkleBottomRight: {
    bottom: -10,
    right: -10,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: radii.full,
    backgroundColor: colors.lavender,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.purple,
    marginBottom: spacing[2],
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.charcoal,
    opacity: 0.7,
    marginBottom: spacing[1],
  },
  routineName: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.charcoal,
    marginBottom: spacing[4],
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing[4],
    marginBottom: spacing[4],
    borderWidth: 2,
    borderColor: colors.lavender,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: spacing[3],
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.lavender,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.purple,
    marginBottom: spacing[1],
  },
  statLabel: {
    fontSize: 14,
    color: colors.charcoal,
    opacity: 0.7,
  },
  encouragement: {
    fontSize: 16,
    color: colors.charcoal,
    textAlign: 'center',
    fontWeight: '500',
  },
});

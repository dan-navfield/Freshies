import React, { useEffect, useRef } from 'react';
import { View, Text, Modal, StyleSheet, Animated, Dimensions } from 'react-native';
import { Zap, TrendingUp, Award } from 'lucide-react-native';
import { colors, spacing, radii } from '../src/theme/tokens';

const { width } = Dimensions.get('window');

interface LevelUpModalProps {
  visible: boolean;
  onClose: () => void;
  level: number;
  totalPoints: number;
}

export default function LevelUpModal({ visible, onClose, level, totalPoints }: LevelUpModalProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const sparkleAnims = useRef(
    Array.from({ length: 12 }, () => ({
      scale: new Animated.Value(0),
      opacity: new Animated.Value(1),
      rotate: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    if (visible) {
      // Reset animations
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
      pulseAnim.setValue(1);
      sparkleAnims.forEach(anim => {
        anim.scale.setValue(0);
        anim.opacity.setValue(1);
        anim.rotate.setValue(0);
      });

      // Start animations
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 40,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.1,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
            }),
          ])
        ),
        ...sparkleAnims.map((anim, index) => {
          const delay = index * 50;
          return Animated.parallel([
            Animated.sequence([
              Animated.delay(delay),
              Animated.spring(anim.scale, {
                toValue: 1,
                tension: 50,
                friction: 5,
                useNativeDriver: true,
              }),
            ]),
            Animated.sequence([
              Animated.delay(delay + 500),
              Animated.timing(anim.opacity, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
              }),
            ]),
            Animated.timing(anim.rotate, {
              toValue: 360,
              duration: 2000,
              useNativeDriver: true,
            }),
          ]);
        }),
      ]).start();

      // Auto close after 3.5 seconds
      const timer = setTimeout(onClose, 3500);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Sparkles */}
        {sparkleAnims.map((anim, index) => {
          const angle = (index / sparkleAnims.length) * Math.PI * 2;
          const radius = 140;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          
          return (
            <Animated.View
              key={index}
              style={[
                styles.sparkle,
                {
                  left: '50%',
                  top: '50%',
                  transform: [
                    { translateX: x },
                    { translateY: y },
                    { scale: anim.scale },
                    { rotate: anim.rotate.interpolate({
                      inputRange: [0, 360],
                      outputRange: ['0deg', '360deg'],
                    })},
                  ],
                  opacity: anim.opacity,
                },
              ]}
            >
              <Zap size={20} color="#F59E0B" fill="#F59E0B" />
            </Animated.View>
          );
        })}

        {/* Level Up Card */}
        <Animated.View
          style={[
            styles.card,
            {
              transform: [{ scale: scaleAnim }],
              opacity: fadeAnim,
            },
          ]}
        >
          <View style={styles.header}>
            <TrendingUp size={28} color={colors.mint} strokeWidth={3} />
            <Text style={styles.headerText}>Level Up!</Text>
          </View>

          <Animated.View
            style={[
              styles.levelContainer,
              { transform: [{ scale: pulseAnim }] },
            ]}
          >
            <View style={styles.levelBadge}>
              <Award size={40} color={colors.purple} fill={colors.purple} />
              <Text style={styles.levelNumber}>{level}</Text>
            </View>
          </Animated.View>

          <Text style={styles.congratsText}>Congratulations!</Text>
          <Text style={styles.messageText}>
            You've reached Level {level}
          </Text>

          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{totalPoints}</Text>
              <Text style={styles.statLabel}>Total Points</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statValue}>Level {level}</Text>
              <Text style={styles.statLabel}>Current Level</Text>
            </View>
          </View>

          <Text style={styles.keepGoingText}>Keep learning! 🌟</Text>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sparkle: {
    position: 'absolute',
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: spacing[8],
    width: width - spacing[12],
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginBottom: spacing[6],
  },
  headerText: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.mint,
  },
  levelContainer: {
    marginBottom: spacing[6],
  },
  levelBadge: {
    width: 140,
    height: 140,
    borderRadius: radii.full,
    backgroundColor: colors.purple + '20',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: colors.purple,
    position: 'relative',
  },
  levelNumber: {
    position: 'absolute',
    fontSize: 48,
    fontWeight: '700',
    color: colors.white,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  congratsText: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.charcoal,
    marginBottom: spacing[2],
  },
  messageText: {
    fontSize: 18,
    color: colors.charcoal,
    opacity: 0.7,
    marginBottom: spacing[6],
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.cream,
    borderRadius: radii.lg,
    padding: spacing[4],
    marginBottom: spacing[5],
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.charcoal,
    opacity: 0.2,
    marginHorizontal: spacing[4],
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.charcoal,
    marginBottom: spacing[1],
  },
  statLabel: {
    fontSize: 12,
    color: colors.charcoal,
    opacity: 0.6,
  },
  keepGoingText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.mint,
  },
});

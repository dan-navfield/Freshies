import React, { useEffect, useRef } from 'react';
import { View, Text, Modal, StyleSheet, Animated, Dimensions } from 'react-native';
import { Flame, Award } from 'lucide-react-native';
import { colors, spacing, radii } from '../../theme/tokens';

const { width } = Dimensions.get('window');

interface StreakMilestoneModalProps {
  visible: boolean;
  onClose: () => void;
  streakCount: number;
  streakType: 'daily' | 'learning';
}

export default function StreakMilestoneModal({ 
  visible, 
  onClose, 
  streakCount,
  streakType 
}: StreakMilestoneModalProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const flameAnims = useRef(
    Array.from({ length: 8 }, () => ({
      y: new Animated.Value(0),
      opacity: new Animated.Value(1),
      scale: new Animated.Value(1),
    }))
  ).current;

  useEffect(() => {
    if (visible) {
      // Reset animations
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
      flameAnims.forEach(anim => {
        anim.y.setValue(0);
        anim.opacity.setValue(1);
        anim.scale.setValue(1);
      });

      // Start animations
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
        ...flameAnims.map((anim, index) => {
          const delay = index * 100;
          return Animated.loop(
            Animated.sequence([
              Animated.delay(delay),
              Animated.parallel([
                Animated.timing(anim.y, {
                  toValue: -80,
                  duration: 1500,
                  useNativeDriver: true,
                }),
                Animated.timing(anim.opacity, {
                  toValue: 0,
                  duration: 1500,
                  useNativeDriver: true,
                }),
                Animated.sequence([
                  Animated.timing(anim.scale, {
                    toValue: 1.5,
                    duration: 750,
                    useNativeDriver: true,
                  }),
                  Animated.timing(anim.scale, {
                    toValue: 0.5,
                    duration: 750,
                    useNativeDriver: true,
                  }),
                ]),
              ]),
              Animated.timing(anim.y, {
                toValue: 0,
                duration: 0,
                useNativeDriver: true,
              }),
              Animated.timing(anim.opacity, {
                toValue: 1,
                duration: 0,
                useNativeDriver: true,
              }),
              Animated.timing(anim.scale, {
                toValue: 1,
                duration: 0,
                useNativeDriver: true,
              }),
            ])
          );
        }),
      ]).start();

      // Auto close after 3 seconds
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const getMessage = () => {
    if (streakCount >= 30) return 'Legendary dedication! 🌟';
    if (streakCount >= 14) return 'Two weeks strong! 💪';
    if (streakCount >= 7) return 'One week streak! 🎉';
    if (streakCount >= 3) return 'Building momentum! 🚀';
    return 'Great start! 🔥';
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Animated Flames */}
        {flameAnims.map((anim, index) => {
          const angle = (index / flameAnims.length) * Math.PI * 2;
          const radius = 100;
          const x = Math.cos(angle) * radius;
          
          return (
            <Animated.View
              key={index}
              style={[
                styles.flame,
                {
                  left: '50%',
                  bottom: '50%',
                  transform: [
                    { translateX: x },
                    { translateY: anim.y },
                    { scale: anim.scale },
                  ],
                  opacity: anim.opacity,
                },
              ]}
            >
              <Flame size={24} color="#EF4444" fill="#EF4444" />
            </Animated.View>
          );
        })}

        {/* Streak Card */}
        <Animated.View
          style={[
            styles.card,
            {
              transform: [{ scale: scaleAnim }],
              opacity: fadeAnim,
            },
          ]}
        >
          <View style={styles.iconContainer}>
            <Flame size={60} color="#EF4444" fill="#EF4444" />
          </View>

          <Text style={styles.streakNumber}>{streakCount}</Text>
          <Text style={styles.streakLabel}>Day Streak!</Text>

          <Text style={styles.message}>{getMessage()}</Text>

          <View style={styles.typeContainer}>
            <Award size={20} color={colors.mint} />
            <Text style={styles.typeText}>
              {streakType === 'daily' ? 'Daily Routine' : 'Learning'} Streak
            </Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flame: {
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
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: radii.full,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[5],
  },
  streakNumber: {
    fontSize: 64,
    fontWeight: '700',
    color: '#EF4444',
    marginBottom: spacing[2],
  },
  streakLabel: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.charcoal,
    marginBottom: spacing[4],
  },
  message: {
    fontSize: 18,
    color: colors.charcoal,
    opacity: 0.7,
    textAlign: 'center',
    marginBottom: spacing[5],
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: colors.mint + '20',
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    borderRadius: radii.pill,
  },
  typeText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.mint,
  },
});

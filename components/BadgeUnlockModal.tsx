import React, { useEffect, useRef } from 'react';
import { View, Text, Modal, StyleSheet, Animated, Dimensions, TouchableOpacity } from 'react-native';
import { Trophy, Star, Zap, X } from 'lucide-react-native';
import { colors, spacing, radii } from '../src/theme/tokens';
import BadgeIcon from './badges/BadgeIcon';
import { getAchievementRarity } from '../src/utils/achievementIcons';

const { width } = Dimensions.get('window');

interface BadgeUnlockModalProps {
  visible: boolean;
  onClose: () => void;
  badge: {
    icon: string;
    title: string;
    description: string;
    points: number;
  } | null;
}

export default function BadgeUnlockModal({ visible, onClose, badge }: BadgeUnlockModalProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const confettiAnims = useRef(
    Array.from({ length: 20 }, () => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      rotate: new Animated.Value(0),
      opacity: new Animated.Value(1),
    }))
  ).current;

  useEffect(() => {
    if (visible) {
      // Reset animations
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
      confettiAnims.forEach(anim => {
        anim.x.setValue(0);
        anim.y.setValue(0);
        anim.rotate.setValue(0);
        anim.opacity.setValue(1);
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
        ...confettiAnims.map((anim, index) => {
          const angle = (index / confettiAnims.length) * Math.PI * 2;
          const distance = 150 + Math.random() * 100;
          return Animated.parallel([
            Animated.timing(anim.x, {
              toValue: Math.cos(angle) * distance,
              duration: 1000 + Math.random() * 500,
              useNativeDriver: true,
            }),
            Animated.timing(anim.y, {
              toValue: Math.sin(angle) * distance - 100,
              duration: 1000 + Math.random() * 500,
              useNativeDriver: true,
            }),
            Animated.timing(anim.rotate, {
              toValue: Math.random() * 720 - 360,
              duration: 1000 + Math.random() * 500,
              useNativeDriver: true,
            }),
            Animated.timing(anim.opacity, {
              toValue: 0,
              duration: 1000,
              delay: 500,
              useNativeDriver: true,
            }),
          ]);
        }),
      ]).start();

      // Auto close after 3 seconds
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!badge) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Confetti */}
        {confettiAnims.map((anim, index) => (
          <Animated.View
            key={index}
            style={[
              styles.confetti,
              {
                backgroundColor: [colors.mint, colors.purple, '#F59E0B', '#EF4444'][index % 4],
                transform: [
                  { translateX: anim.x },
                  { translateY: anim.y },
                  { rotate: anim.rotate.interpolate({
                    inputRange: [0, 360],
                    outputRange: ['0deg', '360deg'],
                  })},
                ],
                opacity: anim.opacity,
              },
            ]}
          />
        ))}

        {/* Badge Card */}
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
            <Star size={24} color="#F59E0B" fill="#F59E0B" />
            <Text style={styles.headerText}>Badge Unlocked!</Text>
            <Star size={24} color="#F59E0B" fill="#F59E0B" />
          </View>
          
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color={colors.charcoal} />
          </TouchableOpacity>

          <View style={styles.badgeIconContainer}>
            <BadgeIcon
              type={badge.icon as any}
              size={120}
              primaryColor={getAchievementRarity(badge.points) === 'legendary' ? '#FCD34D' : 
                           getAchievementRarity(badge.points) === 'epic' ? '#F472B6' :
                           getAchievementRarity(badge.points) === 'rare' ? '#60A5FA' : '#FFD700'}
              secondaryColor={getAchievementRarity(badge.points) === 'legendary' ? '#F59E0B' :
                             getAchievementRarity(badge.points) === 'epic' ? '#EC4899' :
                             getAchievementRarity(badge.points) === 'rare' ? '#3B82F6' : '#FFA500'}
              backgroundColor={getAchievementRarity(badge.points) === 'legendary' ? '#D97706' :
                              getAchievementRarity(badge.points) === 'epic' ? '#DB2777' :
                              getAchievementRarity(badge.points) === 'rare' ? '#2563EB' : '#4A90E2'}
            />
          </View>

          <Text style={styles.badgeTitle}>{badge.title}</Text>
          <Text style={styles.badgeDescription}>{badge.description}</Text>

          <View style={styles.pointsBadge}>
            <Zap size={16} color={colors.mint} fill={colors.mint} />
            <Text style={styles.pointsText}>+{badge.points} points</Text>
          </View>
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
  confetti: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    top: '50%',
    left: '50%',
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
    fontSize: 20,
    fontWeight: '700',
    color: colors.charcoal,
  },
  badgeIconContainer: {
    width: 120,
    height: 120,
    borderRadius: radii.full,
    backgroundColor: colors.cream,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[5],
  },
  badgeIcon: {
    fontSize: 60,
  },
  badgeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.charcoal,
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  badgeDescription: {
    fontSize: 16,
    color: colors.charcoal,
    opacity: 0.7,
    textAlign: 'center',
    marginBottom: spacing[5],
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: colors.mint + '20',
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    borderRadius: radii.pill,
  },
  closeButton: {
    position: 'absolute',
    top: spacing[4],
    right: spacing[4],
    padding: spacing[2],
    zIndex: 10,
  },
  pointsText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.mint,
  },
});

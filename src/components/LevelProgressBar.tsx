import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors, spacing, radii } from '../theme/tokens';

interface LevelProgressBarProps {
  currentPoints: number;
  level: number;
}

// Points required for each level (exponential growth)
const getPointsForLevel = (level: number): number => {
  return Math.floor(100 * Math.pow(1.5, level - 1));
};

export default function LevelProgressBar({ currentPoints, level }: LevelProgressBarProps) {
  const progressAnim = useRef(new Animated.Value(0)).current;
  
  const pointsForCurrentLevel = getPointsForLevel(level);
  const pointsForNextLevel = getPointsForLevel(level + 1);
  const pointsIntoCurrentLevel = currentPoints - pointsForCurrentLevel;
  const pointsNeededForNextLevel = pointsForNextLevel - pointsForCurrentLevel;
  const progress = Math.min(Math.max(pointsIntoCurrentLevel / pointsNeededForNextLevel, 0), 1);
  const pointsToGo = pointsForNextLevel - currentPoints;

  useEffect(() => {
    Animated.spring(progressAnim, {
      toValue: progress,
      tension: 40,
      friction: 8,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.levelText}>Level {level}</Text>
        <Text style={styles.nextLevelText}>
          {pointsToGo > 0 ? `${pointsToGo} pts to Level ${level + 1}` : 'Max Level!'}
        </Text>
      </View>
      
      <View style={styles.progressBarContainer}>
        <Animated.View 
          style={[
            styles.progressBarFill,
            { width: progressWidth }
          ]} 
        />
        <View style={styles.progressBarOverlay}>
          <Text style={styles.progressText}>
            {Math.round(progress * 100)}%
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing[4],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  levelText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.charcoal,
  },
  nextLevelText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.purple,
  },
  progressBarContainer: {
    height: 28,
    backgroundColor: colors.white,
    borderRadius: radii.pill,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 2,
    borderColor: colors.cream,
  },
  progressBarFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: colors.mint,
    borderRadius: radii.pill,
  },
  progressBarOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.charcoal,
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});

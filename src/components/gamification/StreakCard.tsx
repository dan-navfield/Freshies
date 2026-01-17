import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Flame, Calendar, TrendingUp } from 'lucide-react-native';
import { colors, spacing, radii } from '../../theme/tokens';

interface StreakCardProps {
  currentStreak: number;
  longestStreak: number;
  streakType: 'daily' | 'learning';
  lastActivityDate?: string;
}

export default function StreakCard({ 
  currentStreak, 
  longestStreak, 
  streakType,
  lastActivityDate 
}: StreakCardProps) {
  const isActive = lastActivityDate === new Date().toISOString().split('T')[0];
  
  const getStreakEmoji = (streak: number) => {
    if (streak === 0) return '💤';
    if (streak < 3) return '🔥';
    if (streak < 7) return '🔥🔥';
    if (streak < 14) return '🔥🔥🔥';
    return '🔥🔥🔥🔥';
  };

  const getStreakMessage = (streak: number) => {
    if (streak === 0) return 'Start your streak today!';
    if (streak === 1) return 'Great start!';
    if (streak < 3) return 'Keep it going!';
    if (streak < 7) return 'You\'re on fire!';
    if (streak < 14) return 'Incredible streak!';
    return 'Legendary streak!';
  };

  return (
    <View style={[styles.container, isActive && styles.containerActive]}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Flame 
            size={24} 
            color={currentStreak > 0 ? '#EF4444' : colors.charcoal} 
            fill={currentStreak > 0 ? '#EF4444' : 'transparent'}
          />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>
            {streakType === 'daily' ? 'Daily Routine' : 'Learning'} Streak
          </Text>
          <Text style={styles.message}>{getStreakMessage(currentStreak)}</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.streakEmoji}>{getStreakEmoji(currentStreak)}</Text>
          <Text style={styles.statValue}>{currentStreak}</Text>
          <Text style={styles.statLabel}>Current</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.statBox}>
          <TrendingUp size={20} color={colors.mint} />
          <Text style={styles.statValue}>{longestStreak}</Text>
          <Text style={styles.statLabel}>Best</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.statBox}>
          <Calendar size={20} color={colors.purple} />
          <Text style={styles.statValue}>
            {isActive ? 'Today' : 'Missed'}
          </Text>
          <Text style={styles.statLabel}>Status</Text>
        </View>
      </View>

      {currentStreak > 0 && (
        <View style={styles.progressSection}>
          <Text style={styles.progressLabel}>Next Milestone</Text>
          <View style={styles.milestones}>
            {[3, 7, 14, 30].map((milestone) => (
              <View 
                key={milestone}
                style={[
                  styles.milestone,
                  currentStreak >= milestone && styles.milestoneComplete
                ]}
              >
                <Text style={[
                  styles.milestoneText,
                  currentStreak >= milestone && styles.milestoneTextComplete
                ]}>
                  {milestone}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: spacing[5],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  containerActive: {
    borderWidth: 2,
    borderColor: colors.mint,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[5],
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: radii.full,
    backgroundColor: colors.cream,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[3],
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.charcoal,
    marginBottom: spacing[1],
  },
  message: {
    fontSize: 13,
    color: colors.charcoal,
    opacity: 0.7,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: spacing[4],
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  streakEmoji: {
    fontSize: 24,
    marginBottom: spacing[2],
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.charcoal,
    marginBottom: spacing[1],
  },
  statLabel: {
    fontSize: 11,
    color: colors.charcoal,
    opacity: 0.6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  divider: {
    width: 1,
    backgroundColor: colors.cream,
    marginHorizontal: spacing[3],
  },
  progressSection: {
    paddingTop: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.cream,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.charcoal,
    opacity: 0.7,
    marginBottom: spacing[3],
    textAlign: 'center',
  },
  milestones: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  milestone: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    backgroundColor: colors.cream,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.cream,
  },
  milestoneComplete: {
    backgroundColor: colors.mint,
    borderColor: colors.mint,
  },
  milestoneText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.charcoal,
    opacity: 0.5,
  },
  milestoneTextComplete: {
    color: colors.white,
    opacity: 1,
  },
});

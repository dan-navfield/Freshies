import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Star, ChevronRight } from 'lucide-react-native';
import { colors, spacing, radii } from '../theme/tokens';
import { useChildProfile } from '../contexts/ChildProfileContext';
import { 
  getUserPoints, 
  getUserAchievements, 
  getUserStreaks,
  type UserPoints,
  type UserAchievement,
  type Streak
} from '../services/gamificationService';

/**
 * Reusable Gamification Band Component
 * Shows points, level, badges with expandable stats
 */
export default function GamificationBand() {
  const router = useRouter();
  const { childProfile } = useChildProfile();
  
  // Gamification state
  const [userPoints, setUserPoints] = useState<UserPoints | null>(null);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [streaks, setStreaks] = useState<Streak[]>([]);
  const [statsExpanded, setStatsExpanded] = useState(false);

  useEffect(() => {
    if (childProfile?.id) {
      loadGamificationData();
      // Refresh every 30 seconds
      const interval = setInterval(() => {
        loadGamificationData();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [childProfile?.id]);

  const loadGamificationData = async () => {
    if (!childProfile?.id) return;

    try {
      const [points, achievements, userStreaks] = await Promise.all([
        getUserPoints(childProfile.id),
        getUserAchievements(childProfile.id),
        getUserStreaks(childProfile.id)
      ]);

      if (points) setUserPoints(points);
      setUserAchievements(achievements);
      setStreaks(userStreaks);
    } catch (error) {
      console.error('Error loading gamification data:', error);
    }
  };

  if (!childProfile?.id) return null;

  return (
    <View>
      <TouchableOpacity 
        style={styles.statsBand} 
        activeOpacity={0.8}
        onPress={() => setStatsExpanded(!statsExpanded)}
      >
        <View style={styles.statsBandContent}>
          <View style={styles.statsBandLeft}>
            <Star size={16} color={colors.white} fill={colors.white} />
            <Text style={styles.statsBandText}>
              {userPoints?.total_points || 0} pts
            </Text>
            <View style={styles.statsBandDivider} />
            <Text style={styles.statsBandText}>
              Level {userPoints?.level || 1}
            </Text>
            <View style={styles.statsBandDivider} />
            <Text style={styles.statsBandText}>
              {userAchievements.length} badges
            </Text>
          </View>
          <ChevronRight 
            size={20} 
            color={colors.white} 
            style={{ transform: [{ rotate: statsExpanded ? '90deg' : '0deg' }] }}
          />
        </View>
        
        {/* Level Progress Bar */}
        <View style={styles.statsBandProgress}>
          <View 
            style={[
              styles.statsBandProgressFill, 
              { 
                width: `${(() => {
                  const level = userPoints?.level || 1;
                  const totalPoints = userPoints?.total_points || 0;
                  const currentLevelPoints = Math.floor(100 * Math.pow(1.5, level - 1));
                  const nextLevelPoints = Math.floor(100 * Math.pow(1.5, level));
                  const pointsIntoLevel = totalPoints - currentLevelPoints;
                  const pointsNeededForLevel = nextLevelPoints - currentLevelPoints;
                  const progress = (pointsIntoLevel / pointsNeededForLevel) * 100;
                  return Math.min(Math.max(progress, 0), 100);
                })()}%` 
              }
            ]} 
          />
        </View>
      </TouchableOpacity>

      {/* Expanded Stats View - Compact */}
      {statsExpanded && (
        <View style={styles.statsExpandedContainer}>
          <View style={styles.statsExpandedContent}>
            {/* Quick Stats Row */}
            <View style={styles.expandedQuickStats}>
              <View style={styles.expandedStatItem}>
                <Text style={styles.expandedStatEmoji}>🔥</Text>
                <Text style={styles.expandedStatValue}>
                  {streaks.find(s => s.streak_type === 'daily')?.current_streak || 0}
                </Text>
                <Text style={styles.expandedStatLabel}>Day Streak</Text>
              </View>
              
              <View style={styles.expandedStatDivider} />
              
              <View style={styles.expandedStatItem}>
                <Text style={styles.expandedStatEmoji}>🎯</Text>
                <Text style={styles.expandedStatValue}>
                  {500 - ((userPoints?.total_points || 0) % 500)}
                </Text>
                <Text style={styles.expandedStatLabel}>To Reward</Text>
              </View>
              
              <View style={styles.expandedStatDivider} />
              
              <View style={styles.expandedStatItem}>
                <Text style={styles.expandedStatEmoji}>🏆</Text>
                <Text style={styles.expandedStatValue}>
                  {userAchievements[0]?.achievement.icon || '—'}
                </Text>
                <Text style={styles.expandedStatLabel}>Latest</Text>
              </View>
            </View>
            
            {/* View Full Stats Link */}
            <TouchableOpacity 
              style={styles.viewFullStatsButton}
              onPress={() => router.push('/(child)/learn/stats')}
            >
              <Text style={styles.viewFullStatsText}>View Full Stats & Rewards</Text>
              <ChevronRight size={16} color={colors.white} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // Compact Stats Band
  statsBand: {
    backgroundColor: colors.purple,
    overflow: 'hidden',
  },
  statsBandContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  statsBandLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  statsBandText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  statsBandDivider: {
    width: 1,
    height: 16,
    backgroundColor: colors.white,
    opacity: 0.3,
  },
  statsBandProgress: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  statsBandProgressFill: {
    height: '100%',
    backgroundColor: colors.mint,
  },
  // Expanded Stats View - Compact
  statsExpandedContainer: {
    backgroundColor: colors.purple,
  },
  statsExpandedContent: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  expandedQuickStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  expandedStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  expandedStatEmoji: {
    fontSize: 20,
    marginBottom: spacing[1],
  },
  expandedStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
  },
  expandedStatLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.white,
    opacity: 0.8,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  expandedStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.white,
    opacity: 0.2,
  },
  viewFullStatsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
    borderRadius: radii.pill,
  },
  viewFullStatsText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.white,
    marginRight: spacing[1],
  },
});

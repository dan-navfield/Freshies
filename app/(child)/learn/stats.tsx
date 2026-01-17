import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Trophy, Star, Flame, Target, Award, TrendingUp, Calendar, Zap } from 'lucide-react-native';
import { colors, spacing, radii } from '../../../src/theme/tokens';
import DetailPageHeader from '../../../src/components/navigation/DetailPageHeader';
import ShareAchievementModal from '../../../src/components/gamification/ShareAchievementModal';
import AchievementReactionsModal from '../../../src/components/gamification/AchievementReactionsModal';
import AchievementBadge from '../../../src/components/gamification/AchievementBadge';
import { getAchievementIconType, getAchievementRarity } from '../../../src/utils/achievementIcons';
import { getBulkAchievementShareStatus } from '../../../src/modules/identity';
import { useChildProfile } from '../../../src/contexts/ChildProfileContext';
import {
  getUserPoints,
  getUserAchievements,
  getRecentActivity,
  getUserStreaks,
  type UserPoints,
  type UserAchievement,
  type ActivityLogEntry,
  type Streak
} from '../../../src/modules/gamification';

/**
 * Full Stats & Rewards Page
 * Comprehensive view of all gamification data
 */
export default function StatsScreen() {
  const { childProfile } = useChildProfile();
  const [userPoints, setUserPoints] = useState<UserPoints | null>(null);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityLogEntry[]>([]);
  const [streaks, setStreaks] = useState<Streak[]>([]);
  const [loading, setLoading] = useState(true);
  const [achievementToShare, setAchievementToShare] = useState<any>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareStatus, setShareStatus] = useState<Record<string, { isShared: boolean; reactionCount: number }>>({});
  const [showReactionsModal, setShowReactionsModal] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState<any>(null);

  useEffect(() => {
    if (childProfile?.id) {
      loadAllStats();
    }
  }, [childProfile?.id]);

  const loadAllStats = async () => {
    if (!childProfile?.id) return;

    try {
      setLoading(true);
      
      // Load all gamification data
      const [points, achievements, activity, userStreaks] = await Promise.all([
        getUserPoints(childProfile.id),
        getUserAchievements(childProfile.id),
        getRecentActivity(childProfile.id, 10),
        getUserStreaks(childProfile.id)
      ]);

      setUserPoints(points);
      setUserAchievements(achievements);
      setRecentActivity(activity);
      setStreaks(userStreaks);

      // Load share status for achievements
      if (achievements.length > 0) {
        const achievementIds = achievements.map(a => a.achievement_id);
        const status = await getBulkAchievementShareStatus(childProfile.id, achievementIds);
        setShareStatus(status);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getNextLevelPoints = (level: number) => {
    return Math.floor(100 * Math.pow(1.5, level));
  };

  const getCurrentLevelPoints = (level: number) => {
    return Math.floor(100 * Math.pow(1.5, level - 1));
  };

  return (
    <View style={styles.container}>
      <DetailPageHeader
        title="Stats & Rewards"
        subtitle="Your achievements and progress"
        showAvatar={true}
      />
      
      {/* Purple Info Banner */}
      <View style={styles.infoBanner}>
        <Text style={styles.infoBannerText}>Track your progress and earn rewards! 🏆</Text>
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Level & Points Card */}
        <View style={styles.levelCard}>
          <View style={styles.levelHeader}>
            <View style={styles.levelBadge}>
              <Zap size={32} color={colors.white} fill={colors.white} />
              <Text style={styles.levelNumber}>{userPoints?.level || 1}</Text>
            </View>
            <View style={styles.levelInfo}>
              <Text style={styles.levelTitle}>Level {userPoints?.level || 1}</Text>
              <Text style={styles.totalPoints}>{userPoints?.total_points || 0} Total Points</Text>
            </View>
          </View>

          {/* Progress to Next Level */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Progress to Level {(userPoints?.level || 0) + 1}</Text>
              <Text style={styles.progressPoints}>
                {userPoints ? getNextLevelPoints(userPoints.level) - userPoints.total_points : 100} pts to go
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  { 
                    width: `${(() => {
                      if (!userPoints) return 0;
                      const current = getCurrentLevelPoints(userPoints.level);
                      const next = getNextLevelPoints(userPoints.level);
                      const progress = ((userPoints.total_points - current) / (next - current)) * 100;
                      return Math.min(Math.max(progress, 0), 100);
                    })()}%`
                  }
                ]}
              />
            </View>
          </View>
        </View>

        {/* Streaks Card */}
        <View style={styles.streaksCard}>
          <Text style={styles.sectionTitle}>🔥 Active Streaks</Text>
          {streaks.map((streak) => (
            <View key={streak.streak_type} style={styles.streakItem}>
              <View style={styles.streakLeft}>
                <Flame size={24} color="#EF4444" fill="#EF4444" />
                <View>
                  <Text style={styles.streakType}>
                    {streak.streak_type === 'daily' ? 'Daily Routine' : 'Learning'} Streak
                  </Text>
                  <Text style={styles.streakDays}>{streak.current_streak} days</Text>
                </View>
              </View>
              <View style={styles.streakRight}>
                <Text style={styles.streakBest}>Best: {streak.longest_streak}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Rewards Section */}
        <View style={styles.rewardsCard}>
          <Text style={styles.sectionTitle}>🎯 Rewards Progress</Text>
          
          <View style={styles.rewardMilestones}>
            {[100, 250, 500, 1000, 2500].map((milestone) => {
              const isUnlocked = (userPoints?.total_points || 0) >= milestone;
              return (
                <View key={milestone} style={styles.milestoneItem}>
                  <View style={[
                    styles.milestoneIcon,
                    isUnlocked && styles.milestoneIconUnlocked
                  ]}>
                    {isUnlocked ? (
                      <Star size={20} color={colors.white} fill={colors.white} />
                    ) : (
                      <Target size={20} color={colors.charcoal} />
                    )}
                  </View>
                  <Text style={[
                    styles.milestonePoints,
                    isUnlocked && styles.milestonePointsUnlocked
                  ]}>
                    {milestone}
                  </Text>
                </View>
              );
            })}
          </View>

          <TouchableOpacity style={styles.claimButton}>
            <Text style={styles.claimButtonText}>View Available Rewards</Text>
          </TouchableOpacity>
        </View>

        {/* Achievements/Badges */}
        <View style={styles.achievementsCard}>
          <Text style={styles.sectionTitle}>🏆 Earned Badges</Text>
          
          {userAchievements.length > 0 ? (
            <View style={styles.badgeGrid}>
              {userAchievements.map((achievement) => {
                const status = shareStatus[achievement.achievement_id] || { isShared: false, reactionCount: 0 };
                return (
                  <AchievementBadge
                    key={achievement.id}
                    iconType={getAchievementIconType(
                      achievement.achievement.title,
                      achievement.achievement.category
                    )}
                    title={achievement.achievement.title}
                    date={achievement.earned_at}
                    rarity={getAchievementRarity(achievement.achievement.points)}
                    size="medium"
                    isShared={status.isShared}
                    reactionCount={status.reactionCount}
                    onViewReactions={status.isShared ? () => {
                      setSelectedAchievement({
                        id: achievement.achievement_id,
                        title: achievement.achievement.title
                      });
                      setShowReactionsModal(true);
                    } : undefined}
                    onShare={() => {
                      setAchievementToShare({
                        id: achievement.achievement_id,
                        title: achievement.achievement.title,
                        description: achievement.achievement.description,
                        icon: achievement.achievement.icon,
                        points: achievement.achievement.points
                      });
                      setShowShareModal(true);
                    }}
                  />
                );
              })}
            </View>
          ) : (
            <Text style={styles.emptyText}>Start earning badges by completing activities!</Text>
          )}
        </View>

        {/* Recent Activity */}
        <View style={styles.activityCard}>
          <Text style={styles.sectionTitle}>📊 Recent Activity</Text>
          
          {recentActivity.map((activity, index) => (
            <View key={activity.id} style={styles.activityItem}>
              <View style={[
                styles.activityDot,
                { backgroundColor: index === 0 ? colors.mint : colors.mist }
              ]} />
              <View style={styles.activityContent}>
                <Text style={styles.activityText}>
                  {activity.activity_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Text>
                <Text style={styles.activityTime}>
                  {new Date(activity.created_at).toLocaleDateString()}
                </Text>
              </View>
              {activity.points_earned > 0 && (
                <Text style={styles.activityPoints}>+{activity.points_earned}</Text>
              )}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Family Share Modal */}
      <ShareAchievementModal
        visible={showShareModal}
        onClose={() => {
          setShowShareModal(false);
          setAchievementToShare(null);
        }}
        achievement={achievementToShare}
        childProfileId={childProfile?.id || ''}
        onSuccess={async () => {
          console.log('Achievement shared with family!');
          // Reload share status to show the updated badge
          if (childProfile?.id && userAchievements.length > 0) {
            const achievementIds = userAchievements.map(a => a.achievement_id);
            const status = await getBulkAchievementShareStatus(childProfile.id, achievementIds);
            setShareStatus(status);
          }
        }}
      />

      {/* Family Reactions Modal */}
      <AchievementReactionsModal
        visible={showReactionsModal}
        onClose={() => {
          setShowReactionsModal(false);
          setSelectedAchievement(null);
        }}
        achievementTitle={selectedAchievement?.title || ''}
        achievementId={selectedAchievement?.id || ''}
        childProfileId={childProfile?.id || ''}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollContent: {
    flex: 1,
  },
  // Level Card
  levelCard: {
    backgroundColor: colors.purple,
    margin: spacing[6],
    padding: spacing[6],
    borderRadius: radii.xl,
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[5],
  },
  levelBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[4],
  },
  levelNumber: {
    position: 'absolute',
    fontSize: 24,
    fontWeight: '700',
    color: colors.white,
  },
  levelInfo: {
    flex: 1,
  },
  levelTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.white,
    marginBottom: spacing[1],
  },
  totalPoints: {
    fontSize: 16,
    color: colors.white,
    opacity: 0.9,
  },
  progressSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: spacing[4],
    borderRadius: radii.lg,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing[3],
  },
  progressLabel: {
    fontSize: 14,
    color: colors.white,
    opacity: 0.9,
  },
  progressPoints: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.mint,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.mint,
    borderRadius: 4,
  },
  // Sections
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.charcoal,
    marginBottom: spacing[4],
  },
  // Streaks
  streaksCard: {
    backgroundColor: colors.white,
    marginHorizontal: spacing[6],
    marginBottom: spacing[4],
    padding: spacing[5],
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.mist,
  },
  streakItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.mist,
  },
  streakLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  streakType: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.charcoal,
  },
  streakDays: {
    fontSize: 20,
    fontWeight: '700',
    color: '#EF4444',
    marginTop: spacing[1],
  },
  streakRight: {
    alignItems: 'flex-end',
  },
  streakBest: {
    fontSize: 12,
    color: colors.charcoal,
    opacity: 0.6,
  },
  // Rewards
  rewardsCard: {
    backgroundColor: colors.white,
    marginHorizontal: spacing[6],
    marginBottom: spacing[4],
    padding: spacing[5],
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.mist,
  },
  rewardMilestones: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing[5],
  },
  milestoneItem: {
    alignItems: 'center',
  },
  milestoneIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.mist,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  milestoneIconUnlocked: {
    backgroundColor: colors.mint,
  },
  milestonePoints: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.charcoal,
    opacity: 0.5,
  },
  milestonePointsUnlocked: {
    opacity: 1,
    color: colors.mint,
  },
  claimButton: {
    backgroundColor: colors.purple,
    paddingVertical: spacing[3],
    borderRadius: radii.pill,
    alignItems: 'center',
  },
  claimButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  // Achievements
  achievementsCard: {
    backgroundColor: colors.white,
    marginHorizontal: spacing[6],
    marginBottom: spacing[4],
    padding: spacing[5],
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.mist,
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
  },
  badgeItem: {
    width: '30%',
    alignItems: 'center',
  },
  badgeIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.mint + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  badgeEmoji: {
    fontSize: 28,
  },
  badgeName: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.charcoal,
    textAlign: 'center',
    marginBottom: spacing[1],
  },
  badgeDate: {
    fontSize: 10,
    color: colors.charcoal,
    opacity: 0.5,
  },
  emptyText: {
    fontSize: 14,
    color: colors.charcoal,
    opacity: 0.6,
    textAlign: 'center',
    paddingVertical: spacing[4],
  },
  // Activity
  activityCard: {
    backgroundColor: colors.white,
    marginHorizontal: spacing[6],
    marginBottom: spacing[8],
    padding: spacing[5],
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.mist,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.mist,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing[3],
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: colors.charcoal,
    marginBottom: spacing[1],
  },
  activityTime: {
    fontSize: 11,
    color: colors.charcoal,
    opacity: 0.5,
  },
  activityPoints: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.purple,
  },
  shareIconButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    padding: 4,
    backgroundColor: colors.white,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  infoBanner: {
    backgroundColor: colors.purple,
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[6],
    alignItems: 'center',
  },
  infoBannerText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.mint,
    textAlign: 'center',
  },
});

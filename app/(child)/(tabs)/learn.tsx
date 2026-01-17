import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { BookOpen, Sparkles, Brain, Trophy, ChevronRight, Droplets, Sun, Heart, X, Star, Zap } from 'lucide-react-native';
import { colors, spacing, radii } from '../../../src/theme/tokens';
import { globalStyles } from '../../../src/theme/styles';
import { supabase } from '../../../src/lib/supabase';
import PageHeader from '../../../src/components/PageHeader';
import BadgeUnlockModal from '../../../src/components/BadgeUnlockModal';
import LevelUpModal from '../../../src/components/LevelUpModal';
import LevelProgressBar from '../../../src/components/LevelProgressBar';
import StreakCard from '../../../src/components/StreakCard';
import BadgeIcon from '../../../src/components/badges/BadgeIcon';
import { getAchievementRarity } from '../../../src/utils/achievementIcons';
import { useChildProfile } from '../../../src/contexts/ChildProfileContext';
import { useAuth } from '../../../src/contexts/AuthContext';
import { 
  getUserPoints, 
  getUserAchievements, 
  getRecentActivity,
  getUserStreaks,
  type UserPoints,
  type UserAchievement,
  type ActivityLogEntry,
  type Streak
} from '../../../src/services/gamificationService';

const { width } = Dimensions.get('window');

interface LearnCategory {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  route: string;
  completed?: number;
  total?: number;
}

const LEARN_CATEGORIES: LearnCategory[] = [
  {
    id: 'tips',
    title: 'Skincare Tips',
    description: 'Learn the basics of healthy skin',
    icon: Sparkles,
    color: colors.purple,
    route: '/(child)/learn/tips',
    completed: 3,
    total: 12,
  },
  {
    id: 'ingredients',
    title: 'Ingredient Guide',
    description: 'Discover what\'s in your products',
    icon: BookOpen,
    color: colors.mint,
    route: '/(child)/learn/ingredients',
    completed: 5,
    total: 20,
  },
  {
    id: 'quiz',
    title: 'Quiz Time!',
    description: 'Test your skincare knowledge',
    icon: Brain,
    color: '#F59E0B',
    route: '/(child)/learn/quiz',
    completed: 2,
    total: 8,
  },
];

/**
 * Learn Home Screen
 * Main hub for educational content
 */
export default function LearnScreen() {
  const router = useRouter();
  const { childProfile } = useChildProfile();
  const { user } = useAuth();
  
  // Gamification state
  const [userPoints, setUserPoints] = useState<UserPoints | null>(null);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityLogEntry[]>([]);
  const [streaks, setStreaks] = useState<Streak[]>([]);
  const [statsExpanded, setStatsExpanded] = useState(false);
  
  // Celebration modals
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [unlockedBadge, setUnlockedBadge] = useState<any>(null);
  const [previousLevel, setPreviousLevel] = useState<number>(0);
  
  // Content state
  const [recentArticles, setRecentArticles] = useState<any[]>([]);
  const [dailyTip, setDailyTip] = useState<any>(null);
  const [showTipModal, setShowTipModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadKidFriendlyContent();
    loadDailyTip();
    if (childProfile?.id) {
      loadGamificationData();
      // Refresh gamification data every 30 seconds
      const interval = setInterval(() => {
        loadGamificationData();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [childProfile?.id]);

  const loadKidFriendlyContent = async () => {
    try {
      const now = new Date().toISOString();
      // Load articles tagged for kids (ages 8-16)
      const { data, error } = await supabase
        .from('learn_articles')
        .select('*')
        .eq('status', 'published')
        .or(`published_at.is.null,published_at.lte.${now}`)
        .contains('tags', ['Ages 8-12'])
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) throw error;
      setRecentArticles(data || []);
    } catch (error) {
      console.error('Error loading articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDailyTip = async () => {
    try {
      // For now, fetch directly from Supabase instead of API route
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('daily_tips')
        .select('*')
        .eq('tip_date', today)
        .eq('is_active', true)
        .single();

      if (data && !error) {
        setDailyTip(data);
      } else {
        // Fallback to most recent tip
        const { data: fallback } = await supabase
          .from('daily_tips')
          .select('*')
          .eq('is_active', true)
          .order('tip_date', { ascending: false })
          .limit(1)
          .single();
        
        if (fallback) {
          setDailyTip(fallback);
        } else {
          // Hardcoded fallback if no tips in database yet
          setDailyTip({
            id: 'fallback',
            title: 'Always wear sunscreen!',
            content: 'Even on cloudy days, UV rays can damage your skin. Apply sunscreen every morning as part of your routine.',
            category: 'sunscreen',
          });
        }
      }
    } catch (error) {
      console.error('Error loading daily tip:', error);
      // Show fallback tip on error
      setDailyTip({
        id: 'fallback',
        title: 'Always wear sunscreen!',
        content: 'Even on cloudy days, UV rays can damage your skin. Apply sunscreen every morning as part of your routine.',
        category: 'sunscreen',
      });
    }
  };

  const loadGamificationData = async () => {
    if (!childProfile?.id) return;

    try {
      // Load user points and level
      const points = await getUserPoints(childProfile.id);
      if (points) {
        // Check for level up
        if (previousLevel > 0 && points.level > previousLevel) {
          setShowLevelUpModal(true);
        }
        setPreviousLevel(points.level);
        setUserPoints(points);
      }

      // Load recent achievements
      const achievements = await getUserAchievements(childProfile.id);
      
      // Check for new badges
      if (achievements.length > userAchievements.length) {
        const newBadge = achievements[0]; // Most recent
        setUnlockedBadge({
          icon: newBadge.achievement.icon,
          title: newBadge.achievement.title,
          description: newBadge.achievement.description,
          points: newBadge.achievement.points,
        });
        setShowBadgeModal(true);
      }
      
      setUserAchievements(achievements.slice(0, 3)); // Show top 3

      // Load recent activity
      const activity = await getRecentActivity(childProfile.id, 5);
      setRecentActivity(activity);

      // Load streaks
      const userStreaks = await getUserStreaks(childProfile.id);
      setStreaks(userStreaks);
    } catch (error) {
      console.error('Error loading gamification data:', error);
    }
  };

  const handleTipLearnMore = async () => {
    setShowTipModal(true);
    
    // Award points for engaging with the daily tip
    if (childProfile?.id && dailyTip?.id) {
      const { trackLearningProgress } = await import('../../../src/services/gamificationService');
      await trackLearningProgress(
        childProfile.id,
        'tip',
        dailyTip.id,
        dailyTip.title,
        true
      );
      
      // Reload gamification data to show updated points
      loadGamificationData();
    }
  };

  return (
    <>
      <ScrollView style={globalStyles.scrollContainer}>
      {/* Page Header */}
      <PageHeader
        title="Learn"
        subtitle="Become a skincare expert! ✨"
        showAvatar={true}
      />

        {/* Compact Stats Band */}
        {childProfile?.id && (
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
        )}

        {/* Categories */}
        <View style={styles.categoriesSection}>
          {LEARN_CATEGORIES.map((category) => {
            const Icon = category.icon;
            const progress = category.completed && category.total 
              ? (category.completed / category.total) * 100 
              : 0;

            return (
              <TouchableOpacity
                key={category.id}
                style={styles.categoryCard}
                onPress={() => router.push(category.route as any)}
              >
                <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
                  <Icon size={28} color={colors.white} strokeWidth={2.5} />
                </View>

                <View style={styles.categoryContent}>
                  <Text style={styles.categoryTitle}>{category.title}</Text>
                  <Text style={styles.categoryDescription}>{category.description}</Text>

                  {category.completed !== undefined && category.total !== undefined && (
                    <View style={styles.progressContainer}>
                      <View style={styles.progressBar}>
                        <View 
                          style={[
                            styles.progressFill, 
                            { width: `${progress}%`, backgroundColor: category.color }
                          ]} 
                        />
                      </View>
                      <Text style={styles.progressText}>
                        {category.completed}/{category.total} completed
                      </Text>
                    </View>
                  )}
                </View>

                <ChevronRight size={24} color={colors.charcoal} style={{ opacity: 0.3 }} />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Recent Badges */}
        {userAchievements.length > 0 && (
          <View style={styles.badgesSection}>
            <Text style={styles.sectionTitle}>🏆 Recent Badges</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.badgesScroll}
            >
              {userAchievements.map((userAchievement) => (
                <TouchableOpacity 
                  key={userAchievement.id} 
                  style={styles.badgeCard}
                  onPress={() => router.push('/(child)/learn/stats')}
                >
                  <View style={styles.badgeIconContainer}>
                    <BadgeIcon
                      type={userAchievement.achievement.icon as any}
                      size={60}
                      primaryColor={getAchievementRarity(userAchievement.achievement.points) === 'legendary' ? '#FCD34D' : 
                                   getAchievementRarity(userAchievement.achievement.points) === 'epic' ? '#F472B6' :
                                   getAchievementRarity(userAchievement.achievement.points) === 'rare' ? '#60A5FA' : '#FFD700'}
                      secondaryColor={getAchievementRarity(userAchievement.achievement.points) === 'legendary' ? '#F59E0B' :
                                     getAchievementRarity(userAchievement.achievement.points) === 'epic' ? '#EC4899' :
                                     getAchievementRarity(userAchievement.achievement.points) === 'rare' ? '#3B82F6' : '#FFA500'}
                      backgroundColor={getAchievementRarity(userAchievement.achievement.points) === 'legendary' ? '#D97706' :
                                      getAchievementRarity(userAchievement.achievement.points) === 'epic' ? '#DB2777' :
                                      getAchievementRarity(userAchievement.achievement.points) === 'rare' ? '#2563EB' : '#4A90E2'}
                    />
                  </View>
                  <Text style={styles.badgeTitle} numberOfLines={2}>
                    {userAchievement.achievement.title}
                  </Text>
                  <Text style={styles.badgePoints}>
                    +{userAchievement.achievement.points} pts
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Streaks Section */}
        {streaks.length > 0 && (
          <View style={styles.streaksSection}>
            <Text style={styles.sectionTitle}>🔥 Your Streaks</Text>
            {streaks.map((streak) => (
              <View key={streak.streak_type} style={styles.streakCardWrapper}>
                <StreakCard
                  currentStreak={streak.current_streak}
                  longestStreak={streak.longest_streak}
                  streakType={streak.streak_type as 'daily' | 'learning'}
                  lastActivityDate={streak.last_activity_date}
                />
              </View>
            ))}
          </View>
        )}

        {/* Tip of the Day - Purple Panel */}
        {dailyTip && (
          <View style={styles.tipOfDaySection}>
            <View style={styles.tipOfDayCard}>
              <View style={styles.tipOfDayHeader}>
                <Text style={styles.tipOfDayEmoji}>💡</Text>
                <Text style={styles.tipOfDayLabel}>Tip of the Day</Text>
              </View>
              
              <Text style={styles.tipOfDayTitle}>{dailyTip.title}</Text>
              <Text style={styles.tipOfDayContent}>{dailyTip.content}</Text>
              <TouchableOpacity 
                style={styles.tipOfDayButton}
                onPress={handleTipLearnMore}
              >
                <Text style={styles.tipOfDayButtonText}>Learn More</Text>
                <ChevronRight size={16} color={colors.white} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Recent Activity */}
        {recentActivity.length > 0 && (
          <View style={styles.activitySection}>
            <Text style={styles.sectionTitle}>🌟 Recent Activity</Text>
            <View style={styles.activityCard}>
              {recentActivity.map((activity, index) => {
                // Assign colors based on activity type
                const activityColors: Record<string, string> = {
                  routine_completed: colors.mint,
                  freshie_taken: colors.purple,
                  article_read: '#F59E0B',
                  quiz_completed: colors.mint,
                  badge_earned: '#EF4444',
                  streak_milestone: colors.mint,
                };
                const dotColor = activityColors[activity.activity_type] || colors.charcoal;

                return (
                  <View key={activity.id} style={styles.activityItem}>
                    <View style={[styles.activityDot, { backgroundColor: dotColor }]} />
                    <Text style={styles.activityText} numberOfLines={1}>
                      {activity.title}
                    </Text>
                    {activity.points_earned > 0 && (
                      <Text style={styles.activityPoints}>+{activity.points_earned} pts</Text>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Tip Detail Modal */}
      <Modal
        visible={showTipModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTipModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity 
              style={styles.modalClose}
              onPress={() => setShowTipModal(false)}
            >
              <X size={24} color={colors.charcoal} />
            </TouchableOpacity>

            <Text style={styles.modalEmoji}>💡</Text>
            <Text style={styles.modalTitle}>{dailyTip?.title}</Text>
            
            {dailyTip?.extended_content && (
              <Text style={styles.modalExtendedContent}>
                {dailyTip.extended_content}
              </Text>
            )}

            {dailyTip?.fun_fact && (
              <View style={styles.funFactBox}>
                <Text style={styles.funFactLabel}>✨ Fun Fact</Text>
                <Text style={styles.funFactText}>{dailyTip.fun_fact}</Text>
              </View>
            )}

            {dailyTip?.action_steps && dailyTip.action_steps.length > 0 && (
              <View style={styles.actionStepsBox}>
                <Text style={styles.actionStepsLabel}>🎯 Try This:</Text>
                {dailyTip.action_steps.map((step: string, index: number) => (
                  <View key={index} style={styles.actionStepItem}>
                    <Text style={styles.actionStepBullet}>•</Text>
                    <Text style={styles.actionStepText}>{step}</Text>
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity 
              style={styles.modalButton}
              onPress={() => setShowTipModal(false)}
            >
              <Text style={styles.modalButtonText}>Got it! ✨</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Badge Unlock Modal */}
      <BadgeUnlockModal
        visible={showBadgeModal}
        onClose={() => setShowBadgeModal(false)}
        badge={unlockedBadge}
      />

      {/* Level Up Modal */}
      <LevelUpModal
        visible={showLevelUpModal}
        onClose={() => setShowLevelUpModal(false)}
        level={userPoints?.level || 0}
        totalPoints={userPoints?.total_points || 0}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
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
  rewardsCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.mist,
    borderRadius: radii.xl,
    padding: spacing[5],
    marginBottom: spacing[4],
  },
  rewardsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  rewardsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.mint,
    letterSpacing: 0.5,
  },
  rewardsPoints: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.charcoal,
  },
  rewardsProgressContainer: {
    marginBottom: spacing[4],
  },
  rewardsProgressBar: {
    height: 8,
    backgroundColor: colors.mist,
    borderRadius: 4,
    marginBottom: spacing[2],
  },
  rewardsProgressFill: {
    height: '100%',
    backgroundColor: colors.mint,
    borderRadius: 4,
  },
  rewardsProgressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rewardsProgressText: {
    fontSize: 11,
    color: colors.charcoal,
    opacity: 0.6,
  },
  rewardsMessage: {
    fontSize: 13,
    color: colors.charcoal,
    opacity: 0.7,
    marginBottom: spacing[4],
  },
  viewRewardsButton: {
    backgroundColor: colors.charcoal,
    paddingVertical: spacing[3],
    borderRadius: radii.pill,
    alignItems: 'center',
  },
  viewRewardsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  streakSummaryCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.mist,
    borderRadius: radii.xl,
    padding: spacing[5],
    marginBottom: spacing[4],
  },
  streakSummaryHeader: {
    marginBottom: spacing[3],
  },
  streakSummaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.charcoal,
  },
  streakSummaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing[2],
  },
  streakSummaryLabel: {
    fontSize: 14,
    color: colors.charcoal,
    opacity: 0.7,
  },
  streakSummaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.purple,
  },
  achievementsSummaryCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.mist,
    borderRadius: radii.xl,
    padding: spacing[5],
  },
  achievementsSummaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.charcoal,
    marginBottom: spacing[3],
  },
  achievementsList: {
    gap: spacing[2],
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[2],
  },
  achievementIcon: {
    fontSize: 24,
  },
  achievementName: {
    fontSize: 14,
    color: colors.charcoal,
    flex: 1,
  },
  // Tip of the Day - Purple Panel
  tipOfDaySection: {
    paddingHorizontal: spacing[6],
    paddingTop: spacing[4],
    paddingBottom: spacing[4],
  },
  tipOfDayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  tipOfDayEmoji: {
    fontSize: 20,
    marginRight: spacing[2],
  },
  tipOfDayLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.purple,
  },
  tipOfDayCard: {
    backgroundColor: colors.purple + '10',
    borderRadius: radii.xl,
    padding: spacing[5],
    borderWidth: 1,
    borderColor: colors.purple + '30',
  },
  tipOfDayTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.charcoal,
    marginBottom: spacing[3],
  },
  tipOfDayContent: {
    fontSize: 14,
    color: colors.charcoal,
    lineHeight: 22,
    marginBottom: spacing[4],
    opacity: 0.8,
  },
  tipOfDayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.purple,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: radii.pill,
  },
  tipOfDayButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
    marginRight: spacing[1],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[4],
    backgroundColor: colors.black,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.white,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: colors.white,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: radii.pill,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  pointsText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.charcoal,
  },
  scrollContent: {
    flex: 1,
  },
  categoriesSection: {
    paddingHorizontal: spacing[6],
    paddingTop: spacing[4],
    gap: spacing[4],
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing[4],
    borderRadius: radii.xl,
    marginBottom: spacing[3],
    borderWidth: 1,
    borderColor: colors.mist,
  },
  categoryIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[4],
  },
  categoryContent: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.charcoal,
    marginBottom: spacing[1],
  },
  categoryDescription: {
    fontSize: 14,
    color: colors.charcoal,
    opacity: 0.7,
    marginBottom: spacing[2],
  },
  progressContainer: {
    gap: spacing[1],
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.mist,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: colors.charcoal,
    opacity: 0.6,
  },
  // Badges Section
  badgesSection: {
    paddingHorizontal: spacing[6],
    paddingTop: spacing[4],
  },
  badgesScroll: {
    paddingRight: spacing[6],
    gap: spacing[3],
  },
  badgeCard: {
    width: 120,
    backgroundColor: colors.white,
    padding: spacing[4],
    borderRadius: radii.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.mist,
    marginRight: spacing[3],
  },
  badgeIconContainer: {
    width: 60,
    height: 60,
    borderRadius: radii.full,
    backgroundColor: colors.mint + '10',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[3],
  },
  badgeIcon: {
    fontSize: 32,
  },
  badgeTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.charcoal,
    textAlign: 'center',
    marginBottom: spacing[2],
    minHeight: 36,
  },
  badgePoints: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.mint,
  },
  // Streaks Section
  streaksSection: {
    paddingHorizontal: spacing[6],
    paddingTop: spacing[4],
  },
  streakCardWrapper: {
    marginBottom: spacing[4],
  },
  featuredSection: {
    paddingHorizontal: spacing[6],
    paddingTop: spacing[4],
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.charcoal,
    marginBottom: spacing[3],
  },
  featuredCard: {
    backgroundColor: colors.cream,
    padding: spacing[5],
    borderRadius: radii.xl,
    borderLeftWidth: 4,
    borderLeftColor: colors.purple,
  },
  featuredTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.charcoal,
    marginBottom: spacing[2],
  },
  featuredText: {
    fontSize: 14,
    color: colors.charcoal,
    lineHeight: 22,
    marginBottom: spacing[3],
  },
  learnMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  learnMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.purple,
  },
  activitySection: {
    paddingHorizontal: spacing[6],
    paddingTop: spacing[4],
    paddingBottom: spacing[8],
  },
  activityCard: {
    backgroundColor: colors.white,
    padding: spacing[4],
    borderRadius: radii.xl,
    gap: spacing[3],
    borderWidth: 1,
    borderColor: colors.mist,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  activityText: {
    flex: 1,
    fontSize: 14,
    color: colors.charcoal,
  },
  activityPoints: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.purple,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radii.xxl,
    borderTopRightRadius: radii.xxl,
    padding: spacing[6],
    maxHeight: '90%',
  },
  modalClose: {
    position: 'absolute',
    top: spacing[4],
    right: spacing[4],
    zIndex: 1,
  },
  modalEmoji: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: spacing[3],
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.charcoal,
    textAlign: 'center',
    marginBottom: spacing[4],
  },
  modalExtendedContent: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.charcoal,
    marginBottom: spacing[5],
  },
  funFactBox: {
    backgroundColor: colors.mint + '20',
    borderRadius: radii.lg,
    padding: spacing[4],
    marginBottom: spacing[4],
    borderLeftWidth: 4,
    borderLeftColor: colors.mint,
  },
  funFactLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.mint,
    marginBottom: spacing[2],
  },
  funFactText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.charcoal,
  },
  actionStepsBox: {
    backgroundColor: colors.cream,
    borderRadius: radii.lg,
    padding: spacing[4],
    marginBottom: spacing[5],
  },
  actionStepsLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.charcoal,
    marginBottom: spacing[3],
  },
  actionStepItem: {
    flexDirection: 'row',
    marginBottom: spacing[2],
  },
  actionStepBullet: {
    fontSize: 16,
    color: colors.purple,
    marginRight: spacing[2],
    fontWeight: '700',
  },
  actionStepText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: colors.charcoal,
  },
  modalButton: {
    backgroundColor: colors.purple,
    borderRadius: radii.pill,
    paddingVertical: spacing[4],
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
});
